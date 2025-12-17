import { useState, useEffect } from 'react'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/Footer'

const Spot = () => {
  const [spots, setSpots] = useState([])
  const [filteredSpots, setFilteredSpots] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSpots()
  }, [])

  useEffect(() => {
    filterSpots()
  }, [searchKeyword, spots])

  const loadSpots = async () => {
    try {
      setLoading(true)
      const response = await api.get('/spots')
      setSpots(response.data || [])
      setFilteredSpots(response.data || [])
    } catch (error) {
      console.error('スポット読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSpots = () => {
    if (!searchKeyword.trim()) {
      setFilteredSpots(spots)
      return
    }

    const keyword = searchKeyword.toLowerCase()
    const filtered = spots.filter(spot =>
      spot.name?.toLowerCase().includes(keyword) ||
      spot.description?.toLowerCase().includes(keyword) ||
      spot.location?.toLowerCase().includes(keyword)
    )
    setFilteredSpots(filtered)
  }

  const handleLike = async (id) => {
    const token = TokenUtil.getToken()
    if (!token) {
      if (confirm('ログインが必要です。ログインページに移動しますか？')) {
        window.location.href = '/login'
      }
      return
    }

    try {
      await api.post(`/spots/${id}/like`)
      await loadSpots()
    } catch (error) {
      console.error('いいねエラー:', error)
      if (error.response?.status === 401) {
        if (confirm('ログインが必要です。ログインページに移動しますか？')) {
          window.location.href = '/login'
        }
      }
    }
  }

  const handleFavorite = async (id) => {
    const token = TokenUtil.getToken()
    if (!token) {
      if (confirm('ログインが必要です。ログインページに移動しますか？')) {
        window.location.href = '/login'
      }
      return
    }

    try {
      await api.post(`/spots/${id}/favorite`)
      await loadSpots()
    } catch (error) {
      console.error('お気に入りエラー:', error)
      if (error.response?.status === 401) {
        if (confirm('ログインが必要です。ログインページに移動しますか？')) {
          window.location.href = '/login'
        }
      }
    }
  }

  const formatImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/400x200?text=No+Image'
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `http://localhost:8080${url}`
    return `http://localhost:8080/uploads/${url}`
  }

  return (
    <>
      <div style={{
        background: 'var(--bg)',
        minHeight: 'calc(100vh - 80px)',
        paddingTop: '100px'
      }}>
        <header style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '0 20px'
        }}>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 42px)',
            fontWeight: 900,
            marginBottom: '10px'
          }}>観光スポット</h1>
          <p style={{
            color: 'var(--muted)',
            fontSize: '16px',
            marginBottom: '24px'
          }}>
            全国の人気観光地をチェックして、行きたい場所を見つけよう
          </p>
        </header>

        {/* 搜索框 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: 'var(--shadow)',
          padding: '14px 16px',
          maxWidth: '640px',
          margin: '0 auto 40px',
        }}>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="スポット名や場所で検索..."
            style={{
              padding: '12px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              minWidth: '240px',
              fontSize: '15px',
              fontFamily: 'inherit',
              flex: 1
            }}
          />
        </div>

        {/* 景点列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--muted)' }}>
            データを読み込み中...
          </div>
        ) : filteredSpots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--muted)' }}>
            {searchKeyword ? '検索結果が見つかりませんでした' : 'スポットがありません'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto 80px',
            padding: '0 20px'
          }}>
            {filteredSpots.map(spot => (
              <div
                key={spot.id}
                style={{
                  background: 'var(--card)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow)'
                }}
              >
                <img
                  src={formatImageUrl(spot.imageUrl)}
                  alt={spot.name}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    marginBottom: '8px',
                    fontWeight: 700
                  }}>{spot.name}</h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--muted)',
                    margin: '4px 0',
                    flex: 1
                  }}>{spot.description}</p>
                  {spot.location && (
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--muted)',
                      margin: '4px 0'
                    }}>📍 {spot.location}</p>
                  )}
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: 'var(--muted)',
                    marginBottom: '10px'
                  }}>
                    ❤️ {spot.likes || 0}　⭐ {spot.favorites || 0}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleLike(spot.id)}
                      style={{
                        flex: 1,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        background: '#ff6b6b',
                        color: '#fff',
                        transition: 'background 0.25s',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#ff5252'}
                      onMouseLeave={(e) => e.target.style.background = '#ff6b6b'}
                    >
                      ❤️ いいね
                    </button>
                    <button
                      onClick={() => handleFavorite(spot.id)}
                      style={{
                        flex: 1,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        background: '#ffd93d',
                        color: '#fff',
                        transition: 'background 0.25s',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#ffd700'}
                      onMouseLeave={(e) => e.target.style.background = '#ffd93d'}
                    >
                      ⭐ お気に入り
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}

export default Spot
