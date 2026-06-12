import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Key, LoaderCircle, LogOut, Save, X } from 'lucide-react'
import { useAuth } from '../context/authState'
import { apiRequest } from '../lib/api/client'

function SettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        body: { currentPassword, newPassword },
      })
      setSuccess('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (nextError) {
      setError(nextError.message || 'Gagal mengubah password')
    } finally {
      setSaving(false)
    }
  }

  return (
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
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </label>
              <label>
                <span>Password baru</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
              </label>
              <label>
                <span>Konfirmasi password baru</span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
              </label>
              {error && <p className="settings-password-error">{error}</p>}
              {success && <p className="settings-password-success">{success}</p>}
              <button type="submit" className="settings-password-submit" disabled={saving}>
                {saving ? <LoaderCircle size={14} className="spin" /> : <Save size={14} />}
                Simpan Password
              </button>
            </form>
          )}

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
  )
}

export default SettingsModal
