/**
 * 位置到地图坐标的映射
 * 坐标使用经纬度 (latitude, longitude)
 * 用于 Leaflet 地图
 */
export const locationCoordinates = {
  // 主要城市 - 真实经纬度坐标
  '東京': { lat: 35.6762, lng: 139.6503 },
  '东京': { lat: 35.6762, lng: 139.6503 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  '横浜': { lat: 35.4437, lng: 139.6380 },
  '横滨': { lat: 35.4437, lng: 139.6380 },
  'Yokohama': { lat: 35.4437, lng: 139.6380 },
  '大阪': { lat: 34.6937, lng: 135.5023 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  '名古屋': { lat: 35.1815, lng: 136.9066 },
  'Nagoya': { lat: 35.1815, lng: 136.9066 },
  '京都': { lat: 35.0116, lng: 135.7681 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  '福岡': { lat: 33.5904, lng: 130.4017 },
  '福冈': { lat: 33.5904, lng: 130.4017 },
  'Fukuoka': { lat: 33.5904, lng: 130.4017 },
  '札幌': { lat: 43.0642, lng: 141.3469 },
  'Sapporo': { lat: 43.0642, lng: 141.3469 },
  '仙台': { lat: 38.2682, lng: 140.8694 },
  'Sendai': { lat: 38.2682, lng: 140.8694 },
  '神戸': { lat: 34.6901, lng: 135.1956 },
  '神户': { lat: 34.6901, lng: 135.1956 },
  'Kobe': { lat: 34.6901, lng: 135.1956 },
  '広島': { lat: 34.3853, lng: 132.4553 },
  '广岛': { lat: 34.3853, lng: 132.4553 },
  'Hiroshima': { lat: 34.3853, lng: 132.4553 },
  '新潟': { lat: 37.9161, lng: 139.0364 },
  'Niigata': { lat: 37.9161, lng: 139.0364 },
  '静岡': { lat: 34.9756, lng: 138.3827 },
  '静冈': { lat: 34.9756, lng: 138.3827 },
  'Shizuoka': { lat: 34.9756, lng: 138.3827 },
  '金沢': { lat: 36.5613, lng: 136.6562 },
  '金泽': { lat: 36.5613, lng: 136.6562 },
  'Kanazawa': { lat: 36.5613, lng: 136.6562 },
  '那覇': { lat: 26.2124, lng: 127.6809 },
  '那霸': { lat: 26.2124, lng: 127.6809 },
  'Naha': { lat: 26.2124, lng: 127.6809 },
}

/**
 * 根据位置字符串获取地图坐标（经纬度）
 * @param {string} location - 位置字符串（如"京都"、"京都、日本"等）
 * @returns {{lat: number, lng: number} | null} - 坐标对象或null
 */
export const getLocationCoordinates = (location) => {
  if (!location) return null

  // 清理位置字符串，去除逗号、空格等
  const cleanLocation = location.trim()
  
  // 尝试直接匹配
  if (locationCoordinates[cleanLocation]) {
    return locationCoordinates[cleanLocation]
  }

  // 尝试提取主要城市名（如果格式是"京都、日本"或"京都 日本"）
  const parts = cleanLocation.split(/[、，,\s]+/)
  for (const part of parts) {
    const trimmedPart = part.trim()
    if (trimmedPart && locationCoordinates[trimmedPart]) {
      return locationCoordinates[trimmedPart]
    }
  }

  // 尝试部分匹配（包含关系）- 优先匹配较长的键
  const sortedKeys = Object.keys(locationCoordinates).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (cleanLocation.includes(key) || key.includes(cleanLocation)) {
      return locationCoordinates[key]
    }
  }

  // 默认返回null，表示无法映射
  console.warn(`无法映射位置: "${location}"`)
  return null
}
