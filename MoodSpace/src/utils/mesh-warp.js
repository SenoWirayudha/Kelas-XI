export function createGrid(x, y, w, h, divX, divY) {
  const grid = []
  for (let row = 0; row <= divY; row++) {
    const rowPoints = []
    for (let col = 0; col <= divX; col++) {
      const u = col / divX
      const v = row / divY
      rowPoints.push({
        x: x + u * w,
        y: y + v * h,
        u,
        v,
        origX: x + u * w,
        origY: y + v * h,
      })
    }
    grid.push(rowPoints)
  }
  return grid
}

export function cloneGrid(grid) {
  return grid.map((row) => row.map((p) => ({ ...p })))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function bilinear(p00, p10, p01, p11, u, v) {
  return {
    x: lerp(lerp(p00.x, p10.x, u), lerp(p01.x, p11.x, u), v),
    y: lerp(lerp(p00.y, p10.y, u), lerp(p01.y, p11.y, u), v),
  }
}

export function buildSubdividedGrid(corners, subX, subY) {
  const [p00, p10, p01, p11] = corners
  const grid = []
  for (let row = 0; row <= subY; row++) {
    const rowPoints = []
    for (let col = 0; col <= subX; col++) {
      const u = col / subX
      const v = row / subY
      const pos = bilinear(p00, p10, p01, p11, u, v)
      rowPoints.push({
        x: pos.x,
        y: pos.y,
        u,
        v,
        origX: lerp(lerp(p00.origX || p00.x, p10.origX || p10.x, u), lerp(p01.origX || p01.x, p11.origX || p11.x, u), v),
        origY: lerp(lerp(p00.origY || p00.y, p10.origY || p10.y, u), lerp(p01.origY || p01.y, p11.origY || p11.y, u), v),
      })
    }
    grid.push(rowPoints)
  }
  return grid
}

function expandTriangle(x0, y0, x1, y1, x2, y2, amount) {
  const cx = (x0 + x1 + x2) / 3
  const cy = (y0 + y1 + y2) / 3
  const expand = (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const len = Math.hypot(dx, dy) || 1
    return { x: x + (dx / len) * amount, y: y + (dy / len) * amount }
  }
  return [expand(x0, y0), expand(x1, y1), expand(x2, y2)]
}

function drawTexturedTriangle(ctx, img, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
  const du1 = u1 - u0; const dv1 = v1 - v0
  const du2 = u2 - u0; const dv2 = v2 - v0
  const dx1 = x1 - x0; const dy1 = y1 - y0
  const dx2 = x2 - x0; const dy2 = y2 - y0

  const det = du1 * dv2 - du2 * dv1
  if (Math.abs(det) < 1e-8) return

  const invDet = 1 / det
  const a = (dx1 * dv2 - dx2 * dv1) * invDet
  const c = (dx2 * du1 - dx1 * du2) * invDet
  const b = (dy1 * dv2 - dy2 * dv1) * invDet
  const d = (dy2 * du1 - dy1 * du2) * invDet
  const e = x0 - a * u0 - c * v0
  const f = y0 - b * u0 - d * v0

  const [ep0, ep1, ep2] = expandTriangle(x0, y0, x1, y1, x2, y2, 0.75)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(ep0.x, ep0.y)
  ctx.lineTo(ep1.x, ep1.y)
  ctx.lineTo(ep2.x, ep2.y)
  ctx.closePath()
  ctx.clip()
  ctx.transform(a, b, c, d, e, f)
  ctx.drawImage(img, 0, 0)
  ctx.restore()
}

export function renderWarpedImage(ctx, img, srcGrid, dstGrid, opts = {}) {
  const imgW = opts.imgWidth || img.naturalWidth || img.width
  const imgH = opts.imgHeight || img.naturalHeight || img.height
  const ox = opts.offsetX || 0
  const oy = opts.offsetY || 0

  const divY = srcGrid.length - 1
  const divX = srcGrid[0].length - 1

  for (let row = 0; row < divY; row++) {
    for (let col = 0; col < divX; col++) {
      const sTL = srcGrid[row][col]
      const sTR = srcGrid[row][col + 1]
      const sBL = srcGrid[row + 1][col]
      const sBR = srcGrid[row + 1][col + 1]
      const dTL = dstGrid[row][col]
      const dTR = dstGrid[row][col + 1]
      const dBL = dstGrid[row + 1][col]
      const dBR = dstGrid[row + 1][col + 1]

      const su0 = sTL.u * imgW; const sv0 = sTL.v * imgH
      const su1 = sTR.u * imgW; const sv1 = sTR.v * imgH
      const su2 = sBL.u * imgW; const sv2 = sBL.v * imgH
      const su3 = sBR.u * imgW; const sv3 = sBR.v * imgH

      drawTexturedTriangle(ctx, img,
        dTL.x + ox, dTL.y + oy, dTR.x + ox, dTR.y + oy, dBL.x + ox, dBL.y + oy,
        su0, sv0, su1, sv1, su2, sv2,
      )
      drawTexturedTriangle(ctx, img,
        dTR.x + ox, dTR.y + oy, dBR.x + ox, dBR.y + oy, dBL.x + ox, dBL.y + oy,
        su1, sv1, su3, sv3, su2, sv2,
      )
    }
  }
}

export function gridCorners(grid) {
  const lastRow = grid.length - 1
  const lastCol = grid[0].length - 1
  return [grid[0][0], grid[0][lastCol], grid[lastRow][0], grid[lastRow][lastCol]]
}

export function updateGridCorners(grid, corners) {
  const [p00, p10, p01, p11] = corners
  const lastRow = grid.length - 1
  const lastCol = grid[0].length - 1
  grid[0][0] = { ...grid[0][0], x: p00.x, y: p00.y }
  grid[0][lastCol] = { ...grid[0][lastCol], x: p10.x, y: p10.y }
  grid[lastRow][0] = { ...grid[lastRow][0], x: p01.x, y: p01.y }
  grid[lastRow][lastCol] = { ...grid[lastRow][lastCol], x: p11.x, y: p11.y }

  for (let row = 0; row <= lastRow; row++) {
    for (let col = 0; col <= lastCol; col++) {
      if ((row === 0 || row === lastRow) && (col === 0 || col === lastCol)) continue
      const u = col / lastCol
      const v = row / lastRow
      const pos = bilinear(p00, p10, p01, p11, u, v)
      grid[row][col].x = pos.x
      grid[row][col].y = pos.y
    }
  }
  return grid
}

export function subdivideMeshGrid(grid, factor) {
  const rows = grid.length
  const cols = grid[0].length
  const newRows = (rows - 1) * factor + 1
  const newCols = (cols - 1) * factor + 1
  const newGrid = []
  for (let r = 0; r < newRows; r++) {
    const row = []
    const v = r / (newRows - 1)
    for (let c = 0; c < newCols; c++) {
      const u = c / (newCols - 1)
      const pr = Math.min(Math.floor(v * (rows - 1)), rows - 2)
      const pc = Math.min(Math.floor(u * (cols - 1)), cols - 2)
      const lu = (u * (cols - 1)) - pc
      const lv = (v * (rows - 1)) - pr
      const p00 = grid[pr][pc]
      const p10 = grid[pr][pc + 1]
      const p01 = grid[pr + 1][pc]
      const p11 = grid[pr + 1][pc + 1]
      const pos = bilinear(p00, p10, p01, p11, lu, lv)
      row.push({ ...pos, u, v })
    }
    newGrid.push(row)
  }
  return newGrid
}

export const PERSPECTIVE_SUBDIVISIONS = 16
export const APPLY_SUBDIVISIONS = 64
export const WARP_PADDING = 500
