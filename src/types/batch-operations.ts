/**
 * Phase 2: 一括操作機能の型定義
 */

import { Database } from './supabase';

// 基本テーブル型
export type ShiftTemplate = Database['public']['Tables']['shift_templates']['Row'];
export type ShiftTemplateInsert = Database['public']['Tables']['shift_templates']['Insert'];
export type ShiftTemplateUpdate = Database['public']['Tables']['shift_templates']['Update'];

export type AdminAccount = Database['public']['Tables']['admin_accounts']['Row'];
export type AdminAccountInsert = Database['public']['Tables']['admin_accounts']['Insert'];
export type AdminAccountUpdate = Database['public']['Tables']['admin_accounts']['Update'];

export type ClientLocationAccess = Database['public']['Tables']['client_location_access']['Row'];
export type ClientLocationAccessInsert = Database['public']['Tables']['client_location_access']['Insert'];
export type ClientLocationAccessUpdate = Database['public']['Tables']['client_location_access']['Update'];

export type BatchOperation = Database['public']['Tables']['batch_operations']['Row'];
export type BatchOperationInsert = Database['public']['Tables']['batch_operations']['Insert'];
export type BatchOperationUpdate = Database['public']['Tables']['batch_operations']['Update'];

// Enum型
export type AccountType = Database['public']['Enums']['account_type'];
export type ShiftType = Database['public']['Enums']['shift_type'];
export type ShiftStatus = Database['public']['Enums']['shift_status'];

/**
 * シフトテンプレート関連
 */
export interface ShiftTemplateWithLocation extends ShiftTemplate {
  location?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateShiftTemplateRequest {
  name: string;
  description?: string;
  location_id: string;
  shift_type: ShiftType;
  start_time?: string;
  end_time?: string;
  break_duration?: number;
  break_start_time?: string;
  applicable_days?: number[];
}

export interface ApplyTemplateRequest {
  template_id: string;
  target_user_ids: string[];
  target_dates: string[];
  override_existing?: boolean;
}

export interface ApplyTemplateResponse {
  success_count: number;
  error_count: number;
  created_shifts: string[];
  errors: Array<{
    user_id: string;
    date: string;
    error: string;
  }>;
}

/**
 * バッチ承認関連
 */
export interface BatchApprovalRequest {
  shift_ids: string[];
  approver_notes?: string;
}

export interface BatchApprovalResponse {
  success_count: number;
  error_count: number;
  errors: Array<{
    shift_id: string;
    error: string;
  }>;
}

export interface BatchApprovalTarget {
  shift_id: string;
  user_name: string;
  shift_date: string;
  shift_type: ShiftType;
  start_time?: string;
  end_time?: string;
  current_status: ShiftStatus;
}

/**
 * クライアントアカウント関連
 */
export interface ClientAccountWithAccess extends AdminAccount {
  accessible_locations?: Array<{
    location_id: string;
    location_name: string;
    location_code: string;
    access_level: string;
    can_approve_shifts: boolean;
    can_view_reports: boolean;
    can_manage_users: boolean;
  }>;
}

export interface CreateClientAccountRequest {
  email: string;
  name: string;
  password: string;
  location_ids: string[];
  permissions?: {
    shifts: {
      read: boolean;
      write: boolean;
      approve: boolean;
    };
    users: {
      read: boolean;
      write: boolean;
    };
    reports: {
      read: boolean;
      export: boolean;
    };
    settings: {
      read: boolean;
      write: boolean;
    };
  };
}

export interface ClientLocationAccessRequest {
  client_id: string;
  location_id: string;
  access_level: 'read_only' | 'read_write' | 'full_access';
  can_approve_shifts?: boolean;
  can_view_reports?: boolean;
  can_manage_users?: boolean;
  access_start_date?: string;
  access_end_date?: string;
}

/**
 * 一括操作関連
 */
export type BatchOperationType = 
  | 'shift_approve' 
  | 'shift_template_apply' 
  | 'shift_delete' 
  | 'user_location_assign';

export interface BatchOperationStatus {
  id: string;
  operation_type: BatchOperationType;
  target_count: number;
  success_count: number;
  error_count: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  executed_at: string;
  completed_at?: string;
  executed_by: string;
  error_details?: any;
}

/**
 * UI用の複合型
 */
export interface ShiftTemplateFormData {
  name: string;
  description: string;
  location_id: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  break_duration: number;
  break_start_time: string;
  applicable_days: number[];
  is_active: boolean;
}

export interface BatchApprovalUIData {
  user_id: string;
  user_name: string;
  shifts: Array<{
    id: string;
    date: string;
    shift_type: ShiftType;
    start_time?: string;
    end_time?: string;
    status: ShiftStatus;
    selected: boolean;
  }>;
  total_pending: number;
  selected_count: number;
}

/**
 * API Response型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * フィルター・検索関連
 */
export interface ShiftTemplateFilters {
  location_id?: string;
  shift_type?: ShiftType;
  is_active?: boolean;
  search?: string;
}

export interface BatchApprovalFilters {
  location_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  shift_type?: ShiftType;
  status?: ShiftStatus;
}

export interface ClientAccountFilters {
  account_type?: AccountType;
  is_active?: boolean;
  location_id?: string;
  search?: string;
}

/**
 * ユーティリティ型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;