import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/Footer'

const NotesAdmin = () => {
  const [pendingNotes, setPendingNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [noteToReject, setNoteToReject] = useState(null)
  const [currentTab, setCurrentTab] = useState('pending')
  const [userInfo, setUserInfo] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    if (currentTab === 'pending') {
      loadPendingNotes()
    }
  }, [currentTab])

  const checkAdminAuth = async () => {
    const token = TokenUtil.getToken()
    if (!token) {
      alert('まずログインしてください。')
      navigate('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'ADMIN') {
        alert('アクセス権がありません。管理者のみがこのページを利用できます。')
        navigate('/notes')
        return
      }

      // 获取用户信息
      const response = await api.get('/user/me')
      setUserInfo(response.data)
      setLoading(false)
    } catch (error) {
      console.error('認証エラー:', error)
      TokenUtil.clearToken()
      alert('ログイン情報の有効期限が切れました。再度ログインしてください。')
      navigate('/login')
    }
  }

  const loadPendingNotes = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/admin/notes/pending')
      setPendingNotes(response.data || [])
    } catch (error) {
      console.error('ノート読み込みエラー:', error)
      if (error.response?.status === 403) {
        setError('アクセス権がありません。')
        navigate('/notes')
      } else {
        setError('承認待ちノートの読み込みに失敗しました。時間をおいて再試行してください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (noteId) => {
    if (!confirm('このノートを承認しますか？')) return

    try {
      await api.post(`/admin/notes/${noteId}/approve`)
      alert('ノートを承認しました。')
      loadPendingNotes()
    } catch (error) {
      console.error('承認エラー:', error)
      alert('承認に失敗しました。')
    }
  }

  const handleRejectClick = (noteId) => {
    setNoteToReject(noteId)
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!noteToReject) return

    try {
      await api.delete(`/admin/notes/${noteToReject}/reject`)
      setRejectModalOpen(false)
      setNoteToReject(null)
      alert('ノートを拒否しました。')
      loadPendingNotes()
    } catch (error) {
      console.error('拒否エラー:', error)
      alert('拒否処理に失敗しました。')
    }
  }

  const handleViewDetail = (noteId) => {
    navigate(`/notes-detail.html?id=${noteId}`)
  }

  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text || ''
    return div.innerHTML
  }

  if (loading && !userInfo) {
    return (
      <div style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  const stats = {
    totalNotes: pendingNotes.length,
    pendingNotes: pendingNotes.length,
    approvedNotes: 0, // 需要从API获取
    rejectedNotes: 0  // 需要从API获取
  }

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: 'calc(100vh - 80px)',
        paddingTop: '100px',
        paddingBottom: '40px'
      }}>
        <div className="container" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h1 style={{
              color: '#4a5568',
              fontSize: '2.5rem',
              marginBottom: '10px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>🛠️ ノート管理</h1>
            <p style={{ color: '#718096', fontSize: '1.1rem', marginBottom: '20px' }}>
              管理者用ダッシュボード - ユーザー投稿のノートを確認・管理します
            </p>
            {userInfo && (
              <div style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '2px solid #ffc107',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#856404', marginBottom: '10px' }}>
                  管理者：{userInfo.username}
                </h3>
                <p style={{ color: '#856404' }}>権限：{userInfo.role}</p>
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              margin: '20px 0',
              flexWrap: 'wrap'
            }}>
              <Link to="/notes" className="btn" style={{ textDecoration: 'none' }}>
                ノート一覧
              </Link>
              <Link to="/admin.html" className="btn-outline" style={{ textDecoration: 'none' }}>
                管理画面
              </Link>
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
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#667eea', marginBottom: '8px' }}>
                {stats.totalNotes}
              </div>
              <div style={{ color: '#718096', fontSize: '0.9rem' }}>ノート総数</div>
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
              <div style={{ color: '#718096', fontSize: '0.9rem' }}>承認待ち</div>
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
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#e53e3e', marginBottom: '8px' }}>
                {stats.rejectedNotes}
              </div>
              <div style={{ color: '#718096', fontSize: '0.9rem' }}>拒否済み</div>
            </div>
          </div>

          {/* 标签页 */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '30px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <button
                onClick={() => setCurrentTab('pending')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: currentTab === 'pending' ? '#667eea' : 'transparent',
                  color: currentTab === 'pending' ? '#fff' : '#4a5568',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: currentTab === 'pending' ? '3px solid #667eea' : '3px solid transparent',
                  transition: 'all 0.3s'
                }}
              >
                承認待ち
              </button>
              <button
                onClick={() => setCurrentTab('all')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: currentTab === 'all' ? '#667eea' : 'transparent',
                  color: currentTab === 'all' ? '#fff' : '#4a5568',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: currentTab === 'all' ? '3px solid #667eea' : '3px solid transparent',
                  transition: 'all 0.3s'
                }}
              >
                すべてのノート
              </button>
            </div>

            {/* 待审核列表 */}
            {currentTab === 'pending' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', color: '#2d3748' }}>
                  📋 承認待ちノート
                </h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
                    承認待ちノートを読み込み中...
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
                ) : pendingNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
                    承認待ちのノートはありません。
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      background: '#fff'
                    }}>
                      <thead>
                        <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#4a5568' }}>タイトル</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#4a5568' }}>投稿者</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#4a5568' }}>内容プレビュー</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#4a5568' }}>作成日</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#4a5568' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingNotes.map(note => (
                          <tr key={note.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{
                                fontWeight: 600,
                                color: '#2d3748',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={note.title}>
                                {escapeHtml(note.title)}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#667eea', fontWeight: 500 }}>
                              {escapeHtml(note.username)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#4a5568'
                              }} title={note.content}>
                                {escapeHtml(note.content)}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#718096', fontSize: '0.9rem' }}>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  onClick={() => handleApprove(note.id)}
                                  style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    background: '#48bb78',
                                    color: 'white',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  承認
                                </button>
                                <button
                                  onClick={() => handleRejectClick(note.id)}
                                  style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    background: '#e53e3e',
                                    color: 'white',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  拒否
                                </button>
                                <button
                                  onClick={() => handleViewDetail(note.id)}
                                  style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    background: '#667eea',
                                    color: 'white',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  詳細
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 所有笔记标签页 */}
            {currentTab === 'all' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', color: '#2d3748' }}>
                  📚 全ノート一覧
                </h3>
                <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
                  全ノート機能は開発中です。
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 拒绝确认模态框 */}
      {rejectModalOpen && (
        <div
          onClick={() => {
            setRejectModalOpen(false)
            setNoteToReject(null)
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              margin: '5% auto',
              padding: '30px',
              borderRadius: '20px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#4a5568'
              }}>拒否の確認</h3>
              <span
                onClick={() => {
                  setRejectModalOpen(false)
                  setNoteToReject(null)
                }}
                style={{
                  color: '#aaa',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ×
              </span>
            </div>
            <p style={{ color: '#4a5568', lineHeight: 1.6, marginBottom: '30px' }}>
              このノートを拒否しますか？この操作は取り消せません。
            </p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setRejectModalOpen(false)
                  setNoteToReject(null)
                }}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: '#e2e8f0',
                  color: '#4a5568',
                  transition: 'all 0.3s ease'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleRejectConfirm}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: '#e53e3e',
                  color: 'white',
                  transition: 'all 0.3s ease'
                }}
              >
                拒否する
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

export default NotesAdmin
