import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'

const NoteCard = ({ note, onUpdate }) => {
  const navigate = useNavigate()
  const [isLiked, setIsLiked] = useState(note.isLiked || false)
  const [isFavorited, setIsFavorited] = useState(note.isFavorited || false)
  const [likesCount, setLikesCount] = useState(note.likesCount || 0)
  const [favoritesCount, setFavoritesCount] = useState(note.favoritesCount || 0)

  const handleCardClick = () => {
    navigate(`/notes-detail.html?id=${note.id}`)
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
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  return (
    <div 
      className="note-card" 
      onClick={handleCardClick}
      style={{
        cursor: 'pointer',
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{
        fontSize: '1.3rem',
        fontWeight: 700,
        marginBottom: '8px',
        color: '#1e293b'
      }} dangerouslySetInnerHTML={{ __html: escapeHtml(note.title) }} />
      
      <div style={{
        fontSize: '0.9rem',
        color: '#64748b',
        marginBottom: '12px'
      }}>by {escapeHtml(note.username)}</div>

      {note.imageUrl && (
        <img 
          src={note.imageUrl} 
          alt="ノート画像" 
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            marginBottom: '12px'
          }}
          loading="lazy"
        />
      )}

      <div style={{
        color: '#4a5568',
        lineHeight: '1.6',
        marginBottom: '12px',
        maxHeight: '100px',
        overflow: 'hidden'
      }} dangerouslySetInnerHTML={{ __html: escapeHtml(note.content) }} />

      {note.location && (
        <div style={{
          color: '#667eea',
          fontSize: '0.9rem',
          marginBottom: '12px'
        }}>📍 {escapeHtml(note.location)}</div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '12px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          <button
            className={`action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            style={{
              background: isLiked ? '#ff6b6b' : 'transparent',
              border: `2px solid ${isLiked ? '#ff6b6b' : '#cbd5e1'}`,
              color: isLiked ? '#fff' : '#64748b',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            ❤️ {likesCount}
          </button>
          <button
            className={`action-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavorite}
            style={{
              background: isFavorited ? '#ffd93d' : 'transparent',
              border: `2px solid ${isFavorited ? '#ffd93d' : '#cbd5e1'}`,
              color: isFavorited ? '#fff' : '#64748b',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            ⭐ {favoritesCount}
          </button>
        </div>
        <div style={{ color: '#718096', fontSize: '0.9rem' }}>
          {new Date(note.createdAt).toLocaleDateString('ja-JP')}
        </div>
      </div>
    </div>
  )
}

export default NoteCard
