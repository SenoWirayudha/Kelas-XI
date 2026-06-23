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
    return t
  }).join('')
}

export function htmlToRuns(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  const runs = []
  walkTextNodes(div, (text, tags, styles) => {
    if (!text) return
    runs.push({
      text,
      bold: tags.has('b') || tags.has('strong'),
      italic: tags.has('i') || tags.has('em'),
      underline: tags.has('u'),
      fontFamily: normalizeFontFamily(styles.fontFamily),
      fill: normalizeColor(styles.color),
    })
  })
  return normalizeRuns(runs)
}

function walkTextNodes(node, fn, inheritedTags = new Set(), inheritedStyles = {}) {
  if (node.nodeType === 3) {
    fn(node.textContent || '', new Set(inheritedTags), { ...inheritedStyles })
    return
  }
  const tag = node.nodeName?.toLowerCase?.()
  const newTags = new Set(inheritedTags)
  const newStyles = { ...inheritedStyles }
  if (['b', 'strong', 'i', 'em', 'u'].includes(tag)) newTags.add(tag)
  if (node.style?.fontFamily) newStyles.fontFamily = node.style.fontFamily
  if (node.style?.color) newStyles.color = node.style.color
  if (node.style?.fontStyle === 'italic') newTags.add('i')
  if (node.style?.fontWeight === 'bold' || node.style?.fontWeight === '700') newTags.add('b')
  if (node.style?.textDecoration?.includes('underline')) newTags.add('u')
  for (let child = node.firstChild; child; child = child.nextSibling) {
    walkTextNodes(child, fn, newTags, newStyles)
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
  }]
  for (let i = 1; i < runs.length; i++) {
    const prev = out[out.length - 1]
    const cur = runs[i]
    if (prev.bold === !!cur.bold && prev.italic === !!cur.italic && prev.underline === !!cur.underline &&
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
