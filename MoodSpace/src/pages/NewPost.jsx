import { useEffect, useRef, useState } from 'react'
import { Globe2, GripVertical, ImagePlus, Lock, MessageCircle, Plus, Save, Trash2, Upload, Users, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { uploadMediaFile } from '../lib/api/media'
import { createMediaPost, createMediaPostDraft, getPost, publishMediaPostDraft, updateMediaPostDraft, updatePost } from '../lib/api/posts'

const getImageSize = (file) => new Promise((resolve) => {
  const image = new Image()
  const url = URL.createObjectURL(file)
  image.onload = () => {
    resolve({ width: image.naturalWidth, height: image.naturalHeight })
    URL.revokeObjectURL(url)
  }
  image.onerror = () => {
    resolve({})
    URL.revokeObjectURL(url)
  }
  image.src = url
})

function NewPost() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, isLoading: isAuthLoading, requireAuth } = useAuth()
  const fileInputRef = useRef(null)
  const carouselInputRef = useRef(null)
  const mediaItemsRef = useRef([])
  const processedExportRef = useRef(false)
  const templateWorkspaceIdRef = useRef(null)
  const fromWorkspaceRef = useRef(false)
  const [mediaItems, setMediaItems] = useState([])
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [allowComments, setAllowComments] = useState(true)
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [isDropActive, setIsDropActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState('')
  const [activeDraftId, setActiveDraftId] = useState(searchParams.get('draft') || '')
  const [editPostId, setEditPostId] = useState(searchParams.get('edit') || '')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) requireAuth('login')
  }, [isAuthenticated, isAuthLoading, requireAuth])

  useEffect(() => {
    const draftId = searchParams.get('draft')
    if (!draftId || draftId === activeDraftId) return
    setActiveDraftId(draftId)
  }, [activeDraftId, searchParams])

  useEffect(() => {
    mediaItemsRef.current = mediaItems
  }, [mediaItems])

  useEffect(() => () => {
    mediaItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url))
  }, [])

  useEffect(() => {
    if (!activeDraftId) return
    let cancelled = false
    setError('')
    getPost(activeDraftId).then(({ post }) => {
      if (cancelled) {
        return
      }
      mediaItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url))
      const items = (post.media || []).map((media) => ({
        id: media.mediaId,
        mediaId: media.mediaId,
        url: media.url,
        file: null,
        name: media.url?.split('/').pop() || 'Draft media',
      }))
      setMediaItems(items)
      setTitle(post.title || '')
      setCaption(post.caption || '')
      setVisibility(post.visibility || 'public')
      setTags(Array.isArray(post.tags) ? post.tags : Array.isArray(post.metadata?.tags) ? post.metadata.tags : [])
      setAllowComments(post.allowComments ?? post.metadata?.allowComments ?? true)
      setDraftSavedAt(post.updatedAt ? new Date(post.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
    }).catch((nextError) => setError(nextError.message || 'Draft gagal dimuat'))

    return () => {
      cancelled = true
    }
  }, [activeDraftId])

  useEffect(() => {
    if (!editPostId) return
    let cancelled = false
    setError('')
    getPost(editPostId).then(({ post }) => {
      if (cancelled) return
      mediaItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url))
      const items = (post.media || []).map((media) => ({
        id: media.mediaId,
        mediaId: media.mediaId,
        url: media.url,
        file: null,
        name: media.url?.split('/').pop() || 'Media',
      }))
      setMediaItems(items)
      setTitle(post.title || '')
      setCaption(post.caption || '')
      setVisibility(post.visibility || 'public')
      setTags(Array.isArray(post.tags) ? post.tags : Array.isArray(post.metadata?.tags) ? post.metadata.tags : [])
      setAllowComments(post.allowComments ?? post.metadata?.allowComments ?? true)
    }).catch((nextError) => setError(nextError.message || 'Post gagal dimuat'))
    return () => { cancelled = true }
  }, [editPostId])

  const location = useLocation()

  useEffect(() => {
    const state = location.state
    if (!state?.exportedImage || processedExportRef.current) return
    processedExportRef.current = true
    fromWorkspaceRef.current = true
    if (state.templateWorkspaceId) {
      templateWorkspaceIdRef.current = state.templateWorkspaceId
    }
    const { dataUrl, fileName, mimeType } = state.exportedImage
    const meta = dataUrl.match(/^data:(.+?);/)?.[1] || mimeType || 'image/png'
    const byteString = atob(dataUrl.split(',')[1])
    const arrayBuffer = new ArrayBuffer(byteString.length)
    const uint8Array = new Uint8Array(arrayBuffer)
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i)
    }
    const file = new File([uint8Array], fileName || 'export.png', { type: meta })
    setMediaItems((current) => {
      if (current.length >= 10) return current
      const id = `${file.name}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`
      return [...current, { id, file, url: URL.createObjectURL(file) }]
    })
    if (state.isTemplate) {
      setTags((current) => current.includes('template') ? current : ['template', ...current])
    }
    window.history.replaceState({}, '')
  }, [])

  const addSelectedFiles = (fileList) => {
    const selected = [...(fileList || [])].filter((file) => file.type.startsWith('image/'))
    if (!selected.length) return
    setMediaItems((current) => {
      const remainingSlots = Math.max(0, 10 - current.length)
      const nextItems = selected.slice(0, remainingSlots).map((file) => ({
        id: `${file.name}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      }))
      return [...current, ...nextItems]
    })
  }

  const addFiles = (event) => {
    addSelectedFiles(event.target.files)
    event.target.value = ''
  }

  const removeMedia = (id) => {
    setMediaItems((current) => {
      const removed = current.find((item) => item.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return current.filter((item) => item.id !== id)
    })
  }

  const moveMedia = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === toIndex) return
    setMediaItems((current) => {
      const next = [...current]
      const [item] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, item)
      return next
    })
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDropActive(false)
    addSelectedFiles(event.dataTransfer.files)
  }

  const addTag = () => {
    const nextTag = tagInput.trim().replace(/^#/, '')
    if (!nextTag) return
    setTags((current) => current.includes(nextTag) ? current : [...current, nextTag].slice(0, 12))
    setTagInput('')
  }

  const handleTagKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addTag()
  }

  const uploadNewMedia = async () => {
    const mediaIds = []
    const filesToUpload = mediaItems.filter((item) => !item.mediaId && item.file)
    let uploadedCount = 0

    for (const item of mediaItems) {
      if (item.mediaId) {
        mediaIds.push(item.mediaId)
        continue
      }
      const size = await getImageSize(item.file)
      const payload = await uploadMediaFile({
        file: item.file,
        ...size,
        sourceType: 'post',
        addToUploads: false,
        onProgress: (value) => {
          if (!filesToUpload.length) return
          setProgress(Math.round(((uploadedCount + (value / 100)) / filesToUpload.length) * 100))
        },
      })
      uploadedCount += 1
      mediaIds.push(payload.media.id)
      item.mediaId = payload.media.id
    }

    setMediaItems((current) => current.map((item, index) => ({ ...item, mediaId: mediaIds[index] })))
    return mediaIds
  }

  const saveDraft = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      const mediaIds = await uploadNewMedia()
      const body = {
        title: title.trim() || null,
        caption: caption.trim() || null,
        visibility,
        mediaIds,
        metadata: {
          tags,
          allowComments,
          ...(fromWorkspaceRef.current ? { source: 'workspace' } : {}),
          ...(templateWorkspaceIdRef.current ? { templateWorkspaceId: templateWorkspaceIdRef.current } : {}),
        },
      }
      if (editPostId) {
        await updatePost(editPostId, body)
      } else {
        const payload = activeDraftId
          ? await updateMediaPostDraft(activeDraftId, body)
          : await createMediaPostDraft(body)
        if (!activeDraftId) {
          setActiveDraftId(payload.post.id)
          setSearchParams({ draft: payload.post.id }, { replace: true })
        }
      }
      setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!mediaItems.length || !title.trim()) return
    setIsSubmitting(true)
    setError('')
    try {
      const mediaIds = await uploadNewMedia()
      const body = { title: title.trim(), caption: caption.trim() || null, visibility, mediaIds, metadata: { tags, allowComments, ...(fromWorkspaceRef.current ? { source: 'workspace' } : {}), ...(templateWorkspaceIdRef.current ? { templateWorkspaceId: templateWorkspaceIdRef.current } : {}) } }
      const postId = editPostId
        ? (await updatePost(editPostId, body)).post.id
        : activeDraftId
          ? (await updateMediaPostDraft(activeDraftId, body)).post.id
          : (await createMediaPost(body)).post.id
      if (activeDraftId && !editPostId) {
        await publishMediaPostDraft(postId)
      }
      navigate(`/post/${postId}`)
    } catch (nextError) {
      setError(nextError.message || 'Post gagal dibuat')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="new-post-page">
      <header className="new-post-header">
        <h1>{editPostId ? 'Edit Post' : 'New Post'}</h1>
        <p>Susun media, isi detail project, lalu publish ke Home feed. Gambar pertama menjadi cover.</p>
      </header>
      <form className="new-post-form" onSubmit={submit}>
        <div className="new-post-assets">
          {!editPostId && (
            <label
              className={`new-post-dropzone${isDropActive ? ' is-active' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDropActive(true)
              }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={handleDrop}
            >
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={addFiles} />
              <span className="new-post-upload-icon"><Upload size={27} /></span>
              <strong>Drag & drop media</strong>
              <small>PNG, JPG, WebP, GIF. Maksimal 10 gambar untuk satu post.</small>
              <button type="button" onClick={() => fileInputRef.current?.click()}>Browse Files</button>
            </label>
          )}

          <section className="new-post-carousel-panel">
            <div className="new-post-section-title">
              <div>
                <strong>Media Carousel</strong>
                <span>{mediaItems.length} media akan dipublikasikan</span>
              </div>
            </div>
            {!editPostId && <input ref={carouselInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={addFiles} />}
            <div className="new-post-carousel-list">
              {mediaItems.map((item, index) => (
                <article
                  key={item.id}
                  className="new-post-media-card"
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveMedia(draggedIndex, index)}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  <img src={item.url} alt="" />
                  <span className="new-post-media-order">{index + 1}</span>
                  <span className="new-post-media-drag"><GripVertical size={14} /></span>
                  <button type="button" aria-label="Hapus media" onClick={() => removeMedia(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </article>
              ))}
              {!editPostId && (
                <button type="button" className="new-post-add-media" onClick={() => carouselInputRef.current?.click()}>
                  <Plus size={22} />
                  <span>Add</span>
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="new-post-info">
          <label>
            <span>Project Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} placeholder="Nama project" />
          </label>
          <label>
            <span>Description</span>
            <textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={6} maxLength={1000} placeholder="Konsep, cerita, atau detail visual project" />
          </label>
          <label>
            <span>Tags</span>
            <div className="new-post-tags">
              {tags.map((tag) => (
                <button type="button" key={tag} onClick={() => setTags((current) => current.filter((item) => item !== tag))}>
                  #{tag}<X size={12} />
                </button>
              ))}
              <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={handleTagKeyDown} onBlur={addTag} placeholder="Tambah tag" />
            </div>
          </label>

          <div className="new-post-visibility" role="radiogroup" aria-label="Visibility">
            {[
              { value: 'public', label: 'Public', icon: Globe2 },
              { value: 'unlisted', label: 'Hanya teman', icon: Users },
              { value: 'private', label: 'Private', icon: Lock },
            ].map((option) => {
              const Icon = option.icon
              return (
                <button type="button" key={option.value} className={visibility === option.value ? 'active' : ''} onClick={() => setVisibility(option.value)}>
                  <Icon size={15} />
                  {option.label}
                </button>
              )
            })}
          </div>

          <label className="workspace-toggle-row">
            <input type="checkbox" checked={allowComments} onChange={(event) => setAllowComments(event.target.checked)} />
            <span className="toggle-track" />
            Izinkan komentar
          </label>

          {isSubmitting && <p className="community-state"><Upload size={15} /> Uploading {progress}%</p>}
          {draftSavedAt && !isSubmitting && <p className="community-state"><Save size={15} /> Draft disimpan {draftSavedAt}</p>}
          {error && <p className="community-state error">{error}</p>}

          <footer className="new-post-actions">
            {!editPostId && (
              <button type="button" className="new-post-draft-btn" onClick={() => { saveDraft().catch((nextError) => setError(nextError.message || 'Draft gagal disimpan')) }} disabled={isSubmitting}>
                Save Draft
              </button>
            )}
            <button type="submit" className="new-post-publish-btn" disabled={isSubmitting || !mediaItems.length || !title.trim()}>
              {isSubmitting ? (editPostId ? 'Saving...' : 'Publishing...') : (editPostId ? 'Save Changes' : 'Publish Post')}
            </button>
          </footer>
        </aside>
      </form>
    </section>
  )
}

export default NewPost
