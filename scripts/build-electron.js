#!/usr/bin/env node

import { execSync } from 'child_process'
import { renameSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

try {
  console.log('Building Electron...')
  
  // 编译 TypeScript
  execSync('npx tsc -p tsconfig.electron.json', { 
    cwd: projectRoot, 
    stdio: 'inherit' 
  })
  
  // 重命名文件为 .cjs 以避免 ES 模块问题
  const mainJsPath = join(projectRoot, 'dist-electron', 'main.js')
  const mainCjsPath = join(projectRoot, 'dist-electron', 'main.cjs')
  
  if (existsSync(mainJsPath)) {
    renameSync(mainJsPath, mainCjsPath)
    console.log('Renamed main.js to main.cjs')
  }
  
  const preloadJsPath = join(projectRoot, 'dist-electron', 'preload.js')
  const preloadCjsPath = join(projectRoot, 'dist-electron', 'preload.cjs')
  
  if (existsSync(preloadJsPath)) {
    renameSync(preloadJsPath, preloadCjsPath)
    console.log('Renamed preload.js to preload.cjs')
  }
  
  console.log('Electron build completed!')
  
} catch (error) {
  console.error('Build failed:', error.message)
  process.exit(1)
}
