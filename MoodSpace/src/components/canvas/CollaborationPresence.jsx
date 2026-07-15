import { useCollaboration } from '../../hooks/useCollaboration'
import { useState, useEffect, useRef, useCallback } from 'react'

const MAX_VISIBLE = 3

export function CollaborationPresence() {
  const { collaborators, collaboratorCount, isConnected } = useCollaboration()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 860)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleOutsideClick = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsDropdownOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isDropdownOpen, handleOutsideClick])

  if (!isConnected || collaboratorCount === 0) {
    return <div className="workspace-avatars" />
  }

  if (isMobile) {
    const primary = collaborators[0]
    const overflow = collaboratorCount - 1
    const initial = (primary.displayName || primary.username || '?').charAt(0).toUpperCase()

    return (
      <div className="workspace-avatars workspace-avatars-mobile" ref={dropdownRef}>
        <div className="workspace-avatar-mobile-trigger" onClick={() => setIsDropdownOpen((v) => !v)}>
          <span
            className="workspace-avatar-item"
            title={primary.displayName || primary.username}
            style={primary.avatarUrl ? { backgroundImage: `url("${primary.avatarUrl}")` } : undefined}
          >
            {!primary.avatarUrl && <span className="workspace-avatar-initial">{initial}</span>}
          </span>
          {overflow > 0 && <span className="workspace-avatar-badge">+{overflow}</span>}
        </div>
        {isDropdownOpen && (
          <div className="workspace-avatar-dropdown">
            {collaborators.map((c) => {
              const init = (c.displayName || c.username || '?').charAt(0).toUpperCase()
              return (
                <div key={c.userId} className="workspace-avatar-dropdown-item">
                  <span
                    className="workspace-avatar-dropdown-avatar"
                    style={c.avatarUrl ? { backgroundImage: `url("${c.avatarUrl}")` } : undefined}
                  >
                    {!c.avatarUrl && <span className="workspace-avatar-initial">{init}</span>}
                  </span>
                  <span className="workspace-avatar-dropdown-name">{c.displayName || c.username}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const visible = collaborators.slice(0, MAX_VISIBLE)
  const overflow = collaboratorCount - MAX_VISIBLE

  return (
    <div className="workspace-avatars">
      {visible.map((c) => {
        const initial = (c.displayName || c.username || '?').charAt(0).toUpperCase()
        return (
          <span
            key={c.userId}
            className="workspace-avatar-item"
            title={c.displayName || c.username}
            style={c.avatarUrl ? { backgroundImage: `url("${c.avatarUrl}")` } : undefined}
          >
            {!c.avatarUrl && <span className="workspace-avatar-initial">{initial}</span>}
          </span>
        )
      })}
      {overflow > 0 && <strong>+{overflow}</strong>}
    </div>
  )
}
