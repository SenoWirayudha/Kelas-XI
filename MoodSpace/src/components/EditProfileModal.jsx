import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { uploadMediaFile } from '../lib/api/media'
import CroppedProfileImage from './CroppedProfileImage'

const getImageSize = (file) => new Promise((resolve) => {
  const image = new Image()
  const url = URL.createObjectURL(file)
  image.onload = () => {
    resolve({ width: image.naturalWidth, height: image.naturalHeight })
    URL.revokeObjectURL(url)
  }
  image.onerror = () => {
    resolve({})
    URL.revokeObjectURL(url)
  }
  image.src = url
})

function EditProfileModal({ isOpen, profile, bannerAspectRatio = 16 / 5, isSaving = false, onCancel, onSave, onRequestCrop, cropResult }) {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [avatarCrop, setAvatarCrop] = useState(null)
  const [bannerCrop, setBannerCrop] = useState(null)
  const [avatarCleared, setAvatarCleared] = useState(false)
  const [bannerCleared, setBannerCleared] = useState(false)
  const avatarFileRef = useRef(null)
  const bannerFileRef = useRef(null)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [location, setLocation] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [socialLink, setSocialLink] = useState('')
  const initializedProfileKeyRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      initializedProfileKeyRef.current = null
      return
    }
    const profileKey = profile?.id || profile?.userId || profile?.username || 'current'
    if (initializedProfileKeyRef.current === profileKey) return
    console.debug('[EditProfile crop] initializing edit profile form', {
      profileKey,
      hasAvatar: !!profile?.avatarUrl,
      hasBanner: !!profile?.bannerUrl,
    })
    initializedProfileKeyRef.current = profileKey
    setDisplayName(profile?.displayName || '')
    setUsername(profile?.username || '')
    setBio(profile?.bio || '')
    setAvatarFile(null)
    setBannerFile(null)
    setAvatarCrop(profile?.metadata?.avatarCrop || null)
    setBannerCrop(profile?.metadata?.bannerCrop || null)
    setAvatarCleared(false)
    setBannerCleared(false)
    setError('')
    setLocation(profile?.location || '')
    setWebsiteUrl(profile?.websiteUrl || '')
    setSocialLink(profile?.socialLinks?.main || '')
  }, [
    isOpen,
    profile?.avatarUrl,
    profile?.bannerUrl,
    profile?.bio,
    profile?.displayName,
    profile?.id,
    profile?.location,
    profile?.metadata?.avatarCrop,
    profile?.metadata?.bannerCrop,
    profile?.socialLinks?.main,
    profile?.userId,
    profile?.username,
    profile?.websiteUrl,
  ])

  const applyCropResult = (mode, file, crop) => {
    console.warn('[EditProfile crop] crop saved', {
      mode,
      name: file?.name || null,
      crop,
    })
    const previewUrl = file ? URL.createObjectURL(file) : null
    if (mode === 'avatar') {
      setAvatarFile(file)
      setAvatarPreview((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return previewUrl
      })
      setAvatarCrop(crop)
      setAvatarCleared(false)
    } else {
      setBannerFile(file)
      setBannerPreview((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return previewUrl
      })
      setBannerCrop(crop)
      setBannerCleared(false)
    }
  }

  useEffect(() => {
    if (!cropResult?.file || !cropResult?.crop || !cropResult?.mode) return
    console.warn('[EditProfile crop] applying crop result prop', {
      mode: cropResult.mode,
      name: cropResult.file.name,
      crop: cropResult.crop,
    })
    applyCropResult(cropResult.mode, cropResult.file, cropResult.crop)
  }, [cropResult])

  const openCrop = (mode, file) => {
    if (!file) {
      console.error('[EditProfile crop] openCrop called without file', { mode })
      return
    }
    console.warn('[EditProfile crop] opening crop modal', {
      mode,
      name: file.name,
      type: file.type,
      size: file.size,
    })
    onRequestCrop?.({
      mode,
      file,
    })
  }

  const handleMediaFileChange = (mode) => (event) => {
    const file = event.target.files?.[0] || null
    console.warn('[EditProfile crop] file input changed', {
      mode,
      fileCount: event.target.files?.length || 0,
      name: file?.name || null,
      type: file?.type || null,
      size: file?.size || null,
    })
    event.target.value = ''
    openCrop(mode, file)
  }

  const pickProfileImage = async (mode) => {
    console.warn('[EditProfile crop] pick image requested', {
      mode,
      hasFileSystemPicker: typeof window !== 'undefined' && !!window.showOpenFilePicker,
    })
    if (typeof window !== 'undefined' && window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'Images',
            accept: {
              'image/png': ['.png'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/webp': ['.webp'],
            },
          }],
        })
        const file = await handle.getFile()
        console.warn('[EditProfile crop] file picked with File System Picker', {
          mode,
          name: file?.name || null,
          type: file?.type || null,
          size: file?.size || null,
        })
        openCrop(mode, file)
        return
      } catch (error) {
        if (error?.name === 'AbortError') {
          console.warn('[EditProfile crop] file picker cancelled', { mode })
          return
        }
        console.error('[EditProfile crop] File System Picker failed, falling back to input', error)
      }
    }

    const input = mode === 'avatar' ? avatarFileRef.current : bannerFileRef.current
    if (!input) {
      console.error('[EditProfile crop] file input ref missing', { mode })
      return
    }
    input.click()
  }

  useEffect(() => {
    if (avatarCleared) return undefined
    if (!avatarFile) {
      setAvatarPreview(profile?.avatarUrl || null)
      return undefined
    }
    return undefined
  }, [avatarFile, profile?.avatarUrl, avatarCleared])

  useEffect(() => {
    if (bannerCleared) return undefined
    if (!bannerFile) {
      setBannerPreview(profile?.bannerUrl || null)
      return undefined
    }
    return undefined
  }, [bannerFile, profile?.bannerUrl, bannerCleared])

  useEffect(() => () => {
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  useEffect(() => () => {
    if (bannerPreview?.startsWith('blob:')) URL.revokeObjectURL(bannerPreview)
  }, [bannerPreview])

  useEffect(() => {
    if (!isOpen) return undefined
    const avatarInput = avatarFileRef.current
    const bannerInput = bannerFileRef.current
    const handleAvatarNativeChange = (event) => {
      console.warn('[EditProfile crop] native avatar input change fired')
      handleMediaFileChange('avatar')(event)
    }
    const handleBannerNativeChange = (event) => {
      console.warn('[EditProfile crop] native banner input change fired')
      handleMediaFileChange('banner')(event)
    }
    avatarInput?.addEventListener('change', handleAvatarNativeChange)
    bannerInput?.addEventListener('change', handleBannerNativeChange)
    return () => {
      avatarInput?.removeEventListener('change', handleAvatarNativeChange)
      bannerInput?.removeEventListener('change', handleBannerNativeChange)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleUsernameInput = (event) => {
    setUsername(event.target.value.replace(/^@+/, '').toLowerCase())
  }

  const uploadProfileImage = async (file) => {
    if (!file) return null
    const size = await getImageSize(file)
    const result = await uploadMediaFile({ file, ...size, sourceType: 'profile', addToUploads: false })
    return result.media.id
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsUploading(true)
    try {
      const [avatarMediaId, bannerMediaId] = await Promise.all([
        avatarCleared ? null : uploadProfileImage(avatarFile),
        bannerCleared ? null : uploadProfileImage(bannerFile),
      ])
      const profileData = {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        ...(avatarCleared || avatarMediaId ? { avatarMediaId: avatarMediaId ?? null } : {}),
        ...(bannerCleared || bannerMediaId ? { bannerMediaId: bannerMediaId ?? null } : {}),
        ...(socialLink.trim() ? { socialLinks: { main: socialLink.trim() } } : {}),
        ...((avatarCrop || bannerCrop) ? {
          profileMetadata: {
            ...(avatarCrop ? { avatarCrop } : {}),
            ...(bannerCrop ? { bannerCrop } : {}),
          },
        } : {}),
      }
      await onSave(profileData)
    } catch (nextError) {
      setError(nextError.message || 'Profile gagal disimpan')
    } finally {
      setIsUploading(false)
    }
  }

  const busy = isSaving || isUploading

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="mood-modal edit-profile-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onCancel}>
          <X size={18} />
        </button>
        <h2>Edit Profile</h2>

        <form className="mood-modal-form" onSubmit={submit}>
          <div className="edit-profile-media">
            <div className="edit-profile-banner-wrapper">
              <input ref={bannerFileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleMediaFileChange('banner')} onInput={handleMediaFileChange('banner')} />
              <button type="button" className="edit-profile-banner" style={{ aspectRatio: bannerAspectRatio }} onClick={() => pickProfileImage('banner')}>
                <CroppedProfileImage
                  src={bannerCleared ? null : bannerPreview}
                  crop={bannerCrop}
                  fallback={<span>Backdrop</span>}
                />
                <div className="edit-profile-banner-edit">
                  <ImagePlus size={14} /> Atur backdrop
                </div>
              </button>
              {(bannerPreview && !bannerCleared) && (
                <button type="button" className="edit-profile-action-btn banner-remove" onClick={(event) => { event.stopPropagation(); setBannerFile(null); setBannerPreview(null); setBannerCrop(null); setBannerCleared(true) }} aria-label="Hapus backdrop">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="edit-profile-avatar-wrapper">
              <input ref={avatarFileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleMediaFileChange('avatar')} onInput={handleMediaFileChange('avatar')} />
              <button type="button" className="edit-profile-avatar" title="Change photo" onClick={() => pickProfileImage('avatar')}>
                <CroppedProfileImage
                  src={avatarCleared ? null : avatarPreview}
                  crop={avatarCrop}
                  circle
                  fallback={<div className="profile-avatar-empty"><span className="avatar-initial" style={{ fontSize: '36px' }}>{(profile?.displayName || profile?.username || '?')[0].toUpperCase()}</span></div>}
                />
                <div className="edit-profile-avatar-hover">
                  <Camera size={18} />
                  <span>Change</span>
                </div>
              </button>
              <button type="button" className="edit-profile-action-btn avatar-edit" onClick={() => pickProfileImage('avatar')} aria-label="Ganti foto profile">
                <Camera size={14} />
              </button>
              {(avatarPreview && !avatarCleared) && (
                <button type="button" className="edit-profile-action-btn avatar-remove" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setAvatarFile(null); setAvatarPreview(null); setAvatarCrop(null); setAvatarCleared(true) }} aria-label="Hapus foto profile">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <label>
            <span>Nama Tampilan</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} />
          </label>
          <label>
            <span>Username</span>
            <div className="edit-profile-username">
              <strong>@</strong>
              <input
                value={username}
                onChange={handleUsernameInput}
                required
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9_.]+"
              />
            </div>
          </label>
          <label>
            <span>Bio</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} maxLength={500} />
          </label>

          <label>
            <span>Lokasi</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="Jakarta, Indonesia" />
          </label>

          <label>
            <span>Website</span>
            <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} type="url" placeholder="https://example.com" />
          </label>

          <label>
            <span>Social Link</span>
            <input value={socialLink} onChange={(event) => setSocialLink(event.target.value)} placeholder="instagram.com/username atau x.com/user" />
          </label>

          {error && <p className="mood-modal-error">{error}</p>}

          <footer className="mood-modal-actions">
            <button type="button" className="mood-modal-cancel" onClick={onCancel} disabled={busy}>Cancel</button>
            <button type="submit" className="mood-modal-confirm" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default EditProfileModal
