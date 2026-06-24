import CanvasImage from '../CanvasImage'

export default function ImageRenderer({
  item,
  selectedId,
  selectedIds,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCursor,
  onItemHover,
  disableDrag,
  canvasBounds,
  onCropStart,
  isCropTarget,
  getActiveTransformAnchor,
}) {
  return (
    <CanvasImage
      item={item}
      onSelect={onSelect}
      onChange={onChange}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      isSelected={selectedIds?.includes(item.id) || selectedId === item.id}
      onCursor={onCursor}
      onItemHover={onItemHover}
      disableDrag={disableDrag}
      canvasBounds={canvasBounds}
      onCropStart={onCropStart}
      isCropTarget={isCropTarget}
      getActiveTransformAnchor={getActiveTransformAnchor}
    />
  )
}
