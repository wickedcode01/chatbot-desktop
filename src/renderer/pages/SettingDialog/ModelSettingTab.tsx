import { Divider, Box } from '@mui/material'
import { ModelProvider, ModelSettings } from '../../../config/types'

import AIProviderSelect from '../../components/AIProviderSelect'
import ClaudeSetting from './ClaudeSetting'
import OpenRouterSetting from './OpenRouterSetting'
import OpenAISetting from './OpenAISetting'

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
            {settingsEdit.aiProvider === ModelProvider.OpenRouter && (
                <OpenRouterSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.OpenAI && (
                <OpenAISetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
        </Box>
    )
}
