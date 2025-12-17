import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkAuth, TokenUtil } from '../utils/auth'

const NavBar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const verifyAuth = async () => {
      const authStatus = await checkAuth()
      if (authStatus.authenticated) {
        setIsAuthenticated(true)
        setUsername(authStatus.user?.username || localStorage.getItem('username') || 'ユーザー')
      }
    }
    verifyAuth()
  }, [])

  const handleLogout = () => {
    TokenUtil.clearToken()
    setIsAuthenticated(false)
    setUsername('')
    navigate('/')
    window.location.reload()
  }

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
          <div className="userbar">
            <span className="userbar-username">👤 {username}</span>
            <span className="divider"></span>
            <Link to="/user.html">マイページ</Link>
            <span className="divider"></span>
            <button className="logout-btn" onClick={handleLogout}>
              ログアウト
            </button>
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
