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
  const defaultAlign = item.align || 'left'
  let runs
  if (item.runs && item.runs.length > 0) {
    runs = item.runs.map(r => ({ ...r, align: r.align !== undefined ? r.align : (r.listType ? defaultAlign : undefined) }))
  } else if (!item.text && item.text !== '') {
    runs = [{ text: '', bold: false, italic: false, underline: false, align: defaultAlign }]
  } else {
    runs = [{
      text: item.text || '',
      bold: item.isBold || false,
      italic: item.isItalic || false,
      underline: item.isUnderline || false,
      fontFamily: item.fontFamily || undefined,
      fontSize: item.fontSize || undefined,
      fill: item.fill || undefined,
      align: defaultAlign,
    }]
  }

  // Migration: legacy item.listType → per-run listType
  if (item.listType && !runs.some(r => r.listType)) {
    const skipLines = item.listSkipLines || []
    const hasSkip = skipLines.length > 0
    const migrated = runs.map(r => ({ ...r, listType: item.listType }))
    if (!hasSkip) return migrated
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

function fmtContent(ct, run, baseFontFamily, baseFill) {
  let r = ct
  const styles = []
  if (run.fontFamily && run.fontFamily !== baseFontFamily) styles.push(`font-family:${run.fontFamily}`)
  if (run.fill && run.fill !== baseFill) styles.push(`color:${run.fill}`)
  if (styles.length) r = `<span style="${styles.join(';')}">${r}</span>`
  if (run.bold) r = `<b>${r}</b>`
  if (run.italic) r = `<i>${r}</i>`
  if (run.underline) r = `<u>${r}</u>`
  return r
}

function fmtListDiv(content, listType, align, lineFormat) {
  const styleParts = []
  if (align && align !== 'left') styleParts.push(`text-align:${align}`)
  if (lineFormat?.bold) styleParts.push('font-weight:bold')
  if (lineFormat?.italic) styleParts.push('font-style:italic')
  if (lineFormat?.underline) styleParts.push('text-decoration:underline')
  if (lineFormat?.fontFamily) styleParts.push(`font-family:${lineFormat.fontFamily}`)
  if (lineFormat?.fill) styleParts.push(`color:${lineFormat.fill}`)
  const style = styleParts.join(';')
  return `<div class="list-line" data-list="${listType}" data-align="${align || 'left'}" style="${style}">${content}</div>`
}

export function runsToHtml(runs, baseFontFamily, baseFill) {
  let html = ''
  let i = 0
  while (i < runs.length) {
    const run = runs[i]

    if (run.text === '\n') {
      console.log('[runsToHtml] standalone \\n run at idx', i, 'listType:', run.listType)
      const brList = run.listType ? ` data-list="${run.listType}"` : ''
      html += `<br${brList}>`
      i++
      continue
    }

    if (run.listType) {
      // Collect all consecutive runs on this visual line into one list-line div
      let content = ''
      let j = i
      while (j < runs.length) {
        const cur = runs[j]
        if (cur.text === '\n') break
        if (j > i && cur.listType) break

        let part = escapeHtml(cur.text)
        if (part.includes('\n')) {
          console.log('[runsToHtml] \\n EMBEDDED in run text idx', j, 'text:', JSON.stringify(cur.text), 'codes:', Array.from(cur.text).map(c => c.charCodeAt(0)))
          part = part.replace(/\n/g, '<br>')
        }
        part = fmtContent(part, cur, baseFontFamily, baseFill)
        content += part
        j++
      }

      if (!content) content = '\u200B'

      // lineFormat only when group is a single run (same semantics as old
      // per-run afterNewline flag); multi-run groups skip lineFormat to avoid
      // inheriting the first run's color/font properties onto subsequent runs.
      const isNewLine = i === 0 || runs[i - 1]?.text === '\n'
      const lineFormat = isNewLine && j === i + 1 ? {
        bold: !!run.bold, italic: !!run.italic, underline: !!run.underline,
        fontFamily: run.fontFamily || undefined,
        fill: run.fill || undefined,
      } : null

      html += fmtListDiv(content, run.listType, run.align || 'left', lineFormat)
      i = j
    } else {
      let t = escapeHtml(run.text)
      if (t.includes('\n')) {
        console.log('[runsToHtml] \\n EMBEDDED in run text idx', i, 'text:', JSON.stringify(run.text), 'codes:', Array.from(run.text).map(c => c.charCodeAt(0)))
        t = t.replace(/\n/g, '<br>')
      }
      t = fmtContent(t, run, baseFontFamily, baseFill)
      if (!t) t = '\u200B'
      const tag = run.align ? 'div' : 'span'
      const style = run.align ? `text-align:${run.align}` : ''
      const alignAttr = run.align ? ` data-align="${run.align}"` : ''
      html += `<${tag}${alignAttr} style="${style}">${t}</${tag}>`
      i++
    }
  }
  return html
}

export function htmlToRuns(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  const rows = []
  walkTextNodes(div, (text, tags, styles, listType, align) => {
    rows.push({
      text,
      bold: tags.has('b') || tags.has('strong'),
      italic: tags.has('i') || tags.has('em'),
      underline: tags.has('u'),
      fontFamily: normalizeFontFamily(styles.fontFamily),
      fill: normalizeColor(styles.color),
      listType: listType || null,
      align: align || null,
    })
  })
  // Post-process: within each visual line (\n boundary), only the first
  // run keeps the inherited listType.  Runs that were split by a formatting
  // boundary inside a list item inherit listType from the parent DOM element
  // but are NOT a new list item — strip listType from subsequent runs.
  const runs = []
  let atLineStart = true
  for (const r of rows) {
    if (r.text === '\n') {
      atLineStart = true
      runs.push(r)
    } else {
      runs.push({ ...r, listType: atLineStart ? r.listType : null })
      atLineStart = false
    }
  }
  return normalizeRuns(runs)
}

function walkTextNodes(node, fn, inheritedTags = new Set(), inheritedStyles = {}, inheritedListType = null, inheritedAlign = null) {
  if (node.nodeType === 3) {
    const cleanText = (node.textContent || '').replace(/\u200B/g, '')
    fn(cleanText, new Set(inheritedTags), { ...inheritedStyles }, inheritedListType, inheritedAlign)
    return
  }
  const tag = node.nodeName?.toLowerCase?.()
  if (tag === 'br') {
    const brListType = node.dataset?.list || inheritedListType
    fn('\n', new Set(inheritedTags), { ...inheritedStyles }, brListType, inheritedAlign)
    return
  }
  const newTags = new Set(inheritedTags)
  const newStyles = { ...inheritedStyles }
  let newListType = inheritedListType
  let newAlign = inheritedAlign
  if (['b', 'strong', 'i', 'em', 'u'].includes(tag)) newTags.add(tag)
  if (node.style?.fontFamily) newStyles.fontFamily = node.style.fontFamily
  if (node.style?.color) newStyles.color = node.style.color
  if (node.style?.fontStyle === 'italic') newTags.add('i')
  if (node.style?.fontWeight === 'bold' || node.style?.fontWeight === '700') newTags.add('b')
  if (node.style?.textDecoration?.includes('underline')) newTags.add('u')
  if (node.dataset?.list) {
    newListType = node.dataset.list
  }
  if (node.dataset?.align) {
    newAlign = node.dataset.align
  }
  for (let child = node.firstChild; child; child = child.nextSibling) {
    walkTextNodes(child, fn, newTags, newStyles, newListType, newAlign)
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
    align: runs[0].align || null,
  }]
  for (let i = 1; i < runs.length; i++) {
    const prev = out[out.length - 1]
    const cur = runs[i]
    if (prev.text !== '\n' && cur.text !== '\n' && !prev.text.endsWith('\n') &&
        prev.listType === (cur.listType || null) &&
        prev.bold === !!cur.bold && prev.italic === !!cur.italic && prev.underline === !!cur.underline &&
        (prev.fontFamily || undefined) === (cur.fontFamily || undefined) &&
        (prev.fill || undefined) === (cur.fill || undefined) &&
        (prev.align || null) === (cur.align || null)) {
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
        align: cur.align || null,
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
    const runAlign = run.align || null

    if (atLineStart && lt && text !== '\n') {
      result.push({ text: lt === 'numbered' ? `${lineNum}. ` : '• ', listType: lt, isPrefix: true, bold: !!run.bold, italic: !!run.italic, underline: !!run.underline, fontFamily: run.fontFamily, fill: run.fill })
      if (lt === 'numbered') lineNum++
    }
    atLineStart = false

    if (!text) continue

    let remaining = text
    while (remaining.length > 0) {
      const nl = remaining.indexOf('\n')
      if (nl === -1) {
        result.push({ ...run, text: remaining, align: runAlign })
        atLineStart = false
        break
      }
      if (nl > 0) {
        result.push({ ...run, text: remaining.slice(0, nl) + '\n', align: runAlign })
      } else {
        // Always push standalone \n as separate run to preserve item boundaries,
        // even when previous result already ends with \n (e.g. pressing Enter on empty list item)
        result.push({ ...run, text: '\n', align: runAlign })
      }
      remaining = remaining.slice(nl + 1)
      atLineStart = true
      if (remaining.length > 0 && lt && run.isNewItem) {
        result.push({ text: lt === 'numbered' ? `${lineNum}. ` : '• ', listType: lt, isPrefix: true, bold: !!run.bold, italic: !!run.italic, underline: !!run.underline, fontFamily: run.fontFamily, fill: run.fill })
        if (lt === 'numbered') lineNum++
      }
    }
  }

  if (atLineStart && runs.length > 0) {
    const lastRun = runs[runs.length - 1]
    const lt = lastRun.listType
    if (lt) {
      result.push({ text: lt === 'numbered' ? `${lineNum}. ` : '• ', listType: lt, isPrefix: true, bold: !!lastRun.bold, italic: !!lastRun.italic, underline: !!lastRun.underline, fontFamily: lastRun.fontFamily, fill: lastRun.fill })
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

  return normalizeRuns(result).map(r => { const { isPrefix, align, ...rest } = r; const out = { ...rest, align: align || undefined }; if (rest.listType && !out.align) out.align = 'left'; return out })
}
