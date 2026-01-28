import { useState, useEffect, MouseEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import type { UserDTO } from '../types'

interface UserStats {
  totalUsers: number
  adminUsers: number
  regularUsers: number
}

interface NotesStats {
  totalNotes: number
  pendingNotes: number
  publishedNotes: number
  draftNotes: number
  rejectedNotes: number
  privateNotes: number
}

interface InteractionStats {
  totalLikes: number
  totalFavorites: number
  totalInteractions: number
}

interface StatCardProps {
  title: string
  value: number
  icon: string
  color: string
  subtitle?: string
  percentage?: number
}

interface ProgressBarProps {
  label: string
  value: number
  max: number
  color: string
}

const StatisticsReport = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768)
  const navigate = useNavigate()

  // 用户统计
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0
  })

  // 笔记统计
  const [notesStats, setNotesStats] = useState<NotesStats>({
    totalNotes: 0,
    pendingNotes: 0,
    publishedNotes: 0,
    draftNotes: 0,
    rejectedNotes: 0,
    privateNotes: 0
  })

  // 互动统计（从用户数据中计算）
  const [interactionStats, setInteractionStats] = useState<InteractionStats>({
    totalLikes: 0,
    totalFavorites: 0,
    totalInteractions: 0
  })

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (loading) {
      loadAllStats()
    }
  }, [loading])

  const checkAdminAuth = async (): Promise<void> => {
    const token = TokenUtil.getToken()
    if (!token) {
      alert('まずログインしてください。')
      navigate('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { role?: string }
      if (payload.role !== 'ADMIN') {
        alert('アクセス権がありません。管理者のみがこのページを利用できます。')
        navigate('/notes')
        return
      }
    } catch (error) {
      console.error('認証エラー:', error)
      TokenUtil.clearToken()
      alert('ログイン情報の有効期限が切れました。再度ログインしてください。')
      navigate('/login')
    }
  }

  const loadAllStats = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')

      // 加载用户统计
      const userStatsRes = await api.get<UserStats>('/admin/users/stats')
      setUserStats(userStatsRes.data || { totalUsers: 0, adminUsers: 0, regularUsers: 0 })

      // 加载笔记统计
      const notesStatsRes = await api.get<NotesStats>('/admin/notes/stats')
      setNotesStats(notesStatsRes.data || { totalNotes: 0, pendingNotes: 0, publishedNotes: 0, draftNotes: 0, rejectedNotes: 0, privateNotes: 0 })

      // 加载所有用户以计算互动统计
      try {
        const usersRes = await api.get<UserDTO[]>('/admin/users')
        const users = usersRes.data || []
        let totalLikes = 0
        let totalFavorites = 0

        users.forEach(user => {
          totalLikes += user.likesCount || 0
          totalFavorites += user.favoritesCount || 0
        })

        setInteractionStats({
          totalLikes,
          totalFavorites,
          totalInteractions: totalLikes + totalFavorites
        })
      } catch (err) {
        console.error('ユーザーデータの読み込みエラー:', err)
      }

    } catch (error) {
      console.error('統計データの読み込みエラー:', error)
      setError('統計データの読み込みに失敗しました。時間をおいて再試行してください。')
    } finally {
      setLoading(false)
    }
  }

  // 统计卡片组件
  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, percentage }) => {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
        if (!isMobile) {
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
          lineHeight: 1,
          marginBottom: subtitle ? '8px' : '0'
        }}>{value.toLocaleString()}</div>
        {subtitle && (
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: '#718096',
            marginTop: '8px'
          }}>{subtitle}</div>
        )}
        {percentage !== undefined && (
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: '#48bb78',
            fontWeight: 600,
            marginTop: '8px'
          }}>
            {percentage > 0 ? `↑ ${percentage}%` : percentage < 0 ? `↓ ${Math.abs(percentage)}%` : '—'}
          </div>
        )}
      </div>
    )
  }

  // 进度条组件
  const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
          <span style={{ fontWeight: 600, color: '#4a5568' }}>{label}</span>
          <span style={{ color: '#718096' }}>{value} / {max}</span>
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          background: '#e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
            borderRadius: '6px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: '#718096',
          marginTop: '4px',
          textAlign: 'right'
        }}>
          {percentage.toFixed(1)}%
        </div>
      </div>
    )
  }

  if (loading) {
    return (
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
    )
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '100px auto',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          color: '#e53e3e',
          fontWeight: 600,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {error}
        </div>
      </div>
    )
  }

  const adminPercentage = userStats.totalUsers > 0 
    ? ((userStats.adminUsers / userStats.totalUsers) * 100).toFixed(1)
    : 0

  const publishedPercentage = notesStats.totalNotes > 0
    ? ((notesStats.publishedNotes / notesStats.totalNotes) * 100).toFixed(1)
    : 0

  const pendingPercentage = notesStats.totalNotes > 0
    ? ((notesStats.pendingNotes / notesStats.totalNotes) * 100).toFixed(1)
    : 0

  return (
    <>
      <div style={{
        maxWidth: '1200px',
        margin: isMobile ? '20px auto' : '40px auto',
        padding: isMobile ? '16px' : '40px',
        minHeight: 'calc(100vh - 200px)',
        background: '#f7fafc'
      }}>
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
                <span>📊</span>
                <span>統計レポート</span>
              </h1>
              <p style={{
                color: '#718096',
                fontSize: isMobile ? '0.9rem' : '1.1rem'
              }}>
                システム全体の使用状況と統計情報
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              width: isMobile ? '100%' : 'auto'
            }}>
              <button
                onClick={loadAllStats}
                style={{
                  padding: isMobile ? '12px 20px' : '10px 20px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#1565c0'
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#1976d2'
                }}
              >
                🔄 更新
              </button>
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
                onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.borderColor = '#cbd5e0'
                }}
                onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                ← 管理ダッシュボード
              </Link>
            </div>
          </div>
        </div>

        {/* 用户统计 */}
        <div style={{
          marginBottom: isMobile ? '24px' : '40px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 600,
            marginBottom: isMobile ? '16px' : '24px',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👥</span>
            <span>ユーザー統計</span>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '16px' : '24px',
            marginBottom: isMobile ? '20px' : '24px'
          }}>
            <StatCard
              title="総ユーザー数"
              value={userStats.totalUsers}
              icon="👥"
              color="#7b1fa2"
            />
            <StatCard
              title="管理者"
              value={userStats.adminUsers}
              icon="🛠️"
              color="#667eea"
              subtitle={`全体の${adminPercentage}%`}
            />
            <StatCard
              title="一般ユーザー"
              value={userStats.regularUsers}
              icon="👤"
              color="#48bb78"
              subtitle={`全体の${(100 - parseFloat(adminPercentage)).toFixed(1)}%`}
            />
          </div>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#4a5568'
            }}>
              ユーザー分布
            </h3>
            <ProgressBar
              label="管理者"
              value={userStats.adminUsers}
              max={userStats.totalUsers}
              color="#667eea"
            />
            <ProgressBar
              label="一般ユーザー"
              value={userStats.regularUsers}
              max={userStats.totalUsers}
              color="#48bb78"
            />
          </div>
        </div>

        {/* 笔记统计 */}
        <div style={{
          marginBottom: isMobile ? '24px' : '40px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 600,
            marginBottom: isMobile ? '16px' : '24px',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📝</span>
            <span>ノート統計</span>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '16px' : '24px',
            marginBottom: isMobile ? '20px' : '24px'
          }}>
            <StatCard
              title="総ノート数"
              value={notesStats.totalNotes}
              icon="📝"
              color="#1976d2"
            />
            <StatCard
              title="公開済み"
              value={notesStats.publishedNotes}
              icon="✅"
              color="#388e3c"
              subtitle={`全体の${publishedPercentage}%`}
            />
            <StatCard
              title="承認待ち"
              value={notesStats.pendingNotes}
              icon="⏳"
              color="#f57c00"
              subtitle={`全体の${pendingPercentage}%`}
            />
            <StatCard
              title="下書き"
              value={notesStats.draftNotes}
              icon="📄"
              color="#718096"
            />
            <StatCard
              title="非公開"
              value={notesStats.privateNotes}
              icon="🔒"
              color="#9e9e9e"
            />
            <StatCard
              title="却下"
              value={notesStats.rejectedNotes}
              icon="❌"
              color="#e53e3e"
            />
          </div>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#4a5568'
            }}>
              ノート状態分布
            </h3>
            <ProgressBar
              label="公開済み"
              value={notesStats.publishedNotes}
              max={notesStats.totalNotes}
              color="#388e3c"
            />
            <ProgressBar
              label="承認待ち"
              value={notesStats.pendingNotes}
              max={notesStats.totalNotes}
              color="#f57c00"
            />
            <ProgressBar
              label="下書き"
              value={notesStats.draftNotes}
              max={notesStats.totalNotes}
              color="#718096"
            />
            <ProgressBar
              label="非公開"
              value={notesStats.privateNotes}
              max={notesStats.totalNotes}
              color="#9e9e9e"
            />
            <ProgressBar
              label="却下"
              value={notesStats.rejectedNotes}
              max={notesStats.totalNotes}
              color="#e53e3e"
            />
          </div>
        </div>

        {/* 互动统计 */}
        <div style={{
          marginBottom: isMobile ? '24px' : '40px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 600,
            marginBottom: isMobile ? '16px' : '24px',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>❤️</span>
            <span>インタラクション統計</span>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '16px' : '24px'
          }}>
            <StatCard
              title="総いいね数"
              value={interactionStats.totalLikes}
              icon="👍"
              color="#e53e3e"
            />
            <StatCard
              title="総お気に入り数"
              value={interactionStats.totalFavorites}
              icon="⭐"
              color="#fbbf24"
            />
            <StatCard
              title="総インタラクション"
              value={interactionStats.totalInteractions}
              icon="💝"
              color="#ec4899"
            />
          </div>
        </div>

        {/* 快速链接 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#4a5568'
          }}>
            クイックアクション
          </h3>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <Link
              to="/notes-admin"
              style={{
                padding: '12px 20px',
                background: '#1976d2',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: isMobile ? '0.9rem' : '1rem',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = '#1565c0'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = '#1976d2'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              📋 ノート管理
            </Link>
            <Link
              to="/users-admin"
              style={{
                padding: '12px 20px',
                background: '#7b1fa2',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: isMobile ? '0.9rem' : '1rem',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = '#6a1b9a'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = '#7b1fa2'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              👥 ユーザー管理
            </Link>
          </div>
        </div>
      </div>

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

export default StatisticsReport

