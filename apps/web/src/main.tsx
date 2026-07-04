import { createRouter, RouterProvider } from '@tanstack/react-router'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { installGlobalErrorHandlers } from '@/lib/error-reporter'
import './index.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// MSW 仅在显式开启 mock 时启用（VITE_ENABLE_MOCK=true），避免开发环境总拦截请求
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
  return undefined
}

const rootElement = document.getElementById('root')!

enableMocking().then(() => {
  installGlobalErrorHandlers()
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
})
