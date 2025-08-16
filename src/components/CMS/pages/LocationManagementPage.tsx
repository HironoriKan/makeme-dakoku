import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LocationManagement from '../LocationManagement';

const LocationManagementPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  
  // タブが指定されていない場合は、デフォルトのpermanentにリダイレクト
  useEffect(() => {
    if (!tab) {
      navigate('/admin/location-management/permanent', { replace: true });
    }
  }, [tab, navigate]);
  
  // 有効なタブ値をチェック
  const validTabs = ['makeme', 'permanent', 'event'];
  const currentTab = validTabs.includes(tab || '') ? tab : 'permanent';
  
  return <LocationManagement defaultTab={currentTab as 'makeme' | 'permanent' | 'event'} />;
};

export default LocationManagementPage;