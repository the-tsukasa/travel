import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/Footer'

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
      alert('ノートを削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました。後でもう一度お試しください。')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setNoteToDelete(null)
  }

  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text || ''
    return div.innerHTML
  }

  const formatImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `http://localhost:8080${url}`
    return `http://localhost:8080/uploads/${url}`
  }

  const stats = {
    totalNotes: notes.length,
    approvedNotes: notes.filter(n => n.isApproved).length,
    pendingNotes: notes.filter(n => !n.isApproved).length,
    totalLikes: notes.reduce((sum, n) => sum + (n.likesCount || 0), 0)
  }

  return (
    <>
      <div style={{
        background: 'var(--bg)',
        minHeight: 'calc(100vh - 80px)',
        paddingTop: '100px',
        paddingBottom: '40px'
      }}>
        <div className="container" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              marginBottom: '10px',
              background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>📝 マイノート</h1>
            <p style={{ color: '#718096', fontSize: '1.1rem', marginBottom: '20px' }}>
              あなたの旅行ノートを管理
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '15px',
              margin: '20px 0'
            }}>
              <Link to="/notes" className="btn" style={{ textDecoration: 'none' }}>
                📖 ノートを見る
              </Link>
              <Link to="/notes-create.html" className="btn" style={{ textDecoration: 'none' }}>
                📝 新しいノートを投稿
              </Link>
              {userRole === 'ADMIN' && (
                <Link to="/notes-admin.html" className="btn-outline" style={{ textDecoration: 'none' }}>
                  ⚒ 管理者ノート審査
                </Link>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand)', marginBottom: '8px' }}>
                {stats.totalNotes}
              </div>
              <div style={{ color: '#718096', fontSize: '0.9rem' }}>総ノート数</div>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#48bb78', marginBottom: '8px' }}>
                {stats.approvedNotes}
              </div>
              <div style={{ color: '#718096', fontSize: '0.9rem' }}>公開済み</div>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ed8936', marginBottom: '8px' }}>
                {stats.pendingNotes}
              </div>
              <div style={{ color: '#718096', fontSize: '0.9rem' }}>審査中</div>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f56565', marginBottom: '8px' }}>
                {stats.totalLikes}
              </div>
              <div style={{ color: '#718096', fontSize: '0.9rem' }}>総いいね数</div>
            </div>
          </div>

          {/* 笔记列表 */}
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '20px',
              color: '#2d3748'
            }}>📚 マイノート一覧</h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
                ノートを読み込み中...
              </div>
            ) : error ? (
              <div style={{
                background: '#fed7d7',
                color: '#c53030',
                padding: '15px',
                borderRadius: '10px',
                margin: '20px 0'
              }}>
                {error}
              </div>
            ) : notes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginBottom: '10px', color: '#2d3748' }}>まだノートがありません</h3>
                <p style={{ color: '#718096', marginBottom: '20px' }}>
                  あなたの初めての旅行ノートを投稿してみましょう！
                </p>
                <Link to="/notes-create.html" className="btn" style={{ textDecoration: 'none' }}>
                  ノートを投稿
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px'
              }}>
                {notes.map(note => (
                  <div
                    key={note.id}
                    style={{
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
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          marginBottom: '8px',
                          color: '#2d3748'
                        }} dangerouslySetInnerHTML={{ __html: escapeHtml(note.title) }} />
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: note.isApproved ? '#c6f6d5' : '#fed7d7',
                        color: note.isApproved ? '#22543d' : '#991b1b'
                      }}>
                        {note.isApproved ? '公開済み' : '審査中'}
                      </div>
                    </div>

                    {note.imageUrl && (
                      <img
                        src={formatImageUrl(note.imageUrl)}
                        alt="ノート画像"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    )}

                    <div style={{ padding: '16px' }}>
                      <div style={{
                        color: '#4a5568',
                        lineHeight: 1.6,
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
                        marginBottom: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{ color: '#718096', fontSize: '0.9rem' }}>
                          <span>❤️ {note.likesCount || 0}</span>
                          <span style={{ marginLeft: '15px' }}>⭐ {note.favoritesCount || 0}</span>
                        </div>
                        <div style={{ color: '#718096', fontSize: '0.9rem' }}>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '10px'
                      }}>
                        <button
                          onClick={() => handleEdit(note.id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: 'var(--brand)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--brand-dark)'}
                          onMouseLeave={(e) => e.target.style.background = 'var(--brand)'}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteClick(note.id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#f56565',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#e53e3e'}
                          onMouseLeave={(e) => e.target.style.background = '#f56565'}
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
          onClick={handleDeleteCancel}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '20px',
              color: '#2d3748'
            }}>削除の確認</h3>
            <p style={{
              color: '#4a5568',
              marginBottom: '30px',
              lineHeight: 1.6
            }}>
              このノートを削除しますか？ この操作は元に戻せません。
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '12px 24px',
                  background: '#f56565',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
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
