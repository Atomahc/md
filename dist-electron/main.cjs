const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron');
const { join } = require('node:path');
const { readFile, writeFile, mkdir } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { homedir } = require('node:os');
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
/** @type {Electron.BrowserWindow | null} */
let mainWindow = null;
// 应用数据目录
const APP_DATA_DIR = join(homedir(), '.md-editor');
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        frame: false, // 隐藏窗口边框和标题栏
        titleBarStyle: 'hidden', // 隐藏标题栏
        autoHideMenuBar: true, // 自动隐藏菜单栏
        webPreferences: {
            preload: join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: !isDev,
        },
        icon: join(__dirname, '../../public/mpmd/icon-256.png'),
        show: false, // 先隐藏，等加载完成后再显示
    });
    // 窗口准备好后显示
    if (mainWindow) {
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
            if (isDev) {
                mainWindow.webContents.openDevTools();
            }
        });
    }
    // 加载应用
    if (VITE_DEV_SERVER_URL) {
        if (mainWindow) {
            mainWindow.loadURL(VITE_DEV_SERVER_URL);
        }
    }
    else {
        if (mainWindow) {
            mainWindow.loadFile(join(__dirname, '../dist/index.html'));
        }
    }
    // 窗口关闭事件
    if (mainWindow) {
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
        // 拦截新窗口打开，使用外部浏览器
        mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
    }
}
// IPC 处理程序
function setupIPC() {
    // 文件操作
    ipcMain.handle('save-file', async (event, content, filePath) => {
        try {
            let savePath = filePath;
            if (!savePath) {
                const result = await dialog.showSaveDialog(mainWindow, {
                    defaultPath: 'document.md',
                    filters: [
                        { name: 'Markdown', extensions: ['md'] },
                        { name: '所有文件', extensions: ['*'] }
                    ]
                });
                if (result.canceled)
                    return null;
                savePath = result.filePath;
            }
            await writeFile(savePath, content, 'utf-8');
            return savePath;
        }
        catch (error) {
            throw new Error(`保存文件失败: ${error}`);
        }
    });
    ipcMain.handle('open-file', async () => {
        try {
            const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                filters: [
                    { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
                    { name: '所有文件', extensions: ['*'] }
                ]
            });
            if (result.canceled)
                return null;
            const filePath = result.filePaths[0];
            const content = await readFile(filePath, 'utf-8');
            return { filePath, content };
        }
        catch (error) {
            throw new Error(`打开文件失败: ${error}`);
        }
    });
    // 图片保存
    ipcMain.handle('save-image', async (event, buffer, filename) => {
        try {
            const imagesDir = join(APP_DATA_DIR, 'images');
            if (!existsSync(imagesDir)) {
                await mkdir(imagesDir, { recursive: true });
            }
            const imagePath = join(imagesDir, filename);
            await writeFile(imagePath, buffer);
            return `file://${imagePath}`;
        }
        catch (error) {
            throw new Error(`保存图片失败: ${error}`);
        }
    });
    // 设置管理
    ipcMain.handle('get-settings', async () => {
        try {
            if (!existsSync(APP_DATA_DIR)) {
                await mkdir(APP_DATA_DIR, { recursive: true });
            }
            const settingsPath = join(APP_DATA_DIR, 'settings.json');
            if (!existsSync(settingsPath)) {
                return {};
            }
            const content = await readFile(settingsPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error('读取设置失败:', error);
            return {};
        }
    });
    ipcMain.handle('save-settings', async (event, settings) => {
        try {
            if (!existsSync(APP_DATA_DIR)) {
                await mkdir(APP_DATA_DIR, { recursive: true });
            }
            const settingsPath = join(APP_DATA_DIR, 'settings.json');
            await writeFile(settingsPath, JSON.stringify(settings, null, 2));
            return true;
        }
        catch (error) {
            throw new Error(`保存设置失败: ${error}`);
        }
    });
    // 获取应用信息
    ipcMain.handle('get-app-info', () => {
        return {
            name: app.getName(),
            version: app.getVersion(),
            platform: process.platform,
            isElectron: true
        };
    });
    // 选择文件夹
    ipcMain.handle('select-directory', async () => {
        try {
            const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openDirectory']
            });
            if (result.canceled)
                return null;
            return result.filePaths[0];
        }
        catch (error) {
            throw new Error(`选择文件夹失败: ${error}`);
        }
    });
    // 窗口控制
    ipcMain.handle('window-minimize', () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });
    ipcMain.handle('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.restore();
            }
            else {
                mainWindow.maximize();
            }
        }
    });
    ipcMain.handle('window-close', () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });
    ipcMain.handle('window-is-maximized', () => {
        return mainWindow ? mainWindow.isMaximized() : false;
    });
}
// 应用事件
app.whenReady().then(() => {
    createWindow();
    setupIPC();
    // 注册全局快捷键
    globalShortcut.register('CommandOrControl+Shift+D', () => {
        if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
        }
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
// 处理应用协议
app.setAsDefaultProtocolClient('md-editor');
