import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button, Form, Input, message, Typography } from 'antd'
import { useLogin } from '@/hooks/use-auth'

const { Title } = Typography

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm<{ username: string; password: string }>()

  const onSubmit = async (values: { username: string; password: string }) => {
    try {
      await loginMutation.mutateAsync(values)
      messageApi.success('登录成功')
      navigate({ to: '/dashboard' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败，请检查账号密码'
      messageApi.error(msg)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      {contextHolder}
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <Title level={2} className="text-center mb-8">
          MB 管理后台登录
        </Title>
        <Form form={form} onFinish={onSubmit} layout="vertical" autoComplete="off">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 50, message: '用户名长度 3-50 个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 100, message: '密码至少 6 个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loginMutation.isPending} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
