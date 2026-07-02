/**
 * RichTextEditor.jsx
 * contenteditable-based rich text editor for canvas text items.
 * Supports bold, italic, underline, font family, color, and list (numbered/bullet).
 * List type is per-run (run.listType) — each line carries its own list type.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { runsToHtml, htmlToRuns, getRuns, runsToText, normalizeRuns } from '../utils/textRuns'

// ── Caret helpers ──────────────────────────────────────────
function getCaretCharOffset(el) {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return getDisplayText(el).length
  const range = sel.getRangeAt(0)
  const pre = document.createRange()
  pre.selectNodeContents(el)
  pre.setEnd(range.startContainer, range.startOffset)
  return pre.toString().length
}

  function getContentCaretOffset(el) {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return 0
    const range = sel.getRangeAt(0)
    let pos = 0
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL, null, false)
    let node
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node === range.startContainer) {
          pos += range.startOffset
          break
        }
        pos += node.textContent.replace(/\u200B/g, '').length
      } else if (node.tagName === 'BR') {
        pos += 1
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[getContentCaretOffset]', pos)
    }
    return pos
  }

function setCaretCharOffset(el, offset) {
  const sel = window.getSelection()
  if (!sel) return
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL, null, false)
  let pos = 0; let node
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const n = node.textContent.replace(/\u200B/g, '').length
      if (pos + n >= offset) {
        const r = document.createRange()
        r.setStart(node, Math.min(node.textContent.length, offset - pos))
        r.collapse(true)
        sel.removeAllRanges(); sel.addRange(r)
        if (process.env.NODE_ENV === 'development')
          console.log('[setCaretCharOffset] placed in text node', n, 'offset', Math.min(node.textContent.length, offset - pos))
        return
      }
      pos += n
    } else if (node.tagName === 'BR') {
      if (offset < pos + 1) {
        // Caret at or before the \n → before BR (end of previous line)
        const r = document.createRange()
        r.setStartBefore(node)
        r.collapse(true)
        sel.removeAllRanges(); sel.addRange(r)
        if (process.env.NODE_ENV === 'development')
          console.log('[setCaretCharOffset] placed before BR')
        return
      }
      // Past the \n → skip BR, walker continues to next text node
      pos += 1
    }
  }
  const r = document.createRange()
  r.selectNodeContents(el)
  r.collapse(false)
  sel.removeAllRanges()
  sel.addRange(r)
  if (process.env.NODE_ENV === 'development') console.log('[setCaretCharOffset] fallback -> end of element')
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

function getDisplayText(el) {
  let text = ''
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL, null, false)
  let node
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent.replace(/\u200B/g, '')
    else if (node.tagName === 'BR') text += '\n'
  }
  return text
}

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
  const isLeftAligned = !style?.textAlign || style.textAlign === 'left'
  const historyRef = useRef([''])
  const historyPosRef = useRef(0)
  const isRestoringRef = useRef(false)

  const saveState = useCallback(() => {
    if (isRestoringRef.current) return
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    historyRef.current = historyRef.current.slice(0, historyPosRef.current + 1)
    if (historyRef.current[historyPosRef.current] !== html) {
      historyRef.current.push(html)
      historyPosRef.current = historyRef.current.length - 1
    }
  }, [])

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
    undo() {
      if (historyPosRef.current > 0) {
        isRestoringRef.current = true
        historyPosRef.current--
        const el = editorRef.current
        if (el) { el.innerHTML = historyRef.current[historyPosRef.current]; el.focus() }
        isRestoringRef.current = false
      }
    },
    redo() {
      if (historyPosRef.current < historyRef.current.length - 1) {
        isRestoringRef.current = true
        historyPosRef.current++
        const el = editorRef.current
        if (el) { el.innerHTML = historyRef.current[historyPosRef.current]; el.focus() }
        isRestoringRef.current = false
      }
    },
    getLineListType() {
      const el = editorRef.current
      if (!el) return null
      const contentOff = getContentCaretOffset(el)
      const cleanRuns = htmlToRuns(el.innerHTML)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')
      const prefixLengths = cLines.map(() => 0)
      const { lineIdx } = displayToCleanOff(cLines, contentOff, prefixLengths)
      let lc = 0
      for (const run of cleanRuns) {
        const text = run.text || ''
        if (text === '\n') continue
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

      const cleanRuns = htmlToRuns(el.innerHTML)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')

      const contentOff = getContentCaretOffset(el)
      const prefixLengths = cLines.map(() => 0)
      const { lineIdx, cleanOff } = displayToCleanOff(cLines, contentOff, prefixLengths)

      const currentListType = (() => {
        let lc = 0
        for (const run of cleanRuns) {
          const text = run.text || ''
          if (text === '\n') continue
          const lineCount = (text.match(/\n/g) || []).length + 1
          if (lc + lineCount > lineIdx || (lc === lineIdx && lineIdx === 0)) {
            return run.listType || null
          }
          lc += lineCount
        }
        return null
      })()

      const newType = currentListType === type ? null : type

      let lc = 0
      const newRuns = []
      for (const run of cleanRuns) {
        const text = run.text || ''
        if (text === '\n') {
          newRuns.push({ ...run })
          continue
        }
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

      if (newRuns.length === 0) {
        newRuns.push({ text: '', listType: newType, bold: false, italic: false, underline: false })
      }

      const normalized = normalizeRuns(newRuns)
      el.innerHTML = runsToHtml(normalized, item?.fontFamily, item?.fill)

      requestAnimationFrame(() => {
        const displayText = getDisplayText(el)
        const dLines = displayText.split('\n')
        let target = 0
        for (let i = 0; i < lineIdx && i < dLines.length; i++) {
          target += dLines[i].length + 1
        }
        el.focus()
        setCaretCharOffset(el, Math.min(target, displayText.length))
      })
    },
    formatAlign(align) {
      const el = editorRef.current
      if (!el) return
      committedRef.current = false
      const cleanRuns = htmlToRuns(el.innerHTML)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')
      const contentOff = getContentCaretOffset(el)
      const prefixLengths = cLines.map(() => 0)
      const { lineIdx } = displayToCleanOff(cLines, contentOff, prefixLengths)

      let lc = 0
      const newRuns = []
      for (const run of cleanRuns) {
        const text = run.text || ''
        if (text === '\n') {
          newRuns.push({ ...run })
          continue
        }
        const parts = text.split('\n')
          for (let pi = 0; pi < parts.length; pi++) {
            const isTargetLine = lc === lineIdx
            if (isTargetLine || parts[pi]) {
              newRuns.push({ ...run, text: parts[pi] || '', align: isTargetLine ? align : run.align })
            }
          if (pi < parts.length - 1) {
            newRuns.push({ text: '\n', bold: false, italic: false, underline: false })
          }
          lc++
        }
      }
      if (newRuns.length === 0) {
        newRuns.push({ text: '', align, bold: false, italic: false, underline: false })
      }

      const normalized = normalizeRuns(newRuns)
      el.innerHTML = runsToHtml(normalized, item?.fontFamily, item?.fill)

      requestAnimationFrame(() => {
        const displayText = getDisplayText(el)
        const dLines = displayText.split('\n')
        let target = 0
        for (let i = 0; i < lineIdx && i < dLines.length; i++) {
          target += dLines[i].length + 1
        }
        el.focus()
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

  useEffect(() => {
    const el = editorRef.current
    if (!el || !item) return
    const raw = getRuns(item)
    const htmlContent = runsToHtml(raw, item.fontFamily, item.fill)
    if (process.env.NODE_ENV === 'development') {
      console.groupCollapsed('RichTextEditor — set HTML')
      console.log('item.w:', item.w)
      console.log('item.id:', item.id)
      console.log('item.runs (raw):', JSON.parse(JSON.stringify(raw)))
      console.log('htmlContent:', htmlContent)
      console.log('el.className:', el.className)
      console.groupEnd()
    }
    console.groupCollapsed('[RichTextEditor useEffect] triggered')
    console.log('item.id:', item.id, 'raw runs:', JSON.parse(JSON.stringify(raw)))
    console.log('htmlContent:', htmlContent)
    console.groupEnd()
    el.innerHTML = htmlContent
    committedRef.current = false
  }, [item?.id, item?.runs])

  const commit = useCallback(() => {
    if (committedRef.current) return
    committedRef.current = true
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    const html = editorRef.current?.innerHTML || ''
    const clean = htmlToRuns(html)
    onCommit(clean)
  }, [onCommit])

  const handleEnter = () => {
    const el = editorRef.current
    if (!el) return
    committedRef.current = false

    const contentOff = getContentCaretOffset(el)
    const cleanRuns = htmlToRuns(el.innerHTML)
    const cleanText = runsToText(cleanRuns)
    const cLines = cleanText.split('\n')

    const { cleanOff, lineIdx, lineStart } = displayToCleanOff(cLines, contentOff, cLines.map(() => 0))

    let currentListType = null
    let lc = 0
    for (const run of cleanRuns) {
      const text = run.text || ''
      if (text === '\n') continue
      const lineCount = (text.match(/\n/g) || []).length + 1
      if (lc + lineCount > lineIdx || (lc === lineIdx && lineIdx === 0)) {
        currentListType = run.listType || null
        break
      }
      lc += lineCount
    }

    const isEmptyLine = cLines[lineIdx] === ''
    const { runIdx: splitRi, offset: splitOff } = findSplitPoint(cleanRuns, cleanOff)

    let newRuns
    if (splitRi < 0) {
      newRuns = [{ text: '\n', listType: null, bold: false, italic: false, underline: false }]
    } else {
      newRuns = []
      for (let i = 0; i < splitRi; i++) newRuns.push({ ...cleanRuns[i] })

      if (cleanRuns[splitRi]?.text === '\n') {
        const lt = cleanRuns[splitRi]?.listType || currentListType || null
        newRuns.push({ text: '\n', listType: lt, bold: false, italic: false, underline: false })
        newRuns.push({ text: '', listType: lt, bold: false, italic: false, underline: false })
        newRuns.push({ text: '\n', listType: lt, bold: false, italic: false, underline: false })
        for (let i = splitRi + 1; i < cleanRuns.length; i++) newRuns.push({ ...cleanRuns[i] })
      } else {
        const run = cleanRuns[splitRi]
        const before = (run.text || '').slice(0, splitOff)
        const after = (run.text || '').slice(splitOff)

        const lt = isEmptyLine && lineIdx > 0 ? null : (run.listType || currentListType || null)
        if (before || cleanOff === lineStart) {
          newRuns.push({ ...run, text: before, listType: lt })
        }
        newRuns.push({ text: '\n', listType: lt, bold: false, italic: false, underline: false })
        if (after) {
          newRuns.push({ ...run, text: after, listType: run.listType || null })
        } else if (splitRi + 1 >= cleanRuns.length) {
          newRuns.push({ text: '', listType: lt, bold: false, italic: false, underline: false })
        }
        for (let i = splitRi + 1; i < cleanRuns.length; i++) newRuns.push({ ...cleanRuns[i] })
      }
    }

    const normalized = normalizeRuns(newRuns)
    el.innerHTML = runsToHtml(normalized, item?.fontFamily, item?.fill)

    requestAnimationFrame(() => {
      const displayText = getDisplayText(el)
      const dLines = displayText.split('\n')
      let target = 0
      for (let i = 0; i <= lineIdx && i < dLines.length; i++) {
        target += dLines[i].length + 1
      }
      setCaretCharOffset(el, Math.min(target, displayText.length))
    })
  }

  const handleKeyDown = (e) => {
    console.log('[keydown]', e.key, 'innerHTML:', (editorRef.current && editorRef.current.innerHTML) || '(no el)')
    if (e.key === ' ' && !e.shiftKey) {
      const el = editorRef.current
      if (!el) return
      const contentOff = getContentCaretOffset(el)
      const cleanRuns = htmlToRuns(el.innerHTML)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')
      const { cleanOff, lineIdx, lineStart } = displayToCleanOff(cLines, contentOff, cLines.map(() => 0))
      const lineBefore = cLines[lineIdx].slice(0, cleanOff - lineStart)
      const numberedMatch = lineBefore.match(/^(\d+)\.$/)
      const bulletMatch = lineBefore.match(/^[-*]$/)
      if (numberedMatch || bulletMatch) {
        e.preventDefault()
        const newListType = numberedMatch ? 'numbered' : 'bullet'
        cLines[lineIdx] = cLines[lineIdx].slice(lineBefore.length)
        let lc = 0
        let onTargetLine = false
        const newRuns = []
        for (const run of cleanRuns) {
          const text = run.text || ''
          if (text === '\n') {
            newRuns.push({ ...run })
            onTargetLine = false
            continue
          }
          const parts = text.split('\n')
          for (let pi = 0; pi < parts.length; pi++) {
            if (!onTargetLine && lc === lineIdx) onTargetLine = true
            const lt = onTargetLine ? newListType : (run.listType || null)
            const newText = onTargetLine && parts[pi].startsWith(lineBefore)
              ? parts[pi].slice(lineBefore.length)
              : parts[pi]
            newRuns.push({ ...run, text: newText, listType: lt })
            if (pi < parts.length - 1) {
              newRuns.push({ text: '\n', listType: lt, bold: false, italic: false, underline: false })
              onTargetLine = false
            }
            lc++
          }
        }
        if (newRuns.length === 0) {
          newRuns.push({ text: '', listType: newListType, bold: false, italic: false, underline: false })
        }
        if (newListType && newRuns.length > 1) {
          for (let i = newRuns.length - 1; i >= 0; i--) {
            if (newRuns[i].text === '\n' && !newRuns[i].listType) {
              newRuns[i] = { ...newRuns[i], listType: newListType }
              break
            }
          }
        }
        const normalized = normalizeRuns(newRuns)
        el.innerHTML = runsToHtml(normalized, item?.fontFamily, item?.fill)
        requestAnimationFrame(() => {
          const displayText = getDisplayText(el)
          const dLines = displayText.split('\n')
          let target = 0
          for (let i = 0; i < lineIdx && i < dLines.length; i++) target += dLines[i].length + 1
          setCaretCharOffset(el, Math.min(target, displayText.length))
        })
        committedRef.current = false
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      try { handleEnter() } catch (err) { console.error('[Enter catch]', err) }
    }
    if (e.key === 'Backspace') {
      const el = editorRef.current
      if (!el) return
      const contentOff = getContentCaretOffset(el)
      const cleanRuns = htmlToRuns(el.innerHTML)
      const cleanText = runsToText(cleanRuns)
      const cLines = cleanText.split('\n')

      const prefixLengths = cLines.map(() => 0)

      const { cleanOff, lineIdx, lineStart } = displayToCleanOff(cLines, contentOff, prefixLengths)

      const atContentStart = cleanOff === lineStart

      let hasList = false
      if (cleanRuns.length === 0) {
        hasList = false
      } else {
        let lc = 0
        for (const run of cleanRuns) {
          const text = run.text || ''
          if (text === '\n') continue
          const lineCount = (text.match(/\n/g) || []).length + 1
          if (lc + lineCount > lineIdx || (lc === lineIdx && lineIdx === 0)) {
            if (run.listType) hasList = true
            break
          }
          lc += lineCount
        }
      }

      if (atContentStart && hasList) {
        e.preventDefault()
        if (cleanRuns.length === 0) {
          const newRuns = [{ text: '\n', listType: null, bold: false, italic: false, underline: false }]
          const normalized = normalizeRuns(newRuns)
          el.innerHTML = runsToHtml(normalized, item?.fontFamily, item?.fill)
          requestAnimationFrame(() => {
            setCaretCharOffset(el, Math.min(cleanOff, getDisplayText(el).length))
          })
          return
        }
        let lc = 0
        const newRuns = []
        for (const run of cleanRuns) {
          const text = run.text || ''
          if (text === '\n') {
            newRuns.push({ ...run })
            continue
          }
          const parts = text.split('\n')
          for (let pi = 0; pi < parts.length; pi++) {
            const isTarget = lc === lineIdx
            const lt = isTarget ? null : (run.listType || null)
            if (isTarget && !parts[pi] && run.listType) {
              newRuns.push({ ...run, text: '', listType: null })
            } else if (parts[pi]) {
              newRuns.push({ ...run, text: parts[pi], listType: lt })
            }
            if (pi < parts.length - 1) {
              newRuns.push({ text: '\n', listType: lt, bold: false, italic: false, underline: false })
            }
            lc++
          }
        }

        const normalized = normalizeRuns(newRuns)
        el.innerHTML = runsToHtml(normalized, item?.fontFamily, item?.fill)

        requestAnimationFrame(() => {
          setCaretCharOffset(el, Math.min(cleanOff, getDisplayText(el).length))
        })
        return
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) { ref?.current?.redo() } else { ref?.current?.undo() }
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault()
      ref?.current?.redo()
      return
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

  const handleInput = useCallback(() => {
    saveState()
  }, [saveState])

  useEffect(() => {
    const el = editorRef.current
    if (el && historyRef.current.length === 1 && historyRef.current[0] === '') {
      historyRef.current = [el.innerHTML]
      historyPosRef.current = 0
    }
  }, [])

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className="workspace-inline-text-editor"
      style={{ ...style, whiteSpace: 'pre-wrap' }}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
    />
  )
})

RichTextEditor.displayName = 'RichTextEditor'
export default RichTextEditor