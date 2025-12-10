# Dockerfile 部署说明

## ✅ 已切换到 Dockerfile 方案

### 更改内容

1. **更新了 `railway.json`**
   - 指定使用 Dockerfile 作为构建方式
   - 移除了 Nixpacks 配置

2. **重命名了 `nixpacks.toml`**
   - 已重命名为 `nixpacks.toml.bak`（备份）
   - Railway 现在会使用 Dockerfile

3. **Dockerfile 已优化**
   - 多阶段构建：构建阶段和运行阶段分离
   - 自动处理 JAR 文件路径
   - 支持 Railway 的 PORT 环境变量

## 🚀 部署步骤

### 1. 提交更改

```bash
git add railway.json Dockerfile nixpacks.toml.bak .dockerignore
git commit -m "切换到 Dockerfile 构建方案"
git push origin main
```

### 2. Railway 自动部署

Railway 会：
- 检测到 `railway.json` 中的 Dockerfile 配置
- 使用 Dockerfile 进行构建
- 自动部署应用

### 3. 验证部署

在 Railway 的 "Build Logs" 中应该看到：
```
Step 1/8 : FROM maven:3.9-eclipse-temurin-17 AS build
...
Step 5/8 : RUN ./mvnw clean package -DskipTests
[INFO] Building jar: /app/target/travel-0.0.1-SNAPSHOT.jar
[INFO] BUILD SUCCESS
...
Step 8/8 : ENTRYPOINT ["java", "-jar", "app.jar"]
```

在 "Deploy Logs" 中应该看到：
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
...
Started TravelApplication in X seconds
```

## 📋 Dockerfile 工作原理

### 构建阶段
1. 使用 Maven 镜像
2. 复制项目文件
3. 下载依赖
4. 构建 JAR 文件

### 运行阶段
1. 使用轻量级 JRE 镜像
2. 从构建阶段复制 JAR 文件
3. 运行应用

## ✅ 优势

- ✅ **工作目录一致**：构建和运行在同一容器中
- ✅ **文件路径可靠**：JAR 文件路径明确
- ✅ **环境隔离**：构建和运行环境分离
- ✅ **缓存优化**：Docker 层缓存加速构建

## 🆘 如果仍有问题

1. **检查构建日志**：查看 Docker 构建过程
2. **检查环境变量**：确认所有必需的环境变量已设置
3. **查看部署日志**：确认应用启动成功

