import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ConfigProvider } from 'antd'
import { QueryProvider } from '@/components/query-provider'

export const Route = createRootRoute({
  component: () => (
    <QueryProvider>
      <ConfigProvider
        theme={{
          cssVar: {},
          token: {
            colorPrimary: '#1677ff',
          },
        }}
      >
        <Outlet />
      </ConfigProvider>
    </QueryProvider>
  ),
})
