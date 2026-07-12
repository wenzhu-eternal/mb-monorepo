// 用 TypeScript compiler API 扫描项目源码中调用了 @deprecated 符号的位置
// 这是 tsc --noEmit 不会输出、但 IDE 会划删除线的部分
// 用法: node scripts/check-deprecated.cjs
// 退出码: 0 未发现，非 0 表示有 @deprecated 调用
const ts = require('typescript')
const { resolve, dirname, join } = require('node:path')
const { readFileSync, readdirSync, statSync } = require('node:fs')

function collectTsFiles(dir, roots) {
  const result = []
  const skip = new Set(['node_modules', 'dist', '.turbo', 'coverage', '.git'])
  for (const root of roots) {
    walk(resolve(dir, root))
  }
  function walk(d) {
    let entries
    try {
      entries = readdirSync(d)
    } catch {
      return
    }
    for (const name of entries) {
      if (skip.has(name)) continue
      const full = join(d, name)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) {
        walk(full)
      } else if (st.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
        result.push(full)
      }
    }
  }
  return result
}

function loadOptions(tsconfigPath) {
  const absPath = resolve(tsconfigPath)
  const configFile = ts.readConfigFile(absPath, (p) => readFileSync(p, 'utf8'))
  const baseDir = dirname(absPath)
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, baseDir)
  return { options: { ...parsed.options, noEmit: true, incremental: false }, baseDir }
}

function scan(label, tsconfigPath, fileRoots) {
  const { options, baseDir } = loadOptions(tsconfigPath)
  const files = collectTsFiles(baseDir, fileRoots)
  const program = ts.createProgram({ rootNames: files, options })
  const projectRoot = resolve(baseDir, '..')

  let found = 0
  const seen = new Set()

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue
    const fileName = sourceFile.fileName
    if (!fileName.includes('/apps/') && !fileName.includes('/packages/shared/')) continue

    const diagnostics = [
      ...program.getSemanticDiagnostics(sourceFile),
      ...program.getSuggestionDiagnostics(sourceFile),
    ]

    for (const diag of diagnostics) {
      if (!diag.tags || !diag.tags.includes(ts.DiagnosticTag.Deprecated)) continue
      const file = diag.file || sourceFile
      const pos = file.getLineAndCharacterOfPosition(diag.start || 0)
      const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n')
      const rel = file.fileName.replace(projectRoot + '/', '')
      const key = `${rel}:${pos.line + 1}:${pos.character + 1}`
      if (seen.has(key)) continue
      seen.add(key)
      console.log(`  ${key}  ${message}`)
      found++
    }
  }

  console.log(`[${label}] @deprecated 调用: ${found} 处（扫描 ${files.length} 文件）`)
  return found
}

const base = process.cwd()
let total = 0

const targets = [
  { label: 'web', tsconfig: 'apps/web/tsconfig.json', roots: ['src'] },
  { label: 'server', tsconfig: 'apps/server/tsconfig.json', roots: ['src', 'test'] },
  { label: 'shared', tsconfig: 'packages/shared/tsconfig.json', roots: ['src'] },
]

for (const t of targets) {
  console.log(`\n━━━ 扫描 ${t.label} ━━━`)
  total += scan(t.label, t.tsconfig, t.roots)
}

console.log('\n━━━ 汇总 ━━━')
if (total === 0) {
  console.log('✅ 未发现任何 @deprecated 调用')
  process.exit(0)
} else {
  console.log(`❌ 共发现 ${total} 处 @deprecated 调用，需修复`)
  process.exit(1)
}
