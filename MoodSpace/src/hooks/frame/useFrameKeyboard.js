import { useEffect } from 'react'
import { clampFrameImagePosition } from '../../utils/frameUtils'

export const useFrameKeyboard = ({
  isEditing,
  isGrid,
  item,
  loadedImages,
  slots,
  srcArray,
  activeEditSlotRef,
  innerTransformerRef,
  imageRefs,
  onImageDelete,
  onImageDragEnd,
}) => {
  useEffect(() => {
    if (!isEditing) return undefined

    const handleFrameImageKeyDown = (event) => {
      const target = event.target
      const isTypingTarget = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isTypingTarget || event.ctrlKey || event.metaKey || event.altKey) return

      const slotIdx = isGrid ? activeEditSlotRef.current : 0
      const slot = slots[slotIdx]
      const image = srcArray[slotIdx] ? loadedImages[slotIdx] : null
      const hasImage = isGrid ? !!item.frameImages?.[slotIdx]?.src : !!item.frameImageSrc

      if ((event.key === 'Delete' || event.key === 'Backspace') && hasImage) {
        event.preventDefault()
        const imageNode = imageRefs[slotIdx]?.current
        innerTransformerRef.current?.nodes([])
        imageNode?.clearCache?.()
        imageNode?.image?.(null)
        imageNode?.visible?.(false)
        imageNode?.getLayer?.()?.batchDraw()
        onImageDelete?.(slotIdx)
        return
      }

      const deltas = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      }
      const delta = deltas[event.key]
      if (!delta || !image || !slot || !hasImage) return

      event.preventDefault()
      const step = event.shiftKey ? 10 : 1
      const imageData = isGrid ? item.frameImages?.[slotIdx] : item
      const currentPosition = isGrid ? imageData?.position : item.frameImagePosition
      const zoom = isGrid ? imageData?.scale || 1 : item.frameImageScale || 1
      const fit = isGrid ? imageData?.fit || 'cover' : item.frameImageFit || 'cover'
      const nextPosition = clampFrameImagePosition({
        imageWidth: image.width,
        imageHeight: image.height,
        slot,
        fit,
        zoom,
        position: {
          x: (currentPosition?.x || 0) + delta.x * step,
          y: (currentPosition?.y || 0) + delta.y * step,
        },
      })

      onImageDragEnd?.(slotIdx, nextPosition)
    }

    window.addEventListener('keydown', handleFrameImageKeyDown)
    return () => window.removeEventListener('keydown', handleFrameImageKeyDown)
  }, [activeEditSlotRef, imageRefs, innerTransformerRef, isEditing, isGrid, item, loadedImages, onImageDelete, onImageDragEnd, slots, srcArray])
}
