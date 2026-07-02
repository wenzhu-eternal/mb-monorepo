import { createFileRoute } from '@tanstack/react-router'
import { Button, Typography } from 'antd'

const { Title, Paragraph } = Typography

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Title level={1}>MB Admin</Title>
      <Paragraph>全栈 monorepo - 前后端共享 zod 契约</Paragraph>
      <Button type="primary" href="/dashboard">
        开始使用
      </Button>
    </div>
  )
}
