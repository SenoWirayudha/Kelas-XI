/**
 * textRuns.js
 * Rich text runs — per-segment formatting for canvas text items.
 */

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function hexStr(v) {
  return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
}

/**
 * Get runs from item (backward compat for old flat format).
 */
export function getRuns(item) {
  if (item.runs && item.runs.length > 0) return item.runs
  if (!item.text && item.text !== '') return [{ text: '', bold: false, italic: false, underline: false }]
  return [{
    text: item.text || '',
    bold: item.isBold || false,
    italic: item.isItalic || false,
    underline: item.isUnderline || false,
    fontFamily: item.fontFamily || undefined,
    fontSize: item.fontSize || undefined,
    fill: item.fill || undefined,
  }]
}

/**
 * Convert runs to plain text.
 */
export function runsToText(runs) {
  return runs.map((r) => r.text).join('')
}

/**
 * Convert runs to HTML for contenteditable.
 * Uses <b>, <i>, <u> tags — simple and consistent with execCommand.
 */
export function runsToHtml(runs) {
  return runs.map((run) => {
    let t = escapeHtml(run.text)
    if (run.bold) t = `<b>${t}</b>`
    if (run.italic) t = `<i>${t}</i>`
    if (run.underline) t = `<u>${t}</u>`
    return t
  }).join('')
}

/**
 * Parse HTML from contenteditable back to runs.
 * Handles <b>, <i>, <u>, <strong>, <em> tags.
 */
export function htmlToRuns(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  const runs = []
  walkTextNodes(div, (text, tags) => {
    if (!text) return
    runs.push({
      text,
      bold: tags.has('b') || tags.has('strong'),
      italic: tags.has('i') || tags.has('em'),
      underline: tags.has('u'),
    })
  })
  return normalizeRuns(runs)
}

function walkTextNodes(node, fn, inheritedTags = new Set()) {
  if (node.nodeType === 3) {
    fn(node.textContent || '', new Set(inheritedTags))
    return
  }
  const tag = node.nodeName?.toLowerCase?.()
  const newTags = new Set(inheritedTags)
  if (['b', 'strong', 'i', 'em', 'u'].includes(tag)) newTags.add(tag)
  for (let child = node.firstChild; child; child = child.nextSibling) {
    walkTextNodes(child, fn, newTags)
  }
}

/**
 * Normalize runs — merge adjacent runs with identical formatting.
 */
export function normalizeRuns(runs) {
  if (!runs.length) return runs
  const out = [{
    text: runs[0].text || '',
    bold: !!runs[0].bold,
    italic: !!runs[0].italic,
    underline: !!runs[0].underline,
  }]
  for (let i = 1; i < runs.length; i++) {
    const prev = out[out.length - 1]
    const cur = runs[i]
    if (prev.bold === !!cur.bold && prev.italic === !!cur.italic && prev.underline === !!cur.underline) {
      prev.text += (cur.text || '')
    } else {
      out.push({
        text: cur.text || '',
        bold: !!cur.bold,
        italic: !!cur.italic,
        underline: !!cur.underline,
      })
    }
  }
  return out
}

/**
 * Apply format toggle to a range within runs.
 * Splits runs at start/end offset, toggles format on middle segment, returns new runs.
 */
export function applyFormatToRange(runs, startOffset, endOffset, changes) {
  if (startOffset === endOffset || startOffset < 0 || endOffset <= startOffset) return runs
  let pos = 0
  const result = []
  for (const run of runs) {
    const runLen = run.text.length
    const segStart = pos
    const segEnd = pos + runLen
    if (segEnd <= startOffset || segStart >= endOffset) {
      result.push({ ...run })
    } else {
      const before = run.text.slice(0, Math.max(0, startOffset - pos))
      const mid = run.text.slice(Math.max(0, startOffset - pos), Math.min(runLen, endOffset - pos))
      const after = run.text.slice(Math.min(runLen, endOffset - pos))
      if (before) result.push({ text: before, bold: run.bold, italic: run.italic, underline: run.underline })
      if (mid) result.push({ text: mid, ...Object.keys(changes).reduce((o, k) => { o[k] = changes[k]; return o }, {}), bold: changes.bold !== undefined ? changes.bold : run.bold, italic: changes.italic !== undefined ? changes.italic : run.italic, underline: changes.underline !== undefined ? changes.underline : run.underline })
      if (after) result.push({ text: after, bold: run.bold, italic: run.italic, underline: run.underline })
    }
    pos += runLen
  }
  return normalizeRuns(result)
}

/**
 * Get the global format of all runs.
 * Returns { bold, italic, underline } if all runs share the same value, or null if mixed.
 */
export function getGlobalFormat(runs) {
  if (!runs.length) return { bold: false, italic: false, underline: false }
  const first = runs[0]
  const allSame = runs.every((r) => r.bold === first.bold && r.italic === first.italic && r.underline === first.underline)
  if (allSame) return { bold: !!first.bold, italic: !!first.italic, underline: !!first.underline }
  return null
}

/**
 * Toggle format on all runs.
 */
export function toggleFormatAll(runs, key) {
  if (!runs.length) return runs
  const newVal = !runs[0][key]
  return runs.map((r) => ({ ...r, [key]: newVal }))
}
