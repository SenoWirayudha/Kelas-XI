import CanvasConnector from '../CanvasConnector'

export default function ConnectorRenderer({ item, items, selectedId, onSelect }) {
  return (
    <CanvasConnector
      item={item}
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  )
}
