/**
 * 平台检测和跨平台适配工具
 */

// 检测是否在 Electron 环境
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI)
}

// 检测是否在 Web 环境
export const isWeb = (): boolean => {
  return typeof window !== 'undefined' && !window.electronAPI
}

// 检测是否在浏览器扩展环境
export const isExtension = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).chrome !== 'undefined' && 
         Boolean((window as any).chrome.runtime && (window as any).chrome.runtime.id)
}

// 获取当前平台类型
export type PlatformType = 'electron' | 'web' | 'extension' | 'unknown'

export const getPlatform = (): PlatformType => {
  if (isElectron()) return 'electron'
  if (isExtension()) return 'extension'
  if (isWeb()) return 'web'
  return 'unknown'
}

// 平台信息
export interface PlatformInfo {
  type: PlatformType
  isElectron: boolean
  isWeb: boolean
  isExtension: boolean
  userAgent: string
}

export const getPlatformInfo = (): PlatformInfo => {
  const type = getPlatform()
  return {
    type,
    isElectron: type === 'electron',
    isWeb: type === 'web',
    isExtension: type === 'extension',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  }
}

/**
 * 文件操作适配器
 */
export class FileAdapter {
  // 保存文件
  static async saveFile(content: string, filename?: string): Promise<string | null> {
    if (isElectron()) {
      return window.electronAPI.saveFile(content, filename)
    } else {
      // Web 环境下载文件
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `document-${Date.now()}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return null
    }
  }

  // 打开文件
  static async openFile(): Promise<{ filePath: string; content: string } | null> {
    if (isElectron()) {
      return window.electronAPI.openFile()
    } else {
      // Web 环境文件选择
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.md,.markdown,.txt'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                filePath: file.name,
                content: reader.result as string
              })
            }
            reader.readAsText(file)
          } else {
            resolve(null)
          }
        }
        input.click()
      })
    }
  }

  // 保存图片
  static async saveImage(buffer: ArrayBuffer, filename: string): Promise<string> {
    if (isElectron()) {
      return window.electronAPI.saveImage(buffer, filename)
    } else {
      // Web 环境创建 blob URL
      const blob = new Blob([buffer])
      return URL.createObjectURL(blob)
    }
  }
}

/**
 * 设置管理适配器
 */
export class SettingsAdapter {
  private static readonly WEB_STORAGE_KEY = 'md-editor-settings'

  // 获取设置
  static async getSettings(): Promise<any> {
    if (isElectron()) {
      return window.electronAPI.getSettings()
    } else {
      // Web 环境使用 localStorage
      try {
        const stored = localStorage.getItem(this.WEB_STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    }
  }

  // 保存设置
  static async saveSettings(settings: any): Promise<boolean> {
    if (isElectron()) {
      return window.electronAPI.saveSettings(settings)
    } else {
      // Web 环境使用 localStorage
      try {
        localStorage.setItem(this.WEB_STORAGE_KEY, JSON.stringify(settings))
        return true
      } catch {
        return false
      }
    }
  }
}

/**
 * 应用信息适配器
 */
export class AppInfoAdapter {
  static async getAppInfo() {
    if (isElectron()) {
      return window.electronAPI.getAppInfo()
    } else {
      return {
        name: '微信 Markdown 编辑器',
        version: '2.0.4',
        platform: 'web',
        isElectron: false
      }
    }
  }
}

/**
 * 快捷键适配器
 */
export class ShortcutAdapter {
  // 注册快捷键监听
  static registerShortcuts(callbacks: {
    save?: () => void
    open?: () => void
    new?: () => void
    saveAs?: () => void
  }) {
    if (isElectron()) {
      // Electron 环境通过菜单处理，这里监听菜单事件
      window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'save-file':
            callbacks.save?.()
            break
          case 'open-file':
            callbacks.open?.()
            break
          case 'new-file':
            callbacks.new?.()
            break
          case 'save-as-file':
            callbacks.saveAs?.()
            break
        }
      })
    } else {
      // Web 环境注册键盘事件
      const handleKeydown = (e: KeyboardEvent) => {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey
        
        if (isCtrlOrCmd && e.key === 's') {
          e.preventDefault()
          if (e.shiftKey) {
            callbacks.saveAs?.()
          } else {
            callbacks.save?.()
          }
        } else if (isCtrlOrCmd && e.key === 'o') {
          e.preventDefault()
          callbacks.open?.()
        } else if (isCtrlOrCmd && e.key === 'n') {
          e.preventDefault()
          callbacks.new?.()
        }
      }

      document.addEventListener('keydown', handleKeydown)

      // 返回清理函数
      return () => {
        document.removeEventListener('keydown', handleKeydown)
      }
    }
  }
}

/**
 * 通知适配器
 */
export class NotificationAdapter {
  static show(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (isElectron()) {
      // Electron 环境可以使用系统通知
      new Notification(title, {
        body: message,
        icon: type === 'error' ? undefined : '/mpmd/icon-256.png'
      })
    } else {
      // Web 环境可以使用浏览器通知（需要用户授权）
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/mpmd/icon-256.png'
        })
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, {
              body: message,
              icon: '/mpmd/icon-256.png'
            })
          }
        })
      }
    }
  }
}
