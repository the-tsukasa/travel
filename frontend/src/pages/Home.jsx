import { useState, useEffect } from 'react'
import Footer from '../components/layout/Footer'
import Map from '../features/map/Map'
import api from '../services/api'

const Home = () => {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [hotspots, setHotspots] = useState([])

  useEffect(() => {
    loadSpots()
  }, [])

  const loadSpots = async () => {
    try {
      setLoading(true)
      const response = await api.get('/spots')
      const spotsData = response.data || []
      setSpots(spotsData)
      
      // 将 spots 转换为 hotspots 格式
      // Map 组件会处理位置到坐标的映射
      setHotspots(spotsData)
    } catch (err) {
      console.error('スポット読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleHotspotClick = (spotId) => {
    // 导航到景点详情页
    window.location.href = `/spot-detail.html?id=${spotId}`
  }

  return (
    <>
      <div className="home-map-section">
        <div className="home-map-header">
          <h1 className="home-map-title">日本 エリアマップ</h1>
          <p className="home-map-subtitle">地図上のスポットをクリックして詳細を見る</p>
        </div>
        <Map spots={hotspots} onHotspotClick={handleHotspotClick} loading={loading} />
      </div>
      <Footer />
    </>
  )
}

export default Home
