-- Phase 2: 一括操作機能のためのDB拡張
-- 
-- 1. シフトテンプレート機能
-- 2. クライアントアカウント機能  
-- 3. 拠点アクセス制御機能

-- =====================================================
-- 1. シフトテンプレートテーブル
-- =====================================================

-- シフトテンプレート
CREATE TABLE IF NOT EXISTS shift_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- テンプレート名（例: "A店舗早番", "B店舗遅番"）
    description TEXT, -- テンプレートの説明
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE, -- 店舗ID
    
    -- シフトパターン設定
    shift_type shift_type NOT NULL DEFAULT 'normal', -- シフトタイプ
    start_time TIME, -- 開始時間
    end_time TIME, -- 終了時間
    break_duration INTEGER DEFAULT 60, -- 休憩時間（分）
    break_start_time TIME, -- 休憩開始時間
    
    -- 適用条件
    applicable_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 適用曜日（1=月曜...7=日曜）
    is_active BOOLEAN DEFAULT true, -- アクティブフラグ
    
    -- 作成者・更新者
    created_by UUID REFERENCES users(id), -- 作成者
    updated_by UUID REFERENCES users(id), -- 更新者
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_shift_templates_location_id ON shift_templates(location_id);
CREATE INDEX idx_shift_templates_active ON shift_templates(is_active);
CREATE INDEX idx_shift_templates_shift_type ON shift_templates(shift_type);

-- =====================================================
-- 2. クライアントアカウントテーブル
-- =====================================================

-- アカウントタイプ追加
CREATE TYPE account_type AS ENUM ('admin', 'client', 'user');

-- 管理者・クライアントアカウント
CREATE TABLE IF NOT EXISTS admin_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL, -- ログインメールアドレス
    password_hash VARCHAR(255) NOT NULL, -- パスワードハッシュ
    name VARCHAR(255) NOT NULL, -- 表示名
    account_type account_type NOT NULL DEFAULT 'admin', -- アカウントタイプ
    
    -- 権限設定
    permissions JSONB DEFAULT '{
        "shifts": {"read": true, "write": true, "approve": true},
        "users": {"read": true, "write": false},
        "reports": {"read": true, "export": true},
        "settings": {"read": false, "write": false}
    }', -- 権限設定（JSON）
    
    -- アカウント状態
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 作成・更新
    created_by UUID REFERENCES admin_accounts(id), -- 作成者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期管理者アカウント作成用（実際のパスワードは別途設定）
INSERT INTO admin_accounts (email, password_hash, name, account_type) 
VALUES ('admin@makeme.com', 'placeholder_hash', 'システム管理者', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 3. 拠点アクセス制御テーブル
-- =====================================================

-- クライアントアカウントと拠点の関連付け
CREATE TABLE IF NOT EXISTS client_location_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES admin_accounts(id) ON DELETE CASCADE, -- クライアントアカウントID
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE, -- 拠点ID
    
    -- アクセス権限詳細
    access_level VARCHAR(50) DEFAULT 'read_write', -- read_only, read_write, full_access
    can_approve_shifts BOOLEAN DEFAULT true, -- シフト承認権限
    can_view_reports BOOLEAN DEFAULT true, -- レポート閲覧権限
    can_manage_users BOOLEAN DEFAULT false, -- ユーザー管理権限
    
    -- 期間制限
    access_start_date DATE, -- アクセス開始日
    access_end_date DATE, -- アクセス終了日
    
    -- 作成・更新
    created_by UUID REFERENCES admin_accounts(id), -- 割り当て者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 複合ユニーク制約
    UNIQUE(client_id, location_id)
);

-- インデックス
CREATE INDEX idx_client_location_access_client_id ON client_location_access(client_id);
CREATE INDEX idx_client_location_access_location_id ON client_location_access(location_id);

-- =====================================================
-- 4. バッチ操作履歴テーブル
-- =====================================================

-- バッチ操作の履歴記録
CREATE TABLE IF NOT EXISTS batch_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL, -- 'shift_approve', 'shift_template_apply', etc.
    target_count INTEGER NOT NULL, -- 対象件数
    success_count INTEGER DEFAULT 0, -- 成功件数
    error_count INTEGER DEFAULT 0, -- エラー件数
    
    -- 操作詳細
    operation_data JSONB, -- 操作対象や条件のJSON
    error_details JSONB, -- エラー詳細のJSON
    
    -- 実行者
    executed_by UUID REFERENCES admin_accounts(id), -- 実行者
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- ステータス
    status VARCHAR(20) DEFAULT 'processing' -- processing, completed, failed
);

-- インデックス
CREATE INDEX idx_batch_operations_executed_by ON batch_operations(executed_by);
CREATE INDEX idx_batch_operations_status ON batch_operations(status);
CREATE INDEX idx_batch_operations_executed_at ON batch_operations(executed_at);

-- =====================================================
-- 5. RLS (Row Level Security) ポリシー
-- =====================================================

-- シフトテンプレートのRLS
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのテンプレートにアクセス可能
CREATE POLICY "Admin can access all shift templates" ON shift_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_accounts 
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

-- クライアントは割り当てられた拠点のテンプレートのみアクセス可能
CREATE POLICY "Client can access assigned location templates" ON shift_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM client_location_access cla
            JOIN admin_accounts aa ON aa.id = cla.client_id
            WHERE aa.id = auth.uid() 
            AND cla.location_id = shift_templates.location_id
            AND aa.account_type = 'client'
        )
    );

-- クライアントアカウントアクセス制御のRLS
ALTER TABLE client_location_access ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのアクセス制御を管理可能
CREATE POLICY "Admin can manage all client access" ON client_location_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_accounts 
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    );

-- クライアントは自分のアクセス制御のみ閲覧可能
CREATE POLICY "Client can view own access" ON client_location_access
    FOR SELECT USING (client_id = auth.uid());

-- =====================================================
-- 6. 便利なビューとファンクション
-- =====================================================

-- クライアントがアクセス可能な拠点一覧ビュー
CREATE OR REPLACE VIEW client_accessible_locations AS
SELECT 
    cla.client_id,
    l.*,
    cla.access_level,
    cla.can_approve_shifts,
    cla.can_view_reports,
    cla.can_manage_users
FROM client_location_access cla
JOIN locations l ON l.id = cla.location_id
JOIN admin_accounts aa ON aa.id = cla.client_id
WHERE aa.is_active = true
AND l.is_active = true
AND (cla.access_start_date IS NULL OR cla.access_start_date <= CURRENT_DATE)
AND (cla.access_end_date IS NULL OR cla.access_end_date >= CURRENT_DATE);

-- シフトテンプレート適用ファンクション
CREATE OR REPLACE FUNCTION apply_shift_template(
    template_id UUID,
    target_user_id UUID,
    target_date DATE
) RETURNS UUID AS $$
DECLARE
    template_record shift_templates%ROWTYPE;
    new_shift_id UUID;
BEGIN
    -- テンプレート取得
    SELECT * INTO template_record FROM shift_templates WHERE id = template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found: %', template_id;
    END IF;
    
    -- 既存シフトチェック
    IF EXISTS (
        SELECT 1 FROM shifts 
        WHERE user_id = target_user_id 
        AND shift_date = target_date
    ) THEN
        RAISE EXCEPTION 'Shift already exists for user % on %', target_user_id, target_date;
    END IF;
    
    -- 新しいシフト作成
    INSERT INTO shifts (
        user_id,
        shift_date,
        shift_type,
        start_time,
        end_time,
        shift_status,
        note
    ) VALUES (
        target_user_id,
        target_date,
        template_record.shift_type,
        template_record.start_time,
        template_record.end_time,
        'adjusting', -- デフォルトは調整中
        'テンプレート適用: ' || template_record.name
    ) RETURNING id INTO new_shift_id;
    
    RETURN new_shift_id;
END;
$$ LANGUAGE plpgsql;

-- バッチシフト承認ファンクション
CREATE OR REPLACE FUNCTION batch_approve_shifts(
    shift_ids UUID[],
    approver_id UUID
) RETURNS JSONB AS $$
DECLARE
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    errors JSONB := '[]'::JSONB;
    shift_id UUID;
BEGIN
    FOREACH shift_id IN ARRAY shift_ids
    LOOP
        BEGIN
            UPDATE shifts 
            SET 
                shift_status = 'confirmed',
                updated_at = NOW()
            WHERE id = shift_id
            AND shift_status = 'adjusting'; -- 調整中のもののみ承認可能
            
            IF FOUND THEN
                success_count := success_count + 1;
            ELSE
                error_count := error_count + 1;
                errors := errors || to_jsonb(ARRAY[shift_id::TEXT, 'Shift not found or already confirmed']);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := errors || to_jsonb(ARRAY[shift_id::TEXT, SQLERRM]);
        END;
    END LOOP;
    
    -- バッチ操作履歴記録
    INSERT INTO batch_operations (
        operation_type,
        target_count,
        success_count,
        error_count,
        operation_data,
        error_details,
        executed_by,
        completed_at,
        status
    ) VALUES (
        'shift_approve',
        array_length(shift_ids, 1),
        success_count,
        error_count,
        to_jsonb(shift_ids),
        errors,
        approver_id,
        NOW(),
        CASE WHEN error_count = 0 THEN 'completed' ELSE 'partial' END
    );
    
    RETURN jsonb_build_object(
        'success_count', success_count,
        'error_count', error_count,
        'errors', errors
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. 初期データとサンプル
-- =====================================================

-- サンプルシフトテンプレート（既存拠点がある場合）
INSERT INTO shift_templates (name, description, location_id, shift_type, start_time, end_time, break_duration, break_start_time)
SELECT 
    l.name || '早番パターン',
    '早番の標準シフトパターン',
    l.id,
    'early',
    '08:00:00',
    '17:00:00',
    60,
    '12:00:00'
FROM locations l 
WHERE l.is_active = true
LIMIT 3
ON CONFLICT DO NOTHING;

INSERT INTO shift_templates (name, description, location_id, shift_type, start_time, end_time, break_duration, break_start_time)
SELECT 
    l.name || '遅番パターン',
    '遅番の標準シフトパターン',
    l.id,
    'late',
    '13:00:00',
    '22:00:00',
    60,
    '17:00:00'
FROM locations l 
WHERE l.is_active = true
LIMIT 3
ON CONFLICT DO NOTHING;

-- 権限設定のプリセット
CREATE OR REPLACE FUNCTION create_client_account(
    p_email VARCHAR(255),
    p_name VARCHAR(255),
    p_password_hash VARCHAR(255),
    p_location_ids UUID[]
) RETURNS UUID AS $$
DECLARE
    new_client_id UUID;
    location_id UUID;
BEGIN
    -- クライアントアカウント作成
    INSERT INTO admin_accounts (email, password_hash, name, account_type, permissions)
    VALUES (
        p_email,
        p_password_hash,
        p_name,
        'client',
        '{
            "shifts": {"read": true, "write": false, "approve": true},
            "users": {"read": true, "write": false},
            "reports": {"read": true, "export": false},
            "settings": {"read": false, "write": false}
        }'::JSONB
    ) RETURNING id INTO new_client_id;
    
    -- 拠点アクセス権限付与
    FOREACH location_id IN ARRAY p_location_ids
    LOOP
        INSERT INTO client_location_access (
            client_id,
            location_id,
            access_level,
            can_approve_shifts,
            can_view_reports
        ) VALUES (
            new_client_id,
            location_id,
            'read_write',
            true,
            true
        );
    END LOOP;
    
    RETURN new_client_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE shift_templates IS 'シフトテンプレート - 店舗別の標準シフトパターンを保存';
COMMENT ON TABLE admin_accounts IS '管理者・クライアントアカウント - CMS用のログインアカウント';
COMMENT ON TABLE client_location_access IS 'クライアント拠点アクセス制御 - 店長などが管理できる拠点を制限';
COMMENT ON TABLE batch_operations IS 'バッチ操作履歴 - 一括承認などの操作記録';