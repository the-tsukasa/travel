import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import SpotCard from '../components/common/SpotCard'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import SearchAndSort from '../components/common/SearchAndSort'
import WeatherWidget from '../components/common/WeatherWidget'
import type { Spot } from '../types'

const Spot = () => {
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'latest'>('popular')
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState<string>('')
  const navigate = useNavigate()

  // 动态占位符轮换
  useEffect(() => {
    const keywords = [
      '富士山',
      '東京',
      '京都',
      '大阪',
      '沖縄',
      '北海道',
      '奈良',
      '鎌倉',
      '箱根',
      '日光'
    ]
    
    let currentIndex = 0
    
    // 立即设置第一个
    setDynamicPlaceholder(keywords[0])
    
    // 每3秒轮换一次
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % keywords.length
      setDynamicPlaceholder(keywords[currentIndex])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // 从 URL 参数获取搜索关键词
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q')
    if (query) {
      setSearchKeyword(query)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadSpots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const loadSpots = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await api.get<Spot[]>('/spots')
      const spotsData = response.data || []
      
      // 排序
      let sortedSpots = [...spotsData]
      if (sortBy === 'popular') {
        sortedSpots.sort((a, b) => (b.likes || 0) + (b.favorites || 0) - (a.likes || 0) - (a.favorites || 0))
      } else if (sortBy === 'name') {
        sortedSpots.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      } else if (sortBy === 'latest') {
        sortedSpots.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })
      }
      
      setSpots(sortedSpots)
    } catch (err) {
      console.error('スポット読み込みエラー:', err)
      setError('スポットの読み込みに失敗しました。時間をおいて再試行してください。')
      setSpots([])
    } finally {
      setLoading(false)
    }
  }, [sortBy])

  // 当排序改变时重新加载
  useEffect(() => {
    if (!loading) {
      loadSpots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy])

  const handleSearchChange = useCallback((value: string) => {
    setSearchKeyword(value)
  }, [])

  // 处理搜索提交（当搜索框为空时，使用当前占位符关键词）
  const handleSearchSubmit = useCallback((keyword: string) => {
    if (keyword && keyword.trim()) {
      // 使用从占位符提取的关键词进行搜索
      setSearchKeyword(keyword.trim())
      // 由于是实时过滤，设置关键词后会自动过滤
    }
  }, [])

  // 过滤景点
  const filteredSpots = spots.filter(spot => {
    if (!searchKeyword.trim()) return true
    
    const keyword = searchKeyword.toLowerCase()
    return (
      spot.name?.toLowerCase().includes(keyword) ||
      spot.description?.toLowerCase().includes(keyword) ||
      spot.location?.toLowerCase().includes(keyword)
    )
  })

  const handleSortChange = (newSort: 'popular' | 'name' | 'latest') => {
    setSortBy(newSort)
  }

  const handleClearSearch = () => {
    setSearchKeyword('')
  }

  return (
    <>
      <div className="spot-page">
        {/* Header */}
        <div className="spot-header-bar">
          <h1 className="spot-page-title">
            <span className="spot-title-icon">📍</span>
            観光スポット
          </h1>
          
          {/* Weather Widget */}
          <WeatherWidget />
          
          <div className="spot-header-controls">
            <SearchAndSort
              searchKeyword={searchKeyword}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortChange}
              sortBy={sortBy}
              placeholder={searchKeyword ? "スポット名や場所で検索... ( / でフォーカス)" : `${dynamicPlaceholder} で検索... ( / でフォーカス)`}
              enableDebounce={false}
              onClearSearch={handleClearSearch}
              onSearchSubmit={handleSearchSubmit}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="spot-loading">
            <div className="spot-skeleton-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="spot-skeleton-card">
                  <div className="spot-skeleton-image"></div>
                  <div className="spot-skeleton-content">
                    <div className="spot-skeleton-title"></div>
                    <div className="spot-skeleton-text"></div>
                    <div className="spot-skeleton-text short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="spot-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>読み込みエラー</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadSpots}>
              再試行
            </button>
          </div>
        ) : filteredSpots.length === 0 ? (
          <div className="spot-empty">
            <div className="spot-empty-icon">📍</div>
            <h3>スポットが見つかりません</h3>
            <p>
              {searchKeyword 
                ? `「${searchKeyword}」の検索結果が見つかりませんでした。`
                : 'まだスポットが登録されていません。'
              }
            </p>
            {searchKeyword && (
              <button className="btn btn-primary" onClick={handleClearSearch}>
                検索をクリア
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="spot-results-info">
              <span>
                {filteredSpots.length}件のスポットが見つかりました
                {searchKeyword && `（「${searchKeyword}」の検索結果）`}
              </span>
            </div>

            <div className="spot-grid">
              {filteredSpots.map((spot, index) => (
                <div 
                  key={spot.id} 
                  className="spot-grid-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <SpotCard 
                    spot={spot} 
                    onUpdate={loadSpots}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes CTA Banner - 页面底部 */}
        <div className="spot-notes-cta">
          <div className="spot-notes-cta-content">
            <span className="spot-notes-cta-text">みんなの旅行ノートもチェックしてみませんか？</span>
            <Link 
              to="/notes" 
              className="spot-notes-cta-link"
              onClick={() => {
                // 跳转后滚动到页面顶部
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 100)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              旅行ノートを見る
            </Link>
          </div>
        </div>
      </div>
      <Footer />
      <ScrollToTop />
    </>
  )
}

export default Spot
