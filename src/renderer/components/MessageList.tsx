import { useEffect, useRef, useState, useCallback } from 'react'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { throttle } from 'lodash'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { Button, Box, useTheme } from '@mui/material'
import * as scrollActions from '../stores/scrollActions'
import { deleteMessageinCurrentSession } from '../stores/sessionActions'
interface Props { }

export default function MessageList(props: Props) {
    const theme = useTheme()
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const [currentMessageList, setMessages] = useAtom(atoms.currentMessageListAtom)
    const ref = useRef<HTMLDivElement | null>(null)
    const scrollPositionRef = useRef<{ [key: string]: number }>({})
    const [, setMessageListRef] = useAtom(atoms.messageListRefAtom)
    const [showScrollButton, setShowScrollButton] = useState(false);
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
    const handleScrollToBottom = () => {
        scrollActions.scrollToBottom(true, 'smooth');
    };

    const handleScroll = throttle(() => {
        // Check if user is not at the bottom
        const checkScrollPosition = (messageListRef: React.MutableRefObject<HTMLDivElement | null>) => {
            if (messageListRef && messageListRef.current) {
                const scrollTop = messageListRef.current.scrollTop;
                const scrollHeight = messageListRef.current.scrollHeight;
                const clientHeight = messageListRef.current.clientHeight;
                const bottomOffset = scrollHeight - scrollTop - clientHeight;
                // If not at the bottom, show the scroll button
                setShowScrollButton(bottomOffset > 100);
            }
        };
        if (ref.current) {
            // record the scroll position
            scrollPositionRef.current[currentSession.id] = ref.current.scrollTop
            checkScrollPosition(ref)
        }
    }, 500)

    const handleDelete = useCallback(
        (id: string) => {
            deleteMessageinCurrentSession(id)
        },
        []
    )

    useEffect(() => {
        handleScroll();
    }, [currentMessageList]);

    return (
        <div className='overflow-y-auto w-full h-full relative'>
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
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {showScrollButton && (
                <Box sx={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                }}>
                    <Button
                        variant="contained"
                        onClick={handleScrollToBottom}
                        sx={{
                            minWidth: 'auto',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            padding: '8px',
                            opacity: 0.7,
                            backgroundColor: theme.palette.grey[800],
                            color: theme.palette.text.primary,
                            '&:hover': {
                                backgroundColor: theme.palette.grey[700],
                            },
                        }}
                    >
                        <ArrowDownwardIcon />
                    </Button>
                </Box>
            )}
        </div>

    )
}
