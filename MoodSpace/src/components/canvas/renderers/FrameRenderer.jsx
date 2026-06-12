import FrameWithImage from '../frame/FrameWithImage'
import { isGridFrame } from '../../../utils/frameUtils'

export default function FrameRenderer({
  item,
  commonProps,
  selectedId,
  selectedIds,
  onChange,
  disableDrag,
  dropTargetFrameId,
  dropTargetSlotIndex,
  editingFrameId,
  editingFrameSlot,
  onFrameImageEdit,
}) {
  const isSelected = selectedIds?.includes(item.id) || selectedId === item.id
  const isEditing = editingFrameId === item.id

  return (
    <FrameWithImage
      item={item}
      isSelected={isSelected}
      commonProps={{
        ...commonProps,
        draggable: !item.locked && !disableDrag && !isEditing,
        onDblClick: (event) => {
          event.cancelBubble = true
          if (isEditing) {
            onFrameImageEdit(null)
            return
          }
          if (isGridFrame(item.frameType)) {
            return
          } else if (item.frameImageSrc) {
            onFrameImageEdit(item.id)
          }
        },
        onDblTap: (event) => {
          event.cancelBubble = true
          if (isEditing) {
            onFrameImageEdit(null)
          } else {
            if (isGridFrame(item.frameType)) return
            const hasImage = isGridFrame(item.frameType)
              ? item.frameImages?.some((img) => img?.src)
              : !!item.frameImageSrc
            if (hasImage) {
              onFrameImageEdit(item.id)
            }
          }
        },
      }}
      isDropTarget={dropTargetFrameId === item.id}
      dropSlotIndex={dropTargetSlotIndex}
      isEditing={isEditing}
      initialEditSlot={isEditing ? (editingFrameSlot ?? 0) : 0}
      onImageDragEnd={(slotIndex, position) => {
        if (isGridFrame(item.frameType)) {
          const newFrameImages = [...(item.frameImages || [])]
          if (!newFrameImages[slotIndex]) {
            newFrameImages[slotIndex] = { src: null, position: { x: 0, y: 0 }, scale: 1, fit: 'cover' }
          }
          newFrameImages[slotIndex] = { ...newFrameImages[slotIndex], position }
          onChange({ frameImages: newFrameImages })
        } else {
          onChange({ frameImagePosition: position })
        }
      }}
      onImageScaleChange={(slotIndexOrObj, scaleData) => {
        if (isGridFrame(item.frameType) && typeof slotIndexOrObj === 'number') {
          const slotIndex = slotIndexOrObj
          const { zoom, position } = scaleData
          const newFrameImages = [...(item.frameImages || [])]
          if (!newFrameImages[slotIndex]) {
            newFrameImages[slotIndex] = { src: null, position: { x: 0, y: 0 }, scale: 1, fit: 'cover' }
          }
          newFrameImages[slotIndex] = { ...newFrameImages[slotIndex], scale: zoom, position }
          onChange({ frameImages: newFrameImages })
        } else {
          const { zoom, position } = slotIndexOrObj
          onChange({ frameImageScale: zoom, frameImagePosition: position })
        }
      }}
      onImageDelete={(slotIndex) => {
        if (isGridFrame(item.frameType)) {
          const newFrameImages = [...(item.frameImages || [])]
          newFrameImages[slotIndex] = null
          onChange({ frameImages: newFrameImages })
        } else {
          onChange({
            frameImageSrc: null,
            frameImage: null,
            frameImageScale: 1,
            frameImagePosition: { x: 0, y: 0 },
            frameImageFit: 'cover',
          })
        }
        onFrameImageEdit(null)
      }}
      onSlotDblClick={(slotIdx) => {
        onFrameImageEdit(item.id, slotIdx)
      }}
    />
  )
}
