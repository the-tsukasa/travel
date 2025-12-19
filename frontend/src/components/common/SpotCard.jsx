import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { TokenUtil } from '../../utils/auth'

const SpotCard = ({ spot, onUpdate }) => {
  const navigate = useNavigate()
  const [likesCount, setLikesCount] = useState(spot.likes || 0)
  const [favoritesCount, setFavoritesCount] = useState(spot.favorites || 0)
  const [imageError, setImageError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 同步 spot 数据更新
  useEffect(() => {
    setLikesCount(spot.likes || 0)
    setFavoritesCount(spot.favorites || 0)
  }, [spot])

  const formatImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `http://localhost:8080${url}`
    return `http://localhost:8080/uploads/${url}`
  }

  const defaultImage = 'https://via.placeholder.com/400x250?text=No+Image'

  const handleLike = async (e) => {
    e.stopPropagation()
    
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
      const response = await api.post(`/spots/${spot.id}/like`)
      // 后端返回更新后的 spot 对象
      if (response.data) {
        setLikesCount(response.data.likes || 0)
      } else {
        // 如果没有返回数据，简单增加计数
        setLikesCount(prev => prev + 1)
      }
      
      if (onUpdate) {
        onUpdate()
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

  const handleFavorite = async (e) => {
    e.stopPropagation()
    
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
      const response = await api.post(`/spots/${spot.id}/favorite`)
      // 后端返回更新后的 spot 对象
      if (response.data) {
        setFavoritesCount(response.data.favorites || 0)
      } else {
        // 如果没有返回数据，简单增加计数
        setFavoritesCount(prev => prev + 1)
      }
      
      if (onUpdate) {
        onUpdate()
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

  const handleCardClick = () => {
    navigate(`/spot-detail?id=${spot.id}`)
  }

  const displayImageUrl = formatImageUrl(spot.imageUrl)

  return (
    <article 
      className="spot-card" 
      onClick={handleCardClick}
      aria-label={`スポット「${spot.name}」の詳細を見る`}
    >
      <div className="spot-card-image-wrapper">
        {displayImageUrl ? (
          <img 
            src={displayImageUrl} 
            alt={spot.name} 
            className="spot-card-image"
            loading="lazy"
            onError={(e) => {
              console.error('スポット画像読み込みエラー:', e.target.src)
              setImageError(true)
              e.target.src = defaultImage
            }}
          />
        ) : (
          <div className="spot-card-image-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>画像なし</span>
          </div>
        )}
      </div>
      
      <div className="spot-card-content">
        <h3 className="spot-card-title">{spot.name}</h3>
        
        {spot.description && (
          <p className="spot-card-description">
            {spot.description}
          </p>
        )}

        {spot.location && (
          <div className="spot-card-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{spot.location}</span>
          </div>
        )}

        <div className="spot-card-actions">
          <button
            className="spot-card-action-btn"
            onClick={handleLike}
            disabled={isSubmitting}
            aria-label={`いいねする (${likesCount}件)`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>{likesCount}</span>
          </button>
          <button
            className="spot-card-action-btn"
            onClick={handleFavorite}
            disabled={isSubmitting}
            aria-label={`お気に入りに追加 (${favoritesCount}件)`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{favoritesCount}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default SpotCard

