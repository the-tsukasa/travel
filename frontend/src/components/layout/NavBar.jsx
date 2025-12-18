import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkAuth, TokenUtil } from '../../utils/auth'

const NavBar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

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
            const nameParts = []
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
      }
    }
    verifyAuth()
  }, [])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

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
      <Link to="/" className="brand">
        <span className="brand-dot"></span>
        TravelGo
      </Link>
      
      <div className="nav-links">
        <Link to="/spot.html">観光スポット</Link>
        <Link to="/notes">みんなの旅行ノート</Link>
      </div>

      <div className="nav-cta">
        {isAuthenticated ? (
          <div className="userbar-wrapper" ref={dropdownRef}>
            <button 
              className="userbar-toggle"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="用户菜单"
            >
              <img 
                src={avatarUrl || defaultAvatar} 
                alt={username}
                className="userbar-avatar"
                onError={(e) => {
                  e.target.src = defaultAvatar
                }}
              />
              <span className="userbar-username">{username}</span>
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
                      e.target.src = defaultAvatar
                    }}
                  />
                  <div className="userbar-dropdown-info">
                    <div className="userbar-dropdown-name">{username}</div>
                    <div className="userbar-dropdown-email">
                      {userEmail || 'ユーザー'}
                      {userId && <span> id {userId}</span>}
                    </div>
                  </div>
                </div>
                <div className="userbar-dropdown-divider"></div>
                <Link 
                  to="/user.html" 
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
                  to="/profile-edit.html" 
                  className="userbar-dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M11.3333 2.00001C11.5083 1.82501 11.7164 1.68726 11.9448 1.59466C12.1732 1.50207 12.4174 1.45654 12.6637 1.46068C12.9099 1.46482 13.1529 1.51856 13.3779 1.61846C13.6029 1.71836 13.8055 1.86223 13.9742 2.04084C14.1428 2.21945 14.2741 2.42924 14.3606 2.65776C14.4472 2.88628 14.4871 3.12901 14.478 3.37267C14.4689 3.61633 14.4109 3.85595 14.3075 4.07834C14.2041 4.30074 14.0575 4.50151 13.8767 4.66834L13.3333 5.20668L10.7933 2.66668L11.3333 2.00001ZM9.66667 3.73334L12.2067 6.27334L5.5 13H3V10.5L9.66667 3.73334Z" fill="currentColor"/>
                  </svg>
                  プロフィール編集
                </Link>
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
