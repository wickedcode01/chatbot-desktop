import { Typography, Box } from '@mui/material'
import { ModelSettings } from '../../../config/types'
import { useTranslation } from 'react-i18next'
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import TemperatureSlider from '../../components/TemperatureSlider'
import PasswordTextField from '../../components/PasswordTextField'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import ModelManagement from '@/components/ModelManagement'
import MaxContextMessageCountSlider from '../../components/MaxContextMessageCountSlider'
import TextFieldReset from '@/components/TextFieldReset'
interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function OpenAISetting({ settingsEdit, setSettingsEdit }: ModelConfigProps) {
    const { t } = useTranslation()

    return (
        <Box>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.openaiApiKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, openaiApiKey: value })
                }}
                placeholder="sk-xxxxxxxxxxxxx"
            />
            <TextFieldReset
                margin="dense"
                label={t('api host')}
                type="text"
                fullWidth
                variant="outlined"
                value={settingsEdit.openaiApiHost || ''}
                onValueChange={(value) => {
                    value = value.trim()
                    if (value.length > 4 && !value.startsWith('http')) {
                        value = 'https://' + value
                    }
                    setSettingsEdit({ ...settingsEdit, claudeApiHost: value })
                }}
            />
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>
                        {t('model')} & {t('parameters')}
                    </Typography>
                </AccordionSummary>

                <AccordionDetails>
                    <ModelManagement modelKey="openaiModels" settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                    <FormControl fullWidth variant="outlined" margin="dense">
                        <InputLabel>{t('model')}</InputLabel>
                        <Select
                            value={settingsEdit.openaiModel}
                            onChange={(e) => setSettingsEdit({ ...settingsEdit, openaiModel: e.target.value })}
                            label={t('model')}
                        >
                            {settingsEdit.openaiModels.map((model) => (
                                <MenuItem key={model} value={model}>
                                    {model}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TemperatureSlider
                        value={settingsEdit.temperature}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
                    />
                    <MaxContextMessageCountSlider
                        value={settingsEdit.openaiMaxContextMessageCount}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
                    />
                </AccordionDetails>
            </Accordion>
        </Box>
    )
} 