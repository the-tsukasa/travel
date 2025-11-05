/*
===========================================================
 Database Migration Log   本文档记录了本次对数据库执行的SQL操作，notion已同步记录
-----------------------------------------------------------
 fix(db): cleanup duplicate foreign keys in likes & favorites tables
-----------------------------------------------------------
        Date: 2025-11-05
        Author: Tsukasa
        Notion: 已同步记录
===========================================================
*/

/* =======================
   likes テーブル修正
   ======================= */
/*
-- 1️⃣ 删除多余外键
ALTER TABLE likes DROP FOREIGN KEY likes_ibfk_2;
ALTER TABLE likes DROP FOREIGN KEY FKd6und183fqwee233vp6vsdhci;

-- 2️⃣ 删除多余列
ALTER TABLE likes DROP COLUMN note_id;

-- 3️⃣ 删除重复唯一索引
DROP INDEX UKfltpcc08n200wxesm7ik9l9qt ON likes;
DROP INDEX UKks9gk2budis65bif6rtpoe9ua ON likes;

-- 4️⃣ 重新建立唯一约束
CREATE UNIQUE INDEX uq_user_notes ON likes(user_id, notes_id);

-- 5️⃣ 为 notes_id 建立正确外键
ALTER TABLE likes
    ADD CONSTRAINT fk_likes_notes FOREIGN KEY (notes_id)
        REFERENCES notes(id) ON DELETE CASCADE;


/* =======================
   favorites テーブル修正
   ======================= */
/*
-- 1️⃣ 删除多余外键
ALTER TABLE favorites DROP FOREIGN KEY favorites_ibfk_2;
ALTER TABLE favorites DROP FOREIGN KEY FKco415cdvpk0fd2htf0po898jj;

-- 2️⃣ 删除多余列
ALTER TABLE favorites DROP COLUMN note_id;

-- 3️⃣ 删除重复唯一索引
DROP INDEX user_id ON favorites;
DROP INDEX UKpsu3ie4g02kx0q54pg1mice05 ON favorites;

-- 4️⃣ 建立正确唯一约束
CREATE UNIQUE INDEX uq_user_notes ON favorites(user_id, notes_id);

-- 5️⃣ 为 notes_id 建立正确外键
ALTER TABLE favorites
    ADD CONSTRAINT fk_favorites_notes FOREIGN KEY (notes_id)
        REFERENCES notes(id) ON DELETE CASCADE;

-- （最终确认）
SHOW CREATE TABLE likes\G
SHOW CREATE TABLE favorites\G
*/