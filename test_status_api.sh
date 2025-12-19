#!/bin/bash

# 测试笔记状态机 API

BASE_URL="http://localhost:8080/api"

echo "=== 测试笔记状态机 API ==="
echo ""

# 1. 登录获取 Token
echo "1. 登录获取 Token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 无法获取 Token"
  exit 1
fi

echo "✅ Token 获取成功"
echo ""

# 2. 创建笔记（应该创建为 DRAFT 状态）
echo "2. 创建笔记（应该创建为 DRAFT 状态）..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/notes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试笔记 - 状态机测试",
    "content": "这是一个测试笔记，用于测试状态机功能",
    "location": "测试地点"
  }')

NOTE_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
NOTE_STATUS=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)

echo "创建结果:"
echo "  Note ID: $NOTE_ID"
echo "  Status: $NOTE_STATUS"
if [ "$NOTE_STATUS" = "DRAFT" ]; then
  echo "  ✅ 状态正确：DRAFT"
else
  echo "  ❌ 状态错误，期望 DRAFT，实际 $NOTE_STATUS"
fi
echo ""

# 3. 提交审核（DRAFT → PENDING）
if [ ! -z "$NOTE_ID" ] && [ "$NOTE_ID" != "None" ]; then
  echo "3. 提交审核（DRAFT → PENDING）..."
  SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/notes/$NOTE_ID/submit" \
    -H "Authorization: Bearer $TOKEN")
  
  SUBMIT_STATUS=$(echo $SUBMIT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)
  echo "提交结果:"
  echo "  Status: $SUBMIT_STATUS"
  if [ "$SUBMIT_STATUS" = "PENDING" ]; then
    echo "  ✅ 状态转换成功：DRAFT → PENDING"
  else
    echo "  ❌ 状态转换失败，期望 PENDING，实际 $SUBMIT_STATUS"
    echo "  响应: $SUBMIT_RESPONSE"
  fi
  echo ""
fi

# 4. 获取我的笔记列表
echo "4. 获取我的笔记列表..."
MY_NOTES=$(curl -s -X GET "$BASE_URL/notes/my" \
  -H "Authorization: Bearer $TOKEN")

NOTE_COUNT=$(echo $MY_NOTES | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null)
echo "我的笔记数量: $NOTE_COUNT"
echo ""

# 5. 获取已发布的笔记
echo "5. 获取已发布的笔记..."
PUBLISHED_NOTES=$(curl -s -X GET "$BASE_URL/notes?page=0&size=5")

PUBLISHED_COUNT=$(echo $PUBLISHED_NOTES | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('totalElements', 0) if isinstance(data, dict) else 0)" 2>/dev/null)
echo "已发布笔记总数: $PUBLISHED_COUNT"
echo ""

# 6. 测试管理员功能（需要管理员账号）
echo "6. 测试管理员功能..."
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ ! -z "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "None" ]; then
  echo "  管理员登录成功"
  
  # 获取待审核笔记
  PENDING_NOTES=$(curl -s -X GET "$BASE_URL/admin/notes/pending" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  PENDING_COUNT=$(echo $PENDING_NOTES | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null)
  echo "  待审核笔记数量: $PENDING_COUNT"
  
  # 如果有待审核的笔记，测试批准功能
  if [ "$PENDING_COUNT" -gt 0 ] && [ ! -z "$NOTE_ID" ] && [ "$NOTE_ID" != "None" ]; then
    echo ""
    echo "7. 测试批准笔记（PENDING → PUBLISHED）..."
    APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/notes/$NOTE_ID/approve" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if [ $? -eq 0 ]; then
      echo "  ✅ 批准请求发送成功"
      
      # 验证状态
      VERIFY_NOTE=$(curl -s -X GET "$BASE_URL/notes/$NOTE_ID" \
        -H "Authorization: Bearer $TOKEN")
      VERIFY_STATUS=$(echo $VERIFY_NOTE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null)
      
      if [ "$VERIFY_STATUS" = "PUBLISHED" ]; then
        echo "  ✅ 状态转换成功：PENDING → PUBLISHED"
      else
        echo "  ❌ 状态转换失败，期望 PUBLISHED，实际 $VERIFY_STATUS"
      fi
    else
      echo "  ❌ 批准请求失败"
    fi
  fi
else
  echo "  ⚠️  无法登录管理员账号，跳过管理员功能测试"
fi

echo ""
echo "=== 测试完成 ==="
