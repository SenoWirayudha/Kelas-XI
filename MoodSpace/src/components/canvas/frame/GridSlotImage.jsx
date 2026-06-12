import { useEffect, useRef } from 'react'
import { Image as KonvaImage } from 'react-konva'
import { calculateCoverFit, getFrameImageCropBounds, getMinFrameImageZoom } from '../../../utils/frameUtils'

export default function GridSlotImage({ image, slot, item, slotIndex, isEditing, onImageDragEnd, onImageScaleChange, imageRef }) {
  const currentData = item.frameImages?.[slotIndex] || {}
 
  // Simpan zoom di ref agar onTransform selalu pakai nilai TERBARU
  // (bukan stale closure dari render sebelumnya)
  const zoomRef = useRef(currentData.scale || null)
  useEffect(() => {
    zoomRef.current = currentData.scale || null
  }, [currentData.scale])
 
  const fit = calculateCoverFit({
    imageWidth: image.width,
    imageHeight: image.height,
    slot,
    fit: currentData.fit || 'cover',
    crop: currentData.position,
    zoom: currentData.scale || 1,
  })
 
  const bounds = getFrameImageCropBounds({
    imageWidth: image.width,
    imageHeight: image.height,
    slot,
    fit: currentData.fit || 'cover',
    zoom: currentData.scale || 1,
  })
 
  if (!fit) return null
 
  const centerX = slot.x + (slot.width - fit.width) / 2
  const centerY = slot.y + (slot.height - fit.height) / 2
 
  return (
    <KonvaImage
      ref={imageRef}
      image={image}
      x={fit.x}
      y={fit.y}
      width={fit.width}
      height={fit.height}
      draggable={isEditing}
      listening={isEditing}
      onDragStart={(e) => { e.cancelBubble = true }}
      onDragMove={(e) => {
        if (!bounds) return
        const cropX = e.target.x() - centerX
        const cropY = e.target.y() - centerY
        e.target.x(centerX + Math.min(bounds.maxX, Math.max(bounds.minX, cropX)))
        e.target.y(centerY + Math.min(bounds.maxY, Math.max(bounds.minY, cropY)))
      }}
      onDragEnd={(e) => {
        if (!onImageDragEnd || !bounds) return
        e.cancelBubble = true
        const cropX = Math.min(bounds.maxX, Math.max(bounds.minX, e.target.x() - centerX))
        const cropY = Math.min(bounds.maxY, Math.max(bounds.minY, e.target.y() - centerY))
        e.target.x(fit.x)
        e.target.y(fit.y)
        e.target.getLayer()?.batchDraw()
        onImageDragEnd(slotIndex, { x: cropX, y: cropY })
      }}
      onTransform={(e) => {
        // HANYA update visual — JANGAN panggil onImageScaleChange di sini
        // karena itu trigger React re-render yang replace KonvaImage
        // dan transformer kehilangan state resize-nya
        const node = e.target
        const sx = Math.abs(node.scaleX())
        const sy = Math.abs(node.scaleY())
        node.scaleX(1)
        node.scaleY(1)
 
        if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return
 
        const avgScale = (sx + sy) / 2
        const minZoom = getMinFrameImageZoom({
          imageWidth: image.width,
          imageHeight: image.height,
          slot,
          fit: currentData.fit || 'cover',
        })
        const prevZoom = zoomRef.current || minZoom
        const newZoom = Math.max(minZoom, prevZoom * avgScale)
        zoomRef.current = newZoom
 
        // Update visual saja — tanpa setState/onChange
        const newFit = calculateCoverFit({
          imageWidth: image.width,
          imageHeight: image.height,
          slot,
          fit: currentData.fit || 'cover',
          crop: currentData.position,
          zoom: newZoom,
        })
        if (newFit) {
          node.x(newFit.x)
          node.y(newFit.y)
          node.width(newFit.width)
          node.height(newFit.height)
          node.getLayer()?.batchDraw()
        }
      }}

      onTransformEnd={(e) => {
        const node = e.target
        node.scaleX(1)
        node.scaleY(1)
 
        if (!onImageScaleChange) return
 
        const minZoom = getMinFrameImageZoom({
          imageWidth: image.width,
          imageHeight: image.height,
          slot,
          fit: currentData.fit || 'cover',
        })
        const finalZoom = Math.max(minZoom, zoomRef.current || minZoom)
 
        const newBounds = getFrameImageCropBounds({
          imageWidth: image.width,
          imageHeight: image.height,
          slot,
          fit: currentData.fit || 'cover',
          zoom: finalZoom,
        })
 
        const clampedPos = {
          x: Math.min(newBounds.maxX, Math.max(newBounds.minX, currentData.position?.x || 0)),
          y: Math.min(newBounds.maxY, Math.max(newBounds.minY, currentData.position?.y || 0)),
        }
 
        // Reset node ke posisi final yang benar
        const newFit = calculateCoverFit({
          imageWidth: image.width,
          imageHeight: image.height,
          slot,
          fit: currentData.fit || 'cover',
          crop: clampedPos,
          zoom: finalZoom,
        })
        if (newFit) {
          node.x(newFit.x)
          node.y(newFit.y)
          node.width(newFit.width)
          node.height(newFit.height)
        }
        node.getLayer()?.batchDraw()
 
        // Commit ke React state hanya di sini (bukan di onTransform)
        onImageScaleChange(slotIndex, { zoom: finalZoom, position: clampedPos })
      }}
      onMouseUp={(e) => { if (isEditing) e.target.getStage().container().style.cursor = 'grab' }}
    />
  )
}
 
