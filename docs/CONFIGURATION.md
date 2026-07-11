# 配置规范

## 环境变量管理

- 所有环境变量通过 `.env` 文件管理（`apps/server/.env`、`apps/web/.env`）
- 关键变量缺失时服务启动即失败（fail-fast）
- 详见 `.env.example` 作为完整变量清单模板

### 核心环境变量

| 变量 | 说明 | 默认/示例 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://mb_user:mb_password@localhost:5432/mb_database` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379` |
| `JWT_SECRET` | JWT access token 密钥 | 必填，长度 >= 32 |
| `JWT_REFRESH_SECRET` | JWT refresh token 密钥 | 必填，长度 >= 32 |
| `API_PORT` | 后端端口 | `9000` |
| `API_PREFIX` | API 前缀 | `/api/v1` |
| `ALLOW_ORIGIN` | CORS 白名单 | `http://localhost:3000` |
| `NODE_ENV` | 环境 | `development` / `production` |

### 邮件服务变量

| 变量 | 说明 | 示例 |
|---|---|---|
| `MAIL_HOST` | SMTP 主机 | `smtp.163.com` |
| `MAIL_PORT` | SMTP 端口 | `465` |
| `MAIL_USER` | SMTP 用户名 | `travel_car@163.com` |
| `MAIL_PASSWORD` | SMTP 授权码（非登录密码） | `SKECLRLSATENJTZH` |
| `MAIL_FROM` | 发件人地址 | `travel_car@163.com` |

> 注意：本项目用 `MAIL_PASSWORD`（不是 `MAIL_PASS`）。跨项目拷贝 `.env` 时注意对齐变量名。

## 配置陷阱

### `ConfigService.get<T>()` 类型陷阱

TypeScript 泛型只是编译期断言，运行时返回值类型由 `.env` 文件内容决定，**所有值都是 string**。数字类型必须 `Number()` 强转：

```ts
const portRaw = this.configService.get<number>('MAIL_PORT') // 运行时仍是 string
const port = portRaw ? Number(portRaw) : 587
```

典型踩坑：`MAIL_PORT=465` 直接传给 `nodemailer.createTransport({ port })` 会因类型不符静默失败或报错。

### Cookie `secure` flag

必须由环境变量控制，不能硬编码。开发环境（HTTP）必须设为 `false`，生产环境（HTTPS）必须设为 `true`。

## 邮件服务规范

### 验证码必须后端生成

禁止前端传 `code` 字段，后端用 `node:crypto.randomUUID` 生成 6 位验证码：

```ts
import { randomInt } from 'node:crypto'
const code = randomInt(0, 999999).toString().padStart(6, '0')
```

### Schema 约束

`SendVerificationCodeMailSchema` 只保留 `to`（必填）+ `name`（可选），删除 `code` 字段：

```ts
export const SendVerificationCodeMailSchema = z.object({
  to: z.string().email('请输入有效邮箱'),
  name: z.string().min(1).max(50).optional(),
})
```

### 错误处理

- `mail.service` 的 `send`/`sendHtml` catch 必须 `throw new Error(...)`，不能吞错
- `loadTemplates` 的 catch 同样必须抛错（fail-fast），模板缺失属严重配置错误，不能静默降级
- 让上层 controller 处理响应和 toast

### 邮件模板路径

- 模板文件位于 `apps/server/src/templates/email/*.hbs`（Handlebars）
- `mail.service` 用 `process.cwd()` + `NODE_ENV` 判断查找路径：
  - dev：`{cwd}/src/templates/email/`
  - prod：`{cwd}/dist/templates/email/`（由 `nest-cli.json` 的 `assets` 配置复制）
- `nest-cli.json` 必须配置 `assets: [{ "include": "templates/email/*.hbs", "outDir": "dist" }]`，否则生产构建后模板丢失
- 生产部署时 Docker/PM2 的 `WORKDIR` 必须是 `apps/server/`，否则 `process.cwd()` 路径失效

### 端口强转

`MAIL_PORT` 必须用 `Number()` 强转，详见「配置陷阱」章节。

## ngrok 部署

ngrok 部署的完整流程、关键约束和验证步骤详见 [DEPLOYMENT.md](./DEPLOYMENT.md) 的「ngrok 临时外网部署」章节。

**核心要点**：隧道必须绑定 `127.0.0.1:9000`（后端 ServeStaticModule 端口），不能绑 3000（前端 vite dev server）。
