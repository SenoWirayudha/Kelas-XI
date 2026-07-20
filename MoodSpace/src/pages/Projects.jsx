import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Download, ExternalLink, FolderOpen, Link2, LoaderCircle, MoreHorizontal, Pen, Plus, Share2, Sparkles, Trash2, Upload, X } from 'lucide-react'
import ConfirmationModal from '../components/ConfirmationModal'
import { useAuth } from '../context/authState'
import { uploadMediaFile } from '../lib/api/media'
import { createWorkspace, deleteWorkspace, getWorkspace, importByToken, listWorkspaces, updateWorkspace } from '../lib/api/workspaces'
import { publishWorkspace } from '../lib/api/posts'
import { listFonts } from '../lib/api/fonts'

const storageKey = 'moodspace.projects'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SYSTEM_FONT_NAMES = new Set([
  'inter', 'arial', 'helvetica', 'sans-serif', 'serif', 'monospace',
  'georgia', 'times new roman', 'courier new', 'verdana', 'tahoma',
  'trebuchet ms', 'impact', 'comic sans ms', 'system-ui', 'ui-sans-serif',
  'ui-serif', 'ui-monospace', 'calibri', 'cambria', 'candara',
  'franklin gothic medium', 'futura', 'geneva', 'gill sans',
  'optima', 'rockwell', 'segoe ui', 'source sans pro', 'consolas',
  'palatino', 'garamond', 'bookman', 'lucida', 'avenir', 'myriad',
])

function findMissingFonts(snapshot, availableFonts) {
  const fontFamilies = new Set()
  const items = snapshot?.items || []
  for (const item of items) {
    if (item.fontFamily) fontFamilies.add(item.fontFamily)
    if (item.runs) {
      for (const run of item.runs) {
        if (run.fontFamily) fontFamilies.add(run.fontFamily)
      }
    }
  }
  const availableNames = new Set(
    (availableFonts || []).map((f) => (f.family || f.fontFamily || '').toLowerCase()).filter(Boolean)
  )
  const missing = []
  for (const ff of fontFamilies) {
    const parts = ff.split(',').map((p) => p.trim().toLowerCase())
    const allUnknown = parts.every((p) => {
      const name = p.replace(/['"]/g, '')
      return !SYSTEM_FONT_NAMES.has(name) && !availableNames.has(name)
    })
    if (allUnknown) missing.push(ff)
  }
  return missing
}

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
  ownerId: workspace.ownerId,
})

const withCacheBuster = (url, version) => {
  if (!url || !version) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${encodeURIComponent(version)}`
}

function Projects() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: isAuthLoading, requireAuth } = useAuth()
  const [projects, setProjects] = useState(readProjects)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importLink, setImportLink] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const importInputRef = useRef(null)
  const [openProjectMenuId, setOpenProjectMenuId] = useState(null)
  const [renamingProjectId, setRenamingProjectId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingProjectId, setDeletingProjectId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  const [exportTarget, setExportTarget] = useState(null)
  const [exportFormat, setExportFormat] = useState('png')
  const [exportScale, setExportScale] = useState(1)
  const [exportTransparent, setExportTransparent] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportProgress, setExportProgress] = useState(0)
  const [exportBgType, setExportBgType] = useState('solid')
  const [createError, setCreateError] = useState('')
const [fontWarning, setFontWarning] = useState(null)
const [importedWorkspaceId, setImportedWorkspaceId] = useState(null)
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
          sourceType: 'upload',
          addToUploads: true,
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

  const handleImportByLink = useCallback(async () => {
    if (!importLink.trim()) return
    setCreateError('')
    setIsImporting(true)
    try {
      const link = importLink.trim()
      const match = link.match(/\/template\/(.+?)(?:\/|$)/)
      const token = match?.[1] || link
      const result = await importByToken(token)
      const id = result.workspaceId
      let allFonts = []
      try {
        const fontsResponse = await listFonts()
        allFonts = fontsResponse.fonts || []
      } catch {}
      const workspace = await getWorkspace(id)
      const snapshot = workspace.snapshot || {}
      setShowImportModal(false)
      const missingFonts = findMissingFonts(snapshot, allFonts)
      if (missingFonts.length > 0) {
        setImportedWorkspaceId(id)
        setFontWarning(missingFonts)
      } else {
        navigate(`/workspace?projectId=${id}`)
      }
    } catch (error) {
      setCreateError(error.message || 'Gagal mengimpor lewat link')
    } finally {
      setIsImporting(false)
    }
  }, [importLink, importByToken, listFonts, getWorkspace, navigate, setCreateError, setFontWarning, setImportedWorkspaceId, setShowImportModal])

  const handleImportByFile = useCallback(async (file) => {
    if (!file) return
    if (!file.name.endsWith('.json')) {
      setCreateError('Hanya file .json yang didukung')
      return
    }
    setIsImporting(true)
    setCreateError('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.snapshot) throw new Error('File template tidak valid: tidak ada snapshot')
      const payload = await createWorkspace({
        title: data.title || 'Imported Template',
        description: data.description || '',
        canvasWidth: data.canvasWidth || 1280,
        canvasHeight: data.canvasHeight || 720,
        canvasRatio: data.canvasRatio || null,
        background: data.background || { type: 'solid', color: '#f4f1e8' },
        settings: data.settings || { autosave: true },
        snapshot: data.snapshot,
      })
      const workspace = payload.workspace
      const project = {
        id: workspace.id,
        name: workspace.title,
        ratio: workspace.canvasRatio || 'custom',
        width: workspace.canvasWidth,
        height: workspace.canvasHeight,
        updatedAt: workspace.updatedAt || new Date().toISOString(),
        isNew: true,
      }
      const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)]
      setProjects(nextProjects)
      localStorage.setItem(storageKey, JSON.stringify(nextProjects.map((projectItem) => {
        const persistedProject = { ...projectItem }
        delete persistedProject.isNew
        return persistedProject
      })))
      let allFonts = []
      try {
        const fontsResponse = await listFonts()
        allFonts = fontsResponse.fonts || []
      } catch {}
      setShowImportModal(false)
      const missingFonts = findMissingFonts(data.snapshot, allFonts)
      if (missingFonts.length > 0) {
        setImportedWorkspaceId(workspace.id)
        setFontWarning(missingFonts)
      } else {
        navigate(`/workspace?projectId=${workspace.id}`)
      }
    } catch (error) {
      setCreateError(error.message || 'Gagal mengimpor template')
    } finally {
      setIsImporting(false)
    }
  }, [createWorkspace, listFonts, navigate, projects, setCreateError, setFontWarning, setImportedWorkspaceId, setShowImportModal])

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

  const handleRenameProject = async (project, newName) => {
    if (!newName.trim() || newName.trim() === project.name) {
      setRenamingProjectId(null)
      return
    }
    try {
      await updateWorkspace(project.id, { title: newName.trim() })
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id ? { ...item, name: newName.trim() } : item
        )
      )
      const stored = readProjects().map((item) =>
        item.id === project.id ? { ...item, name: newName.trim() } : item
      )
      localStorage.setItem(storageKey, JSON.stringify(stored))
    } catch (error) {
      console.error('Failed to rename project:', error)
    }
    setRenamingProjectId(null)
  }

  const handleDuplicateProject = async (project) => {
    setOpenProjectMenuId(null)
    if (!uuidPattern.test(project.id)) return
    try {
      const payload = await getWorkspace(project.id)
      const w = payload.workspace
      const snapshot = w.latestVersion?.snapshot || { items: [], layers: [] }
      const newPayload = await createWorkspace({
        title: `${w.title} (Copy)`,
        canvasWidth: w.canvasWidth,
        canvasHeight: w.canvasHeight,
        canvasRatio: w.canvasRatio || 'custom',
        background: w.background || { type: 'solid', color: '#f4f1e8', from: '#f4f1e8', to: '#d8d2ff', angle: 90 },
        settings: w.settings || {},
        snapshot,
      })
      const newWorkspace = newPayload.workspace
      const newProject = workspaceToProject(newWorkspace)
      newProject.isNew = true
      const updatedProjects = [newProject, ...projects]
      setProjects(updatedProjects)
      localStorage.setItem(storageKey, JSON.stringify(
        updatedProjects.map((p) => {
          const copy = { ...p }
          delete copy.isNew
          return copy
        })
      ))
    } catch (error) {
      console.error('Failed to duplicate project:', error)
    }
  }

  const handleConfirmShare = async () => {
    const project = shareTarget
    if (!project || !uuidPattern.test(project.id)) return
    if (!requireAuth('login')) return
    setIsSharing(true)
    setShareError('')
    try {
      await publishWorkspace({ workspaceId: project.id, title: project.name, visibility: 'public' })
      setShareTarget(null)
    } catch (error) {
      setShareError(error.message || 'Gagal mempublikasikan project')
    } finally {
      setIsSharing(false)
    }
  }

  const handleConfirmExport = async () => {
    const project = exportTarget
    if (!project || !uuidPattern.test(project.id)) return
    setIsExporting(true)
    setExportProgress(5)
    setExportError('')
    try {
      const payload = await getWorkspace(project.id)
      setExportProgress(20)
      const w = payload.workspace
      const snapshot = w.latestVersion?.snapshot || {}
      const items = Array.isArray(snapshot.items) ? snapshot.items : []
      const canvasW = w.canvasWidth || 1280
      const canvasH = w.canvasHeight || 720
      const bg = w.background || snapshot.background || { type: 'solid', color: '#ffffff' }
      const scale = exportScale
      const mimeType = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'
      const outW = Math.round(canvasW * scale)
      const outH = Math.round(canvasH * scale)
      const hasNoneBg = bg.type === 'transparent' || bg.type === 'none'
      const isCanvasBgTransparent = exportFormat === 'png' && exportTransparent && hasNoneBg

      const offscreen = document.createElement('canvas')
      offscreen.width = outW
      offscreen.height = outH
      const ctx = offscreen.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D not available')

      setExportProgress(35)

      // Draw background
      if (!isCanvasBgTransparent) {
        if (bg.type === 'solid' || !bg.type) {
          ctx.fillStyle = bg.color || '#ffffff'
          ctx.fillRect(0, 0, outW, outH)
        } else if (bg.type === 'gradient') {
          const grad = ctx.createLinearGradient(0, 0, outW * Math.cos((bg.angle || 90) * Math.PI / 180), outH * Math.sin((bg.angle || 90) * Math.PI / 180))
          grad.addColorStop(0, bg.from || '#ffffff')
          grad.addColorStop(1, bg.to || '#d8d2ff')
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, outW, outH)
        }
      }

      setExportProgress(45)

      // Draw image items
      const imageItems = items.filter((item) => item.visible !== false && item.kind === 'image' && item.src)
      const total = imageItems.length
      let loaded = 0

      // Preload images in parallel, then draw
      const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })

      const images = await Promise.all(imageItems.map((item) => loadImage(item.src)))
      setExportProgress(65)

      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i]
        const img = images[i]
        if (!img) continue
        ctx.save()
        const cx = (item.x + item.w / 2) * scale
        const cy = (item.y + item.h / 2) * scale
        ctx.translate(cx, cy)
        if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180)
        ctx.globalAlpha = item.opacity ?? 1
        ctx.drawImage(img, -item.w / 2 * scale, -item.h / 2 * scale, item.w * scale, item.h * scale)
        ctx.restore()
        loaded++
        setExportProgress(65 + Math.round((loaded / total) * 25))
      }

      setExportProgress(92)

      await new Promise((resolve) => requestAnimationFrame(resolve))
      const blob = await new Promise((resolve) => offscreen.toBlob(resolve, mimeType, exportFormat === 'jpg' ? 0.92 : 1))
      if (!blob) throw new Error('Gagal generate gambar')

      const url = URL.createObjectURL(blob)
      const safeTitle = (project.name || 'workspace').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'workspace'
      const link = document.createElement('a')
      link.href = url
      link.download = `${safeTitle}-${exportScale}x.${exportFormat}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setExportProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 200))
      setExportTarget(null)
    } catch (error) {
      setExportError(error.message || 'Export gagal')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleOpenInNewTab = (project) => {
    setOpenProjectMenuId(null)
    const params = new URLSearchParams({
      name: project.name,
      ratio: project.ratio,
      width: String(project.width),
      height: String(project.height),
    })
    if (uuidPattern.test(project.id)) params.set('projectId', project.id)
    const a = document.createElement('a')
    a.href = `/workspace?${params.toString()}`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  const handleExportProject = async (project) => {
    setOpenProjectMenuId(null)
    setExportFormat('png')
    setExportScale(1)
    setExportTransparent(false)
    setExportError('')
    setExportProgress(0)
    setExportTarget(project)
    if (uuidPattern.test(project.id)) {
      try {
        const payload = await getWorkspace(project.id)
        const bg = payload.workspace.background || { type: 'solid' }
        setExportBgType(bg.type || 'solid')
      } catch {
        setExportBgType('solid')
      }
    }
  }

  const handleShareProject = (project) => {
    setOpenProjectMenuId(null)
    setShareTarget(project)
    setShareError('')
    setIsSharing(false)
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
          <button className="project-import-btn" type="button" onClick={() => { setCreateError(''); setImportLink(''); setShowImportModal(true) }}>
            <Upload size={16} strokeWidth={1.9} />
            Import Template
          </button>
        </div>
      </header>

      {showImportModal && (
        <div className="workspace-export-modal-backdrop" role="presentation" onMouseDown={() => { setShowImportModal(false); setCreateError(''); setImportLink('') }}>
          <section className="workspace-export-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="workspace-export-modal-header">
              <div>
                <p>IMPORT TEMPLATE</p>
                <h2>Import project dari link atau file .json</h2>
              </div>
              <button type="button" style={{ width: 30, height: 30, border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }} aria-label="Close" onClick={() => { setShowImportModal(false); setCreateError(''); setImportLink('') }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '8px 24px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Link2 size={14} /> Link Template
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Paste link template di sini"
                    value={importLink}
                    onChange={(e) => setImportLink(e.target.value)}
                    style={{
                      flex: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)', color: '#f6f7fb', padding: '8px 12px',
                      fontSize: 13, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    className="workspace-export-confirm"
                    onClick={handleImportByLink}
                    disabled={isImporting || !importLink.trim()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isImporting ? <LoaderCircle size={14} className="confirm-modal-spinner" /> : <Download size={14} />}
                    {isImporting ? 'Loading...' : 'Import'}
                  </button>
                </div>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                atau
                <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <input ref={importInputRef} type="file" accept=".json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleImportByFile(f); e.target.value = '' } }} />
              <button
                type="button"
                className="project-import-btn"
                onClick={() => importInputRef.current?.click()}
                disabled={isImporting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isImporting ? <LoaderCircle size={14} className="confirm-modal-spinner" /> : <Upload size={14} />}
                {isImporting ? 'Loading...' : 'Pilih File .json'}
              </button>
            </div>
            {createError && <p className="workspace-export-error" style={{ margin: '0 24px 16px' }}>{createError}</p>}
          </section>
        </div>
      )}

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
          <article className={`project-row-card${openProjectMenuId === project.id ? ' project-row-card-menu-open' : ''}`} key={project.id}>
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
                {user && project.ownerId !== user.id && <small className="project-shared-badge">Dibagikan</small>}
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
                <div className="project-row-options-header">
                  {renamingProjectId === project.id ? (
                    <div className="project-row-rename-inline">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameProject(project, renameValue)
                          if (e.key === 'Escape') setRenamingProjectId(null)
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleRenameProject(project, renameValue) }}>&#10003;</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setRenamingProjectId(null) }}>&#10005;</button>
                    </div>
                  ) : (
                    <>
                      <span>{project.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRenamingProjectId(project.id)
                          setRenameValue(project.name)
                        }}
                      >
                        <Pen size={14} />
                      </button>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => handleDuplicateProject(project)}>
                  <Copy size={14} /> Duplicate
                </button>
                <button type="button" onClick={() => handleOpenInNewTab(project)}>
                  <ExternalLink size={14} /> Buka di Tab Baru
                </button>
                <button type="button" onClick={() => handleExportProject(project)}>
                  <Download size={14} /> Export
                </button>
                <button type="button" onClick={() => handleShareProject(project)}>
                  <Share2 size={14} /> Bagikan
                </button>
                <div className="project-row-options-divider" />
                <button type="button" className="project-row-options-delete" onClick={() => handleDeleteProject(project)}>
                  <Trash2 size={14} /> Delete Project
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

      {shareTarget && (
        <div
          className="workspace-export-modal-backdrop"
          role="presentation"
          onMouseDown={() => { if (!isSharing) setShareTarget(null) }}
        >
          <section
            className="workspace-export-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="workspace-export-modal-header">
              <div>
                <p>PUBLISH</p>
                <h2>Bagikan Project</h2>
              </div>
            </div>

            <div style={{ padding: '16px 24px', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
              &ldquo;{shareTarget.name}&rdquo; akan dipublikasikan ke feed publik sebagai postingan.
            </div>

            {shareError && <p className="workspace-export-error">{shareError}</p>}

            <div className="workspace-export-modal-footer">
              <button type="button" className="workspace-export-cancel" onClick={() => setShareTarget(null)} disabled={isSharing}>
                Batal
              </button>
              <button type="button" className="workspace-export-confirm" onClick={handleConfirmShare} disabled={isSharing}>
                {isSharing ? 'Mempublikasikan...' : 'Bagikan'}
              </button>
            </div>
          </section>
        </div>
      )}

      {exportTarget && (
        <div
          className="workspace-export-modal-backdrop"
          role="presentation"
          onMouseDown={() => { if (!isExporting) setExportTarget(null) }}
        >
          <section
            className="workspace-export-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="workspace-export-modal-header">
              <div>
                <p>EXPORT AS</p>
                <h2>Export Workspace</h2>
              </div>
            </div>

            <div className="workspace-export-options">
              {['png', 'jpg'].map((fmt) => (
                <label key={fmt} className={`workspace-export-option ${exportFormat === fmt ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="project-export-format"
                    value={fmt}
                    checked={exportFormat === fmt}
                    onChange={() => { setExportFormat(fmt); if (fmt === 'jpg') setExportTransparent(false) }}
                  />
                  <span>{fmt.toUpperCase()}</span>
                </label>
              ))}
            </div>

            <div className="workspace-export-section">
              <span className="workspace-export-section-title">Resolution</span>
              <div className="workspace-export-options">
                {[1, 2, 4].map((scale) => (
                  <label key={scale} className={`workspace-export-option ${exportScale === scale ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="project-export-scale"
                      value={scale}
                      checked={exportScale === scale}
                      onChange={() => setExportScale(scale)}
                    />
                    <span>{scale}x</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="workspace-export-toggle-row">
              <div>
                <span>Transparent Background</span>
                {exportBgType !== 'transparent' && exportBgType !== 'none' && (
                  <small>Background harus None untuk export transparan</small>
                )}
                {exportFormat === 'jpg' && (exportBgType === 'transparent' || exportBgType === 'none') && (
                  <small>JPG tidak mendukung transparansi</small>
                )}
              </div>
              <button
                type="button"
                className={`workspace-export-toggle ${exportTransparent ? 'active' : ''}`}
                disabled={(exportBgType !== 'transparent' && exportBgType !== 'none') || exportFormat === 'jpg'}
                aria-pressed={exportTransparent}
                onClick={() => setExportTransparent((value) => !value)}
              >
                <span />
              </button>
            </div>

            <div className="workspace-export-preview">
              <span className="workspace-export-section-title">Preview Info</span>
              <div>
                <span>Canvas Size</span>
                <strong>{exportTarget.width} x {exportTarget.height}px</strong>
              </div>
              <div>
                <span>Estimated Output Size</span>
                <strong>{Math.round(exportTarget.width * exportScale)} x {Math.round(exportTarget.height * exportScale)}px</strong>
              </div>
            </div>

            {exportError && <p className="workspace-export-error">{exportError}</p>}
            {isExporting && (
              <div className="workspace-export-progress" role="status" aria-live="polite">
                <div className="workspace-export-progress-label">
                  <span>Exporting...</span>
                  <strong>{exportProgress}%</strong>
                </div>
                <div className="workspace-export-progress-track">
                  <span style={{ width: `${exportProgress}%` }} />
                </div>
              </div>
            )}

            <div className="workspace-export-modal-footer">
              <button type="button" className="workspace-export-cancel" onClick={() => setExportTarget(null)} disabled={isExporting}>
                Cancel
              </button>
              <button type="button" className="workspace-export-confirm" onClick={handleConfirmExport} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </section>
        </div>
      )}

      {fontWarning && (
        <div className="workspace-export-modal-backdrop" role="presentation" onMouseDown={() => { const id = importedWorkspaceId; setFontWarning(null); setImportedWorkspaceId(null); if (id) navigate(`/workspace?projectId=${id}`) }}>
          <section className="workspace-export-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="workspace-export-modal-header">
              <div>
                <p>FONT WARNING</p>
                <h2>Font Tidak Ditemukan</h2>
              </div>
            </div>
            <div style={{ padding: '16px 24px', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
              Template ini menggunakan font kustom yang tidak tersedia di sistem Anda:
              <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                {fontWarning.map((ff) => <li key={ff}><strong style={{ color: '#fff' }}>{ff}</strong></li>)}
              </ul>
              <p style={{ marginTop: 12 }}>Font mungkin tidak tampil dengan benar. Anda dapat menggantinya nanti di editor.</p>
            </div>
            <div className="workspace-export-modal-footer">
              <button type="button" className="workspace-export-confirm" onClick={() => { const id = importedWorkspaceId; setFontWarning(null); setImportedWorkspaceId(null); navigate(`/workspace?projectId=${id}`) }}>
                Lanjutkan
              </button>
            </div>
          </section>
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
