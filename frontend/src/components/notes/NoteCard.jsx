import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, memo } from 'react'
import api from '../../services/api'
import { TokenUtil } from '../../utils/auth'

const NoteCard = memo(({ note, onUpdate }) => {
  const navigate = useNavigate()
  const [isLiked, setIsLiked] = useState(note.isLiked || false)
  const [isFavorited, setIsFavorited] = useState(note.isFavorited || false)
  const [likesCount, setLikesCount] = useState(note.likesCount || 0)
  const [favoritesCount, setFavoritesCount] = useState(note.favoritesCount || 0)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageSrc, setImageSrc] = useState(null)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [favoriteAnimating, setFavoriteAnimating] = useState(false)
  const [isLiking, setIsLiking] = useState(false) // true = 点赞, false = 取消
  const [isFavoriting, setIsFavoriting] = useState(false) // true = 收藏, false = 取消

  // 同步 note 数据更新（当从后端获取新数据时）
  useEffect(() => {
    setIsLiked(note.isLiked || false)
    setIsFavorited(note.isFavorited || false)
    setLikesCount(note.likesCount || 0)
    setFavoritesCount(note.favoritesCount || 0)
  }, [note.isLiked, note.isFavorited, note.likesCount, note.favoritesCount])

  const handleCardClick = () => {
    navigate(`/notes-detail?id=${note.id}`)
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    
    const token = TokenUtil.getToken()
    if (!token) {
      if (confirm('ログインが必要です。ログインページに移動しますか？')) {
        navigate('/login')
      }
      return
    }

    const wasLiked = isLiked
    try {
      if (wasLiked) {
        await api.delete(`/likes/${note.id}`)
      } else {
        await api.post(`/likes/${note.id}`)
      }
      
      // 更新状态
      const newLikedState = !wasLiked
      setIsLiked(newLikedState)
      setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1)
      
      // 设置动画类型（点赞或取消）
      setIsLiking(newLikedState)
      
      // 触发动画
      setLikeAnimating(true)
      setTimeout(() => setLikeAnimating(false), 800)
      
      // 不调用 onUpdate()，避免刷新所有卡片
    } catch (error) {
      console.error('いいね操作エラー:', error)
      // 如果操作失败，恢复原状态
      setIsLiked(wasLiked)
      
      if (error.response?.status === 401) {
        if (confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        // 检查是否是网络错误或服务器错误
        const errorMessage = error.response?.data?.message || error.message || '操作に失敗しました。'
        alert(errorMessage)
      }
    }
  }

  const handleFavorite = async (e) => {
    e.stopPropagation()
    
    const token = TokenUtil.getToken()
    if (!token) {
      if (confirm('ログインが必要です。ログインページに移動しますか？')) {
        navigate('/login')
      }
      return
    }

    const wasFavorited = isFavorited
    try {
      if (wasFavorited) {
        await api.delete(`/favorites/${note.id}`)
      } else {
        await api.post(`/favorites/${note.id}`)
      }
      
      // 更新状态
      const newFavoritedState = !wasFavorited
      setIsFavorited(newFavoritedState)
      setFavoritesCount(prev => wasFavorited ? Math.max(0, prev - 1) : prev + 1)
      
      // 设置动画类型（收藏或取消）
      setIsFavoriting(newFavoritedState)
      
      // 触发动画
      setFavoriteAnimating(true)
      setTimeout(() => setFavoriteAnimating(false), 800)
      
      // 不调用 onUpdate()，避免刷新所有卡片
    } catch (error) {
      console.error('お気に入り操作エラー:', error)
      // 如果操作失败，恢复原状态
      setIsFavorited(wasFavorited)
      
      if (error.response?.status === 401) {
        if (confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        // 检查是否是网络错误或服务器错误
        const errorMessage = error.response?.data?.message || error.message || '操作に失敗しました。'
        alert(errorMessage)
      }
    }
  }

  const escapeHtml = (text) => {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今日'
    if (days === 1) return '昨日'
    if (days < 7) return `${days}日前`
    if (days < 30) return `${Math.floor(days / 7)}週間前`
    if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 使用useMemo计算图片URL，避免每次渲染都重新计算
  const imageUrl = useMemo(() => {
    if (!note.imageUrl) return null
    
    let url = note.imageUrl
    
    // 尝试解析 JSON 数组格式
    try {
      const parsed = JSON.parse(note.imageUrl)
      if (Array.isArray(parsed) && parsed.length > 0) {
        url = parsed[0]
      } else if (typeof parsed === 'string') {
        url = parsed
      }
    } catch {
      // 不是 JSON，直接使用原始值
      url = note.imageUrl
    }
    
    // 格式化URL
    if (!url) return null
    
    // 如果已经是完整 URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // 如果是 /uploads/ 开头的相对路径，直接返回（Vite代理会处理）
    if (url.startsWith('/uploads/')) {
      return url
    }
    
    // 如果是 / 开头的其他路径，直接返回
    if (url.startsWith('/')) {
      return url
    }
    
    // 否则添加 /uploads/ 前缀
    // 检查是否已经包含 notes/ 子目录
    if (url.startsWith('notes/')) {
      return `/uploads/${url}`
    }
    
    return `/uploads/${url}`
  }, [note.imageUrl])

  // 截断文本
  const truncateText = (text, maxLength = 120) => {
    if (!text) return ''
    const plainText = text.replace(/<[^>]*>/g, '')
    if (plainText.length <= maxLength) return text
    return plainText.substring(0, maxLength) + '...'
  }

  // 在组件挂载或 imageUrl 变化时处理图片 URL
  useEffect(() => {
    if (imageUrl) {
      // 重置状态
      setImageLoading(true)
      setImageError(false)
      // 设置新的图片源
      setImageSrc(imageUrl)
    } else {
      setImageSrc(null)
      setImageLoading(false)
      setImageError(false)
    }
  }, [imageUrl])

  return (
    <article className="note-card" onClick={handleCardClick}>
      {/* 图片区域 */}
      {imageSrc && !imageError && (
        <div className="note-card-image-wrapper">
          {imageLoading && (
            <div className="note-card-image-skeleton"></div>
          )}
          <img 
            src={imageSrc} 
            alt={escapeHtml(note.title)} 
            className="note-card-image"
            loading="lazy"
            decoding="async"
            onLoad={() => {
              setImageLoading(false)
            }}
            onError={(e) => {
              console.error('图片加载失败:', imageSrc, note)
              setImageError(true)
              setImageLoading(false)
              // 隐藏图片元素
              e.target.style.display = 'none'
            }}
            style={{ 
              display: imageLoading ? 'none' : 'block',
              opacity: imageLoading ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
          />
        </div>
      )}

      {/* 内容区域 */}
      <div className="note-card-content">
        {/* 标题和状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h3 className="note-card-title" style={{ flex: 1, margin: 0 }} dangerouslySetInnerHTML={{ __html: escapeHtml(note.title) }} />
          {/* 状态标签（仅显示非 PUBLISHED 状态） */}
          {note.status && note.status !== 'PUBLISHED' && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              backgroundColor: 
                note.status === 'DRAFT' ? '#e3f2fd' :
                note.status === 'PENDING' ? '#fff3e0' :
                note.status === 'REJECTED' ? '#ffebee' :
                note.status === 'PRIVATE' ? '#f3e5f5' : '#f5f5f5',
              color: 
                note.status === 'DRAFT' ? '#1976d2' :
                note.status === 'PENDING' ? '#f57c00' :
                note.status === 'REJECTED' ? '#c62828' :
                note.status === 'PRIVATE' ? '#7b1fa2' : '#666'
            }}>
              {note.status === 'DRAFT' && '📝'}
              {note.status === 'PENDING' && '⏳'}
              {note.status === 'REJECTED' && '❌'}
              {note.status === 'PRIVATE' && '🔒'}
            </span>
          )}
        </div>
        
        {/* 用户信息 */}
        <div className="note-card-author">
          <div className="note-card-author-avatar">
            {note.avatarUrl ? (
              <img 
                src={note.avatarUrl.startsWith('http://') || note.avatarUrl.startsWith('https://') 
                  ? note.avatarUrl 
                  : note.avatarUrl.startsWith('/') 
                    ? note.avatarUrl 
                    : `/${note.avatarUrl}`}
                alt={escapeHtml(note.username)}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
            ) : null}
            <div className="note-card-author-initial" style={{ display: note.avatarUrl ? 'none' : 'block' }}>
              {note.username ? note.username.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div className="note-card-author-info">
            <span className="note-card-author-name">{escapeHtml(note.username || 'ユーザー')}</span>
            <span className="note-card-date">{formatDate(note.createdAt)}</span>
          </div>
        </div>

        {/* 内容预览 */}
        <div className="note-card-body" dangerouslySetInnerHTML={{ __html: truncateText(note.content) }} />

        {/* 位置信息 */}
        {note.location && (
          <div className="note-card-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{escapeHtml(note.location)}</span>
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="note-card-footer" onClick={(e) => e.stopPropagation()}>
          <div className="note-card-actions">
            <button
              className={`note-card-action-btn note-card-like-btn ${isLiked ? 'active' : ''} ${likeAnimating ? 'animating' : ''} ${likeAnimating && !isLiking ? 'breaking' : ''}`}
              onClick={handleLike}
              aria-label={`いいね ${likesCount}`}
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
              className={`note-card-action-btn note-card-favorite-btn ${isFavorited ? 'active' : ''} ${favoriteAnimating ? 'animating' : ''} ${favoriteAnimating && !isFavoriting ? 'breaking' : ''}`}
              onClick={handleFavorite}
              aria-label={`お気に入り ${favoritesCount}`}
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
      </div>
    </article>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重新渲染
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.imageUrl === nextProps.note.imageUrl &&
    prevProps.note.likesCount === nextProps.note.likesCount &&
    prevProps.note.favoritesCount === nextProps.note.favoritesCount &&
    prevProps.note.isLiked === nextProps.note.isLiked &&
    prevProps.note.isFavorited === nextProps.note.isFavorited
  )
})

NoteCard.displayName = 'NoteCard'

export default NoteCard
