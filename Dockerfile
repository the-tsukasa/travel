# 多阶段构建 Dockerfile
# Railway 可以使用 Dockerfile 进行构建，这通常更可靠

# 阶段 1: 构建
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# 复制 Maven 配置文件
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# 给 mvnw 添加执行权限
RUN chmod +x mvnw

# 下载依赖（利用 Docker 缓存）
RUN ./mvnw dependency:go-offline -B

# 复制源代码
COPY src ./src

# 构建应用
RUN ./mvnw clean package -DskipTests

# 阶段 2: 运行
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 从构建阶段复制 JAR 文件（使用通配符以支持不同版本）
COPY --from=build /app/target/travel-*.jar app.jar

# 暴露端口（Railway 会自动设置 PORT 环境变量）
EXPOSE 8080

# 运行应用
# Railway 会自动设置 PORT 环境变量，Spring Boot 会读取它
ENTRYPOINT ["java", "-jar", "app.jar"]

