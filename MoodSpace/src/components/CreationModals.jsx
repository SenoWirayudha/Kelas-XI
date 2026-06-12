import { useCreation } from '../context/CreationContext'
import NewBoardModal from './NewBoardModal'
import NewProjectModal from './NewProjectModal'

function CreationModals() {
  const { activeModal, closeCreationModal } = useCreation()
  return (
    <>
      <NewProjectModal isOpen={activeModal === 'project'} onCancel={closeCreationModal} />
      <NewBoardModal isOpen={activeModal === 'board'} onCancel={closeCreationModal} />
    </>
  )
}

export default CreationModals
