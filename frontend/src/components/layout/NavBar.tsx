import { useState, useEffect, useRef, MouseEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { checkAuth, TokenUtil } from '../../utils/auth'
import api from '../../services/api'
import type { AdminNotesStats } from '../../types'

const NavBar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userId, setUserId] = useState<number | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [userRole, setUserRole] = useState<string | null>(null) // 新增：用户角色
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const [pendingNotesCount, setPendingNotesCount] = useState<number>(0) // 待审核笔记数量
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0) // 未读通知数量
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  
  // 检测当前激活的路由
  const isActive = (path: string): boolean => {
    if (path === '/') {
      // 主页：只有完全匹配 '/' 时才激活
      return location.pathname === '/'
    }
    // 其他页面：路径以该路径开头时激活（包括子页面）
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    const verifyAuth = async () => {
      const authStatus = await checkAuth()
      if (authStatus.authenticated) {
        setIsAuthenticated(true)
        // 优先显示真实姓名（firstName + lastName）
        const user = authStatus.user
        let displayName = 'ユーザー'
        if (user) {
          if (user.firstName || user.lastName) {
            const nameParts: string[] = []
            if (user.firstName) nameParts.push(user.firstName)
            if (user.lastName) nameParts.push(user.lastName)
            displayName = nameParts.join(' ')
          } else if (user.username) {
            displayName = user.username
          }
          // 保存用户名（用于下拉菜单显示）
          setUserEmail(user.username || user.email || '')
          // 保存用户ID
          setUserId(user.id || null)
          // 设置头像URL
          if (user.avatarUrl) {
            let avatar = user.avatarUrl
            if (avatar.startsWith('/')) {
              avatar = `http://localhost:8080${avatar}`
            }
            setAvatarUrl(avatar)
          } else {
            setAvatarUrl('https://cdn-icons-png.flaticon.com/512/616/616408.png')
          }
        }
        setUsername(displayName)
        
        // 从 token 中获取用户角色
        const token = TokenUtil.getToken()
        if (token) {
          try {
            const payload = TokenUtil.parseToken(token)
            setUserRole(payload?.role || null)
          } catch (e) {
            console.error('トークン解析エラー:', e)
          }
        }
      }
    }
    verifyAuth()
  }, [])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | Event) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside as EventListener)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener)
    }
  }, [showDropdown])

  // 获取待审核笔记数量（仅管理员）
  useEffect(() => {
    const loadPendingNotesCount = async () => {
      if (userRole === 'ADMIN' && isAuthenticated) {
        try {
          const response = await api.get<AdminNotesStats>('/admin/notes/stats')
          if (response.data && response.data.pendingNotes !== undefined) {
            setPendingNotesCount(response.data.pendingNotes || 0)
          }
        } catch (error) {
          // 静默处理错误，避免影响导航栏显示
          console.error('待审核笔记数量获取失败:', error)
          setPendingNotesCount(0)
        }
      } else {
        setPendingNotesCount(0)
      }
    }

    loadPendingNotesCount()
    
    // 每30秒刷新一次待审核笔记数量
    const interval = setInterval(() => {
      if (userRole === 'ADMIN' && isAuthenticated) {
        loadPendingNotesCount()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [userRole, isAuthenticated])

  // 获取未读通知数量
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (isAuthenticated) {
        try {
          const response = await api.get<{ count: number }>('/notifications/unread/count')
          const count = response.data?.count || 0
          setUnreadNotificationCount(count)
        } catch (error) {
          // 静默处理错误，避免影响导航栏显示
          console.error('未读通知数量获取失败:', error)
          setUnreadNotificationCount(0)
        }
      } else {
        setUnreadNotificationCount(0)
      }
    }

    loadUnreadCount()
    
    // 每30秒刷新一次未读通知数量
    const interval = setInterval(() => {
      if (isAuthenticated) {
        loadUnreadCount()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleLogout = () => {
    TokenUtil.clearToken()
    setIsAuthenticated(false)
    setUsername('')
    setUserEmail('')
    setUserId(null)
    setShowDropdown(false)
    navigate('/')
    window.location.reload()
  }

  const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'

  return (
    <nav className="nav">
      <div className="nav-links">
        <Link to="/" className={`nav-link-with-icon ${isActive('/') ? 'active' : ''}`}>
          <svg className="nav-link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="nav-link-text-full">TravelGo</span>
          <span className="nav-link-text-short">TOP</span>
        </Link>
        <Link 
          to="/spot" 
          className={`nav-link-with-icon ${isActive('/spot') ? 'active' : ''}`}
        >
          <svg className="nav-link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="nav-link-text-full">観光スポット</span>
          <span className="nav-link-text-short">スポット</span>
        </Link>
        <Link 
          to="/notes" 
          className={`nav-link-with-icon ${isActive('/notes') ? 'active' : ''}`}
        >
          <svg className="nav-link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span className="nav-link-text-full">みんなの旅行ノート</span>
          <span className="nav-link-text-short">ノート</span>
        </Link>
      </div>

      <div className="nav-cta">
        {isAuthenticated ? (
          <div className="userbar-wrapper" ref={dropdownRef}>
            <button 
              className="userbar-toggle"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="用户菜单"
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={avatarUrl || defaultAvatar} 
                  alt={username}
                  className="userbar-avatar"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = defaultAvatar
                  }}
                />
                {unreadNotificationCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    zIndex: 10
                  }}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </div>
              <span className="userbar-username">{username}</span>
              {/* 管理员标识 */}
              {userRole === 'ADMIN' && (
                <span className="userbar-admin-badge" title="管理者">
                  🛠️
                </span>
              )}
              <svg 
                className={`userbar-chevron ${showDropdown ? 'open' : ''}`}
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none"
              >
                <path 
                  d="M3 4.5L6 7.5L9 4.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            {showDropdown && (
              <div className="userbar-dropdown">
                <div className="userbar-dropdown-header">
                  <img 
                    src={avatarUrl || defaultAvatar} 
                    alt={username}
                    className="userbar-dropdown-avatar"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = defaultAvatar
                    }}
                  />
                  <div className="userbar-dropdown-info">
                    <div className="userbar-dropdown-name">
                      {username}
                      {userRole === 'ADMIN' && (
                        <span className="userbar-dropdown-role-badge">管理者</span>
                      )}
                    </div>
                    <div className="userbar-dropdown-email">
                      {userEmail || 'ユーザー'}
                      {userId && <span> id {userId}</span>}
                    </div>
                  </div>
                </div>
                <div className="userbar-dropdown-divider"></div>
                <Link 
                  to="/user" 
                  className="userbar-dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
                    <path d="M8 9C4.667 9 2 10.567 2 12.5V16H14V12.5C14 10.567 11.333 9 8 9Z" fill="currentColor"/>
                  </svg>
                  マイページ
                </Link>
                <Link 
                  to="/notes-my" 
                  className="userbar-dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 2H2C0.9 2 0 2.9 0 4V12C0 13.1 0.9 14 2 14H14C15.1 14 16 13.1 16 12V4C16 2.9 15.1 2 14 2ZM14 12H2V4H14V12Z" fill="currentColor"/>
                    <path d="M4 6H12V8H4V6ZM4 9H10V11H4V9Z" fill="currentColor"/>
                  </svg>
                  📝 マイノート
                </Link>
                <Link 
                  to="/profile-edit" 
                  className="userbar-dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M11.3333 2.00001C11.5083 1.82501 11.7164 1.68726 11.9448 1.59466C12.1732 1.50207 12.4174 1.45654 12.6637 1.46068C12.9099 1.46482 13.1529 1.51856 13.3779 1.61846C13.6029 1.71836 13.8055 1.86223 13.9742 2.04084C14.1428 2.21945 14.2741 2.42924 14.3606 2.65776C14.4472 2.88628 14.4871 3.12901 14.478 3.37267C14.4689 3.61633 14.4109 3.85595 14.3075 4.07834C14.2041 4.30074 14.0575 4.50151 13.8767 4.66834L13.3333 5.20668L10.7933 2.66668L11.3333 2.00001ZM9.66667 3.73334L12.2067 6.27334L5.5 13H3V10.5L9.66667 3.73334Z" fill="currentColor"/>
                  </svg>
                  プロフィール編集
                </Link>
                <Link 
                  to="/notifications" 
                  className="userbar-dropdown-item"
                  onClick={() => setShowDropdown(false)}
                  style={{ position: 'relative', paddingRight: unreadNotificationCount > 0 ? '40px' : '16px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C6.9 0 6 0.9 6 2C6 3.1 6.9 4 8 4C9.1 4 10 3.1 10 2C10 0.9 9.1 0 8 0ZM8 5C5.8 5 4 6.8 4 9V12H6V9C6 7.9 6.9 7 8 7C9.1 7 10 7.9 10 9V12H12V9C12 6.8 10.2 5 8 5Z" fill="currentColor"/>
                  </svg>
                  🔔 通知
                  {unreadNotificationCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                      lineHeight: 1,
                      border: '2px solid white'
                    }}>
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </Link>
                
                {/* 管理员专用菜单区域 */}
                {userRole === 'ADMIN' && (
                  <>
                    <div className="userbar-dropdown-divider"></div>
                    <div className="userbar-dropdown-section-title">管理機能</div>
                    <Link 
                      to="/admin" 
                      className="userbar-dropdown-item admin-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 0L0 4V6C0 10.55 3.36 14.74 8 16C12.64 14.74 16 10.55 16 6V4L8 0ZM8 8.99C6.9 8.99 6 8.09 6 6.99C6 5.89 6.9 4.99 8 4.99C9.1 4.99 10 5.89 10 6.99C10 8.09 9.1 8.99 8 8.99Z" fill="currentColor"/>
                      </svg>
                      🛠️ 管理ダッシュボード
                    </Link>
                    <Link 
                      to="/notes-admin" 
                      className="userbar-dropdown-item admin-item"
                      onClick={() => setShowDropdown(false)}
                      style={{ position: 'relative', paddingRight: pendingNotesCount > 0 ? '40px' : '16px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 2H2C0.9 2 0 2.9 0 4V12C0 13.1 0.9 14 2 14H14C15.1 14 16 13.1 16 12V4C16 2.9 15.1 2 14 2ZM14 12H2V4H14V12Z" fill="currentColor"/>
                        <path d="M4 6H12V8H4V6ZM4 9H10V11H4V9Z" fill="currentColor"/>
                      </svg>
                      📋 ノート 管理
                      {pendingNotesCount > 0 && (
                        <span 
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '12px',
                            transform: 'translateY(-50%)',
                            minWidth: '20px',
                            height: '20px',
                            borderRadius: '10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px',
                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                            lineHeight: 1,
                            border: '2px solid white'
                          }}
                        >
                          {pendingNotesCount > 99 ? '99+' : pendingNotesCount}
                        </span>
                      )}
                    </Link>
                    <Link 
                      to="/users-admin" 
                      className="userbar-dropdown-item admin-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
                        <path d="M8 9C4.667 9 2 10.567 2 12.5V16H14V12.5C14 10.567 11.333 9 8 9Z" fill="currentColor"/>
                      </svg>
                      👥 ユーザー管理
                    </Link>
                  </>
                )}
                
                <div className="userbar-dropdown-divider"></div>
                <button 
                  className="userbar-dropdown-item logout"
                  onClick={handleLogout}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  ログアウト
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-outline">ログイン</Link>
            <Link to="/register" className="btn">登録</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default NavBar
