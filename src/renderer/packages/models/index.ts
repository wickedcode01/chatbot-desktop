import { Settings, Config, ModelProvider, SessionType } from '../../../config/types'

import Claude from './claude'
import OpenRouter from './openrouter'
import OpenAI from './openai'

export function getModel(setting: Settings, config: Config) {
    switch (setting.aiProvider) {
        case ModelProvider.Claude:
            return new Claude(setting)
        case ModelProvider.OpenRouter:
            return new OpenRouter({
                openrouterKey: setting.openrouterKey,
                model: setting.openrouterModel,
                temperature: setting.temperature,
                topP: setting.topP
            })
        case ModelProvider.OpenAI:
            return new OpenAI(setting)
        default:
            throw new Error('Cannot find model with provider: ' + setting.aiProvider)
    }
}

export const aiProviderNameHash = {
    [ModelProvider.Claude]: 'Claude',
    [ModelProvider.OpenRouter]: 'OpenRouter',
    [ModelProvider.OpenAI]: 'OpenAI',
}

export const AIModelProviderMenuOptionList = [
    {
        value: ModelProvider.Claude,
        label: aiProviderNameHash[ModelProvider.Claude],
        disabled: false,
    },
    {
        value: ModelProvider.OpenRouter,
        label: aiProviderNameHash[ModelProvider.OpenRouter],
        disabled: false,
    },
    {
        value: ModelProvider.OpenAI,
        label: aiProviderNameHash[ModelProvider.OpenAI],
        disabled: false,
    },
]

export function getModelDisplayName(settings: Settings, sessionType: SessionType): string {
    if (!settings) {
        return 'unknown'
    }
    switch (settings.aiProvider) {
        case ModelProvider.Claude:
            return `Claude (${settings.claudeModel})`
        case ModelProvider.OpenRouter:
            return `OpenRouter (${settings.openrouterModel})`
        case ModelProvider.OpenAI:
            return `OpenAI (${settings.openaiModel})`
        default:
            return 'unknown'
    }
}
