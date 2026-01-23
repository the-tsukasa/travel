import { useState, useEffect, MouseEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import type { AdminNotesStats } from '../types'

interface Stats {
  pendingNotes: number
  totalUsers: number
  totalNotes: number
  publishedNotes: number
}

interface StatCardProps {
  title: string
  value: number
  icon: string
  color: string
  link?: string
  urgent?: boolean
}

interface ActionCardProps {
  title: string
  description: string
  link?: string
  color: string
  urgent?: boolean
  disabled?: boolean
}

const Admin = () => {
  const [stats, setStats] = useState<Stats>({
    pendingNotes: 0,
    totalUsers: 0,
    totalNotes: 0,
    publishedNotes: 0
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768)
  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      navigate('/login')
      return
    }

    // 检查是否是管理员
    try {
      const payload = TokenUtil.parseToken(token)
      if (payload?.role !== 'ADMIN') {
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
        const notesStatsRes = await api.get<AdminNotesStats>('/admin/notes/stats')
        const notesStats = notesStatsRes.data || {}
        setStats(prev => ({
          ...prev,
          pendingNotes: notesStats.pendingNotes || 0,
          publishedNotes: notesStats.publishedNotes || 0,
          totalNotes: notesStats.totalNotes || 0
        }))
      } catch (error: any) {
        console.error('ノート統計データの読み込みエラー:', error)
        // 如果统计 API 失败，尝试使用旧方法
        try {
          const pendingRes = await api.get('/admin/notes/pending')
          const pendingNotes = Array.isArray(pendingRes.data) ? pendingRes.data.length : 0
          const publishedRes = await api.get('/admin/notes?status=PUBLISHED')
          const publishedNotes = Array.isArray(publishedRes.data) ? publishedRes.data.length : 0
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
        const usersStatsRes = await api.get<{ totalUsers: number }>('/admin/users/stats')
        const usersStats = usersStatsRes.data || {}
        setStats(prev => ({
          ...prev,
          totalUsers: usersStats.totalUsers || 0
        }))
      } catch (error: any) {
        console.error('ユーザー統計データの読み込みエラー:', error)
      }
    } catch (error: any) {
      console.error('統計データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 统计卡片组件
  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, link, urgent }) => {
    const content = (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: urgent ? `2px solid ${color}` : '1px solid #e2e8f0',
        cursor: link ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
        if (link && !isMobile) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
        if (link && !isMobile) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
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

  // 操作卡片组件
  const ActionCard: React.FC<ActionCardProps> = ({ title, description, link, color, urgent, disabled }) => {
    const content = (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: urgent ? `2px solid ${color}` : '1px solid #e2e8f0',
        cursor: disabled ? 'not-allowed' : link ? 'pointer' : 'default',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s ease',
        minHeight: isMobile ? '120px' : 'auto'
      }}
      onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
        if (link && !disabled && !isMobile) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
        if (link && !disabled && !isMobile) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      }}
      >
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: 600,
          color: '#2d3748',
          marginBottom: '8px'
        }}>{title}</h3>
        <p style={{
          color: '#718096',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          margin: 0,
          lineHeight: 1.5
        }}>{description}</p>
        {urgent && (
          <div style={{
            marginTop: '12px',
            padding: '6px 12px',
            background: `${color}15`,
            color: color,
            borderRadius: '8px',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
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
        margin: isMobile ? '50px auto' : '100px auto',
        padding: isMobile ? '20px' : '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#718096' }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: isMobile ? '20px auto' : '40px auto',
      padding: isMobile ? '16px' : '40px',
      minHeight: 'calc(100vh - 200px)'
    }}>
      <div style={{
        marginBottom: isMobile ? '24px' : '40px'
      }}>
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
          <span>🛠️</span>
          <span>管理ダッシュボード</span>
        </h1>
        <p style={{
          color: '#718096',
          fontSize: isMobile ? '0.9rem' : '1.1rem'
        }}>
          システム全体の管理と監視
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '24px' : '40px'
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
        marginTop: isMobile ? '24px' : '40px'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: 600,
          marginBottom: isMobile ? '16px' : '24px',
          color: '#2d3748'
        }}>
          クイックアクション
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: isMobile ? '16px' : '20px'
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
            description="システム使用状況の分析と統計情報"
            link="/statistics-report"
            color="#388e3c"
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
