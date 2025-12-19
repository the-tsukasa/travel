# 数据库迁移指南：本地 MySQL → Render PostgreSQL

## 📊 数据库信息

- **数据库大小**: 0.39 MB
- **总记录数**: ~174 条
- **主要表**:
  - users: 12 条
  - notes: 18 条
  - spots: 20 条
  - likes: 56 条
  - favorites: 55 条
  - notifications: 13 条

## 🚀 推荐方案：Python 脚本迁移（最简单）

由于数据量很小（< 200 条记录），使用 Python 脚本是最简单可靠的方法。

### 步骤 1: 安装依赖

```bash
pip install mysql-connector-python psycopg2-binary
```

或者使用 requirements 文件：

```bash
pip install -r requirements_migrate.txt
```

### 步骤 2: 运行迁移脚本

```bash
python3 migrate_to_render.py
```

### 步骤 3: 验证迁移结果

在 Render Dashboard 中：
1. 进入数据库服务
2. 点击 "Connect" → "psql"
3. 执行查询验证：

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM notes;
SELECT COUNT(*) FROM spots;
SELECT COUNT(*) FROM likes;
SELECT COUNT(*) FROM favorites;
SELECT COUNT(*) FROM notifications;
```

---

## 🔧 手动迁移方案（备选）

如果 Python 脚本不可用，可以使用以下方法：

### 方法 1: 使用 mysqldump + 转换

```bash
# 1. 导出数据
mysqldump -u root -p1234 travel_db > local_data.sql

# 2. 手动编辑 SQL 文件，转换格式：
# - AUTO_INCREMENT → SERIAL
# - ENGINE=InnoDB → 删除
# - 反引号 → 双引号或删除

# 3. 导入到 PostgreSQL
psql -h dpg-d52l21d6ubrc73a0o1o0-a.singapore-postgres.render.com \
     -U travel_user \
     -d travel_db_uxr3 \
     -f converted_data.sql
```

### 方法 2: 使用 pgloader（如果已安装）

```bash
pgloader \
  mysql://root:1234@localhost:3306/travel_db \
  postgresql://travel_user:bOCLTK0bSB5q5bfyYUG2ZfWTg7NEXJg1@dpg-d52l21d6ubrc73a0o1o0-a.singapore-postgres.render.com:5432/travel_db_uxr3
```

---

## ⚠️ 注意事项

1. **密码哈希**: 确保密码加密方式兼容
2. **时间戳**: MySQL 和 PostgreSQL 的时间戳格式相同，应该没问题
3. **自增 ID**: PostgreSQL 使用 SERIAL，脚本会自动处理
4. **外键约束**: 迁移顺序很重要（users → spots → notes → likes/favorites → notifications）

---

## ✅ 迁移后检查

1. **验证数据完整性**
   ```sql
   -- 在 Render PostgreSQL 中执行
   SELECT COUNT(*) FROM users;        -- 应该是 12
   SELECT COUNT(*) FROM notes;        -- 应该是 18
   SELECT COUNT(*) FROM spots;        -- 应该是 20
   SELECT COUNT(*) FROM likes;       -- 应该是 56
   SELECT COUNT(*) FROM favorites;    -- 应该是 55
   SELECT COUNT(*) FROM notifications; -- 应该是 13
   ```

2. **测试应用功能**
   - 登录现有用户
   - 查看笔记列表
   - 查看景点列表
   - 测试点赞和收藏功能

---

## 🆘 如果迁移失败

1. **检查连接**: 确保可以连接到 Render PostgreSQL
2. **检查表结构**: 确保表已创建（使用 `ddl-auto: update`）
3. **查看错误日志**: Python 脚本会显示具体错误信息
4. **部分迁移**: 如果某些表迁移失败，可以单独重试

---

## 📝 迁移脚本说明

`migrate_to_render.py` 脚本会：
- ✅ 自动处理数据类型转换
- ✅ 使用 `ON CONFLICT` 避免重复数据
- ✅ 按正确顺序迁移（考虑外键）
- ✅ 显示详细的迁移进度
- ✅ 自动提交事务

---

**推荐直接使用 Python 脚本，简单快速！** 🚀

