// ─── Canvas size defaults ─────────────────────────────────────────────────────
export const defaultCanvasSize = { width: 1280, height: 720 }
export const virtualWorkspace = { x: -2600, y: -2200, width: 6200, height: 5200 }

// ─── Transform anchors ────────────────────────────────────────────────────────
export const transformAnchors = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
  'middle-left', 'middle-right', 'top-center', 'bottom-center',
]
export const cornerTransformAnchors = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
]

// ─── Snap / guide tolerances ─────────────────────────────────────────────────
export const snapTolerance = 6
export const marginSnapTolerance = 10
export const edgeSnapTolerance = 16
export const canvasInnerMargin = 64
export const marginGuideActivationDistance = 112

// ─── Zoom ─────────────────────────────────────────────────────────────────────
export const minZoom = 0.25
export const maxZoom = 3
export const zoomSpeed = 1.08

// ─── Image ────────────────────────────────────────────────────────────────────
export const imageMaxSize = 280

// ─── Frame types that are "basic" (rect-like, free resize) ───────────────────
export const basicFrameTypes = new Set(['rect'])

// ─── Grid frames ─────────────────────────────────────────────────────────────
export const gridFrameTypes = new Set(['grid-2', 'grid-3', 'grid-collage', 'grid-asymmetric'])