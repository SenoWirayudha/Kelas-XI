import { useEffect, useState } from 'react'
import { LoaderCircle, Mail, Send, X } from 'lucide-react'
import { sendFeedback } from '../lib/api/feedback'

const CATEGORIES = [
  { value: 'bug', label: 'Masalah Teknis', desc: 'Bug, error, tidak bisa dipakai' },
  { value: 'saran_fitur', label: 'Saran Fitur', desc: 'Ide fitur baru atau perbaikan' },
  { value: 'pertanyaan', label: 'Pertanyaan', desc: 'Butuh bantuan penggunaan' },
  { value: 'lainnya', label: 'Lainnya', desc: 'Topik lain' },
]

export default function FeedbackModal({ isOpen, onClose, initialEmail = '' }) {
  const [category, setCategory] = useState('bug')
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState(initialEmail)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) setContactEmail(initialEmail || '')
  }, [isOpen, initialEmail])

  if (!isOpen) return null

  const canSubmit = category && message.trim().length >= 10 && contactEmail.trim() && !isSubmitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    setError('')
    try {
      await sendFeedback({
        category,
        message: message.trim(),
        contactEmail: contactEmail.trim(),
        pageUrl: window.location.href,
      })
      setSuccess(true)
    } catch (nextError) {
      setError(nextError.message || 'Gagal mengirim feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setMessage('')
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section className="mood-modal feedback-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={handleClose}>
          <X size={18} />
        </button>

        {success ? (
          <div className="feedback-success">
            <div className="feedback-success-icon"><Send size={28} /></div>
            <h2>Feedback Terkirim</h2>
            <p>Terima kasih! Pesan kamu sudah kami terima. Balasan akan kami kirim ke <strong>{contactEmail}</strong>.</p>
            <button type="button" className="settings-password-submit" onClick={handleClose}>Tutup</button>
          </div>
        ) : (
          <>
            <h2>Laporkan Masalah / Saran</h2>
            <p className="feedback-desc">Pilih kategori, jelaskan masalah atau saran, dan isi email untuk balasan.</p>

            <form onSubmit={handleSubmit} className="feedback-form">
              <label className="feedback-label">
                <span>Kategori</span>
                <div className="feedback-category-grid">
                  {CATEGORIES.map((c) => (
                    <label key={c.value} className={`feedback-category ${category === c.value ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="feedback-category"
                        value={c.value}
                        checked={category === c.value}
                        onChange={() => setCategory(c.value)}
                      />
                      <span className="feedback-category-label">{c.label}</span>
                      <span className="feedback-category-desc">{c.desc}</span>
                    </label>
                  ))}
                </div>
              </label>

              <label className="feedback-label">
                <span>Pesan <em className="feedback-counter">{message.length}/2000</em></span>
                <textarea
                  className="feedback-textarea"
                  placeholder="Jelaskan masalah atau saran kamu secara detail..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  required
                />
                {message.length > 0 && message.trim().length < 10 && (
                  <span className="feedback-hint error">Minimal 10 karakter</span>
                )}
              </label>

              <label className="feedback-label">
                <span>Alamat Email</span>
                <div className="auth-password-wrapper feedback-email-wrapper">
                  <Mail size={14} className="feedback-email-icon" />
                  <input
                    type="email"
                    placeholder="kamu@email.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    maxLength={254}
                  />
                </div>
                <span className="feedback-hint">Balasan akan dikirim ke email ini</span>
              </label>

              {error && <p className="settings-password-error">{error}</p>}

              <button type="submit" className="settings-password-submit feedback-submit" disabled={!canSubmit}>
                {isSubmitting ? <LoaderCircle size={14} className="spin" /> : <Send size={14} />}
                {isSubmitting ? 'Mengirim...' : 'Kirim Feedback'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
