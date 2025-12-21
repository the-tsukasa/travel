import { useState, useEffect } from 'react'
import '../../styles/components/common/weather-widget.css'

const WeatherWidget = () => {
  // 初始显示默认数据，避免加载时的空白
  const [weather, setWeather] = useState({
    condition: 'Clouds',
    description: '曇り',
    tempMax: 12,
    tempMin: 6,
    temp: 9
  })
  const [location, setLocation] = useState('渋谷区')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 获取天气图标 SVG
  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || ''
    
    if (conditionLower.includes('rain') || conditionLower.includes('雨')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          <path d="M12 12l-3 6h6l-3-6z"></path>
        </svg>
      )
    } else if (conditionLower.includes('snow') || conditionLower.includes('雪')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      )
    } else if (conditionLower.includes('cloud') || conditionLower.includes('曇')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
        </svg>
      )
    } else if (conditionLower.includes('clear') || conditionLower.includes('sun') || conditionLower.includes('晴')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )
    } else if (conditionLower.includes('storm') || conditionLower.includes('雷')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
          <polyline points="13 11 9 17 15 17 11 23"></polyline>
        </svg>
      )
    } else if (conditionLower.includes('fog') || conditionLower.includes('霧')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="4" y1="16" x2="20" y2="16"></line>
        </svg>
      )
    }
    // 默认：多云
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
      </svg>
    )
  }

  // 获取白天/夜晚图标 SVG
  const getDayNightIcon = (isDay) => {
    if (isDay) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="12" y1="2" x2="12" y2="4"></line>
          <line x1="12" y1="20" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="4" y2="12"></line>
          <line x1="20" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line>
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line>
        </svg>
      )
    } else {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )
    }
  }

  // 判断是否为白天
  const isDayTime = () => {
    const hour = new Date().getHours()
    return hour >= 6 && hour < 18
  }

  useEffect(() => {
    const fetchWeather = async () => {
      // 不设置 loading，直接开始加载，使用默认数据作为占位
      
      try {
        // 获取用户位置（设置较短的超时时间）
        let latitude, longitude
        
        if (navigator.geolocation) {
          try {
            const position = await Promise.race([
              new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 5000, // 减少超时时间到 5 秒
                  enableHighAccuracy: false,
                  maximumAge: 300000 // 使用 5 分钟内的缓存位置
                })
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('位置取得タイムアウト')), 5000)
              )
            ])
            
            latitude = position.coords.latitude
            longitude = position.coords.longitude
          } catch (geoError) {
            console.warn('位置情報取得エラー:', geoError)
            // 如果获取位置失败，使用东京的默认坐标
            latitude = 35.6762
            longitude = 139.6503
          }
        } else {
          // 如果没有地理位置支持，使用东京的默认坐标
          latitude = 35.6762
          longitude = 139.6503
        }

        // 并行请求位置名称和天气数据，提高加载速度
        const [geoResponse, weatherResponse] = await Promise.allSettled([
          // 反向地理编码获取地址（设置超时）
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ja`,
            { 
              signal: AbortSignal.timeout(3000) // 3 秒超时
            }
          ).then(res => res.json()),
          // 使用 Open-Meteo API（免费，无需 API key）
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Tokyo`,
            { 
              signal: AbortSignal.timeout(5000) // 5 秒超时
            }
          ).then(res => {
            if (!res.ok) throw new Error('天気データの取得に失敗しました')
            return res.json()
          })
        ])

        // 处理位置信息
        if (geoResponse.status === 'fulfilled') {
          try {
            const geoData = geoResponse.value
            const address = geoData.address
            let locationName = ''
            
            // 获取城市/地区信息
            if (address.city || address.town || address.village) {
              locationName = address.city || address.town || address.village
            } else if (address.state || address.prefecture) {
              locationName = address.state || address.prefecture
            } else if (address.county) {
              locationName = address.county
            } else {
              locationName = '現在地'
            }
            
            if (locationName) {
              setLocation(locationName)
            }
          } catch (geoError) {
            console.warn('位置名取得エラー:', geoError)
          }
        }

        // 处理天气数据
        if (weatherResponse.status === 'fulfilled') {
          try {
            const weatherData = weatherResponse.value
            
            // 获取当前天气代码对应的描述
            const weatherCode = weatherData.current?.weather_code || weatherData.daily?.weather_code?.[0] || 0
            const weatherDescriptions = {
              0: 'Clear', 1: 'Clear', 2: 'Clouds', 3: 'Clouds',
              45: 'Fog', 48: 'Fog',
              51: 'Rain', 53: 'Rain', 55: 'Rain',
              56: 'Rain', 57: 'Rain',
              61: 'Rain', 63: 'Rain', 65: 'Rain',
              66: 'Rain', 67: 'Rain',
              71: 'Snow', 73: 'Snow', 75: 'Snow',
              77: 'Snow',
              80: 'Rain', 81: 'Rain', 82: 'Rain',
              85: 'Snow', 86: 'Snow',
              95: 'Storm', 96: 'Storm', 99: 'Storm'
            }
            
            const condition = weatherDescriptions[weatherCode] || 'Clear'
            
            setWeather({
              condition: condition,
              description: '',
              tempMax: Math.round(weatherData.daily?.temperature_2m_max?.[0] || weatherData.current?.temperature_2m || 0),
              tempMin: Math.round(weatherData.daily?.temperature_2m_min?.[0] || weatherData.current?.temperature_2m || 0),
              temp: Math.round(weatherData.current?.temperature_2m || 0)
            })
          } catch (weatherError) {
            console.warn('天気データ処理エラー:', weatherError)
          }
        } else {
          console.warn('天気データ取得エラー:', weatherResponse.reason)
        }

      } catch (err) {
        console.error('天気取得エラー:', err)
        // 如果所有请求都失败，保持默认数据不变
      }
    }

    // 延迟一小段时间再加载，让页面先渲染默认数据
    const timer = setTimeout(() => {
      fetchWeather()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 不再显示加载状态，直接显示数据（默认或已加载的）

  const isDay = isDayTime()
  const weatherIcon = getWeatherIcon(weather?.condition)
  const dayNightIcon = getDayNightIcon(isDay)

  return (
    <div className="weather-widget">
      <div className="weather-widget-content">
        <span className="weather-location">
          <svg className="weather-location-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {location || '現在地'}
        </span>
        <span className="weather-icon">{weatherIcon}</span>
        <span className="weather-temps">
          <span className="weather-temp-max">{weather?.tempMax || '--'}°</span>
          <span className="weather-temp-separator">/</span>
          <span className="weather-temp-min">{weather?.tempMin || '--'}°</span>
        </span>
        <span className="weather-daynight">{dayNightIcon}</span>
      </div>
    </div>
  )
}

export default WeatherWidget

