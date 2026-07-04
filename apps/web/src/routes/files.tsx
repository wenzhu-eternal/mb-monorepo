import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { UploadProps } from 'antd'
import {
  Alert,
  Button,
  Card,
  Empty,
  Image,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import {
  downloadFile,
  type FileItem,
  previewFile,
  useDeleteFile,
  useFiles,
} from '@/hooks/use-files'
import { api } from '@/lib/api'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'

const { Title, Text } = Typography

export const Route = createFileRoute('/files')({
  component: FilesPage,
})

function FilesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useFiles({ page, pageSize })
  const deleteMutation = useDeleteFile()

  const uploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const token = localStorage.getItem('auth-storage')
          ? JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token
          : ''
        await api.post('/api/v1/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
        onSuccess?.({})
        queryClient.invalidateQueries({ queryKey: ['files'] })
        message.success('上传成功')
      } catch (err: any) {
        onError?.(err)
        message.error(`上传失败: ${err?.response?.data?.message ?? err?.message ?? '未知错误'}`)
      }
    },
  }

  const handlePreview = async (record: FileItem) => {
    try {
      const url = await previewFile(record.id)
      setPreviewUrl(url)
    } catch (err) {
      message.error('预览失败')
      console.error(err)
    }
  }

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleDownload = async (record: FileItem) => {
    try {
      await downloadFile(record.id, record.originalName)
      message.success('下载已开始')
    } catch (err) {
      message.error('下载失败')
      console.error(err)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const isImage = (mimeType: string): boolean => mimeType.startsWith('image/')

  const columns: ColumnsType<FileItem> = [
    {
      title: '原文件名',
      dataIndex: 'originalName',
      ellipsis: true,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'mimeType',
      width: 140,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (v: number) => formatSize(v),
    },
    {
      title: '上传者',
      dataIndex: 'uploadedBy',
      width: 80,
      render: (v: number | null) => v ?? '-',
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 200,
      render: (_: unknown, record: FileItem) => (
        <Space>
          {isImage(record.mimeType) && (
            <Button size="small" onClick={() => handlePreview(record)}>
              预览
            </Button>
          )}
          <Button size="small" onClick={() => handleDownload(record)}>
            下载
          </Button>
          <Popconfirm title="确认删除该文件？" onConfirm={() => deleteMutation.mutate(record.id)}>
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
      <Title level={3}>文件管理</Title>

      <Alert
        title="支持上传图片（jpg/png/gif/webp）、文档（pdf/doc/xls）、文本、压缩包等，单文件最大 10MB"
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
        <Space style={{ marginBottom: 16 }}>
          <Upload {...uploadProps}>
            <Button type="primary">上传文件</Button>
          </Upload>
        </Space>

        <Table<FileItem>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          locale={{ emptyText: <Empty description="暂无文件" /> }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 个文件`,
            onChange: (p, s) => {
              setPage(p)
              setPageSize(s)
            },
          }}
        />
      </Card>

      {previewUrl && (
        <Image
          src={previewUrl}
          preview={{
            visible: true,
            onVisibleChange: (visible) => {
              if (!visible) closePreview()
            },
          }}
          style={{ display: 'none' }}
        />
      )}
    </AuthenticatedLayout>
  )
}
