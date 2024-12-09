import React from 'react'
import Alert from '@mui/material/Alert'
import { Trans } from 'react-i18next'
import { Message } from '../../config/types'
import { aiProviderNameHash } from '../packages/models'
import * as atoms from '../stores/atoms'
import * as settingActions from '../stores/settingActions'
import { useSetAtom } from 'jotai'
import { Link } from '@mui/material'


export default function MessageErrTips(props: { msg: Message }) {
    const { msg } = props
    const setOpenSettingDialogAtom = useSetAtom(atoms.openSettingDialogAtom)
    if (!msg.error) {
        return null
    }
    const tips: React.ReactNode[] = []
    let onlyShowTips = false
    if (msg.error.startsWith('API Error')) {
        tips.push(
            <Trans
                i18nKey="api error tips"
                values={{
                    aiProvider: msg.aiProvider ? aiProviderNameHash[msg.aiProvider] : 'AI Provider',
                }}
            />
        )
    } else if (msg.error.startsWith('Network Error')) {
        tips.push(
            <Trans
                i18nKey="network error tips"
                values={{
                    host: msg.errorExtra?.['host'] || 'AI Provider',
                }}
            />
        )
        const proxy = settingActions.getProxy()
        if (proxy) {
            tips.push(<Trans i18nKey="network proxy error tips" values={{ proxy }} />)
        }
    } else if (msg.errorCode === 10003) {
        tips.push(
            <Trans
                i18nKey="ai provider no implemented paint tips"
                values={{
                    aiProvider: msg.aiProvider ? aiProviderNameHash[msg.aiProvider] : 'AI Provider',
                }}
                components={[
                    <Link className="cursor-pointer font-bold" onClick={() => setOpenSettingDialogAtom('ai')}></Link>,
                ]}
            />
        )
    }
    return (
        <Alert icon={false} severity="error">
            {tips.map((tip, i) => (
                <b key={i}>{tip}</b>
            ))}
            {onlyShowTips ? (
                <></>
            ) : (
                <>
                    <br />
                    <br />
                    {msg.error}
                </>
            )}
        </Alert>
    )
}
