import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'

const Admin = () => {
  const [stats, setStats] = useState({
    pendingNotes: 0,
    totalUsers: 0,
    totalNotes: 0,
    publishedNotes: 0
  })
  const [loading, setLoading] = useState(true)
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
      } else {
        loadStats()
      }
    } catch (error) {
      console.error('認証エラー:', error)
      navigate('/login')
    }
  }, [navigate])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      // 获取笔记统计信息
      try {
        const notesStatsRes = await api.get('/admin/notes/stats')
        const notesStats = notesStatsRes.data || {}
        setStats(prev => ({
          ...prev,
          pendingNotes: notesStats.pendingNotes || 0,
          publishedNotes: notesStats.publishedNotes || 0,
          totalNotes: notesStats.totalNotes || 0
        }))
      } catch (error) {
        console.error('ノート統計データの読み込みエラー:', error)
        // 如果统计 API 失败，尝试使用旧方法
        try {
          const pendingRes = await api.get('/admin/notes/pending')
          const pendingNotes = pendingRes.data?.length || 0
          const publishedRes = await api.get('/admin/notes?status=PUBLISHED')
          const publishedNotes = publishedRes.data?.length || 0
          setStats(prev => ({
            ...prev,
            pendingNotes,
            publishedNotes,
            totalNotes: pendingNotes + publishedNotes
          }))
        } catch (fallbackError) {
          console.error('フォールバック統計データの読み込みエラー:', fallbackError)
        }
      }
      
      // 获取用户统计信息
      try {
        const usersStatsRes = await api.get('/admin/users/stats')
        const usersStats = usersStatsRes.data || {}
        setStats(prev => ({
          ...prev,
          totalUsers: usersStats.totalUsers || 0
        }))
      } catch (error) {
        console.error('ユーザー統計データの読み込みエラー:', error)
      }
    } catch (error) {
      console.error('統計データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 统计卡片组件
  const StatCard = ({ title, value, icon, color, link, urgent }) => {
    const content = (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: urgent ? `2px solid ${color}` : '1px solid #e2e8f0',
        cursor: link ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (link) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (link) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      }}
      >
        {urgent && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: color,
            animation: 'pulse 2s infinite'
          }}></div>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '2rem' }}>{icon}</span>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#4a5568',
            margin: 0
          }}>{title}</h3>
        </div>
        <div style={{
          fontSize: '3rem',
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

  // 操作卡片组件
  const ActionCard = ({ title, description, link, color, urgent, disabled }) => {
    const content = (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: urgent ? `2px solid ${color}` : '1px solid #e2e8f0',
        cursor: disabled ? 'not-allowed' : link ? 'pointer' : 'default',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        if (link && !disabled) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (link && !disabled) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      }}
      >
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#2d3748',
          marginBottom: '8px'
        }}>{title}</h3>
        <p style={{
          color: '#718096',
          fontSize: '0.95rem',
          margin: 0
        }}>{description}</p>
        {urgent && (
          <div style={{
            marginTop: '12px',
            padding: '6px 12px',
            background: `${color}15`,
            color: color,
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'inline-block'
          }}>
            ⚠️ アクションが必要
          </div>
        )}
      </div>
    )

    if (link && !disabled) {
      return <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link>
    }
    return content
  }

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '100px auto',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#718096' }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '40px auto',
      padding: '40px',
      minHeight: 'calc(100vh - 200px)'
    }}>
      <div style={{
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: '10px',
          color: '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>🛠️</span>
          <span>管理ダッシュボード</span>
        </h1>
        <p style={{
          color: '#718096',
          fontSize: '1.1rem'
        }}>
          システム全体の管理と監視
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <StatCard
          title="承認待ちノート"
          value={stats.pendingNotes}
          icon="⏳"
          color="#f57c00"
          link="/notes-admin"
          urgent={stats.pendingNotes > 0}
        />
        <StatCard
          title="公開済みノート"
          value={stats.publishedNotes}
          icon="✅"
          color="#388e3c"
        />
        <StatCard
          title="総ノート数"
          value={stats.totalNotes}
          icon="📝"
          color="#1976d2"
        />
        <StatCard
          title="総ユーザー数"
          value={stats.totalUsers}
          icon="👥"
          color="#7b1fa2"
        />
      </div>

      {/* 快速操作 */}
      <div style={{
        marginTop: '40px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '24px',
          color: '#2d3748'
        }}>
          クイックアクション
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          <ActionCard
            title="📋 ノート管理"
            description="承認待ちのノートを審査・管理"
            link="/notes-admin"
            color="#1976d2"
            urgent={stats.pendingNotes > 0}
          />
          <ActionCard
            title="👥 ユーザー管理"
            description="ユーザーアカウントの管理"
            link="/users-admin"
            color="#7b1fa2"
          />
          <ActionCard
            title="📊 統計レポート"
            description="システム使用状況の分析（開発中）"
            link="#"
            color="#388e3c"
            disabled
          />
        </div>
      </div>

      {/* 添加 pulse 动画样式 */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}

export default Admin
