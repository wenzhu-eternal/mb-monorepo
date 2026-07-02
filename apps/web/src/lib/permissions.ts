export const Permissions = {
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  FILE_VIEW: 'file:view',
  FILE_UPLOAD: 'file:upload',
} as const

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions]
