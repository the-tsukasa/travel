# Render 部署指南

本指南将帮助你使用 Render 平台部署 Travel 应用。

## 📋 前置要求

1. **GitHub 账号**：代码需要推送到 GitHub
2. **Render 账号**：访问 https://render.com 注册（可使用 GitHub 登录）
3. **Node.js 和 Java**：本地开发环境（用于测试）

---

## 🚀 部署步骤

### 步骤 1: 准备代码

确保所有代码已提交到 GitHub：

```bash
# 检查当前状态
git status

# 如果有未提交的更改
git add .
git commit -m "准备 Render 部署"
git push origin main
```

### 步骤 2: 在 Render 创建服务

1. **登录 Render Dashboard**
   - 访问 https://dashboard.render.com
   - 使用 GitHub 账号登录

2. **创建新 Web Service**
   - 点击 "New +" → "Web Service"
   - 选择 "Build and deploy from a Git repository"
   - 连接你的 GitHub 账号（如果还没连接）
   - 选择 `travel` 仓库

3. **配置服务**
   - **Name**: `travel-app`（或你喜欢的名称）
   - **Region**: 选择离你最近的区域（如 `Singapore`）
   - **Branch**: `main`（或你的主分支）
   - **Root Directory**: 留空（使用根目录）
   - **Environment**: `Java`
   - **Build Command**: Render 会自动检测 `render.yaml`，无需手动输入
   - **Start Command**: Render 会自动检测，无需手动输入

4. **创建数据库**
   - 在同一个项目中，点击 "New +" → "PostgreSQL"（或 "MySQL"）
   - **Name**: `travel-db`
   - **Database**: `travel_db`
   - **User**: `travel_user`
   - **Plan**: `Free`（免费层）
   - 点击 "Create Database"

### 步骤 3: 配置环境变量

在 Web Service 的 "Environment" 标签页中，添加以下环境变量：

#### 必需的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SPRING_PROFILES_ACTIVE` | `production` | 激活生产环境配置 |
| `JWT_SECRET` | 生成一个强随机字符串（至少32字符） | JWT 密钥，用于用户认证 |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.onrender.com` | 替换为你的实际 Render URL |

#### 数据库相关（自动配置）

以下变量会从数据库服务自动获取，**无需手动设置**：
- `DATABASE_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

#### 可选环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `UPLOAD_DIR` | `/tmp/uploads` | 文件上传目录（默认值） |
| `DDL_AUTO` | `update` | 首次部署使用 `update`，之后改为 `validate` |
| `PORT` | `8080` | 服务端口（Render 自动设置） |

#### 生成 JWT_SECRET

可以使用以下命令生成安全的 JWT 密钥：

```bash
# Linux/Mac
openssl rand -base64 32

# 或使用在线工具
# https://www.grc.com/passwords.htm
```

### 步骤 4: 部署

1. **保存配置**
   - 点击 "Save Changes"

2. **开始部署**
   - Render 会自动开始构建和部署
   - 可以在 "Events" 标签页查看部署进度
   - 可以在 "Logs" 标签页查看实时日志

3. **等待部署完成**
   - 首次部署通常需要 5-10 分钟
   - 构建过程包括：
     - 安装前端依赖（npm install）
     - 构建前端（npm run build）
     - 构建后端（Maven package）

### 步骤 5: 验证部署

1. **获取访问地址**
   - 部署完成后，Render 会提供一个 URL
   - 格式：`https://travel-app-xxxx.onrender.com`

2. **测试应用**
   - 访问应用 URL
   - 测试注册/登录功能
   - 测试主要功能

3. **检查健康状态**
   - 访问 `https://your-app.onrender.com/actuator/health`
   - 应该返回 `{"status":"UP"}`

---

## 🔄 代码更新流程

### 自动部署（推荐）

1. **修改代码**
   ```bash
   # 在本地修改代码
   # ...
   ```

2. **提交并推送**
   ```bash
   git add .
   git commit -m "更新功能：描述你的更改"
   git push origin main
   ```

3. **Render 自动部署**
   - Render 检测到 GitHub 推送
   - 自动开始构建和部署
   - 在 Render Dashboard 查看部署进度

### 手动触发部署

如果自动部署未触发：

1. 登录 Render Dashboard
2. 进入你的 Web Service
3. 点击 "Manual Deploy" → "Deploy latest commit"

---

## ⚙️ 配置说明

### render.yaml

项目根目录的 `render.yaml` 文件包含以下配置：

- **构建命令**：自动构建前端和后端
- **启动命令**：启动 Spring Boot 应用
- **环境变量**：自动从数据库服务获取连接信息
- **健康检查**：使用 `/actuator/health` 端点

### 数据库配置

#### 使用 PostgreSQL（推荐，Render 免费层默认）

Render 免费层提供 PostgreSQL，配置如下：

1. 创建 PostgreSQL 数据库
2. Render 会自动提供 `DATABASE_URL`
3. 应用会自动检测并使用 PostgreSQL

#### 使用 MySQL

如果需要使用 MySQL：

1. 在 Render 创建 MySQL 数据库（可能需要付费计划）
2. 手动设置环境变量：
   - `DB_DRIVER`: `org.mariadb.jdbc.Driver`
   - `HIBERNATE_DIALECT`: `org.hibernate.dialect.MariaDBDialect`

---

## 🔧 常见问题

### 1. 构建失败

**问题**：构建过程中出现错误

**解决方案**：
- 检查 "Logs" 标签页中的错误信息
- 确保 `package.json` 和 `pom.xml` 中的依赖正确
- 检查 Node.js 和 Java 版本兼容性

### 2. 数据库连接失败

**问题**：应用无法连接到数据库

**解决方案**：
- 检查数据库服务是否已启动
- 确认 `DATABASE_URL` 环境变量正确
- 检查数据库用户名和密码

### 3. 前端无法加载

**问题**：前端页面显示空白或 404

**解决方案**：
- 确认前端构建成功（检查构建日志）
- 检查 `frontend/vite.config.js` 中的 `outDir` 配置
- 确认静态资源路径正确

### 4. CORS 错误

**问题**：浏览器控制台显示 CORS 错误

**解决方案**：
- 检查 `CORS_ALLOWED_ORIGINS` 环境变量
- 确保包含你的前端域名
- 格式：`https://your-app.onrender.com`

### 5. 文件上传失败

**问题**：无法上传文件

**解决方案**：
- 检查 `UPLOAD_DIR` 环境变量
- 确认目录权限
- 考虑使用云存储服务（如 AWS S3、Cloudflare R2）

### 6. 应用休眠

**问题**：免费层应用在 15 分钟无活动后休眠

**解决方案**：
- 这是 Render 免费层的正常行为
- 首次访问需要等待约 30 秒唤醒
- 升级到付费计划可避免休眠

---

## 📊 监控和维护

### 查看日志

1. 在 Render Dashboard 进入你的服务
2. 点击 "Logs" 标签页
3. 查看实时日志和错误信息

### 健康检查

- 访问 `/actuator/health` 端点
- 检查应用状态
- 监控数据库连接

### 性能优化

1. **启用缓存**：使用 Redis 缓存（需要付费计划）
2. **CDN**：使用 Cloudflare 加速静态资源
3. **数据库优化**：定期清理无用数据

---

## 🔐 安全建议

1. **JWT_SECRET**：使用强随机字符串，不要使用默认值
2. **数据库密码**：使用 Render 自动生成的强密码
3. **HTTPS**：Render 自动提供 HTTPS，无需额外配置
4. **环境变量**：不要在代码中硬编码敏感信息

---

## 📝 部署后检查清单

- [ ] 应用可以正常访问
- [ ] 注册/登录功能正常
- [ ] 数据库连接正常
- [ ] 文件上传功能正常（如果使用）
- [ ] CORS 配置正确
- [ ] 健康检查端点正常
- [ ] 环境变量已正确设置
- [ ] 日志中没有错误信息

---

## 🆘 获取帮助

- **Render 文档**：https://render.com/docs
- **Render 社区**：https://community.render.com
- **项目 Issues**：在 GitHub 仓库创建 Issue

---

## 📌 重要提示

1. **首次部署**：使用 `DDL_AUTO=update` 自动创建数据库表
2. **部署成功后**：将 `DDL_AUTO` 改为 `validate`，手动管理数据库迁移
3. **免费层限制**：应用会在 15 分钟无活动后休眠
4. **文件存储**：`/tmp/uploads` 目录在重启后会丢失，建议使用云存储

---

祝部署顺利！🎉

