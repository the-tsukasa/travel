-- 添加笔记状态相关字段的数据库迁移脚本
-- 执行日期：2025-01-XX
-- 说明：为笔记表添加状态机相关字段，支持 DRAFT、PENDING、PUBLISHED、REJECTED、PRIVATE 五种状态

-- 1. 添加状态字段（枚举类型，使用 VARCHAR）
ALTER TABLE notes 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- 2. 添加退回理由字段
ALTER TABLE notes 
ADD COLUMN reject_reason TEXT;

-- 3. 添加提交审核时间字段
ALTER TABLE notes 
ADD COLUMN submitted_at TIMESTAMP;

-- 4. 添加审核时间字段
ALTER TABLE notes 
ADD COLUMN reviewed_at TIMESTAMP;

-- 5. 添加审核人字段（外键关联到 users 表）
ALTER TABLE notes 
ADD COLUMN reviewed_by BIGINT;

-- 6. 添加外键约束（审核人）
ALTER TABLE notes 
ADD CONSTRAINT fk_notes_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 7. 为状态字段添加索引（提高查询性能）
CREATE INDEX idx_notes_status ON notes(status);

-- 8. 为提交时间添加索引（用于排序）
CREATE INDEX idx_notes_submitted_at ON notes(submitted_at);

-- 9. 迁移现有数据
-- 将 is_approved = true 的记录设置为 PUBLISHED
UPDATE notes 
SET status = 'PUBLISHED' 
WHERE is_approved = true;

-- 将 is_approved = false 的记录设置为 PENDING（假设它们都是待审核的）
UPDATE notes 
SET status = 'PENDING' 
WHERE is_approved = false;

-- 10. 添加状态字段的检查约束（确保只允许有效的状态值）
-- 注意：MySQL 不支持 CHECK 约束，但可以在应用层验证
-- 对于 PostgreSQL，可以使用以下语句：
-- ALTER TABLE notes ADD CONSTRAINT chk_notes_status 
-- CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'PRIVATE'));

-- 11. 添加注释（MySQL 5.7+ 支持）
-- ALTER TABLE notes MODIFY COLUMN status VARCHAR(20) 
-- COMMENT '笔记状态：DRAFT(草稿)、PENDING(待审核)、PUBLISHED(已发布)、REJECTED(已退回)、PRIVATE(已下架)';

-- 验证迁移结果
-- SELECT status, COUNT(*) as count FROM notes GROUP BY status;

