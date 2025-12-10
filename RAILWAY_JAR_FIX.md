# Railway JAR 文件找不到 - 修复方案

## 🔴 问题

错误信息：`Error: Unable to access jarfile target/travel-0.0.1-SNAPSHOT.jar`

**原因**：
- JAR 文件可能生成在不同的位置
- 工作目录可能不一致
- 文件名可能略有不同

## ✅ 已应用的修复

### 1. 创建了启动脚本 `start.sh`

自动查找并运行 JAR 文件：
```bash
#!/bin/bash
JAR_FILE=$(find target -name "*.jar" -type f | head -1)
java -jar "$JAR_FILE"
```

### 2. 更新了所有配置文件

- ✅ `railway.json` - 使用启动脚本
- ✅ `Procfile` - 使用启动脚本
- ✅ `nixpacks.toml` - 使用启动脚本
- ✅ `Dockerfile` - 使用通配符复制 JAR

## 🚀 下一步操作

### 提交并推送更改

```bash
git add start.sh railway.json Procfile nixpacks.toml Dockerfile
git commit -m "修复 JAR 文件路径问题：添加自动查找脚本"
git push origin main
```

Railway 会自动重新部署。

## 🔍 验证

部署成功后，启动日志应该显示：
```
查找 JAR 文件...
找到 JAR 文件: target/travel-0.0.1-SNAPSHOT.jar
启动应用...
```

## 🆘 如果仍然失败

### 检查构建日志

1. 在 Railway 的 "Build Logs" 中确认：
   - Maven 构建成功
   - JAR 文件已生成
   - 查看 `ls -la target/*.jar` 的输出

### 手动验证

如果构建成功但启动失败，检查：
- JAR 文件是否在 `target/` 目录
- 文件名是否完全匹配
- 工作目录是否正确

### 备选方案

如果脚本不工作，可以尝试：

1. **直接在 Railway 环境变量中设置启动命令**：
   ```
   START_COMMAND=java -jar $(find target -name "*.jar" | head -1)
   ```

2. **使用 Dockerfile**（更可靠）：
   - 在 Railway 设置中选择 Dockerfile
   - Dockerfile 已配置好

## 📝 技术细节

### 为什么使用脚本？

1. **灵活性**：自动查找 JAR 文件，不依赖确切文件名
2. **调试**：脚本会输出找到的文件，便于排查
3. **兼容性**：适用于不同的构建环境

### 脚本工作原理

```bash
# 查找所有 JAR 文件
find target -name "*.jar" -type f

# 取第一个找到的文件
| head -1

# 运行
java -jar "$JAR_FILE"
```

## ✅ 预期结果

修复后，应用应该能够：
1. ✅ 成功构建
2. ✅ 找到 JAR 文件
3. ✅ 成功启动
4. ✅ 监听 8080 端口

