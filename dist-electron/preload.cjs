"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露安全的 API 到渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 文件操作
    saveFile: (content, filePath) => electron_1.ipcRenderer.invoke('save-file', content, filePath),
    openFile: () => electron_1.ipcRenderer.invoke('open-file'),
    // 图片操作
    saveImage: (buffer, filename) => electron_1.ipcRenderer.invoke('save-image', Buffer.from(buffer), filename),
    // 设置管理
    getSettings: () => electron_1.ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('save-settings', settings),
    // 应用信息
    getAppInfo: () => electron_1.ipcRenderer.invoke('get-app-info'),
    // 文件夹选择
    selectDirectory: () => electron_1.ipcRenderer.invoke('select-directory'),
    // 窗口控制
    windowMinimize: () => electron_1.ipcRenderer.invoke('window-minimize'),
    windowMaximize: () => electron_1.ipcRenderer.invoke('window-maximize'),
    windowClose: () => electron_1.ipcRenderer.invoke('window-close'),
    windowIsMaximized: () => electron_1.ipcRenderer.invoke('window-is-maximized'),
    // 菜单事件监听
    onMenuAction: (callback) => {
        // 菜单事件
        electron_1.ipcRenderer.on('menu-new-file', () => callback('new-file'));
        electron_1.ipcRenderer.on('menu-open-file', (_, data) => callback('open-file', data));
        electron_1.ipcRenderer.on('menu-save-file', () => callback('save-file'));
        electron_1.ipcRenderer.on('menu-save-as-file', () => callback('save-as-file'));
    },
    // 移除监听器
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
});
