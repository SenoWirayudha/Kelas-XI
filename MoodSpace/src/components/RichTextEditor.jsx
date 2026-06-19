/**
 * RichTextEditor.jsx
 * contenteditable-based rich text editor for canvas text items.
 * Supports bold, italic, underline via document.execCommand.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { runsToHtml, htmlToRuns, getRuns } from '../utils/textRuns'

const RichTextEditor = forwardRef(({ item, onCommit, onCancel, style }, ref) => {
  const editorRef = useRef(null)
  const commitTimerRef = useRef(null)
  const committedRef = useRef(false)

  useImperativeHandle(ref, () => ({
    formatBold() { exec('bold') },
    formatItalic() { exec('italic') },
    formatUnderline() { exec('underline') },
    hasSelection() { return window.getSelection()?.toString()?.length > 0 },
    getRuns() { return htmlToRuns(editorRef.current?.innerHTML || '') },
    focus() { editorRef.current?.focus() },
  }))

  function exec(cmd) {
    const el = editorRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (!sel || !sel.toString().length) {
      sel?.selectAllChildren(el)
    }
    document.execCommand(cmd, false, null)
    el.focus()
  }

  useEffect(() => {
    const el = editorRef.current
    if (el && item) {
      const runs = getRuns(item)
      el.innerHTML = runsToHtml(runs)
    }
    committedRef.current = false
  }, [item?.id])

  const commit = useCallback(() => {
    if (committedRef.current) return
    committedRef.current = true
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    const html = editorRef.current?.innerHTML || ''
    onCommit(htmlToRuns(html))
  }, [onCommit])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      committedRef.current = true
      onCancel()
    }
  }

  const handleBlur = () => {
    if (committedRef.current) return
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    commitTimerRef.current = setTimeout(() => {
      const active = document.activeElement
      if (active && (active.closest('.workspace-style-toolbar') || active.closest('.workspace-text-editor') || active.closest('.workspace-typography-field') || active.closest('.workspace-section-card') || editorRef.current?.contains(active))) {
        committedRef.current = false
        return
      }
      commit()
    }, 150)
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className="workspace-inline-text-editor"
      style={style}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
})

RichTextEditor.displayName = 'RichTextEditor'
export default RichTextEditor
