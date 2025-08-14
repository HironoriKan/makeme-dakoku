-- 既存のシフトデータを時間に基づいて正しいshift_typeに更新するSQL
-- 実行前にSupabaseのSQL Editorで実行してください

-- ステップ1: 現在の状況を確認
SELECT 
  shift_type,
  COUNT(*) as count,
  COUNT(CASE 
    WHEN start_time IS NOT NULL AND EXTRACT(HOUR FROM start_time) < 10 THEN 1 
  END) as should_be_early,
  COUNT(CASE 
    WHEN end_time IS NOT NULL AND EXTRACT(HOUR FROM end_time) >= 20 THEN 1 
  END) as should_be_late
FROM shifts 
WHERE shift_type != 'off'
GROUP BY shift_type;

-- ステップ2: 時間ベースでshift_typeを更新
UPDATE shifts 
SET 
  shift_type = CASE
    -- 10:00より前に開始 = 早番（優先）
    WHEN start_time IS NOT NULL 
         AND EXTRACT(HOUR FROM start_time) < 10 
    THEN 'early'::shift_type
    
    -- 20:00以降に終了 = 遅番
    WHEN end_time IS NOT NULL 
         AND EXTRACT(HOUR FROM end_time) >= 20 
    THEN 'late'::shift_type
    
    -- その他は通常
    ELSE 'normal'::shift_type
  END,
  updated_at = NOW()
WHERE 
  shift_type != 'off'
  AND (start_time IS NOT NULL OR end_time IS NOT NULL);

-- ステップ3: 更新結果を確認
SELECT 
  shift_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM shifts 
WHERE shift_type != 'off'
GROUP BY shift_type
ORDER BY shift_type;

-- ステップ4: 詳細な確認（時間別分析）
SELECT 
  shift_type,
  EXTRACT(HOUR FROM start_time) as start_hour,
  EXTRACT(HOUR FROM end_time) as end_hour,
  COUNT(*) as count
FROM shifts 
WHERE shift_type != 'off' 
  AND start_time IS NOT NULL 
  AND end_time IS NOT NULL
GROUP BY shift_type, EXTRACT(HOUR FROM start_time), EXTRACT(HOUR FROM end_time)
ORDER BY shift_type, start_hour, end_hour;

-- メッセージ
SELECT '✅ シフトタイプの時間ベース更新が完了しました' as result;