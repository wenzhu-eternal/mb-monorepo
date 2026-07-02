import type { ApiResponse, PaginatedResponse } from '@shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// 日志查询参数（不使用 shared 的 PaginationQuery，避免 order 必填约束）
export interface LogQuery {
  page: number
  pageSize: number
  keyword?: string
}

// 审计日志
export interface AuditLog {
  id: number
  userId: number
  action: string
  resource: string
  resourceId: number | null
  oldValue: unknown
  newValue: unknown
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export const useAuditLogs = (params: LogQuery) => {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>(
        '/api/v1/audit-logs',
        { params },
      )
      return response.data.data!
    },
  })
}

// 错误日志
export interface ErrorLog {
  id: number
  message: string
  stack: string | null
  context: unknown
  userId: number | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export type ErrorLogQuery = LogQuery

export const useErrorLogs = (params: ErrorLogQuery) => {
  return useQuery({
    queryKey: ['error-logs', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<ErrorLog>>>(
        '/api/v1/error-logs',
        { params },
      )
      return response.data.data!
    },
  })
}

export const useDeleteErrorLog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/error-logs/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] })
    },
  })
}

// 角色
export interface Role {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export const useRoles = (params: LogQuery) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<Role>>>(
        '/api/v1/roles',
        { params },
      )
      return response.data.data!
    },
  })
}
