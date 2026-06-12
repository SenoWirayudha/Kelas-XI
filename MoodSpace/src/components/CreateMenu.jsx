import { FolderPlus, ImagePlus, LayoutTemplate } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { useCreation } from '../context/CreationContext'

function CreateMenu({ className = '', onAction }) {
  const navigate = useNavigate()
  const { requireAuth } = useAuth()
  const { openNewBoard, openNewProject } = useCreation()

  const run = (action) => {
    if (!requireAuth('login')) return
    action()
    onAction?.()
  }

  return (
    <div className={`create-menu ${className}`}>
      <button type="button" onClick={() => run(openNewProject)}><FolderPlus size={17} />New Project</button>
      <button type="button" onClick={() => run(() => navigate('/posts/new'))}><ImagePlus size={17} />New Post</button>
      <button type="button" onClick={() => run(openNewBoard)}><LayoutTemplate size={17} />New Board</button>
    </div>
  )
}

export default CreateMenu
