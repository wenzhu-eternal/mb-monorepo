import { normalUser, targetUser } from '@e2e/fixtures/users'
import { apiClient } from './api'

/**
 * 数据清理辅助：在测试间清理 e2e 创建的数据
 *
 * 策略：按用户名前缀 `e2e-` 删除临时用户/角色/权限
 * 不删除 admin 账号和 seed 创建的默认数据
 * 不删除 normalUser/targetUser 夹具账号（由 global-setup 创建，长期复用）
 */

const E2E_PREFIX = 'e2e-'

// 夹具账号：global-setup 创建后长期复用，cleanup 不应清理
const PROTECTED_USERS: Set<string> = new Set([normalUser.username, targetUser.username])

/**
 * 清理所有 e2e- 前缀的临时用户（排除夹具账号 normalUser/targetUser）
 */
export async function cleanupTempUsers() {
  const { data } = await apiClient.get<{
    list: Array<{ id: number; username: string }>
  }>('/users?pageSize=100')

  const tempUsers = data.list.filter(
    (u) => u.username.startsWith(E2E_PREFIX) && !PROTECTED_USERS.has(u.username),
  )
  for (const user of tempUsers) {
    await apiClient.delete(`/users/${user.id}`).catch(() => {})
  }
}

/**
 * 清理所有 e2e- 前缀的临时文件记录
 * 注意：磁盘文件移到 uploads-trash 后由运维清理，e2e 不负责清理磁盘
 */
export async function cleanupTempFiles() {
  const { data } = await apiClient.get<{
    list: Array<{ id: number; originalName: string }>
  }>('/files?pageSize=100')

  const tempFiles = data.list.filter((f) => f.originalName.startsWith(E2E_PREFIX))
  for (const file of tempFiles) {
    await apiClient.delete(`/files/${file.id}`).catch(() => {})
  }
}

/**
 * 清理所有 e2e- 前缀的临时角色
 */
export async function cleanupTempRoles() {
  const { data } = await apiClient.get<{
    list: Array<{ id: number; name: string }>
  }>('/roles?pageSize=100')

  const tempRoles = data.list.filter((r) => r.name.startsWith(E2E_PREFIX))
  for (const role of tempRoles) {
    await apiClient.delete(`/roles/${role.id}`).catch(() => {})
  }
}

/**
 * 清理所有 e2e 前缀的临时权限（兼容 e2e: 和 e2e_ 两种前缀）
 */
export async function cleanupTempPermissions() {
  const { data } = await apiClient.get<{
    list: Array<{ id: number; code: string }>
  }>('/permissions?pageSize=100')

  const tempPerms = data.list.filter((p) => p.code.startsWith('e2e:') || p.code.startsWith('e2e_'))
  for (const perm of tempPerms) {
    await apiClient.delete(`/permissions/${perm.id}`).catch(() => {})
  }
}

/**
 * 全量清理（global-teardown 调用）
 */
export async function cleanupAll() {
  await cleanupTempFiles().catch(() => {})
  await cleanupTempUsers().catch(() => {})
  await cleanupTempRoles().catch(() => {})
  await cleanupTempPermissions().catch(() => {})
}
