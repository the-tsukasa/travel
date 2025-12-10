# 快速部署指南

## 🎯 最简单的部署方式：Railway（推荐）

### 5 分钟快速部署

1. **准备 GitHub 仓库**
   ```bash
   git add .
   git commit -m "准备部署"
   git push origin main
   ```

2. **访问 Railway**
   - 打开 https://railway.app
   - 使用 GitHub 登录

3. **创建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

4. **添加数据库**
   - 在项目中点击 "+ New"
   - 选择 "Database" → "MySQL"
   - Railway 会自动创建数据库

5. **配置环境变量**
   在 Web Service 的设置中添加：
   ```
   SPRING_PROFILES_ACTIVE=production
   JWT_SECRET=你的安全密钥（至少32字符）
   ```
   
   数据库相关变量 Railway 会自动提供，无需手动设置。

6. **部署完成**
   - Railway 会自动构建和部署
   - 等待 2-3 分钟
   - 获取你的应用 URL（如：`https://your-app.railway.app`）

7. **测试应用**
   - 访问提供的 URL
   - 测试注册/登录功能

---

## 🔧 本地测试生产配置

在部署前，可以先在本地测试生产配置：

```bash
# 设置环境变量
export SPRING_PROFILES_ACTIVE=production
export DATABASE_URL=jdbc:mariadb://localhost:3306/travel_db
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret_key

# 构建并运行
./mvnw clean package -DskipTests
java -jar target/travel-0.0.1-SNAPSHOT.jar
```

---

## 📦 其他平台快速部署

### Render
1. 访问 https://render.com
2. 连接 GitHub 仓库
3. Render 会自动检测 `render.yaml`
4. 点击部署

### Fly.io
```bash
# 安装 CLI
curl -L https://fly.io/install.sh | sh

# 登录和部署
fly auth login
fly launch
fly deploy
```

---

## ⚡ 一键部署脚本（Railway）

如果你使用 Railway，可以创建一个 GitHub Action 自动部署：

创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Build
        run: ./mvnw clean package -DskipTests
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: your-service-name
```

---

## 🆘 需要帮助？

- 查看详细文档：`DEPLOYMENT_GUIDE.md`
- 检查清单：`DEPLOYMENT_CHECKLIST.md`
- Railway 文档：https://docs.railway.app
- Render 文档：https://render.com/docs

