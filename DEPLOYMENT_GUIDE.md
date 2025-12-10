# 云端部署指南

本项目是一个 Spring Boot 全栈应用（前端 + 后端 + 数据库），需要同时部署前端静态文件、后端 API 和数据库。

## 📋 方案对比

| 方案 | 难度 | 免费额度 | 推荐度 | 特点 |
|------|------|----------|--------|------|
| **Railway** | ⭐⭐ | $5/月 | ⭐⭐⭐⭐⭐ | 最简单，自动部署，支持数据库 |
| **Render** | ⭐⭐ | 有限 | ⭐⭐⭐⭐ | 类似 Railway，配置简单 |
| **Fly.io** | ⭐⭐⭐ | 免费 | ⭐⭐⭐⭐ | 全球边缘部署，性能好 |
| **Heroku** | ⭐⭐ | 无 | ⭐⭐⭐ | 经典平台，需付费 |
| **Vercel + 云数据库** | ⭐⭐⭐⭐ | 免费 | ⭐⭐⭐ | 前端 Vercel，后端需拆分 |
| **阿里云/腾讯云** | ⭐⭐⭐⭐ | 需付费 | ⭐⭐⭐ | 国内访问快，需备案 |

---

## 🚀 推荐方案 1: Railway（最简单）

### 优点
- ✅ 一键部署，自动检测 Spring Boot
- ✅ 内置数据库服务（MySQL/PostgreSQL）
- ✅ 免费额度 $5/月
- ✅ 自动 HTTPS
- ✅ 支持环境变量

### 部署步骤

#### 1. 准备项目文件

创建 `Procfile`（可选，Railway 会自动检测）：
```
web: java -jar target/travel-0.0.1-SNAPSHOT.jar
```

#### 2. 修改配置文件

创建 `application-production.yml`：
```yaml
server:
  port: ${PORT:8080}

spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.mariadb.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:604800000}

file:
  upload-dir: /tmp/uploads
```

#### 3. 在 Railway 部署

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库
5. 添加 MySQL 数据库服务
6. 设置环境变量：
   - `DATABASE_URL`: Railway 会自动提供
   - `DB_USERNAME`: 数据库用户名
   - `DB_PASSWORD`: 数据库密码
   - `JWT_SECRET`: 你的 JWT 密钥
   - `SPRING_PROFILES_ACTIVE`: `production`
7. 部署完成，Railway 会提供访问 URL

---

## 🌐 推荐方案 2: Render

### 优点
- ✅ 免费层可用（有休眠限制）
- ✅ 支持 PostgreSQL/MySQL
- ✅ 自动 HTTPS
- ✅ 简单配置

### 部署步骤

#### 1. 创建 `render.yaml`

```yaml
services:
  - type: web
    name: travel-app
    env: java
    buildCommand: ./mvnw clean package -DskipTests
    startCommand: java -jar target/travel-0.0.1-SNAPSHOT.jar
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: travel-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
    healthCheckPath: /actuator/health

databases:
  - name: travel-db
    plan: free
    databaseName: travel_db
```

#### 2. 在 Render 部署

1. 访问 [render.com](https://render.com)
2. 连接 GitHub 仓库
3. 选择 "New Web Service"
4. 选择你的仓库
5. Render 会自动检测 `render.yaml`
6. 部署完成

---

## ✈️ 推荐方案 3: Fly.io

### 优点
- ✅ 免费额度充足
- ✅ 全球边缘部署
- ✅ 支持持久化存储
- ✅ 性能优秀

### 部署步骤

#### 1. 安装 Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. 创建 `fly.toml`

```toml
app = "your-app-name"
primary_region = "hkg"  # 香港，或选择其他区域

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  SPRING_PROFILES_ACTIVE = "production"
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[[services.mounts]]
  source = "uploads"
  destination = "/uploads"
```

#### 3. 部署

```bash
fly auth login
fly launch
fly deploy
```

---

## 🔧 通用配置修改

### 1. 修改 `application.yml` 支持多环境

```yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

---
spring:
  config:
    activate:
      on-profile: production
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

### 2. 修改 CORS 配置

确保 `CorsConfig.java` 允许生产域名：

```java
@Configuration
public class CorsConfig {
    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;
    
    // ... 使用 allowedOrigins 配置
}
```

### 3. 文件上传路径

使用云存储服务（如 AWS S3、Cloudflare R2）或临时目录：

```yaml
file:
  upload-dir: ${UPLOAD_DIR:/tmp/uploads}
```

---

## 📦 构建和打包

### 本地构建

```bash
./mvnw clean package -DskipTests
```

### 验证 JAR 文件

```bash
java -jar target/travel-0.0.1-SNAPSHOT.jar
```

---

## 🔐 环境变量清单

部署时需要设置的环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接 URL | `jdbc:mariadb://host:3306/db` |
| `DB_USERNAME` | 数据库用户名 | `root` |
| `DB_PASSWORD` | 数据库密码 | `your_password` |
| `JWT_SECRET` | JWT 密钥 | `your_secret_key` |
| `JWT_EXPIRATION` | JWT 过期时间（毫秒） | `604800000` |
| `SPRING_PROFILES_ACTIVE` | Spring 环境 | `production` |
| `PORT` | 服务端口 | `8080` |

---

## 🎯 快速开始（Railway 示例）

1. **Fork/Clone 项目到 GitHub**

2. **访问 Railway**
   - 注册账号：https://railway.app
   - 使用 GitHub 登录

3. **创建项目**
   - New Project → Deploy from GitHub repo
   - 选择你的仓库

4. **添加数据库**
   - 点击 "+ New" → "Database" → "MySQL"
   - Railway 会自动创建数据库

5. **配置环境变量**
   - 在服务设置中添加环境变量
   - Railway 会自动提供 `DATABASE_URL`

6. **部署**
   - Railway 会自动检测并构建
   - 等待部署完成

7. **获取访问地址**
   - Railway 会提供类似 `https://your-app.railway.app` 的地址

---

## ⚠️ 注意事项

1. **数据库迁移**
   - 首次部署需要运行数据库迁移脚本
   - 可以在应用启动时自动执行（`ddl-auto: update`）

2. **文件上传**
   - 临时目录在重启后会丢失
   - 建议使用云存储（S3、R2 等）

3. **HTTPS**
   - 所有推荐平台都自动提供 HTTPS
   - 无需额外配置

4. **免费额度限制**
   - Railway: $5/月免费额度
   - Render: 免费层有休眠限制
   - Fly.io: 免费额度较充足

---

## 📚 更多资源

- [Railway 文档](https://docs.railway.app)
- [Render 文档](https://render.com/docs)
- [Fly.io 文档](https://fly.io/docs)
- [Spring Boot 部署指南](https://spring.io/guides/gs/spring-boot-for-azure/)

---

## 🆘 常见问题

**Q: 数据库连接失败？**  
A: 检查环境变量 `DATABASE_URL` 是否正确，确保数据库服务已启动。

**Q: 静态文件无法访问？**  
A: 确保 Spring Boot 配置了静态资源路径，或使用 CDN 服务。

**Q: JWT 认证失败？**  
A: 确保生产环境的 `JWT_SECRET` 与开发环境不同，且足够安全。

**Q: 文件上传失败？**  
A: 检查上传目录权限，或使用云存储服务。

