-- 位置情報設計改善マイグレーション
-- time_recordsテーブルの不要カラム削除とlocation_nameの正規化

-- 注意: このマイグレーションは段階的に実行する必要があります
-- 実行前に必ずバックアップを取得してください

-- Phase 1: データ検証とコード確認
-- 現在使用されているlocation_name、location_lat、location_lngの状況を確認
SELECT 
  COUNT(*) as total_records,
  COUNT(location_id) as has_location_id,
  COUNT(location_name) as has_location_name,
  COUNT(location_lat) as has_location_lat,
  COUNT(location_lng) as has_location_lng,
  COUNT(CASE WHEN location_id IS NOT NULL AND location_name IS NOT NULL THEN 1 END) as both_id_and_name
FROM time_records;

-- location_nameとlocation_idの整合性確認
SELECT 
  tr.location_name,
  l.name as actual_location_name,
  COUNT(*) as count
FROM time_records tr
LEFT JOIN locations l ON tr.location_id = l.id
WHERE tr.location_name IS NOT NULL
GROUP BY tr.location_name, l.name
ORDER BY count DESC;

-- Phase 2: location_nameの正規化（必要に応じて）
-- location_idが設定されているがlocation_nameが古い場合の更新
UPDATE time_records 
SET location_name = (
  SELECT 
    CASE 
      WHEN l.brand_name IS NOT NULL AND l.store_name IS NOT NULL 
      THEN l.brand_name || ' ' || l.store_name
      ELSE l.name
    END
  FROM locations l 
  WHERE l.id = time_records.location_id
)
WHERE location_id IS NOT NULL 
  AND (location_name IS NULL OR location_name = '');

-- Phase 3: time_record_changesテーブルの対応
-- 変更履歴テーブルでもlocation_nameカラムが使用されているため
-- 新しいレコードではlocation_idを優先的に使用するように変更が必要

-- Phase 4: 不要カラムの削除（段階的実行）
-- 警告: この段階はコードの修正完了後に実行してください

-- Step 4.1: location_lat, location_lngの削除準備
-- これらのカラムは現在ほとんど使用されていないため削除可能
-- ALTER TABLE time_records DROP COLUMN IF EXISTS location_lat;
-- ALTER TABLE time_records DROP COLUMN IF EXISTS location_lng;

-- Step 4.2: location_nameの削除準備（将来的な実装）
-- location_nameの削除はlocation_idへの完全な移行後に実行
-- すべてのコンポーネントでlocation_idとlocationテーブルJOINでの表示に変更後
-- ALTER TABLE time_records DROP COLUMN IF EXISTS location_name;

-- Phase 5: time_record_changesテーブルの対応
-- original_location_name, new_location_nameカラムも同様に検討が必要
-- こちらは変更履歴の記録のため、より慎重な検討が必要

-- 確認クエリ: マイグレーション後の検証
-- SELECT 
--   tr.id,
--   tr.location_id,
--   l.name as location_name,
--   tr.record_type,
--   tr.recorded_at
-- FROM time_records tr
-- LEFT JOIN locations l ON tr.location_id = l.id
-- WHERE tr.created_at >= CURRENT_DATE - INTERVAL '7 days'
-- ORDER BY tr.recorded_at DESC
-- LIMIT 10;