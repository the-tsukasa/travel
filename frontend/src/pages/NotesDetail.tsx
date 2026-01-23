import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/layout/Footer'
import type { NotesDTO } from '../types'

const NotesDetail = () => {
  const [searchParams] = useSearchParams()
  const noteId = searchParams.get('id')
  const [note, setNote] = useState<NotesDTO | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [isLiked, setIsLiked] = useState<boolean>(false)
  const [isFavorited, setIsFavorited] = useState<boolean>(false)
  const [likesCount, setLikesCount] = useState<number>(0)
  const [favoritesCount, setFavoritesCount] = useState<number>(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!noteId) {
      setError('ノートIDが見つかりません。')
      setLoading(false)
      return
    }
    loadNoteDetail()
  }, [noteId])

  const loadNoteDetail = async () => {
    try {
      const token = TokenUtil.getToken()
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/notes/${noteId}`, { headers })
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('ノートが見つかりません。')
        } else if (response.status === 403) {
          setError('このノートはまだ審査中です。')
        } else {
          setError('ノートの読み込みに失敗しました。')
        }
        setLoading(false)
        return
      }

      const noteData = await response.json() as NotesDTO
      setNote(noteData)
      setIsLiked(noteData.isLiked || false)
      setIsFavorited(noteData.isFavorited || false)
      setLikesCount(noteData.likesCount || 0)
      setFavoritesCount(noteData.favoritesCount || 0)
    } catch (err) {
      console.error('ノート読み込みエラー:', err)
      setError('ノートの読み込みに失敗しました。時間をおいて再試行してください。')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    const token = TokenUtil.getToken()
    if (!token || !noteId) {
      if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
        navigate('/login')
      }
      return
    }

    try {
      if (isLiked) {
        await api.delete(`/likes/${noteId}`)
      } else {
        await api.post(`/likes/${noteId}`)
      }
      
      setIsLiked(!isLiked)
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    } catch (error: any) {
      console.error('いいね操作エラー:', error)
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        alert('操作に失敗しました。')
      }
    }
  }

  const handleFavorite = async () => {
    const token = TokenUtil.getToken()
    if (!token || !noteId) {
      if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
        navigate('/login')
      }
      return
    }

    try {
      if (isFavorited) {
        await api.delete(`/favorites/${noteId}`)
      } else {
        await api.post(`/favorites/${noteId}`)
      }
      
      setIsFavorited(!isFavorited)
      setFavoritesCount(prev => isFavorited ? prev - 1 : prev + 1)
    } catch (error: any) {
      console.error('お気に入り操作エラー:', error)
      if (error.response?.status === 401) {
        if (window.confirm('ログインが必要です。ログインページに移動しますか？')) {
          navigate('/login')
        }
      } else {
        alert('操作に失敗しました。')
      }
    }
  }

  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const formatImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `http://localhost:8080${url}`
    return `http://localhost:8080/uploads/${url}`
  }

  if (loading) {
    return (
      <div style={{ paddingTop: '65px', textAlign: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <p>ノートを読み込み中...</p>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div style={{ paddingTop: '65px', minHeight: 'calc(100vh - 80px)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <div style={{
            background: '#fed7d7',
            color: '#c53030',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {error || 'ノートが見つかりません。'}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/notes" className="btn-outline">ノート一覧に戻る</Link>
          </div>
        </div>
      </div>
    )
  }

  const createdAt = new Date(note.createdAt || '').toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const imageUrls = note.imageUrls && note.imageUrls.length > 0 
    ? note.imageUrls 
    : note.imageUrl 
      ? [note.imageUrl] 
      : []

  return (
    <>
      <div style={{ paddingTop: '65px', minHeight: 'calc(100vh - 80px)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <Link 
            to="/notes" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--brand)',
              fontWeight: 600,
              marginBottom: '20px',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '12px',
              transition: 'all 0.3s',
              textDecoration: 'none'
            }}
          >
            ← 戻る
          </Link>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#2d3748',
                marginBottom: '10px',
                lineHeight: 1.2
              }} dangerouslySetInnerHTML={{ __html: escapeHtml(note.title) }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                color: '#718096',
                fontSize: '0.95rem',
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--brand)' }}>
                  by {escapeHtml(note.username || '匿名')}
                </span>
                {note.location && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: 'var(--brand)',
                    fontWeight: 500
                  }}>
                    📍 {escapeHtml(note.location)}
                  </span>
                )}
                <span style={{ color: '#a0aec0' }}>{createdAt}</span>
              </div>
            </div>

            {imageUrls.length > 0 && (
              <div style={{ margin: '30px 0' }}>
                {imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={formatImageUrl(url)}
                    alt={`ノート画像 ${index + 1}`}
                    style={{
                      width: '100%',
                      borderRadius: '15px',
                      marginBottom: '15px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            <div style={{
              color: '#4a5568',
              lineHeight: 1.8,
              fontSize: '1.1rem',
              whiteSpace: 'pre-wrap',
              margin: '30px 0'
            }} dangerouslySetInnerHTML={{ __html: escapeHtml(note.content) }} />

            <div style={{
              display: 'flex',
              gap: '15px',
              alignItems: 'center',
              paddingTop: '30px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button
                onClick={handleLike}
                style={{
                  background: isLiked ? '#ff6b6b' : 'transparent',
                  border: `2px solid ${isLiked ? '#ff6b6b' : '#e2e8f0'}`,
                  color: isLiked ? '#fff' : '#64748b',
                  borderRadius: '20px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => {
                  if (!isLiked) {
                    ;(e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'
                    ;(e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLiked) {
                    ;(e.target as HTMLButtonElement).style.transform = 'translateY(0)'
                    ;(e.target as HTMLButtonElement).style.boxShadow = 'none'
                  }
                }}
              >
                ❤️ {likesCount}
              </button>
              <button
                onClick={handleFavorite}
                style={{
                  background: isFavorited ? '#ffd93d' : 'transparent',
                  border: `2px solid ${isFavorited ? '#ffd93d' : '#e2e8f0'}`,
                  color: isFavorited ? '#fff' : '#64748b',
                  borderRadius: '20px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => {
                  if (!isFavorited) {
                    ;(e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'
                    ;(e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isFavorited) {
                    ;(e.target as HTMLButtonElement).style.transform = 'translateY(0)'
                    ;(e.target as HTMLButtonElement).style.boxShadow = 'none'
                  }
                }}
              >
                ⭐ {favoritesCount}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default NotesDetail
