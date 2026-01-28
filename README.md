# ２０２５年１０月　WEB研修グループ　プロジェクト
**WEB Training Group Project – October 2025**

本プロジェクトは、バックエンドとフロントエンドのテスト用です。  
This project is for testing and practicing backend & frontend development.

## 📋 プロジェクト概要

TravelGo は、人気の旅行先・お得なプラン・本物のレビューを集約したスマート旅行プラットフォームです。

## 🛠️ 技術スタック

### バックエンド
- **Java 17+**
- **Spring Boot** - Web フレームワーク
- **Spring Security** - 認証・認可
- **JWT (JSON Web Token)** - トークンベース認証
- **JPA / Hibernate** - ORM
- **MySQL** - データベース
- **Maven** - ビルドツール

### フロントエンド
- **React 18.2.0** - UI ライブラリ
- **TypeScript 5.3.3** - 型安全性
- **Vite 5.0.8** - ビルドツール
- **React Router DOM 6.20.0** - ルーティング
- **Axios 1.6.2** - HTTP クライアント
- **Leaflet** - 地図ライブラリ
- **ESLint** - コード品質チェック

## 🚀 起動方法

### フロントエンド開発サーバー起動
```bash
cd frontend
npm install
npm run dev
```
開発サーバーは `http://localhost:3000` で起動します。

### バックエンド起動
```bash
# Maven を使用して起動
./mvnw spring-boot:run

# または
mvn spring-boot:run
```
バックエンド API は `http://localhost:8080` で起動します。

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

## ✨ 主な機能

### ユーザー機能
- ユーザー登録・ログイン（JWT 認証）
- プロフィール管理
- ノート（旅行記録）の作成・編集・削除
- ノートの公開・非公開設定
- ノートへのいいね・お気に入り機能
- 通知機能

### 管理者機能
- ノート管理（承認・差し戻し・削除）
- ユーザー管理（編集・削除）
- 統計レポート表示

### その他
- 地図機能（Leaflet）
- スポット情報の表示
- 検索・ソート機能
- レスポンシブデザイン

## 🔒 認証・認可

- JWT トークンベース認証
- ロールベースアクセス制御（USER / ADMIN）
- 管理者専用ページの保護

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

## 🧪 テスト

```bash
# フロントエンドのリントチェック
cd frontend
npm run lint

# バックエンドのテスト
mvn test
```

## 📦 デプロイ

### フロントエンド
ビルド後、`frontend/dist` ディレクトリの内容を静的ホスティングサービスにデプロイします。

### バックエンド
Spring Boot の JAR ファイルを生成してデプロイします。

## 📄 ライセンス

このプロジェクトは研修用のテストプロジェクトです。

---

**最終更新**: 2026年1月
