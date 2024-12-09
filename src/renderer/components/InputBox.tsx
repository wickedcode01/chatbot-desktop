import React, { useRef, useState } from 'react'
import { Typography, useTheme } from '@mui/material'
import { SessionType, createMessage } from '../../config/types'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useSetAtom } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import { SendHorizontal, Settings2, TextSearch } from 'lucide-react'
import { clsx } from 'clsx'
import icon from '../static/icon.png'
import MiniButton from './MiniButton'
import _ from 'lodash'

export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

export default function InputBox(props: Props) {
    const theme = useTheme()
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const [settings,setSettings] = useAtom(atoms.settingsAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const inputRef = useRef<HTMLTextAreaElement | null>(null)

    const handleSubmit = (needGenerating = true) => {
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        sessionActions.submitNewUserMessage({
            currentSessionId: props.currentSessionId,
            newUserMsg: newMessage,
            needGenerating,
        })
        setMessageInput('')
    }



    const onMessageInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = event.target.value
        setMessageInput(input)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
            event.preventDefault()
            handleSubmit()
            return
        }
        if (event.keyCode === 13 && event.ctrlKey) {
            event.preventDefault()
            handleSubmit(false)
            return
        }
    }


    const handleToggleSearchEngine = () => {
        setSettings({ ...settings, searchSwitch:!settings.searchSwitch })
    }

    return (
        <div
            className="pl-2 pr-4"
            style={{
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: theme.palette.divider,
            }}
        >
            <div className='w-full mx-auto flex flex-col'>
                <div className="flex flex-row flex-nowrap justify-between py-1">
                    <div className="flex flex-row items-center">
                        <MiniButton
                            className="mr-2 hover:bg-transparent"
                            style={{ color: theme.palette.text.primary }}
                        >
                            <img className='w-5 h-5' src={icon} />
                        </MiniButton>
                        <MiniButton
                            className="mr-2"
                            style={{
                                color: settings.searchSwitch ? theme.palette.success.main : theme.palette.text.primary,
                            }}
                            tooltipTitle={
                                <div className="text-center inline-block">
                                    <span>{t('Toggle search funtion')}</span>
                                </div>
                            }
                            onClick={handleToggleSearchEngine}
                        >
                            <TextSearch size={22} strokeWidth={1} />
                        </MiniButton>
                        <MiniButton
                            className="mr-2"
                            style={{ color: theme.palette.text.primary }}
                            onClick={() => setChatConfigDialogSession(sessionActions.getCurrentSession())}
                            tooltipTitle={
                                <div className="text-center inline-block">
                                    <span>{t('Customize settings for the current conversation')}</span>
                                </div>
                            }
                            tooltipPlacement="top"
                        >
                            <Settings2 size="22" strokeWidth={1} />
                        </MiniButton>
                    </div>
                    <div className="flex flex-row items-center">
                        <MiniButton
                            className="w-8 ml-2"
                            style={{
                                color: theme.palette.getContrastText(theme.palette.primary.main),
                                backgroundColor: theme.palette.primary.main,
                            }}
                            tooltipTitle={
                                <Typography variant="caption">
                                    {t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                                </Typography>
                            }
                            tooltipPlacement="top"
                            onClick={() => handleSubmit()}
                        >
                            <SendHorizontal size="22" strokeWidth={1} />
                        </MiniButton>
                    </div>
                </div>
                <div className="w-full pl-1 pb-2">
                    <textarea
                        className={clsx(
                            'w-full',
                            'min-h-[107px]',
                            'overflow-y resize-none border-none outline-none',
                            'bg-transparent p-1'
                        )}
                        value={messageInput}
                        onChange={onMessageInput}
                        onKeyDown={onKeyDown}
                        ref={inputRef}
                        style={{
                            color: theme.palette.text.primary,
                            fontFamily: theme.typography.fontFamily,
                            fontSize: theme.typography.body1.fontSize,
                        }}
                        placeholder={t('Type your question here...') || ''}
                    />
                    <div className="flex flex-row items-center"></div>
                </div>
            </div>
        </div>
    )
}
