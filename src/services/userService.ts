import { supabase } from '../lib/supabase'
import { Database } from '../types/supabase'
import { LineUser } from '../types/auth'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export class UserService {
  static async setUserContext(lineUserId: string) {
    try {
      const { data, error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_line_id',
        new_value: lineUserId,
        is_local: true
      });
      
      if (error) {
        console.error('set_config エラー:', error);
        throw error;
      }
      
      console.log('✅ User context set:', lineUserId);
      return data;
    } catch (error) {
      console.error('❌ setUserContext エラー:', error);
      throw error;
    }
  }

  static async findOrCreateUser(lineUser: LineUser): Promise<User> {
    await this.setUserContext(lineUser.userId)

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', lineUser.userId)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`ユーザー検索エラー: ${findError.message}`)
    }

    if (existingUser) {
      const updateData: UserUpdate = {
        display_name: lineUser.displayName,
        picture_url: lineUser.pictureUrl,
        email: lineUser.email,
        updated_at: new Date().toISOString()
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', existingUser.id)
        .select('*')
        .single()

      if (updateError) {
        throw new Error(`ユーザー更新エラー: ${updateError.message}`)
      }

      return updatedUser
    } else {
      const insertData: UserInsert = {
        line_user_id: lineUser.userId,
        display_name: lineUser.displayName,
        picture_url: lineUser.pictureUrl,
        email: lineUser.email
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(insertData)
        .select('*')
        .single()

      if (insertError) {
        throw new Error(`ユーザー作成エラー: ${insertError.message}`)
      }

      return newUser
    }
  }

  static async getUserByLineId(lineUserId: string): Promise<User | null> {
    await this.setUserContext(lineUserId)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', lineUserId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`ユーザー取得エラー: ${error.message}`)
    }

    return data
  }
}