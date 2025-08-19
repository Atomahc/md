import { contextBridge, ipcRenderer } from 'electron'

// 定义 API 接口
interface ElectronAPI {
  // 文件操作
  saveFile: (content: string, filePath?: string) => Promise<string | null>
  openFile: () => Promise<{ filePath: string; content: string } | null>
  
  // 图片操作
  saveImage: (buffer: ArrayBuffer, filename: string) => Promise<string>
  
  // 设置管理
  getSettings: () => Promise<any>
  saveSettings: (settings: any) => Promise<boolean>
  
  // 应用信息
  getAppInfo: () => Promise<{
    name: string
    version: string
    platform: string
    isElectron: boolean
  }>
  
  // 文件夹选择
  selectDirectory: () => Promise<string | null>
  
  // 窗口控制
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowIsMaximized: () => Promise<boolean>
  
  // 菜单事件监听
  onMenuAction: (callback: (action: string, data?: any) => void) => void
  
  // 移除监听器
  removeAllListeners: (channel: string) => void
}

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  saveFile: (content: string, filePath?: string) => 
    ipcRenderer.invoke('save-file', content, filePath),
  
  openFile: () => 
    ipcRenderer.invoke('open-file'),
  
  // 图片操作
  saveImage: (buffer: ArrayBuffer, filename: string) => 
    ipcRenderer.invoke('save-image', Buffer.from(buffer), filename),
  
  // 设置管理
  getSettings: () => 
    ipcRenderer.invoke('get-settings'),
  
  saveSettings: (settings: any) => 
    ipcRenderer.invoke('save-settings', settings),
  
  // 应用信息
  getAppInfo: () => 
    ipcRenderer.invoke('get-app-info'),
  
  // 文件夹选择
  selectDirectory: () => 
    ipcRenderer.invoke('select-directory'),
  
  // 窗口控制
  windowMinimize: () => 
    ipcRenderer.invoke('window-minimize'),
  
  windowMaximize: () => 
    ipcRenderer.invoke('window-maximize'),
  
  windowClose: () => 
    ipcRenderer.invoke('window-close'),
  
  windowIsMaximized: () => 
    ipcRenderer.invoke('window-is-maximized'),
  
  // 菜单事件监听
  onMenuAction: (callback: (action: string, data?: any) => void) => {
    // 菜单事件
    ipcRenderer.on('menu-new-file', () => callback('new-file'))
    ipcRenderer.on('menu-open-file', (_, data) => callback('open-file', data))
    ipcRenderer.on('menu-save-file', () => callback('save-file'))
    ipcRenderer.on('menu-save-as-file', () => callback('save-as-file'))
  },
  
  // 移除监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
} as ElectronAPI)

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
