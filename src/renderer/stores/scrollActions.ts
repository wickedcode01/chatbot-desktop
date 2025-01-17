import { getDefaultStore } from 'jotai'
import * as atoms from './atoms'

export function scrollToBottom(force: boolean = false, behavior: 'auto' | 'smooth' = 'auto') {
    const store = getDefaultStore()
    const messageListRef = store.get(atoms.messageListRefAtom)
    if (messageListRef && messageListRef.current) {
        const scrollTop = messageListRef.current.scrollTop;
        const scrollHeight = messageListRef.current.scrollHeight;
        const clientHeight = messageListRef.current.clientHeight;
        const bottomOffset = scrollHeight - scrollTop - clientHeight;
        if (bottomOffset <= 100 || force) {
            messageListRef.current.scrollTo({
                top: scrollHeight,
                behavior,
            })
        }
    }
}
