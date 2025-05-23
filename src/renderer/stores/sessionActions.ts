import { getDefaultStore } from 'jotai'
import { Settings, createMessage, Message, Session, FileWithBase64 } from '../../config/types'
import * as atoms from './atoms'
import * as promptFormat from '../packages/prompts'
import * as Sentry from '@sentry/react'
import { v4 as uuidv4 } from 'uuid'
import * as defaults from '../../config/defaults'
import * as scrollActions from './scrollActions'
import { getModel, getModelDisplayName } from '@/packages/models'
import {
    AIProviderNoImplementedPaintError,
    NetworkError,
    ApiError,
    BaseError,
} from '@/packages/models/errors'
import platform from '../packages/platform'
import { estimateTokensFromMessages } from '@/packages/token'
import * as settingActions from './settingActions'
import storage from '../storage'

export function create(newSession: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsMetaAtom, (sessions) => [...sessions, newSession])
    store.set(atoms.sessionMessagesAtomFamily(newSession.id), [])
    switchCurrentSession(newSession.id)
}

export function modify(update: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsMetaAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === update.id) {
                return update
            }
            return s
        })
    )
}

export function modifyName(sessionId: string, name: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsMetaAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return { ...s, name, threadName: name }
            }
            return s
        })
    )
}

export function createEmpty(type: 'chat') {
    switch (type) {
        case 'chat':
            return create(initEmptyChatSession())
        default:
            throw new Error(`Unknown session type: ${type}`)
    }
}

export function switchCurrentSession(sessionId: string) {
    const store = getDefaultStore()
    store.set(atoms.currentSessionIdAtom, sessionId)
}

export function remove(session: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsMetaAtom, (sessions) => sessions.filter((s) => s.id !== session.id))
    // 彻底删除本地存储的messages key
    storage.removeItem(`messages-${session.id}`)
}

export function clear(sessionId: string) {
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    // 只保留系统消息
    const systemMessages = session.messages.filter((m) => m.role === 'system')
    const store = getDefaultStore()
    store.set(atoms.sessionMessagesAtomFamily(sessionId), systemMessages)
}

export async function copy(source: Session) {
    const store = getDefaultStore()
    const newSession = { ...source }
    newSession.id = uuidv4()
    store.set(atoms.sessionsMetaAtom, (sessions) => {
        let originIndex = sessions.findIndex((s) => s.id === source.id)
        if (originIndex < 0) {
            originIndex = 0
        }
        const newSessions = [...sessions]
        newSessions.splice(originIndex + 1, 0, newSession)
        return newSessions
    })
}

export function getSession(sessionId: string) {
    const store = getDefaultStore()
    const sessions = store.get(atoms.sessionsMetaAtom)
    return sessions.find((s) => s.id === sessionId)
}

export function insertMessage(sessionId: string, msg: Message) {
    const store = getDefaultStore()
    store.set(atoms.sessionMessagesAtomFamily(sessionId), (messages) => [...messages, msg])
}

export function modifyMessage(sessionId: string, updated: Message, refreshCounting?: boolean) {
    const store = getDefaultStore()
    store.set(atoms.sessionMessagesAtomFamily(sessionId), (messages) => 
        messages.map((m) => m.id === updated.id ? updated : m)
    )
}

export async function submitNewUserMessage(params: {
    currentSessionId: string
    newUserMsg: Message
    needGenerating: boolean
}) {
    const { currentSessionId, newUserMsg, needGenerating } = params
    insertMessage(currentSessionId, newUserMsg)
    let newAssistantMsg = createMessage('assistant', '')
    if (needGenerating) {
        newAssistantMsg.generating = true
        insertMessage(currentSessionId, newAssistantMsg)
        setTimeout(() => {
            scrollActions.scrollToBottom(true)
        }, 0);

        return generate(currentSessionId, newAssistantMsg)
    }
}

//  the function only run once when message is updating
export async function generate(sessionId: string, targetMsg: Message) {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const configs = await platform.getConfig()
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    const placeholder = '...'
    targetMsg = {
        ...targetMsg,
        content: placeholder,
        cancel: undefined,
        aiProvider: settings.aiProvider,
        model: getModelDisplayName(settings, session.type || 'chat'),
        generating: true,
        errorCode: undefined,
        error: undefined,
        errorExtra: undefined,
    }
    modifyMessage(sessionId, targetMsg)

    // 始终用最新的消息 atom
    let messages = store.get(atoms.sessionMessagesAtomFamily(sessionId))
    let targetMsgIx = messages.findIndex((m) => m.id === targetMsg.id)

    try {
        const model = getModel(settings, configs)
        switch (session.type) {
            case 'chat':
            case undefined:
                const promptMsgs = genMessageContext(settings, messages.slice(0, targetMsgIx))

                // 减少对象创建和避免重复throttle
                let contentCache = '';
                const modifyMessageCallback = ({ text, cancel }: { text: string; cancel: () => void }) => {
                    // 只有内容真正变化时才更新状态
                    if (text !== contentCache) {
                        contentCache = text;
                        targetMsg = { ...targetMsg, content: text, cancel }
                        modifyMessage(sessionId, targetMsg)
                    }
                }

                // 直接使用回调，base.ts中已经有throttle了
                await model.chat(promptMsgs, targetMsg, modifyMessageCallback)

                targetMsg = {
                    ...targetMsg,

                    generating: false,
                    cancel: undefined,
                    tokensUsed: estimateTokensFromMessages([...promptMsgs, targetMsg]),
                }
                modifyMessage(sessionId, targetMsg, true)
                break
            default:
                throw new Error(`Unknown session type: ${session.type}, generate failed`)
        }
    } catch (err: any) {
        if (!(err instanceof Error)) {
            err = new Error(`${err}`)
        }
        if (
            !(
                err instanceof ApiError ||
                err instanceof NetworkError ||
                err instanceof AIProviderNoImplementedPaintError
            )
        ) {
            Sentry.captureException(err) // unexpected error should be reported
        }
        let errorCode: number | undefined = undefined
        if (err instanceof BaseError) {
            errorCode = err.code
        }
        targetMsg = {
            ...targetMsg,
            generating: false,
            cancel: undefined,
            content: targetMsg.content === placeholder ? '' : targetMsg.content,
            errorCode,
            error: `${err.message}`,
            errorExtra: {
                aiProvider: settings.aiProvider,
                host: err['host'],
            },
        }
        modifyMessage(sessionId, targetMsg, true)
    }
}

async function _generateName(sessionId: string, modifyName: (sessionId: string, name: string) => void) {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    const configs = await platform.getConfig()
    try {
        const model = getModel(settings, configs)
        const messages = store.get(atoms.sessionMessagesAtomFamily(sessionId))
        let name = await model.chat(
            promptFormat.nameConversation(
                messages.slice(0, 4),
                settings.language
            )
        )
        name = name.replace(/['"""]/g, '')
        // name = name.slice(0, 50)
        modifyName(session.id, name)
    } catch (e: any) {
        if (!(e instanceof ApiError || e instanceof NetworkError)) {
            Sentry.captureException(e) // unexpected error should be reported
        }
    }
}

export async function generateName(sessionId: string) {
    const autoGenerateTitle = settingActions.getAutoGenerateTitle()
    if (autoGenerateTitle) return _generateName(sessionId, modifyName)
}

function genMessageContext(settings: Settings, msgs: Message[]) {
    const { openaiMaxContextMessageCount } = settings
    if (msgs.length === 0) {
        throw new Error('No messages to replay')
    }
    const head = msgs[0].role === 'system' ? msgs[0] : undefined
    if (head) {
        msgs = msgs.slice(1)
    }
    let totalLen = head ? estimateTokensFromMessages([head]) : 0
    let prompts: Message[] = []
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        if (msg.error || msg.errorCode) {
            continue
        }
        const size = estimateTokensFromMessages([msg]) + 20 // 20 is a rough estimation of the overhead of the prompt

        if (openaiMaxContextMessageCount <= 20 && prompts.length >= openaiMaxContextMessageCount + 1) {
            break
        }
        prompts = [msg, ...prompts]
        totalLen += size
    }
    if (head) {
        prompts = [head, ...prompts]
    }
    return prompts
}

export function initEmptyChatSession(): Session {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const provider = settings.aiProvider
    const isgenTitle = settings.autoGenerateTitle
    let messages: Message[] = []
    return {
        id: uuidv4(),
        name: isgenTitle ? 'Untitled' : new Date().toLocaleDateString(),
        type: 'chat',
        messages,
    }
}

export function getSessions() {
    const store = getDefaultStore()
    return store.get(atoms.sessionsMetaAtom)
}

export function getSortedSessions() {
    const store = getDefaultStore()
    return store.get(atoms.sortedSessionsAtom)
}

export function getCurrentSession() {
    const store = getDefaultStore()
    return store.get(atoms.currentSessionAtom)
}

export function getCurrentMessages() {
    const store = getDefaultStore()
    return store.get(atoms.currentMessageListAtom)
}

export function getCurrentSessionId() {
    const store = getDefaultStore()
    return store.get(atoms.currentSessionIdAtom)
}

export function getMessageById(id: string) {
    const store = getDefaultStore()
    return store.get(atoms.currentMessageListAtom).find(i => i.id = id)
}

export function deleteMessageinCurrentSession(id: string) {
    const store = getDefaultStore()
    const currentList = store.get(atoms.currentMessageListAtom)
    const newMessages = currentList.filter(i=>i.id!==id)
    console.log('delete',id)
    store.set(atoms.currentMessageListAtom,newMessages)
}
