# 会话记录

> 本文档记录 mb-monorepo 重构项目的开发会话，便于后续回顾和继续。

---

## 会话概要

| 项 | 内容 |
|---|---|
| 日期 | 2026-06-30 ~ 2026-07-01 |
| 目标 | 完成 REFACTOR_PLAN.md 中 S1-S8 步骤 |
| 结果 | 全部完成，后端 API 已可正常运行 |

---

## 已完成步骤

### S1: monorepo 骨架

- 创建 `pnpm-workspace.yaml`、`turbo.json`、`biome.json`
- 创建 `tsconfig.base.json` 共享 TypeScript 配置
- 创建 `docker-compose.yml` (PostgreSQL 16 + Redis 7)
- 创建 `AGENTS.md` 项目指引
- 初始化 `apps/web`、`apps/server`、`packages/shared` 三个包

### S2: 后端 zod 配置校验 + Health 接口

- 创建 `src/config/env.ts` — 使用 zod 校验所有环境变量
- 创建 Vitest 配置
- 实现 `/api/v1/health` 接口（含 DB ping）

### S3: Drizzle Schema + 迁移 + Seed

- 创建 5 个表的 Drizzle schema：
  - `users` — 用户表
  - `roles` — 角色表
  - `error_logs` — 错误日志表
  - `error_whitelist` — 错误白名单表
  - `audit_logs` — 审计日志表
- 生成迁移文件：`drizzle/0000_dark_machine_man.sql`
- 执行迁移，创建表结构
- 创建 `db/seed.ts` 种子脚本（admin 角色 + admin 用户 + 白名单数据）

### S4: Auth 模块

- 实现登录接口 (`POST /api/v1/auth/login`)
- 实现刷新 token 接口 (`POST /api/v1/auth/refresh`)
- 实现登出接口 (`POST /api/v1/auth/logout`)
- 实现获取当前用户接口 (`GET /api/v1/auth/me`)
- 使用 JWT 双 token 机制（access 15min + refresh 7d）
- 使用 argon2 做密码哈希
- 实现 `AuthGuard` 路由守卫

### S5: 共享 Schema + 审计模块

- 在 `packages/shared` 中创建 zod schemas：
  - `auth.schema.ts` — 认证相关
  - `user.schema.ts` — 用户相关
  - `role.schema.ts` — 角色相关
- 实现 `AuditModule` + `AuditInterceptor` 审计拦截器
- 配置全局 `ResponseInterceptor` + `HttpExceptionFilter`

### S6: 前端代码

- 创建 `api.ts` — axios 实例配置
- 创建 `auth-store.ts` — zustand 认证状态管理
- 创建 hooks（useAuth、useUsers 等）
- 创建 TanStack Router 路由配置
- 创建布局组件（RootLayout、AuthLayout）
- 创建 MSW mock 数据

### S7: RBAC 权限

- 实现 `HasPermission` 按钮级权限组件
- 实现 `AuthGuard` 路由级守卫
- 实现 `RoleGuard` 角色守卫
- 创建 403 无权限页面
- 创建 404 页面
- 创建 MSW handlers

### S8: 文档 + CI

- 创建 `docs/ARCHITECTURE.md` 架构文档
- 创建 `.github/workflows/ci.yml` CI 配置
- 创建 `Dockerfile` (server + web)
- 创建 `.env.example` 环境变量示例

---

## 修复的问题

### 1. `import type` vs `import` (NestJS DI)

**问题**: NestJS 依赖注入需要运行时 import，使用 `import type` 会导致 DI 失败。

**影响文件**:
- `apps/server/src/modules/auth/auth.controller.ts` — `AuthService`
- `apps/server/src/modules/users/users.controller.ts` — `UsersService`
- `apps/server/src/modules/auth/auth.service.ts` — `db`
- `apps/server/src/modules/auth/auth.guard.ts` — `JwtService`
- `apps/server/src/modules/health/health.controller.ts` — `HealthService`
- `apps/server/src/common/interceptors/audit.interceptor.ts` — `DATABASE`

**修复**: 将 `import type { XxxService }` 改为 `import { XxxService }`。

### 2. ValidationPipe 冲突

**问题**: `main.ts` 使用标准 `ValidationPipe` + `whitelist: true`，与 nestjs-zod 的 `createZodDto` 冲突，导致请求体字段被过滤。

**错误信息**: `"property username should not exist", "property password should not exist"`

**修复**: 将 `ValidationPipe` 替换为 nestjs-zod 的 `ZodValidationPipe`。

```typescript
// 修复前
import { ValidationPipe } from '@nestjs/common'
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))

// 修复后
import { ZodValidationPipe } from 'nestjs-zod'
app.useGlobalPipes(new ZodValidationPipe())
```

### 3. dotenv 未加载

**问题**: `apps/server/src/db/index.ts` 直接使用 `process.env.DATABASE_URL`，但 dotenv 未在主进程中加载，导致数据库连接失败。

**修复**: 在 `db/index.ts` 顶部添加 `import 'dotenv/config'`。

### 4. 种子脚本密码哈希

**问题**: 种子脚本使用了假的 argon2 hash，导致登录时密码验证失败。

**修复**: 使用真实的 `argon2.hash("admin123")` 生成哈希：

```
$argon2id$v=19$m=65536,t=3,p=4$Bg27npZWqewGK3lVzGxg3Q$FLi41Lj2tS0ZVMmFmiQqxIwqmDmvQAeMa0MRuDrXGkk
```

### 5. tsconfig rootDir 配置

**问题**: 为支持 `@shared/*` 路径别名，`tsconfig.json` 设置 `rootDir: "../.."`，导致 `nest build` 输出路径变为 `dist/apps/server/src/`。

**修复**: 更新 `package.json` 中的 `dev:prod` 脚本：

```json
"dev:prod": "cross-env NODE_ENV=production node dist/apps/server/src/main"
```

---

## 当前状态

### 基础设施

| 服务 | 状态 | 端口 |
|---|---|---|
| PostgreSQL 16 | ✅ 运行中 | 5432 |
| Redis 7 | ✅ 运行中 | 6379 |
| NestJS 后端 | ✅ 可启动 | 3000 |

### 已验证 API

| 接口 | 方法 | 状态 | 说明 |
|---|---|---|---|
| `/api/v1/health` | GET | ✅ | 返回 `{database: "ok"}` |
| `/api/v1/auth/login` | POST | ✅ | 返回 JWT + 用户信息 |
| `/api/v1/users` | GET | ✅ | 需要 Bearer token |
| `/api/docs` | GET | ✅ | Swagger UI |

### 种子数据

| 资源 | 数据 |
|---|---|
| admin 角色 | id=2, name="admin" |
| admin 用户 | username="admin", password="admin123" |
| 错误白名单 | 3 条初始数据 |

---

## 下一步 (S9+)

| 步骤 | 内容 | 优先级 |
|---|---|---|
| S9 | 前端开发服务器集成测试 | 高 |
| S10 | RBAC 权限 CRUD 接口 | 高 |
| S11 | 错误日志管理接口 | 中 |
| S12 | 前端 RBAC 完整联调 | 中 |
| S13 | Playwright/Cypress E2E 测试 | 低 |
| S14 | Docker Compose 一键启动 | 中 |

---

## 关键文件路径

| 文件 | 说明 |
|---|---|
| `apps/server/src/main.ts` | 后端入口 |
| `apps/server/src/app.module.ts` | 根模块 |
| `apps/server/src/config/env.ts` | 环境变量校验 |
| `apps/server/src/db/index.ts` | 数据库连接 |
| `apps/server/src/db/schema/` | Drizzle 表定义 |
| `apps/server/src/db/seed.ts` | 种子脚本 |
| `apps/server/src/modules/auth/` | 认证模块 |
| `apps/server/src/modules/users/` | 用户模块 |
| `apps/server/src/common/` | 公共模块 |
| `packages/shared/src/schemas/` | zod 契约 |
| `docs/REFACTOR_PLAN.md` | 重构计划 |
| `docs/ARCHITECTURE.md` | 架构文档 |

---

## 环境变量

```env
DATABASE_URL=postgresql://mb_user:mb_password@localhost:5432/mb_database
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-key-change-in-production-16chars
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-key-change-in-production-16chars
API_PORT=3000
ALLOW_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## 常用命令

```bash
# 启动后端
cd apps/server && pnpm dev:prod

# 启动前端
cd apps/web && pnpm dev

# 运行种子
cd apps/server && pnpm db:seed

# 重新生成迁移
cd apps/server && pnpm db:generate

# 执行迁移
cd apps/server && pnpm db:migrate

# 构建
pnpm build

# Lint
pnpm lint
```
