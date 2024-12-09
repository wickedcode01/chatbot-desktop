import { getDefaultStore } from 'jotai'
import * as atoms from './atoms'
import * as defaults from '../../config/defaults'
import { Settings } from '../../config/types'

export function modify(update: Partial<Settings>) {
    const store = getDefaultStore()
    store.set(atoms.settingsAtom, (settings) => ({
        ...settings,
        ...update,
    }))
}

export function needEditSetting() {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    return false
}

export function getLanguage() {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    return settings.language
}

export function getProxy() {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    return settings.proxy
}



export function getAutoGenerateTitle() {
    const store = getDefaultStore()
    return store.get(atoms.autoGenerateTitleAtom)
}

export function getSearchSwitch() {
    const store = getDefaultStore()
    return store.get(atoms.switchSearchAtom)
}
