-- サンプルシフトデータを生成するSQL
-- 実行前にSupabaseのSQL Editorで実行してください

DO $$
DECLARE
  user_record RECORD;
  target_date DATE;
  shift_types TEXT[] := ARRAY['early', 'normal', 'late'];
  shift_type TEXT;
  start_times TIME[] := ARRAY['09:00:00', '10:00:00', '17:00:00'];
  end_times TIME[] := ARRAY['17:00:00', '18:00:00', '01:00:00'];
  random_index INTEGER;
BEGIN
  -- 過去30日から未来15日までのシフトを生成
  FOR target_date IN 
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '30 days', 
      CURRENT_DATE + INTERVAL '15 days', 
      INTERVAL '1 day'
    )::DATE
  LOOP
    -- 全ユーザーに対してランダムにシフトを割り当て
    FOR user_record IN SELECT id, display_name FROM users ORDER BY created_at LOOP
      
      -- 既存のシフトがある場合はスキップ
      IF EXISTS (
        SELECT 1 FROM shifts 
        WHERE user_id = user_record.id AND shift_date = target_date
      ) THEN
        CONTINUE;
      END IF;

      -- 30%の確率で休日
      IF RANDOM() < 0.3 THEN
        INSERT INTO shifts (
          id, user_id, shift_date, shift_type, shift_status, 
          start_time, end_time, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          user_record.id,
          target_date,
          'off',
          'confirmed',
          NULL,
          NULL,
          NOW(),
          NOW()
        );
        
        CONTINUE;
      END IF;

      -- ランダムなシフトタイプを選択
      random_index := (RANDOM() * 3)::INTEGER + 1;
      shift_type := shift_types[random_index];

      -- シフト状態を決定（80%確定、20%調整中）
      INSERT INTO shifts (
        id, user_id, shift_date, shift_type, shift_status, 
        start_time, end_time, note, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        user_record.id,
        target_date,
        shift_type,
        CASE WHEN RANDOM() < 0.8 THEN 'confirmed' ELSE 'adjusting' END,
        start_times[random_index],
        end_times[random_index],
        CASE 
          WHEN shift_type = 'early' THEN '早番シフト'
          WHEN shift_type = 'late' THEN '遅番シフト'
          ELSE '通常シフト'
        END,
        NOW(),
        NOW()
      );

      -- 週末は80%の確率で休日
      IF EXTRACT(DOW FROM target_date) IN (0, 6) AND RANDOM() < 0.8 THEN
        UPDATE shifts 
        SET shift_type = 'off', start_time = NULL, end_time = NULL, note = '週末休み'
        WHERE user_id = user_record.id AND shift_date = target_date;
      END IF;

    END LOOP;
    
    -- 進捗表示
    IF target_date = CURRENT_DATE OR EXTRACT(DAY FROM target_date) = 1 THEN
      RAISE NOTICE '📅 シフト生成進捗: %', target_date;
    END IF;
    
  END LOOP;

  RAISE NOTICE '🎉 シフトデータ生成が完了しました！';
END $$;

-- 生成されたシフトの確認用クエリ
SELECT 
  u.display_name,
  s.shift_date,
  s.shift_type,
  s.shift_status,
  s.start_time,
  s.end_time,
  s.note
FROM shifts s
JOIN users u ON s.user_id = u.id
WHERE s.shift_date >= CURRENT_DATE - INTERVAL '7 days'
  AND s.shift_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY s.shift_date, u.display_name;

-- シフト統計の確認
SELECT 
  shift_type,
  shift_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM shifts s
WHERE s.shift_date >= CURRENT_DATE - INTERVAL '30 days'
  AND s.shift_date <= CURRENT_DATE + INTERVAL '15 days'
GROUP BY shift_type, shift_status
ORDER BY shift_type, shift_status;