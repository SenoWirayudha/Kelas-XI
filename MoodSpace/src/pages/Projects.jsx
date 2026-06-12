import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, MoreHorizontal, Plus, Sparkles, Upload, X } from 'lucide-react'
import ConfirmationModal from '../components/ConfirmationModal'
import { useAuth } from '../context/authState'
import { uploadMediaFile } from '../lib/api/media'
import { createWorkspace, deleteWorkspace, listWorkspaces } from '../lib/api/workspaces'

const storageKey = 'moodspace.projects'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ratioPresets = [
  { id: '1:1', label: '1:1', width: 1080, height: 1080 },
  { id: '4:5', label: '4:5', width: 1080, height: 1350 },
  { id: '16:9', label: '16:9', width: 1280, height: 720 },
  { id: '9:16', label: '9:16', width: 720, height: 1280 },
  { id: 'a4-portrait', label: 'A4 Portrait', width: 794, height: 1123 },
  { id: 'a4-landscape', label: 'A4 Landscape', width: 1123, height: 794 },
  { id: 'custom', label: 'Custom', width: 1280, height: 720 },
]


const formatUpdatedAt = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently updated'
  return `Updated ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

const readProjects = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

const workspaceToProject = (workspace) => ({
  id: workspace.id,
  name: workspace.title,
  ratio: workspace.canvasRatio || 'custom',
  width: workspace.canvasWidth,
  height: workspace.canvasHeight,
  thumbnailUrl: workspace.thumbnailUrl,
  thumbnailVersion: workspace.thumbnailMediaId || workspace.updatedAt,
  updatedAt: workspace.updatedAt,
})

const withCacheBuster = (url, version) => {
  if (!url || !version) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${encodeURIComponent(version)}`
}

function Projects() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthLoading, requireAuth } = useAuth()
  const [projects, setProjects] = useState(readProjects)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [openProjectMenuId, setOpenProjectMenuId] = useState(null)
  const [deletingProjectId, setDeletingProjectId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    name: 'Untitled Project',
    preset: '16:9',
    width: 1280,
    height: 720,
  })
  const uploadInputRef = useRef(null)
  const uploadFileRef = useRef(null)
  const [uploadPreview, setUploadPreview] = useState(null)

  const selectedPreset = useMemo(
    () => ratioPresets.find((preset) => preset.id === form.preset) || ratioPresets[2],
    [form.preset],
  )

  const refetchProjects = useCallback(async (reason = 'manual') => {
    if (isAuthLoading || !isAuthenticated) return
    const payload = await listWorkspaces()
    const nextProjects = (payload.workspaces || []).map(workspaceToProject)
    console.log('[projects refetch]', {
      reason,
      count: nextProjects.length,
      thumbnails: nextProjects.map((project) => ({
        id: project.id,
        thumbnailUrl: project.thumbnailUrl,
        thumbnailVersion: project.thumbnailVersion,
        updatedAt: project.updatedAt,
      })),
    })
    setProjects(nextProjects)
    localStorage.setItem(storageKey, JSON.stringify(nextProjects))
  }, [isAuthenticated, isAuthLoading])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return undefined
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      refetchProjects('mount').catch(() => {
      if (!cancelled) console.warn('[projects refetch failed]', { reason: 'mount' })
      })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isAuthenticated, isAuthLoading, refetchProjects])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return undefined

    const handleFocus = () => {
      refetchProjects('window-focus').catch(() => console.warn('[projects refetch failed]', { reason: 'window-focus' }))
    }
    const handlePageShow = () => {
      refetchProjects('pageshow').catch(() => console.warn('[projects refetch failed]', { reason: 'pageshow' }))
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [isAuthenticated, isAuthLoading, refetchProjects])

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    uploadFileRef.current = file
    const url = URL.createObjectURL(file)
    setUploadPreview(url)
    const img = new window.Image()
    img.onload = () => {
      const maxDim = 4000
      const w = img.naturalWidth
      const h = img.naturalHeight
      const scale = Math.min(maxDim / w, maxDim / h, 1)
      setForm((current) => ({
        ...current,
        preset: 'upload',
        width: Math.round(w * scale),
        height: Math.round(h * scale),
      }))
    }
    img.src = url
  }

  const openProject = (project) => {
    const params = new URLSearchParams({
      name: project.name,
      ratio: project.ratio,
      width: String(project.width),
      height: String(project.height),
    })
    if (uuidPattern.test(project.id)) params.set('projectId', project.id)
    if (project.isNew) params.set('new', '1')
    if (project.imageSrc) {
      params.set('imageSrc', project.imageSrc)
      params.set('imageW', String(project.width))
      params.set('imageH', String(project.height))
    }
    navigate(`/workspace?${params.toString()}`)
  }

  const updatePreset = (presetId) => {
    const preset = ratioPresets.find((item) => item.id === presetId) || ratioPresets[2]
    setForm((current) => ({
      ...current,
      preset: preset.id,
      width: preset.width,
      height: preset.height,
    }))
    uploadFileRef.current = null
    setUploadPreview(null)
  }

  const submitProject = async (event) => {
    event.preventDefault()
    if (isCreating) return
    if (!requireAuth('login')) return
    const name = form.name.trim() || 'Untitled Project'
    const width = Math.max(240, Math.min(4000, Number(form.width) || selectedPreset.width))
    const height = Math.max(240, Math.min(4000, Number(form.height) || selectedPreset.height))
    const canvasRatio = form.preset === 'upload' ? 'custom' : form.preset

    setIsCreating(true)
    setCreateError('')
    try {
      let uploadedImageSrc = null
      let uploadedMediaId = null

      if (uploadFileRef.current) {
        const completed = await uploadMediaFile({
          file: uploadFileRef.current,
          width,
          height,
          sourceType: 'project_seed',
          addToUploads: false,
        })
        uploadedImageSrc = completed?.media?.url || completed?.asset?.media?.url || null
        uploadedMediaId = completed?.media?.id || completed?.asset?.media?.id || null
      }

      const initialItems = uploadedImageSrc
        ? [{
            id: 'image-1',
            kind: 'image',
            src: uploadedImageSrc,
            mediaId: uploadedMediaId,
            x: 0,
            y: 0,
            w: width,
            h: height,
            rotation: 0,
            opacity: 1,
            radius: 0,
          }]
        : []

      const payload = await createWorkspace({
        title: name,
        canvasWidth: width,
        canvasHeight: height,
        canvasRatio,
        background: { type: 'solid', color: '#f4f1e8', from: '#f4f1e8', to: '#d8d2ff', angle: 90 },
        settings: {
          autosave: true,
          privateWorkspace: false,
          showGrid: false,
          snapToGrid: false,
          gridVertical: 0,
          gridHorizontal: 0,
        },
        snapshot: {
          projectName: name,
          items: initialItems,
          layers: initialItems.map((item, index) => ({
            id: item.id,
            index,
            kind: item.kind,
            locked: false,
            visible: true,
          })),
        },
      })

      const workspace = payload.workspace
      const project = {
        id: workspace.id,
        name: workspace.title,
        ratio: workspace.canvasRatio || canvasRatio,
        width: workspace.canvasWidth,
        height: workspace.canvasHeight,
        updatedAt: workspace.updatedAt || new Date().toISOString(),
        isNew: true,
        imageSrc: uploadedImageSrc,
      }
      const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)]
      setProjects(nextProjects)
      localStorage.setItem(storageKey, JSON.stringify(nextProjects.map((projectItem) => {
        const persistedProject = { ...projectItem }
        delete persistedProject.isNew
        return persistedProject
      })))
      uploadFileRef.current = null
      setUploadPreview(null)
      setIsModalOpen(false)
      openProject(project)
    } catch (error) {
      setCreateError(error.message || 'Gagal membuat workspace')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = (project) => {
    setDeleteTarget(project)
  }

  const confirmDeleteProject = async () => {
    const project = deleteTarget
    if (!project) return
    setDeleteTarget(null)
    if (!uuidPattern.test(project.id)) {
      setProjects((current) => current.filter((item) => item.id !== project.id))
      return
    }

    setDeletingProjectId(project.id)
    setOpenProjectMenuId(null)
    const previous = projects
    const nextProjects = projects.filter((item) => item.id !== project.id)
    setProjects(nextProjects)
    localStorage.setItem(storageKey, JSON.stringify(nextProjects))
    try {
      await deleteWorkspace(project.id)
    } catch {
      setProjects(previous)
      localStorage.setItem(storageKey, JSON.stringify(previous))
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <section className="projects-page">
      <header className="projects-hero">
        <div>
          <h1>All Projects</h1>
          <p>Manage every workspace from one place. Home stays focused on the public feed.</p>
        </div>
        <div className="projects-actions">
          <button className="project-upload-btn" type="button" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} strokeWidth={1.9} />
            New Project
          </button>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="projects-empty">
          <Sparkles size={44} strokeWidth={1.3} />
          <h3>No projects yet</h3>
          <p>Start your first creative journey</p>
          <small>Create moodboards, visual concepts, storyboards, and digital projects.</small>
          <button className="project-upload-btn" type="button" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} strokeWidth={1.9} />
            New Project
          </button>
        </div>
      ) : <div className="projects-list">
        {projects.map((project) => (
          <article className="project-row-card" key={project.id}>
            <button type="button" className="project-row-main" onClick={() => openProject(project)}>
              <span className="project-row-thumb" style={{ aspectRatio: `${project.width} / ${project.height}` }}>
                {project.thumbnailUrl ? (
                  <img src={withCacheBuster(project.thumbnailUrl, project.thumbnailVersion || project.updatedAt)} alt="" loading="lazy" />
                ) : (
                  <FolderOpen size={24} strokeWidth={1.7} />
                )}
              </span>
              <span>
                <strong>{project.name}</strong>
                <small>{project.ratio} · {project.width} × {project.height}px · {formatUpdatedAt(project.updatedAt)}</small>
              </span>
            </button>
            <button
              type="button"
              className="project-row-menu"
              aria-label={`More options for ${project.name}`}
              onClick={(event) => {
                event.stopPropagation()
                setOpenProjectMenuId((current) => (current === project.id ? null : project.id))
              }}
              disabled={deletingProjectId === project.id}
            >
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
            {openProjectMenuId === project.id && (
              <div className="project-row-options">
                <button type="button" onClick={() => handleDeleteProject(project)}>
                  Delete Project
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      }

      {isModalOpen && (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => { setIsModalOpen(false); uploadFileRef.current = null; setUploadPreview(null) }}>
          <form className="auth-modal project-create-modal" onSubmit={submitProject} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="auth-modal-close" aria-label="Close" onClick={() => { setIsModalOpen(false); uploadFileRef.current = null; setUploadPreview(null) }}>
              <X size={18} />
            </button>
            <h2>New Project</h2>

            <div className="auth-form">
              <label>
                Nama Project
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  autoFocus
                />
              </label>

              <div className="project-preset-field">
                <span>Preset Rasio</span>
                <div className="project-preset-grid">
                  {ratioPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={form.preset === preset.id ? 'active' : ''}
                      onClick={() => updatePreset(preset.id)}
                    >
                      <span className="project-preset-preview-wrap">
                        <span
                          className="project-preset-preview"
                          style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
                        />
                      </span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={form.preset === 'upload' ? 'active' : ''}
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    <span className="project-preset-preview-wrap">
                      <span
                        className="project-preset-preview"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundImage: uploadPreview ? `url(${uploadPreview})` : undefined,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                        }}
                      >
                        {!uploadPreview && <Upload size={20} />}
                      </span>
                    </span>
                    <span>Upload</span>
                  </button>
                </div>
              </div>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {form.preset === 'custom' && <div className="project-size-grid">
                <label>
                  Custom Width
                  <input
                    type="number"
                    min="240"
                    max="4000"
                    value={form.width}
                    onChange={(event) => setForm((current) => ({ ...current, preset: 'custom', width: event.target.value }))}
                  />
                </label>
                <label>
                  Custom Height
                  <input
                    type="number"
                    min="240"
                    max="4000"
                    value={form.height}
                    onChange={(event) => setForm((current) => ({ ...current, preset: 'custom', height: event.target.value }))}
                  />
                </label>
              </div>}

              {createError && <p className="auth-error">{createError}</p>}

              <button className="auth-submit" type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create & Open'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete Project?"
        description={`"${deleteTarget?.name}" will be moved to trash and cannot be restored.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={!!deletingProjectId}
        isDanger
        onConfirm={confirmDeleteProject}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}

export default Projects
