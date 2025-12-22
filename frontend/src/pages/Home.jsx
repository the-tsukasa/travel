import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Map from '../features/map/Map'
import SpotCard from '../components/common/SpotCard'
import NoteCard from '../components/notes/NoteCard'
import WeatherWidget from '../components/common/WeatherWidget'
import TravelPackage from '../components/travel/TravelPackage'
import api from '../services/api'

const Home = () => {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [hotspots, setHotspots] = useState([])
  const [featuredSpots, setFeaturedSpots] = useState([])
  const [featuredNotes, setFeaturedNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(true)

  useEffect(() => {
    loadSpots()
    loadFeaturedNotes()
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
      
      // 获取前4个热门景点（按点赞+收藏数排序）
      const sortedSpots = [...spotsData].sort((a, b) => {
        const aScore = (a.likes || 0) + (a.favorites || 0)
        const bScore = (b.likes || 0) + (b.favorites || 0)
        return bScore - aScore
      })
      setFeaturedSpots(sortedSpots.slice(0, 4))
    } catch (err) {
      console.error('スポット読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFeaturedNotes = async () => {
    try {
      setNotesLoading(true)
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/notes?page=0&size=4', { headers })
      
      if (!response.ok) {
        if (response.status === 401 && token) {
          localStorage.removeItem('token')
          const retryResponse = await fetch('/api/notes?page=0&size=4')
          if (!retryResponse.ok) throw new Error('Failed to load notes')
          const retryData = await retryResponse.json()
          const notesData = retryData.content || retryData
          const notesArray = Array.isArray(notesData) ? notesData : []
          
          // 按点赞+收藏数排序，取前4个
          const sortedNotes = [...notesArray].sort((a, b) => {
            const aScore = (a.likesCount || 0) + (a.favoritesCount || 0)
            const bScore = (b.likesCount || 0) + (b.favoritesCount || 0)
            return bScore - aScore
          })
          setFeaturedNotes(sortedNotes.slice(0, 4))
          setNotesLoading(false)
          return
        }
        throw new Error('Failed to load notes')
      }

      const data = await response.json()
      const notesData = data.content || data
      const notesArray = Array.isArray(notesData) ? notesData : []
      
      // 按点赞+收藏数排序，取前4个
      const sortedNotes = [...notesArray].sort((a, b) => {
        const aScore = (a.likesCount || 0) + (a.favoritesCount || 0)
        const bScore = (b.likesCount || 0) + (b.favoritesCount || 0)
        return bScore - aScore
      })
      setFeaturedNotes(sortedNotes.slice(0, 4))
    } catch (err) {
      console.error('ノート読み込みエラー:', err)
    } finally {
      setNotesLoading(false)
    }
  }

  const handleHotspotClick = (spotId) => {
    // 导航到景点详情页
    window.location.href = `/spot-detail?id=${spotId}`
  }

  return (
    <>
      <div className="home-page">
        {/* Header with Title and Weather */}
        <div className="home-header-bar">
          <h1 className="home-page-title">
            <span className="home-title-icon">🏠</span>
            TravelGo
          </h1>
          
          {/* Weather Widget */}
          <WeatherWidget />
        </div>

        {/* 楽々旅 Travel Package Component */}
        <TravelPackage />

        {/* Featured Sections with Cards */}
        <div className="home-featured-section">
          {/* 热门景点 Section */}
          <div className="home-nav-section">
            <div className="home-section-header">
              <h2 className="home-section-title">
                <span className="home-section-icon">📍</span>
                热门景点
              </h2>
              <Link to="/spot" className="home-section-more">
                查看更多
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
            
            {/* 景点卡片 */}
            <div className="home-cards-grid">
              {loading ? (
                <div className="home-cards-loading">読み込み中...</div>
              ) : featuredSpots.length > 0 ? (
                featuredSpots.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} onUpdate={loadSpots} />
                ))
              ) : (
                <div className="home-cards-empty">スポットがありません</div>
              )}
            </div>
          </div>

          {/* 热门笔记 Section */}
          <div className="home-nav-section">
            <div className="home-section-header">
              <h2 className="home-section-title">
                <span className="home-section-icon">📖</span>
                热门笔记
              </h2>
              <Link to="/notes" className="home-section-more">
                查看更多
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
            
            {/* 笔记卡片 */}
            <div className="home-cards-grid">
              {notesLoading ? (
                <div className="home-cards-loading">読み込み中...</div>
              ) : featuredNotes.length > 0 ? (
                featuredNotes.map((note, index) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onUpdate={loadFeaturedNotes}
                    priority={index < 6} // 前6个卡片（首屏）优先加载图片
                  />
                ))
              ) : (
                <div className="home-cards-empty">ノートがありません</div>
              )}
            </div>
          </div>
        </div>

        <div className="home-map-section">
          <div className="home-map-header">
            <h1 className="home-map-title">地図で人気スポットを確認</h1>
            <p className="home-map-subtitle">地図上のスポットをクリックして詳細を見る</p>
          </div>
          <Map spots={hotspots} onHotspotClick={handleHotspotClick} loading={loading} />
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Home
