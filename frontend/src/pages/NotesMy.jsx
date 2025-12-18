import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import NoteCard from '../components/notes/NoteCard'
import Footer from '../components/layout/Footer'

const NotesMy = () => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [userRole, setUserRole] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      alert('ログインしてください')
      navigate('/login')
      return
    }

    // 检查用户角色
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserRole(payload.role || '')
    } catch (e) {
      console.error('トークン解析エラー:', e)
    }

    loadMyNotes()
  }, [navigate])

  const loadMyNotes = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/notes/my')
      setNotes(response.data || [])
    } catch (error) {
      console.error('ノート読み込みエラー:', error)
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        setError('ノートの読み込みに失敗しました。後でもう一度お試しください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (noteId) => {
    navigate(`/notes-create.html?edit=${noteId}`)
  }

  const handleDeleteClick = (noteId) => {
    setNoteToDelete(noteId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return

    try {
      await api.delete(`/notes/${noteToDelete}`)
      setDeleteModalOpen(false)
      setNoteToDelete(null)
      await loadMyNotes()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました。後でもう一度お試しください。')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setNoteToDelete(null)
  }

  const stats = {
    totalNotes: notes.length,
    approvedNotes: notes.filter(n => n.isApproved).length,
    pendingNotes: notes.filter(n => !n.isApproved).length,
    totalLikes: notes.reduce((sum, n) => sum + (n.likesCount || 0), 0)
  }

  return (
    <>
      <div className="notes-my-page">
        <div className="notes-my-container">
          <div className="notes-my-header">
            <h1 className="notes-my-title">📝 マイノート</h1>
            <p className="notes-my-subtitle">
              あなたの旅行ノートを管理
            </p>
            <div className="notes-my-header-actions">
              <Link to="/notes" className="btn">
                📖 ノートを見る
              </Link>
              <Link to="/notes-create.html" className="btn">
                📝 新しいノートを投稿
              </Link>
              {userRole === 'ADMIN' && (
                <Link to="/notes-admin.html" className="btn-outline">
                  ⚒ 管理者ノート審査
                </Link>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="notes-my-stats">
            <div className="notes-my-stat-card">
              <div className="notes-my-stat-value">{stats.totalNotes}</div>
              <div className="notes-my-stat-label">総ノート数</div>
            </div>
            <div className="notes-my-stat-card">
              <div className="notes-my-stat-value">{stats.approvedNotes}</div>
              <div className="notes-my-stat-label">公開済み</div>
            </div>
            <div className="notes-my-stat-card">
              <div className="notes-my-stat-value">{stats.pendingNotes}</div>
              <div className="notes-my-stat-label">審査中</div>
            </div>
            <div className="notes-my-stat-card">
              <div className="notes-my-stat-value">{stats.totalLikes}</div>
              <div className="notes-my-stat-label">総いいね数</div>
            </div>
          </div>

          {/* 笔记列表 */}
          <div>
            <h2 className="notes-my-section-title">📚 マイノート一覧</h2>

            {loading ? (
              <div className="notes-my-loading">
                ノートを読み込み中...
              </div>
            ) : error ? (
              <div className="notes-my-error">
                {error}
              </div>
            ) : notes.length === 0 ? (
              <div className="notes-my-empty">
                <h3>まだノートがありません</h3>
                <p>
                  あなたの初めての旅行ノートを投稿してみましょう！
                </p>
                <Link to="/notes-create.html" className="btn">
                  ノートを投稿
                </Link>
              </div>
            ) : (
              <div className="notes-my-grid">
                {notes.map(note => (
                  <div key={note.id} className="notes-my-card">
                    <div className="notes-my-card-header">
                      <h3 className="notes-my-card-title">{note.title}</h3>
                      <div className={`notes-my-card-status ${note.isApproved ? 'approved' : 'pending'}`}>
                        {note.isApproved ? '公開済み' : '審査中'}
                      </div>
                    </div>

                    {(() => {
                      // 优先使用 imageUrls 数组，否则使用 imageUrl
                      let firstImageUrl = null
                      
                      if (note.imageUrls && Array.isArray(note.imageUrls) && note.imageUrls.length > 0) {
                        firstImageUrl = note.imageUrls[0]
                      } else if (note.imageUrl) {
                        // 尝试解析 JSON 数组
                        try {
                          const parsed = JSON.parse(note.imageUrl)
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            firstImageUrl = parsed[0]
                          } else {
                            firstImageUrl = note.imageUrl
                          }
                        } catch {
                          firstImageUrl = note.imageUrl
                        }
                      }
                      
                      if (!firstImageUrl) return null
                      
                      const imageSrc = firstImageUrl.startsWith('http') 
                        ? firstImageUrl 
                        : firstImageUrl.startsWith('/') 
                          ? `http://localhost:8080${firstImageUrl}`
                          : `http://localhost:8080/uploads/${firstImageUrl}`
                      
                      return (
                        <img
                          src={imageSrc}
                          alt={note.title}
                          className="notes-my-card-image"
                        />
                      )
                    })()}

                    <div className="notes-my-card-body">
                      <div className="notes-my-card-content">
                        {note.content}
                      </div>

                      {note.location && (
                        <div className="notes-my-card-location">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>{note.location}</span>
                        </div>
                      )}

                      <div className="notes-my-card-meta">
                        <div className="notes-my-card-stats">
                          <span>❤️ {note.likesCount || 0}</span>
                          <span>⭐ {note.favoritesCount || 0}</span>
                        </div>
                        <div>
                          {new Date(note.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>

                      <div className="notes-my-card-actions">
                        <button
                          onClick={() => handleEdit(note.id)}
                          className="notes-my-card-btn notes-my-card-btn-edit"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteClick(note.id)}
                          className="notes-my-card-btn notes-my-card-btn-delete"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 删除确认模态框 */}
      {deleteModalOpen && (
        <div
          className="notes-my-modal-overlay"
          onClick={handleDeleteCancel}
        >
          <div
            className="notes-my-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="notes-my-modal-title">削除の確認</h3>
            <p className="notes-my-modal-message">
              このノートを削除しますか？ この操作は元に戻せません。
            </p>
            <div className="notes-my-modal-actions">
              <button
                onClick={handleDeleteCancel}
                className="notes-my-modal-btn notes-my-modal-btn-cancel"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="notes-my-modal-btn notes-my-modal-btn-confirm"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

export default NotesMy
