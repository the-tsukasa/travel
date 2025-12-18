# 登录 500 错误修复指南

## 🔍 问题分析

从错误信息看，`/api/auth/login` 接口返回了 **500 Internal Server Error**，这是后端服务器内部错误。

## ✅ 已修复的问题

我已经修复了以下潜在问题：

1. **用户角色为 null 的处理**
   - 在 `UserServiceImpl.login()` 中添加了 null 检查
   - 在 `AuthController.login()` 中添加了 null 检查

2. **异常处理优化**
   - 将 `RuntimeException` 改为 `ResourceNotFoundException`，错误处理更统一

## 🔧 可能的原因和解决方案

### 1. 数据库连接问题

**检查方法**：
- 查看后端控制台日志，看是否有数据库连接错误
- 确认 MySQL/MariaDB 是否正在运行

**解决方法**：
```bash
# 检查数据库是否运行
# macOS
brew services list | grep mariadb
# 或
mysql -u root -p -e "SELECT 1;"
```

### 2. JWT 密钥配置问题

**检查方法**：
- 查看后端启动日志，看 JWT 初始化是否成功
- 检查 `application.yml` 中的 `jwt.secret` 配置

**解决方法**：
- 确保 `jwt.secret` 至少 32 个字符（256 位）
- 如果使用环境变量，确保 `JWT_SECRET` 已设置

### 3. 用户数据问题

**检查方法**：
- 检查数据库中用户是否存在
- 检查用户角色字段是否为 null

**解决方法**：
```sql
-- 检查用户是否存在
SELECT * FROM users WHERE username = 'admin';

-- 如果 role 为 null，更新为 'USER'
UPDATE users SET role = 'USER' WHERE role IS NULL;
```

### 4. 密码编码问题

**检查方法**：
- 确认用户密码是否正确加密存储

**解决方法**：
- 如果用户是旧数据，可能需要重新注册
- 或者手动更新密码（使用 BCrypt 加密）

## 🚀 立即尝试的解决方案

### 方案 1：重启后端服务

```bash
# 停止后端服务（Ctrl+C）
# 重新启动
./mvnw spring-boot:run
# 或使用 IntelliJ IDEA 重新运行
```

### 方案 2：检查后端日志

查看 IntelliJ IDEA 的控制台输出，查找：
- `ERROR` 级别的日志
- `Exception` 或 `Stack trace`
- JWT 相关的错误信息

### 方案 3：测试 API 直接调用

使用 curl 或 Postman 测试：

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### 方案 4：检查数据库

```sql
-- 连接到数据库
mysql -u root -p

-- 使用数据库
USE travel_db;

-- 检查用户表
SELECT id, username, email, role FROM users;

-- 检查是否有 admin 用户
SELECT * FROM users WHERE username = 'admin';
```

## 📝 调试步骤

1. **查看后端控制台**
   - 在 IntelliJ IDEA 中查看运行日志
   - 查找 `ERROR` 或 `Exception` 关键字

2. **检查前端请求**
   - 打开浏览器开发者工具（F12）
   - 查看 Network 标签
   - 点击失败的 `/api/auth/login` 请求
   - 查看 Response 标签，看具体的错误信息

3. **检查后端代码**
   - 确认 `UserServiceImpl.login()` 方法正常
   - 确认 `JwtUtil.generateToken()` 方法正常
   - 确认数据库连接正常

## 🎯 快速修复检查清单

- [ ] 后端服务正在运行（端口 8080）
- [ ] 数据库服务正在运行
- [ ] 数据库连接配置正确（`application.yml`）
- [ ] JWT 密钥配置正确（至少 32 字符）
- [ ] 用户存在于数据库中
- [ ] 用户密码正确
- [ ] 用户角色不为 null（已修复代码处理）

## 💡 如果问题仍然存在

请提供以下信息：

1. **后端控制台的完整错误日志**（特别是包含 `Exception` 或 `ERROR` 的部分）
2. **浏览器 Network 标签中的响应内容**（点击失败的请求，查看 Response）
3. **数据库中的用户数据**（用户名、角色等）

这样我可以更准确地定位问题。
