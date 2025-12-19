#!/bin/bash

# 数据库连接信息
DB_USER="root"
DB_PASS="1234"
DB_NAME="travel_db"

echo "=========================================="
echo "检查数据库大小和数据量"
echo "=========================================="
echo ""

# 检查数据库总大小
echo "📊 数据库总大小："
mysql -u "$DB_USER" -p"$DB_PASS" -e "
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = '$DB_NAME'
GROUP BY table_schema;
" 2>/dev/null || mariadb -u "$DB_USER" -p"$DB_PASS" -e "
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = '$DB_NAME'
GROUP BY table_schema;
" 2>/dev/null

echo ""
echo "📋 各表的数据量和大小："
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = '$DB_NAME'
ORDER BY (data_length + index_length) DESC;
" 2>/dev/null || mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = '$DB_NAME'
ORDER BY (data_length + index_length) DESC;
" 2>/dev/null

echo ""
echo "🔢 各表的实际记录数："
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'spots', COUNT(*) FROM spots
UNION ALL
SELECT 'likes', COUNT(*) FROM likes
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY row_count DESC;
" 2>/dev/null || mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'spots', COUNT(*) FROM spots
UNION ALL
SELECT 'likes', COUNT(*) FROM likes
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY row_count DESC;
" 2>/dev/null

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="

