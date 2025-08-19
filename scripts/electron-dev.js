#!/usr/bin/env node

import { spawn } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// 启动 Vite 开发服务器
const vite = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: projectRoot
})

// 等待 Vite 服务器启动
let viteReady = false

const checkVite = () => {
  const req = http.get('http://localhost:5173', (res) => {
    if (!viteReady) {
      viteReady = true
      console.log('Vite server is ready, starting Electron...')
      
      // 启动 Electron
      const electron = spawn('electron', ['dist-electron/main.cjs'], {
        stdio: 'inherit',
        shell: true,
        cwd: projectRoot,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          VITE_DEV_SERVER_URL: 'http://localhost:5173'
        }
      })

      electron.on('close', () => {
        console.log('Electron closed, stopping Vite...')
        vite.kill()
        process.exit(0)
      })
    }
  })

  req.on('error', () => {
    if (!viteReady) {
      setTimeout(checkVite, 1000)
    }
  })
}

// 开始检查 Vite 服务器
setTimeout(checkVite, 2000)

// 处理退出信号
process.on('SIGINT', () => {
  console.log('Stopping development servers...')
  vite.kill()
  process.exit(0)
})
