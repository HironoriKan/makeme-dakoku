-- ユーザーテーブルにプロファイル用フィールドを追加

-- 住所フィールドを追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- 自己PRフィールドを追加  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS self_pr TEXT;

-- 経歴・職歴フィールドを追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS career TEXT;

-- コメントを追加
COMMENT ON COLUMN users.address IS '住所';
COMMENT ON COLUMN users.self_pr IS '自己PR';
COMMENT ON COLUMN users.career IS '経歴・職歴';