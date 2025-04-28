import React, { useEffect } from 'react'
import { getDefaultStore } from 'jotai'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'
import SettingDialog from './pages/SettingDialog'
import ChatConfigWindow from './pages/ChatConfigWindow'
import CleanWidnow from './pages/CleanWindow'
import AboutWindow from './pages/AboutWindow'
import useAppTheme from './hooks/useAppTheme'

import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './components/Toasts'

import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import MainPane from './MainPane'
import { useAtom, useAtomValue } from 'jotai'
import * as atoms from './stores/atoms'
import Sidebar from './Sidebar'

// --- MIGRATION LOGIC ---
function migrateSessionsMessages() {
  const store = getDefaultStore();
  const sessions = store.get(atoms.sessionsMetaAtom);
  let needUpdate = false;
  const newSessions = sessions.map(session => {
    if (Array.isArray(session.messages) && session.messages.length > 0) {
        console.log('migrating session messages for', session.id);
      store.set(atoms.sessionMessagesAtomFamily(session.id), session.messages);
      needUpdate = true;
    }
    // 最终都返回带空 messages 字段的 session
    const { messages, ...meta } = session;
    return { ...meta, messages: [] };
  });
  if (needUpdate) {
    store.set(atoms.sessionsMetaAtom, newSessions);
  }
}

function Main() {
    const spellCheck = useAtomValue(atoms.spellCheckAtom)

    const [openSettingWindow, setOpenSettingWindow] = useAtom(atoms.openSettingDialogAtom)

    const [openAboutWindow, setOpenAboutWindow] = React.useState(false)


    return (
        <Box className="box-border App" spellCheck={spellCheck}>
            <Grid container className="h-full">
                <Sidebar
                    openAboutWindow={() => setOpenAboutWindow(true)}
                    setOpenSettingWindow={setOpenSettingWindow}
                />
                <MainPane />
            </Grid>
            <SettingDialog
                open={!!openSettingWindow}
                targetTab={openSettingWindow || undefined}
                close={() => setOpenSettingWindow(null)}
            />
            <AboutWindow open={openAboutWindow} close={() => setOpenAboutWindow(false)} />
            <ChatConfigWindow />
            <CleanWidnow />


            <Toasts />
        </Box>
    )
}

export default function App() {
    useI18nEffect()

    useSystemLanguageWhenInit()
    const theme = useAppTheme()
    useEffect(() => {
      migrateSessionsMessages();
    }, []);
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main />
        </ThemeProvider>
    )
}
