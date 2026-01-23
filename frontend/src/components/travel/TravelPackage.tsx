import { useState, useEffect, ChangeEvent, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import type { Spot } from '../../types'
import '../../styles/components/travel/travel-package.css'

interface Service {
  selected: boolean
  price: number
  quantity?: number
  nights?: number
  days?: number
  hours?: number
}

interface Services {
  flight: Service
  accommodation: Service
  carRental: Service
  airportPickup: Service
  translation: Service
  tourGuide: Service
}

interface ServiceField {
  key: string
  label: string
  unit?: string
  placeholder?: string
  min?: number
}

interface ServiceCardProps {
  id: string
  icon: string
  title: string
  service: Service
  onToggle: () => void
  onUpdate: (field: string, value: number) => void
  fields: ServiceField[]
}

const TravelPackage = () => {
  const [favoriteSpots, setFavoriteSpots] = useState<Spot[]>([])
  const [services, setServices] = useState<Services>({
    flight: { selected: false, price: 0, quantity: 1 },
    accommodation: { selected: false, price: 0, nights: 1 },
    carRental: { selected: false, price: 0, days: 1 },
    airportPickup: { selected: false, price: 0 },
    translation: { selected: false, price: 0, hours: 1 },
    tourGuide: { selected: false, price: 0, days: 1 }
  })
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [removingSpotId, setRemovingSpotId] = useState<number | null>(null)

  useEffect(() => {
    loadFavoriteSpots()
    // 监听localStorage变化，当用户收藏/取消收藏spot时更新
    const handleStorageChange = () => {
      loadFavoriteSpots()
    }
    window.addEventListener('storage', handleStorageChange)
    // 定期检查localStorage变化（因为同页面内localStorage变化不会触发storage事件）
    const interval = setInterval(loadFavoriteSpots, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    calculateTotal()
  }, [services, favoriteSpots])

  // 从localStorage获取收藏的spot ID列表
  const getFavoriteSpotIds = (): number[] => {
    const favoriteIds: number[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('spot_favorite_')) {
        const value = localStorage.getItem(key)
        if (value === 'true') {
          const spotId = key.replace('spot_favorite_', '')
          favoriteIds.push(parseInt(spotId))
        }
      }
    }
    return favoriteIds
  }

  const loadFavoriteSpots = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // 获取所有spots
      const response = await api.get<Spot[]>('/spots')
      const allSpots = response.data || []
      
      // 从localStorage获取收藏的spot ID
      const favoriteIds = getFavoriteSpotIds()
      
      // 筛选出收藏的spots
      const favorites = allSpots.filter(spot => favoriteIds.includes(spot.id))
      
      setFavoriteSpots(favorites)
    } catch (error: any) {
      console.error('お気に入りスポット読み込みエラー:', error)
      if (error.response?.status !== 401) {
        console.error('エラー詳細:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const removeSpot = (spotId: number) => {
    setRemovingSpotId(spotId)
    // 从localStorage移除收藏状态
    localStorage.setItem(`spot_favorite_${spotId}`, 'false')
    // 更新列表
    setTimeout(() => {
      setFavoriteSpots(prev => prev.filter(spot => spot.id !== spotId))
      setRemovingSpotId(null)
    }, 300)
  }

  const toggleService = (serviceKey: keyof Services) => {
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        selected: !prev[serviceKey].selected
      }
    }))
  }

  const updateServicePrice = (serviceKey: keyof Services, field: string, value: number) => {
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [field]: Math.max(0, value)
      } as Service
    }))
  }

  const calculateTotal = () => {
    let total = 0
    
    // 基础套餐价格（基于景点数量，每个景点基础费用500日元）
    total += favoriteSpots.length * 500
    
    // 服务费用
    Object.entries(services).forEach(([key, service]) => {
      if (service.selected) {
        switch(key) {
          case 'flight':
            total += service.price * (service.quantity || 1)
            break
          case 'accommodation':
            total += service.price * (service.nights || 1)
            break
          case 'carRental':
            total += service.price * (service.days || 1)
            break
          case 'airportPickup':
            total += service.price
            break
          case 'translation':
            total += service.price * (service.hours || 1)
            break
          case 'tourGuide':
            total += service.price * (service.days || 1)
            break
          default:
            total += service.price
        }
      }
    })
    
    setTotalPrice(total)
  }

  const handlePayment = async () => {
    if (favoriteSpots.length === 0) {
      alert('お気に入りのスポットを追加してください。')
      return
    }

    const packageData = {
      spots: favoriteSpots,
      services: Object.entries(services)
        .filter(([_, service]) => service.selected)
        .map(([key, service]) => ({ type: key, ...service })),
      totalPrice,
      createdAt: new Date().toISOString()
    }
    
    console.log('支払いデータ:', packageData)
    
    // 显示更友好的支付确认对话框
    const confirmMessage = `旅行プランの詳細:\n\n` +
      `スポット数: ${favoriteSpots.length}件\n` +
      `選択サービス: ${Object.entries(services).filter(([_, s]) => s.selected).length}件\n` +
      `合計金額: ¥${totalPrice.toLocaleString()}\n\n` +
      `これは仮想決済機能です。実際のプロジェクトでは決済APIを統合してください。`
    
    alert(confirmMessage)
  }

  const formatImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `http://localhost:8080${url}`
    return `http://localhost:8080/uploads/${url}`
  }

  const token = localStorage.getItem('token')
  
  // 如果未登录，不显示组件
  if (!token) {
    return null
  }

  if (loading) {
    return (
      <div className="travel-package-container">
        <div className="travel-package-loading">
          <div className="loading-spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  // 如果没有收藏的景点，显示提示
  if (favoriteSpots.length === 0) {
    return (
      <div className="travel-package-container">
        <div className="travel-package-empty">
          <div className="empty-icon">🗺️</div>
          <h2 className="brand-name">楽々旅<span className="brand-kana">（らくらくたび）</span></h2>
          <p className="empty-message">お気に入りのスポットがありません。</p>
          <p className="empty-hint">まず観光スポットをお気に入りに追加してください。</p>
          <Link to="/spot" className="empty-link-button">
            <span>📍</span>
            観光スポットを見る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`travel-package-container rakuraku-tab ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 品牌标题区域 */}
      <div className="travel-package-header">
        <div className="brand-logo">
          <h1 className="brand-name">
            楽々旅
            <span className="brand-kana">（らくらくたび）</span>
          </h1>
          <p className="brand-subtitle">お気に入りのスポットから、あなた専用の旅行プランを作成</p>
          <div className="brand-stats">
            <span className="stat-item">
              <span className="stat-icon">📍</span>
              <span className="stat-value">{favoriteSpots.length}</span>
              <span className="stat-label">スポット</span>
            </span>
            <span className="stat-divider">|</span>
            <span className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-value">¥{totalPrice.toLocaleString()}</span>
              <span className="stat-label">見積もり</span>
            </span>
          </div>
        </div>
        <button 
          className="collapse-button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? '展開' : '折りたたむ'}
          title={isCollapsed ? '展開' : '折りたたむ'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <path d="M19 9l-7 7-7-7" />
            ) : (
              <path d="M5 15l7-7 7 7" />
            )}
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="travel-package-content">
          {/* 收藏景点区域 */}
          <section className="travel-package-spots">
            <div className="section-header">
              <h2>
                <span className="section-icon">📌</span>
                お気に入りスポット
              </h2>
              <span className="section-count">{favoriteSpots.length}件</span>
            </div>
            <div className="spots-grid">
              {favoriteSpots.map((spot, index) => (
                <div 
                  key={spot.id} 
                  className={`spot-item ${removingSpotId === spot.id ? 'removing' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="spot-image-wrapper">
                    {spot.imageUrl ? (
                      <img 
                        src={formatImageUrl(spot.imageUrl) || ''} 
                        alt={spot.name}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                          const nextSibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                          if (nextSibling) {
                            nextSibling.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div className="spot-image-placeholder" style={{ display: spot.imageUrl ? 'none' : 'flex' }}>
                      <span>📍</span>
                    </div>
                    <button 
                      className="spot-remove-button"
                      onClick={() => removeSpot(spot.id)}
                      title="お気に入りから削除"
                      aria-label="削除"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="spot-info">
                    <h3>{spot.name}</h3>
                    <p className="spot-location">{spot.location || '場所情報なし'}</p>
                    {spot.description && (
                      <p className="spot-description">{spot.description.substring(0, 50)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 推荐行程 */}
          <section className="travel-package-itinerary">
            <div className="section-header">
              <h2>
                <span className="section-icon">🗺️</span>
                推奨ルート
              </h2>
            </div>
            <div className="itinerary-timeline">
              {favoriteSpots.map((spot, index) => (
                <div key={spot.id} className="timeline-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="timeline-marker">
                    <div className="timeline-number">{index + 1}</div>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-day">第 {index + 1} 日目</div>
                    <h3>{spot.name}</h3>
                    <p>{spot.location || '場所情報なし'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 服务选择 */}
          <section className="travel-package-services">
            <div className="section-header">
              <h2>
                <span className="section-icon">✨</span>
                オプションサービス
              </h2>
              <span className="section-hint">必要なサービスを選択してください</span>
            </div>
            <div className="services-grid">
              {/* 机票 */}
              <ServiceCard
                id="service-flight"
                icon="✈️"
                title="航空券"
                service={services.flight}
                onToggle={() => toggleService('flight')}
                onUpdate={(field, value) => updateServicePrice('flight', field, value)}
                fields={[
                  { key: 'price', label: '単価', unit: '¥', placeholder: '0' },
                  { key: 'quantity', label: '枚数', min: 1 }
                ]}
              />

              {/* 住宿 */}
              <ServiceCard
                id="service-accommodation"
                icon="🏨"
                title="宿泊"
                service={services.accommodation}
                onToggle={() => toggleService('accommodation')}
                onUpdate={(field, value) => updateServicePrice('accommodation', field, value)}
                fields={[
                  { key: 'price', label: '1泊あたり', unit: '¥', placeholder: '0' },
                  { key: 'nights', label: '泊数', min: 1 }
                ]}
              />

              {/* 包车 */}
              <ServiceCard
                id="service-carRental"
                icon="🚗"
                title="チャーターカー"
                service={services.carRental}
                onToggle={() => toggleService('carRental')}
                onUpdate={(field, value) => updateServicePrice('carRental', field, value)}
                fields={[
                  { key: 'price', label: '1日あたり', unit: '¥', placeholder: '0' },
                  { key: 'days', label: '日数', min: 1 }
                ]}
              />

              {/* 接机 */}
              <ServiceCard
                id="service-airportPickup"
                icon="🚕"
                title="空港送迎"
                service={services.airportPickup}
                onToggle={() => toggleService('airportPickup')}
                onUpdate={(field, value) => updateServicePrice('airportPickup', field, value)}
                fields={[
                  { key: 'price', label: '料金', unit: '¥', placeholder: '0' }
                ]}
              />

              {/* 翻译 */}
              <ServiceCard
                id="service-translation"
                icon="🗣️"
                title="通訳サービス"
                service={services.translation}
                onToggle={() => toggleService('translation')}
                onUpdate={(field, value) => updateServicePrice('translation', field, value)}
                fields={[
                  { key: 'price', label: '1時間あたり', unit: '¥', placeholder: '0' },
                  { key: 'hours', label: '時間数', min: 1 }
                ]}
              />

              {/* 导游 */}
              <ServiceCard
                id="service-tourGuide"
                icon="👨‍🏫"
                title="ガイドサービス"
                service={services.tourGuide}
                onToggle={() => toggleService('tourGuide')}
                onUpdate={(field, value) => updateServicePrice('tourGuide', field, value)}
                fields={[
                  { key: 'price', label: '1日あたり', unit: '¥', placeholder: '0' },
                  { key: 'days', label: '日数', min: 1 }
                ]}
              />
            </div>
          </section>

          {/* 报价和支付 */}
          <section className="travel-package-quote">
            <div className="quote-summary">
              <div className="section-header">
                <h2>
                  <span className="section-icon">💰</span>
                  見積もり
                </h2>
              </div>
              <div className="quote-details">
                <div className="quote-item">
                  <span className="quote-label">基本パッケージ（{favoriteSpots.length}スポット）</span>
                  <span className="quote-value">¥{(favoriteSpots.length * 500).toLocaleString()}</span>
                </div>
                {Object.entries(services)
                  .filter(([_, service]) => service.selected)
                  .map(([key, service]) => {
                    let serviceTotal = 0
                    let label = ''
                    switch(key) {
                      case 'flight':
                        serviceTotal = service.price * (service.quantity || 1)
                        label = `航空券 (${service.quantity || 1}枚)`
                        break
                      case 'accommodation':
                        serviceTotal = service.price * (service.nights || 1)
                        label = `宿泊 (${service.nights || 1}泊)`
                        break
                      case 'carRental':
                        serviceTotal = service.price * (service.days || 1)
                        label = `チャーターカー (${service.days || 1}日)`
                        break
                      case 'airportPickup':
                        serviceTotal = service.price
                        label = '空港送迎'
                        break
                      case 'translation':
                        serviceTotal = service.price * (service.hours || 1)
                        label = `通訳サービス (${service.hours || 1}時間)`
                        break
                      case 'tourGuide':
                        serviceTotal = service.price * (service.days || 1)
                        label = `ガイドサービス (${service.days || 1}日)`
                        break
                    }
                    return (
                      <div key={key} className="quote-item">
                        <span className="quote-label">{label}</span>
                        <span className="quote-value">¥{serviceTotal.toLocaleString()}</span>
                      </div>
                    )
                  })}
                {Object.entries(services).filter(([_, s]) => s.selected).length === 0 && (
                  <div className="quote-empty">
                    <p>選択されたサービスがありません</p>
                  </div>
                )}
                <div className="quote-total">
                  <span className="total-label">合計</span>
                  <span className="total-price">¥{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <button 
              className="payment-button"
              onClick={handlePayment}
              disabled={totalPrice === 0}
            >
              <span className="payment-icon">💳</span>
              <span>今すぐ決済</span>
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

// 服务卡片子组件
const ServiceCard: React.FC<ServiceCardProps> = ({ id, icon, title, service, onToggle, onUpdate, fields }) => {
  return (
    <div className={`service-card ${service.selected ? 'selected' : ''}`}>
      <div className="service-header">
        <input
          type="checkbox"
          checked={service.selected}
          onChange={onToggle}
          id={id}
        />
        <label htmlFor={id} className="service-title">
          <span className="service-icon">{icon}</span>
          <span>{title}</span>
        </label>
      </div>
      {service.selected && (
        <div className="service-details">
          {fields.map(field => (
            <label key={field.key} className="service-field">
              <span className="field-label">
                {field.label}
                {field.unit && <span className="field-unit">{field.unit}</span>}
              </span>
              <input
                type="number"
                value={service[field.key as keyof Service] as number || 0}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate(field.key, Number(e.target.value))}
                min={field.min || 0}
                placeholder={field.placeholder || '0'}
                className="field-input"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default TravelPackage
