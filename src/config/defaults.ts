import { Theme, Config, Settings, ModelProvider, Session } from './types'
import { v4 as uuidv4 } from 'uuid'

export function settings(): Settings {
    return {
        aiProvider: ModelProvider.Claude,

        googleAPIKey: '',
        googleCx: '',
        claudeApiKey: '',
        claudeModel: '',
        openrouterKey: '',
        openrouterModel: '',
        exaAPIKey: '',
        model: '',
        temperature: 0.7,
        topP: 1,
        // openaiMaxTokens: 0,
        // openaiMaxContextTokens: 4000,
        openaiMaxContextMessageCount: 10,
        // maxContextSize: "4000",
        // maxTokens: "2048",


        showWordCount: true,
        showTokenCount: false,
        showTokenUsed: true,
        showModelName: true,
        showMessageTimestamp: false,
        userAvatarKey: '',
        theme: Theme.FollowSystem,
        language: 'en',
        fontSize: 12,
        spellCheck: true,

        defaultPrompt: getDefaultPrompt(),

        allowReportingAndTracking: true,

        enableMarkdownRendering: true,

        autoGenerateTitle: true,
        searchSwitch: false,
    }
}

export function newConfigs(): Config {
    return { uuid: uuidv4() }
}

export function getDefaultPrompt() {
    return 'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.'
}

export function sessions(): Session[] {
    return [{ id: uuidv4(), name: 'Untitled', messages: [], type: 'chat' }]
}
