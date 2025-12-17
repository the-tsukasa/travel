import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NoteCard from '../components/NoteCard'
import api from '../services/api'
import Footer from '../components/Footer'

const Notes = () => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
    number: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadNotes(0, '')
  }, [])

  const loadNotes = async (page = 0, search = '') => {
    setLoading(true)
    setError('')
    
    try {
      let url = `/api/notes?page=${page}&size=12`
      if (search) {
        url = `/api/notes/search?keyword=${encodeURIComponent(search)}&page=${page}&size=12`
      }

      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        if (response.status === 401 && token) {
          // Token 过期，清除并重试
          localStorage.removeItem('token')
          const retryResponse = await fetch(url)
          if (!retryResponse.ok) throw new Error('Failed to load notes')
          const retryData = await retryResponse.json()
          const notesData = retryData.content || retryData
          setNotes(Array.isArray(notesData) ? notesData : [])
          setPagination(retryData)
          setLoading(false)
          return
        }
        throw new Error('Failed to load notes')
      }

      const data = await response.json()
      const notesData = data.content || data
      setNotes(Array.isArray(notesData) ? notesData : [])
      setPagination(data)
      setCurrentPage(page)
    } catch (err) {
      console.error('ノート読み込みエラー:', err)
      setError('ノートの読み込みに失敗しました。時間をおいて再試行してください。')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadNotes(0, searchKeyword)
  }

  const handlePageChange = (page) => {
    loadNotes(page, searchKeyword)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="container" style={{ paddingTop: '100px', minHeight: 'calc(100vh - 80px)' }}>
        <div className="header" style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>📖 旅行ノート</h1>
          <p style={{ color: '#718096', fontSize: '1.1rem', marginBottom: '20px' }}>
            あなたの旅の思い出を共有しよう。
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '15px',
            margin: '20px 0'
          }}>
            <Link to="/notes-create.html" className="btn" style={{ textDecoration: 'none' }}>
              ノートを投稿
            </Link>
            <Link to="/notes-my.html" className="btn-outline" style={{ textDecoration: 'none' }}>
              マイノート
            </Link>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="タイトルや内容で検索..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              className="btn"
              style={{ padding: '12px 24px' }}
            >
              🔍 検索
            </button>
          </form>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
            ノートを読み込み中...
          </div>
        ) : error ? (
          <div style={{
            background: '#fed7d7',
            color: '#c53030',
            padding: '15px',
            borderRadius: '10px',
            margin: '20px 0'
          }}>
            {error}
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
            まだノートがありません。最初の1件を投稿してみましょう！
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '30px'
            }}>
              {notes.map(note => (
                <NoteCard key={note.id} note={note} onUpdate={() => loadNotes(currentPage, searchKeyword)} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                margin: '30px 0'
              }}>
                {currentPage > 0 && (
                  <button
                    className="btn-outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    style={{ padding: '10px 15px', borderRadius: '10px' }}
                  >
                    前へ
                  </button>
                )}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = Math.max(0, Math.min(pagination.totalPages - 5, currentPage - 2)) + i
                  if (page >= pagination.totalPages) return null
                  return (
                    <button
                      key={page}
                      className={page === currentPage ? 'btn' : 'btn-outline'}
                      onClick={() => handlePageChange(page)}
                      style={{ padding: '10px 15px', borderRadius: '10px' }}
                    >
                      {page + 1}
                    </button>
                  )
                })}
                {currentPage < pagination.totalPages - 1 && (
                  <button
                    className="btn-outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    style={{ padding: '10px 15px', borderRadius: '10px' }}
                  >
                    次へ
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  )
}

export default Notes
