import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NoteCard from '../components/notes/NoteCard'
import api from '../services/api'
import Footer from '../components/layout/Footer'

const Notes = () => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortBy, setSortBy] = useState('latest') // latest, popular, oldest
  const [currentPage, setCurrentPage] = useState(0)
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
    number: 0
  })
  const searchInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadNotes(0, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  // 键盘快捷键：按 / 聚焦搜索框
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === '/' || e.key === 'f') && !e.ctrlKey && !e.metaKey) {
        const target = e.target
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const loadNotes = async (page = 0, search = '', sort = 'latest') => {
    setLoading(true)
    setError('')
    
    try {
      let url = `/api/notes?page=${page}&size=12`
      if (search) {
        url = `/api/notes/search?keyword=${encodeURIComponent(search)}&page=${page}&size=12`
      }
      
      // 注意：后端不支持排序参数，排序在前端完成

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
      
      // 直接设置原始数据，排序通过useMemo在渲染时完成，避免阻塞数据设置
      setNotes(Array.isArray(notesData) ? notesData : [])
      setPagination(data)
      setCurrentPage(page)
      setSortBy(sort)
    } catch (err) {
      console.error('ノート読み込みエラー:', err)
      setError('ノートの読み込みに失敗しました。時間をおいて再試行してください。')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  // 防抖搜索
  const debouncedSearch = useRef(null)
  const sortByRef = useRef(sortBy)
  
  // 保持 sortByRef 与 sortBy 同步
  useEffect(() => {
    sortByRef.current = sortBy
  }, [sortBy])
  
  const handleSearchChange = useCallback((value) => {
    setSearchKeyword(value)
    
    // 清除之前的定时器
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current)
      debouncedSearch.current = null
    }
    
    // 设置新的定时器，使用 ref 获取最新的 sortBy
    debouncedSearch.current = setTimeout(() => {
      loadNotes(0, value, sortByRef.current)
      debouncedSearch.current = null
    }, 500) // 500ms 防抖
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    // 清除防抖定时器
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current)
      debouncedSearch.current = null
    }
    loadNotes(0, searchKeyword, sortBy)
  }
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current)
      }
    }
  }, [])

  const handleSortChange = (newSort) => {
    // 清除防抖定时器，防止使用旧的排序方式
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current)
      debouncedSearch.current = null
    }
    setSortBy(newSort)
    loadNotes(0, searchKeyword, newSort)
  }

  const handlePageChange = (page) => {
    loadNotes(page, searchKeyword, sortBy)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 使用useMemo缓存排序结果，避免每次渲染都重新排序
  const sortedNotes = useMemo(() => {
    if (!Array.isArray(notes) || notes.length === 0) return notes
    
    const sorted = [...notes] // 复制数组避免修改原数组
    
    if (sortBy === 'popular') {
      // 人気排序：按照点赞数+收藏数从大到小
      sorted.sort((a, b) => {
        const aScore = (a.likesCount || 0) + (a.favoritesCount || 0)
        const bScore = (b.likesCount || 0) + (b.favoritesCount || 0)
        return bScore - aScore // 降序
      })
    } else if (sortBy === 'latest') {
      // 最新排序：按照创建时间从新到旧
      sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA // 降序（新的在前）
      })
    }
    // oldest 排序：按照创建时间从旧到新（如果需要的话）
    // else if (sortBy === 'oldest') {
    //   sorted.sort((a, b) => {
    //     const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    //     const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    //     return dateA - dateB // 升序（旧的在前）
    //   })
    // }
    
    return sorted
  }, [notes, sortBy])

  return (
    <>
      <div className="notes-page">
        {/* Compact Header with Search */}
        <div className="notes-header-bar">
          <h1 className="notes-page-title">
            <span className="notes-title-icon">📖</span>
            旅行ノート
          </h1>
          
          <div className="notes-header-controls">
            {/* Search */}
            <form onSubmit={handleSearch} className="notes-search-compact">
              <div className="notes-search-wrapper-compact">
                <svg className="notes-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      // 清除防抖定时器
                      if (debouncedSearch.current) {
                        clearTimeout(debouncedSearch.current)
                        debouncedSearch.current = null
                      }
                      setSearchKeyword('')
                      loadNotes(0, '', sortBy)
                      searchInputRef.current?.blur()
                    }
                  }}
                  placeholder="検索... ( / でフォーカス)"
                  className="notes-search-input-compact"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => {
                      // 清除防抖定时器
                      if (debouncedSearch.current) {
                        clearTimeout(debouncedSearch.current)
                        debouncedSearch.current = null
                      }
                      setSearchKeyword('')
                      loadNotes(0, '', sortBy)
                    }}
                    className="notes-search-clear"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* Sort */}
            <div className="notes-sort-compact">
              <button
                className={`notes-sort-btn-compact ${sortBy === 'latest' ? 'active' : ''}`}
                onClick={() => handleSortChange('latest')}
                title="最新"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                <span>最新</span>
              </button>
              <button
                className={`notes-sort-btn-compact ${sortBy === 'popular' ? 'active' : ''}`}
                onClick={() => handleSortChange('popular')}
                title="人気"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>人気</span>
              </button>
            </div>

            {/* Actions */}
            <div className="notes-header-buttons">
              <Link to="/notes-create" className="btn btn-primary btn-icon" title="ノートを投稿">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </Link>
              <Link to="/notes-my" className="btn btn-outline btn-icon" title="マイノート">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="notes-loading">
            <div className="notes-skeleton-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="notes-skeleton-card">
                  <div className="notes-skeleton-image"></div>
                  <div className="notes-skeleton-content">
                    <div className="notes-skeleton-title"></div>
                    <div className="notes-skeleton-text"></div>
                    <div className="notes-skeleton-text short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="notes-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>読み込みエラー</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => loadNotes(currentPage, searchKeyword, sortBy)}>
              再試行
            </button>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="notes-empty">
            <div className="notes-empty-icon">📝</div>
            <h3>まだノートがありません</h3>
            <p>
              {searchKeyword 
                ? `「${searchKeyword}」の検索結果が見つかりませんでした。`
                : '最初の1件を投稿してみましょう！'
              }
            </p>
            {!searchKeyword && (
              <Link to="/notes-create" className="btn btn-primary">
                ノートを投稿する
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="notes-results-info">
              <span>
                {pagination.totalElements > 0 
                  ? `${pagination.totalElements}件のノートが見つかりました`
                  : 'ノートが見つかりませんでした'
                }
              </span>
            </div>

            <div className="notes-grid" key={`grid-${currentPage}-${sortBy}-${searchKeyword}`}>
              {sortedNotes.map((note, index) => (
                <div 
                  key={note.id} 
                  className="notes-grid-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <NoteCard 
                    note={note} 
                    onUpdate={() => loadNotes(currentPage, searchKeyword, sortBy)} 
                  />
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="notes-pagination">
                <button
                  className="notes-pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  前へ
                </button>

                <div className="notes-pagination-pages">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = Math.max(0, Math.min(pagination.totalPages - 5, currentPage - 2)) + i
                    if (page >= pagination.totalPages) return null
                    return (
                      <button
                        key={page}
                        className={`notes-pagination-page ${page === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page + 1}
                      </button>
                    )
                  })}
                </div>

                <button
                  className="notes-pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages - 1}
                >
                  次へ
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
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
