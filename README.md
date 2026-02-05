# 🌍 TravelGo - スマート旅行プラットフォーム

> 人気の旅行先・お得なプラン・本物のレビューを集約した旅行プラットフォーム  
> A comprehensive travel platform that aggregates popular destinations, great deals, and authentic reviews.

## 🛠️ 技術スタック

**バックエンド**: Java 17+ • Spring Boot 3.x • Spring Security • JWT • MySQL 8.0+  
**フロントエンド**: React 18 • TypeScript 5.3 • Vite 5.0 • Leaflet

## 🚀 クイックスタート

### 前提条件
- Java 17+
- Node.js 18+
- Maven 3.8+
- MySQL 8.0+

### セットアップ

```bash
# フロントエンド
cd frontend
npm install
npm run dev  # http://localhost:3000

# バックエンド
./mvnw spring-boot:run  # http://localhost:8080
```

### ビルド

```bash
# フロントエンド
cd frontend && npm run build

# バックエンド
mvn clean package
```

## ✨ 主な機能

**ユーザー機能**
- ✅ JWT認証（登録・ログイン）
- 📝 旅行記録の作成・編集・削除
- ❤️ いいね・お気に入り
- 🗺️ Leaflet地図連携

**管理者機能**
- 📋 コンテンツ管理
- 👥 ユーザー管理
- 📊 統計分析

## 📁 プロジェクト構造

```
travel/
├── frontend/          # React + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
└── src/main/java/     # Spring Boot
    └── com/example/travel/
        ├── controller/
        ├── service/
        ├── repository/
        ├── entity/
        └── security/
```

## 📚 API エンドポイント

```http
# 認証
POST /api/auth/register
POST /api/auth/login

# ノート管理
GET    /api/notes
POST   /api/notes
PUT    /api/notes/{id}
DELETE /api/notes/{id}

# ユーザー
GET /api/users/profile
PUT /api/users/profile
```

> 詳細: Swagger UI `http://localhost:8080/swagger-ui.html`

## 🔧 環境変数

```env
# Backend
DATABASE_URL=jdbc:mysql://localhost:3306/travel
JWT_SECRET=your-secret-key

# Frontend
VITE_API_URL=http://localhost:8080/api
```

## 🚀 デプロイ

- **フロントエンド**: Vercel / Netlify / AWS S3
- **バックエンド**: Railway / Render / Heroku
- **データベース**: AWS RDS / PlanetScale

---

**Version**: 2.0 | **最終更新**: 2026年1月  
WEB研修用プロジェクト | For training purposes only