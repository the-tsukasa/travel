import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/Footer'

const ProfileEdit = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    address: '',
    birthday: ''
  })
  const [avatarUrl, setAvatarUrl] = useState('https://cdn-icons-png.flaticon.com/512/616/616408.png')
  const [username, setUsername] = useState('ユーザー')
  const [registrationTime, setRegistrationTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const response = await api.get('/user/me')
      const data = response.data
      
      setUserInfo({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        bio: data.bio || '',
        location: data.location || '',
        address: data.address || '',
        birthday: data.birthday || ''
      })
      
      if (data.avatarUrl) {
        const avatarSrc = data.avatarUrl.startsWith('http') 
          ? data.avatarUrl 
          : `http://localhost:8080${data.avatarUrl}`
        setAvatarUrl(avatarSrc)
      }
      
      setUsername(data.username || 'ユーザー')
      
      if (data.createdAt) {
        const date = new Date(data.createdAt)
        setRegistrationTime(`登録日: ${date.toLocaleDateString('ja-JP')}`)
      }
    } catch (error) {
      console.error('ユーザー情報の読み込みエラー:', error)
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        setError('ユーザー情報の読み込みに失敗しました。')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロードできます')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setError('')
      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success && response.data.avatarUrl) {
        const newAvatarUrl = response.data.avatarUrl.startsWith('http')
          ? response.data.avatarUrl
          : `http://localhost:8080${response.data.avatarUrl}`
        setAvatarUrl(newAvatarUrl)
        setSuccess('アバターが正常にアップロードされました')
      }
    } catch (error) {
      console.error('アップロードエラー:', error)
      setError(error.response?.data?.message || 'アップロードに失敗しました')
    }

    event.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await api.put('/user/profile', {
        firstName: userInfo.firstName || null,
        lastName: userInfo.lastName || null,
        bio: userInfo.bio || null,
        location: userInfo.location || null,
        address: userInfo.address || null,
        birthday: userInfo.birthday || null
      })

      setSuccess('プロフィールが正常に更新されました！')
      setTimeout(() => {
        navigate('/user')
      }, 1500)
    } catch (error) {
      console.error('更新エラー:', error)
      setError(error.response?.data?.message || 'プロフィールの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setUserInfo(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: 'var(--bg)',
        minHeight: 'calc(100vh - 80px)',
        paddingTop: '100px',
        paddingBottom: '40px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '8px'
            }}>プロフィール編集</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>あなたの情報を更新してください</p>
          </div>

          {(error || success) && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              background: error ? '#fee2e2' : '#d1fae5',
              color: error ? '#991b1b' : '#065f46',
              border: `1px solid ${error ? '#fca5a5' : '#6ee7b7'}`
            }}>
              {error || success}
            </div>
          )}

          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
          }}>
            {/* 头像区域 */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              paddingBottom: '32px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>{username}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{registrationTime}</div>
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid var(--brand)',
                    marginBottom: '16px',
                    background: '#f3f4f6'
                  }}
                />
                <label
                  htmlFor="avatarUpload"
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'var(--brand)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📷</span>
                </label>
                <input
                  type="file"
                  id="avatarUpload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </div>
              <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
                画像をクリックしてアップロード（5MB以下、JPG/PNG/GIF対応）
              </div>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  名（First Name）
                </label>
                <input
                  type="text"
                  value={userInfo.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="名を入力"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  姓（Last Name）
                </label>
                <input
                  type="text"
                  value={userInfo.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="姓を入力"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  自己紹介（Bio）
                </label>
                <textarea
                  value={userInfo.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="あなたについて簡単に紹介してください"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    minHeight: '100px',
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  所在地（Location）
                </label>
                <input
                  type="text"
                  value={userInfo.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="例：日本、東京"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  住所（Address）
                </label>
                <input
                  type="text"
                  value={userInfo.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="詳細な住所を入力"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  誕生日（Birthday）
                </label>
                <input
                  type="date"
                  value={userInfo.birthday}
                  onChange={(e) => handleChange('birthday', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '32px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/user')}
                  style={{
                    padding: '14px 32px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: '#f3f4f6',
                    color: '#333',
                    transition: 'all 0.3s ease'
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '14px 32px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    background: 'var(--brand)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(255, 77, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? '保存中...' : '保存する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default ProfileEdit
