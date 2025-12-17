import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'

const NotesCreate = () => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [uploadedImages, setUploadedImages] = useState([])
  const [previewImages, setPreviewImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      setError('ノートを投稿するにはログインが必要です。')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired')
      }
    } catch (e) {
      TokenUtil.clearToken()
      setError('ログインの有効期限が切れました。再度ログインしてください。')
      setTimeout(() => navigate('/login'), 2000)
    }
  }, [navigate])

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (!files || files.length === 0) return

    if (uploadedImages.length + files.length > 9) {
      setError('画像は最大9枚までアップロードできます')
      event.target.value = ''
      return
    }

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルのみアップロードできます')
        event.target.value = ''
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('ファイルサイズは10MB以下にしてください')
        event.target.value = ''
        return
      }
    }

    const token = TokenUtil.getToken()
    if (!token) {
      setError('ログインが必要です')
      return
    }

    // 显示预览
    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true
    }))
    setPreviewImages([...previewImages, ...newPreviews])

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await api.post('/upload/note-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success && response.data.imageUrls) {
        const newUrls = response.data.imageUrls
        setUploadedImages([...uploadedImages, ...newUrls])
        
        // 更新预览状态
        setPreviewImages(prev => prev.map((img, idx) => {
          if (img.uploading && newPreviews.find(p => p.file === img.file)) {
            return {
              ...img,
              uploading: false,
              url: newUrls[newPreviews.findIndex(p => p.file === img.file)]
            }
          }
          return img
        }))
      }
    } catch (err) {
      console.error('画像アップロードエラー:', err)
      setError(err.response?.data?.message || '画像のアップロードに失敗しました。')
      // 移除失败的预览
      setPreviewImages(prev => prev.filter(img => !newPreviews.find(p => p.file === img.file)))
      event.target.value = ''
    }
  }

  const removeImage = (index) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
    setPreviewImages(previewImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !content.trim()) {
      setError('タイトルと内容は必須です。')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/notes', {
        title: title.trim(),
        content: content.trim(),
        location: location.trim() || null,
        imageUrls: uploadedImages
      })

      if (response.status === 200 || response.status === 201) {
        setSuccess('ノートが正常に投稿されました！')
        setTimeout(() => {
          navigate('/notes')
        }, 1500)
      }
    } catch (err) {
      console.error('投稿エラー:', err)
      setError(err.response?.data?.message || 'ノートの投稿に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      paddingTop: '100px',
      paddingBottom: '40px'
    }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: '#4a5568',
            fontSize: '2.5rem',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>✍️ ノートを投稿</h1>
          <p style={{ color: '#718096', fontSize: '1.1rem' }}>
            あなたの旅の思い出を共有しよう。世界の美しさをみんなと一緒に感じよう。
          </p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            margin: '20px 0',
            flexWrap: 'wrap'
          }}>
            <Link to="/notes" className="btn" style={{ textDecoration: 'none' }}>
              ノートを見る
            </Link>
            <Link to="/notes-my.html" className="btn-outline" style={{ textDecoration: 'none' }}>
              マイノート
            </Link>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          {(error || success) && (
            <div style={{
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '20px',
              background: error ? '#fed7d7' : '#c6f6d5',
              color: error ? '#c53030' : '#22543d'
            }}>
              {error || success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#4a5568',
                fontSize: '1.1rem'
              }}>
                タイトル *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="魅力的なタイトルを入力してください..."
                required
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '15px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                textAlign: 'right',
                color: '#718096',
                fontSize: '0.9rem',
                marginTop: '5px'
              }}>
                {title.length}/200
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#4a5568',
                fontSize: '1.1rem'
              }}>
                内容 *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="旅行での体験や感想、見たこと・感じたことを詳しく書いてください..."
                required
                maxLength={5000}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '15px',
                  fontSize: '16px',
                  minHeight: '200px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.8)'
                }}
              />
              <div style={{
                textAlign: 'right',
                color: '#718096',
                fontSize: '0.9rem',
                marginTop: '5px'
              }}>
                {content.length}/5000
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#4a5568',
                fontSize: '1.1rem'
              }}>
                画像（最大9枚）
              </label>
              <label
                htmlFor="imageUpload"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  marginBottom: '10px'
                }}
              >
                画像を選択（複数選択可）
              </label>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <div style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '10px' }}>
                画像をアップロード（最大9枚、各10MB以下、JPG/PNG/GIF対応）
              </div>
              <div style={{ color: '#667eea', fontSize: '0.9rem', fontWeight: 600 }}>
                選択済み: {uploadedImages.length}/9
              </div>
              
              {previewImages.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '15px',
                  marginTop: '15px'
                }}>
                  {previewImages.map((img, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        background: '#f7fafc'
                      }}
                    >
                      <img
                        src={img.url ? `http://localhost:8080${img.url}` : img.preview}
                        alt={`画像プレビュー ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: 'rgba(255, 0, 0, 0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                      {img.uploading && (
                        <div style={{
                          padding: '8px',
                          textAlign: 'center',
                          color: '#718096',
                          fontSize: '0.85rem'
                        }}>
                          アップロード中...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#4a5568',
                fontSize: '1.1rem'
              }}>
                場所
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例：東京、日本 ／ パリ、フランス..."
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '15px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  background: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              marginTop: '30px'
            }}>
              <button
                type="submit"
                className="btn"
                disabled={loading}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: 600,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '投稿中...' : 'ノートを投稿'}
              </button>
              <Link to="/notes" className="btn-outline" style={{ textDecoration: 'none', padding: '15px 30px' }}>
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NotesCreate
