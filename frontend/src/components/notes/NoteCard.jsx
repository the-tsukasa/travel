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

    try {
      if (isLiked) {
        await api.delete(`/likes/${note.id}`)
      } else {
        await api.post(`/likes/${note.id}`)
      }
      
      setIsLiked(!isLiked)
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('いいね操作エラー:', error)
      if (error.response?.status === 401) {
        if (confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        alert('操作に失敗しました。')
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

    try {
      if (isFavorited) {
        await api.delete(`/favorites/${note.id}`)
      } else {
        await api.post(`/favorites/${note.id}`)
      }
      
      setIsFavorited(!isFavorited)
      setFavoritesCount(prev => isFavorited ? prev - 1 : prev + 1)
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('お気に入り操作エラー:', error)
      if (error.response?.status === 401) {
        if (confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        alert('操作に失敗しました。')
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
              className={`note-card-action-btn note-card-like-btn ${isLiked ? 'active' : ''}`}
              onClick={handleLike}
              aria-label={`いいね ${likesCount}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>{likesCount}</span>
            </button>
            <button
              className={`note-card-action-btn note-card-favorite-btn ${isFavorited ? 'active' : ''}`}
              onClick={handleFavorite}
              aria-label={`お気に入り ${favoritesCount}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>{favoritesCount}</span>
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
