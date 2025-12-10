#!/bin/bash
# Railway 启动脚本
# 自动查找并运行 JAR 文件

set -e

echo "查找 JAR 文件..."
JAR_FILE=$(find target -name "*.jar" -type f | head -1)

if [ -z "$JAR_FILE" ]; then
    echo "错误: 未找到 JAR 文件"
    echo "target 目录内容:"
    ls -la target/ || echo "target 目录不存在"
    exit 1
fi

echo "找到 JAR 文件: $JAR_FILE"
echo "启动应用..."
java -jar "$JAR_FILE"

