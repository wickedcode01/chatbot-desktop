import { ElectronIPC } from '../config/electron-types'

declare global {
    // eslint-disable-next-line no-unused-vars
    interface Window {
        electronAPI?: ElectronIPC
    }
}

export {}
