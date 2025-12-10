# Railway 快速部署指南 🚀

## 5 分钟快速部署

### 前置条件
- ✅ GitHub 账号
- ✅ 代码已推送到 GitHub
- ✅ Railway 账号（免费注册）

---

## 步骤 1: 注册 Railway（1分钟）

1. 访问 https://railway.app
2. 点击 "Login" → "Login with GitHub"
3. 授权 Railway 访问你的 GitHub

---

## 步骤 2: 创建项目（1分钟）

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 `travel` 仓库
4. Railway 会自动检测为 Java 项目并开始构建

---

## 步骤 3: 添加数据库（1分钟）

1. 在项目页面，点击 **"+ New"**
2. 选择 **"Database"** → **"MySQL"**
3. 等待数据库初始化（约 1-2 分钟）

---

## 步骤 4: 配置环境变量（2分钟）

### 4.1 获取数据库连接信息

1. 点击 **数据库服务**
2. 进入 **"Variables"** 标签页
3. 记录以下值：
   - `MYSQLHOST` - 例如：`containers-us-123.railway.app`
   - `MYSQLPORT` - 通常是 `3306`
   - `MYSQLDATABASE` - 数据库名
   - `MYSQLUSER` - 用户名
   - `MYSQLPASSWORD` - 密码

### 4.2 生成 JWT Secret

在终端运行：
```bash
openssl rand -base64 32
```
复制生成的字符串。

### 4.3 在 Web 服务中设置环境变量

1. 点击 **Web 服务**（不是数据库服务）
2. 进入 **"Variables"** 标签页
3. 点击 **"+ New Variable"**，添加以下变量：

```bash
# 必需变量
SPRING_PROFILES_ACTIVE=production

# 数据库连接（使用完整 URL）
DATABASE_URL=jdbc:mariadb://[MYSQLHOST]:[MYSQLPORT]/[MYSQLDATABASE]?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC

# 替换上面的 [MYSQLHOST]、[MYSQLPORT]、[MYSQLDATABASE] 为实际值
# 例如：
# DATABASE_URL=jdbc:mariadb://containers-us-123.railway.app:3306/railway?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC

# JWT 配置
JWT_SECRET=你刚才生成的密钥

# 可选
JWT_EXPIRATION=604800000
UPLOAD_DIR=/tmp/uploads
```

**示例**（替换为你的实际值）：
```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=jdbc:mariadb://containers-us-123.railway.app:3306/railway?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
JWT_SECRET=K8xL2mN9pQ4rS6tU8vW0yZ1aB3cD5eF7gH9iJ1kL3mN5pQ7rS9tU1vW3yZ5
```

---

## 步骤 5: 等待部署完成

1. Railway 会自动检测到环境变量变更
2. 自动重新构建和部署（约 3-5 分钟）
3. 在 **"Deployments"** 标签页查看构建进度
4. 在 **"Logs"** 标签页查看实时日志

---

## 步骤 6: 获取访问地址

1. 部署完成后，点击 Web 服务的 **"Settings"** 标签
2. 在 **"Domains"** 部分，Railway 会提供一个默认域名
3. 例如：`https://travel-production.up.railway.app`
4. 点击域名即可访问你的应用！

---

## ✅ 验证部署

1. **访问首页**
   - 打开提供的 URL
   - 应该能看到登录页面

2. **测试注册**
   - 点击注册
   - 创建测试账号

3. **测试登录**
   - 使用刚创建的账号登录
   - 验证 JWT 认证是否工作

4. **检查日志**
   - 在 Railway 的 "Logs" 标签页
   - 确认没有错误信息

---

## 🐛 常见问题快速解决

### 问题 1: 构建失败
**解决**：检查构建日志，确保 `pom.xml` 正确

### 问题 2: 数据库连接失败
**解决**：
- 确认 `DATABASE_URL` 格式正确
- 检查数据库服务是否已启动
- 验证用户名密码是否正确

### 问题 3: 应用无法访问
**解决**：
- 查看 "Logs" 标签页的错误信息
- 确认环境变量都已设置
- 检查端口配置

### 问题 4: JWT 认证失败
**解决**：
- 确认 `JWT_SECRET` 已设置
- 检查前端是否正确发送 Authorization header

---

## 📝 后续操作

### 自定义域名
1. 在 Web 服务 → Settings → Domains
2. 添加你的自定义域名
3. Railway 会自动配置 SSL

### 查看监控
- 在项目页面查看资源使用情况
- 免费额度：每月 $5

### 更新代码
- 推送到 GitHub 的 main 分支
- Railway 会自动重新部署

---

## 🎉 完成！

你的应用现在已经运行在云端了！

**需要帮助？**
- 查看详细文档：`RAILWAY_DEPLOYMENT.md`
- Railway 文档：https://docs.railway.app

