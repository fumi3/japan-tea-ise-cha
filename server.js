'use strict';

// ════════════════════════════════════════════════════
//  JAPAN TEA ISE-CHA — Square 決済バックエンド
//  Node.js + Express + Square SDK
// ════════════════════════════════════════════════════
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const { v4: uuidv4 } = require('uuid');
const { Client, Environment } = require('square');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Square クライアント初期化 ──────────────────────
const isProduction = process.env.SQUARE_ENV === 'production';

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? Environment.Production : Environment.Sandbox,
});

const paymentsApi = squareClient.paymentsApi;

// ── ミドルウェア ───────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── ヘルスチェック ────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: isProduction ? 'production' : 'sandbox',
    timestamp: new Date().toISOString(),
  });
});

// ── Square 設定情報をフロントエンドへ返す ────────
// ⚠️ ACCESS_TOKEN はフロントに渡しません (APP_ID と LOCATION_ID のみ)
app.get('/api/square-config', (req, res) => {
  res.json({
    appId:      process.env.SQUARE_APP_ID,
    locationId: process.env.SQUARE_LOCATION_ID,
    env:        process.env.SQUARE_ENV || 'sandbox',
  });
});

// ── 決済処理 POST /api/payment ────────────────────
app.post('/api/payment', async (req, res) => {
  const { sourceId, amount, currency, items, buyerEmail } = req.body;

  // バリデーション
  if (!sourceId || !amount || !currency) {
    return res.status(400).json({
      success: false,
      error: 'sourceId, amount, currency は必須です',
    });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'amount は正の整数（円）で指定してください',
    });
  }

  // 商品明細ログ (ソーバックエンド側でも保存推奨)
  console.log(`[Payment] ${new Date().toISOString()} | ¥${amount.toLocaleString()} | items:`, items);

  try {
    const idempotencyKey = uuidv4();

    const response = await paymentsApi.createPayment({
      sourceId,                           // Square SDK が返すトークン
      idempotencyKey,                     // 重複決済防止
      amountMoney: {
        amount:   BigInt(amount),         // JPY は最小単位 = 1円
        currency: currency || 'JPY',
      },
      locationId: process.env.SQUARE_LOCATION_ID,

      // 任意: メモ・参照情報
      note: 'JAPAN TEA ISE-CHA — Online Order',
      referenceId: `ise-cha-${Date.now()}`,

      // 任意: 購入者メール (レシート送信)
      ...(buyerEmail && {
        buyerEmailAddress: buyerEmail,
      }),

      // 任意: 注文明細 (Square Dashboard で確認可能)
      ...(items && items.length > 0 && {
        orderId: undefined, // Orders API を使う場合はここに orderId
      }),
    });

    const payment = response.result.payment;

    console.log(`[Payment OK] id=${payment.id} status=${payment.status}`);

    return res.json({
      success: true,
      paymentId: payment.id,
      status:    payment.status,
      receiptUrl: payment.receiptUrl,
      createdAt:  payment.createdAt,
    });

  } catch (err) {
    // Square API エラー
    if (err.errors) {
      const messages = err.errors.map(e => `${e.code}: ${e.detail}`).join(' | ');
      console.error('[Payment Error]', messages);
      return res.status(402).json({
        success: false,
        error:   messages,
        errors:  err.errors,
      });
    }

    // その他のエラー
    console.error('[Server Error]', err);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました。しばらく経ってから再度お試しください。',
    });
  }
});

// ── SPA フォールバック (index.html) ───────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── サーバー起動 ───────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   JAPAN TEA ISE-CHA  決済サーバー      ║
╠════════════════════════════════════════╣
║  🌿 http://localhost:${PORT}             ║
║  📦 Environment: ${isProduction ? 'PRODUCTION      ' : 'SANDBOX         '} ║
║  🔑 Location ID: ${(process.env.SQUARE_LOCATION_ID || 'NOT SET         ').substring(0,16)} ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
