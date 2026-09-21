# Followdesk · 个人工作台

将邮件、公开网页和笔记整理为可执行事项，分别追踪待办完成情况和 follow-up 记录。

## 已实现

- 粘贴中文 / 英文邮件、笔记，或者读取公开网页 URL。
- 辅助提取关键原文、待办、发件人和明确包含年份的截止日期；入库前可编辑确认。
- 待行动 / 等回复 / 已完成三个状态，任务勾选与事项状态独立。
- 跟进、对方回复、备注时间线，以及下次跟进日期。
- 持久化保存、按用户隔离、并发编辑冲突检测、搜索、JSON 导出。
- 私人部署，源码与用户数据分离。

## 当前边界

v0.1 使用确定性关键词规则和原文摘录，不是大模型语义分析。关键词命中的句子可能只是背景信息，必须人工确认。没有明确年份或存在相对时间的日期留给用户确认，不猜年份。网页加载失败时可粘贴正文；暂不支持登录网页、PDF、附件、JS 动态正文或验证码。

尚未连接邮箱，无法自动知道你是否已经发出回复；“我已跟进”依赖人工记录。仅完成待办不会产生跟进记录，添加跟进也不会自动完成事项。下次跟进日期用于页面提示，没有后台通知或自动发送功能。导出文件用于备份和数据迁移，当前界面尚无导入功能。

## 技术栈

React 19、TypeScript、Vinext / Vite、Cloudflare Workers + D1、Drizzle migrations、Radix / shadcn UI。

## 本地开发

需要 Node.js >=22.13 和 `package.json` 中指定版本的 pnpm。

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_wild_nighthawk.sql
pnpm dev
```

使用开发服务器输出的 loopback 地址。在 portable 本地开发模式，访问 `/signin-with-chatgpt?return_to=/` 使用 starter 自带的模拟身份。该身份模拟不包含在生产代码中。托管预览环境不会模拟用户身份，因此匿名调用 API 会返回 401。

数据库迁移：修改 `db/schema.ts` 后运行 `pnpm db:generate`，检查并提交新 SQL 与元数据，已应用的迁移不要改写。

## 部署与认证

当前实例通过 ChatGPT Sites 私人发布，生产身份由平台注入，D1 数据不写入 Git。`.openai/hosting.json` 中的 `project_id` 是当前实例的标识，不是密钥；fork 后必须移除原标识并注册自己的 Site，不能沿用原实例。仅把代码发布到 GitHub 不会部署应用。

自主部署时，必须使用可信代理 / 身份认证系统，替换 `lib/storage.ts` 的 `owner()` 并实现服务器端会话验证，再配置自己的 D1。不能把信任 `oai-authenticated-user-*` 请求头的默认实现直接暴露到公网；这些头只有在可信 Sites 分发层注入且不可被客户端伪造时才安全。

## 开源到 GitHub

仓库可命名为 `followdesk`。保留现有 Sites remote，为 GitHub 增加单独的 remote；GitHub 仓库必须先在你的账号下创建。不要把个人邮件、数据库、导出 JSON、运行日志、`.env` 或 API key 提交到仓库。`.gitignore` 已排除依赖、构建产物、运行状态及环境文件。演示文案是虚构样例。

## 核心代码

- `app/workbench.tsx`：工作台界面与编辑流程。
- `lib/extract.ts`：可替换的提取器与类型。
- `app/api/extract/route.ts`：公开网页读取与提取。
- `app/api/items/route.ts`：持久化、权限隔离与跟进记录。
- `db/schema.ts` / `drizzle/`：结构和迁移。

URL 抓取只允许 HTTP(S) 公共域名、限制重定向、响应体积和时间；不支持私网 / 本地主机。自托管应在网络层限制出站访问，防止 DNS 重绑定等 SSRF 风险。

## License

原创应用代码使用 MIT License。依赖和 starter 中已有组件、vendor 资源保留各自许可及版权声明。
