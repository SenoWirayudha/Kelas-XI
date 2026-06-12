import { useCallback, useEffect } from 'react'
import { LoaderCircle, X } from 'lucide-react'

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm',
  description = '',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isConfirming = false,
  isDanger = true,
  onConfirm,
  onCancel,
}) {
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') onCancel?.()
    if (event.key === 'Enter' && !isConfirming) {
      event.preventDefault()
      onConfirm?.()
    }
  }, [onCancel, onConfirm, isConfirming])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="confirm-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="confirm-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="confirm-modal-close" aria-label="Close" onClick={onCancel}>
          <X size={16} />
        </button>
        <h2>{title}</h2>
        {description && <p className="confirm-modal-desc">{description}</p>}
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-cancel" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-confirm${isDanger ? ' danger' : ''}`}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming && <LoaderCircle size={14} className="confirm-modal-spinner" />}
            {isConfirming ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
