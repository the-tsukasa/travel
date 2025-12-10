# Railway 部署详细指南

## 📋 目录
1. [Railway 简介](#railway-简介)
2. [准备工作](#准备工作)
3. [部署步骤](#部署步骤)
4. [环境变量配置](#环境变量配置)
5. [数据库设置](#数据库设置)
6. [常见问题](#常见问题)
7. [维护和监控](#维护和监控)

---

## Railway 简介

Railway 是一个现代化的云平台，特别适合部署 Spring Boot 应用：

- ✅ **自动检测**：自动识别 Spring Boot 项目
- ✅ **内置数据库**：一键创建 MySQL/PostgreSQL
- ✅ **免费额度**：每月 $5 免费额度
- ✅ **自动 HTTPS**：自动配置 SSL 证书
- ✅ **GitHub 集成**：自动部署代码更新
- ✅ **实时日志**：查看应用运行日志

---

## 准备工作

### 1. 确保代码已推送到 GitHub

```bash
# 检查当前状态
git status

# 添加所有文件
git add .

# 提交更改
git commit -m "准备部署到 Railway"

# 推送到 GitHub
git push origin main
```

### 2. 本地测试构建

```bash
# 清理并构建项目
./mvnw clean package -DskipTests

# 验证 JAR 文件生成
ls -lh target/travel-0.0.1-SNAPSHOT.jar
```

---

## 部署步骤

### 步骤 1: 注册 Railway 账号

1. 访问 https://railway.app
2. 点击右上角 "Login"
3. 选择 "Login with GitHub"
4. 授权 Railway 访问你的 GitHub 账号

### 步骤 2: 创建新项目

1. 登录后，点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 如果是第一次使用，需要授权 Railway 访问你的 GitHub 仓库
4. 选择你的 `travel` 仓库
5. Railway 会自动开始检测项目类型

### 步骤 3: 添加数据库服务

1. 在项目页面，点击 "+ New"
2. 选择 "Database"
3. 选择 "MySQL"（或 PostgreSQL，需要修改配置）
4. Railway 会自动创建数据库实例
5. 等待数据库初始化完成（约 1-2 分钟）

### 步骤 4: 配置 Web 服务

Railway 应该已经自动创建了 Web 服务。如果没有：

1. 点击 "+ New"
2. 选择 "GitHub Repo"
3. 再次选择你的仓库
4. Railway 会自动检测为 Java/Spring Boot 项目

### 步骤 5: 连接数据库

1. 点击 Web 服务
2. 进入 "Variables" 标签页
3. Railway 会自动提供数据库连接变量：
   - `MYSQLDATABASE` - 数据库名
   - `MYSQLUSER` - 用户名
   - `MYSQLPASSWORD` - 密码
   - `MYSQLHOST` - 主机地址
   - `MYSQLPORT` - 端口

4. 在 Web 服务的环境变量中添加：

```bash
# 数据库连接（Railway 会自动提供，但需要手动组合）
DATABASE_URL=jdbc:mariadb://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC

# 或者分别设置
DB_USERNAME=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_HOST=${MYSQLHOST}
DB_PORT=${MYSQLPORT}
DB_NAME=${MYSQLDATABASE}
```

**更简单的方法**：在数据库服务页面，点击 "Connect" 标签，复制连接字符串。

### 步骤 6: 设置环境变量

在 Web 服务的 "Variables" 标签页添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SPRING_PROFILES_ACTIVE` | `production` | 激活生产环境配置 |
| `JWT_SECRET` | `你的安全密钥` | 至少 32 字符的随机字符串 |
| `JWT_EXPIRATION` | `604800000` | JWT 过期时间（毫秒，7天） |
| `PORT` | `8080` | 应用端口（Railway 会自动设置） |

**生成 JWT_SECRET**：
```bash
# 在终端运行
openssl rand -base64 32
```

### 步骤 7: 配置数据库连接

在 Web 服务的环境变量中，添加完整的数据库 URL：

```bash
DATABASE_URL=jdbc:mariadb://containers-us-xxx.railway.app:3306/railway?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=你的数据库密码
```

**获取数据库连接信息**：
1. 点击数据库服务
2. 在 "Variables" 标签页查看所有变量
3. 复制 `MYSQLHOST`、`MYSQLPORT`、`MYSQLDATABASE`、`MYSQLUSER`、`MYSQLPASSWORD`

### 步骤 8: 等待部署

1. Railway 会自动检测到代码变更并开始构建
2. 构建过程可能需要 3-5 分钟
3. 可以在 "Deployments" 标签页查看构建日志
4. 构建完成后，应用会自动启动

### 步骤 9: 获取访问地址

1. 部署完成后，在 Web 服务页面
2. 点击 "Settings" 标签
3. 在 "Domains" 部分，Railway 会提供一个默认域名
4. 例如：`https://travel-production.up.railway.app`

---

## 环境变量配置

### 必需的环境变量

```bash
# Spring 配置
SPRING_PROFILES_ACTIVE=production
PORT=8080

# 数据库配置（从数据库服务获取）
DATABASE_URL=jdbc:mariadb://host:port/database?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_secure_secret_key_at_least_32_characters
JWT_EXPIRATION=604800000

# 文件上传（可选）
UPLOAD_DIR=/tmp/uploads
```

### 在 Railway 中设置环境变量

1. 点击 Web 服务
2. 进入 "Variables" 标签页
3. 点击 "+ New Variable"
4. 输入变量名和值
5. 点击 "Add"
6. Railway 会自动重新部署应用

---

## 数据库设置

### 自动迁移

Spring Boot 配置了 `ddl-auto: update`，首次启动时会自动创建表结构。

### 手动运行迁移脚本

如果需要运行 SQL 迁移脚本：

1. 在数据库服务的 "Connect" 标签页获取连接信息
2. 使用 MySQL 客户端连接：
```bash
mysql -h containers-us-xxx.railway.app -u root -p
```
3. 执行迁移脚本

### 数据库备份

Railway 提供数据库备份功能：
1. 点击数据库服务
2. 进入 "Data" 标签页
3. 可以导出数据或创建备份

---

## 常见问题

### 1. 构建失败

**问题**：Maven 构建失败

**解决方案**：
- 检查构建日志中的错误信息
- 确保 `pom.xml` 配置正确
- 尝试在本地运行 `./mvnw clean package` 验证

### 2. 应用无法启动

**问题**：部署成功但应用无法访问

**解决方案**：
- 检查 "Logs" 标签页查看错误日志
- 验证环境变量是否正确设置
- 确认数据库连接字符串格式正确
- 检查端口配置（Railway 会自动设置 PORT 变量）

### 3. 数据库连接失败

**问题**：`Connection refused` 或 `Access denied`

**解决方案**：
- 确认数据库服务已启动
- 验证 `DATABASE_URL` 格式正确
- 检查数据库用户名和密码
- 确保数据库服务与 Web 服务在同一个项目中

### 4. JWT 认证失败

**问题**：登录后无法访问受保护的路由

**解决方案**：
- 检查 `JWT_SECRET` 是否设置
- 验证前端是否正确发送 Authorization header
- 查看应用日志中的 JWT 相关错误

### 5. 静态资源无法访问

**问题**：前端页面无法加载 CSS/JS

**解决方案**：
- 检查 Spring Boot 静态资源配置
- 验证文件路径是否正确
- 查看浏览器控制台的 404 错误

### 6. 文件上传失败

**问题**：上传文件时报错

**解决方案**：
- Railway 的临时目录在重启后会清空
- 建议使用云存储服务（AWS S3、Cloudflare R2）
- 或使用 Railway 的 Volume 功能持久化存储

---

## 维护和监控

### 查看日志

1. 点击 Web 服务
2. 进入 "Logs" 标签页
3. 实时查看应用日志
4. 可以搜索和过滤日志

### 监控资源使用

1. 在项目页面查看资源使用情况
2. Railway 会显示 CPU、内存、网络使用量
3. 免费额度：每月 $5

### 重启应用

1. 点击 Web 服务
2. 进入 "Settings" 标签页
3. 点击 "Restart" 按钮

### 查看部署历史

1. 点击 Web 服务
2. 进入 "Deployments" 标签页
3. 查看所有部署记录
4. 可以回滚到之前的版本

### 自定义域名

1. 点击 Web 服务
2. 进入 "Settings" 标签页
3. 在 "Domains" 部分
4. 点击 "Generate Domain" 或添加自定义域名
5. Railway 会自动配置 SSL 证书

---

## 高级配置

### 使用 Railway CLI

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 链接项目
railway link

# 查看日志
railway logs

# 运行本地命令
railway run ./mvnw spring-boot:run
```

### 配置构建命令

Railway 会自动检测，但也可以手动配置：

1. 在项目根目录创建 `railway.json`：
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "./mvnw clean package -DskipTests"
  },
  "deploy": {
    "startCommand": "java -jar target/travel-0.0.1-SNAPSHOT.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 持久化存储（文件上传）

如果需要持久化文件存储：

1. 点击 Web 服务
2. 进入 "Settings" 标签页
3. 在 "Volumes" 部分创建卷
4. 挂载到 `/uploads` 目录
5. 更新环境变量：`UPLOAD_DIR=/uploads`

---

## 成本说明

### 免费额度
- **每月 $5** 免费额度
- 超出后按使用量计费
- 适合中小型项目

### 计费项目
- 计算资源（CPU/内存）
- 数据库存储
- 网络流量

### 节省成本建议
- 开发环境可以暂停服务
- 使用较小的实例规格
- 定期清理不需要的数据

---

## 下一步

部署成功后，你可以：

1. ✅ 测试所有功能
2. ✅ 配置自定义域名
3. ✅ 设置自动备份
4. ✅ 配置监控告警
5. ✅ 优化性能

---

## 获取帮助

- Railway 文档：https://docs.railway.app
- Railway Discord：https://discord.gg/railway
- Railway 支持：support@railway.app

---

## 快速参考命令

```bash
# 本地构建测试
./mvnw clean package -DskipTests

# 本地运行（生产配置）
SPRING_PROFILES_ACTIVE=production java -jar target/travel-0.0.1-SNAPSHOT.jar

# 生成 JWT Secret
openssl rand -base64 32

# Railway CLI 命令
railway login          # 登录
railway link           # 链接项目
railway logs           # 查看日志
railway variables      # 查看环境变量
railway up             # 部署
```

