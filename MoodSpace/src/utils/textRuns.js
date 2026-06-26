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

function normalizeFontFamily(f) {
  if (!f) return undefined
  return f.replace(/^['"]|['"]$/g, '').trim()
}

function normalizeColor(c) {
  if (!c) return undefined
  if (c.startsWith('rgb(') || c.startsWith('rgba(')) {
    const m = c.match(/([\d.]+)/g)
    if (m) {
      const r = parseInt(m[0]), g = parseInt(m[1]), b = parseInt(m[2])
      return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
    }
  }
  return c
}

export function getRuns(item) {
  let runs
  if (item.runs && item.runs.length > 0) {
    runs = item.runs
  } else if (!item.text && item.text !== '') {
    runs = [{ text: '', bold: false, italic: false, underline: false }]
  } else {
    runs = [{
      text: item.text || '',
      bold: item.isBold || false,
      italic: item.isItalic || false,
      underline: item.isUnderline || false,
      fontFamily: item.fontFamily || undefined,
      fontSize: item.fontSize || undefined,
      fill: item.fill || undefined,
    }]
  }

  // Migration: legacy item.listType → per-run listType
  if (item.listType && !runs.some(r => r.listType)) {
    const skipLines = item.listSkipLines || []
    const hasSkip = skipLines.length > 0
    // First pass: assign listType to all runs
    const migrated = runs.map(r => ({ ...r, listType: item.listType }))
    if (!hasSkip) return migrated
    // Handle skipped lines by splitting runs at \n boundaries
    const out = []
    let lineIdx = 0
    for (const run of migrated) {
      const text = run.text || ''
      const parts = text.split('\n')
      for (let pi = 0; pi < parts.length; pi++) {
        if (pi > 0) lineIdx++
        const isSkipped = skipLines.includes(lineIdx)
        if (parts[pi]) {
          out.push({ ...run, text: parts[pi], listType: isSkipped ? null : item.listType })
        }
        if (pi < parts.length - 1) {
          out.push({ text: '\n', listType: null, bold: false, italic: false, underline: false })
        }
      }
    }
    return out
  }

  return runs
}

export function runsToText(runs) {
  return runs.map((r) => r.text).join('')
}

export function runsToHtml(runs, baseFontFamily, baseFill) {
  return runs.map((run) => {
    let t = escapeHtml(run.text)
    const styles = []
    if (run.fontFamily && run.fontFamily !== baseFontFamily) styles.push(`font-family:${run.fontFamily}`)
    if (run.fill && run.fill !== baseFill) styles.push(`color:${run.fill}`)
    if (run.bold) t = `<b>${t}</b>`
    if (run.italic) t = `<i>${t}</i>`
    if (run.underline) t = `<u>${t}</u>`
    if (styles.length) t = `<span style="${styles.join(';')}">${t}</span>`
    if (run.listType) t = `<span data-list="${run.listType}">${t}</span>`
    return t
  }).join('')
}

export function htmlToRuns(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  const runs = []
  walkTextNodes(div, (text, tags, styles, listType) => {
    if (!text) return
    runs.push({
      text,
      bold: tags.has('b') || tags.has('strong'),
      italic: tags.has('i') || tags.has('em'),
      underline: tags.has('u'),
      fontFamily: normalizeFontFamily(styles.fontFamily),
      fill: normalizeColor(styles.color),
      listType: listType || null,
    })
  })
  return normalizeRuns(runs)
}

function walkTextNodes(node, fn, inheritedTags = new Set(), inheritedStyles = {}, inheritedListType = null) {
  if (node.nodeType === 3) {
    fn(node.textContent || '', new Set(inheritedTags), { ...inheritedStyles }, inheritedListType)
    return
  }
  const tag = node.nodeName?.toLowerCase?.()
  const newTags = new Set(inheritedTags)
  const newStyles = { ...inheritedStyles }
  let newListType = inheritedListType
  if (['b', 'strong', 'i', 'em', 'u'].includes(tag)) newTags.add(tag)
  if (node.style?.fontFamily) newStyles.fontFamily = node.style.fontFamily
  if (node.style?.color) newStyles.color = node.style.color
  if (node.style?.fontStyle === 'italic') newTags.add('i')
  if (node.style?.fontWeight === 'bold' || node.style?.fontWeight === '700') newTags.add('b')
  if (node.style?.textDecoration?.includes('underline')) newTags.add('u')
  if (tag === 'span' && node.dataset?.list) {
    newListType = node.dataset.list
  }
  for (let child = node.firstChild; child; child = child.nextSibling) {
    walkTextNodes(child, fn, newTags, newStyles, newListType)
  }
}

export function normalizeRuns(runs) {
  if (!runs.length) return runs
  const out = [{
    text: runs[0].text || '',
    bold: !!runs[0].bold,
    italic: !!runs[0].italic,
    underline: !!runs[0].underline,
    fontFamily: runs[0].fontFamily || undefined,
    fill: runs[0].fill || undefined,
    listType: runs[0].listType || null,
    isPrefix: !!runs[0].isPrefix,
  }]
  for (let i = 1; i < runs.length; i++) {
    const prev = out[out.length - 1]
    const cur = runs[i]
    if (prev.listType === (cur.listType || null) &&
        prev.isPrefix === !!cur.isPrefix &&
        prev.bold === !!cur.bold && prev.italic === !!cur.italic && prev.underline === !!cur.underline &&
        (prev.fontFamily || undefined) === (cur.fontFamily || undefined) &&
        (prev.fill || undefined) === (cur.fill || undefined)) {
      prev.text += (cur.text || '')
    } else {
      out.push({
        text: cur.text || '',
        bold: !!cur.bold,
        italic: !!cur.italic,
        underline: !!cur.underline,
        fontFamily: cur.fontFamily || undefined,
        fill: cur.fill || undefined,
        listType: cur.listType || null,
        isPrefix: !!cur.isPrefix,
      })
    }
  }
  return out
}

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
      const pushRun = (text, base, applyChanges) => {
        if (!text) return
        const r = { ...base, text }
        if (applyChanges) {
          for (const k of Object.keys(changes)) r[k] = changes[k] !== undefined ? changes[k] : base[k]
        }
        result.push(r)
      }
      pushRun(before, run, false)
      pushRun(mid, run, true)
      pushRun(after, run, false)
    }
    pos += runLen
  }
  return normalizeRuns(result)
}

export function getGlobalFormat(runs) {
  if (!runs.length) return { bold: false, italic: false, underline: false }
  const first = runs[0]
  const allSame = runs.every((r) =>
    r.bold === first.bold && r.italic === first.italic && r.underline === first.underline &&
    (r.fontFamily || undefined) === (first.fontFamily || undefined) &&
    (r.fill || undefined) === (first.fill || undefined)
  )
  if (allSame) return {
    bold: !!first.bold,
    italic: !!first.italic,
    underline: !!first.underline,
    fontFamily: first.fontFamily || undefined,
    fill: first.fill || undefined,
  }
  return null
}

export function toggleFormatAll(runs, key) {
  if (!runs.length) return runs
  const newVal = !runs[0][key]
  return runs.map((r) => ({ ...r, [key]: newVal }))
}

export function addListPrefix(runs) {
  const result = []
  let lineNum = 1
  let atLineStart = true

  for (const run of runs) {
    const lt = run.listType
    const text = run.text || ''

    if (atLineStart && lt) {
      result.push({ text: lt === 'numbered' ? `${lineNum}. ` : '• ', listType: lt, isPrefix: true, bold: false, italic: false, underline: false })
      if (lt === 'numbered') lineNum++
    }
    atLineStart = false

    if (!text) continue

    let remaining = text
    while (remaining.length > 0) {
      const nl = remaining.indexOf('\n')
      if (nl === -1) {
        result.push({ ...run, text: remaining })
        atLineStart = false
        break
      }
      if (nl > 0) result.push({ ...run, text: remaining.slice(0, nl) })
      result.push({ ...run, text: '\n' })
      remaining = remaining.slice(nl + 1)
      atLineStart = true
      if (remaining.length > 0 && lt) {
        result.push({ text: lt === 'numbered' ? `${lineNum}. ` : '• ', listType: lt, isPrefix: true, bold: false, italic: false, underline: false })
        if (lt === 'numbered') lineNum++
      }
    }
  }

  if (atLineStart && runs.length > 0) {
    const lastRun = runs[runs.length - 1]
    const lt = lastRun.listType
    if (lt) {
      result.push({ text: lt === 'numbered' ? `${lineNum}. ` : '• ', listType: lt, isPrefix: true, bold: false, italic: false, underline: false })
    }
  }

  return normalizeRuns(result)
}

export function stripListPrefix(runs) {
  let atLineStart = true
  const result = []

  for (const run of runs) {
    if (run.isPrefix) continue
    const text = run.text || ''
    if (!text) continue

    let out = ''
    let i = 0
    while (i < text.length) {
      if (atLineStart) {
        const rest = text.slice(i)
        let matched = false
        if (run.listType === 'numbered') {
          const m = rest.match(/^\d+\.[ \t]*/)
          if (m) { i += m[0].length; matched = true }
        } else if (run.listType === 'bullet') {
          if (rest.startsWith('• ')) { i += 2; matched = true }
        }
        atLineStart = false
        if (matched) continue
      }
      const ch = text[i++]
      out += ch
      if (ch === '\n') atLineStart = true
    }

    if (out) result.push({ ...run, text: out, isPrefix: undefined })
  }

  return normalizeRuns(result).map(r => { const { isPrefix, ...rest } = r; return rest })
}
