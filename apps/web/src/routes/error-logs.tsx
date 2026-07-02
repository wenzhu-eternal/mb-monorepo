import { createFileRoute } from '@tanstack/react-router'
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import {
  useDeleteErrorLog,
  useErrorLogs,
  type ErrorLog,
} from '@/hooks/use-logs'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'

const { Title, Text, Paragraph } = Typography

export const Route = createFileRoute('/error-logs')({
  component: ErrorLogsPage,
})

function ErrorLogsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState<string | undefined>(undefined)
  const [searchInput, setSearchInput] = useState('')
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)

  const { data, isLoading, isError, error } = useErrorLogs({
    page,
    pageSize,
    keyword,
  })
  const deleteMutation = useDeleteErrorLog()

  const columns: ColumnsType<ErrorLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '消息',
      dataIndex: 'message',
      ellipsis: true,
      render: (v: string) => <Text type="danger">{v}</Text>,
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      width: 80,
      render: (v: number | null) => v ?? '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      render: (v: string | null) => v ?? '-',
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, record: ErrorLog) => (
        <Space>
          <Button size="small" onClick={() => setSelectedLog(record)}>
            详情
          </Button>
          <Popconfirm
            title="确认删除该错误日志？"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Title level={3}>错误日志</Title>

      <Alert
        message="错误日志记录系统 5xx 异常和未捕获运行时错误"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {isError && (
        <Alert
          message="加载失败"
          description={(error as Error)?.message ?? '未知错误'}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索错误消息"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(v) => {
              setKeyword(v || undefined)
              setPage(1)
            }}
            style={{ width: 300 }}
            allowClear
          />
        </Space>

        <Table<ErrorLog>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          locale={{ emptyText: <Empty description="暂无错误日志" /> }}
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

      <Drawer
        title="错误详情"
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        width={640}
      >
        {selectedLog && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>消息：</Text>
              <Paragraph type="danger">{selectedLog.message}</Paragraph>
            </div>
            <div>
              <Text strong>用户ID：</Text>
              <Text>{selectedLog.userId ?? '-'}</Text>
            </div>
            <div>
              <Text strong>IP：</Text>
              <Text>{selectedLog.ip ?? '-'}</Text>
            </div>
            <div>
              <Text strong>UserAgent：</Text>
              <Text>{selectedLog.userAgent ?? '-'}</Text>
            </div>
            <div>
              <Text strong>时间：</Text>
              <Text>{new Date(selectedLog.createdAt).toLocaleString('zh-CN')}</Text>
            </div>
            <div>
              <Text strong>堆栈：</Text>
              <Paragraph>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    overflow: 'auto',
                    fontSize: 12,
                    maxHeight: 320,
                  }}
                >
                  {selectedLog.stack ?? '无堆栈信息'}
                </pre>
              </Paragraph>
            </div>
            <div>
              <Text strong>上下文：</Text>
              <Paragraph>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    overflow: 'auto',
                    fontSize: 12,
                    maxHeight: 240,
                  }}
                >
                  {JSON.stringify(selectedLog.context, null, 2)}
                </pre>
              </Paragraph>
            </div>
          </Space>
        )}
      </Drawer>
    </AuthenticatedLayout>
  )
}
