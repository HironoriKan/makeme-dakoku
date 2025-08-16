import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AttendanceLogicSettings from '../AttendanceLogicSettings';
import BreakTimeSettings from '../BreakTimeSettings';
import TransactionManagement from '../TransactionManagement';

const SettingsPage: React.FC = () => {
  const { subTab } = useParams<{ subTab?: string }>();
  const navigate = useNavigate();

  // デフォルトは勤怠ロジック管理
  React.useEffect(() => {
    if (!subTab) {
      navigate('/admin/settings/attendance_logic', { replace: true });
    }
  }, [subTab, navigate]);

  switch (subTab) {
    case 'attendance_logic':
      return <AttendanceLogicSettings />;
    case 'break_time':
      return <BreakTimeSettings />;
    case 'transaction':
      return <TransactionManagement />;
    default:
      return <AttendanceLogicSettings />;
  }
};

export default SettingsPage;