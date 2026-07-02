export type ApiResponse<T = unknown> = {
  code: number
  message: string
  data?: T
}

export type AsyncResponse<T = unknown> = Promise<ApiResponse<T>>

export type IdParams = {
  id: string
}
