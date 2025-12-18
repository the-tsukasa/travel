-- 修复 notes 表的 image_url 字段长度问题
-- 将 image_url 从 varchar(255) 改为 TEXT 类型以支持 JSON 数组字符串

-- 方法1：直接修改（如果数据可以截断或已处理）
-- ALTER TABLE notes MODIFY COLUMN image_url TEXT;

-- 方法2：如果方法1失败，先备份数据，清空字段，再修改（谨慎使用）
-- 备份数据（可选）
-- CREATE TABLE notes_backup AS SELECT id, image_url FROM notes WHERE LENGTH(image_url) > 255;

-- 修改字段类型
ALTER TABLE notes MODIFY COLUMN image_url TEXT;

-- 注意：如果修改失败，可能需要：
-- 1. 清理超过255字符的数据，或者
-- 2. 手动截断超长数据：UPDATE notes SET image_url = LEFT(image_url, 255) WHERE LENGTH(image_url) > 255;

