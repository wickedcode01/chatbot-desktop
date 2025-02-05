import React, { useEffect } from 'react'
import { Button, Dialog, DialogContent, DialogActions, DialogTitle, DialogContentText, TextField } from '@mui/material'
import { Session, createMessage } from '../../config/types'
import { useTranslation } from 'react-i18next'
import * as sessionActions from '../stores/sessionActions'
import * as atoms from '../stores/atoms'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/stores/atoms'
import { trackingEvent } from '@/packages/event'
import TemperatureSlider from '../components/TemperatureSlider'
import MaxContextMessageCountSlider from '../components/MaxContextMessageCountSlider'
import { Settings, Theme } from '@/../config/types'
interface Props {}

export default function ChatConfigWindow(props: Props) {
    const { t } = useTranslation()
    const [chatConfigDialogSession, setChatConfigDialogSession] = useAtom(atoms.chatConfigDialogAtom)
    const [modeleditingData, setmodelEditingData] = useAtom(settingsAtom);

    const [editingData, setEditingData] = React.useState<Session | null>(chatConfigDialogSession)
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setEditingData(null)
        } else {
            setEditingData({
                ...chatConfigDialogSession,
            })
        }
    }, [chatConfigDialogSession])

    const [systemPrompt, setSystemPrompt] = React.useState('')
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setSystemPrompt('')
        } else {
            const systemMessage = chatConfigDialogSession.messages.find((m) => m.role === 'system')
            setSystemPrompt(systemMessage?.content || '')
        }
    }, [chatConfigDialogSession])

    useEffect(() => {
        if (chatConfigDialogSession) {
            trackingEvent('chat_config_window', { event_category: 'screen_view' })
        }
    }, [chatConfigDialogSession])

    const onCancel = () => {
        setChatConfigDialogSession(null)
        setEditingData(null)
    }
    const onSave = () => {
        if (!chatConfigDialogSession || !editingData) {
            return
        }
        if (editingData.name === '') {
            editingData.name = chatConfigDialogSession.name
        }
        editingData.name = editingData.name.trim()
        if (systemPrompt === '') {
            editingData.messages = editingData.messages.filter((m) => m.role !== 'system')
        } else {
            const systemMessage = editingData.messages.find((m) => m.role === 'system')
            if (systemMessage) {
                systemMessage.content = systemPrompt.trim()
            } else {
                editingData.messages.unshift(createMessage('system', systemPrompt.trim()))
            }
        }
        sessionActions.modify(editingData)
        setChatConfigDialogSession(null)
    }

    if (!chatConfigDialogSession || !editingData) {
        return null
    }
    return (
        <Dialog open={!!chatConfigDialogSession} onClose={onCancel} fullWidth>
            <DialogTitle>{t('Conversation Settings')}</DialogTitle>
            <DialogContent>
                <DialogContentText></DialogContentText>
                <TextField
                    margin="dense"
                    label={t('name')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editingData.name}
                    onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                />
                <div className="mt-1">
                    <TextField
                        margin="dense"
                        label={t('Instruction (System Prompt)')}
                        placeholder={t('Copilot Prompt Demo') || ''}
                        fullWidth
                        variant="outlined"
                        multiline
                        minRows={2}
                        maxRows={8}
                        value={systemPrompt}
                        onChange={(event) => setSystemPrompt(event.target.value)}
                    />
                </div>
                <div className="mt-1">
                    <TemperatureSlider
                        value={modeleditingData.temperature}
                        onChange={(v) => setmodelEditingData({ ...modeleditingData, temperature: v })}
                    />
                    <MaxContextMessageCountSlider
                        value={modeleditingData.openaiMaxContextMessageCount}
                        onChange={(v) => setmodelEditingData({ ...modeleditingData, openaiMaxContextMessageCount: v })}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button onClick={onSave}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    )
}
