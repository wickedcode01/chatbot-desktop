import { useEffect, useRef } from 'react'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { debounce } from 'lodash'

interface Props {}

export default function MessageList(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const [currentMessageList, setMessages] = useAtom(atoms.currentMessageListAtom)
    const ref = useRef<HTMLDivElement | null>(null)
    const scrollPositionRef = useRef<{ [key: string]: number }>({})
    const [, setMessageListRef] = useAtom(atoms.messageListRefAtom)
    useEffect(() => {
        setMessageListRef(ref)
    }, [ref])
    useEffect(() => {
        if (ref.current && scrollPositionRef.current[currentSession.id] !== undefined) {
            // recover the scroll position
            ref.current.scrollTop = scrollPositionRef.current[currentSession.id]
        } else if (ref.current) {
            // if memory value is null, scroll to bottom
            ref.current.scrollTop = ref.current.scrollHeight
        }
    }, [currentSession.id])

    const handleScroll = debounce(() => {
        if (ref.current) {
            // record the scroll position
            scrollPositionRef.current[currentSession.id] = ref.current.scrollTop
        }
    }, 500)

    return (
        <div className="overflow-y-auto w-full h-full pr-0 pl-0" ref={ref} onScroll={handleScroll}>
            {currentMessageList.map((msg, index) => (
                <Message
                    id={msg.id}
                    key={'msg-' + msg.id}
                    msg={msg}
                    sessionId={currentSession.id}
                    sessionType={currentSession.type || 'chat'}
                    className={index === 0 ? 'pt-4' : ''}
                    collapseThreshold={msg.role === 'system' ? 150 : undefined}
                    onDelete={(id: string) => {
                        setMessages(currentMessageList.filter((i) => i.id !== id))
                    }}
                />
            ))}
        </div>
    )
}
