import { FolderPlus, ImagePlus, LayoutTemplate } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { useCreation } from '../context/CreationContext'

const ITEMS = [
  { Icon: FolderPlus, label: 'New Project', action: 'newProject' },
  { Icon: ImagePlus, label: 'New Post', action: 'newPost' },
  { Icon: LayoutTemplate, label: 'New Board', action: 'newBoard' },
]

function CreateMenu({ className = '', onAction, staggerDelay = 0 }) {
  const navigate = useNavigate()
  const { requireAuth } = useAuth()
  const { openNewBoard, openNewProject } = useCreation()

  const run = (action) => {
    if (!requireAuth('login')) return
    action()
    onAction?.()
  }

  const handlers = {
    newProject: openNewProject,
    newPost: () => navigate('/posts/new'),
    newBoard: openNewBoard,
  }

  return (
    <div className={`create-menu ${className}`}>
      {ITEMS.map(({ Icon, label, action }, i) => (
        <button
          key={action}
          type="button"
          className="create-menu-item"
          style={staggerDelay ? { animationDelay: `${i * staggerDelay}ms` } : undefined}
          onClick={() => run(handlers[action])}
        >
          <Icon size={17} />
          {label}
        </button>
      ))}
    </div>
  )
}

export default CreateMenu
