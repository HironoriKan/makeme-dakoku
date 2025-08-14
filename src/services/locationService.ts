import { supabase } from '../lib/supabase';
import { LineUser } from '../types/auth';

// TimeRecordButtonで使用される位置情報インターフェース
export interface LocationData {
  latitude: number;
  longitude: number;
  locationName?: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  prefecture: string | null;
  brand_name: string | null;
  store_name: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  is_active: boolean;
  display_order: number;
  location_type: 'makeme' | 'permanent' | 'event' | null;
  start_date: string | null;
  end_date: string | null;
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
   * メイクミー拠点を識別する
   */
  private static identifyMakemeLocation(location: any): boolean {
    // 拠点名、ブランド名、店舗名にメイクミーが含まれている場合
    const makemeKeywords = ['メイクミー', 'makeme', 'MAKEME'];
    const searchText = [
      location.name,
      location.brand_name,
      location.store_name,
      location.code
    ].filter(Boolean).join(' ').toLowerCase();
    
    return makemeKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  }

  /**
   * 拠点の配属ユーザー数を取得
   */
  static async getLocationUserCounts(): Promise<Record<string, number>> {
    console.log('📍 拠点別配属ユーザー数を取得');

    try {
      const { data: userCounts, error } = await supabase
        .from('user_locations')
        .select('location_id')
        .eq('is_active', true);

      if (error) {
        console.error('❌ 拠点別配属ユーザー数取得エラー:', error);
        throw new Error(`拠点別配属ユーザー数取得エラー: ${error.message}`);
      }

      // location_idごとにカウント
      const countMap: Record<string, number> = {};
      (userCounts || []).forEach(record => {
        const locationId = record.location_id;
        countMap[locationId] = (countMap[locationId] || 0) + 1;
      });

      console.log('✅ 拠点別配属ユーザー数取得成功');
      return countMap;
    } catch (error) {
      console.error('❌ 拠点別配属ユーザー数取得処理エラー:', error);
      throw error;
    }
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
      
      // データベースのenum制約に対応：メイクミー拠点を識別
      const processedLocations = (locations || []).map(location => ({
        ...location,
        location_type: this.identifyMakemeLocation(location) ? 'makeme' : location.location_type
      }));
      
      return processedLocations;
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
    prefecture?: string;
    brand_name?: string;
    store_name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    is_active?: boolean;
    display_order?: number;
    location_type?: 'makeme' | 'permanent' | 'event';
    start_date?: string;
    end_date?: string;
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

      // 空文字列の日付フィールドをnullに変換
      const processedData = { ...locationData };
      if (processedData.start_date === '') {
        processedData.start_date = undefined;
      }
      if (processedData.end_date === '') {
        processedData.end_date = undefined;
      }
      
      // データベースのenum制約に対応：makemeをpermanentにマッピング
      if (processedData.location_type === 'makeme') {
        processedData.location_type = 'permanent';
        // メイクミー拠点として識別できるようにブランド名を設定
        if (!processedData.brand_name || !processedData.brand_name.includes('メイクミー')) {
          processedData.brand_name = processedData.brand_name ? 
            `メイクミー ${processedData.brand_name}` : 'メイクミー';
        }
      }

      const { data: location, error } = await supabase
        .from('locations')
        .insert([{
          ...processedData,
          is_active: processedData.is_active ?? true,
          display_order: processedData.display_order ?? nextDisplayOrder,
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
      prefecture: string;
      brand_name: string;
      store_name: string;
      address: string;
      latitude: number;
      longitude: number;
      is_active: boolean;
      display_order: number;
      location_type: 'makeme' | 'permanent' | 'event';
      start_date: string;
      end_date: string;
    }>
  ): Promise<Location> {
    console.log('📍 拠点更新:', locationId);

    try {
      // 空文字列の日付フィールドをnullに変換
      const processedData = { ...updateData };
      if (processedData.start_date === '') {
        processedData.start_date = null;
      }
      if (processedData.end_date === '') {
        processedData.end_date = null;
      }
      
      // データベースのenum制約に対応：makemeをpermanentにマッピング
      if (processedData.location_type === 'makeme') {
        processedData.location_type = 'permanent';
        // メイクミー拠点として識別できるようにブランド名を設定
        if (!processedData.brand_name || !processedData.brand_name.includes('メイクミー')) {
          processedData.brand_name = processedData.brand_name ? 
            `メイクミー ${processedData.brand_name}` : 'メイクミー';
        }
      }

      const { data: location, error } = await supabase
        .from('locations')
        .update({
          ...processedData,
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
      
      // データベースのenum制約に対応：メイクミー拠点を識別
      const processedLocations = (locations || []).map(location => ({
        ...location,
        location_type: this.identifyMakemeLocation(location) ? 'makeme' : location.location_type
      }));
      
      return processedLocations;
    } catch (error) {
      console.error('❌ 拠点一覧取得処理エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザーに割り当てられた有効な拠点一覧を取得
   */
  static async getUserAssignedLocations(lineUserId: string): Promise<Location[]> {
    console.log('📍 ユーザー割り当て拠点一覧を取得:', lineUserId);

    try {
      // 1. LINEユーザーIDからデータベースのユーザーIDを取得
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

      if (userError || !userRecord) {
        console.error('❌ ユーザー情報取得エラー:', userError);
        // ユーザーが見つからない場合は全拠点を返す（フォールバック）
        console.warn('フォールバック: 全拠点を返します');
        return await this.getActiveLocations();
      }

      const dbUserId = userRecord.id;
      console.log('✅ データベースユーザーID取得成功:', dbUserId);

      // 2. ユーザーに割り当てられた拠点を取得
      const { data: locationAccess, error } = await supabase
        .from('user_location_access')
        .select(`
          location_id,
          locations!inner(*)
        `)
        .eq('user_id', dbUserId);

      if (error) {
        console.error('❌ ユーザー割り当て拠点取得エラー:', error);
        // エラーが発生した場合は全拠点を返す（フォールバック）
        console.warn('フォールバック: 全拠点を返します');
        return await this.getActiveLocations();
      }

      // 拠点データを抽出してLocation[]形式に変換
      const assignedLocations = (locationAccess || [])
        .map(access => access.locations)
        .filter((location): location is Location => 
          location !== null && 
          location.is_active === true
        )
        .sort((a, b) => a.display_order - b.display_order);

      console.log('✅ ユーザー割り当て拠点取得成功:', assignedLocations.length, '件');
      
      // データベースのenum制約に対応：メイクミー拠点を識別
      const processedLocations = assignedLocations.map(location => ({
        ...location,
        location_type: this.identifyMakemeLocation(location) ? 'makeme' : location.location_type
      }));
      
      // 拠点が割り当てられていない場合は全拠点を返す
      if (processedLocations.length === 0) {
        console.warn('ユーザーに拠点が割り当てられていません。全拠点を返します。');
        return await this.getActiveLocations();
      }
      
      return processedLocations;
    } catch (error) {
      console.error('❌ ユーザー割り当て拠点取得処理エラー:', error);
      // エラー時は全拠点を返す（フォールバック）
      console.warn('エラー発生のためフォールバック: 全拠点を返します');
      return await this.getActiveLocations();
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

  /**
   * 現在の位置情報を取得（TimeRecordButton用の互換性メソッド）
   * 将来的には拠点選択に置き換える予定
   */
  static async getCurrentLocation(): Promise<LocationData> {
    console.log('📍 位置情報取得開始');

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error('❌ Geolocation API not supported');
        reject(new Error('位置情報がサポートされていません'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationName: '現在地'
          };
          console.log('✅ 位置情報取得成功:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('❌ 位置情報取得エラー:', error);
          reject(new Error('位置情報の取得に失敗しました'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分間キャッシュ
        }
      );
    });
  }
}