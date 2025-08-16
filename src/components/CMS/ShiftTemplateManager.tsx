import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  MoreHorizontal, 
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Select, 
  Table, 
  Card, 
  Modal, 
  ConfirmDialog,
  colors 
} from '../ui';
import ShiftTemplateService from '../../services/shiftTemplateService';
import { 
  ShiftTemplateWithLocation, 
  ShiftTemplateFilters, 
  CreateShiftTemplateRequest,
  ShiftType 
} from '../../types/batch-operations';
import ShiftTemplateModal from './ShiftTemplateModal';
import ApplyTemplateModal from './ApplyTemplateModal';

interface ShiftTemplateManagerProps {}

const ShiftTemplateManager: React.FC<ShiftTemplateManagerProps> = () => {
  const [templates, setTemplates] = useState<ShiftTemplateWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // フィルター・検索
  const [filters, setFilters] = useState<ShiftTemplateFilters>({});
  const [searchText, setSearchText] = useState('');
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // モーダル状態
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplateWithLocation | null>(null);
  
  // 削除確認
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ShiftTemplateWithLocation | null>(null);
  
  // 選択状態
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  // 拠点一覧（フィルター用）
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);

  /**
   * データ読み込み
   */
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ShiftTemplateService.getTemplates(
        { ...filters, search: searchText },
        currentPage,
        pageSize
      );
      
      setTemplates(response.data);
      setTotalCount(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'テンプレート取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 拠点一覧取得
   */
  const fetchLocations = async () => {
    try {
      // TODO: LocationService を使用して拠点一覧を取得
      // 暫定的に空配列
      setLocations([]);
    } catch (err) {
      console.error('拠点一覧取得エラー:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filters, searchText, currentPage, pageSize]);

  useEffect(() => {
    fetchLocations();
  }, []);

  /**
   * 検索実行
   */
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  /**
   * フィルター変更
   */
  const handleFilterChange = (key: keyof ShiftTemplateFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  /**
   * テンプレート作成
   */
  const handleCreateTemplate = async (data: CreateShiftTemplateRequest) => {
    try {
      await ShiftTemplateService.createTemplate(data);
      setCreateModalOpen(false);
      fetchTemplates();
    } catch (err) {
      throw err; // モーダル側でエラーハンドリング
    }
  };

  /**
   * テンプレート更新
   */
  const handleUpdateTemplate = async (data: CreateShiftTemplateRequest) => {
    if (!selectedTemplate) return;
    
    try {
      await ShiftTemplateService.updateTemplate(selectedTemplate.id, data);
      setEditModalOpen(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      throw err; // モーダル側でエラーハンドリング
    }
  };

  /**
   * テンプレート削除
   */
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      await ShiftTemplateService.deleteTemplate(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  /**
   * テンプレート複製
   */
  const handleDuplicateTemplate = async (template: ShiftTemplateWithLocation) => {
    try {
      const newName = `${template.name} (複製)`;
      await ShiftTemplateService.duplicateTemplate(template.id, newName);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '複製に失敗しました');
    }
  };

  /**
   * 一括状態変更
   */
  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedTemplateIds.length === 0) return;
    
    try {
      await ShiftTemplateService.toggleTemplatesStatus(selectedTemplateIds, isActive);
      setSelectedTemplateIds([]);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '状態変更に失敗しました');
    }
  };

  /**
   * テーブル列定義
   */
  const columns = [
    {
      key: 'name',
      title: 'テンプレート名',
      dataIndex: 'name',
      render: (value: string, record: ShiftTemplateWithLocation) => (
        <div>
          <span className="font-medium">{value}</span>
          {record.description && (
            <p className="text-xs text-gray-500 mt-1">{record.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      title: '拠点',
      render: (value: any, record: ShiftTemplateWithLocation) => (
        <span>{record.location?.name || '未設定'}</span>
      ),
    },
    {
      key: 'shift_type',
      title: 'シフトタイプ',
      dataIndex: 'shift_type',
      render: (value: ShiftType) => {
        const typeLabels = {
          normal: '通常',
          early: '早番',
          late: '遅番',
          off: '休み'
        };
        const typeColors = {
          normal: colors.primary[500],
          early: colors.success[500],
          late: colors.warning[500],
          off: colors.gray[500]
        };
        return (
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${typeColors[value]}20`,
              color: typeColors[value]
            }}
          >
            {typeLabels[value]}
          </span>
        );
      },
    },
    {
      key: 'time_range',
      title: '時間',
      render: (value: any, record: ShiftTemplateWithLocation) => (
        <div className="text-sm">
          {record.start_time && record.end_time ? (
            <>
              <div>{record.start_time} - {record.end_time}</div>
              {record.break_duration && (
                <div className="text-xs text-gray-500">
                  休憩 {record.break_duration}分
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400">未設定</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'ステータス',
      dataIndex: 'is_active',
      render: (value: boolean) => (
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: value ? `${colors.success[500]}20` : `${colors.gray[500]}20`,
            color: value ? colors.success[500] : colors.gray[500]
          }}
        >
          {value ? '有効' : '無効'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'アクション',
      render: (value: any, record: ShiftTemplateWithLocation) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedTemplate(record);
              setApplyModalOpen(true);
            }}
            leftIcon={<Play className="w-3 h-3" />}
          >
            適用
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedTemplate(record);
              setEditModalOpen(true);
            }}
            leftIcon={<Edit className="w-3 h-3" />}
          >
            編集
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDuplicateTemplate(record)}
            leftIcon={<Copy className="w-3 h-3" />}
          >
            複製
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTemplateToDelete(record);
              setDeleteDialogOpen(true);
            }}
            leftIcon={<Trash2 className="w-3 h-3" />}
          >
            削除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">シフトテンプレート管理</h1>
          <p className="text-gray-600 mt-1">店舗別のシフトパターンを管理します</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          新規テンプレート
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <Card variant="outlined">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* フィルター・検索 */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="テンプレート名・説明で検索..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={filters.location_id || ''}
              onChange={(e) => handleFilterChange('location_id', e.target.value || undefined)}
            >
              <option value="">全ての拠点</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
            <Select
              value={filters.shift_type || ''}
              onChange={(e) => handleFilterChange('shift_type', e.target.value || undefined)}
            >
              <option value="">全てのタイプ</option>
              <option value="normal">通常</option>
              <option value="early">早番</option>
              <option value="late">遅番</option>
              <option value="off">休み</option>
            </Select>
            <Select
              value={filters.is_active !== undefined ? String(filters.is_active) : ''}
              onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
            >
              <option value="">全てのステータス</option>
              <option value="true">有効</option>
              <option value="false">無効</option>
            </Select>
          </div>

          {/* 一括操作 */}
          {selectedTemplateIds.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedTemplateIds.length}件選択中
              </span>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleBulkStatusChange(true)}
              >
                一括有効化
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleBulkStatusChange(false)}
              >
                一括無効化
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* テンプレート一覧 */}
      <Card>
        <Table
          dataSource={templates}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
          selection={{
            type: 'checkbox',
            selectedRowKeys: selectedTemplateIds,
            onChange: setSelectedTemplateIds,
            getRowKey: (record) => record.id,
          }}
          onRowClick={(record) => {
            setSelectedTemplate(record);
            setEditModalOpen(true);
          }}
          emptyText="テンプレートがありません"
        />
      </Card>

      {/* モーダル */}
      <ShiftTemplateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateTemplate}
        title="新規テンプレート作成"
      />

      <ShiftTemplateModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleUpdateTemplate}
        initialData={selectedTemplate}
        title="テンプレート編集"
      />

      <ApplyTemplateModal
        isOpen={applyModalOpen}
        onClose={() => {
          setApplyModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onApplied={fetchTemplates}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="テンプレート削除"
        message={`「${templateToDelete?.name}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        confirmVariant="error"
        onConfirm={handleDeleteTemplate}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setTemplateToDelete(null);
        }}
      />
    </div>
  );
};

export default ShiftTemplateManager;