import { Settings, Config, ModelProvider, SessionType } from '../../../config/types'

import Claude from './claude'
import OpenRouter from './openrouter'

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
        default:
            throw new Error('Cannot find model with provider: ' + setting.aiProvider)
    }
}

export const aiProviderNameHash = {
    [ModelProvider.Claude]: 'Claude',
    [ModelProvider.OpenRouter]: 'OpenRouter',
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
    }
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
        default:
            return 'unknown'
    }
}
