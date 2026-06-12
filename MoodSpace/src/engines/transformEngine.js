import { getClampedCanvasPosition, getCanvasContainedSize } from '../utils/canvasPositionUtils'
import {
  getArrowResizeSize,
  getShapeMinHeightForTextWidth,
  getShapeResizeSize,
} from '../utils/shapeUtils'
import { isGridFrame, getResolvedFrameSlots } from '../utils/frameUtils'

export const getCanvasItemTransformPatch = ({
  item,
  node,
  isShiftDown,
  activeAnchor,
  canvasBounds,
}) => {
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()
  const requestedWidth = Math.max(1, item.w * Math.abs(scaleX))
  const requestedHeight = Math.max(1, item.h * Math.abs(scaleY))

  node.scaleX(1)
  node.scaleY(1)

  const resizedSize = item.kind === 'shape' && item.shapeType === 'arrow-shape'
    ? getArrowResizeSize(item, requestedWidth, requestedHeight, activeAnchor)
    : item.kind === 'shape'
      ? getShapeResizeSize(item, requestedWidth, requestedHeight, isShiftDown)
      : { w: Math.max(40, requestedWidth), h: Math.max(40, requestedHeight) }

  const textAwareSize = item.kind === 'shape' && item.shapeText
    ? {
        ...resizedSize,
        h: Math.max(
          resizedSize.h,
          getShapeMinHeightForTextWidth(
            { ...item, w: resizedSize.w, h: resizedSize.h },
            item.shapeText,
            item.shapeTextFontSize || 16,
            resizedSize.w,
          ),
        ),
      }
    : resizedSize

  if (item.kind === 'shape' && item.shapeType === 'circle' && item.shapeText) {
    const circleSize = Math.max(textAwareSize.w, textAwareSize.h)
    textAwareSize.w = circleSize
    textAwareSize.h = circleSize
  }

  const nextSize = getCanvasContainedSize(textAwareSize.w, textAwareSize.h)
  const transformedCenter = {
    x: node.x() + requestedWidth / 2,
    y: node.y() + requestedHeight / 2,
  }
  const rawX = item.kind === 'shape' ? transformedCenter.x - nextSize.w / 2 : node.x()
  const rawY = item.kind === 'shape' ? transformedCenter.y - nextSize.h / 2 : node.y()
  const nextPosition = getClampedCanvasPosition(
    nextSize.w,
    nextSize.h,
    { x: rawX, y: rawY },
    canvasBounds,
  )

  node.x(nextPosition.x)
  node.y(nextPosition.y)
  node.width?.(nextSize.w)
  node.height?.(nextSize.h)

  const patch = {
    x: nextPosition.x,
    y: nextPosition.y,
    w: nextSize.w,
    h: nextSize.h,
    rotation: node.rotation(),
  }

  if (item.kind === 'shape') {
    patch.shapeAspectRatio = item.shapeType === 'circle' ? 1 : nextSize.w / nextSize.h
    patch.scaleX = 1
    patch.scaleY = 1
  }

  if (item.kind === 'frame' && isGridFrame(item.frameType) && item.frameImages?.length) {
    const oldSlots = getResolvedFrameSlots(item)
    const nextSlots = getResolvedFrameSlots({ ...item, w: nextSize.w, h: nextSize.h })

    patch.frameImages = item.frameImages.map((frameImage, index) => {
      if (!frameImage) return frameImage

      const oldSlot = oldSlots.find((slot) => slot.slotIndex === index)
      const nextSlot = nextSlots.find((slot) => slot.slotIndex === index)
      if (!oldSlot || !nextSlot) return frameImage

      return {
        ...frameImage,
        position: {
          x: (frameImage.position?.x || 0) * (nextSlot.width / oldSlot.width),
          y: (frameImage.position?.y || 0) * (nextSlot.height / oldSlot.height),
        },
      }
    })
  } else if (item.kind === 'frame' && item.frameImageSrc) {
    const scaleFactorX = nextSize.w / item.w
    const scaleFactorY = nextSize.h / item.h
    patch.frameImagePosition = {
      x: (item.frameImagePosition?.x || 0) * scaleFactorX,
      y: (item.frameImagePosition?.y || 0) * scaleFactorY,
    }
    patch.frameImageScale = item.frameImageScale || 1
  }

  return patch
}
