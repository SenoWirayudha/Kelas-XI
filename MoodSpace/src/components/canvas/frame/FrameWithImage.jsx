import { useCallback, useEffect, useRef } from 'react'
import { Group, Rect, Circle, Line, Image as KonvaImage, Transformer } from 'react-konva'
import { useCanvasImages } from '../../../hooks/useCanvasImages'
import { useFrameEditing } from '../../../hooks/frame/useFrameEditing'
import { useFrameKeyboard } from '../../../hooks/frame/useFrameKeyboard'
import { useFrameTransform } from '../../../hooks/frame/useFrameTransform'
import GridSlotImage from './GridSlotImage'
import FramePlaceholder from './FramePlaceholder'
import { getShadowProps } from '../../../utils/konvaUtils'
import {
  isGridFrame,
  getResolvedFrameSlot,
  getResolvedFrameSlots,
  calculateCoverFit,
  getFrameImageCropBounds,
  getMinFrameImageZoom,
  applyFrameSlotClip,
} from '../../../utils/frameUtils'

const renderFramePlaceholder = (frameSlot, isDropTarget) => (
  <FramePlaceholder frameSlot={frameSlot} isDropTarget={isDropTarget} />
)

const renderFrameImage = (frameImage, frameSlot, item, isEditing, onImageDragEnd) => {
  const fit = calculateCoverFit({
    imageWidth: frameImage.width,
    imageHeight: frameImage.height,
    slot: frameSlot,
    fit: item.frameImageFit || 'cover',
    crop: item.frameImagePosition,
    zoom: item.frameImageScale || 1,
  })
 
  if (!fit) return null
 
  // Hitung batas offset dalam koordinat lokal frame (bukan stage)
  // Ini akurat terlepas dari zoom/rotation camera
  const bounds = getFrameImageCropBounds({
    imageWidth: frameImage.width,
    imageHeight: frameImage.height,
    slot: frameSlot,
    fit: item.frameImageFit || 'cover',
    zoom: item.frameImageScale || 1,
  })
 
  // Center position (tanpa crop)
  const centerX = frameSlot.x + (frameSlot.width - fit.width) / 2
  const centerY = frameSlot.y + (frameSlot.height - fit.height) / 2
 
  return (
    <KonvaImage
      image={frameImage}
      x={fit.x}
      y={fit.y}
      width={fit.width}
      height={fit.height}
      draggable={isEditing}
      listening={isEditing}
      onDragStart={(e) => {
        // Simpan posisi lokal saat drag mulai
        e.target._startX = e.target.x()
        e.target._startY = e.target.y()
        e.target._cropX = item.frameImagePosition?.x || 0
        e.target._cropY = item.frameImagePosition?.y || 0
        e.cancelBubble = true
      }}
      onDragMove={(e) => {
        // FIX: Clamp posisi dalam koordinat lokal saat drag berlangsung
        // Ini mencegah area kosong terlihat secara real-time
        const currentX = e.target.x()
        const currentY = e.target.y()
 
        // Hitung crop offset dari posisi lokal saat ini
        const cropX = currentX - centerX
        const cropY = currentY - centerY
 
        // Clamp crop offset
        const clampedCropX = Math.min(bounds.maxX, Math.max(bounds.minX, cropX))
        const clampedCropY = Math.min(bounds.maxY, Math.max(bounds.minY, cropY))
 
        // Convert kembali ke posisi lokal
        const clampedX = centerX + clampedCropX
        const clampedY = centerY + clampedCropY
 
        // Update posisi node secara langsung (tanpa re-render React)
        if (clampedX !== currentX || clampedY !== currentY) {
          e.target.x(clampedX)
          e.target.y(clampedY)
        }
      }}
      onDragEnd={(e) => {
        if (!isEditing || !onImageDragEnd) return
        e.cancelBubble = true
 
        // Hitung crop offset final dari posisi lokal
        const finalX = e.target.x()
        const finalY = e.target.y()
        const cropX = finalX - centerX
        const cropY = finalY - centerY
 
        // Clamp sekali lagi untuk pastikan valid
        const clampedCropX = Math.min(bounds.maxX, Math.max(bounds.minX, cropX))
        const clampedCropY = Math.min(bounds.maxY, Math.max(bounds.minY, cropY))
 
        // Reset visual ke posisi fit (state update akan re-render)
        e.target.x(fit.x)
        e.target.y(fit.y)
        e.target.getLayer()?.batchDraw()
 
        onImageDragEnd({
          x: clampedCropX,
          y: clampedCropY,
        })
      }}
      onMouseEnter={(e) => {
        if (isEditing) e.target.getStage().container().style.cursor = 'grab'
      }}
      onMouseLeave={(e) => {
        if (isEditing) e.target.getStage().container().style.cursor = 'default'
      }}
      onMouseDown={(e) => {
        if (isEditing) {
          e.target.getStage().container().style.cursor = 'grabbing'
          e.cancelBubble = true
        }
      }}
      onMouseUp={(e) => {
        if (isEditing) e.target.getStage().container().style.cursor = 'grab'
      }}
    />
  )
}

const renderFrameSlot = ({ item, frameImage, frameSlot, isDropTarget, isEditing, onImageDragEnd }) => (
  <Group
    clipFunc={applyFrameSlotClip(frameSlot)}
    listening={isEditing} // FIX: hanya aktif saat edit mode
  >
    {frameImage
      ? renderFrameImage(frameImage, frameSlot, item, isEditing, onImageDragEnd)
      : renderFramePlaceholder(frameSlot, isDropTarget)
    }
  </Group>
)

const renderFrameBackground = (item, shadowProps) => {
  if (isGridFrame(item.frameType)) {
    return (
      <Rect
        width={item.w}
        height={item.h}
        cornerRadius={8}
        fill={item.fill || '#ffffff'}
        {...shadowProps}
      />
    )
  }

  if (item.frameType === 'circle') {
    return (
      <Circle
        x={item.w / 2}
        y={item.h / 2}
        radius={Math.min(item.w, item.h) / 2}
        fill={item.fill || '#ffffff'}
        {...shadowProps}
      />
    )
  }

  if (item.frameType === 'phone' || item.frameType === 'tablet') {
    return <Rect width={item.w} height={item.h} cornerRadius={item.cornerRadius || 20} fill={item.fill || '#1a1a1a'} {...shadowProps} />
  }

  if (item.frameType === 'desktop') {
    return (
      <>
        <Rect width={item.w} height={item.h - (item.standHeight || 40)} cornerRadius={item.cornerRadius || 4} fill={item.fill || '#1a1a1a'} {...shadowProps} />
        <Rect x={item.w / 2 - 40} y={item.h - (item.standHeight || 40)} width={80} height={item.standHeight || 40} fill={item.fill || '#1a1a1a'} listening={false} />
      </>
    )
  }

  return (
    <Rect
      width={item.w}
      height={item.h}
      cornerRadius={item.frameType === 'browser' ? item.cornerRadius || 8 : item.frameType === 'rect' ? item.cornerRadius || 0 : item.frameType === 'blob' || item.frameType === 'wave' || item.frameType === 'liquid' ? item.w / 4 : 0}
      fill={item.fill || (item.frameType.startsWith('film') || item.frameType === 'cinema' ? '#111111' : '#ffffff')}
      {...shadowProps}
    />
  )
}

const renderFrameDecorations = (item, shadowProps, isDropTarget, isEditing, frameSlot) => (
  <>
    {item.frameType === 'circle' && (
      <Circle x={item.w / 2} y={item.h / 2} radius={Math.min(item.w, item.h) / 2} fill="transparent" stroke={item.stroke || '#e5e5e5'} strokeWidth={item.strokeWidth || 2} listening={false} />
    )}
    {item.frameType !== 'circle' && !item.frameType.startsWith('film') && item.frameType !== 'cinema' && (
      <Rect
        width={item.frameType === 'desktop' ? item.w : item.w}
        height={item.frameType === 'desktop' ? item.h - (item.standHeight || 40) : item.h}
        cornerRadius={item.frameType === 'browser' ? item.cornerRadius || 8 : item.frameType === 'phone' || item.frameType === 'tablet' ? item.cornerRadius || 20 : item.frameType === 'rect' ? item.cornerRadius || 0 : item.frameType === 'blob' || item.frameType === 'wave' || item.frameType === 'liquid' ? item.w / 4 : 0}
        fill="transparent"
        stroke={item.stroke || (item.frameType === 'phone' || item.frameType === 'tablet' || item.frameType === 'desktop' ? '#0a0a0a' : '#e5e5e5')}
        strokeWidth={item.strokeWidth || (item.frameType === 'phone' ? 8 : item.frameType === 'tablet' ? 12 : item.frameType === 'desktop' ? 16 : 2)}
        listening={false}
      />
    )}
    {item.frameType === 'arch' && (
      <Rect y={0} width={item.w} height={item.archRadius || item.w / 2} cornerRadius={[item.archRadius || item.w / 2, item.archRadius || item.w / 2, 0, 0]} fill="transparent" stroke={item.stroke || '#e5e5e5'} strokeWidth={item.strokeWidth || 2} listening={false} />
    )}
    {item.frameType === 'polaroid-tape' && (
      <Rect x={item.w / 2 - 30} y={-5} width={60} height={15} fill={item.tapeColor || '#f5f1e8'} opacity={0.72} listening={false} />
    )}
    {item.frameType.startsWith('film') && (
      <>
        <Rect width={item.w} height={item.h} fill="transparent" stroke={item.stroke || '#1a1a1a'} strokeWidth={item.strokeWidth || 2} {...shadowProps} listening={false} />
        {Array.from({ length: item.sprocketHoles || 8 }).map((_, index) => {
          const isVertical = item.frameType === 'film-vertical'
          const spacing = isVertical ? item.h / ((item.sprocketHoles || 8) + 1) : item.w / ((item.sprocketHoles || 8) + 1)
          return <Rect key={index} x={isVertical ? 2 : spacing * (index + 1) - 3} y={isVertical ? spacing * (index + 1) - 3 : 2} width={6} height={6} cornerRadius={1} fill="#0f0f0f" listening={false} />
        })}
      </>
    )}
    {item.frameType === 'cinema' && (
      <>
        <Rect y={0} width={item.w} height={item.topBarHeight || 30} fill="#000000" listening={false} />
        <Rect y={item.h - (item.bottomBarHeight || 30)} width={item.w} height={item.bottomBarHeight || 30} fill="#000000" listening={false} />
      </>
    )}
    {item.frameType === 'phone' && (
      <Rect x={item.w / 2 - (item.notchWidth || 80) / 2} y={item.strokeWidth || 8} width={item.notchWidth || 80} height={item.notchHeight || 20} cornerRadius={10} fill={item.fill || '#1a1a1a'} listening={false} />
    )}
    {item.frameType === 'browser' && (
      <>
        <Rect width={item.w} height={item.headerHeight || 32} cornerRadius={[item.cornerRadius || 8, item.cornerRadius || 8, 0, 0]} fill={item.headerColor || '#f5f5f5'} listening={false} />
        <Circle x={16} y={(item.headerHeight || 32) / 2} radius={4} fill="#ff5f56" listening={false} />
        <Circle x={32} y={(item.headerHeight || 32) / 2} radius={4} fill="#ffbd2e" listening={false} />
        <Circle x={48} y={(item.headerHeight || 32) / 2} radius={4} fill="#27c93f" listening={false} />
      </>
    )}
    {item.frameType === 'desktop' && (
      <Rect x={item.w / 2 - 40} y={item.h - (item.standHeight || 40)} width={80} height={item.standHeight || 40} fill={item.fill || '#1a1a1a'} listening={false} />
    )}
    {/* Editing mode indicator - blue dashed border around slot */}
    {isEditing && frameSlot && (
      <Rect
        x={frameSlot.x}
        y={frameSlot.y}
        width={frameSlot.width}
        height={frameSlot.height}
        cornerRadius={frameSlot.cornerRadius || 0}
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[6, 4]}
        listening={false}
      />
    )}
    {isDropTarget && frameSlot && (
      <Rect
        x={frameSlot.x - 3}
        y={frameSlot.y - 3}
        width={frameSlot.width + 6}
        height={frameSlot.height + 6}
        cornerRadius={(frameSlot.cornerRadius || 0) + 3}
        stroke="#a970ff"
        strokeWidth={3}
        shadowColor="#a970ff"
        shadowBlur={18}
        shadowOpacity={0.55}
        listening={false}
      />
    )}
  </>
)

// Canva-style Frame Slot System: outer frame, dedicated image slot, clipped content, overlay decorations.
export default function FrameWithImage({
  item,
  isSelected,
  commonProps,
  isDropTarget = false,
  dropSlotIndex = null,
  isEditing = false,
  initialEditSlot = 0,      // ← TAMBAH INI
  onImageDragEnd,
  onImageScaleChange,
  onImageDelete,
  onSlotDblClick,
}) {
  const groupRef = useRef(null)
  const innerTransformerRef = useRef(null)
 
  const { activeEditSlot, activeEditSlotRef, updateActiveEditSlot } = useFrameEditing({
    isEditing,
    initialEditSlot,
  })
  
  const imageRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
 
  const slots = getResolvedFrameSlots(item)
  const isGrid = isGridFrame(item.frameType)
 
  const srcArray = isGrid
    ? slots.map((_, i) => item.frameImages?.[i]?.src || null)
    : [item.frameImageSrc || null]
 
  const loadedImages = useCanvasImages(srcArray)
 
  const shadowProps = isDropTarget
    ? { shadowColor: '#b88cff', shadowBlur: 30, shadowOpacity: 0.36, shadowOffsetY: 8 }
    : getShadowProps(item)
 
  useFrameTransform({
    isEditing,
    activeEditSlot: isGrid ? activeEditSlot : 0,
    imageRefs,
    innerTransformerRef,
    loadedImages,
    srcArray,
  })
 
  const handleGroupRef = useCallback((node) => {
    groupRef.current = node
    if (!node) return
    node.getSelfRect = () => ({ x: 0, y: 0, width: item.w, height: item.h })
  }, [item.w, item.h])
 
  useEffect(() => {
    const node = groupRef.current
    if (!node) return
    node.getSelfRect = () => ({ x: 0, y: 0, width: item.w, height: item.h })
    node.getLayer()?.batchDraw()
  }, [item.w, item.h])
 
  useEffect(() => {
    const node = groupRef.current
    if (!node) return
    node.getSelfRect = () => ({ x: 0, y: 0, width: item.w, height: item.h })
    node.getClientRect = (config) => {
      if (config?.skipTransform) return { x: 0, y: 0, width: item.w, height: item.h }
      const transform = node.getAbsoluteTransform().copy()
      const corners = [
        { x: 0, y: 0 }, { x: item.w, y: 0 },
        { x: item.w, y: item.h }, { x: 0, y: item.h },
      ].map(p => transform.point(p))
      const xs = corners.map(p => p.x)
      const ys = corners.map(p => p.y)
      return {
        x: Math.min(...xs), y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      }
    }
  }, [item.w, item.h])
 
  const singleSlot = slots[0]
  const singleImage = srcArray[0] ? loadedImages[0] || null : null
  const singleFit = singleImage ? calculateCoverFit({
    imageWidth: singleImage.width,
    imageHeight: singleImage.height,
    slot: singleSlot,
    fit: item.frameImageFit || 'cover',
    crop: item.frameImagePosition,
    zoom: item.frameImageScale || 1,
  }) : null
  const singleBounds = singleImage ? getFrameImageCropBounds({
    imageWidth: singleImage.width,
    imageHeight: singleImage.height,
    slot: singleSlot,
    fit: item.frameImageFit || 'cover',
    zoom: item.frameImageScale || 1,
  }) : null
  const singleCenterX = singleFit ? singleSlot.x + (singleSlot.width - singleFit.width) / 2 : 0
  const singleCenterY = singleFit ? singleSlot.y + (singleSlot.height - singleFit.height) / 2 : 0
 
  // Ref untuk zoom single frame (sama seperti grid — hindari stale closure)
  const singleZoomRef = useRef(item.frameImageScale || null)
  useEffect(() => {
    singleZoomRef.current = item.frameImageScale || null
  }, [item.frameImageScale])

  const getSlotIndexFromPointer = useCallback((event) => {
    const node = groupRef.current
    const stage = event.target.getStage()
    const pointer = stage?.getPointerPosition()
    if (!node || !pointer) return null

    const localPoint = node.getAbsoluteTransform().copy().invert().point(pointer)
    const hitSlot = slots.find((slot) => (
      localPoint.x >= slot.x &&
      localPoint.x <= slot.x + slot.width &&
      localPoint.y >= slot.y &&
      localPoint.y <= slot.y + slot.height
    ))

    return hitSlot?.slotIndex ?? null
  }, [slots])

  const activateGridSlotFromEvent = useCallback((event, fallbackSlotIndex) => {
    event.cancelBubble = true
    const slotIdx = getSlotIndexFromPointer(event) ?? fallbackSlotIndex
    updateActiveEditSlot(slotIdx)
    onSlotDblClick?.(slotIdx)
  }, [getSlotIndexFromPointer, onSlotDblClick, updateActiveEditSlot])

  useFrameKeyboard({
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
  })
 
  return (
    <Group ref={handleGroupRef} {...commonProps}>
      {renderFrameBackground(item, shadowProps)}
 
      {isGrid ? (
        slots.map((slot) => {
          const slotIdx = slot.slotIndex
          const slotImage = srcArray[slotIdx] ? loadedImages[slotIdx] || null : null
          const isActiveEditSlot = isEditing && activeEditSlot === slotIdx
          const isSlotDropTarget = isDropTarget && (dropSlotIndex === slotIdx || dropSlotIndex === null)
 
          return (
            <Group
              key={slotIdx}
              clipFunc={applyFrameSlotClip(slot)}
              listening={true}
            >
              <Rect
                x={slot.x}
                y={slot.y}
                width={slot.width}
                height={slot.height}
                fill="rgba(0,0,0,0)"
                listening={true}
                onMouseEnter={(e) => {
                  if (!isEditing && slotImage) {
                    e.target.getStage().container().style.cursor = 'pointer'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isEditing) {
                    e.target.getStage().container().style.cursor = 'default'
                  }
                }}
                onClick={(e) => {
                  if (isEditing) {
                    e.cancelBubble = true
                    updateActiveEditSlot(slotIdx)
                  }
                }}
                onTap={(e) => {
                  if (isEditing) {
                    e.cancelBubble = true
                    updateActiveEditSlot(slotIdx)
                  }
                }}
                onDblClick={(e) => activateGridSlotFromEvent(e, slotIdx)}
                onDblTap={(e) => activateGridSlotFromEvent(e, slotIdx)}
              />
              {slotImage
                ? <GridSlotImage
                    imageRef={imageRefs[slotIdx]}
                    image={slotImage}
                    slot={slot}
                    item={item}
                    slotIndex={slotIdx}
                    isEditing={isActiveEditSlot}
                    onImageDragEnd={onImageDragEnd}
                    onImageScaleChange={onImageScaleChange}
                  />
                : renderFramePlaceholder(slot, isSlotDropTarget)
              }
            </Group>
          )
        })
      ) : (
        <Group clipFunc={applyFrameSlotClip(singleSlot)} listening={isEditing}>
          {singleImage && singleFit ? (
            <KonvaImage
              ref={imageRefs[0]}
              image={singleImage}
              x={singleFit.x}
              y={singleFit.y}
              width={singleFit.width}
              height={singleFit.height}
              draggable={isEditing}
              listening={isEditing}
              onDragStart={(e) => { e.cancelBubble = true }}
              onDragMove={(e) => {
                if (!singleBounds || !singleFit) return
                const cropX = e.target.x() - singleCenterX
                const cropY = e.target.y() - singleCenterY
                e.target.x(singleCenterX + Math.min(singleBounds.maxX, Math.max(singleBounds.minX, cropX)))
                e.target.y(singleCenterY + Math.min(singleBounds.maxY, Math.max(singleBounds.minY, cropY)))
              }}
              onDragEnd={(e) => {
                if (!onImageDragEnd || !singleBounds || !singleFit) return
                e.cancelBubble = true
                const cropX = Math.min(singleBounds.maxX, Math.max(singleBounds.minX, e.target.x() - singleCenterX))
                const cropY = Math.min(singleBounds.maxY, Math.max(singleBounds.minY, e.target.y() - singleCenterY))
                e.target.x(singleFit.x)
                e.target.y(singleFit.y)
                e.target.getLayer()?.batchDraw()
                onImageDragEnd(0, { x: cropX, y: cropY })
              }}
              onTransform={(e) => {
                const node = e.target
                const sx = Math.abs(node.scaleX())
                const sy = Math.abs(node.scaleY())
                node.scaleX(1)
                node.scaleY(1)
 
                if (!singleImage) return
                if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return
 
                const avgScale = (sx + sy) / 2
                const minZoom = getMinFrameImageZoom({
                  imageWidth: singleImage.width,
                  imageHeight: singleImage.height,
                  slot: singleSlot,
                  fit: item.frameImageFit || 'cover',
                })
                const prevZoom = singleZoomRef.current || minZoom
                const newZoom = Math.max(minZoom, prevZoom * avgScale)
                singleZoomRef.current = newZoom
 
                const newFit = calculateCoverFit({
                  imageWidth: singleImage.width,
                  imageHeight: singleImage.height,
                  slot: singleSlot,
                  fit: item.frameImageFit || 'cover',
                  crop: item.frameImagePosition,
                  zoom: newZoom,
                })
                if (newFit) {
                  node.x(newFit.x)
                  node.y(newFit.y)
                  node.width(newFit.width)
                  node.height(newFit.height)
                  node.getLayer()?.batchDraw()
                }
                // TIDAK panggil onImageScaleChange di sini
              }}
              onTransformEnd={(e) => {
                const node = e.target
                node.scaleX(1)
                node.scaleY(1)
 
                if (!singleImage || !onImageScaleChange) return
 
                const minZoom = getMinFrameImageZoom({
                  imageWidth: singleImage.width,
                  imageHeight: singleImage.height,
                  slot: singleSlot,
                  fit: item.frameImageFit || 'cover',
                })
                const finalZoom = Math.max(minZoom, singleZoomRef.current || minZoom)
 
                const newBounds = getFrameImageCropBounds({
                  imageWidth: singleImage.width,
                  imageHeight: singleImage.height,
                  slot: singleSlot,
                  fit: item.frameImageFit || 'cover',
                  zoom: finalZoom,
                })
 
                const clampedPos = {
                  x: Math.min(newBounds.maxX, Math.max(newBounds.minX, item.frameImagePosition?.x || 0)),
                  y: Math.min(newBounds.maxY, Math.max(newBounds.minY, item.frameImagePosition?.y || 0)),
                }
 
                const newFit = calculateCoverFit({
                  imageWidth: singleImage.width,
                  imageHeight: singleImage.height,
                  slot: singleSlot,
                  fit: item.frameImageFit || 'cover',
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
 
                onImageScaleChange({ zoom: finalZoom, position: clampedPos })
              }}
              onMouseEnter={(e) => { if (isEditing) e.target.getStage().container().style.cursor = 'grab' }}
              onMouseLeave={(e) => { if (isEditing) e.target.getStage().container().style.cursor = 'default' }}
              onMouseDown={(e) => {
                if (isEditing) {
                  e.target.getStage().container().style.cursor = 'grabbing'
                  e.cancelBubble = true
                }
              }}
              onMouseUp={(e) => { if (isEditing) e.target.getStage().container().style.cursor = 'grab' }}
            />
          ) : !singleImage && renderFramePlaceholder(singleSlot, isDropTarget)}
        </Group>
      )}
 
      {renderFrameDecorations(item, shadowProps, isDropTarget, isEditing, isGrid ? null : singleSlot)}
 
      {isEditing && isGrid && slots.map((slot) => (
        <Rect
          key={`edit-indicator-${slot.slotIndex}`}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          cornerRadius={slot.cornerRadius || 0}
          stroke={activeEditSlot === slot.slotIndex ? '#3b82f6' : 'rgba(59,130,246,0.35)'}
          strokeWidth={activeEditSlot === slot.slotIndex ? 2.5 : 1.5}
          dash={activeEditSlot === slot.slotIndex ? [6, 4] : [4, 5]}
          listening={false}
        />
      ))}
 
      <Transformer
        ref={innerTransformerRef}
        rotateEnabled={false}
        keepRatio={true}
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        borderStroke="#3b82f6"
        borderDash={[5, 3]}
        anchorFill="#ffffff"
        anchorStroke="#3b82f6"
        anchorSize={10}
        anchorCornerRadius={3}
        boundBoxFunc={(oldBox, newBox) => {
          const slotIdx = isGrid ? activeEditSlot : 0
          const slot = slots[slotIdx] || singleSlot
          const imageNode = imageRefs[slotIdx]?.current
          if (!slot) return oldBox

          if (!imageNode) {
            if (newBox.width < slot.width || newBox.height < slot.height) return oldBox
            return newBox
          }

          const currentVisualWidth = imageNode.width() * Math.abs(imageNode.scaleX() || 1)
          const currentVisualHeight = imageNode.height() * Math.abs(imageNode.scaleY() || 1)
          const proposedScaleX = oldBox.width ? Math.abs(newBox.width / oldBox.width) : 1
          const proposedScaleY = oldBox.height ? Math.abs(newBox.height / oldBox.height) : 1
          const proposedVisualWidth = currentVisualWidth * proposedScaleX
          const proposedVisualHeight = currentVisualHeight * proposedScaleY

          if (proposedVisualWidth < slot.width - 0.01 || proposedVisualHeight < slot.height - 0.01) {
            const minScale = Math.max(
              slot.width / currentVisualWidth,
              slot.height / currentVisualHeight,
            )
            return {
              ...newBox,
              width: oldBox.width * minScale,
              height: oldBox.height * minScale,
            }
          }

          return newBox
        }}
      />
    </Group>
  )
}
 
