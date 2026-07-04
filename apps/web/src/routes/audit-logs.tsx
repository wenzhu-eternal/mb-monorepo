import { createFileRoute } from '@tanstack/react-router'
import { Alert, Card, Empty, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { type AuditLog, useAuditLogs } from '@/hooks/use-logs'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'

const { Title } = Typography

export const Route = createFileRoute('/audit-logs')({
  component: AuditLogsPage,
})

function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { data, isLoading, isError, error } = useAuditLogs({
    page,
    pageSize,
  })

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    { title: '用户ID', dataIndex: 'userId', width: 80 },
    {
      title: '动作',
      dataIndex: 'action',
      width: 100,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    { title: '资源', dataIndex: 'resource', width: 100 },
    { title: '资源ID', dataIndex: 'resourceId', width: 80 },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      render: (v: string | null) => v ?? '-',
    },
    {
      title: 'UserAgent',
      dataIndex: 'userAgent',
      ellipsis: true,
      render: (v: string | null) => v ?? '-',
    },
  ]

  return (
    <AuthenticatedLayout>
      <Title level={3}>审计日志</Title>

      <Alert
        title="审计日志记录系统中所有写操作（创建/更新/删除）"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {isError && (
        <Alert
          title="加载失败"
          description={(error as Error)?.message ?? '未知错误'}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Table<AuditLog>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          locale={{ emptyText: <Empty description="暂无审计日志" /> }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => {
              setPage(p)
              setPageSize(s)
            },
          }}
        />
      </Card>
    </AuthenticatedLayout>
  )
}
