import { ElectronIPC } from 'src/config/electron-types'
import { Config, Settings } from 'src/config/types'
import { getOS } from './navigator'
import { parseLocale } from '@/i18n/parser'
import Exporter from './exporter'
import { debounce } from 'lodash'

// 存储值缓存，用于减少IPC调用
interface StoreCache {
    [key: string]: {
        value: any;
        timestamp: number;
    }
}

export class DesktopPlatform {
    public ipc: ElectronIPC
    private storeCache: StoreCache = {}
    private storeFlushDebounced: (force?: boolean) => void
    private readonly FLUSH_INTERVAL = 1000 // 1秒后强制刷新缓存
    
    constructor(ipc: ElectronIPC) {
        this.ipc = ipc
        // 创建一个debounced函数来刷新缓存
        this.storeFlushDebounced = debounce(this.flushStoreCache.bind(this), this.FLUSH_INTERVAL)
    }
    
    // 刷新存储缓存的方法
    private async flushStoreCache(force: boolean = false) {
        const now = Date.now()
        const keysToFlush = Object.keys(this.storeCache).filter(key => 
            force || now - this.storeCache[key].timestamp >= this.FLUSH_INTERVAL
        )
        
        if (keysToFlush.length === 0) return
        
        // 批量处理需要刷新的键
        for (const key of keysToFlush) {
            const { value } = this.storeCache[key]
            const valueJson = JSON.stringify(value)
            await this.ipc.invoke('setStoreValue', key, valueJson)
            delete this.storeCache[key]
        }
    }

    public exporter = new Exporter()

    public async getVersion() {
        return this.ipc.invoke('getVersion')
    }
    public async getPlatform() {
        return this.ipc.invoke('getPlatform')
    }
    public async shouldUseDarkColors(): Promise<boolean> {
        return await this.ipc.invoke('shouldUseDarkColors')
    }
    public onSystemThemeChange(callback: () => void): () => void {
        return this.ipc.onSystemThemeChange(callback)
    }
    public onWindowShow(callback: () => void): () => void {
        return this.ipc.onWindowShow(callback)
    }
    public async openLink(url: string): Promise<void> {
        return this.ipc.invoke('openLink', url)
    }
    public async getInstanceName(): Promise<string> {
        const hostname = await this.ipc.invoke('getHostname')
        return `${hostname} / ${getOS()}`
    }
    public async getLocale() {
        const locale = await this.ipc.invoke('getLocale')
        return parseLocale(locale)
    }
    public async ensureShortcutConfig(config: { disableQuickToggleShortcut: boolean }): Promise<void> {
        return this.ipc.invoke('ensureShortcutConfig', JSON.stringify(config))
    }
    public async ensureProxyConfig(config: { proxy?: string }): Promise<void> {
        return this.ipc.invoke('ensureProxy', JSON.stringify(config))
    }
    public async relaunch(): Promise<void> {
        return this.ipc.invoke('relaunch')
    }

    public async getConfig(): Promise<Config> {
        return this.ipc.invoke('getConfig')
    }
    public async getSettings(): Promise<Settings> {
        return this.ipc.invoke('getSettings')
    }

    public async setStoreValue(key: string, value: any) {
        // 更新缓存
        this.storeCache[key] = {
            value,
            timestamp: Date.now()
        }
        
        // 触发debounced刷新
        this.storeFlushDebounced()
        
        // 返回一个已解决的Promise，不等待实际IPC调用
        return Promise.resolve()
    }
    
    public async getStoreValue(key: string) {
        // 先检查缓存
        if (this.storeCache[key]) {
            return this.storeCache[key].value
        }
        // 如果缓存中没有，则从主进程获取
        return this.ipc.invoke('getStoreValue', key)
    }
    
    public delStoreValue(key: string) {
        // 从缓存中删除
        if (this.storeCache[key]) {
            delete this.storeCache[key]
        }
        // 从存储中删除
        return this.ipc.invoke('delStoreValue', key)
    }
    
    public async getAllStoreValues(): Promise<{ [key: string]: any }> {
        // 先刷新所有缓存到存储
        await this.flushStoreCache(true);
        // 然后获取所有值
        const json = await this.ipc.invoke('getAllStoreValues')
        return JSON.parse(json)
    }

    public async setAllStoreValues(data: { [key: string]: any }) {
        // 清空当前缓存
        this.storeCache = {};
        // 直接设置所有值
        await this.ipc.invoke('setAllStoreValues', JSON.stringify(data))
    }
    
    // 确保应用退出前刷新所有缓存数据
    public flushAllCache() {
        return this.flushStoreCache(true)
    }

    public initTracking(): void {
        this.trackingEvent('user_engagement', {})
    }
    public trackingEvent(name: string, params: { [key: string]: string }) {
        const dataJson = JSON.stringify({ name, params })
        this.ipc.invoke('analysticTrackingEvent', dataJson)
    }

    public async shouldShowAboutDialogWhenStartUp(): Promise<boolean> {
        return this.ipc.invoke('shouldShowAboutDialogWhenStartUp')
    }

    public async appLog(level: string, message: string) {
        return this.ipc.invoke('appLog', JSON.stringify({ level, message }))
    }
}

// 在默认实例上添加页面卸载时的缓存刷新
const platform = new DesktopPlatform(window.electronAPI as any)

// 确保页面关闭前刷新缓存
window.addEventListener('beforeunload', () => {
    platform.flushAllCache()
})

export default platform
