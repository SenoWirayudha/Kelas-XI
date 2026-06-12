import Konva from 'konva'

// ─────────────────────────────────────────────
// BALIK LAYER — WebGL shader (untuk adjustment layer ImageData path)
// ─────────────────────────────────────────────
export const rotation2DShader = `precision mediump float;
  uniform sampler2D uTexture;
  uniform float uAngle;
  uniform float uAxis;
  uniform float uFov;
  varying vec2 vUV;
  void main() {
    float cosA = cos(uAngle);
    float sinA = sin(uAngle);
    vec2 uv = vUV - 0.5;
    vec2 srcUV;
    float shade = 1.0;
    if (uAxis < 0.5) {
      if (abs(cosA) < 0.005) { gl_FragColor = vec4(0.0); return; }
      float perspScale = 1.0 - uv.x * sinA * uFov;
      if (perspScale <= 0.0) { gl_FragColor = vec4(0.0); return; }
      float srcX = (uv.x / cosA) / perspScale;
      if (abs(srcX) > 0.5) { gl_FragColor = vec4(0.0); return; }
      srcUV = vec2(srcX + 0.5, vUV.y);
      shade = max(0.15, 1.0 - abs(srcX * 2.0) * abs(sinA) * 0.7);
    } else {
      if (abs(cosA) < 0.005) { gl_FragColor = vec4(0.0); return; }
      float perspScale = 1.0 - uv.y * sinA * uFov;
      if (perspScale <= 0.0) { gl_FragColor = vec4(0.0); return; }
      float srcY = (uv.y / cosA) / perspScale;
      if (abs(srcY) > 0.5) { gl_FragColor = vec4(0.0); return; }
      srcUV = vec2(vUV.x, srcY + 0.5);
      shade = max(0.15, 1.0 - abs(srcY * 2.0) * abs(sinA) * 0.7);
    }
    vec4 color = texture2D(uTexture, clamp(srcUV, 0.0, 1.0));
    gl_FragColor = vec4(color.rgb * shade, color.a);
  }
`

// ─────────────────────────────────────────────
// Canvas 2D — bilinear sampling helper
// ─────────────────────────────────────────────
export function expandRotation2D(node, angleDeg, resetMap) {
  const stage = node.getStage()
  if (!stage) return
 
  if (!resetMap.has(node)) {
    resetMap.set(node, {
      x:      node.x(),
      y:      node.y(),
      width:  node.width(),
      height: node.height(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      image:  node.image(),
    })
  }
  const orig = resetMap.get(node)
 
  const stageW    = stage.width()
  const stageH    = stage.height()
  const renderedW = orig.width  * orig.scaleX
  const renderedH = orig.height * orig.scaleY
 
  // Render node ke canvas kecil (ukuran node asli)
  const nodeCanvas = node.toCanvas({ pixelRatio: 1 })
 
  // Buat img element dari nodeCanvas untuk dipakai di DOM
  const imgSrc = nodeCanvas.toDataURL()
 
  // Render 3D rotation via DOM (pakai CSS perspective)
  // Kemudian screenshot hasilnya ke canvas
  _render3DviaDOM(imgSrc, angleDeg, renderedW, renderedH, stageW, stageH, orig.x, orig.y)
    .then(resultDataURL => {
      const result = new Image()
      result.onload = () => {
        node.image(result)
        node.x(0); node.y(0)
        node.width(stageW); node.height(stageH)
        node.scaleX(1); node.scaleY(1)
        node.getLayer()?.batchDraw()
      }
      result.src = resultDataURL
    })
}
 
export function clearRotation2D(node, resetMap) {
  const orig = resetMap?.get(node)
  if (!orig) return
  node.image(orig.image)
  node.x(orig.x); node.y(orig.y)
  node.width(orig.width); node.height(orig.height)
  node.scaleX(orig.scaleX); node.scaleY(orig.scaleY)
  resetMap.delete(node)
  node.getLayer()?.batchDraw()
}
 
// Render 3D rotation via hidden DOM element + html2canvas-style
// Menggunakan OffscreenCanvas + CSS transform matrix calculation
function _render3DviaDOM(imgSrc, angleDeg, imgW, imgH, stageW, stageH, nodeX, nodeY) {
  return new Promise(resolve => {
    // Konversi CSS perspective transform ke matrix 2D manually
    // untuk di-draw ke canvas biasa
    
    const rad  = angleDeg * Math.PI / 180
    const cosA = Math.cos(rad)
    const sinA = Math.sin(rad)
 
    // Perspective distance (px) — mirip CSS perspective: 800px
    const perspective = Math.max(stageW, stageH) * 1.2
 
    const offscreen = document.createElement('canvas')
    offscreen.width  = stageW
    offscreen.height = stageH
    const ctx = offscreen.getContext('2d')
 
    const img = new Image()
    img.onload = () => {
      // Pusat gambar di stage
      const cx = nodeX + imgW / 2
      const cy = nodeY + imgH / 2
 
      // Gambar dengan CSS-style perspective matrix
      // Setiap kolom pixel gambar mendapat scale berbeda berdasarkan depth
      // Ini adalah trapezoid transform: 4 titik input → 4 titik output
 
      // Titik-titik gambar asli (sebelum rotate)
      // TL, TR, BR, BL
      const corners = [
        { x: -imgW/2, y: -imgH/2 },
        { x:  imgW/2, y: -imgH/2 },
        { x:  imgW/2, y:  imgH/2 },
        { x: -imgW/2, y:  imgH/2 },
      ]
 
      // Transform tiap corner dengan perspective rotateY
      const transformed = corners.map(p => {
        // Rotasi Y: x' = x*cosA, z' = x*sinA (z = depth)
        const rotX = p.x * cosA
        const rotZ = p.x * sinA  // depth setelah rotasi
 
        // Perspective divide: scale berdasarkan depth
        // w = perspective / (perspective + z)
        const w = perspective / (perspective + rotZ)
 
        return {
          x: cx + rotX * w,
          y: cy + p.y * w,  // Y juga di-scale untuk perspektif penuh
        }
      })
 
      // Gambar trapezoid via scanline rendering
      // Untuk tiap kolom X output, interpolasi dari transformed corners
      _drawPerspectiveImage(ctx, img, imgW, imgH, transformed, stageW, stageH, sinA)
 
      resolve(offscreen.toDataURL())
    }
    img.src = imgSrc
  })
}
 
// Render gambar ke trapezoid menggunakan canvas transform per-strip
function _drawPerspectiveImage(ctx, img, imgW, imgH, corners, stageW, stageH, sinA) {
  // corners: [TL, TR, BR, BL] dalam stage coords
  const [TL, TR, BR, BL] = corners
 
  // Gambar sebagai strip vertikal tipis (1px wide)
  // Tiap strip: interpolasi linear antara sisi kiri dan kanan trapezoid
  const steps = Math.max(imgW, 200)
 
  ctx.save()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps  // 0 = kiri, 1 = kanan
 
    // Titik di sisi kiri dan kanan strip ini (di stage coords)
    const topX    = TL.x + (TR.x - TL.x) * t
    const topY    = TL.y + (TR.y - TL.y) * t
    const botX    = BL.x + (BR.x - BL.x) * t
    const botY    = BL.y + (BR.y - BL.y) * t
 
    // Tinggi strip di output
    const stripH  = Math.sqrt((botX-topX)**2 + (botY-topY)**2)
    if (stripH < 0.1) continue
 
    // Source: kolom i/steps dari gambar asli
    const srcX  = t * imgW
    const srcW  = imgW / steps + 1
 
    // Transformasi affine: dari strip vertikal source ke strip miring di output
    const angle = Math.atan2(botX - topX, botY - topY)
 
    ctx.save()
    ctx.translate(topX, topY)
    ctx.rotate(-angle)
 
    // Scale: tinggi strip output / tinggi gambar asli
    const scaleY = stripH / imgH
    ctx.scale(1, scaleY)
 
    // Shading: sisi yang menjauh lebih gelap
    const normalizedT = t * 2 - 1  // -1 to 1
    const shade = Math.max(0.15, 1.0 - Math.abs(normalizedT) * Math.abs(sinA) * 0.65)
    ctx.globalAlpha = shade
 
    // Clip ke strip width agar tidak overlap
    ctx.beginPath()
    ctx.rect(0, 0, srcW, imgH)
    ctx.clip()
 
    ctx.drawImage(img, srcX, 0, srcW, imgH, 0, 0, srcW, imgH)
 
    ctx.restore()
  }
  ctx.restore()
}
 
// ─────────────────────────────────────────────
// UBIN (Tiling)
// FIX: render sebagai Konva.Image baru di layer
// sehingga tile bisa keluar dari bound node asli
// Node asli disembunyikan, diganti Konva.Image tile
// ─────────────────────────────────────────────
export function applyTiling(node, p, tilesWeakMap) {
  const img = node.image()
  if (!img) return

  const layer  = node.getLayer()
  if (!layer) return

  // Bersihkan tile lama
  const old = tilesWeakMap?.get(node)
  if (old) { old.forEach(n => n.destroy()); tilesWeakMap?.delete(node) }

  const nodeW  = node.width()  * node.scaleX()
  const nodeH  = node.height() * node.scaleY()
  const nodeX  = node.x()
  const nodeY  = node.y()

  if (nodeW <= 0 || nodeH <= 0) return

  const countX = Math.max(1, Math.round(p.scaleX ?? 1))
  const countY = Math.max(1, Math.round(p.scaleY ?? 1))
  const tileW  = nodeW / countX
  const tileH  = nodeH / countY

  const mode   = p.mode ?? 'repeat'
  const mirror = mode === 'mirror'

  // Dimensi gambar asli
  const imgW = img.naturalWidth  ?? img.width
  const imgH = img.naturalHeight ?? img.height
  if (!imgW || !imgH) return

  // Cover fit crop
  const tileAR = tileW / tileH
  const imgAR  = imgW  / imgH
  let cropW, cropH, cropX, cropY
  if (imgAR > tileAR) {
    cropH = imgH; cropW = imgH * tileAR
    cropX = (imgW - cropW) / 2; cropY = 0
  } else {
    cropW = imgW; cropH = imgW / tileAR
    cropX = 0; cropY = (imgH - cropH) / 2
  }

  // Hitung berapa tile yang dibutuhkan untuk memenuhi canvas
  const stage  = node.getStage()
  const stageW = stage?.width()  ?? layer.width()
  const stageH = stage?.height() ?? layer.height()

  const startCol = -Math.ceil(nodeX / tileW) - 1
  const endCol   = Math.ceil((stageW - nodeX) / tileW) + 1
  const startRow = -Math.ceil(nodeY / tileH) - 1
  const endRow   = Math.ceil((stageH - nodeY) / tileH) + 1

  const canvasW = (endCol - startCol + 1) * tileW
  const canvasH = (endRow - startRow + 1) * tileH
  if (canvasW <= 0 || canvasH <= 0) return

  const offscreen = document.createElement('canvas')
  offscreen.width  = Math.round(canvasW)
  offscreen.height = Math.round(canvasH)
  const ctx = offscreen.getContext('2d')

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const tx = (col - startCol) * tileW
      const ty = (row - startRow) * tileH

      const flipX = mirror && ((col % 2 + 2) % 2 === 1)
      const flipY = mirror && ((row % 2 + 2) % 2 === 1)

      ctx.save()
      ctx.beginPath()
      ctx.rect(tx, ty, tileW, tileH)
      ctx.clip()
      ctx.translate(tx + (flipX ? tileW : 0), ty + (flipY ? tileH : 0))
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, tileW, tileH)
      ctx.restore()
    }
  }

  const canvasX = nodeX + startCol * tileW
  const canvasY = nodeY + startRow * tileH

  node.visible(false)

  const tileNode = new Konva.Image({
    x: canvasX,
    y: canvasY,
    image: offscreen,
    width: Math.round(canvasW),
    height: Math.round(canvasH),
    listening: false,
    name: 'fx-tiling',
  })
  layer.add(tileNode)
  tileNode.moveToBottom()
  node.moveToTop()
  layer.batchDraw()

  tilesWeakMap?.set(node, [tileNode])
}

// Panggil ini saat effect dihapus
export function clearTiling(node, tilesWeakMap) {
  const old = tilesWeakMap?.get(node)
  if (old) { old.forEach(n => n.destroy()); tilesWeakMap?.delete(node) }
  node.visible(true)
  node.getLayer()?.batchDraw()
}


// ─────────────────────────────────────────────
// REPEATER — kopian di atas node asli
// ─────────────────────────────────────────────
export function applyRepeater(node, p, repeatersWeakMap) {
  const layer = node.getLayer()
  if (!layer) return

  const old = repeatersWeakMap?.get(node)
  if (old) { old.forEach(c => c.destroy()); repeatersWeakMap?.delete(node) }

  const count   = Math.max(1, Math.round(p.count ?? 3))
  const offsetX = p.offsetX ?? 0
  const offsetY = p.offsetY ?? 20
  const rot     = p.rotation ?? 0
  const scale   = p.scale ?? 1

  const copies  = []
  const parent  = node.getParent()
  const container = (parent && parent.getClassName() !== 'Layer') ? parent : layer

  node.moveToBottom()

  const opacityDecay = p.opacity ?? 1
  for (let i = 1; i <= count; i++) {
    const scalePow = Math.pow(scale, i)
    const clone = node.clone({
      x: node.x() + offsetX * i,
      y: node.y() + offsetY * i,
      rotation: node.rotation() + rot * i,
      scaleX: node.scaleX() * scalePow,
      scaleY: node.scaleY() * scalePow,
      opacity: Math.max(0, Math.min(1, node.opacity() * Math.pow(opacityDecay, i))),
      listening: false,
      draggable: false,
      name: `fx-repeater-${i}`,
    })
    container.add(clone)
    clone.moveToTop()
    if ((node.filters() ?? []).length > 0) clone.cache({ pixelRatio: 1 })
    copies.push(clone)
  }

  layer.batchDraw()
  repeatersWeakMap?.set(node, copies)
  return copies
}