import { useEffect, useState } from 'react'
import {
    Button,
    Box,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    useTheme,
} from '@mui/material'
import iconPNG from '../static/icon.png'
import { useTranslation } from 'react-i18next'

import useVersion from '../hooks/useVersion'
import * as atoms from '../stores/atoms'
import { useAtomValue } from 'jotai'

interface Props {
    open: boolean
    close(): void
}

export default function AboutWindow(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()
    const language = useAtomValue(atoms.languageAtom)
    const versionHook = useVersion()


    return (
        <Dialog open={props.open} onClose={props.close} fullWidth>
            <DialogTitle>{t('About Claude Desktop')}</DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', padding: '0 20px' }}>
                    <img src={iconPNG} style={{ width: '100px', margin: 0, display: 'inline-block' }} />
                    <h3 style={{ margin: '4px 0 5px 0' }}>
                        Claude Desktop
                        {/\d/.test(versionHook.version) ? `(v${versionHook.version})` : ''}
                    </h3>
                    <p className="p-0 m-0">{t('slogan')}</p>
                    <p className="p-0 m-0 opacity-60 text-xs">{t('introduction')}</p>
                </Box>
    


                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        '& > :not(style)': {
                            m: 1,
                        },
                        justifyContent: 'center',
                        opacity: 0.8,
                    }}
                >

                </Box>

            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
