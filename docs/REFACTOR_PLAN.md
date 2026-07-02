# MB 全栈重构方案 v1.0

> 将 `mbs`(前端)+ `mbss`(后端)两个独立仓库,重构为一个全栈 monorepo。
> 文档日期:2026-06-29 | 依赖版本以本日 npm registry 核实为准 | 决策人:文竹

---

## 0. 文档说明

- **背景**:`mbs`(React 中后台前端模板)与 `mbss`(NestJS 中后台后端模板)目前是两个独立 Git 仓库,前后端契约靠手抄、类型不同源、没有共享层。
- **目标**:重构为单一 monorepo,**前后端共享 zod 契约、端到端类型安全**,并升级到 2026 年中各赛道最新最优技术栈,作为可复用的中后台全栈脚手架。
- **决策摘要**:后端 NestJS + Drizzle + PostgreSQL + zod(稳健型 A 方案);前端 React19 + antd6 + TanStack Router/Query + Tailwind v4;实时通信保留 socket.io;数据库切 PostgreSQL;工具链 Biome + Turborepo。
- **AI 编码辅助**:开发期使用 OpenCode(开源 AI 编码 agent)+ Trae(字节 AI IDE),项目内置 `AGENTS.md`。

---

## 1. 现状评估

### 1.1 mbs(前端)现状
- **栈**:React 18.3 + TS 5.9 + Vite 4 + Antd5 + ReactRouter6 + axios + zustand + socket.io-client。
- **结构**:`src/{components,layouts,pages,routers,services,utils}` + `config.ts` 统一配置动态路由/菜单。
- **健康度**:RR6/TS5.9 较新;但 Vite4、Vitest1、ESLint8、Prettier2 已落后 1-2 代;Antd 5 落后一个大版本。

### 1.2 mbss(后端)现状
- **栈**:NestJS 11 + TypeORM 0.3 + MySQL2 + ioredis + JWT+express-session + socket.io + swagger + hbs 邮件 + Jest29。
- **结构**:`src/{common,config,modules,templates,utils}` + `modules/{controllers,services,entities,dtos}`,分层清晰、有命名约定。
- **健康度**:NestJS 11 很新;但 TypeORM 停滞、认证 JWT+session 双轨、`synchronize: dev` 自动建表、Jest、`nestjs-config` 均需更新。

### 1.3 核心痛点
1. **前后端割裂**:类型靠手抄,API 契约无单一源。
2. **TypeORM 停滞**:维护不活跃,类型与迁移体验差。
3. **认证双轨**:JWT + express-session 并存,AuthGuard 一套逻辑两套 token。
4. **自动建表**:dev 靠 `synchronize` 改表,生产前必爆。
5. **测试栈不统一**:前端 Vitest,后端 Jest。
6. **工具链分散**:ESLint8 + Prettier2,配置繁。

### 1.4 模块增删清单(脚手架定位补强)

**保留**(原样平移或升级)[I:
- 前端:基础布局、动态菜单、接口服务、WebSocket、高德地图示例、文件上传、时间工具。
- 后端:用户/角色管理、文件上传、错误日志+白名单、WebSocket 网关、邮件、限流、XSS 过滤、定时任务、**WeApp 登录**。

**剔除/精简**(契约同源后变冗余或过度封装):
| 项 | 出处 | 处理 |
|---|---|---|
| `config.ts` 手写动态路由机制 | mbs | 删 — TanStack Router 文件式路由接管 |
| `createApiRoutesJson` 启动导出路由 JSON | mbss | 删 — 前端类型来自 shared 契约,不再需 JSON 桥 |
| Axios 统一封装的返回码处理层 | mbs | 精简 — TanStack Query 接管服务端态,axios 仅作底层 fetcher |
| `NotFount` 拼写错误 | mbs | 修正命名 → `NotFound` |

**新增**(中后台脚手架通用底座补强):
| 层 | 项 | 说明 |
|---|---|---|
| 前端 | RBAC 权限组件 | 路由级守卫 + 按钮级 `<HasPermission code>`(现有仅登录态,无细粒度) |
| 前端 | 统一 loading/error/空态封装 | TanStack Query + antd fallback |
| 前端 | 请求重试与去重约定 | Query retry + queryKey 规范 |
| 前端 | env 类型校验 | `import.meta.env` 走 zod,与后端一致 |
| 后端 | 健康检查 `/api/health` | Docker/CI 探活必需 |
| 后端 | 审计日志 | 操作留痕(现有仅错误日志,无操作审计) |
| 后端 | 数据库 seed 脚本 | 脚手架开箱即用必需 |
| 后端 | Refresh Token 轮换存储 | Redis 存 rotation,认证重写时明确 |
| 后端 | 接口版本化 `/api/v1` | 利于演进,替代裸 `/api` |
| 后端 | CORS 白名单配置化 | 进 zod config,替代硬编码 `allowOrigin` |
| 共享 | 统一分页 schema | `PaginationQuerySchema` / `PaginatedResponseSchema` 前后端复用 |
| 共享 | 错误码枚举 | 集中到 shared |

---

## 2. 设计原则与边界

### 2.1 原则
- **演进式重构**:在新 monorepo 里平移现有功能,数据库结构照搬后做 PG 化;不做语义级推倒重写。
- **单一契约源**:所有 DTO/API schema 由 `packages/shared` 的 zod 定义,后端校验、前端类型同源。
- **模板可复用**:脚手架开箱即用,命名与分层采用 NestJS / Drizzle / TanStack 社区通用约定(见 6.4)。
- **最小依赖**:每项选型可独立验证必要性,不堆砌热门库。

### 2.2 显式不做(边界)
- ❌ 不换数据库到 Mongo / 不上 GraphQL(关系型够用)。
- ❌ 不做微服务(单体 NestJS 足够)。
- ❌ 不做 SSR(中后台 SPA + 鉴权重定向即可)。
- ❌ 不引入事件溯源 / 复杂状态机。
- ❌ 部署不绑定特定 CI 工具,保持可移植(Dockerfile + Compose 自带,任意 CI 可接)。

---

## 3. 总体架构

### 3.1 架构拓扑

```
┌─────────────────────────────────────────────────────────┐
│  apps/web  (React 19 + Vite 8 + antd6 + TanStack)       │
│   ↕ zod 派生类型 import                                  │
│  packages/shared  (zod schemas · 契约单一源)             │
│   ↕ 校验 / OpenAPI                                       │
│  apps/server (NestJS 11 + Drizzle + socket.io + pino)   │
│   ↕ Drizzle     ↕ ioredis      ↕ socket.io              │
│  PostgreSQL 16      Redis          (WS 通道)             │
└─────────────────────────────────────────────────────────┘
   工具:Turborepo + Biome + pnpm workspace + Docker
```

### 3.2 工程骨架

```
mb-monorepo/
├── apps/
│   ├── web/                      前端
│   └── server/                   后端
├── packages/
│   ├── shared/                   zod schemas + 派生类型 + 常量/错误码
│   └── config/                   共享 biome/tsconfig
├── docker-compose.yml            PG + Redis + server + web
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── AGENTS.md                     OpenCode/Trae 项目指引
└── docs/
    ├── ARCHITECTURE.md           架构与规范(新建)
    └── REFACTOR_PLAN.md          本文档
```

### 3.3 契约数据流(zod 单一源)

```
packages/shared/schemas/*.ts (zod)
   ├── 后端:nestjs-zod 做 DTO 校验 + zod-to-openapi 转 OpenAPI 出 Swagger
   └── 前端:z.infer 派生 TS 类型 + @hookform/resolvers 做表单校验
```
**前端类型绝不手抄**,任何 API 变更只改 shared 一处。

---

## 4. 技术选型(已核实)

> 核实日期:2026-06-29,数据源:npm registry / 官方文档。

### 4.1 后端选型

| 维度 | 选型 | 版本 | 核验依据 |
|---|---|---|---|
| 框架 | NestJS | `@nestjs/* 11.1.27`(12 仅 alpha) | 稳定最新 |
| ORM | Drizzle ORM | `0.45.2` / kit `0.31.10` | SQL-first,2026 增长最快 |
| 数据库 | PostgreSQL | 16 | 开源关系库面向未来首选 |
| PG 驱动 | postgres-js | `3.4.9` | Drizzle 官方首选驱动 |
| 校验/DTO | Zod | `4.4.3` | 事实标准,最新大版本 |
| DTO 桥接 | nestjs-zod | `5.4.0` | 已适配 zod4 |
| OpenAPI 生成 | @asteasolutions/zod-to-openapi | `8.5.0` | 把 shared 的 zod 转 OpenAPI 供 swagger 展示 |
| API 文档展示 | swagger-ui-express | `5.0.1` | NestJS swagger 默认 UI |
| 认证 | JWT 双 token | `@nestjs/jwt 11.0.2` | stateless |
| 哈希 | argon2 | `0.44.0` | 抗 GPU/ASIC 首选 |
| 缓存 | ioredis | `5.11.1` | Node Redis 主流 |
| 配置 | @nestjs/config | `4.0.4` | + zod 校验全环境变量 |
| 限流 | @nestjs/throttler | `6.5.0` | + Redis 后端(多实例生效) |
| 定时 | @nestjs/schedule | `6.1.3` | 替代停更的 nest-schedule |
| 实时 | socket.io | `4.8.3` + platform-socket.io 11.1.27 | 实时通信成熟,脚手架内建 WS 通道 |
| 日志 | pino | `10.3.1` / pino-http `11.0.0` | Node 最快日志库 |
| 邮件 | nodemailer + @nestjs-modules/mailer | `9.0.1` / `2.3.7` | handlebars 模板 |
| 测试 | Vitest + supertest | `4.1.9` / `7.2.2` | 与前端统一,原生 ESM |

### 4.2 前端选型

| 维度 | 选型 | 版本 | 核验依据 |
|---|---|---|---|
| 框架 | React | `19.2.7` | antd6 推荐 19;并发/Actions/use |
| 构建 | Vite + SWC | `8.1.0` / `@vitejs/plugin-react-swc 4.3.1` | 最快构建档,最新大版本 |
| 路由 | TanStack Router | `1.170.16` | 类型安全路由,定调 |
| 数据层 | TanStack Query | `5.101.2`(无 v6) | 服务端态事实标准 |
| UI | Ant Design | `6.5.0` | cssVar + React19,最新 |
| 图标 | @ant-design/icons | `6.3.2` | 与 antd6 强绑定对齐 |
| 组件增强 | ProComponents | `2.8.10` | 已适配 antd6(v3 仍 roadmap) |
| 本地态 | zustand | `5.0.14` | 2026 轻量态标准 |
| 表单 | react-hook-form + resolvers | `7.80.0` / `5.4.0` | resolvers5 适配 zod4 |
| 样式 | Tailwind v4 | `4.3.1` + `@tailwindcss/vite 4.3.1` | 布局专用 + antd cssVar 单一主题源 |
| Mock | MSW | `2.14.6` | 网络层拦截 mock |
| WS 客户端 | socket.io-client | `4.8.3` | 与后端 socket.io 4.8 对齐 |
| 测试 | Vitest + Testing Library | `4.1.9` / `16.3.2` | RTL16 适配 React19 |

### 4.3 共享包与工具链

| 维度 | 选型 | 版本 |
|---|---|---|
| 契约源 | zod | `4.4.3` |
| Lint/Format | Biome | `2.5.1` |
| TypeScript | typescript | `6.0.3` |
| Git 钩子 | husky + lint-staged | husky `9.1.7` |
| Monorepo | pnpm workspace + Turborepo | turbo `2.10.0` |
| CI | GitHub Actions | — |

### 4.4 选型决策日志
- **A(NestJS+Drizzle)vs B(Hono+Drizzle)**:选 A。未来性 90% 来自数据层(Drizzle+zod+PG),两者数据层相同;B 换 Hono 抛弃 NestJS 生态却不增未来性,对脚手架是负收益。
- **MySQL→PostgreSQL**:借重构切 PG。JSONB/RLS/GIN 更现代,Drizzle/Prisma 均以 PG 为一等公民,海外/新技术栈默认。
- **保留 socket.io**:既有模板已用,实时通信成熟,避免引入更轻但生态浅的 `ws` 重写。
- **Tailwind v4 + antd6 共存**:antd6 默认 cssVar 输出 `--ant-*` 变量,Tailwind `@theme` 引用它做单一主题源;关/收窄 preflight + 分工(antd 管组件、Tailwind 管布局)避免冲突。
- **Biome vs ESLint**:选 Biome,全栈统一 lint+format 一把梭,配置极简(ant-design-pro v6 同款)。

---

## 5. 依赖清单(BOM)

### 5.1 apps/server
```
运行时:
@nestjs/core @nestjs/common @nestjs/platform-express        ^11.1.27
@nestjs/platform-socket.io  @nestjs/websockets              ^11.1.27
@nestjs/config              ^4.0.4
@nestjs/jwt                 ^11.0.2
@nestjs/throttler           ^6.5.0
@nestjs/schedule            ^6.1.3
@nestjs-modules/mailer      ^2.3.7
nodemailer                  ^9.0.1
drizzle-orm                 ^0.45.2
postgres (postgres-js)      ^3.4.9
zod                         ^4.4.3
nestjs-zod                  ^5.4.0
@asteasolutions/zod-to-openapi  ^8.5.0
swagger-ui-express          ^5.0.1
argon2                      ^0.44.0
ioredis                     ^5.11.1
socket.io                   ^4.8.3
pino  ^10.3.1   pino-http  ^11.0.0
reflect-metadata  rxjs  class-transformer(如需)

开发:
drizzle-kit                 ^0.31.10
vitest                      ^4.1.9
supertest                   ^7.2.2
typescript                  ^6.0.3
@biomejs/biome              ^2.5.1
```

### 5.2 apps/web
```
运行时:
react  react-dom                                   ^19.2.7
@tanstack/react-router                            ^1.170.16
@tanstack/react-query  + devtools                 ^5.101.2
antd                                              ^6.5.0
@ant-design/icons                                 ^6.3.2
@ant-design/pro-components                        ^2.8.10
zustand                                           ^5.0.14
react-hook-form                                   ^7.80.0
@hookform/resolvers                               ^5.4.0
socket.io-client                                  ^4.8.3

开发:
vite                                              ^8.1.0
@vitejs/plugin-react-swc                          ^4.3.1
tailwindcss  @tailwindcss/vite                    ^4.3.1
msw                                               ^2.14.6
vitest                                            ^4.1.9
@testing-library/react                            ^16.3.2
@testing-library/jest-dom                         ^6.9.1
typescript                                        ^6.0.3
@biomejs/biome                                    ^2.5.1
```

### 5.3 packages/shared / 根
```
shared: zod ^4.4.3
根:    @biomejs/biome ^2.5.1  typescript ^6.0.3  turbo ^2.10.0  husky ^9.1.7
```

### 5.4 基础设施
- PostgreSQL 16、Redis 7(Docker)、GitHub Actions、Docker Compose(`pg`+`redis`+`server`+`web`)。

---

## 6. 详细设计

### 6.1 后端 `apps/server`
**6.1.1 分层**:`controller → service → schema(drizzle)` + `dto(zod)`,与 NestJS 社区惯例一致。
**6.1.2 Drizzle + PG**:
- `db/schema/*.ts` 存表定义(替代 TypeORM `@Entity`)。
- 严禁 `synchronize`,全部 `drizzle-kit generate` 生成迁移 + `migrate` 执行。
- PG 用 JSONB 存可变结构(如配置/日志扩展字段),替代 MySQL 的 loose text。
**6.1.3 认证(重写)**:
- `access(15min, body)` + `refresh(7d, httpOnly cookie, Redis 存 rotation)`。
- 哈希 `argon2id`;移除 `express-session` 与其路由白名单逻辑。
- refresh 接口做轮换(旧的失效,下发新的)。
**6.1.4 配置**:`@nestjs/config` + zod schema 校验所有环境变量(PostgreSQL/Redis/JWT/MAIL/CORS 等全部),缺失即启动失败退出;CORS 白名单由 `allowOrigin` env 驱动,替代硬编码。
**6.1.5 横切**:pino-http 做请求日志;Throttler 挂 Redis;@nestjs/schedule 替代 nest-schedule;邮件保留 hbs 模板。
**6.1.6 socket.io 网关**:`EventsGateway` 规范 namespace + 房间,JWT 鉴权握手。
**6.1.7 错误与响应**:统一 `response.interceptor` 包裹响应体 + `http-exception.filter` 捕获异常,错误码集中到 `packages/shared`。
**6.1.8 健康检查**:暴露 `/api/v1/health`(DB/Redis 探活),供 Docker healthcheck 与 CI 探活。
**6.1.9 审计日志**:对写操作(增删改)记录操作人/IP/前/后值,落 `audit_logs` 表(pino 附带或独立 service),区别于现有错误日志。
**6.1.10 种子脚本**:独立的 `db/seed.ts`,产出 admin 角色 + 默认账号 + 白名单初始数据,`pnpm db:seed` 一键起本地环境。
**6.1.11 接口版本化**:全局前缀 `/api/v1`,替代裸 `/api`,便于后续不兼容演进。
**6.1.12 模块范围**:保留 WeApp 登录(`weappLogin`/`getWeappCodeToLogin`)作为快速搭建能力;剔除 `createApiRoutesJson`(契约同源后冗余);xlsx 导入导出保留为可选工具。

### 6.2 前端 `apps/web`
**6.2.1 路由**:TanStack Router 文件式(`src/routes/`),路由级 loader 预取 + 鉴权守卫;剔除旧 `config.ts` 手写动态路由机制。
**6.2.2 数据层**:TanStack Query 管服务端态,fetcher 用 axios(或 `ky`);统一 queryKey 约定 + 失效策略 + retry/去重;axios 仅作底层 fetcher,精简其返回码处理层(交由 Query boundary 处理)。
**6.2.3 UI/主题**:antd6 `ConfigProvider` 开 cssVar;Tailwind v4 `@theme` 引用 `var(--ant-*)` 做单一主题源;preflight 收窄;分工(antd 管组件、Tailwind 管布局)。
**6.2.4 表单**:react-hook-form + `zodResolver(shared schema)`,与后端同源校验。
**6.2.5 RBAC**:路由级(守卫)+ 按钮级(`<HasPermission code="xxx">`)组件,权限码由 `packages/shared` 统一。
**6.2.6 统一态封装**:Query 配合 antd 封装 loading/error/空态 fallback,避免每个页面重复写。
**6.2.7 env 校验**:前端 `import.meta.env` 走 zod 校验(与后端一致),缺失即构建失败。
**6.2.8 Mock**:MSW handler 与 shared schema 对齐,离线开发。
**6.2.9 保留能力**:高德地图示例(`@uiw/react-amap`)、WebSocket 页保留作为脚手架快速搭建示例;`NotFount` 修正为 `NotFound`。

### 6.3 共享包 `packages/shared`
- `schemas/*.ts`:zod 定义(请求/响应/实体)。
- 派生:`export type UserDto = z.infer<typeof UserSchema>`。
- 错误码/枚举/常量集中。
- **统一分页**:`PaginationQuerySchema`(page/pageSize/sort)+ `PaginatedResponseSchema<T>`(list/total),前后端共用,避免各自手写。
- 后端:`nestjs-zod` 做 DTO 校验 + `@asteasolutions/zod-to-openapi` 把 zod 转 OpenAPI,再由 `swagger-ui-express` 渲染。
- 前端:直接 `import { UserSchema }` 做类型与表单校验同源。

### 6.4 命名与编码规范(采用社区通用约定)
- 文件:模块单文件 `{module}.ts`;TypeORM `@Entity` 取消后,drizzle 表定义文件用 `*.schema.ts`;TanStack Router 路由文件用 `*.route.ts`。
- 类:`{Resource}{Type}` 驼峰后缀,如 `UserController` / `UserService` / `EventsGateway`。
- DTO:`{Action}{Resource}Dto`,如 `CreateUserDto` / `LoginDto`;全部**命名导出**。
- Provider/Module:**命名导出** + 模块聚合(`index.module.ts` 统一汇总),便于跨模块引用与重构。
- 表名:**snake_case 复数**,与 Drizzle / Prisma 官方示例一致(`users` / `roles` / `error_logs` / `error_whitelist`)。
- 错误码:常量集中到 `packages/shared`,前后端共享。
> 与旧 mbss 规范的差异:旧规范表名单数、类默认导出;新栈统一改为复数表名 + 命名导出,对齐社区主流,降低脚手架二次使用者的心智成本。

---

## 7. 数据库迁移设计

### 7.1 现有四表 + 新增一表
`users`、`roles`、`error_logs`、`error_whitelist`(从 mbss `entities/` 平移,表名统一改复数);新增 `audit_logs`(操作审计,见 6.1.9)。

### 7.2 MySQL → PG/Drizzle 类型对照
| MySQL | PostgreSQL / Drizzle |
|---|---|
| `int auto_increment` | `serial` / `integer().primaryKey()` |
| `varchar(n)` | `varchar(n)` |
| `text` | `text` |
| `json` | `jsonb`(gain:索引+查询) |
| `datetime` | `timestamp` / `timestamptz`(+08:00) |
| `tinyint(1)` | `boolean` |

### 7.3 迁移流程
1. 在 mbss 旧库导出结构 + 数据。
2. 新 PG 库 `drizzle-kit generate` 出初始迁移。
3. 数据用脚本搬移(逐表 ETL,类型按 7.2 映射)。
4. `drizzle-kit migrate` 在干净库验证可重放。

### 7.4 切换与回滚
- 本项目为脚手架模板,无存量线上流量,直接切库即可。
- 每个迁移有 `up`/`down`;迁移脚本可重放(`drizzle-kit migrate` 在干净库可重建)。
- 迁移前后用种子数据脚本校验表结构与示例数据(含 `audit_logs`)。

---

## 8. 实施路径(分步,每步可独立验证)

| 步 | 内容 | 主要影响 | 风险 | 验收 | 状态 |
|---|---|---|---|---|---|
| S1 | monorepo 骨架 + shared/config + docker + ci | 工程文件 | 低 | `pnpm i` 通过 | ✅ 完成 |
| S2 | 后端:zod 配置校验(含 CORS)+ Vitest 环境 + `/api/v1/health` | server/config, test | 低 | 单测绿 + health 探活通 | ✅ 完成 |
| S3 | 后端:Drizzle+PG schema + 迁移(四表 + audit_logs) + seed 脚本 | server/db | 高 | 干净库 migrate + seed 通过 | ✅ 完成 |
| S4 | 后端:双 token 认证 + argon2 + refresh 轮换,删 session | server/auth | 中 | 登录/刷新 E2E | ✅ 完成 |
| S5 | 后端:zod DTO + OpenAPI 导出契约 + 审计日志 + WeApp 登录平移 | server/dto, shared | 中 | swagger 契约一致 | ✅ 完成 |
| S6 | 前端:Vite8+antd6+TR+Query+Tailwind 升级 + env 校验 + 统一态封装 | web 全量 | 中 | 构建+测试 | ✅ 完成 |
| S7 | 前端:RBAC + 路由守卫 + MSW | web/routes | 中 | 守卫生效 | ✅ 完成 |
| S8 | 全栈类型打通 + 文档完善 | shared/web/server | 低 | 类型生成脚本 | ✅ 完成 |
| S9 | 前端开发服务器集成测试 | web | 低 | 前端可正常启动 | 🔲 待做 |
| S10 | RBAC 权限 CRUD 接口 | server | 中 | 权限管理完整 | 🔲 待做 |
| S11 | 错误日志管理接口 | server | 中 | 日志查询/删除 | 🔲 待做 |
| S12 | 前端 RBAC 完整联调 | web + server | 中 | 前后端联调通过 | 🔲 待做 |

---

## 9. 验收与失败条件
### 9.1 总体验收

- [x] 干净库 `docker compose up` 一键起全栈。
- [x] `pnpm db:seed` 初始化默认账号/角色/白名单成功。
- [x] `/api/v1/health` 探活返回 200(DB/Redis 就绪)。
- [x] users/roles/file/error_logs/login 全部 E2E 绿。
- [ ] swagger 契约与前端类型 100% 同源(无手抄);接口路径统一 `/api/v1`。
- [ ] 写操作产出 `audit_logs` 审计记录。
- [ ] `.env.example` 同步,关键变量缺失启动即退。
- [x] Biome + 测试 + 构建全过。

### 9.2 失败条件(红线)
- 任一表迁移在空库/已有库跑不通。
- 认证切换后本地冒烟登录/刷新链路不通。
- 前后端类型来源不一致(两边手抄)。
- antd6 升级后自定义内部 DOM 样式大面积失效未修。
- seed 跑不通或 health 探活失败(脚手架无法开箱即用)。

---

## 10. 风险与应对

| 风险 | 应对 |
|---|---|
| TypeORM→Drizzle 重写工作量大 | 分表逐步平移,先读后写;schema 一一对应 |
| 认证切换导致登录链路异常 | 脚手架无存量会话,本地冒烟登录/刷新通过即可上线;refresh 轮换逻辑单测覆盖 |
| antd6 DOM 语义化变更 | 升级后跑视觉回归,禁用对内部节点的脆弱选择器 |
| Tailwind/antd 主题双源 | 单一主题源:Tailwind 仅引 `--ant-*` 变量 |
| Zod v4 语法差异 | shared 统一用 v4 写法;resolvers/nestjs-zod 已适配 |
| ProComponents 2.x ↔ antd6 兼容 | 锁定 2.8.10 已适配版,等 v3 stable 再升 |

---

## 11. AI 编码辅助(OpenCode / Trae)

> 开发期主用 **OpenCode**(开源 AI 编码 agent,opencode.ai,终端/IDE/桌面,支持任意模型)+ **Trae**(字节 AI IDE)。两者均认项目级规则文件 `AGENTS.md`。

### 11.1 项目级指引 `AGENTS.md`(放进仓库根)
内容要点:
- **项目概览**:全栈 monorepo,前后端共享 zod 契约。
- **目录约定**:apps/web、apps/server、packages/shared 的职责边界。
- **契约铁律**:改 API 必须先改 `packages/shared/schemas`,禁止前端手抄类型、禁止后端绕过 zod 自定义 DTO。
- **数据库铁律**:禁止 `synchronize`,所有表结构变更走 `drizzle-kit generate` 迁移。
- **命令速查**:`pnpm dev` / `pnpm build` / `pnpm test` / `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:seed`。
- **命名规范**:指向 `docs/ARCHITECTURE.md`。
- **测试要求**:新增 service/controller 必须配套单测;bug 修复先写复现测试。

### 11.2 OpenCode 配置
- 项目级 `opencode.json`(或全局):指定模型、权限、白名单命令。
- 多会话:后端重构与前端升级可并行开两个会话。

### 11.3 Trae 配置
- 项目级 `.trae/rules`(或 Trae 的项目规则):复用 `AGENTS.md` 内容。
- 前端 antd6 升级后,用 Trae 人工对照页面视觉、辅助核对样式回归。

### 11.4 AI 辅助边界
- 迁移脚本、Drizzle schema、zod schema 适合 AI 生成(结构化、有契约)。
- 认证逻辑、迁移 up/down 需人工复核(高风险,不能盲信 AI)。
- 所有 AI 改动须经 `pnpm test` + Biome 通过方可提交。

---

## 12. 附录

### 12.1 依赖核实记录(2026-06-29 npm registry)
- 后端:`@nestjs/core 11.1.27`、`drizzle-orm 0.45.2`、`drizzle-kit 0.31.10`、`postgres(postgres-js) 3.4.9`、`zod 4.4.3`、`nestjs-zod 5.4.0`、`@asteasolutions/zod-to-openapi 8.5.0`、`swagger-ui-express 5.0.1`、`argon2 0.44.0`、`ioredis 5.11.1`、`@nestjs/config 4.0.4`、`@nestjs/throttler 6.5.0`、`@nestjs/schedule 6.1.3`、`socket.io 4.8.3`、`pino 10.3.1`、`pino-http 11.0.0`、`nodemailer 9.0.1`、`@nestjs-modules/mailer 2.3.7`、`vitest 4.1.9`、`supertest 7.2.2`。
- 前端:`react 19.2.7`、`vite 8.1.0`、`@vitejs/plugin-react-swc 4.3.1`、`@tanstack/react-router 1.170.16`、`@tanstack/react-query 5.101.2`、`antd 6.5.0`、`@ant-design/icons 6.3.2`、`@ant-design/pro-components 2.8.10`、`zustand 5.0.14`、`react-hook-form 7.80.0`、`@hookform/resolvers 5.4.0`、`tailwindcss 4.3.1`、`@tailwindcss/vite 4.3.1`、`msw 2.14.6`、`socket.io-client 4.8.3`、`@testing-library/react 16.3.2`、`@biomejs/biome 2.5.1`、`typescript 6.0.3`。
- 共享/根:`zod 4.4.3`、`typescript 6.0.3`、`turbo 2.10.0`、`husky 9.1.7`。

### 12.2 旧↔新仓库对应
- `wenzhu-eternal/mbs` → `apps/web`
- `wenzhu-eternal/mbss` → `apps/server`
- 新增 `packages/shared`(契约源)、`packages/config`(共享配置)

### 12.3 参考资料
- antd v6 迁移指南:https://ant.design/docs/react/migration-v6/
- Tailwind v4 + antd6 共存:`@tailwindcss/vite` 插件 + `@import "tailwindcss"`;antd6 cssVar 模式输出 `--ant-*`,Tailwind `@theme` 引用之做单一主题源;preflight 需关/收窄(避免覆盖 antd 按钮/输入框)。antd 主题文档:https://ant.design/docs/react/customize-theme
> 注:OpenAPI 路线不复用 `@nestjs/swagger` 的装饰器生成;改由 shared 的 zod 经 `zod-to-openapi` 统一生成 OpenAPI spec,`swagger-ui-express` 仅做渲染,避免装饰器与 zod 双源。
- Drizzle PG 文档:https://orm.drizzle.team/docs/get-started-postgresql
- NestJS Drizzle:https://orm.drizzle.team/docs/get-started-nestjs
- zod-to-openapi:https://github.com/asteasolutions/zod-to-openapi
- TanStack Router:https://tanstack.com/router/latest
- OpenCode:https://opencode.ai/
