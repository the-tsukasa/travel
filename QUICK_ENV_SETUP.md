# Railway 环境变量快速设置指南

## 🚨 当前问题

应用无法连接数据库，因为环境变量未设置。

## ⚡ 5 分钟快速修复

### 步骤 1: 获取数据库连接信息（1分钟）

1. 在 Railway 项目页面
2. 点击左侧的 **数据库服务**（MySQL）
3. 进入 **"Variables"** 标签页
4. 记录以下值：
   - `MYSQLHOST` = `containers-us-xxx.railway.app`（示例）
   - `MYSQLPORT` = `3306`
   - `MYSQLDATABASE` = `railway`（通常是这个）

### 步骤 2: 生成 JWT Secret（30秒）

在终端运行：
```bash
openssl rand -base64 32
```
复制生成的字符串。

### 步骤 3: 设置环境变量（2分钟）

1. 点击左侧的 **"web"** 服务（不是数据库）
2. 进入 **"Variables"** 标签页
3. 点击 **"+ New Variable"**，添加以下三个变量：

#### 变量 1: SPRING_PROFILES_ACTIVE
```
变量名: SPRING_PROFILES_ACTIVE
值: production
```

#### 变量 2: DATABASE_URL
```
变量名: DATABASE_URL
值: jdbc:mariadb://[MYSQLHOST]:[MYSQLPORT]/[MYSQLDATABASE]?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
```

**替换示例**（使用你刚才记录的值）：
```
jdbc:mariadb://containers-us-123.railway.app:3306/railway?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
```

#### 变量 3: JWT_SECRET
```
变量名: JWT_SECRET
值: [你刚才生成的密钥]
```

### 步骤 4: 等待部署（2分钟）

1. Railway 会自动检测到环境变量变更
2. 自动触发重新部署
3. 等待 2-3 分钟

### 步骤 5: 验证

在 "Deploy Logs" 中应该看到：
```
The following profiles are active: production
Started TravelApplication in X seconds
```

## ✅ 完成！

如果看到 `Started TravelApplication`，说明部署成功！

数据库表会自动创建，应用可以正常使用了。

## 📝 示例

假设你的数据库信息是：
- MYSQLHOST: `containers-us-123.railway.app`
- MYSQLPORT: `3306`
- MYSQLDATABASE: `railway`
- JWT_SECRET: `K8xL2mN9pQ4rS6tU8vW0yZ1aB3cD5eF7gH9iJ1kL3mN5pQ7rS9tU1vW3yZ5`

那么你需要设置的三个变量是：

```
SPRING_PROFILES_ACTIVE=production

DATABASE_URL=jdbc:mariadb://containers-us-123.railway.app:3306/railway?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC

JWT_SECRET=K8xL2mN9pQ4rS6tU8vW0yZ1aB3cD5eF7gH9iJ1kL3mN5pQ7rS9tU1vW3yZ5
```

