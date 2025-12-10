# Railway 部署快速修复

## 🚨 如果部署仍然失败，按以下步骤操作：

### 步骤 1: 尝试使用 Nixpacks 配置（最简单）

已创建 `nixpacks.toml`，Railway 会自动使用它。

**操作**：
```bash
git add nixpacks.toml
git commit -m "添加 Nixpacks 配置修复部署"
git push
```

等待 Railway 自动重新部署。

---

### 步骤 2: 如果步骤 1 失败，使用 Dockerfile

**操作**：

1. **在 Railway 中切换构建方式**：
   - 进入你的 Web 服务
   - 点击 "Settings" 标签
   - 找到 "Build" 部分
   - 选择 "Dockerfile" 作为构建方式
   - 保存

2. **提交 Dockerfile**：
   ```bash
   git add Dockerfile
   git commit -m "添加 Dockerfile 作为备选构建方式"
   git push
   ```

3. **Railway 会自动使用 Dockerfile 构建**

---

### 步骤 3: 如果步骤 2 也失败，完全自动检测

**操作**：

1. **临时重命名配置文件**（让 Railway 完全自动检测）：
   ```bash
   git mv railway.json railway.json.bak
   git mv nixpacks.toml nixpacks.toml.bak
   git commit -m "使用 Railway 自动检测"
   git push
   ```

2. **Railway 会自动检测为 Spring Boot 项目并构建**

---

## 🔍 检查当前错误

在尝试修复前，请先查看 Railway 的构建日志：

1. 进入 Railway 项目
2. 点击失败的部署
3. 查看 "Build" 阶段的日志
4. 找到具体的错误信息

**常见错误类型**：

| 错误信息 | 解决方案 |
|---------|---------|
| `Permission denied` | 使用 `nixpacks.toml` 或 `Dockerfile` |
| `JAVA_HOME not set` | 使用 `nixpacks.toml`（已指定 JDK 17） |
| `Maven not found` | 使用 `Dockerfile`（包含 Maven） |
| `Dependencies failed` | 检查网络或 `pom.xml` |

---

## ✅ 推荐操作顺序

1. **首先**：提交 `nixpacks.toml` 并推送
2. **如果失败**：在 Railway 设置中切换到 Dockerfile
3. **如果还失败**：使用完全自动检测

---

## 📞 需要帮助？

如果所有方案都失败，请提供：
- Railway 构建日志的完整错误信息
- 错误发生在哪个阶段（Initialization / Build / Deploy）

我可以根据具体错误提供更精确的解决方案。

