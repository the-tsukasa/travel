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
  
  // 从 localStorage 获取用户的点赞/收藏状态
  const getSpotLikeKey = (spotId) => `spot_like_${spotId}`
  const getSpotFavoriteKey = (spotId) => `spot_favorite_${spotId}`
  
  const [isLiked, setIsLiked] = useState(() => {
    const stored = localStorage.getItem(getSpotLikeKey(spot.id))
    return stored === 'true'
  })
  
  const [isFavorited, setIsFavorited] = useState(() => {
    const stored = localStorage.getItem(getSpotFavoriteKey(spot.id))
    return stored === 'true'
  })
  
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [favoriteAnimating, setFavoriteAnimating] = useState(false)
  const [isLiking, setIsLiking] = useState(false) // true = 点赞, false = 取消
  const [isFavoriting, setIsFavoriting] = useState(false) // true = 收藏, false = 取消

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
    const wasLiked = isLiked // 在 try 块外定义，以便在 catch 中使用
    try {
      let response
      
      if (wasLiked) {
        // 取消点赞
        response = await api.delete(`/spots/${spot.id}/like`)
      } else {
        // 点赞
        response = await api.post(`/spots/${spot.id}/like`)
      }
      
      // 更新状态
      const newLikedState = !wasLiked
      setIsLiked(newLikedState)
      localStorage.setItem(getSpotLikeKey(spot.id), String(newLikedState))
      
      // 设置动画类型（点赞或取消）
      setIsLiking(newLikedState)
      
      // 触发动画
      setLikeAnimating(true)
      setTimeout(() => setLikeAnimating(false), 800)
      
      // 后端返回更新后的 spot 对象
      if (response && response.data && response.data.likes !== undefined) {
        setLikesCount(response.data.likes)
      } else {
        // 如果没有返回数据，根据操作更新计数
        setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1)
      }
      
      // 不调用 onUpdate()，避免刷新所有卡片
    } catch (error) {
      console.error('いいね操作エラー:', error)
      // 如果操作失败，恢复原状态
      setIsLiked(wasLiked)
      localStorage.setItem(getSpotLikeKey(spot.id), String(wasLiked))
      
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        // 检查是否是网络错误或服务器错误
        const errorMessage = error.response?.data?.message || error.message || '操作に失敗しました。'
        alert(errorMessage)
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
    const wasFavorited = isFavorited // 在 try 块外定义，以便在 catch 中使用
    try {
      let response
      
      if (wasFavorited) {
        // 取消收藏
        response = await api.delete(`/spots/${spot.id}/favorite`)
      } else {
        // 收藏
        response = await api.post(`/spots/${spot.id}/favorite`)
      }
      
      // 更新状态
      const newFavoritedState = !wasFavorited
      setIsFavorited(newFavoritedState)
      localStorage.setItem(getSpotFavoriteKey(spot.id), String(newFavoritedState))
      
      // 设置动画类型（收藏或取消）
      setIsFavoriting(newFavoritedState)
      
      // 触发动画
      setFavoriteAnimating(true)
      setTimeout(() => setFavoriteAnimating(false), 800)
      
      // 后端返回更新后的 spot 对象
      if (response && response.data && response.data.favorites !== undefined) {
        setFavoritesCount(response.data.favorites)
      } else {
        // 如果没有返回数据，根据操作更新计数
        setFavoritesCount(prev => wasFavorited ? Math.max(0, prev - 1) : prev + 1)
      }
      
      // 不调用 onUpdate()，避免刷新所有卡片
    } catch (error) {
      console.error('お気に入り操作エラー:', error)
      // 如果操作失败，恢复原状态
      setIsFavorited(wasFavorited)
      localStorage.setItem(getSpotFavoriteKey(spot.id), String(wasFavorited))
      
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        // 检查是否是网络错误或服务器错误
        const errorMessage = error.response?.data?.message || error.message || '操作に失敗しました。'
        alert(errorMessage)
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
            className={`spot-card-action-btn ${isLiked ? 'active' : ''} ${likeAnimating ? 'animating' : ''} ${likeAnimating && !isLiking ? 'breaking' : ''}`}
            onClick={handleLike}
            disabled={isSubmitting}
            aria-label={isLiked ? `いいねを解除 (${likesCount}件)` : `いいねする (${likesCount}件)`}
          >
            {likeAnimating && (
              <div className="particle-effect">
                {isLiking ? (
                  // 点赞：心形向上飞散
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="particle particle-heart" style={{ '--delay': `${i * 0.1}s` }}>❤️</div>
                  ))
                ) : (
                  // 取消：心形破碎向下掉落
                  [...Array(8)].map((_, i) => (
                    <div key={i} className="particle particle-heart-broken" style={{ '--delay': `${i * 0.08}s` }}>💔</div>
                  ))
                )}
              </div>
            )}
            <div className="button-ripple"></div>
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill={isLiked ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2"
              className={likeAnimating ? (isLiking ? 'icon-bounce' : 'icon-break') : ''}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span className={likeAnimating ? (isLiking ? 'count-pop' : 'count-drop') : ''}>{likesCount}</span>
          </button>
          <button
            className={`spot-card-action-btn ${isFavorited ? 'active' : ''} ${favoriteAnimating ? 'animating' : ''} ${favoriteAnimating && !isFavoriting ? 'breaking' : ''}`}
            onClick={handleFavorite}
            disabled={isSubmitting}
            aria-label={isFavorited ? `お気に入りを解除 (${favoritesCount}件)` : `お気に入りに追加 (${favoritesCount}件)`}
          >
            {favoriteAnimating && (
              <div className="particle-effect">
                {isFavoriting ? (
                  // 收藏：星星向上飞散
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="particle particle-star" style={{ '--delay': `${i * 0.1}s` }}>⭐</div>
                  ))
                ) : (
                  // 取消：星星破碎向下掉落
                  [...Array(8)].map((_, i) => (
                    <div key={i} className="particle particle-star-broken" style={{ '--delay': `${i * 0.08}s` }}>💫</div>
                  ))
                )}
              </div>
            )}
            <div className="button-ripple"></div>
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill={isFavorited ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2"
              className={favoriteAnimating ? (isFavoriting ? 'icon-bounce' : 'icon-break') : ''}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span className={favoriteAnimating ? (isFavoriting ? 'count-pop' : 'count-drop') : ''}>{favoritesCount}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default SpotCard

