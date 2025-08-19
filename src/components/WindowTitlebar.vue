<template>
  <div class="window-titlebar" :class="{ 'maximized': isMaximized }">
    <!-- 可拖拽区域 -->
    <div class="titlebar-drag-area">
      <div class="titlebar-title">微信 Markdown 编辑器</div>
    </div>
    
    <!-- 窗口控制按钮 -->
    <div class="window-controls">
      <button 
        class="window-control-btn minimize-btn" 
        @click="minimizeWindow"
        title="最小化"
      >
        <MinusIcon class="w-3 h-3" />
      </button>
      
      <button 
        class="window-control-btn maximize-btn" 
        @click="toggleMaximize"
        :title="isMaximized ? '还原' : '最大化'"
      >
        <SquareIcon v-if="!isMaximized" class="w-3 h-3" />
        <CopyIcon v-else class="w-3 h-3" />
      </button>
      
      <button 
        class="window-control-btn close-btn" 
        @click="closeWindow"
        title="关闭"
      >
        <XIcon class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { MinusIcon, SquareIcon, CopyIcon, XIcon } from 'lucide-vue-next'
import { isElectron } from '@/utils/platform'

const isMaximized = ref(false)

// 窗口控制函数
const minimizeWindow = async () => {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.windowMinimize()
  }
}

const toggleMaximize = async () => {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.windowMaximize()
    // 更新最大化状态
    isMaximized.value = await window.electronAPI.windowIsMaximized()
  }
}

const closeWindow = async () => {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.windowClose()
  }
}

// 检查窗口状态
const checkWindowState = async () => {
  if (isElectron() && window.electronAPI) {
    isMaximized.value = await window.electronAPI.windowIsMaximized()
  }
}

onMounted(() => {
  checkWindowState()
  // 定期检查窗口状态（用于处理双击标题栏等系统操作）
  const interval = setInterval(checkWindowState, 500)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.window-titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 32px;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
}

.dark .window-titlebar {
  background-color: #1f2937;
  border-bottom-color: #374151;
}

.titlebar-drag-area {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 12px;
  -webkit-app-region: drag;
}

.titlebar-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  pointer-events: none;
}

.dark .titlebar-title {
  color: #d1d5db;
}

.window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.window-control-btn {
  width: 48px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.dark .window-control-btn {
  color: #9ca3af;
}

.window-control-btn:hover {
  background-color: #e5e7eb;
}

.dark .window-control-btn:hover {
  background-color: #374151;
}

.minimize-btn:hover,
.maximize-btn:hover {
  color: #1f2937;
}

.dark .minimize-btn:hover,
.dark .maximize-btn:hover {
  color: #e5e7eb;
}

.close-btn:hover {
  background-color: #ef4444;
  color: white;
}

.close-btn:active {
  background-color: #dc2626;
}

/* 最大化状态样式调整 */
.maximized {
  border-bottom: 0;
}
</style>
