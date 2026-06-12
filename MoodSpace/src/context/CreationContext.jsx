import { createContext, useContext, useMemo, useState } from 'react'

const CreationContext = createContext(null)

export function CreationProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null)
  const value = useMemo(() => ({
    activeModal,
    openNewProject: () => setActiveModal('project'),
    openNewBoard: () => setActiveModal('board'),
    closeCreationModal: () => setActiveModal(null),
  }), [activeModal])

  return <CreationContext.Provider value={value}>{children}</CreationContext.Provider>
}

export const useCreation = () => {
  const context = useContext(CreationContext)
  if (!context) throw new Error('useCreation must be used within CreationProvider')
  return context
}
