import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

function TextInputModal({
  isOpen,
  title,
  label,
  initialValue = '',
  placeholder = '',
  confirmLabel = 'Save',
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (isOpen) setValue(initialValue)
  }, [initialValue, isOpen])

  if (!isOpen) return null

  const submit = (event) => {
    event.preventDefault()
    onSubmit?.(value)
  }

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="mood-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onCancel}>
          <X size={18} />
        </button>
        <h2>{title}</h2>
        <form className="mood-modal-form" onSubmit={submit}>
          <label>
            <span>{label}</span>
            <input value={value} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} autoFocus />
          </label>
          <footer className="mood-modal-actions">
            <button type="button" className="mood-modal-cancel" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="mood-modal-confirm" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : confirmLabel}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default TextInputModal
