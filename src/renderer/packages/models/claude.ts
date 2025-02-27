import Base, { onResultChange } from './base'
import { Message, ModelSettings } from '../../../config/types'
import { ApiError, BaseError } from './errors'
import { performSearch, browse } from '../tools/index'
import * as atoms from '../../stores/atoms'
import { getDefaultStore } from 'jotai'
import * as defaults from '../../../config/defaults'
import * as settingActions from '@/stores/settingActions'
import { searchPrompt } from '@/packages/prompts'
import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, CoreMessage } from 'ai'

import { z } from 'zod'


export default class Claude extends Base {
    private client
    private model: string
    private temperature: number
    private topP: number
    private defaultPrompt: string
    private tool_list = {}
    private maxToolCallCounts: number = 3

    constructor(settings: ModelSettings) {
        super()
        this.model = settings.claudeModel
        this.client = createAnthropic({
            apiKey: settings.claudeApiKey,
            baseURL: settings.claudeApiHost
        })
        this.temperature = settings.temperature
        this.topP = settings.topP

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
                        const result = await performSearch(args)
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
        newMessage?: Message,
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
                        } else if (attachment.type === 'file' && attachment.media_type == 'application/pdf') {
                            // no test
                            // todo 
                            content.push({
                                type: 'file',
                                mimeType: 'application/pdf',
                                data: attachment.base64Data
                            })
                        }
                        else {
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
            let result = ''

            const { textStream, steps } = await streamText({
                model: this.client(this.model),
                messages: processedMessages,
                temperature: this.temperature,
                topP: this.topP,
                tools: Object.keys(this.tool_list).length > 0 ? this.tool_list : undefined,
                maxSteps: this.maxToolCallCounts,
                onError: (err) => {
                    throw err
                }
            })


            for await (const chunk of textStream) {
                result += chunk
                if (onResultChange) {
                    onResultChange(result)
                }
            }


            return result

        } catch (err:any) {
            if (err instanceof Error) {
                throw new ApiError('Claude API Error: ' + err.message)
            }
            else if (err.error){
                throw new ApiError(`statusCode: ${err.error.statusCode} ${err.error.message}`)
            }else{
                throw new BaseError('Unknown Error'+JSON.stringify(err))
            }
        }
    }
}
