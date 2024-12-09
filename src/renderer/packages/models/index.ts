import { Settings, Config, ModelProvider, SessionType } from '../../../config/types'

import Claude from './claude'
export function getModel(setting: Settings, config: Config) {
    switch (setting.aiProvider) {
        case ModelProvider.Claude:
            return new Claude(setting)
        default:
            throw new Error('Cannot find model with provider: ' + setting.aiProvider)
    }
}

export const aiProviderNameHash = {
    [ModelProvider.Claude]: 'Claude',
}

export const AIModelProviderMenuOptionList = [
    {
        value: ModelProvider.Claude,
        label: aiProviderNameHash[ModelProvider.Claude],
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
        default:
            return 'unknown'
    }
}
