-- 迁移笔记状态字段
-- 注意：此脚本会删除旧的 status enum 字段并创建新的字段

-- 1. 删除旧的 status enum 字段（如果存在）
ALTER TABLE notes DROP COLUMN IF EXISTS status;

-- 2. 添加新的状态字段（VARCHAR）
ALTER TABLE notes 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- 3. 添加退回理由字段
ALTER TABLE notes 
ADD COLUMN reject_reason TEXT;

-- 4. 添加提交审核时间字段
ALTER TABLE notes 
ADD COLUMN submitted_at TIMESTAMP NULL;

-- 5. 添加审核时间字段
ALTER TABLE notes 
ADD COLUMN reviewed_at TIMESTAMP NULL;

-- 6. 添加审核人字段（外键关联到 users 表）
ALTER TABLE notes 
ADD COLUMN reviewed_by BIGINT NULL;

-- 7. 添加外键约束（审核人）
ALTER TABLE notes 
ADD CONSTRAINT fk_notes_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 8. 为状态字段添加索引（提高查询性能）
CREATE INDEX idx_notes_status ON notes(status);

-- 9. 为提交时间添加索引（用于排序）
CREATE INDEX idx_notes_submitted_at ON notes(submitted_at);

-- 10. 迁移现有数据
-- 将 is_approved = true 的记录设置为 PUBLISHED
UPDATE notes 
SET status = 'PUBLISHED' 
WHERE is_approved = true OR is_approved = 1;

-- 将 is_approved = false 的记录设置为 PENDING（假设它们都是待审核的）
UPDATE notes 
SET status = 'PENDING' 
WHERE is_approved = false OR is_approved = 0 OR is_approved IS NULL;

-- 验证迁移结果
SELECT status, COUNT(*) as count FROM notes GROUP BY status;

