import Base, { onResultChange } from './base'
import { Message, ModelSettings } from '../../../config/types'
import { ApiError, BaseError } from './errors'
import * as atoms from '../../stores/atoms'
import { getDefaultStore } from 'jotai'
import * as defaults from '../../../config/defaults'
import * as settingActions from '@/stores/settingActions'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

export default class OpenAI extends Base {
    private client
    private model: string
    private temperature: number
    private topP: number
    private defaultPrompt: string

    constructor(settings: ModelSettings) {
        super()
        this.model = settings.openaiModel
        this.client = createOpenAI({
            apiKey: settings.openaiApiKey,
            baseURL: settings.openaiApiHost
        })
        this.temperature = settings.temperature
        this.topP = settings.topP

        const store = getDefaultStore()
        this.defaultPrompt = store.get(atoms.settingsAtom).defaultPrompt || defaults.getDefaultPrompt()

        const searchTag = settingActions.getSearchSwitch()
        if (searchTag) {
            this.setupTools()
        }
    }

    async callChatCompletion(
        messages: Message[],
        newMessage?: Message,
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        try {
            this.currentMessage = newMessage
            const processedMessages = this.processMessages(messages)
            let result = ''
            const { textStream } = await streamText({
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

        } catch (err: any) {
            if (err instanceof Error) {
                throw new ApiError('OpenAI API Error: ' + err.message)
            } else if (err.error) {
                throw new ApiError(`statusCode: ${err.error.statusCode} ${err.error.message}`)
            } else {
                throw new BaseError('Unknown Error' + JSON.stringify(err))
            }
        }
    }
}
