# Railway 部署故障排除指南

## 🔧 常见问题和解决方案

### 问题 1: mvnw Permission Denied

**错误信息**：
```
/bin/bash: line 1: ./mvnw: Permission denied
```

**解决方案**：
- ✅ 已创建 `nixpacks.toml` 自动处理权限
- ✅ 已更新 `railway.json` 简化配置
- ✅ 已创建 `Dockerfile` 作为备选方案

### 问题 2: 构建失败 - 找不到 Java

**错误信息**：
```
Error: JAVA_HOME is not set
```

**解决方案**：
- `nixpacks.toml` 已指定 JDK 17
- 或使用 `Dockerfile`（已包含 Java 环境）

### 问题 3: 依赖下载失败

**错误信息**：
```
Failed to download dependencies
```

**解决方案**：
- 检查网络连接
- 确保 `pom.xml` 中的仓库配置正确
- Railway 会自动重试

---

## 🚀 三种部署方案

### 方案 1: 使用 Nixpacks（自动检测）- 推荐

Railway 会自动使用 `nixpacks.toml` 配置：

1. **确保文件已提交**：
   ```bash
   git add nixpacks.toml railway.json
   git commit -m "添加 Nixpacks 配置"
   git push
   ```

2. **Railway 会自动检测并使用配置**

### 方案 2: 使用 Dockerfile（最可靠）

如果 Nixpacks 仍有问题，使用 Dockerfile：

1. **在 Railway 项目设置中**：
   - 进入 Web 服务
   - Settings → Build
   - 选择 "Dockerfile" 作为构建方式

2. **提交 Dockerfile**：
   ```bash
   git add Dockerfile
   git commit -m "添加 Dockerfile"
   git push
   ```

### 方案 3: 完全自动检测（最简单）

删除所有自定义配置，让 Railway 完全自动检测：

1. **删除或重命名配置文件**：
   ```bash
   # 临时重命名，让 Railway 自动检测
   mv railway.json railway.json.bak
   mv nixpacks.toml nixpacks.toml.bak
   ```

2. **Railway 会自动检测 Spring Boot 项目**

---

## 📋 检查清单

### 部署前检查

- [ ] `mvnw` 文件已提交到 Git
- [ ] `pom.xml` 配置正确
- [ ] 环境变量已设置（`SPRING_PROFILES_ACTIVE=production`）
- [ ] 数据库服务已创建并连接
- [ ] `DATABASE_URL` 环境变量已设置

### 构建检查

- [ ] 构建日志中没有权限错误
- [ ] Maven 依赖下载成功
- [ ] JAR 文件生成成功
- [ ] 没有编译错误

### 运行检查

- [ ] 应用启动成功
- [ ] 端口配置正确（Railway 自动设置 PORT）
- [ ] 数据库连接成功
- [ ] 日志中没有错误

---

## 🐛 调试步骤

### 1. 查看构建日志

在 Railway 的 "Deployments" 标签页：
- 点击失败的部署
- 查看详细的构建日志
- 找到具体的错误信息

### 2. 本地测试构建

```bash
# 确保本地可以构建
chmod +x mvnw
./mvnw clean package -DskipTests

# 检查 JAR 文件
ls -lh target/travel-0.0.1-SNAPSHOT.jar
```

### 3. 测试运行

```bash
# 本地运行 JAR
java -jar target/travel-0.0.1-SNAPSHOT.jar
```

### 4. 检查环境变量

在 Railway Web 服务的 "Variables" 标签页：
- 确认所有必需的环境变量都已设置
- 检查变量值是否正确

---

## 🔄 切换构建方式

### 从 Nixpacks 切换到 Dockerfile

1. 在 Railway 项目设置中：
   - Web 服务 → Settings → Build
   - 选择 "Dockerfile"
   - 保存

2. 触发新的部署

### 从 Dockerfile 切换回自动检测

1. 在 Railway 项目设置中：
   - Web 服务 → Settings → Build
   - 选择 "Nixpacks" 或 "Auto-detect"
   - 保存

---

## 📝 推荐的配置顺序

1. **首先尝试**：使用 `nixpacks.toml`（已创建）
2. **如果失败**：使用 `Dockerfile`（已创建）
3. **最后尝试**：完全自动检测（删除所有配置文件）

---

## 🆘 仍然失败？

如果所有方案都失败，请提供：

1. **构建日志的完整错误信息**
2. **Railway 部署页面的截图**
3. **本地构建是否成功**（`./mvnw clean package`）

我可以根据具体错误提供更精确的解决方案。

