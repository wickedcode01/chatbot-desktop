import { v4 as uuidv4 } from 'uuid'

export const MessageRoleEnum = {
    System: 'system',
    User: 'user',
    Assistant: 'assistant',
} as const

export type MessageRole = (typeof MessageRoleEnum)[keyof typeof MessageRoleEnum]

export interface Message {
    id: string

    role: MessageRole
    content: string
    name?: string
    attachments?: FileWithBase64[]

    cancel?: () => void
    generating?: boolean

    aiProvider?: ModelProvider
    model?: string

    errorCode?: number
    error?: string
    errorExtra?: {
        [key: string]: any
    }

    wordCount?: number
    tokenCount?: number
    tokensUsed?: number
    timestamp?: number
}

export type SettingWindowTab = 'ai' | 'display' | 'chat' | 'advanced'

export type SessionType = 'chat'

export function isChatSession(session: Session) {
    return session.type === 'chat' || !session.type
}

export interface Session {
    id: string
    type?: SessionType
    name: string
    picUrl?: string
    messages: Message[]
    copilotId?: string
    isPinned?: boolean
}

export function createMessage(role: MessageRole = MessageRoleEnum.User, content: string = ''): Message {
    return {
        id: uuidv4(),
        content: content,
        role: role,
        timestamp: new Date().getTime(),
    }
}

export enum ModelProvider {
    Claude = 'claude',
    OpenRouter = 'openrouter'
}

export interface ModelSettings {
    aiProvider: ModelProvider
    // google search API key
    googleAPIKey: string
    googleCx: string
    // exa search engine
    exaAPIKey: string
    // claude settings
    claudeApiKey: string
    claudeApiHost?: string
    claudeModel: string
    // openrouter
    openrouterKey: string
    openrouterModel: string
    // general config
    temperature: number
    topP: number
    openaiMaxContextMessageCount: number
    claudeModels:string[]
    openrouterModels:string[]
}

export interface Settings extends ModelSettings {
    showWordCount?: boolean
    showTokenCount?: boolean
    showTokenUsed?: boolean
    showModelName?: boolean
    showMessageTimestamp?: boolean
    // search switch
    searchSwitch?: boolean
    theme: Theme
    language: Language
    languageInited?: boolean
    fontSize: number
    spellCheck: boolean
    model: string
    defaultPrompt?: string

    proxy?: string

    allowReportingAndTracking: boolean

    userAvatarKey?: string

    enableMarkdownRendering: boolean

    autoGenerateTitle: boolean
}

export type Language = 'en' | 'zh-Hans'

export interface Config {
    uuid: string
}



export interface CopilotDetail {
    id: string
    name: string
    picUrl?: string
    prompt: string
    demoQuestion?: string
    demoAnswer?: string
    starred?: boolean
    usedCount: number
    shared?: boolean
}

export interface Toast {
    id: string
    content: string
}

export enum Theme {
    DarkMode,
    LightMode,
    FollowSystem,
}




export interface FileWithBase64 extends File {
    base64Data?: string;
    media_type: string
}