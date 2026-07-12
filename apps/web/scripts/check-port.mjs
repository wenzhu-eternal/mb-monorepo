/**
 * 端口预检：启动 vite 前检查 3000 端口是否被占用
 * 避免端口冲突时 turbo 只显示 exit code 1，看不到 vite 的真实错误
 */
import { createServer } from 'node:net'

const PORT = 3000

const server = createServer()

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n\x1b[31m[端口冲突]\x1b[0m 端口 ${PORT} 已被占用。`)
    console.error(`\n  请释放该端口后重试，或修改 vite.config.ts 中的 server.port。`)
    console.error(`  查找占用进程: lsof -i :${PORT}\n`)
    process.exit(1)
  }
  console.error(err)
  process.exit(1)
})

server.once('listening', () => {
  // 必须在 close 回调中退出，确保端口完全释放后再交给 vite
  server.close(() => {
    process.exit(0)
  })
})

server.listen(PORT)
