import { Divider, Box } from '@mui/material'
import { ModelProvider, ModelSettings } from '../../../config/types'

import AIProviderSelect from '../../components/AIProviderSelect'
import ClaudeSetting from './ClaudeSetting'



interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ModelSettingTab(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    return (
        <Box>
            <AIProviderSelect settings={settingsEdit} setSettings={setSettingsEdit} />
            <Divider sx={{ marginTop: '10px', marginBottom: '24px' }} />
            {settingsEdit.aiProvider === ModelProvider.Claude && (
                <ClaudeSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
        </Box>
    )
}
