# Railway 环境变量检查清单

## 🔴 当前问题

应用启动失败，错误信息：
- `Socket fail to connect to localhost. Connection refused`
- `Unable to determine Dialect without JDBC metadata`

**原因**：环境变量未正确设置，应用使用了默认的 localhost 配置。

## ✅ 必须设置的环境变量

### 步骤 1: 进入 Web 服务的 Variables 页面

1. 在 Railway 项目页面
2. 点击左侧的 **"web"** 服务（不是数据库服务）
3. 点击顶部的 **"Variables"** 标签页

### 步骤 2: 检查必需的环境变量

确保以下环境变量都已设置：

#### 1. SPRING_PROFILES_ACTIVE（必需）

```
变量名: SPRING_PROFILES_ACTIVE
值: production
```

**如果没有这个变量，应用会使用默认的 dev 配置（localhost）**

#### 2. DATABASE_URL（必需）

```
变量名: DATABASE_URL
值: jdbc:mariadb://[MYSQLHOST]:[MYSQLPORT]/[MYSQLDATABASE]?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
```

**如何获取值**：
1. 点击左侧的 **数据库服务**（MySQL）
2. 进入 **"Variables"** 标签页
3. 复制以下值：
   - `MYSQLHOST` - 例如：`containers-us-123.railway.app`
   - `MYSQLPORT` - 通常是 `3306`
   - `MYSQLDATABASE` - 通常是 `railway`
4. 组合成完整的 URL：
   ```
   jdbc:mariadb://containers-us-123.railway.app:3306/railway?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
   ```

#### 3. JWT_SECRET（必需）

```
变量名: JWT_SECRET
值: [至少32字符的随机字符串]
```

**生成方法**：
```bash
openssl rand -base64 32
```

### 步骤 3: 添加缺失的环境变量

如果缺少任何变量：

1. 点击 **"+ New Variable"** 按钮
2. 输入变量名和值
3. 点击 **"Add"**
4. Railway 会自动重新部署

## 📋 完整的环境变量列表

| 变量名 | 是否必需 | 说明 | 示例值 |
|--------|---------|------|--------|
| `SPRING_PROFILES_ACTIVE` | ✅ 必需 | 激活生产环境 | `production` |
| `DATABASE_URL` | ✅ 必需 | 数据库连接 URL | `jdbc:mariadb://host:port/db?...` |
| `JWT_SECRET` | ✅ 必需 | JWT 密钥 | `K8xL2mN9pQ4rS6tU8vW0yZ1aB3cD5eF7gH9iJ1kL3mN5pQ7rS9tU1vW3yZ5` |
| `JWT_EXPIRATION` | 可选 | JWT 过期时间 | `604800000` |
| `UPLOAD_DIR` | 可选 | 文件上传目录 | `/tmp/uploads` |

## 🔍 验证环境变量

### 方法 1: 在 Railway 中检查

1. Web 服务 → Variables 标签页
2. 确认所有必需变量都已列出
3. 检查变量值是否正确

### 方法 2: 在部署日志中检查

部署日志中应该显示：
```
The following profiles are active: production
```

如果看到 `The following profiles are active: dev`，说明 `SPRING_PROFILES_ACTIVE` 没有设置。

## 🚀 设置环境变量的步骤

### 快速设置（推荐）

1. **获取数据库信息**：
   - 数据库服务 → Variables
   - 记录 `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`

2. **生成 JWT Secret**：
   ```bash
   openssl rand -base64 32
   ```

3. **在 Web 服务中添加变量**：
   - Web 服务 → Variables → + New Variable
   - 添加以下三个变量：
     ```
     SPRING_PROFILES_ACTIVE=production
     DATABASE_URL=jdbc:mariadb://[你的MYSQLHOST]:[你的MYSQLPORT]/[你的MYSQLDATABASE]?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
     JWT_SECRET=[你生成的密钥]
     ```

4. **等待重新部署**：
   - Railway 会自动检测到环境变量变更
   - 自动触发重新部署（约 3-5 分钟）

## ✅ 部署成功后

部署成功后，日志应该显示：
```
The following profiles are active: production
Started TravelApplication in X seconds
```

数据库表会自动创建，应用可以正常使用。

## 🆘 如果仍然失败

1. **检查变量名拼写**：确保完全匹配（区分大小写）
2. **检查 DATABASE_URL 格式**：确保 URL 格式正确
3. **查看部署日志**：确认应用是否读取了正确的配置

