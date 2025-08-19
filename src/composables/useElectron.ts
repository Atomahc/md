import { FileAdapter, ShortcutAdapter, NotificationAdapter, isElectron } from '@/utils/platform'

/**
 * Electron 集成 Composable
 * 提供文件操作、快捷键、通知等功能
 */
export function useElectron() {
  const currentFilePath = ref<string | null>(null)
  const isFileModified = ref(false)

  // 文件操作
  const fileOps = {
    async saveFile(content: string, saveAs = false) {
      try {
        const filePath = saveAs ? null : currentFilePath.value
        const savedPath = await FileAdapter.saveFile(content, filePath || undefined)
        
        if (savedPath) {
          currentFilePath.value = savedPath
          isFileModified.value = false
          NotificationAdapter.show('成功', '文件已保存', 'success')
        }
        
        return savedPath
      } catch (error) {
        console.error('Save file error:', error)
        NotificationAdapter.show('错误', `保存文件失败: ${error}`, 'error')
        throw error
      }
    },

    async openFile() {
      try {
        const result = await FileAdapter.openFile()
        
        if (result) {
          currentFilePath.value = result.filePath
          isFileModified.value = false
          NotificationAdapter.show('成功', '文件已打开', 'success')
          return result
        }
        
        return null
      } catch (error) {
        console.error('Open file error:', error)
        NotificationAdapter.show('错误', `打开文件失败: ${error}`, 'error')
        throw error
      }
    },

    newFile() {
      currentFilePath.value = null
      isFileModified.value = false
      return {
        filePath: '新文档',
        content: ''
      }
    },

    markModified() {
      isFileModified.value = true
    }
  }

  // 获取当前文件信息
  const currentFile = computed(() => ({
    path: currentFilePath.value,
    name: currentFilePath.value ? 
      currentFilePath.value.split(/[\\/]/).pop() || '未知文件' : 
      '未保存的文档',
    isModified: isFileModified.value
  }))

  // 应用标题
  const appTitle = computed(() => {
    const fileName = currentFile.value.name
    const modified = currentFile.value.isModified ? ' •' : ''
    return `${fileName}${modified} - 微信 Markdown 编辑器`
  })

  // 初始化
  const init = (callbacks: {
    onSave?: (content: string) => void
    onSaveAs?: (content: string) => void
    onOpen?: (data: { filePath: string; content: string }) => void
    onNew?: () => void
  }) => {
    // 注册快捷键
    const cleanup = ShortcutAdapter.registerShortcuts({
      save: () => callbacks.onSave?.(''),
      saveAs: () => callbacks.onSaveAs?.(''),
      open: async () => {
        const result = await fileOps.openFile()
        if (result) {
          callbacks.onOpen?.(result)
        }
      },
      new: () => {
        fileOps.newFile()
        callbacks.onNew?.()
      }
    })

    // 返回清理函数
    return cleanup
  }

  return {
    // 状态
    currentFilePath: readonly(currentFilePath),
    isFileModified: readonly(isFileModified),
    currentFile,
    appTitle,
    
    // 方法
    ...fileOps,
    init,
    
    // 平台信息
    isElectron: isElectron()
  }
}
