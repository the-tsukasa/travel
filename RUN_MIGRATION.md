# 运行数据库迁移

## 📋 前置要求

需要安装 Python 依赖包。

## 🔧 安装依赖

在终端执行：

```bash
pip3 install mysql-connector-python psycopg2-binary
```

如果遇到权限问题，使用：

```bash
pip3 install --user mysql-connector-python psycopg2-binary
```

## 🚀 运行迁移

安装依赖后，执行：

```bash
python3 migrate_to_render.py
```

## ✅ 预期输出

```
==================================================
🚀 开始数据库迁移
==================================================
📅 时间: 2025-12-19 15:00:00
📊 预计迁移: ~174 条记录
==================================================
✅ 已连接到本地 MySQL 数据库
✅ 已连接到 Render PostgreSQL 数据库

📦 迁移 users 表...
  ✅ 已迁移 12/12 个用户

📦 迁移 spots 表...
  ✅ 已迁移 20/20 个景点

📦 迁移 notes 表...
  ✅ 已迁移 18/18 条笔记

📦 迁移 likes 表...
  ✅ 已迁移 56/56 条点赞记录

📦 迁移 favorites 表...
  ✅ 已迁移 55/55 条收藏记录

📦 迁移 notifications 表...
  ✅ 已迁移 13/13 条通知

==================================================
✅ 迁移完成！
==================================================

🔌 数据库连接已关闭
```

## 🆘 如果遇到问题

### 问题 1: ModuleNotFoundError

**错误**: `ModuleNotFoundError: No module named 'mysql'`

**解决**: 安装依赖
```bash
pip3 install mysql-connector-python psycopg2-binary
```

### 问题 2: 无法连接 MySQL

**错误**: `MySQL 连接失败`

**解决**: 
- 检查本地 MySQL 是否运行: `mysql -u root -p1234 -e "SELECT 1;"`
- 确认数据库名称: `travel_db`
- 确认用户名和密码

### 问题 3: 无法连接 PostgreSQL

**错误**: `PostgreSQL 连接失败`

**解决**:
- 检查 Render 数据库连接信息
- 确认网络连接正常
- 检查防火墙设置

### 问题 4: 表不存在

**错误**: `relation "users" does not exist`

**解决**:
- 确保 Render 应用已成功启动
- 检查环境变量 `DDL_AUTO=update` 已设置
- 应用启动时会自动创建表结构

## 📝 验证迁移结果

迁移完成后，在 Render Dashboard 中验证：

1. 进入数据库服务
2. 点击 "Connect" → "psql"
3. 执行查询：

```sql
SELECT COUNT(*) FROM users;        -- 应该是 12
SELECT COUNT(*) FROM notes;        -- 应该是 18
SELECT COUNT(*) FROM spots;        -- 应该是 20
SELECT COUNT(*) FROM likes;       -- 应该是 56
SELECT COUNT(*) FROM favorites;    -- 应该是 55
SELECT COUNT(*) FROM notifications; -- 应该是 13
```

## 🎯 快速命令

```bash
# 1. 安装依赖
pip3 install mysql-connector-python psycopg2-binary

# 2. 运行迁移
python3 migrate_to_render.py

# 3. 完成！
```


