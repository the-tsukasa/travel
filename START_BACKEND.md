# 启动后端服务器

## 方法 1：使用 IntelliJ IDEA（推荐）⭐

1. **打开 IntelliJ IDEA**
2. **打开项目**
   - File → Open → 选择 `travel` 文件夹
   - 等待 Maven 依赖下载完成

3. **运行后端**
   - 找到 `src/main/java/com/example/travel/TravelApplication.java`
   - 右键 → Run 'TravelApplication'
   - 或点击右上角的运行按钮 ▶️

4. **验证启动成功**
   - 控制台显示：`Started TravelApplication in X seconds`
   - 访问：`http://localhost:8080/api/hello` 应该有响应

## 方法 2：使用命令行

```bash
# 在项目根目录（travel/）
./mvnw spring-boot:run
```

## 方法 3：先构建再运行

```bash
# 构建项目
./mvnw clean package

# 运行 JAR 文件
java -jar target/travel-0.0.1-SNAPSHOT.jar
```

## ⚠️ 启动前检查

### 1. 检查数据库是否运行

```bash
# macOS - 检查 MariaDB/MySQL
brew services list | grep mariadb
# 或
brew services list | grep mysql

# 如果没运行，启动它
brew services start mariadb
# 或
brew services start mysql
```

### 2. 检查数据库配置

确认 `src/main/resources/application.yml` 中的数据库配置：

```yaml
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/travel_db?...
    username: root
    password: 1234
```

### 3. 检查端口是否被占用

```bash
# 检查 8080 端口
lsof -i :8080

# 如果被占用，可以修改端口（在 application.yml）
server:
  port: 8081
```

## 🎯 启动成功标志

看到以下信息表示启动成功：

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.5.6)

... (各种日志信息)

Started TravelApplication in X.XXX seconds
```

## 🚨 常见启动问题

### 问题 1：数据库连接失败

**错误信息**：
```
Unable to acquire JDBC Connection
```

**解决方法**：
- 确认数据库服务正在运行
- 检查数据库用户名和密码
- 确认数据库 `travel_db` 已创建

### 问题 2：端口被占用

**错误信息**：
```
Port 8080 is already in use
```

**解决方法**：
- 关闭占用端口的程序
- 或修改 `application.yml` 中的端口号

### 问题 3：Maven 依赖下载失败

**解决方法**：
```bash
# 清理并重新下载依赖
./mvnw clean install -U
```

## 📝 完整启动流程

```bash
# 1. 确保数据库运行
brew services start mariadb

# 2. 启动后端（在项目根目录）
./mvnw spring-boot:run

# 3. 等待启动完成（看到 "Started TravelApplication"）

# 4. 在另一个终端启动前端
cd frontend
npm run dev

# 5. 浏览器访问 http://localhost:3000
```
