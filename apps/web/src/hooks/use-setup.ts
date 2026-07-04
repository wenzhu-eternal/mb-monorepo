import type { ApiResponse, Setup, SetupStatus } from '@shared'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useSetupStatus = () =>
  useQuery({
    queryKey: ['setup', 'status'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SetupStatus>>('/api/v1/setup/status')
      return response.data.data!
    },
    retry: false,
  })

export const useSetup = () =>
  useMutation({
    mutationFn: async (data: Setup) => {
      const response = await api.post<ApiResponse<{ message: string; adminUsername: string }>>(
        '/api/v1/setup',
        data,
      )
      return response.data.data!
    },
  })
