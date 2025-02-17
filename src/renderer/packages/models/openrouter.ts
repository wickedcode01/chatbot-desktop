import { ApiError, BaseError } from './errors'
import Base, { onResultChange } from './base'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText, CoreMessage } from 'ai'
import { Message, ModelSettings } from '../../../config/types'
import { performSearch, browse } from '../tools/index'
import * as atoms from '../../stores/atoms'
import { getDefaultStore } from 'jotai'
import * as defaults from '../../../config/defaults'
import * as settingActions from '@/stores/settingActions'
import { searchPrompt } from '@/packages/prompts'
import { z } from 'zod'

interface Options {
    openrouterKey: string
    model: string
    temperature: number
    topP: number
}

export default class OpenRouter extends Base {
    public name = 'OpenRouter'
    private client
    public options: Options
    private defaultPrompt: string
    private tool_list = {}
    private maxToolCallCounts: number = 3

    constructor(options: Options) {
        super()
        this.options = options
        this.client = createOpenRouter({
            apiKey: options.openrouterKey,
        })

        const store = getDefaultStore()
        this.defaultPrompt = store.get(atoms.settingsAtom).defaultPrompt || defaults.getDefaultPrompt()

        const searchTag = settingActions.getSearchSwitch()
        if (searchTag) {
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
                        const result = await performSearch(1, args)
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
    }

    async callChatCompletion(
        messages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        try {

            // Process messages to handle attachments in the correct format
            const processedMessages = messages.map(msg => {
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
                                // optional
                                // mimeType:attachment.media_type
                            })
                        }
                        else if (attachment.type === 'file' && attachment.media_type == 'application/pdf') {
                            // no test
                            // todo ...
                            // base64 - encoded file:
                            // string with base - 64 encoded content
                            // data URL string, e.g.data: image / png; base64,...
                            // binary data:
                            // ArrayBuffer
                            // Uint8Array
                            // Buffer
                            // URL:
                            // http(s) URL string, e.g.https://example.com/some.pdf
                            // URL object, e.g.new URL('https://example.com/some.pdf')
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
            const { textStream, steps, response } = await streamText({
                model: this.client(this.options.model),
                messages: processedMessages,
                temperature: this.options.temperature,
                topP: this.options.topP,
                tools: Object.keys(this.tool_list).length > 0 ? this.tool_list : undefined,
                maxSteps: this.maxToolCallCounts  // 控制工具调用的最大次数
            })

            let result = ''
            // let currentMessages = [...messages]
            for await (const chunk of textStream) {
                result += chunk
                if (onResultChange) {
                    onResultChange(result)
                }
            }
            // Process each tool call and add results to messages
            // const toolcalls = await steps;
            // const allToolResults = toolcalls.flatMap(step => step.toolResults);
            // console.log(allToolResults);
            return result

        } catch (err) {
            if (err instanceof Error) {
                throw new ApiError('OpenRouter API Error: ' + err.message)
            } else {
                throw new BaseError(' Unknown Error')
            }
        }
    }
}

// Available models from OpenRouter
export const ModelConfigs = {
    'cognitivecomputations/dolphin3.0-r1-mistral-24b:free': { maxTokens: 33000 },
    'google/gemini-2.0-pro-exp-02-05:free': { maxTokens: 2000000 },
}
export const models = Object.keys(ModelConfigs).sort()