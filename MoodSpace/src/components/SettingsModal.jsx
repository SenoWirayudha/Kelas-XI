import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Eye, EyeOff, FileText, Key, LoaderCircle, LogOut, Mail, Save, Shield, X } from 'lucide-react'
import { useAuth } from '../context/authState'
import { apiRequest } from '../lib/api/client'
import InfoModal from './InfoModal'

function SettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [infoModalType, setInfoModalType] = useState(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSendCode = useCallback(async () => {
    setError('')
    setSendingCode(true)
    try {
      await apiRequest('/auth/me/send-code', { method: 'POST' })
      setCodeSent(true)
      setSuccess('Kode verifikasi telah dikirim ke email')
    } catch (nextError) {
      setError(nextError.message || 'Gagal mengirim kode')
    } finally {
      setSendingCode(false)
    }
  }, [])

  if (!isOpen) return null

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    setSaving(true)
    try {
      await apiRequest('/auth/me/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword, verificationCode: verificationCode || undefined },
      })
      setSuccess('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setVerificationCode('')
      setCodeSent(false)
    } catch (nextError) {
      setError(nextError.message || 'Gagal mengubah password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="mood-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>Settings</h2>

        <div className="settings-list">
          <button type="button" className="settings-item" onClick={() => { onClose(); navigate('/profile', { state: { openEditProfile: true } }) }}>
            <div className="settings-item-left">
              <ExternalLink size={16} />
              <span>Edit Profile</span>
            </div>
            <span className="settings-item-hint">Buka halaman profile</span>
          </button>

          <button type="button" className="settings-item" onClick={() => { setError(''); setSuccess(''); setShowPasswordForm(!showPasswordForm) }}>
            <div className="settings-item-left">
              <Key size={16} />
              <span>Change Password</span>
            </div>
            <span className="settings-item-hint">Perbarui password akun</span>
          </button>

          {showPasswordForm && (
            <form className="settings-password-form" onSubmit={handleChangePassword}>
              <label>
                <span>Password saat ini</span>
                <div className="auth-password-wrapper">
                  <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowCurrentPassword((p) => !p)} tabIndex={-1}>
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label>
                <span>Password baru</span>
                <div className="auth-password-wrapper">
                  <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowNewPassword((p) => !p)} tabIndex={-1}>
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label>
                <span>Konfirmasi password baru</span>
                <div className="auth-password-wrapper">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((p) => !p)} tabIndex={-1}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="settings-code-row">
                <label className="settings-code-label">
                  <span>Kode verifikasi</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                  />
                </label>
                <button type="button" className="settings-send-code" onClick={handleSendCode} disabled={sendingCode}>
                  {sendingCode ? <LoaderCircle size={14} className="spin" /> : <Mail size={14} />}
                  {codeSent ? 'Kirim Ulang' : 'Kirim Kode'}
                </button>
              </div>

              {error && <p className="settings-password-error">{error}</p>}
              {success && <p className="settings-password-success">{success}</p>}
              <button type="submit" className="settings-password-submit" disabled={saving}>
                {saving ? <LoaderCircle size={14} className="spin" /> : <Save size={14} />}
                Simpan Password
              </button>
            </form>
          )}

          <span className="settings-section-label">Lainnya</span>

          <button type="button" className="settings-item" onClick={() => setInfoModalType('privacy')}>
            <div className="settings-item-left">
              <Shield size={16} />
              <span>Kebijakan Privasi</span>
            </div>
            <span className="settings-item-hint">Pelajari kebijakan privasi kami</span>
          </button>

          <button type="button" className="settings-item" onClick={() => setInfoModalType('terms')}>
            <div className="settings-item-left">
              <FileText size={16} />
              <span>Syarat &amp; Ketentuan</span>
            </div>
            <span className="settings-item-hint">Pelajari syarat dan ketentuan</span>
          </button>

          <div className="settings-user-info">
            <div className="settings-user-avatar">
              {user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="settings-user-details">
              <span className="settings-user-name">{user?.displayName || user?.username}</span>
              <span className="settings-user-email">{user?.email}</span>
            </div>
            <button type="button" className="settings-user-logout" onClick={() => { onClose(); logout() }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
      <InfoModal type={infoModalType} onClose={() => setInfoModalType(null)} />
    </>
  )
}

export default SettingsModal
