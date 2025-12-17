import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post('/auth/login', { username, password })
      // 后端现在统一返回 LoginResponse 对象
      const loginData = response.data
      
      if (loginData && loginData.token) {
        TokenUtil.setToken(loginData.token)
        localStorage.setItem('username', loginData.username || username)
        navigate('/')
        window.location.reload()
      } else {
        setError('ログインに失敗しました：トークンが取得できませんでした')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'ログインに失敗しました')
    }
  }

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '40px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>TravelGo へログイン</h2>
        
        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            color: '#c33',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{ width: '100%' }}
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
