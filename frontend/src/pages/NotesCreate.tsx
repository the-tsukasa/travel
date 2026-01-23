import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { TokenUtil } from '../utils/auth'
import Footer from '../components/layout/Footer'
import type { NotesDTO, NoteStatus, FileUploadResponse } from '../types'

interface PreviewImage {
  file?: File
  url?: string
  preview: string
  uploading: boolean
}

const NotesCreate = () => {
  const [noteId, setNoteId] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingNote, setLoadingNote] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false) // 提交审核中
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [status, setStatus] = useState<NoteStatus | null>(null) // 笔记状态：DRAFT, PENDING, REJECTED, PRIVATE
  const [rejectReason, setRejectReason] = useState<string>('') // 退回理由
  const navigate = useNavigate()

  // 检查 URL 参数中的 edit 参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')
    if (editId) {
      setNoteId(editId)
      loadNoteForEdit(editId)
    }
  }, [])

  useEffect(() => {
    const token = TokenUtil.getToken()
    if (!token) {
      setError('ノートを投稿するにはログインが必要です。')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    try {
      const payload = TokenUtil.parseToken(token)
      if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired')
      }
    } catch (e) {
      TokenUtil.clearToken()
      setError('ログインの有効期限が切れました。再度ログインしてください。')
      setTimeout(() => navigate('/login'), 2000)
    }
  }, [navigate])

  // 加载要编辑的笔记
  const loadNoteForEdit = async (id: string) => {
    setLoadingNote(true)
    setError('')
    
    try {
      const response = await api.get<NotesDTO>(`/notes/${id}`)
      const note = response.data
      
      // 填充表单数据
      setTitle(note.title || '')
      setContent(note.content || '')
      setLocation(note.location || '')
      
      // 设置状态和退回理由
      if (note.status) {
        setStatus(note.status)
      }
      if (note.rejectReason) {
        setRejectReason(note.rejectReason)
      }
      
      // 处理图片URL
      let imageUrls: string[] = []
      if (note.imageUrls && Array.isArray(note.imageUrls) && note.imageUrls.length > 0) {
        imageUrls = note.imageUrls
      } else if (note.imageUrl) {
        try {
          const parsed = JSON.parse(note.imageUrl)
          imageUrls = Array.isArray(parsed) ? parsed : [note.imageUrl]
        } catch {
          imageUrls = [note.imageUrl]
        }
      }
      
      // 规范化图片URL：后端存储时只需要文件名（去掉 /uploads/ 前缀）
      const normalizedUrls = imageUrls.map(url => {
        // 如果已经是完整URL，提取文件名
        if (url.startsWith('http://localhost:8080')) {
          const path = url.replace('http://localhost:8080', '')
          // 去掉 /uploads/ 前缀，只保留文件名
          return path.replace(/^\/uploads\//, '')
        } else if (url.startsWith('http')) {
          // 外部URL，保留完整路径（虽然这种情况应该很少）
          return url
        } else if (url.startsWith('/uploads/')) {
          // 相对路径，去掉 /uploads/ 前缀，只保留文件名
          return url.replace(/^\/uploads\//, '')
        } else {
          // 已经是文件名格式，直接使用
          return url
        }
      })
      
      setUploadedImages(normalizedUrls)
      
      // 设置预览图片（显示时使用完整URL）
      const previews: PreviewImage[] = normalizedUrls.map(url => {
        const displayUrl = url.startsWith('http') 
          ? url 
          : url.startsWith('/') 
            ? `http://localhost:8080${url}`
            : `http://localhost:8080/${url}`
        return {
          url: displayUrl,
          preview: displayUrl,
          uploading: false
        }
      })
      setPreviewImages(previews)
    } catch (err: any) {
      console.error('ノート読み込みエラー:', err)
      setError('ノートの読み込みに失敗しました。')
      if (err.response?.status === 404) {
        setError('ノートが見つかりません。')
      } else if (err.response?.status === 403) {
        setError('このノートを編集する権限がありません。')
      }
    } finally {
      setLoadingNote(false)
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
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
    const newPreviews: PreviewImage[] = files.map(file => ({
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
      const response = await api.post<{ success: boolean; imageUrls: string[] }>('/upload/note-images', formData, {
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
            const newPreviewIndex = newPreviews.findIndex(p => p.file === img.file)
            if (newPreviewIndex >= 0 && newPreviewIndex < newUrls.length) {
              return {
                ...img,
                uploading: false,
                url: newUrls[newPreviewIndex]
              }
            }
          }
          return img
        }))
      }
    } catch (err: any) {
      console.error('画像アップロードエラー:', err)
      setError(err.response?.data?.message || '画像のアップロードに失敗しました。')
      // 移除失败的预览
      setPreviewImages(prev => prev.filter(img => !newPreviews.find(p => p.file === img.file)))
      event.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newUploadedImages = uploadedImages.filter((_, i) => i !== index)
    const newPreviewImages = previewImages.filter((_, i) => i !== index)
    
    // 释放预览URL内存
    if (previewImages[index]?.preview) {
      URL.revokeObjectURL(previewImages[index].preview)
    }
    
    setUploadedImages(newUploadedImages)
    setPreviewImages(newPreviewImages)
  }

  // 保存草稿（创建或更新）
  const handleSaveDraft = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !content.trim()) {
      setError('タイトルと内容は必須です。')
      return
    }

    setLoading(true)

    try {
      const normalizedImageUrls = uploadedImages.map(url => {
        if (url.startsWith('http://localhost:8080')) {
          const path = url.replace('http://localhost:8080', '')
          return path.replace(/^\/uploads\//, '')
        } else if (url.startsWith('/uploads/')) {
          return url.replace(/^\/uploads\//, '')
        } else if (url.startsWith('http')) {
          return url
        } else {
          return url
        }
      })
      
      const noteData: { title: string; content: string; location: string | null; imageUrls: string[] } = {
        title: title.trim(),
        content: content.trim(),
        location: location.trim() || null,
        imageUrls: normalizedImageUrls
      }

      let response
      if (noteId) {
        // 更新模式
        response = await api.put<NotesDTO>(`/notes/${noteId}`, noteData)
        if (response.status === 200) {
          setStatus(response.data.status || null)
          setSuccess('ノートが正常に保存されました！')
        }
      } else {
        // 创建模式（创建后状态为 DRAFT）
        response = await api.post<NotesDTO>('/notes', noteData)
        if (response.status === 200 || response.status === 201) {
          setNoteId(String(response.data.id))
          setStatus(response.data.status || null)
          setSuccess('ノートが正常に保存されました！')
        }
      }
    } catch (err: any) {
      console.error('保存エラー:', err)
      setError(err.response?.data?.message || 'ノートの保存に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  // 提交审核
  const handleSubmitForReview = async () => {
    if (!noteId) {
      setError('まずノートを保存してください。')
      return
    }

    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const response = await api.post<NotesDTO>(`/notes/${noteId}/submit`)
      if (response.status === 200) {
        setStatus(response.data.status || null)
        setSuccess('ノートが審査に提出されました！審査結果をお待ちください。')
        setTimeout(() => {
          navigate('/notes-my')
        }, 2000)
      }
    } catch (err: any) {
      console.error('提出エラー:', err)
      setError(err.response?.data?.message || 'ノートの提出に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  // 兼容旧版本的 handleSubmit（直接提交）
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // 如果没有 noteId，先保存再提交
    if (!noteId) {
      await handleSaveDraft(e as any)
      // 等待保存完成后再提交
      setTimeout(async () => {
        if (noteId) {
          await handleSubmitForReview()
        }
      }, 500)
      return
    }
    
    // 如果有 noteId，直接提交审核
    await handleSubmitForReview()
  }

  // 清理预览URL
  useEffect(() => {
    return () => {
      previewImages.forEach(img => {
        if (img.preview && img.file) {
          URL.revokeObjectURL(img.preview)
        }
      })
    }
  }, [previewImages])

  return (
    <>
      <div className="notes-create-page">
        <div className="notes-create-container">
          <div className="notes-create-header">
            <h1 className="notes-create-title">
              {noteId ? '✏️ ノートを編集' : '✍️ ノートを投稿'}
            </h1>
            <p className="notes-create-subtitle">
              {noteId 
                ? 'ノートの内容を編集して更新しましょう。'
                : 'あなたの旅の思い出を共有しよう。世界の美しさをみんなと一緒に感じよう。'
              }
            </p>
            
            {/* 状态显示 */}
            {status && (
              <div className="notes-create-status-badge" style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                marginTop: '10px',
                backgroundColor: 
                  status === 'DRAFT' ? '#e3f2fd' :
                  status === 'PENDING' ? '#fff3e0' :
                  status === 'REJECTED' ? '#ffebee' :
                  status === 'PRIVATE' ? '#f3e5f5' : '#e8f5e9',
                color: 
                  status === 'DRAFT' ? '#1976d2' :
                  status === 'PENDING' ? '#f57c00' :
                  status === 'REJECTED' ? '#c62828' :
                  status === 'PRIVATE' ? '#7b1fa2' : '#388e3c'
              }}>
                {status === 'DRAFT' && '📝 草稿'}
                {status === 'PENDING' && '⏳ 審査中'}
                {status === 'REJECTED' && '❌ 差し戻し'}
                {status === 'PRIVATE' && '🔒 非公開'}
                {status === 'PUBLISHED' && '✅ 公開中'}
              </div>
            )}
            
            {/* 退回理由显示 */}
            {status === 'REJECTED' && rejectReason && (
              <div className="notes-create-reject-reason" style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: '8px',
                color: '#c62828'
              }}>
                <strong>📋 差し戻し理由：</strong>
                <p style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{rejectReason}</p>
              </div>
            )}
            <div className="notes-create-actions">
              <Link to="/notes" className="btn">
                ノートを見る
              </Link>
              <Link to="/notes-my" className="btn-outline">
                マイノート
              </Link>
            </div>
          </div>

          <div className="notes-create-form-container">
            {loadingNote && (
              <div className="notes-create-alert" style={{ background: 'rgba(102, 126, 234, 0.1)', color: '#667eea' }}>
                <svg className="notes-create-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>ノートを読み込み中...</span>
              </div>
            )}
            
            {(error || success) && !loadingNote && (
              <div className={`notes-create-alert ${error ? 'error' : 'success'}`}>
                <svg className="notes-create-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {error ? (
                    <>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </>
                  ) : (
                    <>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </>
                  )}
                </svg>
                <span>{error || success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: loadingNote ? 'none' : 'block' }}>
              <div className="notes-create-field">
                <label className="notes-create-label required">
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="魅力的なタイトルを入力してください..."
                  required
                  maxLength={200}
                  className="notes-create-input"
                />
                <div className="notes-create-char-count">
                  {title.length}/200
                </div>
              </div>

              <div className="notes-create-field">
                <label className="notes-create-label required">
                  内容
                </label>
                <textarea
                  value={content}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                  placeholder="旅行での体験や感想、見たこと・感じたことを詳しく書いてください..."
                  required
                  maxLength={5000}
                  className="notes-create-textarea"
                />
                <div className="notes-create-char-count">
                  {content.length}/5000
                </div>
              </div>

              <div className="notes-create-field notes-create-image-upload">
                <label className="notes-create-label">
                  画像（最大9枚）
                </label>
                <label
                  htmlFor="imageUpload"
                  className="notes-create-upload-label"
                >
                  画像を選択（複数選択可）
                </label>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  multiple
                  className="notes-create-upload-input"
                  onChange={handleImageUpload}
                />
                <span className="notes-create-upload-hint">
                  画像をアップロード（最大9枚、各10MB以下、JPG/PNG/GIF対応）
                </span>
                <span className="notes-create-upload-count">
                  選択済み: {uploadedImages.length}/9
                </span>
                
                {previewImages.length > 0 && (
                  <div className="notes-create-image-preview-grid">
                    {previewImages.map((img, index) => (
                      <div
                        key={index}
                        className="notes-create-image-preview-item"
                      >
                        <img
                          src={img.url ? `http://localhost:8080${img.url}` : img.preview}
                          alt={`画像プレビュー ${index + 1}`}
                          className="notes-create-image-preview"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="notes-create-image-remove"
                          aria-label="画像を削除"
                        >
                          ×
                        </button>
                        {img.uploading && (
                          <div className="notes-create-image-uploading">
                            アップロード中...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="notes-create-field">
                <label className="notes-create-label">
                  場所
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                  placeholder="例：東京、日本 ／ パリ、フランス..."
                  className="notes-create-input"
                />
              </div>

              <div className="notes-create-form-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* 保存草稿按钮（DRAFT、REJECTED、PRIVATE 状态可编辑） */}
                {(status === null || status === 'DRAFT' || status === 'REJECTED' || status === 'PRIVATE') && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="btn-outline"
                    disabled={loading || loadingNote || submitting}
                    style={{ padding: '15px 30px' }}
                  >
                    {loading ? '保存中...' : '💾 草稿として保存'}
                  </button>
                )}
                
                {/* 提交审核按钮（DRAFT、REJECTED、PRIVATE 状态可提交） */}
                {(status === null || status === 'DRAFT' || status === 'REJECTED' || status === 'PRIVATE') && (
                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    className="btn notes-create-submit-btn"
                    disabled={loading || loadingNote || submitting || !noteId}
                    style={{ padding: '15px 30px' }}
                  >
                    {submitting ? '提出中...' : '📤 審査に提出'}
                  </button>
                )}
                
                {/* 如果已提交审核，显示提示 */}
                {status === 'PENDING' && (
                  <div style={{ 
                    padding: '15px 30px', 
                    backgroundColor: '#fff3e0', 
                    borderRadius: '8px',
                    color: '#f57c00',
                    flex: '1',
                    textAlign: 'center'
                  }}>
                    ⏳ このノートは審査中です。結果をお待ちください。
                  </div>
                )}
                
                {/* 如果已发布，显示提示 */}
                {status === 'PUBLISHED' && (
                  <div style={{ 
                    padding: '15px 30px', 
                    backgroundColor: '#e8f5e9', 
                    borderRadius: '8px',
                    color: '#388e3c',
                    flex: '1',
                    textAlign: 'center'
                  }}>
                    ✅ このノートは公開されています。
                  </div>
                )}
                
                <Link to="/notes-my" className="btn-outline" style={{ padding: '15px 30px', textDecoration: 'none' }}>
                  キャンセル
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default NotesCreate
