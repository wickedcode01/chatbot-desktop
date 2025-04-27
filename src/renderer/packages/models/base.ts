import { Message } from 'src/config/types'
import {
    ApiError,
    NetworkError,
    AIProviderNoImplementedPaintError,
    BaseError,
    AIProviderNoImplementedChatError,
} from './errors'
import { createParser } from 'eventsource-parser'
import { CoreMessage } from 'ai'
import { z } from 'zod'
import { performSearch, browse } from '../tools/index'
import * as sessionActions from '@/stores/sessionActions'

export default class Base {
    public name = 'Unknown'
    protected tool_list: Record<string, any> = {}
    protected maxToolCallCounts: number = 3
    protected currentMessage?: Message

    constructor() {}

    async callChatCompletion(
        messages: Message[],
        newMessage?: Message,
        signal?: AbortSignal,
        onResultChange?: onResultChange,
    ): Promise<string> {
        throw new AIProviderNoImplementedChatError(this.name)
    }

    protected processMessages(messages: Message[]): CoreMessage[] {
        return messages.map(msg => {
            if (msg.attachments && msg.attachments.length > 0) {
                const content = []

                // Add text content if exists
                if (msg.content) {
                    content.push({ type: 'text', text: msg.content })
                }

                // Add attachments
                msg.attachments.forEach(attachment => {
                    if (attachment.type === 'image') {
                        content.push({
                            type: 'image',
                            image: attachment.base64Data,
                        })
                    } else if (attachment.type === 'file' && attachment.media_type == 'application/pdf') {
                        content.push({
                            type: 'file',
                            mimeType: 'application/pdf',
                            data: attachment.base64Data
                        })
                    } else {
                        // For other files, append as text
                        content.push({
                            type: 'text',
                            text: `[File: ${attachment.name}]\n${attachment.base64Data}`
                        })
                    }
                })

                return {
                    ...msg,
                    content
                }
            }
            return msg
        }) as CoreMessage[]
    }

    protected setupTools() {
        this.tool_list = {
            search: {
                description: 'Search the internet for current information.',
                parameters: z.object({
                    query: z.string().describe('The search query'),
                    category: z.enum([
                        'company',
                        'research paper',
                        'news article',
                        'linkedin profile',
                        'github',
                        'tweet',
                        'movie',
                        'song',
                        'personal site',
                        'pdf',
                        'financial report'
                    ]).optional().describe('A data category to focus on'),
                    includeDomains: z.array(z.string()).optional()
                        .describe('List of domains to include in the search'),
                    excludeDomains: z.array(z.string()).optional()
                        .describe('List of domains to exclude in the search')
                }),
                execute: async (args: any) => {
                    const result = await performSearch(args)
                    const id = sessionActions.getCurrentSessionId();
                    if (this.currentMessage) {
                        const currentMessage: Message = this.currentMessage;
                        sessionActions.modifyMessage(id, { ...currentMessage, searchResults: { raw: result } })
                    }
                    return JSON.stringify(result)
                }
            },
            browse: {
                description: 'Browse webpage content by URL',
                parameters: z.object({
                    urls: z.array(z.string()).describe('Array of URLs to browse'),
                    includeHtmlTags: z.boolean().optional()
                        .describe('Whether to return HTML tags')
                }),
                execute: async (args: any) => {
                    const result = await browse(args.urls, args)
                    return JSON.stringify(result)
                }
            }
        }
    }

    async chat(
        messages: Message[],
        newMessage?:Message,
        onResultUpdated?: (data: { text: string; cancel(): void }) => void,
        
    ): Promise<string> {
        messages = await this.preprocessMessage(messages)
        return await this._chat(messages, newMessage, onResultUpdated)
    }

    protected async _chat(
        messages: Message[],
        newMessage?:Message,
        onResultUpdated?: (data: { text: string; cancel(): void }) => void,

    ): Promise<string> {
        let canceled = false
        const controller = new AbortController()
        const stop = () => {
            canceled = true
            controller.abort()
        }
        let result = ''
        try {
            let onResultChange: onResultChange | undefined = undefined
            if (onResultUpdated) {
                onResultUpdated({ text: result, cancel: stop })
                onResultChange = (newResult: string) => {
                    result = newResult
                    onResultUpdated({ text: result, cancel: stop })
                }
            }
            result = await this.callChatCompletion(messages, newMessage, controller.signal, onResultChange)
        } catch (error) {
            if (canceled) {
                return result
            }
            throw error
        }
        return result
    }

    async preprocessMessage(messages: Message[]): Promise<Message[]> {
        return messages
    }

    async handleSSE(response: Response, onMessage: (message: string) => void) {
        if (!response.ok) {
            const errJson = await response.json().catch(() => null)
            throw new ApiError(errJson ? JSON.stringify(errJson) : `${response.status} ${response.statusText}`)
        }
        if (!response.body) {
            throw new Error('No response body')
        }
        const parser = createParser((event) => {
            if (event.type === 'event') {
                onMessage(event.data)
            }
        })
        for await (const chunk of this.iterableStreamAsync(response.body)) {
            const str = new TextDecoder().decode(chunk)
            parser.feed(str)
        }
    }

    async handleNdjson(response: Response, onMessage: (message: string) => void) {
        if (!response.ok) {
            const errJson = await response.json().catch(() => null)
            throw new ApiError(errJson ? JSON.stringify(errJson) : `${response.status} ${response.statusText}`)
        }
        if (!response.body) {
            throw new Error('No response body')
        }
        let buffer = ''
        for await (const chunk of this.iterableStreamAsync(response.body)) {
            let data = new TextDecoder().decode(chunk)
            buffer = buffer + data
            let lines = buffer.split('\n')
            if (lines.length <= 1) {
                continue
            }
            buffer = lines[lines.length - 1]
            lines = lines.slice(0, -1)
            for (const line of lines) {
                if (line.trim() !== '') {
                    onMessage(line)
                }
            }
        }
    }

    async *iterableStreamAsync(stream: ReadableStream): AsyncIterableIterator<Uint8Array> {
        const reader = stream.getReader()
        try {
            while (true) {
                const { value, done } = await reader.read()
                if (done) {
                    return
                } else {
                    yield value
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    async post(
        url: string,
        headers: Record<string, string>,
        body: Record<string, any>,
        signal?: AbortSignal,
        retry = 3
    ) {
        let requestError: ApiError | NetworkError | null = null
        for (let i = 0; i < retry + 1; i++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal,
                })
                if (!res.ok) {
                    const err = await res.text().catch((e) => null)
                    throw new ApiError(`Status Code ${res.status}, ${err}`)
                }
                return res
            } catch (e) {
                if (e instanceof BaseError) {
                    requestError = e
                } else {
                    const err = e as Error
                    const origin = new URL(url).origin
                    requestError = new NetworkError(err.message, origin)
                }
                await new Promise((resolve) => setTimeout(resolve, 500))
            }
        }
        if (requestError) {
            throw requestError
        } else {
            throw new Error('Unknown error')
        }
    }

    async get(url: string, headers: Record<string, string>, signal?: AbortSignal, retry = 3) {
        let requestError: ApiError | NetworkError | null = null
        for (let i = 0; i < retry + 1; i++) {
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    headers,
                    signal,
                })
                if (!res.ok) {
                    const err = await res.text().catch((e) => null)
                    throw new ApiError(`Status Code ${res.status}, ${err}`)
                }
                return res
            } catch (e) {
                if (e instanceof BaseError) {
                    requestError = e
                } else {
                    const err = e as Error
                    const origin = new URL(url).origin
                    requestError = new NetworkError(err.message, origin)
                }
            }
        }
        if (requestError) {
            throw requestError
        } else {
            throw new Error('Unknown error')
        }
    }
}

export type onResultChange = (result: string) => void
