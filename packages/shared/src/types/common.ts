export type ApiResponse<T = unknown> = {
  code: number
  message: string
  data?: T
}
