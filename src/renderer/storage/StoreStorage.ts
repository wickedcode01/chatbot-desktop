import BaseStorage from './BaseStorage'


export enum StorageKey {
    ChatSessions = 'chat-sessions',
    Configs = 'configs',
    Settings = 'settings',
    MyCopilots = 'myCopilots',
    ConfigVersion = 'configVersion',
    RemoteConfig = 'remoteConfig',
}

export default class StoreStorage extends BaseStorage {
    constructor() {
        super()
    }
    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        let value: T = await super.getItem(key, initialValue)


        if (key === StorageKey.Configs && value === initialValue) {
            await super.setItem(key, initialValue)
        }

        return value
    }
}
