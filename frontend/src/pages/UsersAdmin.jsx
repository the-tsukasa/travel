import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import '../styles/pages/users-admin.css'

const UsersAdmin = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0
  })
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: 'USER',
    firstName: '',
    lastName: '',
    location: '',
    bio: '',
    address: '',
    password: ''
  })
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [sortBy, sortOrder])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, users])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

      const response = await api.get('/user/me')
      setUserInfo(response.data)
    } catch (error) {
      console.error('認証エラー:', error)
      TokenUtil.clearToken()
      alert('ログイン情報の有効期限が切れました。再度ログインしてください。')
      navigate('/login')
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/admin/users?sortBy=${sortBy}&sortOrder=${sortOrder}`)
      setUsers(response.data || [])
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error)
      if (error.response?.status === 403) {
        setError('アクセス権がありません。')
        navigate('/notes')
      } else {
        setError('ユーザーリストの読み込みに失敗しました。時間をおいて再試行してください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/users/stats')
      setStats(response.data)
    } catch (error) {
      console.error('統計データの読み込みエラー:', error)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // 搜索过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(filtered)
  }

  const handleViewDetail = (user) => {
    setSelectedUser(user)
    setDetailModalOpen(true)
  }

  const handleEditClick = (user) => {
    setSelectedUser(user)
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'USER',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      location: user.location || '',
      bio: user.bio || '',
      address: user.address || '',
      password: ''
    })
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const updateData = { ...editForm }
      // 如果密码为空，不发送密码字段
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password
      }

      await api.put(`/admin/users/${selectedUser.id}`, updateData)
      setSuccessMessage('ユーザー情報が正常に更新されました！')
      setEditModalOpen(false)
      await loadUsers()
      await loadStats()
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('更新エラー:', error)
      alert(error.response?.data?.message || 'ユーザー情報の更新に失敗しました。')
    }
  }

  const handleDeleteClick = (user) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    try {
      await api.delete(`/admin/users/${selectedUser.id}`)
      setSuccessMessage('ユーザーが正常に削除されました！')
      setDeleteModalOpen(false)
      setSelectedUser(null)
      await loadUsers()
      await loadStats()
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('削除エラー:', error)
      alert(error.response?.data?.message || 'ユーザーの削除に失敗しました。')
      setDeleteModalOpen(false)
    }
  }

  const handleLogout = () => {
    TokenUtil.clearToken()
    navigate('/login')
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const escapeHtml = (text) => {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  if (loading && users.length === 0) {
    return (
      <>
        <div style={{
          maxWidth: '1200px',
          margin: '100px auto',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ fontSize: '1.5rem', color: '#718096' }}>読み込み中...</p>
        </div>
      </>
    )
  }

  // 统计卡片组件（与 Admin 页面一致）
  const StatCard = ({ title, value, icon, color, link }) => {
    const content = (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        cursor: link ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (link && !isMobile) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (link && !isMobile) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: isMobile ? '12px' : '16px'
        }}>
          <span style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>{icon}</span>
          <h3 style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 600,
            color: '#4a5568',
            margin: 0
          }}>{title}</h3>
        </div>
        <div style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: 700,
          color: color,
          lineHeight: 1
        }}>{value}</div>
      </div>
    )

    if (link) {
      return <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link>
    }
    return content
  }

  return (
    <>
      <div style={{
        maxWidth: '1200px',
        margin: isMobile ? '20px auto' : '40px auto',
        padding: isMobile ? '16px' : '40px',
        minHeight: 'calc(100vh - 200px)',
        background: '#f7fafc'
      }}>
        {successMessage && (
          <div style={{
            background: 'linear-gradient(135deg, #48bb78, #38a169)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Header */}
        <div style={{
          marginBottom: isMobile ? '24px' : '40px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '20px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 700,
                marginBottom: '10px',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span>👥</span>
                <span>ユーザー管理</span>
              </h1>
              <p style={{
                color: '#718096',
                fontSize: isMobile ? '0.9rem' : '1.1rem'
              }}>
                システム内のすべてのユーザーを管理
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              width: isMobile ? '100%' : 'auto'
            }}>
              <Link 
                to="/admin" 
                style={{
                  padding: isMobile ? '12px 20px' : '10px 20px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#4a5568',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.borderColor = '#cbd5e0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                ← 管理ダッシュボード
              </Link>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '24px' : '40px'
        }}>
          <StatCard
            title="総ユーザー数"
            value={stats.totalUsers}
            icon="👥"
            color="#7b1fa2"
          />
          <StatCard
            title="管理者"
            value={stats.adminUsers}
            icon="🛠️"
            color="#667eea"
          />
          <StatCard
            title="一般ユーザー"
            value={stats.regularUsers}
            icon="👤"
            color="#48bb78"
          />
        </div>

        {/* 搜索和排序 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '16px' : '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ flex: 1, width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'auto' : '250px' }}>
              <input
                type="text"
                placeholder="ユーザー名、メール、名前で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: isMobile ? '16px' : '1rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1976d2'
                  e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: isMobile ? '100%' : 'auto',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <label style={{
                fontWeight: 600,
                color: '#4a5568',
                whiteSpace: 'nowrap',
                fontSize: isMobile ? '0.9rem' : '1rem',
                width: isMobile ? '100%' : 'auto'
              }}>
                並び替え：
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                style={{
                  padding: isMobile ? '14px 16px' : '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: isMobile ? '16px' : '1rem',
                  background: 'white',
                  cursor: 'pointer',
                  minWidth: isMobile ? '100%' : '200px',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="createdAt-desc">登録日（新しい順）</option>
                <option value="createdAt-asc">登録日（古い順）</option>
                <option value="username-asc">ユーザー名（昇順）</option>
                <option value="username-desc">ユーザー名（降順）</option>
                <option value="email-asc">メール（昇順）</option>
                <option value="email-desc">メール（降順）</option>
                <option value="role-asc">役割（昇順）</option>
                <option value="role-desc">役割（降順）</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        {loading ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: '#718096',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>読み込み中...</p>
          </div>
        ) : error ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            color: '#e53e3e',
            fontWeight: 600,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: '#718096',
            fontSize: '1.1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <p>ユーザーが見つかりません</p>
          </div>
        ) : isMobile ? (
          // 移动端卡片式布局
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {filteredUsers.map(user => (
              <div
                key={user.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  {user.avatarUrl && (
                    <img 
                      src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`}
                      alt={user.username}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #e2e8f0'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      color: '#2d3748',
                      fontSize: '1.1rem',
                      marginBottom: '4px'
                    }}>
                      {user.username}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#718096'
                    }}>
                      ID: {user.id}
                    </div>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: user.role === 'ADMIN' 
                      ? 'rgba(102, 126, 234, 0.15)' 
                      : 'rgba(102, 126, 234, 0.1)',
                    color: user.role === 'ADMIN' ? '#667eea' : '#4a5568',
                    display: 'inline-block'
                  }}>
                    {user.role === 'ADMIN' ? '🛠️ 管理者' : '👤 ユーザー'}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                  fontSize: '0.9rem'
                }}>
                  <div>
                    <div style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '4px' }}>メール</div>
                    <div style={{ color: '#4a5568', wordBreak: 'break-all' }}>{user.email}</div>
                  </div>
                  <div>
                    <div style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '4px' }}>名前</div>
                    <div style={{ color: '#4a5568' }}>
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '4px' }}>ノート数</div>
                    <div style={{ color: '#4a5568' }}>{user.notesCount || 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '4px' }}>登録日</div>
                    <div style={{ color: '#4a5568', fontSize: '0.85rem' }}>
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleViewDetail(user)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      minHeight: '44px'
                    }}
                  >
                    詳細
                  </button>
                  <button
                    onClick={() => handleEditClick(user)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      minHeight: '44px'
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      minHeight: '44px'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 桌面端表格布局
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: '#f7fafc',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>ID</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>ユーザー名</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>メール</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>名前</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>役割</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>ノート数</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>登録日</th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#4a5568',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr 
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f7fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      <td style={{ padding: '16px', color: '#718096' }}>{user.id}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          {user.avatarUrl && (
                            <img 
                              src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`}
                              alt={user.username}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #e2e8f0'
                              }}
                              onError={(e) => {
                                e.target.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'
                              }}
                            />
                          )}
                          <span style={{
                            fontWeight: 600,
                            color: '#2d3748'
                          }}>
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#4a5568' }}>{user.email}</td>
                      <td style={{ padding: '16px', color: '#4a5568' }}>
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : '-'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: user.role === 'ADMIN' 
                            ? 'rgba(102, 126, 234, 0.15)' 
                            : 'rgba(102, 126, 234, 0.1)',
                          color: user.role === 'ADMIN' ? '#667eea' : '#4a5568',
                          display: 'inline-block'
                        }}>
                          {user.role === 'ADMIN' ? '🛠️ 管理者' : '👤 ユーザー'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#4a5568' }}>{user.notesCount || 0}</td>
                      <td style={{ padding: '16px', color: '#718096', fontSize: '0.9rem' }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <button
                            onClick={() => handleViewDetail(user)}
                            style={{
                              padding: '10px 16px',
                              background: '#1976d2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              transition: 'all 0.3s ease',
                              minHeight: '36px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1565c0'
                              e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#1976d2'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }}
                          >
                            詳細
                          </button>
                          <button
                            onClick={() => handleEditClick(user)}
                            style={{
                              padding: '10px 16px',
                              background: '#48bb78',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              transition: 'all 0.3s ease',
                              minHeight: '36px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#38a169'
                              e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#48bb78'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }}
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            style={{
                              padding: '10px 16px',
                              background: '#f56565',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              transition: 'all 0.3s ease',
                              minHeight: '36px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e53e3e'
                              e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f56565'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 用户详情模态框 */}
      {detailModalOpen && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setDetailModalOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: isMobile ? '16px' : '24px',
              maxWidth: isMobile ? '100%' : '700px',
              width: '100%',
              maxHeight: isMobile ? '95vh' : '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              margin: isMobile ? '10px' : '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: isMobile ? '16px' : '24px',
              borderBottom: '1px solid #e2e8f0',
              position: isMobile ? 'sticky' : 'static',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 700,
                color: '#2d3748',
                margin: 0
              }}>
                👤 ユーザー詳細
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  color: '#718096',
                  cursor: 'pointer',
                  padding: '0',
                  width: isMobile ? '40px' : '32px',
                  height: isMobile ? '40px' : '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.color = '#2d3748'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#718096'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '24px'
            }}>
              <div style={{
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#4a5568',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  基本情報
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <strong style={{ color: '#4a5568' }}>ID:</strong> {selectedUser.id}
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>ユーザー名:</strong> {escapeHtml(selectedUser.username)}
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>メール:</strong> <span style={{ wordBreak: 'break-all' }}>{escapeHtml(selectedUser.email)}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>役割:</strong> 
                    <span style={{
                      marginLeft: '8px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: selectedUser.role === 'ADMIN' 
                        ? 'rgba(102, 126, 234, 0.15)' 
                        : 'rgba(102, 126, 234, 0.1)',
                      color: selectedUser.role === 'ADMIN' ? '#667eea' : '#4a5568',
                      display: 'inline-block'
                    }}>
                      {selectedUser.role === 'ADMIN' ? '🛠️ 管理者' : '👤 ユーザー'}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>名前:</strong> {escapeHtml(`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || '-')}
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>所在地:</strong> {escapeHtml(selectedUser.location || '-')}
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>登録日:</strong> {formatDate(selectedUser.createdAt)}
                  </div>
                </div>
              </div>

              {selectedUser.bio && (
                <div style={{
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#4a5568',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    自己紹介
                  </h4>
                  <p style={{
                    color: '#4a5568',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    margin: 0
                  }}>
                    {escapeHtml(selectedUser.bio)}
                  </p>
                </div>
              )}

              <div style={{
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#4a5568',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  統計情報
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <strong style={{ color: '#4a5568' }}>ノート数:</strong> {selectedUser.notesCount || 0}
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>いいね数:</strong> {selectedUser.likesCount || 0}
                  </div>
                  <div>
                    <strong style={{ color: '#4a5568' }}>お気に入り数:</strong> {selectedUser.favoritesCount || 0}
                  </div>
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: isMobile ? '16px' : '24px',
              borderTop: '1px solid #e2e8f0',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  handleEditClick(selectedUser)
                }}
                style={{
                  padding: isMobile ? '14px 24px' : '12px 24px',
                  background: '#48bb78',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#38a169'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#48bb78'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                編集
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{
                  padding: isMobile ? '14px 24px' : '12px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#cbd5e0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e2e8f0'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户模态框 */}
      {editModalOpen && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setEditModalOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: isMobile ? '16px' : '24px',
              maxWidth: isMobile ? '100%' : '600px',
              width: '100%',
              maxHeight: isMobile ? '95vh' : '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              margin: isMobile ? '10px' : '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: isMobile ? '16px' : '24px',
              borderBottom: '1px solid #e2e8f0',
              position: isMobile ? 'sticky' : 'static',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 700,
                color: '#2d3748',
                margin: 0
              }}>
                ✏️ ユーザー編集
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  color: '#718096',
                  cursor: 'pointer',
                  padding: '0',
                  width: isMobile ? '40px' : '32px',
                  height: isMobile ? '40px' : '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.color = '#2d3748'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#718096'
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{
              padding: isMobile ? '16px' : '24px'
            }}>
              <div style={{
                marginBottom: '20px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#4a5568'
                }}>
                  ユーザー名 *
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '1rem',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1976d2'
                    e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div style={{
                marginBottom: '20px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#4a5568'
                }}>
                  メール *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '1rem',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1976d2'
                    e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div style={{
                marginBottom: '20px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#4a5568'
                }}>
                  役割 *
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '1rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1976d2'
                    e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="USER">ユーザー</option>
                  <option value="ADMIN">管理者</option>
                </select>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 600,
                    color: '#4a5568'
                  }}>
                    名
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: isMobile ? '14px 16px' : '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: isMobile ? '16px' : '1rem',
                      transition: 'all 0.3s ease',
                      minHeight: '44px',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1976d2'
                      e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 600,
                    color: '#4a5568'
                  }}>
                    姓
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: isMobile ? '14px 16px' : '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: isMobile ? '16px' : '1rem',
                      transition: 'all 0.3s ease',
                      minHeight: '44px',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1976d2'
                      e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{
                marginBottom: '20px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#4a5568'
                }}>
                  所在地
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '1rem',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1976d2'
                    e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div style={{
                marginBottom: '20px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#4a5568'
                }}>
                  自己紹介
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1976d2'
                    e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div style={{
                marginBottom: '20px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: '#4a5568'
                }}>
                  新しいパスワード（変更する場合のみ）
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="空白のままにすると変更されません"
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '1rem',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1976d2'
                    e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={{
                    padding: isMobile ? '14px 24px' : '12px 24px',
                    background: '#e2e8f0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#cbd5e0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#e2e8f0'
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  style={{
                    padding: isMobile ? '14px 24px' : '12px 24px',
                    background: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#38a169'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#48bb78'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {deleteModalOpen && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: isMobile ? '16px' : '24px',
              maxWidth: isMobile ? '100%' : '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              margin: isMobile ? '10px' : '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: isMobile ? '16px' : '24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 700,
                color: '#2d3748',
                margin: 0
              }}>
                ⚠️ 削除の確認
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  color: '#718096',
                  cursor: 'pointer',
                  padding: '0',
                  width: isMobile ? '40px' : '32px',
                  height: isMobile ? '40px' : '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.color = '#2d3748'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#718096'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: isMobile ? '16px' : '24px'
            }}>
              <p style={{ 
                color: '#4a5568', 
                marginBottom: '12px',
                fontSize: isMobile ? '0.95rem' : '1rem'
              }}>
                ユーザー <strong>{escapeHtml(selectedUser.username)}</strong> を削除しますか？
              </p>
              <p style={{ 
                color: '#dc2626', 
                fontWeight: '600',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                この操作は元に戻せません。ユーザーのすべてのデータが削除されます。
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: isMobile ? '16px' : '24px',
              borderTop: '1px solid #e2e8f0',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  padding: isMobile ? '14px 24px' : '12px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#cbd5e0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e2e8f0'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: isMobile ? '14px 24px' : '12px 24px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加动画样式 */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </>
  )
}

export default UsersAdmin

