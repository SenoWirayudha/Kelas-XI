import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Globe, Link, LoaderCircle, Lock, X } from 'lucide-react'
import { shareAsTemplate } from '../../lib/api/workspaces'
import { useToast } from '../../context/ToastContext'

const MODES = [
  {
    id: 'publish',
    icon: Globe,
    title: 'Publish Post',
    description: 'Post akan tampil di feed publik. Orang lain bisa lihat dan menyimpan.',
    flags: { isPublished: true, isTemplate: false },
  },
  {
    id: 'share-template',
    icon: Link,
    title: 'Share as Template',
    description: 'Download file template. Siapa pun yang punya file bisa import ke workspace sendiri.',
    flags: { isPublished: false, isTemplate: true },
  },
  {
    id: 'publish-template',
    icon: Lock,
    title: 'Publish as Template',
    description: 'Tampil di feed publik + download file template. Orang lain bisa lihat dan import.',
    flags: { isPublished: true, isTemplate: true },
  },
]

export default function PublishModal({ isOpen, onClose, workspaceId, workspaceTitle, onExportAndRedirect, onDownloadTemplate }) {
  const toast = useToast()
  const [selectedMode, setSelectedMode] = useState('publish')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedMode('publish')
      setIsSubmitting(false)
      setResult(null)
    }
  }, [isOpen])

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const mode = MODES.find((m) => m.id === selectedMode)
      if (mode.id === 'publish') {
        onExportAndRedirect?.({ isTemplate: false })
        onClose()
      } else if (mode.id === 'share-template') {
        const res = await shareAsTemplate(workspaceId)
        await onDownloadTemplate?.()
        setResult({
          type: 'template',
          shareToken: res.shareToken,
          shareUrl: `${window.location.origin}/template/${res.shareToken}`,
        })
      } else if (mode.id === 'publish-template') {
        onExportAndRedirect?.({ isTemplate: true })
        onClose()
      }
    } catch (error) {
      console.error('[publish-modal] Error:', error)
      toast?.addToast?.(error.message || 'Gagal mempublikasikan', { type: 'error', duration: 5000 })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedMode, workspaceId, onExportAndRedirect, onDownloadTemplate, onClose, toast])

  const handleCopyLink = useCallback(async () => {
    if (!result?.shareUrl) return
    try {
      await navigator.clipboard.writeText(result.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast?.addToast?.('Gagal menyalin link', { type: 'error', duration: 3000 })
    }
  }, [result, toast])

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (result?.type === 'template') setCopied(false)
  }, [result])

  if (!isOpen) return null

  return (
    <div className="confirm-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="confirm-modal publish-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <button type="button" className="confirm-modal-close" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>

        {!result ? (
          <>
            <h2>Publikasikan Workspace</h2>
            <p className="confirm-modal-desc">
              Pilih cara publikasi untuk <strong>{workspaceTitle || 'workspace ini'}</strong>
            </p>

            <div className="publish-mode-list">
              {MODES.map((mode) => {
                const Icon = mode.icon
                const isSelected = selectedMode === mode.id
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`publish-mode-card${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedMode(mode.id)}
                  >
                    <span className="publish-mode-radio">
                      {isSelected && <span className="publish-mode-radio-dot" />}
                    </span>
                    <span className="publish-mode-content">
                      <span className="publish-mode-title">
                        <Icon size={16} />
                        {mode.title}
                      </span>
                      <span className="publish-mode-desc">{mode.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="confirm-modal-actions">
              <button type="button" className="confirm-modal-cancel" onClick={onClose} disabled={isSubmitting}>
                Batal
              </button>
              <button type="button" className="confirm-modal-confirm" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle size={14} className="confirm-modal-spinner" />}
                {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Berhasil Dibagikan sebagai Template!</h2>
            <p className="confirm-modal-desc">File template sudah di-download. Bagikan link ini atau kirim file .json-nya.</p>

            {result.shareUrl && (
              <div className="publish-result-link">
                <p className="confirm-modal-desc">Atau bagikan link berikut:</p>
                <div className="publish-share-link-row">
                  <input type="text" readOnly value={result.shareUrl} className="publish-share-link-input" onClick={(e) => e.target.select()} />
                  <button type="button" className="publish-copy-btn" onClick={handleCopyLink}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
            )}

            <div className="confirm-modal-actions">
              <button type="button" className="confirm-modal-cancel" onClick={onClose}>
                Tutup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}