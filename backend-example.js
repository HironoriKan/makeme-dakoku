// backend-example.js
// 本番環境でのLINEログイン実装例（Node.js/Express）

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// 環境変数（実際の本番環境では.envファイルやシークレット管理サービスを使用）
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_REDIRECT_URI = process.env.LINE_REDIRECT_URI;

// セッション管理用のメモリストア（本番環境ではRedisなどを使用）
const sessions = new Map();

/**
 * LINEトークン交換エンドポイント
 * フロントエンドから認証コードを受け取り、LINEのアクセストークンに交換
 */
app.post('/api/auth/line/token', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // LINEのトークンエンドポイントにリクエスト
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('LINE token exchange error:', errorData);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokenData = await tokenResponse.json();

    // IDトークンの検証（簡易版）
    if (tokenData.id_token) {
      const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
      
      // 基本的な検証
      if (payload.iss !== 'https://access.line.me' || payload.aud !== LINE_CHANNEL_ID) {
        return res.status(400).json({ error: 'Invalid ID token' });
      }

      // セッション作成
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, {
        userId: payload.sub,
        displayName: payload.name,
        pictureUrl: payload.picture,
        email: payload.email,
        createdAt: new Date(),
      });

      // クライアントにはセッションIDのみ返す（セキュア）
      res.json({
        sessionId: sessionId,
        user: {
          userId: payload.sub,
          displayName: payload.name,
          pictureUrl: payload.picture,
          email: payload.email,
        }
      });
    } else {
      // プロフィールAPIから情報取得（fallback）
      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        return res.status(400).json({ error: 'Failed to get user profile' });
      }

      const profile = await profileResponse.json();

      // セッション作成
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        createdAt: new Date(),
      });

      res.json({
        sessionId: sessionId,
        user: {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        }
      });
    }

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * セッション検証エンドポイント
 */
app.get('/api/auth/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // セッションの有効期限チェック（24時間）
  const now = new Date();
  const sessionAge = now - session.createdAt;
  const maxAge = 24 * 60 * 60 * 1000; // 24時間

  if (sessionAge > maxAge) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: 'Session expired' });
  }

  res.json({ 
    valid: true, 
    user: {
      userId: session.userId,
      displayName: session.displayName,
      pictureUrl: session.pictureUrl,
      email: session.email,
    }
  });
});

/**
 * ログアウトエンドポイント
 */
app.delete('/api/auth/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  sessions.delete(sessionId);
  res.json({ success: true });
});

/**
 * セッションクリーンアップ（定期実行）
 */
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24時間

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > maxAge) {
      sessions.delete(sessionId);
      console.log(`Expired session cleaned up: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000); // 1時間ごとに実行

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('LINE Login backend ready');
});

module.exports = app; 