import { useCallback, useEffect, useRef, useState } from 'react'

export const useFrameEditing = ({ isEditing, initialEditSlot = 0 }) => {
  const [activeEditSlot, setActiveEditSlot] = useState(0)
  const activeEditSlotRef = useRef(0)
  const prevIsEditingRef = useRef(false)

  const updateActiveEditSlot = useCallback((idx) => {
    activeEditSlotRef.current = idx
    setActiveEditSlot(idx)
  }, [])

  useEffect(() => {
    if (isEditing && !prevIsEditingRef.current) {
      updateActiveEditSlot(initialEditSlot)
    }
    prevIsEditingRef.current = isEditing
  }, [isEditing, initialEditSlot, updateActiveEditSlot])

  return {
    activeEditSlot,
    activeEditSlotRef,
    updateActiveEditSlot,
  }
}
