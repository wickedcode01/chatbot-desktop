import Base, { onResultChange } from './base'
import { Message, ModelSettings } from '../../../config/types'
import { ApiError } from './errors'
import Anthropic from '@anthropic-ai/sdk'
import { performSearch, browse } from '../tools/index'
import * as atoms from '../../stores/atoms'
import { getDefaultStore } from 'jotai'
import * as defaults from '../../../config/defaults'
import * as settingActions from '@/stores/settingActions'
import { searchPrompt } from '@/packages/prompts'
export const claudeModelConfigs = {
    'claude-3-opus-20240229': { maxTokens: 4096 },
    'claude-3-sonnet-20240229': { maxTokens: 4096 },
    'claude-3-haiku-20240307': { maxTokens: 4096 },
    'claude-3-5-haiku-latest': { maxTokens: 8192 },
    'claude-3-5-sonnet-latest': { maxTokens: 8192 },
} as const

export type Model = keyof typeof claudeModelConfigs
export const models = Object.keys(claudeModelConfigs).sort() as Model[]

export default class Claude extends Base {
    private client: Anthropic
    private model: string
    private temperature: number
    private maxTokens: number
    private defaultPrompt: string
    private tool_list: Anthropic.Tool[] = []
    private toolCallCount: number = 0 // tool call counts
    private maxToolCallCounts: number = 3 // maximum allow counts
    constructor(settings: ModelSettings) {
        super()
        this.client = new Anthropic({
            apiKey: settings.claudeApiKey,
            dangerouslyAllowBrowser: true,
            baseURL: settings.claudeApiHost || 'https://api.anthropic.com',
        })
        this.model = settings.claudeModel
        this.temperature = settings.temperature
        this.maxTokens = claudeModelConfigs[settings.claudeModel as Model].maxTokens
        const store = getDefaultStore()
        this.defaultPrompt = store.get(atoms.settingsAtom).defaultPrompt || defaults.getDefaultPrompt()
        const searchTag = settingActions.getSearchSwitch()
        if (searchTag) {
            this.tool_list = [
                {
                    name: 'search',
                    description: 'Search the internet for current information.',
                    input_schema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'The search query',
                            },
                            category: {
                                type: 'string',
                                enum: [ // Added enum to specify allowed values
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
                                ],
                                description: 'A data category to focus on, with higher comprehensivity and data cleanliness.'
                            },
                            includeDomains: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'List of domains to include in the search. If specified, results will only come from these domains.'
                            },
                            excludeDomains: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'List of domains to exclude in the search. If specified, results will not include any from these domains.'
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'browse',
                    description: 'Browse the website page by URL links. You also can use the tool to view the detail of search results',
                    input_schema: {
                        type: 'object',
                        properties: {
                            urls: {
                                type: 'array',
                                description: 'The array of urls that you want to browse',
                            },
                            includeHtmlTags: {
                                type: 'boolean',
                                description: 'Whether return HTML tags',
                            },
                        },
                        required: ['urls'],
                    },
                },
            ]
        }
    }

    async createMessage(model: string, messages: Message[], system: string, tools?: Anthropic.Tool[]) {
        // remap system prompt
        if (messages[0].role == 'system') {
            const system = messages[0].content
            this.defaultPrompt = system
            messages.shift()
        }
        let _messages:any = []
        messages.forEach(({ content, role, attachments = [] }: Message) => {
            let _content = []
            if (typeof content == 'string') {
                _content.push({ type: 'text', text: content })
            } else {
                _content.push(content[0])
            }
            attachments.forEach(({ type, media_type, base64Data }) => {
                _content.push({ type, source: { type: 'base64', media_type, data: base64Data?.split(',')[1] } })
            })


            _messages.push({ role, content: _content })


        })

        return await this.client.beta.messages.create({
            model,
            betas: ["pdfs-2024-09-25"],
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            messages: _messages,
            system,
            stream: true,
            tools,
        })
    }

    async callChatCompletion(
        messages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<any> {
        let result = ''
        try {
            if (this.toolCallCount > this.maxToolCallCounts) {
                throw Error('exceed the maxmiunm tool calls')
            }

            let pendingToolCalls: {
                toolCall: any
                input: string
            }[] = []
            let currentToolCall
            let currentInput = ''
            const stream = await this.createMessage(this.model, messages, this.defaultPrompt, this.tool_list)

            for await (const messageStreamEvent of stream) {
                switch (messageStreamEvent.type) {
                    case 'content_block_delta':
                        if (messageStreamEvent.delta.type === 'text_delta') {
                            result += messageStreamEvent.delta.text
                            onResultChange?.(result)
                        } else if (messageStreamEvent.delta.type === 'input_json_delta') {
                            if (currentToolCall) {
                                currentInput += messageStreamEvent.delta.partial_json
                            }
                        }
                        break
                    case 'content_block_start':
                        if (messageStreamEvent.content_block.type === 'tool_use') {
                            currentToolCall = messageStreamEvent.content_block
                            currentInput = ''
                        }
                        break
                    case 'content_block_stop':
                        if (currentToolCall && currentInput) {
                            pendingToolCalls.push({
                                toolCall: currentToolCall,
                                input: currentInput,
                            })
                            currentToolCall = null
                            currentInput = ''
                        }
                        break
                    case 'message_stop':
                        console.log(pendingToolCalls)
                        if (pendingToolCalls.length > 0) {
                            let tool_results: any = { role: 'user', content: [] }
                            let tool_calling: any = { role: 'assistant', content: [] }
                            for (const { toolCall, input } of pendingToolCalls) {
                                try {
                                    const inputObj = JSON.parse(input)
                                    const { name, id } = toolCall
                                    console.log('Tool input:', inputObj)
                                    this.toolCallCount += 1
                                    let toolResult = ''
                                    switch (name) {
                                        case 'search':
                                            toolResult = await performSearch(1, inputObj)
                                            break
                                        case 'browse':
                                            toolResult = await browse(inputObj.urls, inputObj)
                                            break
                                        default:
                                            console.log('Unsupported tool:', name)
                                            continue
                                    }
                                    tool_results.content.push({
                                        type: 'tool_result',
                                        tool_use_id: id,
                                        content: JSON.stringify(toolResult),
                                    })
                                    tool_calling.content.push({
                                        type: 'tool_use',
                                        id,
                                        name,
                                        input: inputObj,
                                    })

                                    break
                                } catch (error) {
                                    console.error('Error processing tool input:', error)
                                    throw error
                                }
                            } // 清理当前工具调用的状态
                            pendingToolCalls = []
                            // 更新消息数组
                            messages = [
                                ...messages.map(({ role, content }) => ({ role, content })),
                                tool_calling,
                                tool_results,
                                {
                                    role: 'user',
                                    content: searchPrompt['claude']
                                },
                            ]
                            // 递归调用以继续对话
                            return await this.callChatCompletion(messages, signal, onResultChange)
                        }
                }
            }

            return result
        } catch (err) {
            if (err instanceof Anthropic.APIError) {
                throw new ApiError(err.message)
            } else {
                throw err
            }
        }
    }
}
