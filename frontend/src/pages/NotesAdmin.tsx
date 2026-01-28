import { useState, useEffect, ChangeEvent, MouseEvent, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import type { NotesDTO, UserDTO, NoteStatus } from '../types'
import '../styles/pages/notes-admin.css'

type TabType = 'pending' | 'all'
type StatusFilterType = 'ALL' | NoteStatus
type SortByType = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

interface NotesStats {
  totalNotes: number
  pendingNotes: number
  publishedNotes: number
  draftNotes: number
  rejectedNotes: number
  privateNotes: number
}

interface StatCardProps {
  title: string
  value: number
  icon: string
  color: string
  link?: string
  urgent?: boolean
  onClick?: () => void
  isActive?: boolean
}

const NotesAdmin = () => {
  const [pendingNotes, setPendingNotes] = useState<NotesDTO[]>([])
  const [allNotes, setAllNotes] = useState<NotesDTO[]>([])
  const [filteredNotes, setFilteredNotes] = useState<NotesDTO[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false)
  const [noteToReject, setNoteToReject] = useState<number | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [selectedNote, setSelectedNote] = useState<NotesDTO | null>(null)
  const [currentTab, setCurrentTab] = useState<TabType>('pending')
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL')
  const [userInfo, setUserInfo] = useState<UserDTO | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortByType>('date-desc')
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set())
  const [processing, setProcessing] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [stats, setStats] = useState<NotesStats>({
    totalNotes: 0,
    pendingNotes: 0,
    publishedNotes: 0,
    draftNotes: 0,
    rejectedNotes: 0,
    privateNotes: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    if (currentTab === 'pending') {
      loadPendingNotes()
    } else if (currentTab === 'all') {
      loadAllNotes()
    }
  }, [currentTab])

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    filterAndSortNotes()
  }, [searchTerm, pendingNotes, allNotes, sortBy, statusFilter, currentTab])

  const checkAdminAuth = async (): Promise<void> => {
    const token = TokenUtil.getToken()
    if (!token) {
      alert('まずログインしてください。')
      navigate('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'ADMIN') {
        alert('アクセス権がありません。管理者のみがこのページを利用できます。')
        navigate('/notes')
        return
      }

      const response = await api.get<UserDTO>('/user/me')
      setUserInfo(response.data)
      setLoading(false)
    } catch (error) {
      console.error('認証エラー:', error)
      TokenUtil.clearToken()
      alert('ログイン情報の有効期限が切れました。再度ログインしてください。')
      navigate('/login')
    }
  }

  const loadPendingNotes = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get<NotesDTO[]>('/admin/notes/pending')
      setPendingNotes(response.data || [])
    } catch (error: any) {
      console.error('ノート読み込みエラー:', error)
      if (error.response?.status === 403) {
        setError('アクセス権がありません。')
        navigate('/notes')
      } else {
        setError('承認待ちノートの読み込みに失敗しました。時間をおいて再試行してください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAllNotes = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get<NotesDTO[]>('/admin/notes')
      setAllNotes(response.data || [])
    } catch (error: any) {
      console.error('全ノート読み込みエラー:', error)
      if (error.response?.status === 403) {
        setError('アクセス権がありません。')
        navigate('/notes')
      } else {
        setError('ノートの読み込みに失敗しました。時間をおいて再試行してください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (): Promise<void> => {
    try {
      const response = await api.get<NotesStats>('/admin/notes/stats')
      if (response.data) {
        setStats({
          totalNotes: response.data.totalNotes || 0,
          pendingNotes: response.data.pendingNotes || 0,
          publishedNotes: response.data.publishedNotes || 0,
          draftNotes: response.data.draftNotes || 0,
          rejectedNotes: response.data.rejectedNotes || 0,
          privateNotes: response.data.privateNotes || 0
        })
      }
    } catch (error) {
      console.error('統計データの読み込みエラー:', error)
    }
  }

  const filterAndSortNotes = (): void => {
    let sourceNotes = currentTab === 'pending' ? pendingNotes : allNotes
    let filtered = [...sourceNotes]

    if (currentTab === 'all' && statusFilter !== 'ALL') {
      filtered = filtered.filter(note => note.status === statusFilter)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(term) ||
        note.username?.toLowerCase().includes(term) ||
        note.content?.toLowerCase().includes(term) ||
        note.location?.toLowerCase().includes(term)
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'date-asc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '')
        default:
          return 0
      }
    })

    setFilteredNotes(filtered)
  }

  const showSuccessMessage = (message: string): void => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleApprove = async (noteId: number): Promise<void> => {
    if (!confirm('このノートを承認しますか？')) return

    try {
      setProcessing(true)
      await api.post(`/admin/notes/${noteId}/approve`)
      showSuccessMessage('✅ ノートを承認しました。')
      if (currentTab === 'pending') {
        loadPendingNotes()
      } else {
        loadAllNotes()
      }
      loadStats()
      setSelectedNotes(new Set())
    } catch (error) {
      console.error('承認エラー:', error)
      alert('❌ 承認に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const handleBatchApprove = async (): Promise<void> => {
    if (selectedNotes.size === 0) {
      alert('承認するノートを選択してください。')
      return
    }

    if (!confirm(`${selectedNotes.size}件のノートを一括承認しますか？`)) return

    try {
      setProcessing(true)
      const promises = Array.from(selectedNotes).map(id => 
        api.post(`/admin/notes/${id}/approve`)
      )
      await Promise.all(promises)
      showSuccessMessage(`✅ ${selectedNotes.size}件のノートを承認しました。`)
      if (currentTab === 'pending') {
        loadPendingNotes()
      } else {
        loadAllNotes()
      }
      loadStats()
      setSelectedNotes(new Set())
    } catch (error) {
      console.error('一括承認エラー:', error)
      alert('❌ 一括承認に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const handleBatchReject = (): void => {
    if (selectedNotes.size === 0) {
      alert('差し戻すノートを選択してください。')
      return
    }
    alert('一括差し戻し機能は準備中です。個別に差し戻してください。')
  }

  const handleBatchDelete = async (): Promise<void> => {
    if (selectedNotes.size === 0) {
      alert('削除するノートを選択してください。')
      return
    }

    if (!confirm(`${selectedNotes.size}件のノートを削除しますか？この操作は元に戻せません。`)) return

    try {
      setProcessing(true)
      const promises = Array.from(selectedNotes).map(id => 
        api.delete(`/admin/notes/${id}`)
      )
      await Promise.all(promises)
      showSuccessMessage(`✅ ${selectedNotes.size}件のノートを削除しました。`)
      if (currentTab === 'pending') {
        loadPendingNotes()
      } else {
        loadAllNotes()
      }
      loadStats()
      setSelectedNotes(new Set())
    } catch (error) {
      console.error('一括削除エラー:', error)
      alert('❌ 一括削除に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClick = (noteId: number): void => {
    setNoteToReject(noteId)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = async (): Promise<void> => {
    if (!noteToReject) return
    
    if (!rejectReason.trim()) {
      alert('差し戻し理由を入力してください。')
      return
    }

    try {
      setProcessing(true)
      await api.post(`/admin/notes/${noteToReject}/reject`, {
        rejectReason: rejectReason.trim()
      })
      setRejectModalOpen(false)
      setNoteToReject(null)
      setRejectReason('')
      showSuccessMessage('✅ ノートを差し戻しました。')
      if (currentTab === 'pending') {
        loadPendingNotes()
      } else {
        loadAllNotes()
      }
      loadStats()
      setSelectedNotes(new Set())
    } catch (error: any) {
      console.error('差し戻しエラー:', error)
      alert(error.response?.data?.message || '❌ 差し戻し処理に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }
  
  const handleUnpublish = async (noteId: number): Promise<void> => {
    if (!confirm('このノートを非公開にしますか？')) return

    try {
      setProcessing(true)
      await api.post(`/admin/notes/${noteId}/unpublish`)
      showSuccessMessage('✅ ノートを非公開にしました。')
      if (currentTab === 'pending') {
        loadPendingNotes()
      } else {
        loadAllNotes()
      }
      loadStats()
      setSelectedNotes(new Set())
    } catch (error: any) {
      console.error('非公開エラー:', error)
      alert(error.response?.data?.message || '❌ 非公開処理に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteClick = (noteId: number): void => {
    setNoteToDelete(noteId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!noteToDelete) return

    if (!confirm('このノートを削除しますか？この操作は元に戻せません。')) return

    try {
      setProcessing(true)
      await api.delete(`/admin/notes/${noteToDelete}`)
      setDeleteModalOpen(false)
      setNoteToDelete(null)
      showSuccessMessage('✅ ノートを削除しました。')
      if (currentTab === 'pending') {
        loadPendingNotes()
      } else {
        loadAllNotes()
      }
      loadStats()
      setSelectedNotes(new Set())
    } catch (error: any) {
      console.error('削除エラー:', error)
      alert(error.response?.data?.message || '❌ 削除処理に失敗しました。')
      setDeleteModalOpen(false)
    } finally {
      setProcessing(false)
    }
  }

  const handleViewDetail = (note: NotesDTO): void => {
    setSelectedNote(note)
    setDetailModalOpen(true)
  }

  const handleSelectNote = (noteId: number): void => {
    const newSelected = new Set(selectedNotes)
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId)
    } else {
      newSelected.add(noteId)
    }
    setSelectedNotes(newSelected)
  }

  const handleSelectAll = (): void => {
    if (selectedNotes.size === filteredNotes.length && filteredNotes.length > 0) {
      setSelectedNotes(new Set())
    } else {
      setSelectedNotes(new Set(filteredNotes.map(note => note.id)))
    }
  }

  const getStatusLabel = (status?: NoteStatus): string => {
    const labels: Record<NoteStatus, string> = {
      'DRAFT': '📝 草稿',
      'PENDING': '⏳ 審査中',
      'PUBLISHED': '✅ 公開済み',
      'REJECTED': '❌ 差し戻し',
      'PRIVATE': '🔒 非公開'
    }
    return status ? labels[status] || status : ''
  }

  const getStatusColor = (status?: NoteStatus): string => {
    const colors: Record<NoteStatus, string> = {
      'DRAFT': '#1976d2',
      'PENDING': '#f57c00',
      'PUBLISHED': '#388e3c',
      'REJECTED': '#c62828',
      'PRIVATE': '#7b1fa2'
    }
    return status ? colors[status] || '#666' : '#666'
  }

  const formatImageUrl = (imageUrl: string): string | null => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http')) return imageUrl
    if (imageUrl.startsWith('/')) return `http://localhost:8080${imageUrl}`
    return `http://localhost:8080/uploads/${imageUrl}`
  }

  const getImageUrls = (note: NotesDTO): string[] => {
    if (note.imageUrls && Array.isArray(note.imageUrls) && note.imageUrls.length > 0) {
      return note.imageUrls.map(formatImageUrl).filter((url): url is string => url !== null)
    }
    if (note.imageUrl) {
      try {
        const parsed = JSON.parse(note.imageUrl)
        if (Array.isArray(parsed)) {
          return parsed.map(formatImageUrl).filter((url): url is string => url !== null)
        }
      } catch {
        // 不是JSON，作为单个图片处理
      }
      const url = formatImageUrl(note.imageUrl)
      return url ? [url] : []
    }
    return []
  }

  const escapeHtml = (text?: string): string => {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && !userInfo) {
    return (
      <div className="notes-admin-loading">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    )
  }

  const displayNotes = filteredNotes

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, link, urgent, onClick, isActive }) => {
    const isClickable = link || onClick
    const content = (
      <div style={{
        background: isActive ? `${color}15` : 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: isActive ? `0 4px 12px ${color}40` : '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: urgent ? `2px solid ${color}` : isActive ? `2px solid ${color}` : '1px solid #e2e8f0',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
      onMouseEnter={(e: MouseEvent<HTMLDivElement>) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = isActive ? `0 4px 12px ${color}40` : '0 4px 6px rgba(0, 0, 0, 0.1)'
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
          {isClickable && (
            <span style={{
              fontSize: '0.75rem',
              color: color,
              fontWeight: 600,
              marginLeft: 'auto'
            }}>クリック</span>
          )}
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

  return (
    <>
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '40px',
        minHeight: 'calc(100vh - 200px)',
        background: '#f7fafc'
      }}>
        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: 'linear-gradient(135deg, #48bb78, #38a169)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)'
          }}>
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div style={{
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                marginBottom: '10px',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>📋</span>
                <span>ノート管理</span>
              </h1>
              <p style={{
                color: '#718096',
                fontSize: '1.1rem'
              }}>
                ユーザー投稿のノートを確認・管理します
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <Link 
                to="/admin" 
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#4a5568',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
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

        {/* Stats Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <StatCard
            title="ノート総数"
            value={stats.totalNotes}
            icon="📝"
            color="#1976d2"
            onClick={() => {
              setCurrentTab('all')
              setStatusFilter('ALL')
            }}
            isActive={currentTab === 'all' && statusFilter === 'ALL'}
          />
          <StatCard
            title="承認待ち"
            value={stats.pendingNotes}
            icon="⏳"
            color="#f57c00"
            urgent={stats.pendingNotes > 0}
            onClick={() => {
              setCurrentTab('all')
              setStatusFilter('PENDING')
            }}
            isActive={currentTab === 'all' && statusFilter === 'PENDING'}
          />
          <StatCard
            title="公開済み"
            value={stats.publishedNotes}
            icon="✅"
            color="#388e3c"
            onClick={() => {
              setCurrentTab('all')
              setStatusFilter('PUBLISHED')
            }}
            isActive={currentTab === 'all' && statusFilter === 'PUBLISHED'}
          />
          <StatCard
            title="差し戻し"
            value={stats.rejectedNotes}
            icon="❌"
            color="#c62828"
            onClick={() => {
              setCurrentTab('all')
              setStatusFilter('REJECTED')
            }}
            isActive={currentTab === 'all' && statusFilter === 'REJECTED'}
          />
          <StatCard
            title="草稿"
            value={stats.draftNotes}
            icon="📝"
            color="#1976d2"
            onClick={() => {
              setCurrentTab('all')
              setStatusFilter('DRAFT')
            }}
            isActive={currentTab === 'all' && statusFilter === 'DRAFT'}
          />
          <StatCard
            title="非公開"
            value={stats.privateNotes}
            icon="🔒"
            color="#7b1fa2"
            onClick={() => {
              setCurrentTab('all')
              setStatusFilter('PRIVATE')
            }}
            isActive={currentTab === 'all' && statusFilter === 'PRIVATE'}
          />
        </div>

        {/* Tabs Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>

          {/* Pending Tab */}
          {currentTab === 'pending' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#2d3748',
                  margin: 0
                }}>
                  📋 承認待ちノート
                </h3>
                {selectedNotes.size > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleBatchApprove}
                      disabled={processing}
                      style={{
                        padding: '10px 20px',
                        background: processing ? '#ccc' : '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ✅ 選択した{selectedNotes.size}件を承認
                    </button>
                    <button
                      onClick={handleBatchReject}
                      disabled={processing}
                      style={{
                        padding: '10px 20px',
                        background: processing ? '#ccc' : '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ❌ 選択した{selectedNotes.size}件を差し戻し
                    </button>
                  </div>
                )}
              </div>
              
              {/* Search and Sort Section */}
              <div style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <input
                    type="text"
                    placeholder="🔍 タイトル、投稿者、内容、場所で検索..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                      e.target.style.borderColor = '#1976d2'
                      e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <label style={{
                    fontWeight: 600,
                    color: '#4a5568',
                    whiteSpace: 'nowrap'
                  }}>
                    並び替え：
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortByType)}
                    style={{
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer',
                      minWidth: '200px'
                    }}
                  >
                    <option value="date-desc">作成日（新しい順）</option>
                    <option value="date-asc">作成日（古い順）</option>
                    <option value="title-asc">タイトル（あいうえお順）</option>
                    <option value="title-desc">タイトル（逆順）</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#718096'
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
                  <p>承認待ちノートを読み込み中</p>
                </div>
              ) : error ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#e53e3e',
                  fontWeight: 600
                }}>
                  {error}
                </div>
              ) : displayNotes.length === 0 ? (
                <div style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#718096',
                  fontSize: '1.1rem'
                }}>
                  {searchTerm ? '検索結果が見つかりませんでした。' : '承認待ちのノートはありません。'}
                </div>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr style={{
                          background: '#f7fafc',
                          borderBottom: '2px solid #e2e8f0'
                        }}>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <input
                              type="checkbox"
                              checked={selectedNotes.size === displayNotes.length && displayNotes.length > 0}
                              onChange={handleSelectAll}
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>タイトル</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>投稿者</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>内容プレビュー</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>場所</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>作成日</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayNotes.map(note => (
                          <tr 
                            key={note.id} 
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              transition: 'background 0.2s ease',
                              background: selectedNotes.has(note.id) ? '#e6f3ff' : 'white'
                            }}
                            onMouseEnter={(e: MouseEvent<HTMLTableRowElement>) => {
                              if (!selectedNotes.has(note.id)) {
                                e.currentTarget.style.background = '#f7fafc'
                              }
                            }}
                            onMouseLeave={(e: MouseEvent<HTMLTableRowElement>) => {
                              if (!selectedNotes.has(note.id)) {
                                e.currentTarget.style.background = 'white'
                              }
                            }}
                          >
                            <td style={{ padding: '16px' }}>
                              <input
                                type="checkbox"
                                checked={selectedNotes.has(note.id)}
                                onChange={() => handleSelectNote(note.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{
                                fontWeight: 600,
                                color: '#2d3748',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={note.title}>
                                {escapeHtml(note.title)}
                              </div>
                            </td>
                            <td style={{ padding: '16px', color: '#4a5568' }}>
                              {escapeHtml(note.username)}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#718096'
                              }} title={note.content}>
                                {escapeHtml(note.content)}
                              </div>
                            </td>
                            <td style={{ padding: '16px', color: '#4a5568' }}>
                              {note.location ? `📍 ${escapeHtml(note.location)}` : '-'}
                            </td>
                            <td style={{ padding: '16px', color: '#718096', fontSize: '0.9rem' }}>
                              {formatDate(note.createdAt)}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}>
                                <button
                                  onClick={() => handleApprove(note.id)}
                                  disabled={processing}
                                  title="承認"
                                  style={{
                                    padding: '8px 12px',
                                    background: '#48bb78',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    transition: 'all 0.3s ease',
                                    opacity: processing ? 0.6 : 1
                                  }}
                                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                                    if (!processing) {
                                      e.currentTarget.style.background = '#38a169'
                                      e.currentTarget.style.transform = 'translateY(-2px)'
                                    }
                                  }}
                                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                                    if (!processing) {
                                      e.currentTarget.style.background = '#48bb78'
                                      e.currentTarget.style.transform = 'translateY(0)'
                                    }
                                  }}
                                >
                                  ✅
                                </button>
                                <button
                                  onClick={() => handleRejectClick(note.id)}
                                  disabled={processing}
                                  title="差し戻し"
                                  style={{
                                    padding: '8px 12px',
                                    background: '#f56565',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    transition: 'all 0.3s ease',
                                    opacity: processing ? 0.6 : 1
                                  }}
                                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                                    if (!processing) {
                                      e.currentTarget.style.background = '#e53e3e'
                                      e.currentTarget.style.transform = 'translateY(-2px)'
                                    }
                                  }}
                                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                                    if (!processing) {
                                      e.currentTarget.style.background = '#f56565'
                                      e.currentTarget.style.transform = 'translateY(0)'
                                    }
                                  }}
                                >
                                  ❌
                                </button>
                                <button
                                  onClick={() => handleViewDetail(note)}
                                  title="詳細を見る"
                                  style={{
                                    padding: '8px 12px',
                                    background: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                                    e.currentTarget.style.background = '#1565c0'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                  }}
                                  onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                                    e.currentTarget.style.background = '#1976d2'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                  }}
                                >
                                  👁️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Notes Tab - 由于文件太大，这里只显示关键部分，完整代码在后续部分 */}
          {currentTab === 'all' && (
            <div>
              {/* 类似的代码结构，但包含状态过滤 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#2d3748',
                  margin: 0
                }}>
                  📚 全ノート一覧
                </h3>
                {selectedNotes.size > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleBatchApprove}
                      disabled={processing}
                      style={{
                        padding: '10px 20px',
                        background: processing ? '#ccc' : '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ✅ 選択した{selectedNotes.size}件を承認
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      disabled={processing}
                      style={{
                        padding: '10px 20px',
                        background: processing ? '#ccc' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🗑️ 選択した{selectedNotes.size}件を削除
                    </button>
                  </div>
                )}
              </div>
              
              {/* Status Filter */}
              <div style={{
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <label style={{
                  fontWeight: '600',
                  color: '#4a5568'
                }}>
                  状態フィルター：
                </label>
                {(['ALL', 'PENDING', 'PUBLISHED', 'DRAFT', 'REJECTED', 'PRIVATE'] as StatusFilterType[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: statusFilter === status ? getStatusColor(status as NoteStatus) : 'white',
                      color: statusFilter === status ? '#fff' : '#4a5568',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: statusFilter === status ? '600' : '500',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                      if (statusFilter !== status) {
                        e.currentTarget.style.borderColor = getStatusColor(status as NoteStatus)
                        e.currentTarget.style.background = `${getStatusColor(status as NoteStatus)}10`
                      }
                    }}
                    onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                      if (statusFilter !== status) {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.background = 'white'
                      }
                    }}
                  >
                    {status === 'ALL' ? 'すべて' : getStatusLabel(status as NoteStatus)}
                  </button>
                ))}
              </div>

              {/* Search and Sort Section - 与 pending tab 相同 */}
              <div style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <input
                    type="text"
                    placeholder="🔍 タイトル、投稿者、内容、場所で検索..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                      e.target.style.borderColor = '#1976d2'
                      e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <label style={{
                    fontWeight: 600,
                    color: '#4a5568',
                    whiteSpace: 'nowrap'
                  }}>
                    並び替え：
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortByType)}
                    style={{
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer',
                      minWidth: '200px'
                    }}
                  >
                    <option value="date-desc">作成日（新しい順）</option>
                    <option value="date-asc">作成日（古い順）</option>
                    <option value="title-asc">タイトル（あいうえお順）</option>
                    <option value="title-desc">タイトル（逆順）</option>
                  </select>
                </div>
              </div>

              {/* Content - 与 pending tab 类似，但包含状态列 */}
              {loading ? (
                <div style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#718096'
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
                  <p>ノートを読み込み中</p>
                </div>
              ) : error ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#e53e3e',
                  fontWeight: 600
                }}>
                  {error}
                </div>
              ) : displayNotes.length === 0 ? (
                <div style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#718096',
                  fontSize: '1.1rem'
                }}>
                  {searchTerm || statusFilter !== 'ALL' 
                    ? '検索結果が見つかりませんでした。' 
                    : 'ノートがありません。'}
                </div>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr style={{
                          background: '#f7fafc',
                          borderBottom: '2px solid #e2e8f0'
                        }}>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <input
                              type="checkbox"
                              checked={selectedNotes.size === displayNotes.length && displayNotes.length > 0}
                              onChange={handleSelectAll}
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>状態</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>タイトル</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>投稿者</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>内容プレビュー</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>場所</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>作成日</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#4a5568',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayNotes.map(note => (
                          <tr 
                            key={note.id}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              transition: 'background 0.2s ease',
                              background: selectedNotes.has(note.id) ? '#e6f3ff' : 'white'
                            }}
                            onMouseEnter={(e: MouseEvent<HTMLTableRowElement>) => {
                              if (!selectedNotes.has(note.id)) {
                                e.currentTarget.style.background = '#f7fafc'
                              }
                            }}
                            onMouseLeave={(e: MouseEvent<HTMLTableRowElement>) => {
                              if (!selectedNotes.has(note.id)) {
                                e.currentTarget.style.background = 'white'
                              }
                            }}
                          >
                            <td style={{ padding: '16px' }}>
                              <input
                                type="checkbox"
                                checked={selectedNotes.has(note.id)}
                                onChange={() => handleSelectNote(note.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '16px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: `${getStatusColor(note.status)}20`,
                                color: getStatusColor(note.status),
                                display: 'inline-block'
                              }}>
                                {getStatusLabel(note.status)}
                              </span>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{
                                fontWeight: 600,
                                color: '#2d3748',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={note.title}>
                                {escapeHtml(note.title)}
                              </div>
                            </td>
                            <td style={{ padding: '16px', color: '#4a5568' }}>
                              {escapeHtml(note.username)}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#718096'
                              }} title={note.content}>
                                {escapeHtml(note.content)}
                              </div>
                            </td>
                            <td style={{ padding: '16px', color: '#4a5568' }}>
                              {note.location ? `📍 ${escapeHtml(note.location)}` : '-'}
                            </td>
                            <td style={{ padding: '16px', color: '#718096', fontSize: '0.9rem' }}>
                              {formatDate(note.createdAt)}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}>
                                {note.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(note.id)}
                                      disabled={processing}
                                      title="承認"
                                      style={{
                                        padding: '8px 12px',
                                        background: '#48bb78',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        transition: 'all 0.3s ease',
                                        opacity: processing ? 0.6 : 1
                                      }}
                                    >
                                      ✅
                                    </button>
                                    <button
                                      onClick={() => handleRejectClick(note.id)}
                                      disabled={processing}
                                      title="差し戻し"
                                      style={{
                                        padding: '8px 12px',
                                        background: '#f56565',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        transition: 'all 0.3s ease',
                                        opacity: processing ? 0.6 : 1
                                      }}
                                    >
                                      ❌
                                    </button>
                                  </>
                                )}
                                {note.status === 'PUBLISHED' && (
                                  <button
                                    onClick={() => handleUnpublish(note.id)}
                                    disabled={processing}
                                    title="非公開"
                                    style={{
                                      padding: '8px 12px',
                                      background: '#7b1fa2',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: processing ? 'not-allowed' : 'pointer',
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                      transition: 'all 0.3s ease',
                                      opacity: processing ? 0.6 : 1
                                    }}
                                  >
                                    🔒
                                  </button>
                                )}
                                <button
                                  onClick={() => handleViewDetail(note)}
                                  title="詳細を見る"
                                  style={{
                                    padding: '8px 12px',
                                    background: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(note.id)}
                                  disabled={processing}
                                  title="削除"
                                  style={{
                                    padding: '8px 12px',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    transition: 'all 0.3s ease',
                                    opacity: processing ? 0.6 : 1
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && selectedNote && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => {
            setDetailModalOpen(false)
            setSelectedNote(null)
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#2d3748',
                margin: 0
              }}>
                📝 ノート詳細
              </h3>
              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  setSelectedNote(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#718096',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.color = '#2d3748'
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#718096'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '24px'
            }}>
              <div style={{
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#4a5568',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  タイトル
                </h4>
                <p style={{
                  color: '#2d3748',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  margin: 0
                }}>
                  {escapeHtml(selectedNote.title)}
                </p>
              </div>
              <div style={{
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#4a5568',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  投稿者
                </h4>
                <p style={{
                  color: '#4a5568',
                  margin: 0
                }}>
                  {escapeHtml(selectedNote.username)}
                </p>
              </div>
              {selectedNote.location && (
                <div style={{
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#4a5568',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    場所
                  </h4>
                  <p style={{
                    color: '#4a5568',
                    margin: 0
                  }}>
                    📍 {escapeHtml(selectedNote.location)}
                  </p>
                </div>
              )}
              <div style={{
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#4a5568',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  内容
                </h4>
                <div style={{
                  color: '#4a5568',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}>
                  {escapeHtml(selectedNote.content)}
                </div>
              </div>
              {(() => {
                const imageUrls = getImageUrls(selectedNote)
                if (imageUrls.length === 0) return null
                return (
                  <div style={{
                    marginBottom: '24px'
                  }}>
                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#4a5568',
                      marginBottom: '8px',
                      paddingBottom: '8px',
                      borderBottom: '2px solid #e2e8f0'
                    }}>
                      画像 ({imageUrls.length}枚)
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      marginTop: '12px'
                    }}>
                      {imageUrls.map((url, index) => (
                        <img 
                          key={index}
                          src={url} 
                          alt={`${selectedNote.title} - ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}
              <div style={{
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#4a5568',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  状態
                </h4>
                <p style={{ margin: 0 }}>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: `${getStatusColor(selectedNote.status)}20`,
                    color: getStatusColor(selectedNote.status),
                    display: 'inline-block'
                  }}>
                    {getStatusLabel(selectedNote.status)}
                  </span>
                </p>
              </div>
              {selectedNote.submittedAt && (
                <div style={{
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#4a5568',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    提出日
                  </h4>
                  <p style={{
                    color: '#718096',
                    margin: 0
                  }}>
                    {formatDate(selectedNote.submittedAt)}
                  </p>
                </div>
              )}
              {selectedNote.reviewedAt && (
                <div style={{
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#4a5568',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    審査日
                  </h4>
                  <p style={{
                    color: '#718096',
                    margin: 0
                  }}>
                    {formatDate(selectedNote.reviewedAt)}
                    {selectedNote.reviewedByUsername && ` (審査者: ${escapeHtml(selectedNote.reviewedByUsername)})`}
                  </p>
                </div>
              )}
              {selectedNote.rejectReason && (
                <div style={{
                  marginBottom: '24px'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#4a5568',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    差し戻し理由
                  </h4>
                  <p style={{
                    padding: '12px',
                    backgroundColor: '#ffebee',
                    borderRadius: '8px',
                    color: '#c62828',
                    whiteSpace: 'pre-wrap',
                    margin: 0
                  }}>
                    {escapeHtml(selectedNote.rejectReason)}
                  </p>
                </div>
              )}
              <div style={{
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#4a5568',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  作成日
                </h4>
                <p style={{
                  color: '#718096',
                  margin: 0
                }}>
                  {formatDate(selectedNote.createdAt)}
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: '24px',
              borderTop: '1px solid #e2e8f0'
            }}>
              {selectedNote?.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedNote.id)
                      setDetailModalOpen(false)
                      setSelectedNote(null)
                    }}
                    disabled={processing}
                    style={{
                      padding: '12px 24px',
                      background: processing ? '#ccc' : '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ✅ 承認する
                  </button>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false)
                      setSelectedNote(null)
                      handleRejectClick(selectedNote.id)
                    }}
                    disabled={processing}
                    style={{
                      padding: '12px 24px',
                      background: processing ? '#ccc' : '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ❌ 差し戻す
                  </button>
                </>
              )}
              
              {selectedNote?.status === 'PUBLISHED' && (
                <button
                  onClick={() => {
                    handleUnpublish(selectedNote.id)
                    setDetailModalOpen(false)
                    setSelectedNote(null)
                  }}
                  disabled={processing}
                  style={{
                    padding: '12px 24px',
                    background: processing ? '#ccc' : '#7b1fa2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🔒 非公開にする
                </button>
              )}
              
              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  setSelectedNote(null)
                  handleDeleteClick(selectedNote.id)
                }}
                disabled={processing}
                style={{
                  padding: '12px 24px',
                  background: processing ? '#ccc' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                🗑️ 削除
              </button>
              
              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  setSelectedNote(null)
                }}
                style={{
                  padding: '12px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#cbd5e0'
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#e2e8f0'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            setDeleteModalOpen(false)
            setNoteToDelete(null)
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#2d3748',
                margin: 0
              }}>
                ⚠️ 削除の確認
              </h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setNoteToDelete(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#718096',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.color = '#2d3748'
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#718096'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '24px'
            }}>
              <p style={{ marginBottom: '15px', color: '#4a5568' }}>
                このノートを削除しますか？
              </p>
              <p style={{ color: '#dc2626', fontWeight: '600' }}>
                この操作は元に戻せません。ノートのすべてのデータが削除されます。
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: '24px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setNoteToDelete(null)
                }}
                style={{
                  padding: '12px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#cbd5e0'
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#e2e8f0'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={processing}
                style={{
                  padding: '12px 24px',
                  background: processing ? '#ccc' : '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                {processing ? '処理中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            setRejectModalOpen(false)
            setNoteToReject(null)
            setRejectReason('')
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#2d3748',
                margin: 0
              }}>
                ⚠️ 差し戻しの確認
              </h3>
              <button
                onClick={() => {
                  setRejectModalOpen(false)
                  setNoteToReject(null)
                  setRejectReason('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#718096',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#f7fafc'
                  e.currentTarget.style.color = '#2d3748'
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#718096'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '24px'
            }}>
              <p style={{ marginBottom: '15px', color: '#4a5568' }}>
                このノートを差し戻しますか？差し戻し理由を入力してください。
              </p>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#4a5568'
              }}>
                差し戻し理由 <span style={{ color: '#c62828' }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                placeholder="例：内容が不適切です。画像を追加してください。など..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                  e.target.style.borderColor = '#1976d2'
                  e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)'
                }}
                onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                }}
                required
              />
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                この理由はノートの作成者に表示されます。
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              padding: '24px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => {
                  setRejectModalOpen(false)
                  setNoteToReject(null)
                  setRejectReason('')
                }}
                style={{
                  padding: '12px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#cbd5e0'
                }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = '#e2e8f0'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processing || !rejectReason.trim()}
                style={{
                  padding: '12px 24px',
                  background: processing || !rejectReason.trim() ? '#ccc' : '#c62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: processing || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                {processing ? '処理中...' : '差し戻す'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

    </>
  )
}

export default NotesAdmin
