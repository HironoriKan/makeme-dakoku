-- 計算項目のビュー化マイグレーション
-- daily_reports_with_metricsビュー作成

-- Step 1: daily_reports_with_metricsビューを作成
CREATE OR REPLACE VIEW daily_reports_with_metrics AS
SELECT 
  id,
  user_id,
  report_date,
  sales_amount,
  customer_count,
  items_sold,
  checkout_time,
  notes,
  created_at,
  updated_at,
  -- 計算項目を動的に生成
  CASE 
    WHEN customer_count > 0 THEN ROUND(sales_amount / customer_count)
    ELSE 0
  END AS customer_unit_price,
  CASE 
    WHEN customer_count > 0 THEN ROUND((items_sold::numeric / customer_count) * 10) / 10
    ELSE 0.0
  END AS items_per_customer
FROM daily_reports;

-- Step 2: ビューにコメントを追加
COMMENT ON VIEW daily_reports_with_metrics IS '日次レポート計算項目付きビュー - customer_unit_priceとitems_per_customerを動的計算';

-- Step 3: ビューの確認用クエリ（実行時の確認用）
-- SELECT * FROM daily_reports_with_metrics LIMIT 5;