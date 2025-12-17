# TravelGo Frontend (React)

React フロントエンドプロジェクト

## 開発環境セットアップ

### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

開発サーバーは `http://localhost:3000` で起動します。

### 3. ビルド

```bash
npm run build
```

ビルド結果は `src/main/resources/static/react-dist/` に出力されます。

## プロジェクト構造

```
frontend/
├── src/
│   ├── components/      # 共通コンポーネント
│   │   ├── NavBar.jsx   # ナビゲーションバー
│   │   └── Footer.jsx   # フッター
│   ├── pages/          # ページコンポーネント
│   │   ├── Home.jsx    # ホームページ（index.html から移行）
│   │   ├── Login.jsx   # ログインページ
│   │   ├── Register.jsx # 登録ページ
│   │   ├── Notes.jsx   # ノート一覧
│   │   └── User.jsx    # ユーザーページ
│   ├── services/       # API サービス
│   │   └── api.js      # axios インスタンスとインターセプター
│   ├── utils/          # ユーティリティ関数
│   │   └── auth.js     # 認証関連ユーティリティ
│   ├── App.jsx         # メインアプリ（ルーティング設定）
│   ├── main.jsx        # エントリーポイント
│   └── index.css       # グローバルスタイル
├── public/             # 静的ファイル
├── index.html          # HTML テンプレート
├── package.json
├── vite.config.js      # Vite 設定
└── README.md
```

## 旧 HTML ファイルについて

旧 HTML/CSS/JS ファイルは `src/main/resources/static/` にそのまま残っています。
React への移行は段階的に行えます。

## API 接続

- 開発環境: Vite proxy 経由で `http://localhost:8080/api` に接続
- 本番環境: `/api` エンドポイントに直接接続（同じドメイン）

## 移行状況

- ✅ Home ページ（index.html） - 完了
- ⏳ Login ページ - 基本実装完了
- ⏳ Register ページ - プレースホルダー
- ⏳ Notes ページ - プレースホルダー
- ⏳ User ページ - プレースホルダー

## 開発の流れ

1. 旧 HTML ファイルを参照
2. React コンポーネントとして実装
3. 機能テスト
4. 必要に応じて旧ファイルを削除
