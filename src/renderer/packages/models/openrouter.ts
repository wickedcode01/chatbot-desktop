import { ApiError, BaseError } from './errors'
import Base, { onResultChange } from './base'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText, CoreMessage } from 'ai'
import { Message, ModelSettings } from '../../../config/types'
import * as atoms from '../../stores/atoms'
import { getDefaultStore } from 'jotai'
import * as defaults from '../../../config/defaults'
import * as settingActions from '@/stores/settingActions'

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
    private message: Message | undefined

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
            this.setupTools()
        }
    }

    async callChatCompletion(
        messages: Message[],
        newMessage: Message,
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        try {
            this.message = newMessage
            this.currentMessage = newMessage
            const processedMessages = this.processMessages(messages)
            const { textStream, steps, response } = await streamText({
                model: this.client(this.options.model),
                messages: processedMessages,
                temperature: this.options.temperature,
                topP: this.options.topP,
                tools: Object.keys(this.tool_list).length > 0 ? this.tool_list : undefined,
                maxSteps: this.maxToolCallCounts,
                onError: (err) => { throw err },
                onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
                    if (toolResults) {
                        toolResults.forEach(result => {
                            // console.log(result)
                        })
                    }
                },
            })

            let result = ''
            for await (const chunk of textStream) {
                result += chunk
                if (onResultChange) {
                    onResultChange(result)
                }
            }
            return result

        } catch (err: any) {
            if (err instanceof Error) {
                throw new ApiError('OpenRouter API Error: ' + err.message)
            } else if (err.error) {
                err = err.error
                throw new ApiError(`statusCode: ${err.statusCode} message: ${err.message || err.responseBody}`)
            } else {
                throw new BaseError('Unknown Error' + JSON.stringify(err))
            }
        }
    }
}
