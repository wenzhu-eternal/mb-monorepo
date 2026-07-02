export const ErrorCodes = {
  // 通用错误
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,

  // 用户相关
  USER_NOT_FOUND: 1001,
  USER_ALREADY_EXISTS: 1002,
  USER_DISABLED: 1003,
  INVALID_PASSWORD: 1004,
  INVALID_TOKEN: 1005,
  TOKEN_EXPIRED: 1006,
  REFRESH_TOKEN_INVALID: 1007,

  // 角色相关
  ROLE_NOT_FOUND: 2001,
  ROLE_ALREADY_EXISTS: 2002,

  // 文件相关
  FILE_NOT_FOUND: 3001,
  FILE_TOO_LARGE: 3002,
  INVALID_FILE_TYPE: 3003,

  // 业务相关
  OPERATION_FAILED: 4001,
  VALIDATION_FAILED: 4002,
  RATE_LIMIT_EXCEEDED: 4003,
} as const

export const ErrorMessages = {
  [ErrorCodes.SUCCESS]: 'Success',
  [ErrorCodes.BAD_REQUEST]: 'Bad request',
  [ErrorCodes.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCodes.FORBIDDEN]: 'Forbidden',
  [ErrorCodes.NOT_FOUND]: 'Not found',
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCodes.USER_DISABLED]: 'User is disabled',
  [ErrorCodes.INVALID_PASSWORD]: 'Invalid password',
  [ErrorCodes.INVALID_TOKEN]: 'Invalid token',
  [ErrorCodes.TOKEN_EXPIRED]: 'Token expired',
  [ErrorCodes.REFRESH_TOKEN_INVALID]: 'Refresh token invalid',
  [ErrorCodes.ROLE_NOT_FOUND]: 'Role not found',
  [ErrorCodes.ROLE_ALREADY_EXISTS]: 'Role already exists',
  [ErrorCodes.FILE_NOT_FOUND]: 'File not found',
  [ErrorCodes.FILE_TOO_LARGE]: 'File too large',
  [ErrorCodes.INVALID_FILE_TYPE]: 'Invalid file type',
  [ErrorCodes.OPERATION_FAILED]: 'Operation failed',
  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
} as const
