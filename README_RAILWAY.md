# Railway 部署 - 文件索引

## 📚 文档文件

### 快速开始
- **RAILWAY_QUICK_START.md** - 5分钟快速部署指南 ⭐ **推荐从这里开始**

### 详细文档
- **RAILWAY_DEPLOYMENT.md** - 完整的 Railway 部署文档（包含所有细节）

### 通用部署文档
- **DEPLOYMENT_GUIDE.md** - 多平台部署方案对比
- **DEPLOYMENT_CHECKLIST.md** - 部署前检查清单
- **QUICK_START.md** - 通用快速开始指南

---

## ⚙️ 配置文件

### Railway 专用配置
- **railway.json** - Railway 构建和部署配置
- **Procfile** - 应用启动命令（Railway 会自动检测，但可以手动指定）
- **railway-env-template.txt** - 环境变量配置模板

### 应用配置
- **src/main/resources/application.yml** - 已配置支持多环境和 Railway

---

## 🚀 快速开始

### 最简单的部署方式

1. **阅读快速指南**
   ```bash
   # 打开文件查看
   cat RAILWAY_QUICK_START.md
   ```

2. **准备环境变量**
   ```bash
   # 生成 JWT Secret
   openssl rand -base64 32
   ```

3. **按照 RAILWAY_QUICK_START.md 的步骤操作**

---

## 📋 部署步骤摘要

1. ✅ 注册 Railway 账号（https://railway.app）
2. ✅ 创建项目并连接 GitHub 仓库
3. ✅ 添加 MySQL 数据库服务
4. ✅ 配置环境变量（参考 `railway-env-template.txt`）
5. ✅ 等待部署完成
6. ✅ 获取访问地址并测试

---

## 🔧 必需的环境变量

```bash
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=jdbc:mariadb://host:port/database?useUnicode=true&characterEncoding=utf8&useSSL=true&serverTimezone=UTC
JWT_SECRET=你的安全密钥（至少32字符）
```

详细说明请查看 `railway-env-template.txt`

---

## 🆘 需要帮助？

1. **快速问题** → 查看 `RAILWAY_QUICK_START.md` 的常见问题部分
2. **详细问题** → 查看 `RAILWAY_DEPLOYMENT.md`
3. **Railway 官方文档** → https://docs.railway.app
4. **Railway Discord** → https://discord.gg/railway

---

## 📝 文件说明

| 文件 | 用途 | 必需 |
|------|------|------|
| `railway.json` | Railway 构建配置 | 可选（Railway 会自动检测） |
| `Procfile` | 启动命令 | 可选（Railway 会自动检测） |
| `application.yml` | Spring Boot 配置 | ✅ 必需 |
| `railway-env-template.txt` | 环境变量参考 | 参考用 |

---

## ✅ 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Railway 账号已注册
- [ ] 项目已创建并连接 GitHub
- [ ] MySQL 数据库已添加
- [ ] 环境变量已配置
- [ ] JWT_SECRET 已生成并设置
- [ ] 部署成功
- [ ] 应用可以访问
- [ ] 功能测试通过

完整清单请查看 `DEPLOYMENT_CHECKLIST.md`

