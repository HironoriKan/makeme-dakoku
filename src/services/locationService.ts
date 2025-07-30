export interface LocationData {
  latitude: number
  longitude: number
  locationName?: string
}

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('位置情報がサポートされていません'))
        return
      }

      console.log('📍 位置情報取得開始');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          console.log('✅ 位置情報取得成功:', { latitude, longitude });

          try {
            const locationName = await this.getLocationName(latitude, longitude)
            resolve({
              latitude,
              longitude,
              locationName
            })
          } catch (error) {
            console.warn('⚠️ 住所取得失敗、位置情報のみ使用:', error);
            resolve({
              latitude,
              longitude
            })
          }
        },
        (error) => {
          console.error('❌ 位置情報取得エラー:', error);
          let message = '位置情報の取得に失敗しました'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = '位置情報の使用が拒否されました'
              break
            case error.POSITION_UNAVAILABLE:
              message = '位置情報が利用できません'
              break
            case error.TIMEOUT:
              message = '位置情報の取得がタイムアウトしました'
              break
          }
          
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  private static async getLocationName(latitude: number, longitude: number): Promise<string> {
    // Google Geocoding APIまたは他のリバースジオコーディングサービスを使用
    // 今回は簡易版として座標のみ返す
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  }

  static formatLocation(location: LocationData): string {
    if (location.locationName) {
      return location.locationName
    }
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
  }
}