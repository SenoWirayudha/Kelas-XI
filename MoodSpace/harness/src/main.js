import Konva from 'konva'
import { effectManager } from '../../src/utils/konva-effects-engine'

const out = document.getElementById('out')
const log = (s) => { out.textContent += s + '\n' }
window.addEventListener('error', (e) => { log('GLOBAL-ERROR: ' + e.message + ' @' + (e.filename || '') + ':' + e.lineno); out.textContent += 'STACK: ' + (e.error?.stack || 'n/a') + '\n' })
window.addEventListener('unhandledrejection', (e) => { log('UNHANDLED-REJECTION: ' + e.reason) })
try { log('Konva loaded, v=' + Konva.version) } catch (e) { log('Konva import fail: ' + e.message) }

const inst = 'ls1'
const effectsOn = {
  [inst]: { effectId: 'longShadow', value: { angle: 45, length: 0.5, color: '#000000', fade: false } },
}
const effectsOff = {
  [inst]: { effectId: 'longShadow', value: false },
}
const order = [inst]

function sampleLayer(layer) {
  const cv = layer.getCanvas()
  const gd = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
  return gd
}

function classify(gd, kind) {
  let shadow = 0, obj = 0, alpha = 0
  for (let i = 0; i < gd.length; i += 4) {
    const r = gd[i], g = gd[i + 1], b = gd[i + 2], a = gd[i + 3]
    if (a > 0) alpha++
    if (a > 0 && r < 60 && g < 60 && b < 60) shadow++
    if (kind === 'image' && a > 0 && r > 100 && g < 60 && b < 60) obj++
    if (kind === 'text' && a > 0 && r > 180 && g > 160 && b > 180) obj++
    if (kind === 'rect' && a > 0 && r < 60 && g > 100 && b < 60) obj++
  }
  return { shadow, obj, alpha }
}

function runNodeTest(name, node, kind, x, y) {
  node.x(x); node.y(y)
  const stage = node.getStage()
  const layer = node.getLayer()

  effectManager.applyAll(node, effectsOn, null, order)
  layer.draw()
  const on = classify(sampleLayer(layer), kind)

  effectManager.applyAll(node, effectsOff, null, order)
  layer.draw()
  const off = classify(sampleLayer(layer), kind)

  const hasCacheOff = !!node._getCanvasCache()
  const filtersOff = (node.filters() || []).length
  const pass = on.shadow > 0 && off.shadow === 0
  log(`[${name}] ON  shadowPx=${on.shadow} objPx=${on.obj} alphaPx=${on.alpha}`)
  log(`[${name}] OFF shadowPx=${off.shadow} objPx=${off.obj} alphaPx=${off.alpha} cache=${hasCacheOff} filters=${filtersOff}`)
  log(`[${name}] => ${pass ? 'PASS (shadow cleared)' : 'FAIL (BUG REPRODUCED: shadow still applied)'}`)
  node.destroy()
}

function makeImageNode() {
  const c = document.createElement('canvas')
  c.width = 40; c.height = 40
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(8, 8, 24, 24)
  return new Konva.Image({ image: c, width: 40, height: 40 })
}

function run() {
  const host = document.createElement('div')
  host.id = 'stage-host'
  document.body.appendChild(host)
  const stage = new Konva.Stage({ container: host, width: 220, height: 120 })
  const layer = new Konva.Layer()
  stage.add(layer)

  const img = makeImageNode(); layer.add(img)
  runNodeTest('IMAGE', img, 'image', 8, 8)

  const txt = new Konva.Text({ text: 'AB', fontSize: 28, fontFamily: 'Arial', fill: '#e8e4ff', width: 50 })
  layer.add(txt)
  runNodeTest('TEXT', txt, 'text', 70, 8)

  const rect = new Konva.Rect({ width: 30, height: 30, fill: '#00ff00' })
  layer.add(rect)
  runNodeTest('RECT', rect, 'rect', 140, 40)

  log('DONE')
}

run()
