import { useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent, FormEvent } from 'react'
import '../../styles/components/common/search-and-sort.css'

interface SearchAndSortProps {
  searchKeyword: string
  onSearchChange: (value: string) => void
  onSearch?: (keyword: string, sortBy: string) => void
  onSortChange: (sortBy: 'popular' | 'name' | 'latest') => void
  sortBy: 'popular' | 'name' | 'latest'
  placeholder?: string
  enableDebounce?: boolean
  debounceDelay?: number
  enableKeyboardShortcut?: boolean
  onClearSearch?: () => void
  onSearchSubmit?: (keyword: string) => void
  className?: string
}

const SearchAndSort = ({
  searchKeyword,
  onSearchChange,
  onSearch,
  onSortChange,
  sortBy,
  placeholder = '検索...',
  enableDebounce = false,
  debounceDelay = 500,
  enableKeyboardShortcut = true,
  onClearSearch,
  onSearchSubmit,
  className = ''
}: SearchAndSortProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearchRef = useRef<NodeJS.Timeout | null>(null)

  // 键盘快捷键：/ 或 f 聚焦搜索
  useEffect(() => {
    if (!enableKeyboardShortcut) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.key === '/' || e.key === 'f') && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress as unknown as EventListener)
    return () => window.removeEventListener('keydown', handleKeyPress as unknown as EventListener)
  }, [enableKeyboardShortcut])

  // 防抖处理
  const handleSearchChange = useCallback((value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    }

    if (enableDebounce) {
      // 清除之前的定时器
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current)
        debouncedSearchRef.current = null
      }

      // 使用 ref 保存最新的 sortBy，避免闭包问题
      const currentSortBy = sortBy
      
      // 设置新的定时器
      debouncedSearchRef.current = setTimeout(() => {
        if (onSearch) {
          // 传递搜索关键词和当前的 sortBy
          onSearch(value, currentSortBy)
        }
        debouncedSearchRef.current = null
      }, debounceDelay)
    }
  }, [enableDebounce, debounceDelay, onSearchChange, onSearch, sortBy])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current)
      }
    }
  }, [])

  const handleClear = () => {
    // 清除防抖定时器
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current)
      debouncedSearchRef.current = null
    }

    if (onClearSearch) {
      onClearSearch()
    } else if (onSearchChange) {
      onSearchChange('')
    }
    // 不自动聚焦，让用户决定
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear()
      searchInputRef.current?.blur()
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // 如果搜索框为空且有 onSearchSubmit 回调，使用占位符关键词
    if (!searchKeyword?.trim() && onSearchSubmit) {
      // 从 placeholder 中提取关键词（去除" で検索..."等后缀）
      const keyword = placeholder.replace(/ で検索.*$/, '').trim()
      if (keyword && keyword !== '検索...' && keyword !== 'スポット名や場所で検索...') {
        onSearchSubmit(keyword)
        return
      }
    }
    
    // 清除防抖定时器
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current)
      debouncedSearchRef.current = null
    }
    // 如果启用了防抖，立即执行搜索
    if (enableDebounce && onSearch) {
      onSearch(searchKeyword, sortBy)
    }
    // 如果没有启用防抖，搜索是实时的（通过 onSearchChange），不需要额外处理
  }

  return (
    <div className={`search-and-sort ${className}`}>
      {/* Search */}
      <form onSubmit={handleSubmit} className="search-and-sort-search">
        <div className="search-and-sort-wrapper">
          <svg className="search-and-sort-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchKeyword || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="search-and-sort-input"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={handleClear}
              className="search-and-sort-clear"
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
      <div className="search-and-sort-buttons">
        <button
          className={`search-and-sort-btn ${sortBy === 'popular' ? 'active' : ''}`}
          onClick={() => onSortChange('popular')}
          title="人気順"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>人気</span>
        </button>
        <button
          className={`search-and-sort-btn ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => onSortChange('name')}
          title="名前順"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <span>名前</span>
        </button>
        <button
          className={`search-and-sort-btn ${sortBy === 'latest' ? 'active' : ''}`}
          onClick={() => onSortChange('latest')}
          title="最新順"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <span>最新</span>
        </button>
      </div>
    </div>
  )
}

export default SearchAndSort
