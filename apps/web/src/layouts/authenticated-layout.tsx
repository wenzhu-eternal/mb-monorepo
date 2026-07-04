import {
  DashboardOutlined,
  FileOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from '@tanstack/react-router'
import type { MenuProps } from 'antd'
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useLogout } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth-store'

const { Sider, Header, Content } = Layout
const { Text } = Typography

/**
 * 外层守卫: 未认证直接 redirect 并返回 null，不挂任何业务 hook
 */
export const AuthenticatedLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    navigate({ to: '/login', replace: true })
    return null
  }

  return <AuthenticatedLayoutInner>{children}</AuthenticatedLayoutInner>
}

/**
 * 内层: 已认证后才渲染
 * 布局: Sider 固定左侧，Header 固定顶部，只有 Content 区滚动
 */
function AuthenticatedLayoutInner({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const logoutMutation = useLogout()
  const user = useAuthStore((state) => state.user)
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/users', icon: <UserOutlined />, label: '用户管理' },
    { key: '/files', icon: <FileOutlined />, label: '文件管理' },
    { key: '/audit-logs', icon: <FileTextOutlined />, label: '审计日志' },
    { key: '/error-logs', icon: <WarningOutlined />, label: '错误日志' },
    { key: '/websocket', icon: <ThunderboltOutlined />, label: 'WebSocket 演示' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate({ to: key })
  }

  const handleLogout = () => {
    logoutMutation.mutate()
    navigate({ to: '/login' })
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="h-screen">
      <Sider
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="h-8 m-4 text-white text-center font-bold leading-8 overflow-hidden">
          {collapsed ? (
            <span className="text-lg">M</span>
          ) : (
            <span className="text-lg">MB Admin</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%',
            background: '#001529',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="cursor-pointer">
              <Avatar size="small" icon={<UserOutlined />} />
              <Text style={{ color: '#ffffff' }}>{user?.nickname || user?.username || '用户'}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content className="m-4 p-6 bg-white rounded-lg overflow-y-auto">{children}</Content>
      </Layout>
    </Layout>
  )
}
