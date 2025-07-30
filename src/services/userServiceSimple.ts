import { supabase } from '../lib/supabase'
import { Database } from '../types/supabase'
import { LineUser } from '../types/auth'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export class UserServiceSimple {
  static async findOrCreateUser(lineUser: LineUser): Promise<User> {
    console.log('🔍 ユーザー検索開始:', lineUser.userId);
    
    // 既存ユーザーを検索（RLS無効化済みなのでシンプルに）
    let { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', lineUser.userId)
      .single()

    console.log('🔍 検索結果:', { existingUser, findError });

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ ユーザー検索エラー:', findError);
      throw new Error(`ユーザー検索エラー: ${findError.message}`)
    }

    if (existingUser) {
      console.log('🔄 既存ユーザーを更新');
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
        console.error('❌ ユーザー更新エラー:', updateError);
        throw new Error(`ユーザー更新エラー: ${updateError.message}`)
      }

      console.log('✅ ユーザー更新成功:', updatedUser);
      return updatedUser
    } else {
      console.log('➕ 新規ユーザーを作成');
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
        console.error('❌ ユーザー作成エラー:', insertError);
        throw new Error(`ユーザー作成エラー: ${insertError.message}`)
      }

      console.log('✅ ユーザー作成成功:', newUser);
      return newUser
    }
  }
}