import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/layout/Footer'

const User = () => {
  const [activeTab, setActiveTab] = useState('notes')
  const [userInfo, setUserInfo] = useState(null)
  const [userNotes, setUserNotes] = useState([])
  const [favoriteNotes, setFavoriteNotes] = useState([])
  const [likedNotes, setLikedNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      navigate('/login')
      return
    }
    loadUserInfo()
    loadUserNotes()
  }, [])

  useEffect(() => {
    if (activeTab === 'favorites') {
      loadFavoriteNotes()
    } else if (activeTab === 'likes') {
      loadLikedNotes()
    }
  }, [activeTab])

  const loadUserInfo = async () => {
    try {
      const response = await api.get('/user/me')
      setUserInfo(response.data)
      setLoading(false)
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました', error)
      if (error.response?.status === 401) {
        navigate('/login')
      }
      setLoading(false)
    }
  }

  const loadUserNotes = async () => {
    try {
      const response = await api.get('/notes/my')
      setUserNotes(response.data)
    } catch (error) {
      console.error('ノート取得エラー:', error)
    }
  }

  const loadFavoriteNotes = async () => {
    try {
      const response = await api.get('/favorites/my')
      setFavoriteNotes(response.data)
    } catch (error) {
      console.error('お気に入り読み込みエラー:', error)
    }
  }

  const loadLikedNotes = async () => {
    try {
      const response = await api.get('/likes/my')
      setLikedNotes(response.data)
    } catch (error) {
      console.error('いいねした投稿読み込みエラー:', error)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルのみアップロードできます')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        if (response.data.avatarUrl) {
          setUserInfo({
            ...userInfo,
            avatarUrl: response.data.avatarUrl.startsWith('http') 
              ? response.data.avatarUrl 
              : `http://localhost:8080${response.data.avatarUrl}`
          })
        }
        alert('アバターが正常にアップロードされました')
      }
    } catch (error) {
      console.error('アップロードエラー:', error)
      alert('エラーが発生しました: ' + (error.message || '不明なエラー'))
    }

    event.target.value = ''
  }

  const handleRemoveFavorite = async (noteId) => {
    if (!confirm('お気に入りを解除しますか？')) return

    try {
      await api.delete(`/favorites/${noteId}`)
      setFavoriteNotes(favoriteNotes.filter(n => n.id !== noteId))
      alert('お気に入りを解除しました。')
    } catch (error) {
      console.error('お気に入り解除エラー:', error)
      alert('解除に失敗しました。')
    }
  }

  const handleRemoveLike = async (noteId) => {
    if (!confirm('いいねを解除しますか？')) return

    try {
      await api.delete(`/likes/${noteId}`)
      setLikedNotes(likedNotes.filter(n => n.id !== noteId))
      alert('いいねを解除しました。')
    } catch (error) {
      console.error('いいね解除エラー:', error)
      alert('解除に失敗しました。')
    }
  }

  const formatNumber = (num) => {
    if (!num || num === 0) return '0'
    if (num >= 10000) {
      const wan = num / 10000
      return (wan % 1 === 0 ? wan.toString() : wan.toFixed(1)) + '万'
    } else if (num >= 1000) {
      const qian = num / 1000
      return (qian % 1 === 0 ? qian.toString() : qian.toFixed(1)) + '千'
    }
    return num.toString()
  }

  const viewNoteDetail = (id) => {
    navigate(`/notes-detail?id=${id}`)
  }

  const renderNoteCard = (note, showRemove = false, onRemove = null) => {
    const content = note.content || ''
    const shortContent = content.length > 80 ? content.slice(0, 80) + '…' : content

    return (
      <div key={note.id} className="card" style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.1)'
      }}
      onClick={() => viewNoteDetail(note.id)}>
        <img 
          src={note.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'} 
          alt={note.title || ''}
          style={{
            width: '100%',
            height: '180px',
            objectFit: 'cover'
          }}
        />
        <div style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '17px', margin: '6px 0' }}>{note.title || '無題'}</h3>
          <p style={{ fontSize: '14px', color: '#777', marginBottom: '16px' }}>{shortContent}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="read-btn"
              onClick={(e) => {
                e.stopPropagation()
                viewNoteDetail(note.id)
              }}
              style={{
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                textAlign: 'center',
                lineHeight: '60px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              read<br/>more
            </button>
            {showRemove && onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(note.id)
                }}
                style={{
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#ff5252'}
                onMouseLeave={(e) => e.target.style.background = '#ff6b6b'}
              >
                💔 {activeTab === 'favorites' ? '解除' : 'いいね解除'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!userInfo) {
    return null
  }

  const displayName = userInfo.firstName || userInfo.lastName
    ? [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ')
    : userInfo.username || 'ユーザー'

  const avatarUrl = userInfo.avatarUrl 
    ? (userInfo.avatarUrl.startsWith('http') ? userInfo.avatarUrl : `http://localhost:8080${userInfo.avatarUrl}`)
    : 'https://cdn-icons-png.flaticon.com/512/616/616408.png'

  return (
    <>
      {/* Header Section */}
      <section style={{
        background: 'var(--brand)',
        color: '#fff',
        textAlign: 'center',
        padding: '60px 20px 100px',
        position: 'relative'
      }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid #fff',
              marginBottom: '12px',
              background: '#fff'
            }}
          />
          <label
            htmlFor="avatarUpload"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--brand)',
              color: 'white',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <span style={{ fontSize: '18px' }}>📷</span>
          </label>
          <input
            type="file"
            id="avatarUpload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{displayName}</div>
        <div style={{ fontSize: '14px', color: '#fefefe', opacity: 0.9 }}>
          ID: {userInfo.id || '---'} ｜ 所在地：{userInfo.location || '日本'}
        </div>
        <div style={{ fontSize: '14px', color: '#fefefe', opacity: 0.9, marginTop: '4px' }}>
          Travel in Japan
        </div>
        <div style={{ fontSize: '14px', color: '#fefefe', opacity: 0.9, marginTop: '4px' }}>
          {userInfo.notesCount || 0}ノート　{formatNumber(userInfo.likesCount || 0)}いいね　{formatNumber(userInfo.favoritesCount || 0)}お気に入り
        </div>
      </section>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        position: 'relative',
        top: '-40px'
      }}>
        {['notes', 'favorites', 'likes'].map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--brand)' : '#fff',
              color: activeTab === tab ? '#fff' : '#333',
              border: activeTab === tab ? 'none' : '1px solid #ddd',
              borderRadius: '16px',
              boxShadow: '0 4px 18px rgba(0,0,0,0.1)',
              padding: '12px 40px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {tab === 'notes' ? 'Notes' : tab === 'favorites' ? 'Favorites' : 'Likes'}
          </div>
        ))}
        <Link
          to="/profile-edit"
          style={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '16px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.1)',
            padding: '12px 40px',
            fontSize: '18px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textDecoration: 'none',
            color: '#333'
          }}
        >
          Account
        </Link>
      </div>

      {/* Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '30px',
        maxWidth: '1100px',
        margin: '60px auto',
        padding: '0 20px'
      }}>
        {activeTab === 'notes' && (
          userNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'gray', gridColumn: '1 / -1' }}>
              まだ投稿がありません。
            </p>
          ) : (
            userNotes.map(note => renderNoteCard(note))
          )
        )}

        {activeTab === 'favorites' && (
          favoriteNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'gray', gridColumn: '1 / -1' }}>
              お気に入りはまだありません。
            </p>
          ) : (
            favoriteNotes.map(note => renderNoteCard(note, true, handleRemoveFavorite))
          )
        )}

        {activeTab === 'likes' && (
          likedNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'gray', gridColumn: '1 / -1' }}>
              いいねした投稿はまだありません。
            </p>
          ) : (
            likedNotes.map(note => renderNoteCard(note, true, handleRemoveLike))
          )
        )}
      </div>

      {/* Logout */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <button
          onClick={() => {
            TokenUtil.clearToken()
            navigate('/login')
          }}
          style={{
            background: 'var(--brand)',
            border: 'none',
            color: '#fff',
            borderRadius: '999px',
            padding: '10px 24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--brand-dark)'}
          onMouseLeave={(e) => e.target.style.background = 'var(--brand)'}
        >
          ログアウト
        </button>
      </div>

      <Footer />
    </>
  )
}

export default User
