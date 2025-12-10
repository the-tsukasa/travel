# Railway 部署问题修复

## 🔧 已修复的问题

### 问题：`./mvnw: Permission denied`

**错误信息**：
```
/bin/bash: line 1: ./mvnw: Permission denied
"./mvnw clean package -DskipTests" did not complete successfully: exit code: 126
```

**原因**：
Maven Wrapper (`mvnw`) 文件缺少执行权限。在 Linux/Unix 系统中，脚本文件需要有执行权限才能运行。

**已应用的修复**：

1. ✅ **更新了 `railway.json`**
   - 构建命令现在包含 `chmod +x ./mvnw &&` 来确保权限
   - 修改后的命令：`chmod +x ./mvnw && ./mvnw clean package -DskipTests`

2. ✅ **给本地 `mvnw` 添加了执行权限**
   - 已运行 `chmod +x mvnw`

**下一步操作**：

1. **提交更改到 Git**：
   ```bash
   git add railway.json mvnw
   git commit -m "修复 Railway 部署：添加 mvnw 执行权限"
   git push origin main
   ```

2. **Railway 会自动重新部署**
   - Railway 检测到 GitHub 推送后会自动触发新的部署
   - 新的构建应该会成功

3. **如果问题仍然存在**：
   - 检查 Railway 构建日志
   - 确认 `railway.json` 已正确提交
   - 可以尝试手动触发重新部署

---

## 📝 验证修复

部署成功后，你应该看到：
- ✅ Initialization - 成功
- ✅ Build > Build image - 成功
- ✅ Deploy - 成功
- ✅ 应用可以访问

---

## 🆘 如果仍有问题

### 方案 1: 使用 bash 执行
如果权限问题仍然存在，可以修改 `railway.json`：

```json
{
  "build": {
    "buildCommand": "bash mvnw clean package -DskipTests"
  }
}
```

### 方案 2: 使用 Maven 直接构建
如果系统已安装 Maven：

```json
{
  "build": {
    "buildCommand": "mvn clean package -DskipTests"
  }
}
```

### 方案 3: 检查文件权限
确保 `mvnw` 文件在 Git 中有执行权限：

```bash
# 检查 Git 中的文件模式
git ls-files --stage mvnw

# 如果显示 100644，需要改为 100755
git update-index --chmod=+x mvnw
git commit -m "设置 mvnw 执行权限"
git push
```

---

## ✅ 修复完成

现在可以重新部署了！Railway 应该能够成功构建你的应用。

