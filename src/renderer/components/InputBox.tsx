import React, { useRef, useState } from 'react'
import { Typography, useTheme, Snackbar, Alert } from '@mui/material'
import { SessionType, createMessage, FileWithBase64 } from '../../config/types'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useSetAtom } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import { SendHorizontal, Settings2, TextSearch, ImagePlus, Paperclip } from 'lucide-react'
import { clsx } from 'clsx'
import icon from '../static/icon.png'
import MiniButton from './MiniButton'
import MiniSelect from './MiniSelect';
import _ from 'lodash'
import { isImageFile, convertToBase64 } from '@/util'


export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes

export default function InputBox(props: Props) {
    const theme = useTheme()
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const [settings, setSettings] = useAtom(atoms.settingsAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const inputRef = useRef<HTMLTextAreaElement | null>(null)
    const [attachments, setAttachments] = useState<FileWithBase64[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'warning' | 'info' | 'success' }>({
        open: false,
        message: '',
        severity: 'info'
    })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)

    const showSnackbar = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'info') => {
        setSnackbar({ open: true, message, severity })
    }

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }))
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        const imageFiles = files.filter(file => file.type.startsWith('image/'))

        if (imageFiles.length === 0) return

        // Create a synthetic event to reuse the existing handleFileUpload function
        const syntheticEvent = {
            target: {
                files: imageFiles,
                accept: 'image/*'
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>

        await handleFileUpload(syntheticEvent)
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        const isImageUpload = event.target.accept.includes('image/')

        // Check file count limit
        if (attachments.length + files.length > (isImageUpload ? MAX_IMAGE_COUNT : MAX_FILE_COUNT)) {
            showSnackbar(t(isImageUpload
                ? `You can only upload up to ${MAX_IMAGE_COUNT} images`
                : `You can only upload up to ${MAX_FILE_COUNT} files`), 'warning')
            event.target.value = ''
            return
        }

        // Validate each file
        const validFiles = files.filter(file => {
            const maxSize = isImageUpload ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
            if (file.size > maxSize) {
                showSnackbar(t(`${file.name} exceeds the maximum size limit of ${maxSize / (1024 * 1024)}MB`), 'warning')
                return false
            }
            return true
        })
        const processedFiles: FileWithBase64[] = []

        for (const file of validFiles) {
            const maxSize = isImageUpload ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
            if (file.size > maxSize) {
                showSnackbar(t(`${file.name} exceeds the maximum size limit of ${maxSize / (1024 * 1024)}MB`), 'warning')
                continue
            }

            try {
                const base64Data = await convertToBase64(file)
                processedFiles.push({
                    name: file.name,
                    size: file.size,
                    base64Data,
                    type: isImageUpload ? 'image' : 'file',
                    media_type: file.type || 'application/octet-stream'
                } as FileWithBase64)
            } catch (error) {
                console.error(`Error converting ${file.name} to base64:`, error)
                showSnackbar(t(`Failed to process ${file.name}`), 'error')
            }
        }

        if (processedFiles.length > 0) {
            setAttachments(prev => [...prev, ...processedFiles])
        }
        event.target.value = ''
    }
 
    const handleSubmit = (needGenerating = true) => {
        if (messageInput.trim() === '') {
            return
        }

        const newMessage = createMessage('user', messageInput)
        newMessage.attachments = attachments
        sessionActions.submitNewUserMessage({
            currentSessionId: props.currentSessionId,
            newUserMsg: newMessage,
            needGenerating,
        })
        setMessageInput('')
        setAttachments([])
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
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
        setSettings({ ...settings, searchSwitch: !settings.searchSwitch })
    }
    const renderAttachmentPreview = (file: FileWithBase64, index: number) => {
        if (file.type == 'image') {
            return (
                <div key={`${file.name}-${index}`} className="relative group p-1 flex items-center">
                    <img
                        src={file.base64Data}
                        alt={file.name}
                        onLoad={() => console.log('Image loaded successfully')}
                        onError={(e) => console.error('Image failed to load:', e)}
                        className="w-8 h-8 object-cover rounded"
                    />
                    <button
                        className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-gray-500 text-white 
                                 flex items-center justify-center opacity-0 group-hover:opacity-100 
                                 transition-opacity"
                        onClick={() => removeAttachment(index)}
                    >
                        ×
                    </button>
                </div>
            )
        }

        return (
            <div key={`${file.name}-${index}`} className="relative group bg-gray-600 opacity-50 p-1 px-2 flex items-center">
                <span className="text-sm">{file.name}</span>
                <button
                    className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-gray-500 text-white 
                                 flex items-center justify-center opacity-0 group-hover:opacity-100 
                                 transition-opacity"
                    onClick={() => removeAttachment(index)}
                >
                    ×
                </button>
            </div>
        )
    }

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items) return

        const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
        if (imageItems.length === 0) return

        // Check if we can add more images
        if (attachments.length + imageItems.length > MAX_IMAGE_COUNT) {
            showSnackbar(t(`You can only upload up to ${MAX_IMAGE_COUNT} images`), 'warning')
            return
        }

        const processedFiles: FileWithBase64[] = []

        for (const item of imageItems) {
            const file = item.getAsFile()
            if (!file) continue

            // Check file size
            if (file.size > MAX_IMAGE_SIZE) {
                showSnackbar(t(`${file.name} exceeds the maximum size limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`), 'warning')
                continue
            }

            try {
                const base64Data = await convertToBase64(file)
                processedFiles.push({
                    name: file.name || 'pasted-image.png',
                    size: file.size,
                    base64Data,
                    type: 'image',
                    media_type: file.type || 'image/png'
                } as FileWithBase64)
            } catch (error) {
                console.error('Error processing pasted image:', error)
                showSnackbar(t('Failed to process pasted image'), 'error')
            }
        }

        if (processedFiles.length > 0) {
            setAttachments(prev => [...prev, ...processedFiles])
        }
    }

    return (
        <>
            <div
                className="pl-2 pr-4"
                style={{
                    borderTopWidth: '1px',
                    borderTopStyle: 'solid',
                    borderTopColor: theme.palette.divider,
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onPaste={handlePaste}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                            <Typography variant="h6" className="text-center">
                                {t('Drop images here to upload')}
                            </Typography>
                        </div>
                    </div>
                )}
                <div className="w-full h-1 cursor-ns-resize"
                    onMouseDown={(e) => {
                        const startY = e.clientY;
                        const startHeight = inputRef.current?.offsetHeight || 107;
                        const onMouseMove = (moveEvent: MouseEvent) => {
                            const newHeight = startHeight + (startY - moveEvent.clientY);
                            if (inputRef.current) {
                                inputRef.current.style.height = `${Math.max(107, newHeight)}px`;
                            }
                        };
                        const onMouseUp = () => {
                            window.removeEventListener('mousemove', onMouseMove);
                            window.removeEventListener('mouseup', onMouseUp);
                        };
                        window.addEventListener('mousemove', onMouseMove);
                        window.addEventListener('mouseup', onMouseUp);
                    }}
                    style={{
                        // backgroundColor: theme.palette.divider,
                        cursor: 'ns-resize'
                    }}
                />
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
                                onClick={() => imageInputRef.current?.click()}
                                tooltipTitle={t('Upload image')}
                            >

                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    className="hidden"
                                    multiple
                                />
                                <ImagePlus size={22} strokeWidth={1} />
                            </MiniButton>
                            <MiniButton
                                className="mr-2"
                                style={{ color: theme.palette.text.primary }}
                                onClick={() => fileInputRef.current?.click()}
                                tooltipTitle={t('Upload file')}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".txt,.pdf,.doc,.docx"
                                    className="hidden"
                                    multiple
                                />
                                <Paperclip size={22} strokeWidth={1} />
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
                            <MiniSelect />
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
                    {/* Show uploaded files preview */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2">
                            {attachments.map((file, index) => renderAttachmentPreview(file, index))}
                        </div>
                    )}
                    <div className="w-full pl-1 pb-2">
                        <textarea
                            className={clsx(
                                'w-full',
                                'min-h-[107px]',
                                'overflow-y-auto resize-none border-none outline-none',
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
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    )
}
