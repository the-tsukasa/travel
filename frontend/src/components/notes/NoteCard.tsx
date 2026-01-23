import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, memo, useRef, useCallback, MouseEvent } from 'react'
import api from '../../services/api'
import { TokenUtil } from '../../utils/auth'
import type { NotesDTO, NoteStatus } from '../../types'

// 工具函数移到组件外部，避免每次渲染都重新创建
// 使用更高效的方法转义 HTML，避免创建 DOM 元素
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return ''
  // 使用完整的 HTML 实体映射，确保安全性
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;'
  }
  return String(text).replace(/[&<>"'\/]/g, m => map[m])
}

// 格式化日期 - 移到外部，可以缓存当前时间
let cachedNow = Date.now()
let cachedNowDate = new Date(cachedNow)
// 每分钟更新一次缓存时间
setInterval(() => {
  cachedNow = Date.now()
  cachedNowDate = new Date(cachedNow)
}, 60000)

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const diff = cachedNow - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今日'
  if (days === 1) return '昨日'
  if (days < 7) return `${days}日前`
  if (days < 30) return `${Math.floor(days / 7)}週間前`
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

// 状态标签样式映射 - 移到外部避免重复创建
const statusStyles: Record<string, { bg: string; color: string; icon: string }> = {
  DRAFT: { bg: '#e3f2fd', color: '#1976d2', icon: '📝' },
  PENDING: { bg: '#fff3e0', color: '#f57c00', icon: '⏳' },
  REJECTED: { bg: '#ffebee', color: '#c62828', icon: '❌' },
  PRIVATE: { bg: '#f3e5f5', color: '#7b1fa2', icon: '🔒' }
}

interface NoteCardProps {
  note: NotesDTO
  onUpdate?: () => void
  priority?: boolean
}

const NoteCard = memo<NoteCardProps>(({ note, onUpdate, priority = false }) => {
  const navigate = useNavigate()
  const [isLiked, setIsLiked] = useState<boolean>(note.isLiked || false)
  const [isFavorited, setIsFavorited] = useState<boolean>(note.isFavorited || false)
  const [likesCount, setLikesCount] = useState<number>(note.likesCount || 0)
  const [favoritesCount, setFavoritesCount] = useState<number>(note.favoritesCount || 0)
  const [imageError, setImageError] = useState<boolean>(false)
  const [imageLoading, setImageLoading] = useState<boolean>(true)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [shouldLoadImage, setShouldLoadImage] = useState<boolean>(priority) // 是否应该加载图片
  const [imageLoaded, setImageLoaded] = useState<boolean>(false) // 图片是否已加载完成
  const [likeAnimating, setLikeAnimating] = useState<boolean>(false)
  const [favoriteAnimating, setFavoriteAnimating] = useState<boolean>(false)
  const [isLiking, setIsLiking] = useState<boolean>(false) // true = 点赞, false = 取消
  const [isFavoriting, setIsFavoriting] = useState<boolean>(false) // true = 收藏, false = 取消
  const imageRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null) // 用于清理点赞动画的 setTimeout
  const favoriteTimeoutRef = useRef<NodeJS.Timeout | null>(null) // 用于清理收藏动画的 setTimeout

  // 同步 note 数据更新（当从后端获取新数据时）
  useEffect(() => {
    setIsLiked(note.isLiked || false)
    setIsFavorited(note.isFavorited || false)
    setLikesCount(note.likesCount || 0)
    setFavoritesCount(note.favoritesCount || 0)
  }, [note.isLiked, note.isFavorited, note.likesCount, note.favoritesCount])

  const handleCardClick = useCallback(() => {
    navigate(`/notes-detail?id=${note.id}`)
  }, [navigate, note.id])

  const handleLike = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    
    const token = TokenUtil.getToken()
    if (!token) {
      if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
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
      // 清理之前的 timeout
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current)
      }
      likeTimeoutRef.current = setTimeout(() => {
        setLikeAnimating(false)
        likeTimeoutRef.current = null
      }, 800)
      
      // 不调用 onUpdate()，避免刷新所有卡片
    } catch (error: any) {
      console.error('いいね操作エラー:', error)
      // 如果操作失败，恢复原状态
      setIsLiked(wasLiked)
      
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        // 检查是否是网络错误或服务器错误
        const errorMessage = error.response?.data?.message || error.message || '操作に失敗しました。'
        alert(errorMessage)
      }
    }
  }

  const handleFavorite = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    
    const token = TokenUtil.getToken()
    if (!token) {
      if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
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
      // 清理之前的 timeout
      if (favoriteTimeoutRef.current) {
        clearTimeout(favoriteTimeoutRef.current)
      }
      favoriteTimeoutRef.current = setTimeout(() => {
        setFavoriteAnimating(false)
        favoriteTimeoutRef.current = null
      }, 800)
      
      // 不调用 onUpdate()，避免刷新所有卡片
    } catch (error: any) {
      console.error('お気に入り操作エラー:', error)
      // 如果操作失败，恢复原状态
      setIsFavorited(wasFavorited)
      
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        // 检查是否是网络错误或服务器错误
        const errorMessage = error.response?.data?.message || error.message || '操作に失敗しました。'
        alert(errorMessage)
      }
    }
  }

  // 清理 timeout 的 effect
  useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current)
      }
      if (favoriteTimeoutRef.current) {
        clearTimeout(favoriteTimeoutRef.current)
      }
    }
  }, [])

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

  // 使用 Intersection Observer 实现精确的懒加载
  useEffect(() => {
    // 如果优先级高（首屏）或已经应该加载，直接设置
    if (priority) {
      setShouldLoadImage(true)
      return
    }

    // 如果没有图片URL，不需要观察
    if (!imageUrl || !imageRef.current) {
      return
    }

    // 如果已经应该加载，不需要创建 observer
    if (shouldLoadImage) {
      return
    }

    // 创建 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当图片进入视口时开始加载
          if (entry.isIntersecting) {
            setShouldLoadImage(true)
            // 加载后立即停止观察并断开连接
            if (observerRef.current) {
              observerRef.current.disconnect()
              observerRef.current = null
            }
          }
        })
      },
      {
        // 提前 100px 开始加载（预加载）
        rootMargin: '100px',
        threshold: 0.01
      }
    )

    observerRef.current = observer
    const currentRef = imageRef.current
    observer.observe(currentRef)

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [imageUrl, priority, shouldLoadImage])

  // 使用 useMemo 缓存截断文本
  const truncatedContent = useMemo(() => {
    if (!note.content) return ''
    const plainText = note.content.replace(/<[^>]*>/g, '')
    if (plainText.length <= 120) return note.content
    return plainText.substring(0, 120) + '...'
  }, [note.content])

  // 使用 useMemo 缓存状态标签样式
  const statusStyle = useMemo(() => {
    if (!note.status || note.status === 'PUBLISHED') return null
    const style = statusStyles[note.status]
    if (!style) return null
    return {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      backgroundColor: style.bg,
      color: style.color
    } as React.CSSProperties
  }, [note.status])

  // 使用 useMemo 缓存头像 URL
  const avatarSrc = useMemo(() => {
    if (!note.username) return null
    // 注意：NotesDTO 中没有 avatarUrl 字段，这里可能需要从其他地方获取
    return null
  }, [note.username])

  // 使用 useMemo 缓存格式化后的日期
  const formattedDate = useMemo(() => formatDate(note.createdAt), [note.createdAt])

  // 使用 useMemo 缓存转义后的标题和用户名
  const escapedTitle = useMemo(() => escapeHtml(note.title), [note.title])
  const escapedUsername = useMemo(() => escapeHtml(note.username || 'ユーザー'), [note.username])

  // 在 shouldLoadImage 为 true 时设置图片源
  useEffect(() => {
    if (shouldLoadImage && imageUrl) {
      // 重置状态
      setImageLoading(true)
      setImageError(false)
      setImageLoaded(false)
      // 设置新的图片源
      setImageSrc(imageUrl)
    } else if (!imageUrl) {
      setImageSrc(null)
      setImageLoading(false)
      setImageError(false)
      setImageLoaded(false)
    }
  }, [shouldLoadImage, imageUrl])

  return (
    <article className="note-card" onClick={handleCardClick}>
      {/* 图片区域 */}
      {imageUrl && (
        <div 
          className={`note-card-image-wrapper ${imageLoaded ? 'image-loaded' : ''}`}
          ref={imageRef}
        >
          {(!shouldLoadImage || imageLoading) && (
            <div className="note-card-image-skeleton"></div>
          )}
          {shouldLoadImage && imageSrc && !imageError && (
            <img 
              src={imageSrc} 
              alt={escapedTitle} 
              className="note-card-image"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              onLoad={() => {
                setImageLoading(false)
                setImageLoaded(true)
              }}
              onError={(e) => {
                console.error('图片加载失败:', imageSrc, note)
                setImageError(true)
                setImageLoading(false)
                setImageLoaded(false)
                // 隐藏图片元素
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
              style={{ 
                display: imageLoading ? 'none' : 'block',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out'
              }}
            />
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className="note-card-content">
        {/* 标题和状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h3 className="note-card-title" style={{ flex: 1, margin: 0 }} dangerouslySetInnerHTML={{ __html: escapedTitle }} />
          {/* 状态标签（仅显示非 PUBLISHED 状态） */}
          {statusStyle && (
            <span style={statusStyle}>
              {note.status && statusStyles[note.status]?.icon}
            </span>
          )}
        </div>
        
        {/* 用户信息 */}
        <div className="note-card-author">
          <div className="note-card-author-avatar">
            {avatarSrc ? (
              <img 
                src={avatarSrc}
                alt={escapedTitle}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                  const nextSibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                  if (nextSibling) {
                    nextSibling.style.display = 'block'
                  }
                }}
              />
            ) : null}
            <div className="note-card-author-initial" style={{ display: avatarSrc ? 'none' : 'block' }}>
              {note.username ? note.username.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div className="note-card-author-info">
            <span className="note-card-author-name">{escapedUsername}</span>
            <span className="note-card-date">{formattedDate}</span>
          </div>
        </div>

        {/* 内容预览 */}
        <div className="note-card-body" dangerouslySetInnerHTML={{ __html: truncatedContent }} />

        {/* 位置信息 */}
        {note.location && (
          <div className="note-card-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{note.location}</span>
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
                      <div key={i} className="particle particle-heart" style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}>❤️</div>
                    ))
                  ) : (
                    // 取消：心形破碎向下掉落
                    [...Array(8)].map((_, i) => (
                      <div key={i} className="particle particle-heart-broken" style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}>💔</div>
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
                      <div key={i} className="particle particle-star" style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}>⭐</div>
                    ))
                  ) : (
                    // 取消：星星破碎向下掉落
                    [...Array(8)].map((_, i) => (
                      <div key={i} className="particle particle-star-broken" style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}>💫</div>
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
    prevProps.note.isFavorited === nextProps.note.isFavorited &&
    prevProps.priority === nextProps.priority
  )
})

NoteCard.displayName = 'NoteCard'

export default NoteCard
