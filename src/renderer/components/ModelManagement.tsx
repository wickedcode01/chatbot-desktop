import { Box, Typography, TextField, IconButton, List, ListItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { ModelSettings } from '@/../config/types'
import { useState, useCallback} from 'react';

interface ModelManagementProps {
    modelKey: 'claudeModels' | 'openrouterModels';
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ModelManagement({ modelKey, settingsEdit, setSettingsEdit }: ModelManagementProps) {
    const { t } = useTranslation();

    const [newModel, setNewModel] = useState('');


    const handleAddModel = () => {
        if (!newModel.trim()) return;
        setSettingsEdit({
            ...settingsEdit,
            [modelKey]: [...settingsEdit[modelKey], newModel.trim()]
        });
        setNewModel('');
    };

    const handleDeleteModel = (modelToDelete: string) => {
        setSettingsEdit({
            ...settingsEdit,
            [modelKey]: settingsEdit[modelKey].filter(model => model !== modelToDelete)
        });
    };

    return (
        <Box sx={{ mt: 2 }}>

            <Box sx={{ display: 'flex', gap: 1}}>
                <TextField
                    label={t('Available Models')}
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder={t('Enter model name')||''}
                    fullWidth
                />
                <IconButton onClick={handleAddModel} color="primary">
                    <AddIcon />
                </IconButton>
            </Box>

            <List>
                {settingsEdit[modelKey].map((model) => (
                    <ListItem
                        key={model}
                        secondaryAction={
                            <IconButton
                                edge="end"
                                onClick={() => handleDeleteModel(model)}
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        }
                        sx={{ py: 0.5 }}
                    >
                        <Typography variant="body2">{model}</Typography>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}