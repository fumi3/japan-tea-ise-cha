# 🍵 JAPAN TEA ISE-CHA — Square 決済システム

## ディレクトリ構成

```
ise-cha-shop/
├── server.js          ← Node.js + Express バックエンド (Square Payments API)
├── package.json
├── .env.example       ← 環境変数テンプレート
├── .env               ← 実際の認証情報 (gitignore 必須)
└── public/
    └── index.html     ← フロントエンド (Square Web Payments SDK)
```

---

## 🚀 セットアップ手順

### 1. 依存パッケージをインストール
```bash
cd ise-cha-shop
npm install
```

### 2. Square Developer Console で認証情報を取得
1. https://developer.squareup.com/apps にアクセス
2. 新しいアプリケーションを作成（または既存を選択）
3. **Credentials タブ** → Sandbox Application ID をコピー
4. **Locations タブ** → Sandbox Location ID をコピー
5. **Credentials タブ** → Sandbox Access Token をコピー

### 3. 環境変数を設定
```bash
cp .env.example .env
```

`.env` を編集：
```env
SQUARE_ACCESS_TOKEN=EAAAl-sandbox-xxxxxxxx   # Sandbox Access Token
SQUARE_LOCATION_ID=Lxxxxxxxxxxxxxxxxx         # Sandbox Location ID
SQUARE_APP_ID=sandbox-sq0idb-xxxxxxxx         # Sandbox Application ID
SQUARE_ENV=sandbox
PORT=3000
ALLOWED_ORIGIN=http://localhost:3000
```

### 4. サーバーを起動
```bash
# 通常起動
npm start

# 開発モード (ファイル変更で自動再起動)
npm run dev
```

### 5. ブラウザで確認
```
http://localhost:3000
```

---

## 💳 テスト決済

Sandbox 環境でのテストカード番号：
| カード番号 | 説明 |
|-----------|------|
| `4111 1111 1111 1111` | Visa (成功) |
| `5105 1051 0510 5100` | Mastercard (成功) |
| `4000 0000 0000 0002` | 決済拒否テスト |

- 有効期限: 任意の未来の日付 (例: `12/26`)
- CVV: 任意の3桁 (例: `123`)
- 郵便番号: 任意 (例: `516-0000`)

---

## 🌐 本番環境への切り替え

1. `.env` を更新：
```env
SQUARE_ACCESS_TOKEN=EAAAl-xxxxxxxx    # 本番 Access Token
SQUARE_LOCATION_ID=Lxxxxxxxxx         # 本番 Location ID
SQUARE_APP_ID=sq0idp-xxxxxxxx         # 本番 Application ID
SQUARE_ENV=production
ALLOWED_ORIGIN=https://your-domain.com
```

2. Square SDK URLが自動で切り替わります（`server.js` の `/api/square-config` が `production` を返す）

---

## 📦 API エンドポイント

| Method | Path | 説明 |
|--------|------|------|
| `GET` | `/api/health` | ヘルスチェック |
| `GET` | `/api/square-config` | APP_ID / LOCATION_ID 取得 |
| `POST` | `/api/payment` | 決済処理 |

### POST /api/payment
```json
{
  "sourceId":   "cnon:xxxxx",    // Square SDK が返すトークン (必須)
  "amount":     4800,            // 円 (JPY, 整数, 必須)
  "currency":   "JPY",           // 必須
  "items":      [...],           // 商品明細 (任意)
  "buyerEmail": "user@mail.com"  // レシート送信先 (任意)
}
```

### レスポンス (成功)
```json
{
  "success":    true,
  "paymentId":  "Yxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status":     "COMPLETED",
  "receiptUrl": "https://squareup.com/receipt/preview/...",
  "createdAt":  "2025-01-01T00:00:00Z"
}
```

---

## 🔐 セキュリティ注意事項

- `.env` は必ず `.gitignore` に追加してください
- `SQUARE_ACCESS_TOKEN` はフロントエンドに渡しません
- 本番では HTTPS を必ず使用してください
- CORS の `ALLOWED_ORIGIN` を本番ドメインに設定してください

---

## 📧 お問い合わせ

JAPAN TEA ISE-CHA — 伊勢志摩, 三重県
