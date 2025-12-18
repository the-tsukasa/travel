import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/layout/Footer'

const SpotDetail = () => {
  const [searchParams] = useSearchParams()
  const spotId = searchParams.get('id')
  const [spot, setSpot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likesCount, setLikesCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!spotId) {
      setError('スポットIDが見つかりません。')
      setLoading(false)
      return
    }
    loadSpotDetail()
  }, [spotId])

  const loadSpotDetail = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await api.get(`/spots/${spotId}`)
      
      if (response.status === 200 && response.data) {
        const spotData = response.data
        setSpot(spotData)
        setLikesCount(spotData.likes || 0)
        setFavoritesCount(spotData.favorites || 0)
      }
    } catch (err) {
      console.error('スポット読み込みエラー:', err)
      if (err.response?.status === 404) {
        setError('スポットが見つかりません。')
      } else {
        setError('スポットの読み込みに失敗しました。時間をおいて再試行してください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `http://localhost:8080${url}`
    return `http://localhost:8080/uploads/${url}`
  }

  const handleLike = async () => {
    if (isSubmitting) return
    
    const token = TokenUtil.getToken()
    if (!token) {
      if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
        navigate('/login')
      }
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post(`/spots/${spotId}/like`)
      if (response.data) {
        setLikesCount(response.data.likes || 0)
      } else {
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('いいね操作エラー:', error)
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        alert('操作に失敗しました。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFavorite = async () => {
    if (isSubmitting) return
    
    const token = TokenUtil.getToken()
    if (!token) {
      if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
        navigate('/login')
      }
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post(`/spots/${spotId}/favorite`)
      if (response.data) {
        setFavoritesCount(response.data.favorites || 0)
      } else {
        setFavoritesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('お気に入り操作エラー:', error)
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        alert('操作に失敗しました。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="spot-detail-page">
        <div className="spot-detail-container">
          {loading ? (
            <div className="spot-detail-loading">
              <div className="spot-detail-skeleton">
                <div className="spot-detail-skeleton-image"></div>
                <div className="spot-detail-skeleton-content">
                  <div className="spot-detail-skeleton-title"></div>
                  <div className="spot-detail-skeleton-text"></div>
                  <div className="spot-detail-skeleton-text"></div>
                  <div className="spot-detail-skeleton-text short"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="spot-detail-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>読み込みエラー</h3>
              <p>{error}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={loadSpotDetail}>
                  再試行
                </button>
                <Link to="/spot.html" className="btn btn-outline">
                  一覧に戻る
                </Link>
              </div>
            </div>
          ) : spot ? (
            <>
              {/* 返回按钮 */}
              <div className="spot-detail-back">
                <Link to="/spot.html" className="spot-detail-back-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>一覧に戻る</span>
                </Link>
              </div>

              {/* 主要内容 */}
              <article className="spot-detail-card">
                {/* 图片 */}
                <div className="spot-detail-image-wrapper">
                  {formatImageUrl(spot.imageUrl) ? (
                    <img 
                      src={formatImageUrl(spot.imageUrl)} 
                      alt={spot.name}
                      className="spot-detail-image"
                    />
                  ) : (
                    <div className="spot-detail-image-placeholder">
                      <svg width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>画像なし</span>
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="spot-detail-content">
                  <h1 className="spot-detail-title">{spot.name}</h1>

                  {spot.location && (
                    <div className="spot-detail-location">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{spot.location}</span>
                    </div>
                  )}

                  {spot.description && (
                    <div className="spot-detail-description">
                      <p>{spot.description}</p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="spot-detail-actions">
                    <button
                      className="spot-detail-action-btn"
                      onClick={handleLike}
                      disabled={isSubmitting}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span>いいね</span>
                      <span className="spot-detail-action-count">{likesCount}</span>
                    </button>
                    <button
                      className="spot-detail-action-btn"
                      onClick={handleFavorite}
                      disabled={isSubmitting}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span>お気に入り</span>
                      <span className="spot-detail-action-count">{favoritesCount}</span>
                    </button>
                  </div>

                  {spot.createdAt && (
                    <div className="spot-detail-meta">
                      <span>作成日: {new Date(spot.createdAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                  )}
                </div>
              </article>
            </>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default SpotDetail

