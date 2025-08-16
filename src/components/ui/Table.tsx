import React, { useState, useMemo, ReactNode } from 'react';
import { ChevronUp, ChevronDown, Search, MoreHorizontal } from 'lucide-react';
import { colors } from '../../styles/colors';
import { Button, IconButton } from './Button';
import { Input } from './Input';

/**
 * テーブル列定義
 */
interface Column<T = any> {
  /** 列のキー */
  key: string;
  /** 列のタイトル */
  title: string;
  /** データの取得方法 */
  dataIndex?: keyof T;
  /** カスタムレンダリング */
  render?: (value: any, record: T, index: number) => ReactNode;
  /** ソート可能かどうか */
  sortable?: boolean;
  /** 列幅 */
  width?: string | number;
  /** 列の配置 */
  align?: 'left' | 'center' | 'right';
  /** 固定列 */
  fixed?: 'left' | 'right';
}

/**
 * ソート設定
 */
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * ページネーション設定
 */
interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
}

/**
 * 選択設定
 */
interface SelectionConfig<T = any> {
  /** 選択タイプ */
  type: 'checkbox' | 'radio';
  /** 選択された行のキー */
  selectedRowKeys: string[];
  /** 選択変更時のコールバック */
  onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  /** 行のキーを取得する関数 */
  getRowKey: (record: T) => string;
}

/**
 * テーブルプロパティ
 */
interface TableProps<T = any> {
  /** テーブルデータ */
  dataSource: T[];
  /** 列定義 */
  columns: Column<T>[];
  /** ローディング状態 */
  loading?: boolean;
  /** ページネーション */
  pagination?: PaginationConfig | false;
  /** 選択機能 */
  selection?: SelectionConfig<T>;
  /** 検索機能 */
  searchable?: boolean;
  /** 検索プレースホルダー */
  searchPlaceholder?: string;
  /** 行クリック時のコールバック */
  onRowClick?: (record: T, index: number) => void;
  /** 空データ時のメッセージ */
  emptyText?: string;
  /** テーブルサイズ */
  size?: 'small' | 'middle' | 'large';
  /** カスタムクラス */
  className?: string;
}

/**
 * ローディングスケルトン
 */
const TableSkeleton: React.FC<{ columns: number; rows: number }> = ({ columns, rows }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <td key={colIndex} className="px-6 py-4">
            <div className="animate-pulse">
              <div 
                className="h-4 rounded"
                style={{ backgroundColor: colors.gray[200] }}
              />
            </div>
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

/**
 * 空データ表示
 */
const EmptyState: React.FC<{ message: string; colSpan: number }> = ({ message, colSpan }) => (
  <tbody>
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.gray[100] }}
          >
            <Search className="w-6 h-6" style={{ color: colors.gray[400] }} />
          </div>
          <p style={{ color: colors.text.secondary }}>{message}</p>
        </div>
      </td>
    </tr>
  </tbody>
);

/**
 * ページネーションコンポーネント
 */
const Pagination: React.FC<{
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}> = ({ config, onPageChange, onPageSizeChange }) => {
  const { current, pageSize, total, showSizeChanger = true, pageSizeOptions = [10, 20, 50, 100] } = config;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: colors.border.light }}>
      <div className="flex items-center space-x-4">
        {showSizeChanger && (
          <div className="flex items-center space-x-2">
            <span className="text-sm" style={{ color: colors.text.secondary }}>表示件数:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
              style={{ borderColor: colors.border.light }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}件</option>
              ))}
            </select>
          </div>
        )}
        <span className="text-sm" style={{ color: colors.text.secondary }}>
          {startItem}-{endItem} / {total}件
        </span>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          前へ
        </Button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 py-1 text-sm" style={{ color: colors.text.secondary }}>
                ...
              </span>
            ) : (
              <Button
                variant={current === page ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="ghost"
          size="sm"
          disabled={current === totalPages}
          onClick={() => onPageChange(current + 1)}
        >
          次へ
        </Button>
      </div>
    </div>
  );
};

/**
 * テーブルコンポーネント
 */
export const Table = <T extends Record<string, any>>({
  dataSource,
  columns,
  loading = false,
  pagination,
  selection,
  searchable = false,
  searchPlaceholder = '検索...',
  onRowClick,
  emptyText = 'データがありません',
  size = 'middle',
  className = '',
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(pagination ? pagination.current : 1);
  const [pageSize, setPageSize] = useState(pagination ? pagination.pageSize : 10);

  // サイズ別のクラス
  const sizeClasses = {
    small: 'text-xs',
    middle: 'text-sm',
    large: 'text-base',
  };

  const cellPadding = {
    small: 'px-4 py-2',
    middle: 'px-6 py-4',
    large: 'px-8 py-6',
  };

  // データのフィルタリングとソート
  const processedData = useMemo(() => {
    let filtered = dataSource;

    // 検索フィルタリング
    if (searchable && searchText) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    // ソート
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [dataSource, searchText, sortConfig, searchable]);

  // ページネーション適用
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize, pagination]);

  // ソート処理
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const key = column.dataIndex as string || column.key;
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // ソートクリア
        }
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  // 選択処理
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;

    if (checked) {
      const allKeys = paginatedData.map(record => selection.getRowKey(record));
      selection.onChange(allKeys, paginatedData);
    } else {
      selection.onChange([], []);
    }
  };

  const handleSelectRow = (record: T, checked: boolean) => {
    if (!selection) return;

    const rowKey = selection.getRowKey(record);
    let newSelectedKeys = [...selection.selectedRowKeys];

    if (selection.type === 'radio') {
      newSelectedKeys = checked ? [rowKey] : [];
    } else {
      if (checked) {
        newSelectedKeys.push(rowKey);
      } else {
        newSelectedKeys = newSelectedKeys.filter(key => key !== rowKey);
      }
    }

    const selectedRows = dataSource.filter(row =>
      newSelectedKeys.includes(selection.getRowKey(row))
    );
    selection.onChange(newSelectedKeys, selectedRows);
  };

  // 列数計算（選択列含む）
  const totalColumns = columns.length + (selection ? 1 : 0);

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* 検索バー */}
      {searchable && (
        <div className="p-4 border-b" style={{ borderColor: colors.border.light }}>
          <Input
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-sm"
          />
        </div>
      )}

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${sizeClasses[size]}`} style={{ borderColor: colors.border.light }}>
          {/* ヘッダー */}
          <thead style={{ backgroundColor: colors.background.secondary }}>
            <tr>
              {/* 選択列 */}
              {selection && (
                <th className={`${cellPadding[size]} text-left font-medium`} style={{ color: colors.text.primary }}>
                  {selection.type === 'checkbox' && (
                    <input
                      type="checkbox"
                      checked={selection.selectedRowKeys.length === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                      style={{ accentColor: colors.primary[500] }}
                    />
                  )}
                </th>
              )}

              {/* データ列 */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${cellPadding[size]} text-left font-medium ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  style={{ 
                    color: colors.text.primary,
                    width: column.width,
                    textAlign: column.align || 'left'
                  }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`w-3 h-3 ${
                            sortConfig?.key === (column.dataIndex || column.key) && sortConfig.direction === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDown 
                          className={`w-3 h-3 ${
                            sortConfig?.key === (column.dataIndex || column.key) && sortConfig.direction === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ボディ */}
          {loading ? (
            <TableSkeleton columns={totalColumns} rows={5} />
          ) : paginatedData.length === 0 ? (
            <EmptyState message={emptyText} colSpan={totalColumns} />
          ) : (
            <tbody className="divide-y" style={{ borderColor: colors.border.light }}>
              {paginatedData.map((record, index) => {
                const rowKey = selection ? selection.getRowKey(record) : index;
                const isSelected = selection ? selection.selectedRowKeys.includes(rowKey.toString()) : false;

                return (
                  <tr
                    key={rowKey}
                    className={`
                      hover:bg-gray-50 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-blue-50' : ''}
                    `}
                    onClick={() => onRowClick?.(record, index)}
                  >
                    {/* 選択列 */}
                    {selection && (
                      <td className={cellPadding[size]}>
                        <input
                          type={selection.type}
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(record, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                          style={{ accentColor: colors.primary[500] }}
                        />
                      </td>
                    )}

                    {/* データ列 */}
                    {columns.map((column) => {
                      const value = column.dataIndex ? record[column.dataIndex] : null;
                      const content = column.render 
                        ? column.render(value, record, index)
                        : value;

                      return (
                        <td
                          key={column.key}
                          className={cellPadding[size]}
                          style={{ textAlign: column.align || 'left' }}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* ページネーション */}
      {pagination && !loading && (
        <Pagination
          config={{
            ...pagination,
            current: currentPage,
            pageSize,
            total: processedData.length,
          }}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

export default Table;