import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Hotspot = ({ id, name, x, y, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const handleClick = (e) => {
    e.stopPropagation()
    if (onClick) {
      onClick(id)
    } else {
      // 默认行为：导航到景点详情页
      navigate(`/spot-detail.html?id=${id}`)
    }
  }

  const style = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  }

  return (
    <div
      className="hotspot"
      style={style}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`スポット「${name}」の詳細を見る`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e)
        }
      }}
    >
      <div className={`hotspot-marker ${isHovered ? 'hovered' : ''}`}>
        <div className="hotspot-pulse"></div>
        <div className="hotspot-dot"></div>
        <svg className="hotspot-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      
      {/* 标签 */}
      {isHovered && (
        <div className="hotspot-label visible">
          <div className="hotspot-label-arrow"></div>
          <span className="hotspot-label-text">{name}</span>
        </div>
      )}
    </div>
  )
}

export default Hotspot
