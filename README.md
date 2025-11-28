# host-mgmt-system
# 推进办主机管理系统（GitHub -> Cloudflare Pages + Functions + KV）

## 快速部署（网页端，无需本地）
1. 在 Cloudflare Dashboard 创建 KV namespaces：`HOSTS_DB`, `USERS_DB`。
2. 在 GitHub 把本仓库文件创建好（使用网页编辑器创建）。
3. 在 Cloudflare Pages 创建项目并连接到该 GitHub 仓库。
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 在 Pages -> Functions -> KV Bindings 添加绑定：
   - binding: `HOSTS_DB` -> 对应 namespace
   - binding: `USERS_DB` -> 对应 namespace
5. 在 Pages -> Settings -> Environment Variables 添加：
   - `JWT_SECRET` = 随机字符串（生产务必用强随机值）
6. 部署完成后访问 Pages 域名，首次触发会自动在 `USERS_DB` 中创建初始管理员：admin / 密码 123

## 说明
- API 路径：`/api/login`, `/api/users`, `/api/hosts`
- 初始管理员：`admin` / `123`（登录后请尽快通过 UI 添加并切换密码）
