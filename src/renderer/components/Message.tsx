import { useEffect, useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import { Typography, Grid, useTheme, IconButton, Button } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

import { useTranslation } from 'react-i18next'
import { Message, SessionType, FileWithBase64 } from '../../config/types'
import { useAtomValue, useSetAtom } from 'jotai'
import {
    showMessageTimestampAtom,
    showModelNameAtom,
    showTokenCountAtom,
    showWordCountAtom,
    openSettingDialogAtom,
    enableMarkdownRenderingAtom,
} from '../stores/atoms'

import { currsentSessionPicUrlAtom, showTokenUsedAtom } from '../stores/atoms'

import Markdown from '@/components/Markdown'
import '../static/Block.css'
import MessageErrTips from './MessageErrTips'
import * as dateFns from 'date-fns'
import { clsx } from 'clsx'
import { estimateTokensFromMessages } from '@/packages/token'
import { countWord } from '@/packages/word-count'
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import SearchResult from './SearchResult'

export interface Props {
    id?: string
    sessionId: string
    sessionType: SessionType
    msg: Message
    className?: string
    collapseThreshold?: number
    hiddenButtonGroup?: boolean
    small?: boolean
    onDelete: Function
}

export default function Message(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()

    const showMessageTimestamp = useAtomValue(showMessageTimestampAtom)
    const showModelName = useAtomValue(showModelNameAtom)
    const showTokenCount = useAtomValue(showTokenCountAtom)
    const showWordCount = useAtomValue(showWordCountAtom)
    const showTokenUsed = useAtomValue(showTokenUsedAtom)
    const enableMarkdownRendering = useAtomValue(enableMarkdownRenderingAtom)
    const currentSessionPicUrl = useAtomValue(currsentSessionPicUrlAtom)
    const setOpenSettingWindow = useSetAtom(openSettingDialogAtom)

    const { msg, className, collapseThreshold, hiddenButtonGroup, small, onDelete } = props
    // Add these states
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<FileWithBase64 | null>(null);

    // Add these handlers
    const handleImageClick = (file: FileWithBase64) => {
        setSelectedImage(file);
        setIsImageOpen(true);
    };

    const handleCloseImage = () => {
        setIsImageOpen(false);
        setSelectedImage(null);
    };


    const handleDeleteMessage = () => {
        const id = msg.id
        onDelete(id)
    }

    const needCollapse =
        collapseThreshold &&
        JSON.stringify(msg.content).length > collapseThreshold &&
        JSON.stringify(msg.content).length - collapseThreshold > 50
    const [isCollapsed, setIsCollapsed] = useState(needCollapse)

    const ref = useRef<HTMLDivElement>(null)

    const tips: string[] = []
    if (props.sessionType === 'chat' || !props.sessionType) {
        if (showWordCount && !msg.generating) {
            tips.push(`word count: ${msg.wordCount !== undefined ? msg.wordCount : countWord(msg.content)}`)
        }
        if (showTokenCount && !msg.generating) {
            if (msg.tokenCount === undefined) {
                msg.tokenCount = estimateTokensFromMessages([msg])
            }
            tips.push(`token count: ${msg.tokenCount}`)
        }
        if (showModelName && props.msg.role === 'assistant') {
            tips.push(`model: ${props.msg.model || 'unknown'}`)
        }
    }

    if (showMessageTimestamp && msg.timestamp !== undefined) {
        let date = new Date(msg.timestamp)
        let messageTimestamp: string
        if (dateFns.isToday(date)) {
            messageTimestamp = dateFns.format(date, 'HH:mm')
        } else if (dateFns.isThisYear(date)) {
            messageTimestamp = dateFns.format(date, 'MM-dd HH:mm')
        } else {
            messageTimestamp = dateFns.format(date, 'yyyy-MM-dd HH:mm')
        }

        tips.push('time: ' + messageTimestamp)
    }
    useEffect(() => {


    }, [msg.content, msg.generating])

    let content = msg.content
    if (typeof msg.content !== 'string') {
        content = JSON.stringify(msg.content)
    }
    if (msg.generating) {
        content += '...'
    }
    if (needCollapse && isCollapsed) {
        content = msg.content.slice(0, collapseThreshold) + '... '
    }

    const CollapseButton = (
        <span
            className="cursor-pointer inline-block font-bold text-blue-500 hover:text-white hover:bg-blue-500"
            onClick={() => setIsCollapsed(!isCollapsed)}
        >
            [{isCollapsed ? t('Expand') : t('Collapse')}]
        </span>
    )
    const renderAttachments = () => {
        if (!msg.attachments || msg.attachments.length === 0) return null

        return (
            <div className="flex flex-wrap gap-2 p-2">
                {msg.attachments.map((file, index) => (
                    file.type === 'image' ? (
                        <div key={`${file.name}-${index}`} className="relative" onClick={() => handleImageClick(file)}
                        >
                            <img
                                src={file.base64Data}
                                alt={file.name}
                                className="max-w-[200px] max-h-[200px] object-cover rounded"
                            />
                        </div>
                    ) : (
                        <div key={`${file.name}-${index}`} className="bg-gray-600 opacity-50 p-1 px-2 rounded">
                            <span className="text-sm">{file.name}</span>
                        </div>
                    )
                ))}
            </div>
        )
    }
    return (
        <Box
            ref={ref}
            id={props.id}
            key={msg.id}
            className={clsx(
                'group/message',
                'msg-block',
                'px-2',
                msg.generating ? 'rendering' : 'render-done',
                {
                    user: 'user-msg',
                    system: 'system-msg',
                    assistant: 'assistant-msg',
                }[msg?.role || 'user'],
                className
            )}
            sx={{
                margin: '0',
                paddingBottom: '0.1rem',
                paddingX: '1rem',
                [theme.breakpoints.down('sm')]: {
                    paddingX: '0.3rem',
                },
            }}
        >
            <Grid container wrap="nowrap" spacing={1.5}>
                <Grid item>
                    <Box sx={{ marginTop: '8px' }}>
                        {
                            {
                                assistant: currentSessionPicUrl ? (
                                    <Avatar
                                        src={currentSessionPicUrl}
                                        sx={{
                                            width: '28px',
                                            height: '28px',
                                        }}
                                    />
                                ) : (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                    >
                                        <SmartToyIcon fontSize="small" />
                                    </Avatar>
                                ),
                                user: (
                                    <Avatar
                                        sx={{
                                            width: '28px',
                                            height: '28px',
                                        }}
                                        className="cursor-pointer"
                                        onClick={() => setOpenSettingWindow('chat')}
                                    >
                                        <PersonIcon fontSize="small" />
                                    </Avatar>
                                ),
                                system: (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.warning.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                    >
                                        <SettingsIcon fontSize="small" />
                                    </Avatar>
                                ),
                            }[msg.role]
                        }
                    </Box>
                </Grid>

                <Grid item xs sm container sx={{ width: '0px', paddingRight: '15px' }}>
                    <Grid item xs>
                        <Box
                            className={clsx('msg-content', { 'msg-content-small': small })}
                            sx={small ? { fontSize: theme.typography.body2.fontSize } : {}}
                        >
                            {renderAttachments()}
                            {enableMarkdownRendering && !isCollapsed ? (
                                <Markdown>{content}</Markdown>
                            ) : (
                                <div>
                                    {content}
                                    {needCollapse && isCollapsed && CollapseButton}
                                </div>
                            )}
                        </Box>
                        <MessageErrTips msg={msg} />
                        {needCollapse && !isCollapsed && CollapseButton}
                        <Typography variant="body2" sx={{ opacity: 0.5, paddingBottom: '2rem' }}>
                            {tips.join(', ')}
                            <IconButton aria-label="delete" onClick={handleDeleteMessage}>
                                <DeleteForeverIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                            <br />
                            {msg.searchResults?.raw && (
                                // @ts-ignore - Ignoring type check for now as the component expects a specific type
                                <SearchResult results={msg.searchResults.raw} />
                            )}
                        </Typography>

                    </Grid>
                </Grid>
            </Grid>

            <Lightbox
                open={isImageOpen}
                slides={[{ src: selectedImage?.base64Data || '' },]}
                close={handleCloseImage}
            />

        </Box>
    )
}
