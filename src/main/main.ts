/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import os from 'os'
import path from 'path'
import { app, BrowserWindow, shell, ipcMain, nativeTheme, session, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'
import { store, getConfig, getSettings } from './store-node'
import * as proxy from './proxy'

if (process.platform === 'win32') {
    app.setAppUserModelId(app.name)
}

class AppUpdater {
    constructor() {
        

    }
}

let mainWindow: BrowserWindow | null = null

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support')
    sourceMapSupport.install()
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

if (isDebug) {
    require('electron-debug')()
}


const createWindow = async () => {
    if (isDebug) {
    }

    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets')

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths)
    }

    mainWindow = new BrowserWindow({
        show: false,
        width: 1000,
        height: 950,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            spellcheck: true,
            webSecurity: false,
            allowRunningInsecureContent: false,
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    })

    mainWindow.loadURL(resolveHtmlPath('index.html'))

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined')
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize()
        } else {
            mainWindow.show()
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    const menuBuilder = new MenuBuilder(mainWindow)
    menuBuilder.buildMenu()

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url)
        return { action: 'deny' }
    })

    // https://www.computerhope.com/jargon/m/menubar.htm
    mainWindow.setMenuBarVisibility(false)

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater()

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
            },
        })
    })

    nativeTheme.on('updated', () => {
        mainWindow?.webContents.send('system-theme-updated')
    })
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.whenReady()
    .then(() => {
        createWindow()
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow()
        })
        proxy.init()
    })
    .catch(console.log)

// IPC

ipcMain.handle('getStoreValue', (event, key) => {
    console.log('getStoreValue', key)
    return store.get(key)
})
ipcMain.handle('setStoreValue', (event, key, dataJson) => {
    const data = JSON.parse(dataJson)
    console.log('setStoreValue', key)
    return store.set(key, data)
})
ipcMain.handle('delStoreValue', (event, key) => {
    console.log('delStoreValue', key)
    return store.delete(key)
})
ipcMain.handle('getAllStoreValues', (event) => {
    return JSON.stringify(store.store)
})
ipcMain.handle('setAllStoreValues', (event, dataJson) => {
    const data = JSON.parse(dataJson)
    store.store = data
})

ipcMain.handle('getVersion', () => {
    return app.getVersion()
})
ipcMain.handle('getPlatform', () => {
    return process.platform
})
ipcMain.handle('getHostname', () => {
    return os.hostname()
})
ipcMain.handle('getLocale', () => {
    try {
        return app.getLocale()
    } catch (e: any) {
        return ''
    }
})
ipcMain.handle('openLink', (event, link) => {
    return shell.openExternal(link)
})

ipcMain.handle('shouldUseDarkColors', () => nativeTheme.shouldUseDarkColors)

ipcMain.handle('ensureProxy', (event, json) => {
    const config: { proxy?: string } = JSON.parse(json)
    proxy.ensure(config.proxy)
})

ipcMain.handle('relaunch', () => {
    app.relaunch()
    app.quit()
})

ipcMain.handle('analysticTrackingEvent', (event, dataJson) => {
    const data = JSON.parse(dataJson)

})

ipcMain.handle('getConfig', (event) => {
    return getConfig()
})

ipcMain.handle('getSettings', (event) => {
    return getSettings()
})

ipcMain.handle('shouldShowAboutDialogWhenStartUp', (event) => {
    const currentVersion = app.getVersion()
    if (store.get('lastShownAboutDialogVersion', '') === currentVersion) {
        return false
    }
    store.set('lastShownAboutDialogVersion', currentVersion)
    return true
})

ipcMain.handle('appLog', (event, dataJson) => {
    const data: { level: string; message: string } = JSON.parse(dataJson)
    data.message = 'APP_LOG: ' + data.message
    switch (data.level) {
        case 'info':
            log.info(data.message)
            break
        case 'error':
            log.error(data.message)
            break
        default:
            log.info(data.message)
    }
})
