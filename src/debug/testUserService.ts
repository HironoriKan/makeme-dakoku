import { UserService } from '../services/userService'
import { LineUser } from '../types/auth'

// テスト用のLINEユーザーデータ
const testUser: LineUser = {
  userId: 'test_user_123',
  displayName: 'テストユーザー',
  pictureUrl: 'https://example.com/picture.jpg',
  email: 'test@example.com'
}

export async function testUserServiceInsert() {
  try {
    console.log('🧪 UserService テスト開始')
    
    // ユーザー作成/更新をテスト
    const result = await UserService.findOrCreateUser(testUser)
    console.log('✅ ユーザー作成/更新成功:', result)
    
    // ユーザー取得をテスト
    const foundUser = await UserService.getUserByLineId(testUser.userId)
    console.log('✅ ユーザー取得成功:', foundUser)
    
    return result
  } catch (error) {
    console.error('❌ UserService テストエラー:', error)
    throw error
  }
}