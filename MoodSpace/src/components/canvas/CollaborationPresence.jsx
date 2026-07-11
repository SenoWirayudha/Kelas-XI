import { useCollaboration } from '../../hooks/useCollaboration'

const MAX_VISIBLE = 3

export function CollaborationPresence() {
  const { collaborators, collaboratorCount, isConnected } = useCollaboration()

  if (!isConnected || collaboratorCount === 0) {
    return <div className="workspace-avatars" />
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
