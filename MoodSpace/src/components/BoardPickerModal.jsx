import { X } from 'lucide-react'

function BoardPickerModal({ isOpen, boards = [], postTitle, onCancel, onSelect, onCreate }) {
  if (!isOpen) return null

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="mood-modal mood-modal-compact" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onCancel}>
          <X size={18} />
        </button>
        <h2>Add to Board</h2>
        <p className="mood-modal-desc">{postTitle || 'Pilih board untuk menyimpan post ini.'}</p>
        <div className="board-picker-list">
          {boards.map((board) => (
            <button type="button" key={board.id} className="board-picker-item" onClick={() => onSelect(board)}>
              <span>{board.name}</span>
              <small>{board.itemCount || 0} items</small>
            </button>
          ))}
        </div>
        <footer className="mood-modal-actions">
          <button type="button" className="mood-modal-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="mood-modal-confirm" onClick={onCreate}>New Board</button>
        </footer>
      </section>
    </div>
  )
}

export default BoardPickerModal
