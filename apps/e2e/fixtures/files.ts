import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * 测试文件夹具：在系统 tmp 目录下生成小文件供上传测试使用
 * 避免 e2e 仓库入库二进制文件
 */

const TMP = tmpdir()

/**
 * 1x1 透明 PNG（最小合法 PNG，~70 字节）
 */
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

export function makePngFile(filename = 'e2e-test.png'): string {
  const filepath = join(TMP, filename)
  writeFileSync(filepath, PNG_BYTES)
  return filepath
}

/**
 * 普通文本文件
 */
export function makeTxtFile(content = 'e2e test content', filename = 'e2e-test.txt'): string {
  const filepath = join(TMP, filename)
  writeFileSync(filepath, content, 'utf-8')
  return filepath
}

/**
 * 非法文件类型（.exe 内容但扩展名伪装为 .png，用于测试文件内容校验）
 */
export function makeFakeFile(filename = 'e2e-fake.png'): string {
  const filepath = join(TMP, filename)
  writeFileSync(filepath, 'This is not a real PNG file content')
  return filepath
}
