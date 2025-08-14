-- シフトに沿った現実的な打刻記録を生成するSQL
-- 実行前にSupabaseのSQL Editorで実行してください

DO $$
DECLARE
  shift_record RECORD;
  user_record RECORD;
  base_date DATE;
  clock_in_time TIMESTAMP;
  clock_out_time TIMESTAMP;
  break_start_time TIMESTAMP;
  break_end_time TIMESTAMP;
  variance_minutes INTEGER;
  break_variance_minutes INTEGER;
BEGIN
  -- 過去30日間のシフトに対して打刻記録を生成
  FOR shift_record IN 
    SELECT s.*, u.display_name
    FROM shifts s
    JOIN users u ON s.user_id = u.id
    WHERE s.shift_date >= CURRENT_DATE - INTERVAL '30 days'
      AND s.shift_date <= CURRENT_DATE
      AND s.shift_type != 'off'
    ORDER BY s.shift_date, s.user_id
  LOOP
    -- 既存の打刻記録があるかチェック
    IF EXISTS (
      SELECT 1 FROM time_records 
      WHERE user_id = shift_record.user_id 
        AND DATE(recorded_at) = shift_record.shift_date
    ) THEN
      CONTINUE; -- 既にデータがある場合はスキップ
    END IF;

    -- ベース日時を設定
    base_date := shift_record.shift_date;
    
    -- シフト時間がnullの場合のデフォルト値を設定
    IF shift_record.start_time IS NULL THEN
      CASE shift_record.shift_type
        WHEN 'early' THEN shift_record.start_time := '09:00:00';
        WHEN 'late' THEN shift_record.start_time := '17:00:00';
        ELSE shift_record.start_time := '10:00:00';
      END CASE;
    END IF;
    
    IF shift_record.end_time IS NULL THEN
      CASE shift_record.shift_type
        WHEN 'early' THEN shift_record.end_time := '17:00:00';
        WHEN 'late' THEN shift_record.end_time := '01:00:00';
        ELSE shift_record.end_time := '18:00:00';
      END CASE;
    END IF;

    -- 出勤時刻の計算（5-15分のバラつき）
    variance_minutes := (RANDOM() * 20 - 5)::INTEGER; -- -5 to +15分
    clock_in_time := (base_date + shift_record.start_time)::TIMESTAMP + (variance_minutes || ' minutes')::INTERVAL;
    
    -- 退勤時刻の計算（-15分 to +30分のバラつき）
    variance_minutes := (RANDOM() * 45 - 15)::INTEGER; -- -15 to +30分
    
    -- 深夜シフトの場合は翌日にかかることがある
    IF shift_record.end_time < shift_record.start_time THEN
      clock_out_time := (base_date + INTERVAL '1 day' + shift_record.end_time)::TIMESTAMP + (variance_minutes || ' minutes')::INTERVAL;
    ELSE
      clock_out_time := (base_date + shift_record.end_time)::TIMESTAMP + (variance_minutes || ' minutes')::INTERVAL;
    END IF;

    -- 休憩時間の計算（勤務時間が6時間以上の場合）
    IF EXTRACT(EPOCH FROM (clock_out_time - clock_in_time))/3600 >= 6 THEN
      -- 休憩開始（勤務開始から2-4時間後）
      break_variance_minutes := (RANDOM() * 120 + 120)::INTEGER; -- 2-4時間後
      break_start_time := clock_in_time + (break_variance_minutes || ' minutes')::INTERVAL;
      
      -- 休憩終了（休憩開始から45-90分後）
      break_variance_minutes := (RANDOM() * 45 + 45)::INTEGER; -- 45-90分
      break_end_time := break_start_time + (break_variance_minutes || ' minutes')::INTERVAL;
    END IF;

    -- 出勤記録を挿入
    INSERT INTO time_records (
      id, user_id, record_type, recorded_at, location_lat, location_lng, 
      note, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      shift_record.user_id,
      'clock_in',
      clock_in_time,
      35.6762 + (RANDOM() - 0.5) * 0.01, -- 東京周辺の緯度
      139.6503 + (RANDOM() - 0.5) * 0.01, -- 東京周辺の経度
      CASE 
        WHEN variance_minutes > 10 THEN '遅刻'
        WHEN variance_minutes < -2 THEN '早出'
        ELSE NULL
      END,
      clock_in_time,
      clock_in_time
    );

    -- 休憩記録を挿入（該当する場合）
    IF break_start_time IS NOT NULL THEN
      INSERT INTO time_records (
        id, user_id, record_type, recorded_at, location_lat, location_lng, 
        note, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        shift_record.user_id,
        'break_start',
        break_start_time,
        35.6762 + (RANDOM() - 0.5) * 0.01,
        139.6503 + (RANDOM() - 0.5) * 0.01,
        '休憩開始',
        break_start_time,
        break_start_time
      );

      INSERT INTO time_records (
        id, user_id, record_type, recorded_at, location_lat, location_lng, 
        note, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        shift_record.user_id,
        'break_end',
        break_end_time,
        35.6762 + (RANDOM() - 0.5) * 0.01,
        139.6503 + (RANDOM() - 0.5) * 0.01,
        '休憩終了',
        break_end_time,
        break_end_time
      );
    END IF;

    -- 退勤記録を挿入（90%の確率で）
    IF RANDOM() > 0.1 AND shift_record.shift_date < CURRENT_DATE THEN
      INSERT INTO time_records (
        id, user_id, record_type, recorded_at, location_lat, location_lng, 
        note, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        shift_record.user_id,
        'clock_out',
        clock_out_time,
        35.6762 + (RANDOM() - 0.5) * 0.01,
        139.6503 + (RANDOM() - 0.5) * 0.01,
        CASE 
          WHEN variance_minutes > 20 THEN '残業'
          WHEN variance_minutes < -10 THEN '早退'
          ELSE NULL
        END,
        clock_out_time,
        clock_out_time
      );
    END IF;

    -- ログ出力
    RAISE NOTICE '✅ 打刻記録生成完了: % - % (シフト: % - %)', 
      shift_record.display_name, 
      shift_record.shift_date,
      shift_record.start_time,
      shift_record.end_time;

  END LOOP;

  RAISE NOTICE '🎉 全ての打刻記録生成が完了しました！';
END $$;

-- 生成された記録の確認用クエリ
SELECT 
  u.display_name,
  DATE(tr.recorded_at) as work_date,
  tr.record_type,
  TIME(tr.recorded_at) as record_time,
  tr.note,
  s.shift_type,
  s.start_time as shift_start,
  s.end_time as shift_end
FROM time_records tr
JOIN users u ON tr.user_id = u.id
LEFT JOIN shifts s ON s.user_id = tr.user_id AND s.shift_date = DATE(tr.recorded_at)
WHERE tr.recorded_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY u.display_name, tr.recorded_at;