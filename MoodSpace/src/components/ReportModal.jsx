import { useState } from 'react'
import { Flag, LoaderCircle } from 'lucide-react'
import { createReport } from '../lib/api/reports'

const REASONS = [
  { value: 'spam',         label: 'Spam' },
  { value: 'inappropriate', label: 'Konten Tidak Pantas' },
  { value: 'hate_speech',  label: 'Ujaran Kebencian' },
  { value: 'plagiarism',   label: 'Plagiarisme' },
  { value: 'other',        label: 'Lainnya' },
]

export default function ReportModal({ isOpen, postId, onClose }) {
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reason) return
    setIsSubmitting(true)
    setError('')
    try {
      await createReport({ postId, reason, detail })
      setSuccess(true)
    } catch (nextError) {
      setError(nextError.message || 'Gagal mengirim laporan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDetail('')
    setSuccess(false)
    setError('')
    onClose()
  }

  return (
    <div className="report-modal-backdrop" onClick={handleClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <>
            <div className="report-modal-icon"><Flag size={28} /></div>
            <h3>Laporan Terkirim</h3>
            <p>Terima kasih, laporan kamu akan kami review.</p>
            <button type="button" className="report-modal-btn primary" onClick={handleClose}>Tutup</button>
          </>
        ) : (
          <>
            <h3>Laporkan Postingan</h3>
            <p className="report-modal-desc">Pilih alasan kamu melaporkan postingan ini.</p>

            <div className="report-reasons">
              {REASONS.map((r) => (
                <label key={r.value} className={`report-reason ${reason === r.value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>

            {reason === 'other' && (
              <textarea
                className="report-detail-input"
                placeholder="Jelaskan lebih detail..."
                rows={3}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={2000}
              />
            )}

            {error && <p className="report-error">{error}</p>}

            <div className="report-modal-actions">
              <button type="button" className="report-modal-btn" onClick={handleClose} disabled={isSubmitting}>Batal</button>
              <button type="button" className="report-modal-btn primary" onClick={handleSubmit} disabled={!reason || isSubmitting}>
                {isSubmitting ? <LoaderCircle size={16} className="spin" /> : 'Kirim Laporan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
