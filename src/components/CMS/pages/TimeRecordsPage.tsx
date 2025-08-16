import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonthlyTimeRecords from '../MonthlyTimeRecords';

const TimeRecordsPage: React.FC = () => {
  const { recordId } = useParams<{ recordId?: string }>();

  // 現在はMonthlyTimeRecordsのみを表示
  // 詳細ページは将来実装時に追加
  return <MonthlyTimeRecords />;
};

export default TimeRecordsPage;