# 🌍 TravelGo - スマート旅行プラットフォーム
## WEB Training Group Project – October 2025

> **TravelGo** は、人気の旅行先・お得なプラン・本物のレビューを集約した包括的な旅行プラットフォームです。  
> A comprehensive travel platform that aggregates popular destinations, great deals, and authentic reviews.

## 🎯 プロジェクトの目的 | Project Objectives

### 主要目標
- ✅ 現代フルスタック開発技術の実践
- ✅ バックエンド（Spring Boot）とフロントエンド（React）の統合
- ✅ リアルタイムデータ処理とユーザー体験の最適化
- ✅ セキュアな認証認可システムの実装

### 技術的目標
- 🔧 **モダンアーキテクチャ**: Spring Boot + React + TypeScript
- 🛡️ **セキュリティ**: JWTベース認証、ロールベースアクセス制御
- 📱 **レスポンシブデザイン**: すべてのデバイスでの最適な体験
- 🗺️ **地図連携**: Leafletを活用した位置情報サービス

## 🛠️ 技術スタック | Technology Stack

### 🚀 バックエンド | Backend
| 技術 | バージョン | 用途 |
|------|----------|------|
| **Java** | 17+ | プログラミング言語 |
| **Spring Boot** | 3.x | Web フレームワーク |
| **Spring Security** | 6.x | 認証・認可 |
| **JWT** | - | トークンベース認証 |
| **JPA / Hibernate** | - | ORM |
| **MySQL** | 8.0+ | データベース |
| **Maven** | 3.8+ | ビルドツール |

### 🎨 フロントエンド | Frontend
| 技術 | バージョン | 用途 |
|------|----------|------|
| **React** | 18.2.0 | UI ライブラリ |
| **TypeScript** | 5.3.3 | 型安全性 |
| **Vite** | 5.0.8 | ビルドツール |
| **React Router DOM** | 6.20.0 | ルーティング |
| **Axios** | 1.6.2 | HTTP クライアント |
| **Leaflet** | 1.9.x | 地図ライブラリ |
| **ESLint** | 8.x | コード品質チェック |

## 🚀 クイックスタート | Quick Start

### 📋 前提条件 | Prerequisites

```bash
# 必要なツール
- Java 17+
- Node.js 18+
- Maven 3.8+
- MySQL 8.0+
```

### 🎯 開発環境セットアップ | Development Setup

#### フロントエンド | Frontend
```bash
cd frontend
npm install
npm run dev
```
🌐 **アクセス**: http://localhost:3000

#### バックエンド | Backend
```bash
# Maven を使用して起動
./mvnw spring-boot:run

# または
mvn spring-boot:run
```
🔧 **API**: http://localhost:8080

### ビルド
```bash
# フロントエンドをビルド
cd frontend
npm run build

# バックエンドをビルド
mvn clean package
```

## 📁 プロジェクト構造

```
travel/
├── frontend/                 # React + TypeScript フロントエンド
│   ├── src/
│   │   ├── pages/           # ページコンポーネント（16個）
│   │   ├── components/      # 再利用可能なコンポーネント
│   │   │   ├── common/      # 共通コンポーネント
│   │   │   ├── layout/      # レイアウトコンポーネント
│   │   │   ├── notes/       # ノート関連コンポーネント
│   │   │   └── travel/      # 旅行関連コンポーネント
│   │   ├── features/        # 機能別モジュール
│   │   │   └── map/         # 地図機能
│   │   ├── services/        # API サービス
│   │   ├── utils/          # ユーティリティ関数
│   │   ├── types/          # TypeScript 型定義
│   │   ├── constants/      # 定数定義
│   │   ├── styles/         # CSS スタイル
│   │   ├── App.tsx         # メインアプリケーション
│   │   └── main.tsx        # エントリーポイント
│   ├── package.json
│   ├── tsconfig.json        # TypeScript 設定
│   └── vite.config.ts       # Vite 設定
│
├── src/main/java/           # Java バックエンド
│   └── com/example/travel/
│       ├── controller/      # REST API コントローラー
│       ├── service/         # ビジネスロジック
│       ├── repository/      # データアクセス層
│       ├── entity/          # エンティティクラス
│       ├── dto/             # データ転送オブジェクト
│       ├── security/        # セキュリティ設定
│       └── config/           # 設定クラス
│
└── db/migrations/           # データベースマイグレーション
```

## ✨ 主な機能 | Features

### 👤 ユーザー機能 | User Features
- ✅ **認証**: ユーザー登録・ログイン（JWT 認証）
- 📝 **ノート管理**: 旅行記録の作成・編集・削除
- 🔒 **プライバシー**: ノートの公開・非公開設定
- ❤️ **ソーシャル**: いいね・お気に入り機能
- 🔔 **通知**: リアルタイム通知機能
- 👨‍💼 **プロフィール**: ユーザープロフィール管理

### 🛠️ 管理者機能 | Admin Features
- 📋 **コンテンツ管理**: ノート管理（承認・差し戻し・削除）
- 👥 **ユーザー管理**: ユーザー情報の編集・削除
- 📊 **分析**: 統計レポートとデータ分析

### 🌟 追加機能 | Additional Features
- 🗺️ **地図連携**: Leafletによるインタラクティブ地図
- 📍 **スポット情報**: 旅行先詳細情報
- 🔍 **検索**: 高度な検索・ソート機能
- 📱 **レスポンシブ**: すべてのデバイス対応

## 🔐 セキュリティ | Security

- 🛡️ **JWT認証**: トークンベース認証システム
- 🎭 **ロール管理**: USER / ADMIN ロールベースアクセス制御
- 🔒 **保護ルート**: 管理者専用ページのアクセス制限

## 📚 API ドキュメント | API Documentation

### 認証エンドポイント
```http
POST /api/auth/register    # ユーザー登録
POST /api/auth/login       # ログイン
POST /api/auth/refresh     # トークン更新
```

### ノート管理
```http
GET    /api/notes          # ノート一覧取得
POST   /api/notes          # ノート作成
GET    /api/notes/{id}     # ノート詳細取得
PUT    /api/notes/{id}     # ノート更新
DELETE /api/notes/{id}     # ノート削除
```

### ユーザー管理
```http
GET  /api/users/profile    # プロフィール取得
PUT  /api/users/profile    # プロフィール更新
GET  /api/admin/users      # ユーザー一覧（管理者）
```

> 🔗 **詳細**: Swagger UI: `http://localhost:8080/swagger-ui.html`

## 📝 TypeScript 移行

フロントエンドは完全に TypeScript に移行済みです。

### 移行統計
- **TSX ファイル**: 28個（すべての React コンポーネントとページ）
- **TS ファイル**: 10個（ユーティリティ、サービス、型定義）
- **型安全性**: 完全な型チェックと IDE サポート

### 型定義
- バックエンド DTO に対応した TypeScript インターフェース
- 列挙型（`NoteStatus` など）
- カスタム型定義（`UserDTO`, `NotesDTO`, `Spot` など）

詳細は `frontend/src/types/index.ts` を参照してください。

## 🧪 テストと品質 | Testing & Quality

### フロントエンド | Frontend
```bash
cd frontend
npm run lint          # コード品質チェック
npm run type-check    # TypeScript型チェック
npm run test          # 単体テスト
npm run build         # プロダクションビルド
```

### バックエンド | Backend
```bash
mvn test              # 単体テスト
mvn verify            # 統合テスト
mvn clean package     # プロダクションビルド
```

### 品質保証 | Quality Assurance
- ✅ **ESLint**: JavaScript/TypeScriptコード品質
- ✅ **TypeScript**: 型安全性の保証
- ✅ **Spring Boot Actuator**: アプリケーション監視
- ✅ **Maven**: 依存関係管理とビルド

## 🚀 デプロイ | Deployment

### 📦 プロダクションビルド | Production Build
```bash
# フロントエンド
cd frontend && npm run build

# バックエンド
mvn clean package
```

### 🌐 デプロイ先 | Deployment Targets
- **フロントエンド**: Vercel / Netlify / AWS S3
- **バックエンド**: Railway / Render / Heroku
- **データベース**: AWS RDS / PlanetScale / Railway

### 🔧 環境変数 | Environment Variables
```env
# Backend
DATABASE_URL=jdbc:mysql://localhost:3306/travel
JWT_SECRET=your-secret-key
SPRING_PROFILES_ACTIVE=production

# Frontend
VITE_API_URL=http://localhost:8080/api
VITE_MAP_API_KEY=your-map-api-key
```

## 🔧 トラブルシューティング | Troubleshooting

### よくある問題 | Common Issues

#### データベース接続エラー
```bash
# MySQL サービス確認
brew services list | grep mysql
sudo systemctl status mysql

# データベース作成
mysql -u root -p
CREATE DATABASE travel CHARACTER SET utf8mb4;
```

#### フロントエンドビルドエラー
```bash
# キャッシュクリア
cd frontend && rm -rf node_modules package-lock.json
npm install
npm run build
```

#### ポート衝突
```bash
# ポート使用確認
lsof -i :8080  # Backend
lsof -i :3000  # Frontend

# プロセス終了
kill -9 <PID>
```

## 🤝 貢献ガイドライン | Contributing

### 開発フロー | Development Workflow
1. **Fork**: リポジトリをフォーク
2. **Branch**: 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. **Commit**: 変更をコミット (`git commit -m 'Add amazing feature'`)
4. **Push**: ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. **PR**: プルリクエストを作成

### コーディング規約 | Coding Standards
- **命名規則**: キャメルケース（JS/TS）、パスカルケース（Javaクラス）
- **コミットメッセージ**: Conventional Commits準拠
- **Pull Request**: 1 PRあたり1機能、レビュー必須

## 📄 ライセンス | License

このプロジェクトはWEB研修用のテストプロジェクトです。  
This project is for WEB training purposes only.

---

**最終更新**: 2026年1月 | **Version**: 2.0
