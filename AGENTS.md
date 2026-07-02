# MB 全栈 Monorepo 项目指引

## 项目概览

- **类型**: 全栈 monorepo，前后端共享 zod 契约
- **技术栈**: React 19 + NestJS 11 + Drizzle + PostgreSQL + TanStack + antd6 + Tailwind v4
- **目标**: 可复用的中后台全栈脚手架，端到端类型安全

## 目录约定

```
mb-monorepo/
├── apps/
│   ├── web/          # 前端 (React 19 + Vite 8 + antd6 + TanStack)
│   └── server/       # 后端 (NestJS 11 + Drizzle + PostgreSQL)
├── packages/
│   ├── shared/       # zod schemas + 派生类型 + 常量/错误码
│   └── config/       # 共享 biome/tsconfig
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── biome.json
```

## 契约铁律

1. **改 API 必须先改 `packages/shared/schemas`**
2. **禁止前端手抄类型** - 所有类型从 shared 导出
3. **禁止后端绕过 zod 自定义 DTO** - 使用 nestjs-zod 桥接
4. **错误码集中到 shared** - 前后端共享

## 数据库铁律

1. **禁止 `synchronize`** - 所有表结构变更走 `drizzle-kit generate` 迁移
2. **表名使用 snake_case 复数** - `users` / `roles` / `error_logs`
3. **使用 PostgreSQL** - JSONB 存可变结构

## 命名规范

- **文件**: 模块单文件 `{module}.ts`; drizzle 表定义用 `*.schema.ts`; TanStack Router 路由用 `*.route.ts`
- **类**: `{Resource}{Type}` 驼峰后缀 - `UserController` / `UserService`
- **DTO**: `{Action}{Resource}Dto` - `CreateUserDto` / `LoginDto` (全部命名导出)
- **Provider/Module**: 命名导出 + 模块聚合 (`index.module.ts`)

## 命令速查

```bash
# 开发
pnpm dev                    # 启动所有服务
pnpm dev --filter=web       # 只启动前端
pnpm dev --filter=server    # 只启动后端

# 构建
pnpm build                  # 构建所有包

# 测试
pnpm test                   # 运行所有测试

# Lint
pnpm lint                   # 检查所有包
pnpm lint:fix               # 自动修复
pnpm format                 # 格式化代码

# 数据库
pnpm db:generate            # 生成迁移文件
pnpm db:migrate             # 执行迁移
pnpm db:seed                # 种子数据

# Docker
docker compose up           # 启动所有服务
docker compose up postgres  # 只启动数据库
docker compose up redis     # 只启动 Redis
```

## 测试要求

1. **新增 service/controller 必须配套单测**
2. **bug 修复先写复现测试**
3. **所有 AI 改动须经 `pnpm test` + Biome 通过方可提交**

## 开发流程

1. **先描述后编码**: 编写任何代码前，先描述方案并等待批准
2. **需求模糊时先澄清**: 提出澄清问题，确认后再动手
3. **任务拆分**: 修改超过 3 个文件时，先停止并拆分成更小的任务
4. **被纠正即反思**: 反思错误原因并制定永不再犯的对策

## 环境要求

- **包管理器**: pnpm (优先)
- **终端**: zsh
- **系统工具**: 优先使用 brew 安装
- **Node.js**: >= 20.0.0
- **PostgreSQL**: 16
- **Redis**: 7

## 参考文档

- [重构计划](./docs/REFACTOR_PLAN.md)
- [架构设计](./docs/ARCHITECTURE.md)
- [antd v6 迁移指南](https://ant.design/docs/react/migration-v6/)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs)
- [TanStack Router](https://tanstack.com/router/latest)