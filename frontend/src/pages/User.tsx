import { useState, useEffect, ChangeEvent, MouseEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import type { UserDTO, NotesDTO, FileUploadResponse } from '../types'
import '../styles/pages/user.css'

type TabType = 'notes' | 'favorites' | 'likes'

const User = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notes')
  const [userInfo, setUserInfo] = useState<UserDTO | null>(null)
  const [userNotes, setUserNotes] = useState<NotesDTO[]>([])
  const [favoriteNotes, setFavoriteNotes] = useState<NotesDTO[]>([])
  const [likedNotes, setLikedNotes] = useState<NotesDTO[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      navigate('/login')
      return
    }
    loadUserInfo()
    loadUserNotes()
  }, [navigate])

  useEffect(() => {
    if (activeTab === 'favorites') {
      loadFavoriteNotes()
    } else if (activeTab === 'likes') {
      loadLikedNotes()
    }
  }, [activeTab])

  const loadUserInfo = async () => {
    try {
      const response = await api.get<UserDTO>('/user/me')
      setUserInfo(response.data)
      setLoading(false)
    } catch (error: any) {
      console.error('ユーザー情報の取得に失敗しました', error)
      if (error.response?.status === 401) {
        navigate('/login')
      }
      setLoading(false)
    }
  }

  const loadUserNotes = async () => {
    try {
      const response = await api.get<NotesDTO[]>('/notes/my')
      setUserNotes(response.data || [])
    } catch (error: any) {
      console.error('ノート取得エラー:', error)
    }
  }

  const loadFavoriteNotes = async () => {
    try {
      const response = await api.get<NotesDTO[]>('/favorites/my')
      setFavoriteNotes(response.data || [])
    } catch (error: any) {
      console.error('お気に入り読み込みエラー:', error)
    }
  }

  const loadLikedNotes = async () => {
    try {
      const response = await api.get<NotesDTO[]>('/likes/my')
      setLikedNotes(response.data || [])
    } catch (error: any) {
      console.error('いいねした投稿読み込みエラー:', error)
    }
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
      const response = await api.post<FileUploadResponse>('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data && 'url' in response.data) {
        const avatarUrl = response.data.url
        if (userInfo) {
          setUserInfo({
            ...userInfo,
            avatarUrl: avatarUrl.startsWith('http') 
              ? avatarUrl 
              : `http://localhost:8080${avatarUrl}`
          })
        }
        alert('アバターが正常にアップロードされました')
      }
    } catch (error: any) {
      console.error('アップロードエラー:', error)
      alert('エラーが発生しました: ' + (error.message || '不明なエラー'))
    }

    event.target.value = ''
  }

  const handleRemoveFavorite = async (noteId: number) => {
    if (!window.confirm('お気に入りを解除しますか？')) return

    try {
      await api.delete(`/favorites/${noteId}`)
      setFavoriteNotes(favoriteNotes.filter(n => n.id !== noteId))
      alert('お気に入りを解除しました。')
    } catch (error: any) {
      console.error('お気に入り解除エラー:', error)
      alert('解除に失敗しました。')
    }
  }

  const handleRemoveLike = async (noteId: number) => {
    if (!window.confirm('いいねを解除しますか？')) return

    try {
      await api.delete(`/likes/${noteId}`)
      setLikedNotes(likedNotes.filter(n => n.id !== noteId))
      alert('いいねを解除しました。')
    } catch (error: any) {
      console.error('いいね解除エラー:', error)
      alert('解除に失敗しました。')
    }
  }

  const formatNumber = (num: number | null | undefined): string => {
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

  const viewNoteDetail = (id: number) => {
    navigate(`/notes-detail?id=${id}`)
  }

  const renderNoteCard = (note: NotesDTO, showRemove = false, onRemove: ((id: number) => void) | null = null) => {
    const content = note.content || ''
    const shortContent = content.length > 80 ? content.slice(0, 80) + '…' : content

    const imageUrl = note.imageUrl 
      ? (note.imageUrl.startsWith('http') ? note.imageUrl : `http://localhost:8080${note.imageUrl}`)
      : 'https://via.placeholder.com/400x200?text=No+Image'

    return (
      <div key={note.id} className="user-page-note-card" onClick={() => viewNoteDetail(note.id)}>
        <img 
          src={imageUrl} 
          alt={note.title || ''}
        />
        <div className="user-page-note-card-content">
          <h3 className="user-page-note-card-title">{note.title || '無題'}</h3>
          <p className="user-page-note-card-text">{shortContent}</p>
          <div className="user-page-note-card-footer">
            <button
              className="user-page-read-btn"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                viewNoteDetail(note.id)
              }}
            >
              read<br/>more
            </button>
            {showRemove && onRemove && (
              <button
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation()
                  onRemove(note.id)
                }}
                className="user-page-remove-btn"
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
      <div style={{ paddingTop: '65px', textAlign: 'center' }}>
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
      <section className="user-page-header">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={avatarUrl}
            alt="avatar"
            className="user-page-avatar"
          />
          <label
            htmlFor="avatarUpload"
            className="user-page-avatar-upload-btn"
          >
            <span>📷</span>
          </label>
          <input
            type="file"
            id="avatarUpload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="user-page-name">{displayName}</div>
        <div className="user-page-info">
          ID: {userInfo.id || '---'} ｜ 所在地：{userInfo.location || '日本'}
        </div>
        <div className="user-page-info" style={{ marginTop: '4px' }}>
          Travel in Japan
        </div>
        <div className="user-page-stats">
          {userInfo.notesCount || 0}ノート　{formatNumber(userInfo.likesCount || 0)}いいね　{formatNumber(userInfo.favoritesCount || 0)}お気に入り
        </div>
      </section>

      {/* Tabs */}
      <div className="user-page-tabs">
        {(['notes', 'favorites', 'likes'] as TabType[]).map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`user-page-tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'notes' ? 'Notes' : tab === 'favorites' ? 'Favorites' : 'Likes'}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="user-page-content">
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

      <Footer />
      <ScrollToTop />
    </>
  )
}

export default User
