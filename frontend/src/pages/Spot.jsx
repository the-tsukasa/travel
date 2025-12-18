import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import SpotCard from '../components/common/SpotCard'
import Footer from '../components/layout/Footer'

const Spot = () => {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortBy, setSortBy] = useState('popular') // popular, name, latest
  const searchInputRef = useRef(null)
  const navigate = useNavigate()

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

  // 键盘快捷键：/ 或 f 聚焦搜索
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === '/' || e.key === 'f') && !e.ctrlKey && !e.metaKey) {
        const target = e.target
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const loadSpots = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await api.get('/spots')
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
          return dateB - dateA
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

  // 防抖搜索
  const debouncedSearch = useRef(null)
  
  const handleSearchChange = useCallback((value) => {
    setSearchKeyword(value)
    
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current)
      debouncedSearch.current = null
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

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
  }

  const handleClearSearch = () => {
    setSearchKeyword('')
    searchInputRef.current?.focus()
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
          
          <div className="spot-header-controls">
            {/* Search */}
            <div className="spot-search-wrapper">
              <svg className="spot-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleClearSearch()
                    searchInputRef.current?.blur()
                  }
                }}
                placeholder="スポット名や場所で検索... ( / でフォーカス)"
                className="spot-search-input"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="spot-search-clear"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="spot-sort">
              <button
                className={`spot-sort-btn ${sortBy === 'popular' ? 'active' : ''}`}
                onClick={() => handleSortChange('popular')}
                title="人気順"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>人気</span>
              </button>
              <button
                className={`spot-sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => handleSortChange('name')}
                title="名前順"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                <span>名前</span>
              </button>
              <button
                className={`spot-sort-btn ${sortBy === 'latest' ? 'active' : ''}`}
                onClick={() => handleSortChange('latest')}
                title="最新順"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                <span>最新</span>
              </button>
            </div>
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
      </div>
      <Footer />
    </>
  )
}

export default Spot
