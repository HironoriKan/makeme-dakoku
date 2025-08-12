# 🚀 メイクミー勤怠システム 開発フロー

## ブランチ構成

```
main (本番環境) ← 常に安定版、Vercel自動デプロイ
│
├── develop (開発統合) ← 開発中の機能を統合
│   │
│   ├── feature/user-management ← 個別機能開発
│   ├── feature/shift-calendar
│   └── feature/time-tracking-detail
│
└── hotfix/urgent-fix ← 緊急修正用
```

## 🔄 基本開発フロー

### 1. 新機能開発開始

```bash
# 最新のdevelopブランチに移動
git checkout develop
git pull origin develop

# 機能ブランチを作成
git checkout -b feature/機能名

# 例: ユーザー管理機能
git checkout -b feature/user-management
```

### 2. 開発・コミット

```bash
# 開発作業...

# 変更をステージング
git add .

# わかりやすいコミットメッセージでコミット
git commit -m "ユーザー一覧画面の実装

- ユーザー検索機能を追加
- ページネーション対応
- レスポンシブデザイン適用"

# リモートにプッシュ
git push origin feature/user-management
```

### 3. developへのマージ（機能完成時）

```bash
# GitHub上でプルリクエスト作成
# feature/user-management → develop

# または、ローカルでマージ
git checkout develop
git pull origin develop
git merge feature/user-management
git push origin develop

# 使用済みブランチを削除
git branch -d feature/user-management
git push origin --delete feature/user-management
```

## 🎯 本番リリースフロー

### 4. 本番環境への反映

```bash
# developで十分にテストした後
git checkout main
git pull origin main

# developの内容をmainにマージ
git merge develop
git push origin main
```

**⚠️ 注意**: mainブランチへのpushでVercelが自動デプロイされます

### 5. GitHub プルリクエスト（推奨）

1. **GitHub上で develop → main のプルリクエストを作成**
2. **変更内容を確認・レビュー**
3. **マージ → 自動デプロイ**

## 🚨 緊急修正フロー

### 本番環境で問題発生時

```bash
# mainブランチから緊急修正ブランチを作成
git checkout main
git pull origin main
git checkout -b hotfix/緊急修正内容

# 修正作業...

# コミット・プッシュ
git add .
git commit -m "緊急修正: 認証エラーの解決"
git push origin hotfix/緊急修正内容

# mainに直接マージ
git checkout main
git merge hotfix/緊急修正内容
git push origin main

# developにも反映
git checkout develop
git merge main
git push origin develop

# 修正ブランチを削除
git branch -d hotfix/緊急修正内容
git push origin --delete hotfix/緊急修正内容
```

## 🛡️ 安全な開発のための注意点

### ✅ DO（推奨）

- **機能ごとに個別ブランチを作成**
- **小さく頻繁にコミット**
- **わかりやすいコミットメッセージ**
- **developで十分テストしてからmainにマージ**
- **プルリクエストを活用**

### ❌ DON'T（非推奨）

- **mainブランチで直接開発**
- **大きすぎる機能を一つのブランチで開発**
- **テスト不足でのリリース**
- **強制プッシュ（--force）の多用**

## 📋 コミットメッセージ規約

```
タイプ: 簡潔な説明

詳細な説明（必要に応じて）
- 変更点1
- 変更点2

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### タイプ例
- `feat:` 新機能
- `fix:` バグ修正  
- `docs:` ドキュメント
- `style:` UI/スタイル変更
- `refactor:` リファクタリング
- `test:` テスト追加

## 🔍 現在の状況確認コマンド

```bash
# 現在のブランチ確認
git branch

# 変更状況確認
git status

# コミット履歴確認
git log --oneline -5

# リモートとの差分確認
git fetch
git log HEAD..origin/develop --oneline
```

## 🚀 Vercel デプロイメント

- **main ブランチ**: 本番環境 (https://makeme-dakoku.vercel.app/)
- **develop ブランチ**: プレビュー環境（任意設定可能）

### Vercel設定確認

```bash
# Vercel CLI（必要に応じてインストール）
npm i -g vercel
vercel --version

# プロジェクト情報確認
vercel ls
```

## 🆘 トラブル時の対処

### 間違ってmainにコミットした場合

```bash
# 最後のコミットを取り消し（変更は保持）
git reset --soft HEAD~1

# 適切なブランチに移動して再コミット
git checkout develop
git add .
git commit -m "適切なメッセージ"
```

### コンフリクト発生時

```bash
# マージ時にコンフリクトが発生
git status  # コンフリクトファイル確認

# ファイルを編集してコンフリクト解決
# <<<<<<< HEAD と >>>>>>> の部分を修正

# 解決後
git add .
git commit -m "コンフリクト解決"
```

---

## 🎉 開発再開準備完了

現在のブランチ: `develop`  
次のステップ: 新機能開発用のfeatureブランチを作成して開発開始

```bash
# 例: IP制限機能の再実装
git checkout -b feature/ip-restriction-system
```