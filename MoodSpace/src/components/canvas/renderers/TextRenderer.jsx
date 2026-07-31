import CanvasTextNode from '../CanvasTextNode'

export default function TextRenderer({
  item,
  commonProps,
  isTextEditing,
  onTextEdit,
  onChange,
  getActiveTransformAnchor,
  fontInjectVersion,
  selectedId,
  selectedIds,
  onBroadcastRef,
  onToolbarRepositionRef,
}) {
  return (
    <CanvasTextNode
      item={item}
      commonProps={commonProps}
      isTextEditing={isTextEditing}
      onTextEdit={onTextEdit}
      onChange={onChange}
      getActiveTransformAnchor={getActiveTransformAnchor}
      fontInjectVersion={fontInjectVersion}
      selectedId={selectedId}
      selectedIds={selectedIds}
      onBroadcastRef={onBroadcastRef}
      onToolbarRepositionRef={onToolbarRepositionRef}
    />
  )
}
