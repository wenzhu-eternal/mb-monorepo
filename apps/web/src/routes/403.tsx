import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button, Result } from 'antd'

export const Route = createFileRoute('/403')({
  component: ForbiddenPage,
})

function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => navigate({ to: '/dashboard' })}>
            Back Home
          </Button>
        }
      />
    </div>
  )
}
