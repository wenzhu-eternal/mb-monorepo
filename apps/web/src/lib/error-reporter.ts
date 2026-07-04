import { api } from '@/lib/api'

interface ReportErrorPayload {
  source: 'frontend' | 'backend' | 'taro'
  errorType?: 'js_error' | 'http_error' | 'unhandled_promise' | 'resource_error' | 'api_error'
  message: string
  stack?: string
  file?: string
  line?: number
  column?: number
  url?: string
  method?: string
  statusCode?: number
  context?: Record<string, unknown>
}

/**
 * 上报前端错误到后端
 * 静默失败，不影响用户使用
 */
export async function reportFrontendError(payload: ReportErrorPayload): Promise<void> {
  try {
    await api.post('/api/v1/error-logs/report', payload)
  } catch {
    // 静默失败，不影响用户
  }
}

/**
 * 安装全局错误捕获器
 * 捕获 JS 运行时错误、未处理 Promise 异常、资源加载失败
 */
export function installGlobalErrorHandlers(): void {
  // JS 运行时错误
  window.onerror = (message, source, lineno, colno, error) => {
    reportFrontendError({
      source: 'frontend',
      errorType: 'js_error',
      message: String(message),
      stack: error?.stack,
      file: source ?? undefined,
      line: lineno ?? undefined,
      column: colno ?? undefined,
      url: window.location.href,
    })
  }

  // 未处理 Promise 异常
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    reportFrontendError({
      source: 'frontend',
      errorType: 'unhandled_promise',
      message: reason?.message ?? String(reason),
      stack: reason?.stack,
      url: window.location.href,
    })
  })

  // 资源加载失败（图片、脚本、样式等）
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement
      if (target?.tagName === 'IMG' || target?.tagName === 'SCRIPT' || target?.tagName === 'LINK') {
        reportFrontendError({
          source: 'frontend',
          errorType: 'resource_error',
          message: `资源加载失败: ${(target as HTMLImageElement).src ?? target.getAttribute('href') ?? 'unknown'}`,
          url: window.location.href,
        })
      }
    },
    true,
  )
}
