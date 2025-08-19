import { SettingsAdapter } from './platform'

/**
 * 统一的存储适配器，支持 Web 和 Electron 环境
 */
class StorageAdapter {
  private static instance: StorageAdapter
  private cache: Map<string, any> = new Map()

  private constructor() {}

  static getInstance(): StorageAdapter {
    if (!this.instance) {
      this.instance = new StorageAdapter()
    }
    return this.instance
  }

  // 获取项
  async getItem(key: string): Promise<string | null> {
    // 先检查缓存
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }

    try {
      const settings = await SettingsAdapter.getSettings()
      const value = settings[key] || null
      
      // 更新缓存
      this.cache.set(key, value)
      
      return value
    } catch (error) {
      console.warn(`Failed to get item ${key}:`, error)
      return null
    }
  }

  // 设置项
  async setItem(key: string, value: string): Promise<void> {
    try {
      const settings = await SettingsAdapter.getSettings()
      settings[key] = value
      
      await SettingsAdapter.saveSettings(settings)
      
      // 更新缓存
      this.cache.set(key, value)
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error)
      throw error
    }
  }

  // 移除项
  async removeItem(key: string): Promise<void> {
    try {
      const settings = await SettingsAdapter.getSettings()
      delete settings[key]
      
      await SettingsAdapter.saveSettings(settings)
      
      // 清除缓存
      this.cache.delete(key)
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error)
      throw error
    }
  }

  // 清空所有数据
  async clear(): Promise<void> {
    try {
      await SettingsAdapter.saveSettings({})
      this.cache.clear()
    } catch (error) {
      console.error('Failed to clear storage:', error)
      throw error
    }
  }

  // 获取所有键
  async keys(): Promise<string[]> {
    try {
      const settings = await SettingsAdapter.getSettings()
      return Object.keys(settings)
    } catch (error) {
      console.error('Failed to get keys:', error)
      return []
    }
  }

  // 同步方法（向后兼容，但不推荐使用）
  getItemSync(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key)
    }
    return this.cache.get(key) || null
  }

  setItemSync(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value)
    }
    this.cache.set(key, value)
    
    // 异步保存到 Electron
    this.setItem(key, value).catch(console.error)
  }

  removeItemSync(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key)
    }
    this.cache.delete(key)
    
    // 异步从 Electron 移除
    this.removeItem(key).catch(console.error)
  }
}

// 导出单例实例
export const storage = StorageAdapter.getInstance()

// 为了向后兼容，也导出类似 localStorage 的接口
export const compatStorage = {
  getItem: (key: string) => storage.getItemSync(key),
  setItem: (key: string, value: string) => storage.setItemSync(key, value),
  removeItem: (key: string) => storage.removeItemSync(key),
  clear: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear()
    }
    storage.clear().catch(console.error)
  },
  key: (index: number) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.key(index)
    }
    return null
  },
  get length() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.length
    }
    return 0
  }
}
