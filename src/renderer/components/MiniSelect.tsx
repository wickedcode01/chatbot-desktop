import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import * as atoms from '../stores/atoms';
import { ModelProvider } from '../../config/types';
import { models as Claudemodels } from '../packages/models/claude';
import { models as Openmodels} from '../packages/models/openrouter';
import { SelectChangeEvent } from '@mui/material';
import { Settings } from '../../config/types';

export default function MiniSelect() {
    const { t } = useTranslation();
    const [settings, setSettings] = useAtom(atoms.settingsAtom);

    const handleModelChange = (event: SelectChangeEvent) => {
        const modelKey = `${settings.aiProvider}Model` as keyof Settings;
        setSettings({
            ...settings,
            [modelKey]: event.target.value
        });
    };

    const getCurrentModels = () => {
        switch (settings.aiProvider) {
            case ModelProvider.Claude:
                return Claudemodels;
            // Add cases for other providers here
            case ModelProvider.OpenRouter:
                return Openmodels;
            default:
                return [];
        }
    };

    const currentModelKey = `${settings.aiProvider}Model` as keyof Settings;
    const currentModel = settings[currentModelKey] as string;

    return (
        <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel> {t('Model')}</InputLabel>
            <Select
                value={currentModel}
                onChange={handleModelChange}
                label={t('Model')}
            >
                {getCurrentModels().map(model => (
                    <MenuItem key={model} value={model}>
                        {model}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
