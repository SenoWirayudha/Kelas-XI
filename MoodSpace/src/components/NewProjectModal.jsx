import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { uploadMediaFile } from '../lib/api/media'
import { createWorkspace } from '../lib/api/workspaces'

const presets = [
  { id: '1:1', label: '1:1', width: 1080, height: 1080 },
  { id: '4:5', label: '4:5', width: 1080, height: 1350 },
  { id: '16:9', label: '16:9', width: 1280, height: 720 },
  { id: '9:16', label: '9:16', width: 720, height: 1280 },
  { id: 'a4-portrait', label: 'A4 Portrait', width: 794, height: 1123 },
  { id: 'a4-landscape', label: 'A4 Landscape', width: 1123, height: 794 },
  { id: 'custom', label: 'Custom', width: 1280, height: 720 },
]

function NewProjectModal({ isOpen, onCancel }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: 'Untitled Project', preset: '16:9', width: 1280, height: 720 })
  const uploadInputRef = useRef(null)
  const uploadFileRef = useRef(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  if (!isOpen) return null

  const choosePreset = (preset) => setForm((current) => ({ ...current, preset: preset.id, width: preset.width, height: preset.height }))
  const chooseFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    uploadFileRef.current = file
    const url = URL.createObjectURL(file)
    setUploadPreview(url)
    const image = new Image()
    image.onload = () => setForm((current) => ({ ...current, preset: 'upload', width: image.naturalWidth, height: image.naturalHeight }))
    image.src = url
  }
  const submit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      let initialItems = []
      if (uploadFileRef.current) {
        const media = await uploadMediaFile({
          file: uploadFileRef.current,
          width: Number(form.width),
          height: Number(form.height),
          sourceType: 'project_seed',
          addToUploads: false,
        })
        initialItems = [{
          id: 'image-1',
          kind: 'image',
          src: media.media.url,
          mediaId: media.media.id,
          x: 0,
          y: 0,
          w: Number(form.width),
          h: Number(form.height),
          rotation: 0,
          opacity: 1,
          radius: 0,
        }]
      }
      const payload = await createWorkspace({
        title: form.name.trim() || 'Untitled Project',
        canvasWidth: Number(form.width),
        canvasHeight: Number(form.height),
        canvasRatio: form.preset === 'upload' ? 'custom' : form.preset,
        background: { type: 'solid', color: '#ffffff' },
        settings: { autosave: true, privateWorkspace: false, showGrid: false, snapToGrid: false },
        snapshot: { items: initialItems, layers: initialItems.map((item, index) => ({ id: item.id, index, kind: item.kind, locked: false, visible: true })) },
      })
      onCancel()
      navigate(`/workspace?projectId=${payload.workspace.id}`)
    } catch (nextError) {
      setError(nextError.message || 'Project gagal dibuat')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <form className="mood-modal project-create-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onCancel}><X size={18} /></button>
        <h2>New Project</h2>
        <div className="mood-modal-form">
          <label><span>Nama Project</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} autoFocus /></label>
          <div className="project-preset-field">
            <span>Preset Rasio</span>
            <div className="project-preset-grid">
              {presets.map((preset) => <button type="button" key={preset.id} className={form.preset === preset.id ? 'active' : ''} onClick={() => choosePreset(preset)}><span className="project-preset-preview-wrap"><span className="project-preset-preview" style={{ aspectRatio: `${preset.width} / ${preset.height}` }} /></span><span>{preset.label}</span></button>)}
              <button type="button" className={form.preset === 'upload' ? 'active' : ''} onClick={() => uploadInputRef.current?.click()}><span className="project-preset-preview-wrap"><span className="project-preset-preview" style={uploadPreview ? { backgroundImage: `url("${uploadPreview}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{!uploadPreview && <Upload size={18} />}</span></span><span>Upload</span></button>
            </div>
          </div>
          <input ref={uploadInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={chooseFile} />
          {form.preset === 'custom' && <div className="project-size-grid"><label><span>Width</span><input type="number" min="240" max="4000" value={form.width} onChange={(event) => setForm((current) => ({ ...current, width: event.target.value }))} /></label><label><span>Height</span><input type="number" min="240" max="4000" value={form.height} onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))} /></label></div>}
          {error && <p className="mood-modal-error">{error}</p>}
          <footer className="mood-modal-actions"><button type="button" className="mood-modal-cancel" onClick={onCancel}>Cancel</button><button type="submit" className="mood-modal-confirm" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create & Open'}</button></footer>
        </div>
      </form>
    </div>
  )
}

export default NewProjectModal
