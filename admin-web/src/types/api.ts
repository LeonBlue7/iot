export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
}

export interface ApiListResponse<T = unknown> {
  success: true
  data: T[]
  page: number
  limit: number
  total: number
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// Helper type for API responses with error handling
export type ApiResult<T> = (ApiSuccessResponse<T> | ApiErrorResponse) & {
  error?: string
}
