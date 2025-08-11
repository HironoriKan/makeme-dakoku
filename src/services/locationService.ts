import { supabase } from '../lib/supabase';
import { LineUser } from '../types/auth';

export interface Location {
  id: string;
  name: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export class LocationService {
  static async setUserContext(lineUserId: string) {
    // RLS無効化中はset_configをスキップ
    console.log('✅ User context (RLS無効化中のためスキップ):', lineUserId);
    return true;
  }

  /**
   * 全ての拠点一覧を取得（管理者用）
   */
  static async getAllLocations(): Promise<Location[]> {
    console.log('📍 全拠点一覧を取得（管理者用）');

    try {
      const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ 全拠点一覧取得エラー:', error);
        throw new Error(`全拠点一覧取得エラー: ${error.message}`);
      }

      console.log('✅ 全拠点一覧取得成功:', locations?.length, '件');
      return locations || [];
    } catch (error) {
      console.error('❌ 全拠点一覧取得処理エラー:', error);
      throw error;
    }
  }

  /**
   * 新しい拠点を作成
   */
  static async createLocation(locationData: {
    name: string;
    code: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    is_active?: boolean;
    display_order?: number;
  }): Promise<Location> {
    console.log('📍 新規拠点作成:', locationData.name);

    try {
      // 最大表示順序を取得
      const { data: maxOrderData } = await supabase
        .from('locations')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const nextDisplayOrder = (maxOrderData?.display_order || 0) + 1;

      const { data: location, error } = await supabase
        .from('locations')
        .insert([{
          ...locationData,
          is_active: locationData.is_active ?? true,
          display_order: locationData.display_order ?? nextDisplayOrder,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ 拠点作成エラー:', error);
        throw new Error(`拠点作成エラー: ${error.message}`);
      }

      console.log('✅ 拠点作成成功:', location.name);
      return location;
    } catch (error) {
      console.error('❌ 拠点作成処理エラー:', error);
      throw error;
    }
  }

  /**
   * 拠点情報を更新
   */
  static async updateLocation(
    locationId: string,
    updateData: Partial<{
      name: string;
      code: string;
      address: string;
      latitude: number;
      longitude: number;
      is_active: boolean;
      display_order: number;
    }>
  ): Promise<Location> {
    console.log('📍 拠点更新:', locationId);

    try {
      const { data: location, error } = await supabase
        .from('locations')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)
        .select()
        .single();

      if (error) {
        console.error('❌ 拠点更新エラー:', error);
        throw new Error(`拠点更新エラー: ${error.message}`);
      }

      console.log('✅ 拠点更新成功:', location.name);
      return location;
    } catch (error) {
      console.error('❌ 拠点更新処理エラー:', error);
      throw error;
    }
  }

  /**
   * 拠点を削除（論理削除）
   */
  static async deleteLocation(locationId: string): Promise<void> {
    console.log('📍 拠点削除:', locationId);

    try {
      const { error } = await supabase
        .from('locations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId);

      if (error) {
        console.error('❌ 拠点削除エラー:', error);
        throw new Error(`拠点削除エラー: ${error.message}`);
      }

      console.log('✅ 拠点削除成功');
    } catch (error) {
      console.error('❌ 拠点削除処理エラー:', error);
      throw error;
    }
  }

  /**
   * 拠点コードの重複チェック
   */
  static async checkCodeDuplicate(code: string, excludeId?: string): Promise<boolean> {
    console.log('📍 拠点コード重複チェック:', code);

    try {
      let query = supabase
        .from('locations')
        .select('id')
        .eq('code', code);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ 拠点コード重複チェックエラー:', error);
        throw new Error(`拠点コード重複チェックエラー: ${error.message}`);
      }

      const isDuplicate = (data || []).length > 0;
      console.log('✅ 拠点コード重複チェック完了:', isDuplicate ? '重複あり' : '重複なし');
      return isDuplicate;
    } catch (error) {
      console.error('❌ 拠点コード重複チェック処理エラー:', error);
      throw error;
    }
  }

  /**
   * 有効な拠点一覧を取得（表示順序でソート）
   */
  static async getActiveLocations(): Promise<Location[]> {
    console.log('📍 有効な拠点一覧を取得');

    try {
      const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ 拠点一覧取得エラー:', error);
        throw new Error(`拠点一覧取得エラー: ${error.message}`);
      }

      console.log('✅ 拠点一覧取得成功:', locations?.length, '件');
      return locations || [];
    } catch (error) {
      console.error('❌ 拠点一覧取得処理エラー:', error);
      throw error;
    }
  }

  /**
   * 拠点IDから拠点情報を取得
   */
  static async getLocationById(locationId: string): Promise<Location | null> {
    console.log('📍 拠点情報取得:', locationId);

    try {
      const { data: location, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) {
        console.error('❌ 拠点情報取得エラー:', error);
        return null;
      }

      console.log('✅ 拠点情報取得成功:', location?.name);
      return location;
    } catch (error) {
      console.error('❌ 拠点情報取得処理エラー:', error);
      return null;
    }
  }

  /**
   * 拠点コードから拠点情報を取得
   */
  static async getLocationByCode(code: string): Promise<Location | null> {
    console.log('📍 拠点情報取得（コード）:', code);

    try {
      const { data: location, error } = await supabase
        .from('locations')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ 拠点情報取得エラー（コード）:', error);
        return null;
      }

      console.log('✅ 拠点情報取得成功（コード）:', location?.name);
      return location;
    } catch (error) {
      console.error('❌ 拠点情報取得処理エラー（コード）:', error);
      return null;
    }
  }

  /**
   * デフォルト拠点を取得（表示順序が最小のもの）
   */
  static async getDefaultLocation(): Promise<Location | null> {
    console.log('📍 デフォルト拠点取得');

    try {
      const { data: location, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error('❌ デフォルト拠点取得エラー:', error);
        return null;
      }

      console.log('✅ デフォルト拠点取得成功:', location?.name);
      return location;
    } catch (error) {
      console.error('❌ デフォルト拠点取得処理エラー:', error);
      return null;
    }
  }

  /**
   * 拠点使用統計を取得（管理者用）
   */
  static async getLocationUsageStats(
    lineUser: LineUser,
    startDate?: string,
    endDate?: string
  ): Promise<{
    location_id: string;
    location_name: string;
    usage_count: number;
    last_used: string;
  }[]> {
    console.log('📊 拠点使用統計取得:', { startDate, endDate });

    await this.setUserContext(lineUser.userId);

    try {
      let query = supabase
        .from('time_records')
        .select(`
          location_id,
          locations!inner(name),
          count()
        `)
        .not('location_id', 'is', null);

      if (startDate) {
        query = query.gte('recorded_at', startDate);
      }
      if (endDate) {
        query = query.lte('recorded_at', endDate);
      }

      const { data: stats, error } = await query;

      if (error) {
        console.error('❌ 拠点使用統計取得エラー:', error);
        throw new Error(`拠点使用統計取得エラー: ${error.message}`);
      }

      console.log('✅ 拠点使用統計取得成功:', stats?.length, '件');
      return stats || [];
    } catch (error) {
      console.error('❌ 拠点使用統計取得処理エラー:', error);
      throw error;
    }
  }
}