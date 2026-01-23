import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NoteCard from '../components/notes/NoteCard'
import api from '../services/api'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import SearchAndSort from '../components/common/SearchAndSort'
import WeatherWidget from '../components/common/WeatherWidget'
import type { NotesDTO, PageResponse } from '../types'

interface Pagination {
  totalPages: number
  totalElements: number
  number: number
}

const Notes = () => {
  const [notes, setNotes] = useState<NotesDTO[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'name'>('latest')
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [pagination, setPagination] = useState<Pagination>({
    totalPages: 0,
    totalElements: 0,
    number: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadNotes(0, '')
    // 页面加载时滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次


  const loadNotes = async (page: number = 0, search: string = '', sort: 'latest' | 'popular' | 'name' = 'latest') => {
    setLoading(true)
    setError('')
    
    try {
      let url = `/api/notes?page=${page}&size=12`
      if (search) {
        url = `/api/notes/search?keyword=${encodeURIComponent(search)}&page=${page}&size=12`
      }
      
      // 注意：后端不支持排序参数，排序在前端完成

      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
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
          const retryData = await retryResponse.json() as PageResponse<NotesDTO> | NotesDTO[]
          const notesData = Array.isArray(retryData) ? retryData : (retryData as PageResponse<NotesDTO>).content || []
          setNotes(Array.isArray(notesData) ? notesData : [])
          if (!Array.isArray(retryData)) {
            setPagination({
              totalPages: (retryData as PageResponse<NotesDTO>).totalPages || 0,
              totalElements: (retryData as PageResponse<NotesDTO>).totalElements || 0,
              number: (retryData as PageResponse<NotesDTO>).number || 0
            })
          }
          setLoading(false)
          return
        }
        throw new Error('Failed to load notes')
      }

      const data = await response.json() as PageResponse<NotesDTO> | NotesDTO[]
      const notesData = Array.isArray(data) ? data : (data as PageResponse<NotesDTO>).content || []
      
      // 直接设置原始数据，排序通过useMemo在渲染时完成，避免阻塞数据设置
      setNotes(Array.isArray(notesData) ? notesData : [])
      if (!Array.isArray(data)) {
        setPagination({
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0,
          number: data.number || 0
        })
      }
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
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchKeyword(value)
  }, [])

  const handleSortChange = (newSort: 'latest' | 'popular' | 'name') => {
    setSortBy(newSort)
    loadNotes(0, searchKeyword, newSort)
  }

  const handlePageChange = (page: number) => {
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
    } else if (sortBy === 'name') {
      // 名前排序：按照标题字母顺序
      sorted.sort((a, b) => {
        const titleA = (a.title || '').toLowerCase()
        const titleB = (b.title || '').toLowerCase()
        return titleA.localeCompare(titleB, 'ja')
      })
    } else if (sortBy === 'latest') {
      // 最新排序：按照创建时间从新到旧
      sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA // 降序（新的在前）
      })
    }
    
    return sorted
  }, [notes, sortBy])

  return (
    <>
      <div className="notes-page">
        {/* Header */}
        <div className="notes-header-bar">
          <h1 className="notes-page-title">
            <span className="notes-title-icon">📖</span>
            旅行ノート
          </h1>
          
          {/* Weather Widget */}
          <WeatherWidget />
          
          <div className="notes-header-controls">
            <SearchAndSort
              searchKeyword={searchKeyword}
              onSearchChange={handleSearchChange}
              onSearch={(keyword, currentSortBy) => {
                loadNotes(0, keyword, currentSortBy as 'latest' | 'popular' | 'name')
              }}
              onSortChange={handleSortChange}
              sortBy={sortBy}
              placeholder="検索... ( / でフォーカス)"
              enableDebounce={true}
              debounceDelay={500}
              onClearSearch={() => {
                setSearchKeyword('')
                loadNotes(0, '', sortBy)
              }}
            />
          </div>
        </div>

        {/* Floating Create Button */}
        <Link to="/notes-create" className="notes-floating-create-btn" title="ノートを投稿">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Link>

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
                    priority={index < 6} // 前6个卡片（首屏）优先加载图片
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
      <ScrollToTop />
    </>
  )
}

export default Notes
