import { useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import type { RegisterRequest, ApiResponse } from '../types'
import '../styles/pages/auth.css'

const Register = () => {
  const [email, setEmail] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!email || !username || !password) {
      setError('すべての項目を入力してください。')
      setLoading(false)
      return
    }

    try {
      const response = await api.post<ApiResponse>('/auth/register', { email, username, password } as RegisterRequest)
      if (response.status === 200 || response.status === 201) {
        setSuccess('✅ 登録が完了しました。ログインしてください。')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || '登録に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* 左侧表单区域 */}
      <div className="auth-left">
        <div className="auth-form-box">
          <h2 className="auth-title">TravelGo アカウント登録</h2>
          <p className="auth-subtitle">お気に入り登録・旅行プラン管理ができます ✨</p>

          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message auth-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">メールアドレス</label>
              <div className="auth-input-group">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/732/732200.png" 
                  alt="email"
                  className="auth-input-icon"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="メールアドレスを入力"
                  required
                  className="auth-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">ユーザー名</label>
              <div className="auth-input-group">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" 
                  alt="user"
                  className="auth-input-icon"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  placeholder="ユーザー名を入力"
                  required
                  className="auth-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">パスワード</label>
              <div className="auth-input-group">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" 
                  alt="lock"
                  className="auth-input-icon"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  required
                  className="auth-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-loading"></span>
                  <span>登録中...</span>
                </>
              ) : (
                <>
                  <svg 
                    className="auth-submit-btn-icon"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2.5} 
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
                    />
                  </svg>
                  <span>登録する</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-link">
            すでにアカウントをお持ちの方は{' '}
            <Link to="/login">こちら</Link>
          </div>
        </div>
      </div>

      {/* 右侧背景区域 */}
      <div className="auth-right">
        <img 
          src="/images/login_register.png" 
          alt="Travel background"
          className="auth-right-image"
        />
      </div>
    </div>
  )
}

export default Register
