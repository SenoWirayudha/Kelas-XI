import CanvasTextNode from '../CanvasTextNode'

export default function TextRenderer({
  item,
  commonProps,
  isTextEditing,
  onTextEdit,
  onChange,
  canvasBounds,
  getActiveTransformAnchor,
}) {
  return (
    <CanvasTextNode
      item={item}
      commonProps={commonProps}
      isTextEditing={isTextEditing}
      onTextEdit={onTextEdit}
      onChange={onChange}
      canvasBounds={canvasBounds}
      getActiveTransformAnchor={getActiveTransformAnchor}
    />
  )
}
