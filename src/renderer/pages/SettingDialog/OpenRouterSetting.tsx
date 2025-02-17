import { Typography, Box } from '@mui/material'
import { ModelSettings } from '../../../config/types'
import { useTranslation } from 'react-i18next'
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import TemperatureSlider from '../../components/TemperatureSlider'
import PasswordTextField from '../../components/PasswordTextField'
import TextFieldReset from '@/components/TextFieldReset'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { models } from '../../packages/models/openrouter'
import MaxContextMessageCountSlider from '../../components/MaxContextMessageCountSlider'
interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ClaudeSetting({ settingsEdit, setSettingsEdit }: ModelConfigProps) {
    const { t } = useTranslation()

    return (
        <Box>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.openrouterKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, openrouterKey: value })
                }}
                placeholder="xxxxxxxxxxxxx"
            />

            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>
                        {t('model')} & {t('parameters')}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormControl fullWidth variant="outlined" margin="dense">
                        <InputLabel>{t('model')}</InputLabel>
                        <Select
                            value={settingsEdit.openrouterModel}
                            onChange={(e) => setSettingsEdit({ ...settingsEdit, openrouterModel: e.target.value })}
                            label={t('model')}
                        >
                            {models.map((model) => (
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
