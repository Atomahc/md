# Electron 版本使用说明

## 概述

项目现在支持三种运行模式：
1. **Web 版本** - 浏览器中运行
2. **浏览器扩展** - 作为浏览器插件运行  
3. **Electron 桌面应用** - 作为桌面应用运行

## 开发环境

### 启动 Electron 开发环境

```bash
# 构建 Electron 主进程
npm run build:electron

# 启动开发环境（同时启动 Vite 和 Electron）
npm run electron:dev
```

### 构建和打包

```bash
# 构建 Web 应用
npm run build

# 构建 Electron 主进程
npm run build:electron

# 打包 Electron 应用（仅文件夹，用于测试）
npm run pack:electron

# 构建并打包完整的 Electron 应用
npm run dist:electron
```

## 功能特性

### Electron 独有功能

1. **原生文件操作**
   - `Ctrl+O` / `Cmd+O` - 打开文件
   - `Ctrl+S` / `Cmd+S` - 保存文件
   - `Ctrl+Shift+S` / `Cmd+Shift+S` - 另存为
   - `Ctrl+N` / `Cmd+N` - 新建文档

2. **原生菜单**
   - 完整的应用菜单
   - 文件操作菜单项
   - 快捷键支持

3. **本地存储**
   - 设置自动保存到本地文件
   - 不依赖浏览器存储限制

4. **原生通知**
   - 系统级通知提醒
   - 操作完成提示

5. **窗口管理**
   - 可调整大小
   - 最小化/最大化
   - 记住窗口状态

### 跨平台兼容

项目使用平台适配器模式，确保功能在不同环境下都能正常工作：

- **文件操作**: 自动适配原生文件系统或浏览器下载
- **设置存储**: 自动适配本地文件存储或 localStorage  
- **快捷键**: 自动适配原生菜单或键盘事件
- **通知系统**: 自动适配系统通知或浏览器通知

## 技术架构

### 主要文件

```
src/
├── electron/                # Electron 相关代码
│   ├── main.ts             # 主进程
│   └── preload.ts          # 预加载脚本
├── utils/
│   ├── platform.ts         # 平台检测和适配器
│   └── storage.ts          # 统一存储接口
├── composables/
│   └── useElectron.ts      # Electron 功能集成
└── views/
    └── CodemirrorEditor.vue # 主编辑器（已集成 Electron）
```

### 平台检测

```typescript
import { isElectron, isWeb, getPlatform } from '@/utils/platform'

// 检测运行环境
if (isElectron()) {
  // Electron 特定代码
} else if (isWeb()) {
  // Web 特定代码
}
```

### 统一 API

```typescript
import { FileAdapter, SettingsAdapter } from '@/utils/platform'

// 文件操作（自动适配平台）
const content = await FileAdapter.openFile()
await FileAdapter.saveFile(content, 'document.md')

// 设置管理（自动适配存储方式）
const settings = await SettingsAdapter.getSettings()
await SettingsAdapter.saveSettings(settings)
```

## 构建输出

### 开发构建
- `dist/` - Web 应用构建输出
- `dist-electron/` - Electron 主进程构建输出

### 生产构建
- `release/win-unpacked/` - Windows 便携版
- `release/` - 其他平台的打包文件

## 注意事项

1. **首次运行**: 需要先运行 `npm run build:electron` 构建主进程
2. **开发调试**: 使用 `npm run electron:dev` 进行开发，支持热重载
3. **文件权限**: Electron 应用可能需要文件读写权限
4. **安全策略**: 遵循 Electron 安全最佳实践，启用了上下文隔离
5. **平台兼容**: 代码同时支持 Web 和 Electron 环境

## 常见问题

### Q: 如何切换到 Web 版本？
A: 直接运行 `npm run dev`，在浏览器中打开 `http://localhost:5173`

### Q: 如何调试 Electron 应用？
A: 使用 `npm run electron:dev`，按 `Ctrl+Shift+D` 打开开发者工具

### Q: 如何分发应用？
A: 运行 `npm run dist:electron` 生成安装包

### Q: 设置数据存储在哪里？
A: 
- Web 版本: `localStorage`
- Electron 版本: `~/.md-editor/settings.json`

### Q: 如何添加新的平台特定功能？
A: 在 `src/utils/platform.ts` 中添加新的适配器类
