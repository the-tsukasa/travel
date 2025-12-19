import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import NavBar from '../components/layout/NavBar'
import Footer from '../components/layout/Footer'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      navigate('/login')
      return
    }
    loadNotifications()
  }, [navigate])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notifications')
      console.log('通知数据:', response.data)
      setNotifications(response.data || [])
    } catch (error) {
      console.error('通知加载失败:', error)
      console.error('错误详情:', error.response?.data)
      // 即使加载失败也设置空数组，避免无限加载
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('全部标记已读失败:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NOTE_SUBMITTED':
        return '📤'
      case 'NOTE_APPROVED':
        return '✅'
      case 'NOTE_REJECTED':
        return '❌'
      case 'NOTE_UNPUBLISHED':
        return '🔒'
      case 'ADMIN_NOTE_PENDING':
        return '📋'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'NOTE_SUBMITTED':
        return '#4299e1'
      case 'NOTE_APPROVED':
        return '#48bb78'
      case 'NOTE_REJECTED':
        return '#f56565'
      case 'NOTE_UNPUBLISHED':
        return '#7b1fa2'
      case 'ADMIN_NOTE_PENDING':
        return '#ed8936'
      default:
        return '#1976d2'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.relatedId && notification.type.startsWith('NOTE_')) {
      navigate(`/notes-my`)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <>
      <NavBar />
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '40px',
        minHeight: 'calc(100vh - 200px)',
        background: '#f7fafc'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#2d3748',
            margin: 0
          }}>
            🔔 通知
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '10px 20px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1565c0'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1976d2'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              すべて既読にする
            </button>
          )}
        </div>

        {loading ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: '#718096',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
            <p>読み込み中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ fontSize: '1.2rem', color: '#718096' }}>通知はありません</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  background: notification.isRead ? 'white' : '#f0f9ff',
                  border: notification.isRead 
                    ? '1px solid #e2e8f0' 
                    : `2px solid ${getNotificationColor(notification.type)}`,
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: notification.isRead 
                    ? '0 2px 4px rgba(0, 0, 0, 0.05)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = notification.isRead 
                    ? '0 2px 4px rgba(0, 0, 0, 0.05)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: notification.isRead ? 600 : 700,
                        color: '#2d3748',
                        margin: 0
                      }}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          flexShrink: 0,
                          marginTop: '6px'
                        }}></span>
                      )}
                    </div>
                    <p style={{
                      color: '#4a5568',
                      margin: '8px 0',
                      lineHeight: 1.6
                    }}>
                      {notification.content}
                    </p>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#718096',
                      marginTop: '12px'
                    }}>
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

export default Notifications

