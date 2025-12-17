import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const Register = () => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !username || !password) {
      setError('すべての項目を入力してください。')
      return
    }

    try {
      const response = await api.post('/auth/register', { email, username, password })
      if (response.status === 200 || response.status === 201) {
        setSuccess('✅ 登録が完了しました。ログインしてください。')
        setTimeout(() => {
          navigate('/login')
        }, 1000)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || '登録に失敗しました'
      setError(`❌ ${errorMessage}`)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      paddingTop: 0
    }}>
      {/* 左側：登録フォーム */}
      <div style={{
        width: '50%',
        background: 'var(--brand)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: '#fff',
          borderRadius: '30px',
          padding: '40px 35px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '26px',
            fontWeight: 700,
            marginBottom: '10px',
            color: '#1a1a1a'
          }}>TravelGo アカウント登録</h2>
          <p style={{
            color: '#444',
            fontSize: '14px',
            marginBottom: '20px'
          }}>お気に入り登録・旅行プラン管理ができます ✨</p>

          {error && (
            <div style={{
              padding: '12px',
              background: '#fee',
              color: '#c33',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              background: '#efe',
              color: '#3c3',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block',
              textAlign: 'left',
              fontWeight: 600,
              marginTop: '16px',
              color: '#333'
            }}>
              メールアドレス
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f3f4f6',
              borderRadius: '40px',
              padding: '8px 14px',
              marginTop: '6px'
            }}>
              <img 
                src="https://cdn-icons-png.flaticon.com/512/732/732200.png" 
                alt="email"
                style={{ width: '20px', height: '20px', marginRight: '10px', opacity: 0.7 }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '15px',
                  color: '#333'
                }}
              />
            </div>

            <label style={{
              display: 'block',
              textAlign: 'left',
              fontWeight: 600,
              marginTop: '16px',
              color: '#333'
            }}>
              ユーザー名
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f3f4f6',
              borderRadius: '40px',
              padding: '8px 14px',
              marginTop: '6px'
            }}>
              <img 
                src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" 
                alt="user"
                style={{ width: '20px', height: '20px', marginRight: '10px', opacity: 0.7 }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名を入力"
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '15px',
                  color: '#333'
                }}
              />
            </div>

            <label style={{
              display: 'block',
              textAlign: 'left',
              fontWeight: 600,
              marginTop: '16px',
              color: '#333'
            }}>
              パスワード
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f3f4f6',
              borderRadius: '40px',
              padding: '8px 14px',
              marginTop: '6px'
            }}>
              <img 
                src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" 
                alt="lock"
                style={{ width: '20px', height: '20px', marginRight: '10px', opacity: 0.7 }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '15px',
                  color: '#333'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '28px',
                padding: '12px',
                width: '100%',
                background: 'var(--brand)',
                color: 'white',
                border: 'none',
                borderRadius: '40px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: '0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#e03e00'}
              onMouseOut={(e) => e.target.style.background = 'var(--brand)'}
            >
              登録する
            </button>
          </form>

          <div style={{
            marginTop: '18px',
            fontSize: '14px',
            color: '#333'
          }}>
            すでにアカウントをお持ちの方は <Link to="/login" style={{
              color: '#1a1a1a',
              textDecoration: 'underline',
              textUnderlineOffset: '4px'
            }}>こちら</Link>
          </div>
        </div>
      </div>

      {/* 右側：背景 */}
      <div style={{
        width: '50%',
        background: "url('https://images.unsplash.com/photo-1609501670471-13b10f9d2ff2?q=80&w=1600&auto=format&fit=crop') center/cover no-repeat",
        position: 'relative'
      }}>
        <div style={{
          content: '',
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.15)'
        }}></div>
      </div>
    </div>
  )
}

export default Register
