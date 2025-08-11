import React, { useState } from 'react';
import { Tables } from '../../types/supabase';
import UserSelector from './UserSelector';
import AdminShiftCalendar from './AdminShiftCalendar';
import ShiftEditModal from './ShiftEditModal';
import { Users, Calendar, Settings } from 'lucide-react';

type Shift = Tables<'shifts'>;

const ShiftManagement: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserSelect = (userId: string | null) => {
    setSelectedUserId(userId);
  };

  const handleShiftEdit = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedShift(null);
  };

  const handleShiftSave = () => {
    // Trigger calendar refresh
    setRefreshTrigger(prev => prev + 1);
    setIsEditModalOpen(false);
    setSelectedShift(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-gray-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">シフト管理</h1>
            <p className="text-gray-600">ユーザーのシフトを確認・編集・承認できます</p>
          </div>
        </div>
      </div>

      {/* User Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">ユーザー選択</h2>
        </div>
        
        <div className="max-w-md">
          <UserSelector
            selectedUserId={selectedUserId}
            onUserSelect={handleUserSelect}
            placeholder="表示するユーザーを選択（全ユーザー表示も可能）"
          />
        </div>

        {selectedUserId && (
          <div className="mt-3 text-sm text-gray-600">
            選択中のユーザーのシフトのみ表示されます。全ユーザーを表示する場合は「全ユーザー」を選択してください。
          </div>
        )}
      </div>

      {/* Shift Calendar */}
      <AdminShiftCalendar
        key={refreshTrigger} // Force refresh when refreshTrigger changes
        selectedUserId={selectedUserId}
        onShiftEdit={handleShiftEdit}
      />

      {/* Information Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">カレンダーの使い方</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• シフトをクリックして編集</li>
            <li>• 承認待ちのシフトは承認可能</li>
            <li>• 月を変更して過去/未来を確認</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">シフトの状態</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• 🟠 調整中: 承認待ち</li>
            <li>• 🟢 確定: 承認済み</li>
            <li>• ✏️ 編集可能</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">管理者権限</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• シフトの編集・削除</li>
            <li>• シフトの承認</li>
            <li>• 時間の変更</li>
          </ul>
        </div>
      </div>

      {/* Edit Modal */}
      <ShiftEditModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        shift={selectedShift}
        onSave={handleShiftSave}
      />
    </div>
  );
};

export default ShiftManagement;