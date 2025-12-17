import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'

const Admin = () => {
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      navigate('/login')
      return
    }

    // 检查是否是管理员
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'ADMIN') {
        alert('アクセス権がありません。管理者のみがこのページを利用できます。')
        navigate('/notes')
      }
    } catch (error) {
      console.error('認証エラー:', error)
      navigate('/login')
    }
  }, [navigate])

  const handleTestAdmin = async () => {
    setLoading(true)
    setTestResult('')

    try {
      const response = await api.get('/admin/test')
      setTestResult('✅ 请求成功：\n' + response.data)
    } catch (error) {
      if (error.response?.status === 403) {
        setTestResult('❌ 403 Forbidden：你不是管理员')
      } else {
        setTestResult('❌ 请求失败：' + (error.response?.data || error.message))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '100px auto',
      padding: '40px',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: 700,
        marginBottom: '20px',
        color: '#2d3748'
      }}>管理员后台</h2>

      <p style={{
        color: '#718096',
        marginBottom: '30px'
      }}>管理员功能页面</p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <Link
          to="/notes-admin.html"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#4CAF50',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 600,
            transition: 'background 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#45a049'}
          onMouseLeave={(e) => e.target.style.background = '#4CAF50'}
        >
          笔记管理
        </Link>

        <button
          onClick={handleTestAdmin}
          disabled={loading}
          style={{
            padding: '12px 24px',
            width: '100%',
            background: loading ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            transition: 'background 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.background = '#d32f2f'
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.background = '#f44336'
          }}
        >
          {loading ? '测试中...' : '测试管理员接口'}
        </button>
      </div>

      {testResult && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: testResult.startsWith('✅') ? '#d1fae5' : '#fee2e2',
          color: testResult.startsWith('✅') ? '#065f46' : '#991b1b',
          borderRadius: '8px',
          whiteSpace: 'pre-wrap',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {testResult}
        </div>
      )}
    </div>
  )
}

export default Admin
