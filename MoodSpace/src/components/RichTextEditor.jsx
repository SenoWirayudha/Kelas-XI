/**
 * RichTextEditor.jsx
 * contenteditable-based rich text editor for canvas text items.
 * Supports bold, italic, underline, font family, color, and list (numbered/bullet).
 * List type is per-run (run.listType) — each line carries its own list type.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { runsToHtml, htmlToRuns, getRuns, runsToText, addListPrefix, stripListPrefix, normalizeRuns } from '../utils/textRuns'

// ── Caret helpers ──────────────────────────────────────────
function getCaretCharOffset(el) {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return el.textContent.length
  const range = sel.getRangeAt(0)
  const pre = document.createRange()
  pre.selectNodeContents(el)
  pre.setEnd(range.startContainer, range.startOffset)
  return pre.toString().length
}

function setCaretCharOffset(el, offset) {
  const sel = window.getSelection()
  if (!sel) return
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
  let pos = 0; let node
  while ((node = walker.nextNode())) {
    const n = node.textContent.length
    if (pos + n >= offset) {
      const r = document.createRange()
      r.setStart(node, Math.min(n, Math.max(0, offset - pos)))
      r.collapse(true)
      sel.removeAllRanges(); sel.addRange(r); el.focus(); return
    }
    pos += n
  }
  const r = document.createRange()
  r.selectNodeContents(el); r.collapse(false)
  sel.removeAllRanges(); sel.addRange(r); el.focus()
}

// ── Run-level helpers ──────────────────────────────────────
function findSplitPoint(runs, charOffset) {
  let acc = 0
  for (let ri = 0; ri < runs.length; ri++) {
    const len = (runs[ri].text || '').length
    if (acc + len >= charOffset) return { runIdx: ri, offset: charOffset - acc }
    acc += len
  }
  const last = runs.length - 1
  return { runIdx: last, offset: (runs[last]?.text || '').length }
}

function getLineStarts(runs) {
  const starts = [{ runIdx: 0, offset: 0 }]
  for (let ri = 0; ri < runs.length; ri++) {
    const text = runs[ri].text || ''
    for (let ci = 0; ci < text.length; ci++) {
      if (text[ci] === '\n') {
        if (ci + 1 < text.length) {
          starts.push({ runIdx: ri, offset: ci + 1 })
        } else if (ri + 1 < runs.length) {
          starts.push({ runIdx: ri + 1, offset: 0 })
        }
      }
    }
  }
  return starts
}

/**
 * Map display (with prefix) text offset → clean (without prefix) text offset + lineIdx.
 * Works by iterating over clean lines and accounting for prefix length per line.
 */
function displayToCleanOff(cleanLines, displayOff, prefixLengths) {
  let dPos = 0, cPos = 0
  for (let i = 0; i < cleanLines.length; i++) {
    const pLen = prefixLengths[i] || 0
    const dLen = pLen + cleanLines[i].length
    if (displayOff <= dPos + dLen) {
      return { cleanOff: cPos + Math.max(0, displayOff - dPos - pLen), lineIdx: i, lineStart: cPos }
    }
    dPos += dLen + 1
    cPos += cleanLines[i].length + 1
  }
  return { cleanOff: cPos, lineIdx: cleanLines.length - 1, lineStart: cPos }
}

// ── Component ──────────────────────────────────────────────
const RichTextEditor = forwardRef(({ item, onCommit, onCancel, style }, ref) => {
  const editorRef = useRef(null)
  const commitTimerRef = useRef(null)
  const committedRef = useRef(false)

  useImperativeHandle(ref, () => ({
    formatBold() { exec('bold') },
    formatItalic() { exec('italic') },
    formatUnderline() { exec('underline') },
    formatFont(fontFamily) {
      const el = editorRef.current
      if (!el) return
      el.focus()
      const sel = window.getSelection()
      if (!sel || !sel.toString().length) sel?.selectAllChildren(el)
      document.execCommand('styleWithCSS', true)
      document.execCommand('fontName', false, fontFamily)
      el.focus()
    },
    formatColor(color) {
      const el = editorRef.current
      if (!el) return
      el.focus()
      const sel = window.getSelection()
      if (!sel || !sel.toString().length) sel?.selectAllChildren(el)
      document.execCommand('styleWithCSS', true)
      document.execCommand('foreColor', false, color)
      el.focus()
    },
    hasSelection() { return window.getSelection()?.toString()?.length > 0 },
    getRuns() { return htmlToRuns(editorRef.current?.innerHTML || '') },
    setHtml(html) { if (editorRef.current) editorRef.current.innerHTML = html },
    focus() { editorRef.current?.focus() },
    getLineListType() {
      const el = editorRef.current
      if (!el) return null
      const displayOff = getCaretCharOffset(el)
      const prefixedRuns = htmlToRuns(el.innerHTML)
      const cleanRuns = stripListPrefix(prefixedRuns)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')
      const prefixLengths = cLines.map((line, i) => {
        // Find the listType for this line from cleanRuns
        for (const run of cleanRuns) {
          if (run.listType) {
            const pfx = run.listType === 'numbered' ? `${i + 1}. ` : '• '
            return pfx.length
          }
        }
        return 0
      })
      const { lineIdx } = displayToCleanOff(cLines, displayOff, prefixLengths)
      // Find the listType of the run that has content on this line
      let lc = 0
      for (const run of cleanRuns) {
        const text = run.text || ''
        const lineCount = (text.match(/\n/g) || []).length + 1
        if (lc + lineCount > lineIdx || (lc === lineIdx && lineIdx === 0)) {
          return run.listType || null
        }
        lc += lineCount
      }
      return null
    },
    toggleListType(type) {
      const el = editorRef.current
      if (!el) return
      committedRef.current = false

      // Read current content, strip prefixes to get clean runs
      const prefixedRuns = htmlToRuns(el.innerHTML)
      const cleanRuns = stripListPrefix(prefixedRuns)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')

      // Find the current line
      const displayOff = getCaretCharOffset(el)
      const prefixLengths = cLines.map((line, i) => {
        for (const run of cleanRuns) {
          if (run.listType) {
            const pfx = run.listType === 'numbered' ? `${i + 1}. ` : '• '
            return pfx.length
          }
        }
        return 0
      })
      const { lineIdx, cleanOff } = displayToCleanOff(cLines, displayOff, prefixLengths)

      // Check if the current line already has this listType
      const currentListType = (() => {
        let lc = 0
        for (const run of cleanRuns) {
          const text = run.text || ''
          const lineCount = (text.match(/\n/g) || []).length + 1
          if (lc + lineCount > lineIdx || (lc === lineIdx && lineIdx === 0)) {
            return run.listType || null
          }
          lc += lineCount
        }
        return null
      })()

      // Toggle: if same type → null, else set to type
      const newType = currentListType === type ? null : type

      // Rebuild runs with the new listType for the target line
      let lc = 0
      const newRuns = []
      for (const run of cleanRuns) {
        const text = run.text || ''
        const parts = text.split('\n')
        for (let pi = 0; pi < parts.length; pi++) {
          const isTargetLine = lc === lineIdx
          const lt = isTargetLine ? newType : (run.listType || null)
          if (parts[pi]) {
            newRuns.push({ ...run, text: parts[pi], listType: lt })
          }
          if (pi < parts.length - 1) {
            newRuns.push({ text: '\n', listType: lt, bold: false, italic: false, underline: false })
          }
          lc++
        }
      }

      // Bug 1 fix: runs may be empty (e.g., applying to blank new text item)
      if (newRuns.length === 0) {
        newRuns.push({ text: '', listType: newType, bold: false, italic: false, underline: false })
      }

      const normalized = normalizeRuns(newRuns)
      const displayRuns = addListPrefix(normalized)
      el.innerHTML = runsToHtml(displayRuns, item?.fontFamily, item?.fill)

      // Restore caret after the prefix on this line, or at line start if no list
      requestAnimationFrame(() => {
        const displayText = el.textContent || ''
        const dLines = displayText.split('\n')
        let target = 0
        for (let i = 0; i < lineIdx && i < dLines.length; i++) {
          target += dLines[i].length + 1
        }
        // Move past the prefix if this line now has listType
        if (newType && dLines[lineIdx]) {
          const pfxLen = newType === 'numbered'
            ? `${lineIdx + 1}. `.length
            : '• '.length
          target += pfxLen
        }
        setCaretCharOffset(el, Math.min(target, displayText.length))
      })
    },
  }))

  function exec(cmd) {
    const el = editorRef.current
    if (!el) return
    const sel = window.getSelection()
    const hasSelection = sel && sel.toString().length > 0 && el.contains(sel.anchorNode)
    el.focus()
    if (!hasSelection) {
      const newSel = window.getSelection()
      if (newSel && !newSel.toString().length) newSel?.selectAllChildren(el)
    }
    document.execCommand(cmd, false, null)
    el.focus()
  }

  // ── Re-render on item or runs change ──
  useEffect(() => {
    const el = editorRef.current
    if (el && item) {
      const raw = getRuns(item)
      const display = addListPrefix(raw)
      const htmlContent = runsToHtml(display, item.fontFamily, item.fill)
      el.innerHTML = htmlContent
    }
    committedRef.current = false
  }, [item?.id, item?.runs])

  // ── Commit (strip prefixes) ──
  const commit = useCallback(() => {
    if (committedRef.current) return
    committedRef.current = true
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    const html = editorRef.current?.innerHTML || ''
    const prefixed = htmlToRuns(html)
    const clean = stripListPrefix(prefixed)
    onCommit(clean)
  }, [onCommit])

  // ── Handle Enter ──
  const handleEnter = () => {
    const el = editorRef.current
    if (!el) return
    committedRef.current = false

    const displayOff = getCaretCharOffset(el)
    const prefixedRuns = htmlToRuns(el.innerHTML)
    const cleanRuns = stripListPrefix(prefixedRuns)
    const cleanText = runsToText(cleanRuns)
    const cLines = cleanText.split('\n')

    // Compute display prefix lengths for each clean line
    const prefixLengths = cLines.map((line, i) => {
      for (const run of cleanRuns) {
        if (run.listType) {
          const pfx = run.listType === 'numbered' ? `${i + 1}. ` : '• '
          return pfx.length
        }
      }
      return 0
    })

    const { cleanOff, lineIdx, lineStart } = displayToCleanOff(cLines, displayOff, prefixLengths)

    // Check if the current line is a list line
    let currentListType = null
    let lc = 0
    for (const run of cleanRuns) {
      const text = run.text || ''
      const lineCount = (text.match(/\n/g) || []).length + 1
      if (lc + lineCount > lineIdx || (lc === lineIdx && lineIdx === 0)) {
        currentListType = run.listType || null
        break
      }
      lc += lineCount
    }

    const isEmptyLine = cLines[lineIdx] === ''

    // Split the runs at cleanOff
    const { runIdx: splitRi, offset: splitOff } = findSplitPoint(cleanRuns, cleanOff)
    const run = cleanRuns[splitRi]
    const before = (run.text || '').slice(0, splitOff)
    const after = (run.text || '').slice(splitOff)

    const newRuns = []
    for (let i = 0; i < splitRi; i++) newRuns.push({ ...cleanRuns[i] })
    if (before) {
      // The line before the \n — keep its listType (or set to null if it was the empty line)
      const lt = isEmptyLine && lineIdx > 0 ? null : (cleanRuns[splitRi]?.listType || null)
      newRuns.push({ ...cleanRuns[splitRi], text: before, listType: lt })
    }
    // Insert \n — the new line after \n inherits the original listType
    newRuns.push({ text: '\n', listType: isEmptyLine ? currentListType : (cleanRuns[splitRi]?.listType || null), bold: false, italic: false, underline: false })
    if (after) {
      const lt = cleanRuns[splitRi]?.listType || null
      newRuns.push({ ...cleanRuns[splitRi], text: after, listType: lt })
    }
    for (let i = splitRi + 1; i < cleanRuns.length; i++) newRuns.push({ ...cleanRuns[i] })

    const normalized = normalizeRuns(newRuns)
    const displayRuns = addListPrefix(normalized)
    el.innerHTML = runsToHtml(displayRuns, item?.fontFamily, item?.fill)

    // Place caret on the new line, after the prefix
    requestAnimationFrame(() => {
      const displayText = el.textContent || ''
      const dLines = displayText.split('\n')
      let target = 0
      for (let i = 0; i <= lineIdx && i < dLines.length; i++) {
        target += dLines[i].length + 1
      }
      // The new line is at lineIdx + 1 — skip past its prefix
      const newLineIdx = lineIdx + 1
      if (dLines[newLineIdx]) {
        const numMatch = dLines[newLineIdx].match(/^\d+\. /)
        if (numMatch) target += numMatch[0].length
        else if (dLines[newLineIdx].startsWith('• ')) target += 2
      }
      setCaretCharOffset(el, Math.min(target, displayText.length))
    })
  }

  // ── Key handlers ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnter()
    }
    if (e.key === 'Backspace') {
      const el = editorRef.current
      if (!el) return
      const displayOff = getCaretCharOffset(el)
      const prefixedRuns = htmlToRuns(el.innerHTML)
      const cleanRuns = stripListPrefix(prefixedRuns)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')

      const prefixLengths = cLines.map((line, i) => {
        for (const run of cleanRuns) {
          if (run.listType) {
            const pfx = run.listType === 'numbered' ? `${i + 1}. ` : '• '
            return pfx.length
          }
        }
        return 0
      })

      const { cleanOff, lineIdx, lineStart } = displayToCleanOff(cLines, displayOff, prefixLengths)

      const atContentStart = cleanOff === lineStart

      // Check if this line has a listType
      let hasList = false
      let lc = 0
      for (const run of cleanRuns) {
        const text = run.text || ''
        const lineCount = (text.match(/\n/g) || []).length + 1
        if (lc + lineCount > lineIdx || (lc === lineIdx && lineIdx === 0)) {
          if (run.listType) hasList = true
          break
        }
        lc += lineCount
      }

      if (atContentStart && hasList) {
        // Remove listType from this line → set run.listType = null, re-number remaining
        e.preventDefault()
        let lc = 0
        const newRuns = []
        for (const run of cleanRuns) {
          const text = run.text || ''
          const parts = text.split('\n')
          for (let pi = 0; pi < parts.length; pi++) {
            const isTarget = lc === lineIdx
            const lt = isTarget ? null : (run.listType || null)
            if (parts[pi]) {
              newRuns.push({ ...run, text: parts[pi], listType: lt })
            }
            if (pi < parts.length - 1) {
              newRuns.push({ text: '\n', listType: lt, bold: false, italic: false, underline: false })
            }
            lc++
          }
        }

        const normalized = normalizeRuns(newRuns)
        const displayRuns = addListPrefix(normalized)
        el.innerHTML = runsToHtml(displayRuns, item?.fontFamily, item?.fill)

        // Focus remains at line start (which no longer has a prefix)
        requestAnimationFrame(() => {
          setCaretCharOffset(el, Math.min(cleanOff, (el.textContent || '').length))
        })
        return
      }

      // If not at content-start with list, let default Backspace behavior run
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
      if (active && (active.closest('.workspace-style-toolbar') || active.closest('.workspace-text-editor') || active.closest('.workspace-typography-field') || active.closest('.workspace-section-card') || active.closest('.workspace-right-panel') || editorRef.current?.contains(active))) {
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
      style={{ ...style, whiteSpace: 'pre-wrap' }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
})

RichTextEditor.displayName = 'RichTextEditor'
export default RichTextEditor
