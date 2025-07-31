-- メイクミー勤怠システム DB改善提案
-- 実行順序に従って段階的に適用してください

-- =============================================================================
-- 優先度: 高 - 即座に対応が必要な問題
-- =============================================================================

-- 1. 拠点マスターテーブルの作成（ハードコード解決）
CREATE TABLE locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE, -- 'HQ', 'BRANCH1', 'REMOTE'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 初期データ投入
INSERT INTO locations (name, code) VALUES 
    ('本社', 'HQ'),
    ('支社', 'BRANCH'),
    ('在宅', 'REMOTE');

-- 2. time_records テーブルに location_id 追加
ALTER TABLE time_records ADD COLUMN location_id UUID REFERENCES locations(id);

-- 既存データのマイグレーション
UPDATE time_records SET location_id = (
    SELECT id FROM locations WHERE 
    CASE 
        WHEN time_records.note LIKE '%本社%' THEN locations.code = 'HQ'
        WHEN time_records.note LIKE '%支社%' THEN locations.code = 'BRANCH'
        WHEN time_records.note LIKE '%在宅%' THEN locations.code = 'REMOTE'
        ELSE locations.code = 'HQ'
    END
    LIMIT 1
);

-- 3. daily_reports の計算項目削除（データ整合性向上）
-- ※実行前にバックアップを取ってください
-- ALTER TABLE daily_reports DROP COLUMN customer_unit_price;
-- ALTER TABLE daily_reports DROP COLUMN items_per_customer;

-- 4. 計算項目を含むビューの作成
CREATE OR REPLACE VIEW daily_reports_with_metrics AS
SELECT 
    *,
    CASE WHEN customer_count > 0 
        THEN ROUND(sales_amount::FLOAT / customer_count) 
        ELSE 0 
    END as customer_unit_price,
    CASE WHEN customer_count > 0 
        THEN ROUND((items_sold::FLOAT / customer_count) * 10) / 10 
        ELSE 0.0 
    END as items_per_customer
FROM daily_reports;

-- =============================================================================
-- 優先度: 中 - 運用改善のための機能拡張
-- =============================================================================

-- 5. 承認ワークフローテーブル
CREATE TABLE approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL, -- 'time_record', 'daily_report', 'shift'
    target_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ユーザー権限管理
CREATE TABLE roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- 基本ロールの作成
INSERT INTO roles (name, display_name, permissions) VALUES 
    ('employee', '一般社員', '{"time_record": {"create": true, "read": true, "update": false, "delete": false}}'),
    ('manager', '管理者', '{"time_record": {"create": true, "read": true, "update": true, "delete": true}, "approval": {"create": true, "read": true, "update": true}}'),
    ('admin', 'システム管理者', '{"*": {"*": true}}');

-- 7. 通知システム
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'approval_request', 'shift_reminder', 'system_notice'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- 関連データ（target_id等）
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. システム設定テーブル
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 基本設定の投入
INSERT INTO system_settings (key, value, description) VALUES 
    ('work_hours_per_day', '8', '標準勤務時間（時間）'),
    ('break_time_minutes', '60', '標準休憩時間（分）'),
    ('overtime_threshold', '8', '残業開始時間（時間）'),
    ('location_tracking_enabled', 'false', '位置情報トラッキング有効化'),
    ('approval_required_for_edits', 'true', '勤怠記録編集時の承認要求');

-- =============================================================================
-- 優先度: 低 - 将来的な機能拡張
-- =============================================================================

-- 9. 休暇管理
CREATE TABLE leave_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    max_days_per_year INTEGER,
    carry_forward_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. プロジェクト/部署管理
CREATE TABLE departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- time_records にプロジェクト関連付け
ALTER TABLE time_records ADD COLUMN project_id UUID REFERENCES projects(id);

-- =============================================================================
-- インデックス作成（パフォーマンス向上）
-- =============================================================================

-- 既存テーブルのインデックス最適化
CREATE INDEX IF NOT EXISTS idx_time_records_user_date ON time_records(user_id, recorded_at::DATE);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_time_record_changes_user_created ON time_record_changes(user_id, created_at DESC);

-- 新規テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_approvals_target ON approvals(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_approvals_user_status ON approvals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =============================================================================
-- 制約追加（データ整合性向上）
-- =============================================================================

-- daily_reports の制約強化
ALTER TABLE daily_reports ADD CONSTRAINT chk_daily_reports_positive_amounts 
    CHECK (sales_amount >= 0 AND customer_count >= 0 AND items_sold >= 0);

-- time_records の制約
ALTER TABLE time_records ADD CONSTRAINT chk_time_records_future_limit 
    CHECK (recorded_at <= now() + INTERVAL '1 hour'); -- 未来の打刻を1時間まで制限

-- shifts の制約
ALTER TABLE shifts ADD CONSTRAINT chk_shifts_time_order 
    CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time);

-- =============================================================================
-- トリガー作成（自動更新）
-- =============================================================================

-- updated_at 自動更新トリガー（全テーブル）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガー設定
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS（Row Level Security）ポリシー設定例
-- =============================================================================

-- ※本番環境では適切なRLSを設定してください
/*
-- users テーブル: 自分の情報のみ閲覧可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_policy ON users FOR ALL USING (id = auth.uid());

-- time_records テーブル: 自分の記録のみ操作可能
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_records_policy ON time_records FOR ALL USING (user_id = auth.uid());

-- 管理者は全データ閲覧可能（ロール確認が必要）
CREATE POLICY admin_full_access ON time_records FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    ));
*/

-- =============================================================================
-- 確認クエリ
-- =============================================================================

-- 作成されたテーブル一覧
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'locations', 'approvals', 'roles', 'user_roles', 
    'notifications', 'system_settings', 'leave_types', 
    'leave_requests', 'departments', 'projects'
) 
ORDER BY table_name;

-- インデックス確認
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('time_records', 'daily_reports', 'shifts')
ORDER BY tablename, indexname;