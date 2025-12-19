import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import NoteCard from '../components/notes/NoteCard'
import Footer from '../components/layout/Footer'

const NotesMy = () => {
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [userRole, setUserRole] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, DRAFT, PENDING, PUBLISHED, REJECTED, PRIVATE
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

  // 根据状态过滤笔记
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredNotes(notes)
    } else {
      setFilteredNotes(notes.filter(note => note.status === statusFilter))
    }
  }, [notes, statusFilter])

  // 提交审核
  const handleSubmitForReview = async (noteId) => {
    try {
      const response = await api.post(`/notes/${noteId}/submit`)
      if (response.status === 200) {
        alert('ノートが審査に提出されました！')
        await loadMyNotes()
      }
    } catch (error) {
      console.error('提出エラー:', error)
      alert(error.response?.data?.message || 'ノートの提出に失敗しました。')
    }
  }

  const handleEdit = (noteId) => {
    navigate(`/notes-create?edit=${noteId}`)
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
    draftNotes: notes.filter(n => n.status === 'DRAFT').length,
    pendingNotes: notes.filter(n => n.status === 'PENDING').length,
    publishedNotes: notes.filter(n => n.status === 'PUBLISHED').length,
    rejectedNotes: notes.filter(n => n.status === 'REJECTED').length,
    privateNotes: notes.filter(n => n.status === 'PRIVATE').length,
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
              <Link to="/notes-create" className="btn">
                📝 新しいノートを投稿
              </Link>
              {/* 管理员按钮已移至导航栏用户菜单 */}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="notes-my-stats">
            <div className="notes-my-stat-card" onClick={() => setStatusFilter('ALL')} style={{ cursor: 'pointer' }}>
              <div className="notes-my-stat-value">{stats.totalNotes}</div>
              <div className="notes-my-stat-label">総ノート数</div>
            </div>
            <div className="notes-my-stat-card" onClick={() => setStatusFilter('DRAFT')} style={{ cursor: 'pointer' }}>
              <div className="notes-my-stat-value">{stats.draftNotes}</div>
              <div className="notes-my-stat-label">草稿</div>
            </div>
            <div className="notes-my-stat-card" onClick={() => setStatusFilter('PENDING')} style={{ cursor: 'pointer' }}>
              <div className="notes-my-stat-value">{stats.pendingNotes}</div>
              <div className="notes-my-stat-label">審査中</div>
            </div>
            <div className="notes-my-stat-card" onClick={() => setStatusFilter('PUBLISHED')} style={{ cursor: 'pointer' }}>
              <div className="notes-my-stat-value">{stats.publishedNotes}</div>
              <div className="notes-my-stat-label">公開済み</div>
            </div>
            <div className="notes-my-stat-card" onClick={() => setStatusFilter('REJECTED')} style={{ cursor: 'pointer' }}>
              <div className="notes-my-stat-value">{stats.rejectedNotes}</div>
              <div className="notes-my-stat-label">差し戻し</div>
            </div>
            <div className="notes-my-stat-card">
              <div className="notes-my-stat-value">{stats.totalLikes}</div>
              <div className="notes-my-stat-label">総いいね数</div>
            </div>
          </div>

          {/* 状态过滤 */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['ALL', 'DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'PRIVATE'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #ddd',
                  backgroundColor: statusFilter === status ? '#1976d2' : '#fff',
                  color: statusFilter === status ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {status === 'ALL' && 'すべて'}
                {status === 'DRAFT' && '📝 草稿'}
                {status === 'PENDING' && '⏳ 審査中'}
                {status === 'PUBLISHED' && '✅ 公開済み'}
                {status === 'REJECTED' && '❌ 差し戻し'}
                {status === 'PRIVATE' && '🔒 非公開'}
              </button>
            ))}
          </div>

          {/* 笔记列表 */}
          <div>
            <h2 className="notes-my-section-title">
              📚 マイノート一覧
              {statusFilter !== 'ALL' && ` (${filteredNotes.length}件)`}
            </h2>

            {loading ? (
              <div className="notes-my-loading">
                ノートを読み込み中...
              </div>
            ) : error ? (
              <div className="notes-my-error">
                {error}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="notes-my-empty">
                <h3>まだノートがありません</h3>
                <p>
                  あなたの初めての旅行ノートを投稿してみましょう！
                </p>
                <Link to="/notes-create" className="btn">
                  ノートを投稿
                </Link>
              </div>
            ) : (
              <div className="notes-my-grid">
                {filteredNotes.map(note => (
                  <div key={note.id} className="notes-my-card">
                    <div className="notes-my-card-header">
                      <h3 className="notes-my-card-title">{note.title}</h3>
                      <div className={`notes-my-card-status ${note.status?.toLowerCase() || 'draft'}`} style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 
                          note.status === 'DRAFT' ? '#e3f2fd' :
                          note.status === 'PENDING' ? '#fff3e0' :
                          note.status === 'PUBLISHED' ? '#e8f5e9' :
                          note.status === 'REJECTED' ? '#ffebee' :
                          note.status === 'PRIVATE' ? '#f3e5f5' : '#f5f5f5',
                        color: 
                          note.status === 'DRAFT' ? '#1976d2' :
                          note.status === 'PENDING' ? '#f57c00' :
                          note.status === 'PUBLISHED' ? '#388e3c' :
                          note.status === 'REJECTED' ? '#c62828' :
                          note.status === 'PRIVATE' ? '#7b1fa2' : '#666'
                      }}>
                        {note.status === 'DRAFT' && '📝 草稿'}
                        {note.status === 'PENDING' && '⏳ 審査中'}
                        {note.status === 'PUBLISHED' && '✅ 公開済み'}
                        {note.status === 'REJECTED' && '❌ 差し戻し'}
                        {note.status === 'PRIVATE' && '🔒 非公開'}
                        {!note.status && (note.isApproved ? '✅ 公開済み' : '⏳ 審査中')}
                      </div>
                    </div>
                    
                    {/* 退回理由显示 */}
                    {note.status === 'REJECTED' && note.rejectReason && (
                      <div style={{
                        padding: '10px',
                        margin: '10px',
                        backgroundColor: '#ffebee',
                        border: '1px solid #ef5350',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#c62828'
                      }}>
                        <strong>📋 差し戻し理由：</strong>
                        <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>{note.rejectReason}</p>
                      </div>
                    )}

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

                      <div className="notes-my-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* 只有 DRAFT、REJECTED、PRIVATE 状态可以编辑 */}
                        {(note.status === 'DRAFT' || note.status === 'REJECTED' || note.status === 'PRIVATE' || !note.status) && (
                          <button
                            onClick={() => handleEdit(note.id)}
                            className="notes-my-card-btn notes-my-card-btn-edit"
                          >
                            編集
                          </button>
                        )}
                        
                        {/* 只有 DRAFT、REJECTED、PRIVATE 状态可以提交审核 */}
                        {(note.status === 'DRAFT' || note.status === 'REJECTED' || note.status === 'PRIVATE') && (
                          <button
                            onClick={() => handleSubmitForReview(note.id)}
                            className="notes-my-card-btn"
                            style={{ backgroundColor: '#1976d2', color: '#fff' }}
                          >
                            審査に提出
                          </button>
                        )}
                        
                        {/* PENDING 状态显示提示 */}
                        {note.status === 'PENDING' && (
                          <span style={{ 
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#f57c00',
                            backgroundColor: '#fff3e0',
                            borderRadius: '4px'
                          }}>
                            ⏳ 審査中
                          </span>
                        )}
                        
                        {/* PUBLISHED 状态显示提示 */}
                        {note.status === 'PUBLISHED' && (
                          <span style={{ 
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#388e3c',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '4px'
                          }}>
                            ✅ 公開中
                          </span>
                        )}
                        
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
