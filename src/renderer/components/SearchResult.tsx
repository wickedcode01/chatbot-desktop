import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemText,
    Typography,
    Link,
    IconButton,
    Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

interface SearchResultItem {
    title: string;
    id: string;
    text: string;
    url: string;
}

interface Props {
    results: SearchResultItem[];
}

export default function SearchResult({ results }: Props) {
    const [open, setOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (!results || results.length === 0) return null;

    return (
        <>
            <Button
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => setOpen(true)}
                sx={{ mt: 1 }}
                variant="outlined"
            >
                {results.length} Search Results
            </Button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Search Results
                    <IconButton
                        onClick={() => setOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <List>
                        {results.map((result) => (
                            <ListItem key={result.id} divider>
                                <ListItemText
                                    primary={
                                        <Link href={result.url} target="_blank" rel="noopener">
                                            {result.title}
                                        </Link>
                                    }
                                    secondary={
                                        <>
                                            <Collapse collapsedSize={60}>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        mt: 1,
                                                    }}
                                                >
                                                    {result.text}
                                                </Typography>
                                            </Collapse>
                                            
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>
        </>
    );
}
