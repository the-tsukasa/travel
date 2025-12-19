#!/bin/bash
# 验证 React 构建和打包脚本

echo "=========================================="
echo "🔍 验证 React 构建和打包"
echo "=========================================="

# 1. 检查前端构建文件
echo ""
echo "1️⃣ 检查 React 构建文件..."
if [ -f "src/main/resources/static/react-dist/index.html" ]; then
    echo "✅ React index.html 存在"
    echo "   文件大小: $(du -h src/main/resources/static/react-dist/index.html | cut -f1)"
else
    echo "❌ React index.html 不存在！"
    echo "   请先运行: cd frontend && npm run build"
    exit 1
fi

# 2. 检查 assets 目录
echo ""
echo "2️⃣ 检查 React assets 目录..."
if [ -d "src/main/resources/static/react-dist/assets" ]; then
    ASSET_COUNT=$(find src/main/resources/static/react-dist/assets -type f | wc -l)
    echo "✅ assets 目录存在，包含 $ASSET_COUNT 个文件"
    ls -lh src/main/resources/static/react-dist/assets/ | head -5
else
    echo "❌ assets 目录不存在！"
    exit 1
fi

# 3. 检查 JAR 包（如果存在）
echo ""
echo "3️⃣ 检查 JAR 包中的 React 文件..."
if [ -f "target/travel-0.0.1-SNAPSHOT.jar" ]; then
    JAR_REACT_FILES=$(jar tf target/travel-0.0.1-SNAPSHOT.jar | grep "react-dist" | wc -l)
    if [ "$JAR_REACT_FILES" -gt 0 ]; then
        echo "✅ JAR 包中包含 $JAR_REACT_FILES 个 React 文件"
        echo "   示例文件："
        jar tf target/travel-0.0.1-SNAPSHOT.jar | grep "react-dist" | head -5
    else
        echo "❌ JAR 包中未找到 React 文件！"
        echo "   请重新运行: ./mvnw clean package"
        exit 1
    fi
else
    echo "⚠️  JAR 包不存在，跳过检查"
    echo "   运行: ./mvnw clean package 来构建 JAR 包"
fi

# 4. 检查 ReactController
echo ""
echo "4️⃣ 检查 ReactController..."
if grep -q "ReactController" src/main/java/com/example/travel/controller/ReactController.java; then
    echo "✅ ReactController 存在"
else
    echo "❌ ReactController 不存在！"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ 验证完成！"
echo "=========================================="

