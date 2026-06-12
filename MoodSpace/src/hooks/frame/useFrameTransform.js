import { useEffect } from 'react'

export const useFrameTransform = ({
  isEditing,
  activeEditSlot,
  imageRefs,
  innerTransformerRef,
  loadedImages,
  srcArray,
}) => {
  useEffect(() => {
    if (!innerTransformerRef.current) return

    if (!isEditing) {
      innerTransformerRef.current.nodes([])
      innerTransformerRef.current.getLayer()?.batchDraw()
      return
    }

    const slotIdx = activeEditSlot
    const imageNode = imageRefs[slotIdx]?.current
    if (imageNode && srcArray[slotIdx] && loadedImages[slotIdx]) {
      innerTransformerRef.current.nodes([imageNode])
    } else {
      innerTransformerRef.current.nodes([])
    }
    innerTransformerRef.current.getLayer()?.batchDraw()
  }, [activeEditSlot, imageRefs, innerTransformerRef, isEditing, loadedImages, srcArray])
}
