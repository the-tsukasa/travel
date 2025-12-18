import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getLocationCoordinates } from '../../utils/locationMapper'

// 修复 Leaflet 默认图标路径问题
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// 自定义红色图标用于景点标记
const createCustomIcon = (color = '#ff4d00') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: rotate(45deg) translate(-50%, -50%);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">📍</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
}

// 地图边界自适应组件
function MapBounds({ spots }) {
  const map = useMap()
  
  useEffect(() => {
    if (spots && spots.length > 0) {
      const validSpots = spots
        .map(spot => {
          if (!spot.location) return null
          const coords = getLocationCoordinates(spot.location)
          if (!coords) return null
          return [coords.lat, coords.lng]
        })
        .filter(Boolean)
      
      if (validSpots.length > 0) {
        // 如果只有一个标记，设置适当的缩放级别
        if (validSpots.length === 1) {
          map.setView(validSpots[0], 10)
        } else {
          // 多个标记时，调整视图包含所有标记
          const bounds = L.latLngBounds(validSpots)
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    } else {
      // 默认显示日本全境
      map.setView([36.2048, 138.2529], 6)
    }
  }, [spots, map])
  
  return null
}

const Map = ({ spots = [], onHotspotClick, loading = false }) => {
  // 将 spots 转换为标记数据，并映射位置到坐标
  const markers = spots
    .map(spot => {
      if (!spot.location) return null
      
      const coords = getLocationCoordinates(spot.location)
      if (!coords) return null
      
      return {
        id: spot.id,
        name: spot.name,
        location: spot.location,
        lat: coords.lat,
        lng: coords.lng,
        spot: spot
      }
    })
    .filter(Boolean) // 过滤掉无法映射的景点

  // 默认中心点（日本中心）
  const defaultCenter = [36.2048, 138.2529]
  const defaultZoom = 6

  const handleMarkerClick = (spotId) => {
    if (onHotspotClick) {
      onHotspotClick(spotId)
    }
  }

  return (
    <div className="map-container" style={{ width: '100%', height: '600px', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '20px 40px',
          borderRadius: '10px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '16px',
          color: '#333'
        }}>
          スポットを読み込み中...
        </div>
      )}
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds spots={spots} />
        
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon('#ff4d00')}
            eventHandlers={{
              click: () => handleMarkerClick(marker.id)
            }}
          >
            <Popup>
              <div style={{ 
                textAlign: 'center',
                padding: '5px',
                minWidth: '120px'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  marginBottom: '5px',
                  color: '#1e293b'
                }}>
                  {marker.name}
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '8px'
                }}>
                  📍 {marker.location}
                </div>
                <button
                  onClick={() => handleMarkerClick(marker.id)}
                  style={{
                    background: '#ff4d00',
                    color: 'white',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    width: '100%'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#e03e00'}
                  onMouseOut={(e) => e.target.style.background = '#ff4d00'}
                >
                  詳細を見る
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style>{`
        .map-container .leaflet-container {
          border-radius: 12px;
          overflow: hidden;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}

export default Map
