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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">シフト管理</h1>
        </div>
        <p className="text-gray-600">ユーザーのシフトを確認・編集・承認できます</p>
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