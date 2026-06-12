import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createBoard } from '../lib/api/boards'

function NewBoardModal({ isOpen, onCancel, onCreated }) {
  const [name, setName] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setIsPrivate(true)
    setError('')
  }, [isOpen])

  if (!isOpen) return null

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    setError('')
    try {
      const payload = await createBoard({ name: name.trim(), visibility: isPrivate ? 'private' : 'public' })
      onCreated?.(payload.board)
      onCancel()
    } catch (nextError) {
      setError(nextError.message || 'Board gagal dibuat')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="mood-modal mood-modal-compact" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onCancel}><X size={18} /></button>
        <h2>New Board</h2>
        <form className="mood-modal-form" onSubmit={submit}>
          <label><span>Nama Board</span><input value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label>
          <div className="modal-toggle-row">
            <div><strong>Private Board</strong><small>Hanya kamu yang dapat melihat board ini.</small></div>
            <button type="button" className={`workspace-export-toggle ${isPrivate ? 'active' : ''}`} onClick={() => setIsPrivate((value) => !value)}><span /></button>
          </div>
          {error && <p className="mood-modal-error">{error}</p>}
          <footer className="mood-modal-actions">
            <button type="button" className="mood-modal-cancel" onClick={onCancel}>Cancel</button>
            <button type="submit" className="mood-modal-confirm" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default NewBoardModal
