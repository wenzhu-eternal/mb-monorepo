import { DashboardOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { FileTextOutlined, WarningOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useLogout } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth-store'

const { Sider, Header, Content } = Layout
const { Text } = Typography

export const AuthenticatedLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const logoutMutation = useLogout()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const [collapsed, setCollapsed] = useState(false)

  if (!isAuthenticated) {
    navigate({ to: '/login', replace: true })
    return null
  }

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/audit-logs',
      icon: <FileTextOutlined />,
      label: '审计日志',
    },
    {
      key: '/error-logs',
      icon: <WarningOutlined />,
      label: '错误日志',
    },
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
      <Sider theme="dark" collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="h-8 m-4 text-white text-center font-bold leading-8 overflow-hidden">
          {collapsed ? <span className="text-lg">M</span> : <span className="text-lg">MB Admin</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex items-center justify-end" style={{ background: '#001529' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="cursor-pointer">
              <Avatar size="small" icon={<UserOutlined />} />
              <Text style={{ color: '#ffffff' }}>
                {user?.nickname || user?.username || '用户'}
              </Text>
            </Space>
          </Dropdown>
        </Header>
        <Content className="m-4 p-6 bg-white rounded-lg">{children}</Content>
      </Layout>
    </Layout>
  )
}
