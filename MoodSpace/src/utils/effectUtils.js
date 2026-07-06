export const EFFECT_CATEGORIES = [
  { id: 'color', label: 'Color', icon: 'Palette' },
  { id: 'stylize', label: 'Stylize', icon: 'Sparkles' },
  { id: 'blur', label: 'Blur', icon: 'Droplets' },
  { id: 'transform', label: 'Transform', icon: 'Move' },
  { id: 'keying', label: 'Keying', icon: 'Layers' },
  { id: 'text', label: 'Text', icon: 'Type' },
]

// Effect IDs yang dilarang untuk adjustment layer
export const ADJUSTMENT_RESTRICTED_EFFECTS = new Set([
  'repeater', 'chromaKey', 'lumaKey', 'spotColor', 'maskFade', 'roughenEdge', 'feather', 'letterSpacing', 'curve', 'stretch',
])

export const EFFECTS = [
  // ── Phase 1: Simple (Konva built-in / Canvas 2D) ──
  { id: 'invert', label: 'Invert', category: 'color', type: 'toggle', default: false, icon: 'CircleOff' },
  { id: 'threshold', label: 'Threshold', category: 'color', type: 'object', default: null, icon: 'Contrast', params: [
    { key: 'threshold', label: 'Threshold', type: 'slider', default: 128, min: 0, max: 255 },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
  ]},
  { id: 'grayscale', label: 'Grayscale', category: 'color', type: 'toggle', default: false, icon: 'Contrast' },
  { id: 'sepia', label: 'Sepia', category: 'color', type: 'toggle', default: false, icon: 'Palette' },
  { id: 'solarize', label: 'Solarize', category: 'color', type: 'toggle', default: false, icon: 'Sun' },
  { id: 'noise', label: 'Noise', category: 'stylize', type: 'object', default: null, icon: 'Grip', params: [
    { key: 'amount', label: 'Amount', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'monochrome', label: 'Monochrome', type: 'toggle', default: false },
  ]},
  { id: 'pixelate', label: 'Pixelate', category: 'stylize', type: 'slider', default: 0, icon: 'Grid', min: 0, max: 20 },
  { id: 'gaussianBlur', label: 'Gaussian Blur', category: 'blur', type: 'slider', default: 0, icon: 'Droplets', min: 0, max: 20, unit: 'px' },
  { id: 'feather', label: 'Feather', category: 'blur', type: 'slider', default: 0, icon: 'Feather', min: 0, max: 1, step: 0.01 },
  { id: 'maskFade', label: 'Mask Fade', category: 'stylize', type: 'object', default: null, icon: 'Circle', params: [
    { key: 'size', label: 'Size', type: 'slider', default: 1, min: 0.1, max: 1, step: 0.01 },
    { key: 'feather', label: 'Feather', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'offsetX', label: 'Offset X', type: 'slider', default: 0, min: -1, max: 1, step: 0.01 },
    { key: 'offsetY', label: 'Offset Y', type: 'slider', default: -0.85, min: -1, max: 1, step: 0.01 },
    { key: 'rotation', label: 'Rotation', type: 'slider', default: 0, min: 0, max: 360, unit: '°' },
  ]},
  { id: 'mirror', label: 'Mirror', category: 'transform', type: 'select', default: 'none', icon: 'FlipHorizontal', options: [
    { value: 'none', label: 'None' }, { value: 'h', label: 'Horizontal' }, { value: 'v', label: 'Vertical' }, { value: 'both', label: 'Both' },
  ]},

  // ── Phase 2: Medium (Canvas 2D / WebGL) ──
  { id: 'directionalBlur', label: 'Directional Blur', category: 'blur', type: 'object', default: null, icon: 'Move', params: [
    { key: 'angle', label: 'Angle', type: 'slider', default: 0, min: 0, max: 360, unit: '°' },
    { key: 'strength', label: 'Strength', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'samples', label: 'Samples', type: 'slider', default: 16, min: 4, max: 64 },
  ]},
  { id: 'zoomBlur', label: 'Zoom Blur', category: 'blur', type: 'object', default: null, icon: 'Maximize', params: [
    { key: 'strength', label: 'Strength', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'centerX', label: 'Center X', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'centerY', label: 'Center Y', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'spinBlur', label: 'Spin Blur', category: 'blur', type: 'object', default: null, icon: 'RotateCw', params: [
    { key: 'angle', label: 'Angle', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'centerX', label: 'Center X', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'centerY', label: 'Center Y', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'spotColor', label: 'Spot Color', category: 'color', type: 'object', default: null, icon: 'Target', params: [
    { key: 'color', label: 'Color', type: 'color', default: '#ff0000' },
    { key: 'threshold', label: 'Threshold', type: 'slider', default: 30, min: 0, max: 255 },
    { key: 'feather', label: 'Feather', type: 'slider', default: 0.2, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'replaceColor', label: 'Replace Color', category: 'color', type: 'object', default: null, icon: 'Palette', params: [
    { key: 'fromColor', label: 'From', type: 'color', default: '#ff0000' },
    { key: 'toColor', label: 'To', type: 'color', default: '#00ff00' },
    { key: 'threshold', label: 'Threshold', type: 'slider', default: 30, min: 0, max: 255 },
    { key: 'feather', label: 'Feather', type: 'slider', default: 0.2, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'gradientOverlay', label: 'Gradient Overlay', category: 'color', type: 'object', default: null, icon: 'Layers', params: [
    { key: 'colors', label: 'Colors', type: 'gradient', default: ['#000000', '#ffffff'] },
    { key: 'stops', label: 'Stops', type: 'stops', default: [0, 1] },
    { key: 'angle', label: 'Angle', type: 'slider', default: 0, min: 0, max: 360, unit: '°' },
    { key: 'blendMode', label: 'Blend', type: 'select', default: 'overlay', options: [
      { value: 'overlay', label: 'Overlay' }, { value: 'multiply', label: 'Multiply' }, { value: 'screen', label: 'Screen' },
      { value: 'color', label: 'Color' }, { value: 'normal', label: 'Normal' },
    ]},
    { key: 'opacity', label: 'Opacity', type: 'slider', default: 0.8, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'rgbSplit', label: 'RGB Split', category: 'color', type: 'object', default: null, icon: 'Split', params: [
    { key: 'mode', label: 'Mode', type: 'select', default: 'g', options: [
      { value: 'r', label: 'R' }, { value: 'g', label: 'G' }, { value: 'b', label: 'B' },
    ]},
    { key: 'offset', label: 'Offset', type: 'slider', default: 0.01, min: -0.1, max: 0.1, step: 0.005 },
    { key: 'angle', label: 'Angle', type: 'slider', default: 0, min: 0, max: 360, unit: '°' },
  ]},

  // ── Phase 3: Complex ──
  { id: 'duotone', label: 'Duotone', category: 'color', type: 'object', default: null, icon: 'Palette', params: [
    { key: 'colorA', label: 'Shadow Color', type: 'color', default: '#000000' },
    { key: 'colorB', label: 'Highlight Color', type: 'color', default: '#ffffff' },
  ]},
  { id: 'risograph', label: 'Risograph', category: 'stylize', type: 'object', default: null, icon: 'Palette', params: [
    { key: 'color1', label: 'Color', type: 'color', default: '#2d5a27' },
    { key: 'paper', label: 'Paper', type: 'color', default: '#f4cfc6' },
    { key: 'threshold', label: 'Threshold', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'grain', label: 'Grain', type: 'slider', default: 0.15, min: 0, max: 1, step: 0.01 },
    { key: 'density', label: 'Density', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'misalignment', label: 'Misalignment', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'spectralMap', label: 'Spectral Map', category: 'color', type: 'object', default: null, icon: 'Palette', params: [
    { key: 'shadowColor', label: 'Shadow', type: 'color', default: '#ff0000' },
    { key: 'midColor', label: 'Midtone', type: 'color', default: '#00ff00' },
    { key: 'highlightColor', label: 'Highlight', type: 'color', default: '#0000ff' },
    { key: 'tahap', label: 'Tahap', type: 'slider', default: 0, min: -1, max: 1, step: 0.01 },
    { key: 'repeat', label: 'Repeat', type: 'slider', default: 1, min: 1, max: 10, step: 0.1 },
    { key: 'saturation', label: 'Saturation', type: 'slider', default: 1, min: 0, max: 1, step: 0.05 },
    { key: 'alpha', label: 'Opacity', type: 'slider', default: 1, min: 0, max: 1, step: 0.05 },
  ]},
  { id: 'halftone', label: 'Halftone', category: 'stylize', type: 'object', default: null, icon: 'Grid', params: [
    { key: 'dotSize', label: 'Dot Size', type: 'slider', default: 8, min: 2, max: 50 },
    { key: 'angle', label: 'Angle', type: 'slider', default: 0, min: 0, max: 360, unit: '°' },
    { key: 'softness', label: 'Softness', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
    { key: 'color1', label: 'Color 1', type: 'color', default: '#000000' },
    { key: 'color2', label: 'Color 2', type: 'color', default: '#ffffff' },
  ]},
  { id: 'dotMatrix', label: 'Dot Matrix', category: 'stylize', type: 'object', default: null, icon: 'Grid', params: [
    { key: 'tileSize', label: 'Tile Size', type: 'slider', default: 10, min: 2, max: 100 },
    { key: 'useOriginalColor', label: 'Warna Asli', type: 'toggle', default: true },
    { key: 'dotColor', label: 'Warna Dot', type: 'color', default: '#00ff00' },
    { key: 'shape', label: 'Shape', type: 'select', default: 'circle', options: [
      { value: 'circle', label: 'Bulat' }, { value: 'square', label: 'Persegi' },
    ]},
  ]},
  { id: 'chromaKey', label: 'Chroma Key', category: 'keying', type: 'object', default: null, icon: 'Layers', params: [
    { key: 'keyColor', label: 'Key Color', type: 'color', default: '#00ff00' },
    { key: 'threshold', label: 'Threshold', type: 'slider', default: 80, min: 0, max: 255 },
    { key: 'feather', label: 'Feather', type: 'slider', default: 0.1, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'lumaKey', label: 'Luma Key', category: 'keying', type: 'object', default: null, icon: 'Contrast', params: [
    { key: 'threshold', label: 'Threshold', type: 'slider', default: 128, min: 0, max: 255 },
    { key: 'feather', label: 'Feather', type: 'slider', default: 0.1, min: 0, max: 1, step: 0.01 },
    { key: 'invertKey', label: 'Invert', type: 'toggle', default: false },
  ]},
  { id: 'roughenEdge', label: 'Roughen Edge', category: 'stylize', type: 'object', default: null, icon: 'Triangle', params: [
    { key: 'scale', label: 'Scale', type: 'slider', default: 10, min: 1, max: 50 },
    { key: 'strength', label: 'Strength', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'border', label: 'Border', type: 'slider', default: 0.1, min: 0, max: 0.5, step: 0.01 },
    { key: 'speed', label: 'Speed', type: 'slider', default: 1, min: 0, max: 5, step: 0.1 },
  ]},

  { id: 'edgeGlow', label: 'Edge Glow', category: 'stylize', type: 'object', default: null, icon: 'ScanLine', params: [
    { key: 'color', label: 'Glow Color', type: 'color', default: '#00ffff' },
    { key: 'intensity', label: 'Intensity', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'width', label: 'Glow Width', type: 'slider', default: 5, min: 1, max: 30 },
    { key: 'threshold', label: 'Edge Threshold', type: 'slider', default: 0.1, min: 0, max: 0.5, step: 0.01 },
  ]},

  // ── Phase 4: Geometry ──
  { id: 'repeater', label: 'Repeater', category: 'transform', type: 'object', default: null, icon: 'Copy', params: [
    { key: 'count', label: 'Count', type: 'slider', default: 3, min: 1, max: 20 },
    { key: 'offsetX', label: 'Offset X', type: 'slider', default: 20, min: -500, max: 500 },
    { key: 'offsetY', label: 'Offset Y', type: 'slider', default: 20, min: -500, max: 500 },
    { key: 'rotation', label: 'Rotation', type: 'slider', default: 0, min: -180, max: 180, unit: '°' },
    { key: 'scale', label: 'Scale', type: 'slider', default: 1, min: 0.1, max: 3, step: 0.1 },
    { key: 'opacity', label: 'Opacity', type: 'slider', default: 1, min: 0, max: 1, step: 0.01 },
  ]},

  // ── Bonus ──
  { id: 'jpegDamage', label: 'JPEG Damage', category: 'stylize', type: 'object', default: null, icon: 'FileWarning', params: [
    { key: 'damage', label: 'Damage', type: 'slider', default: 0.4, min: 0, max: 1, step: 0.01 },
    { key: 'blockSize', label: 'Block Size', type: 'slider', default: 16, min: 4, max: 64 },
    { key: 'colorBleed', label: 'Color Bleed', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'quantize', label: 'Quantize', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'ringing', label: 'Ringing', type: 'slider', default: 0.2, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'filmDamage', label: 'Film Damage', category: 'stylize', type: 'object', default: null, icon: 'Film', params: [
    { key: 'grain', label: 'Grain', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'scratches', label: 'Scratches', type: 'slider', default: 0.4, min: 0, max: 1, step: 0.01 },
    { key: 'dust', label: 'Dust', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'flicker', label: 'Flicker', type: 'slider', default: 0.2, min: 0, max: 1, step: 0.01 },
    { key: 'vignette', label: 'Vignette', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'colorAge', label: 'Color Age', type: 'slider', default: 0.4, min: 0, max: 1, step: 0.01 },
  ]},
  { id: 'vhs', label: 'VHS Effect', category: 'stylize', type: 'object', default: null, icon: 'Tv', params: [
    { key: 'chromaOffset', label: 'Chroma Offset', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'jitter', label: 'Line Jitter', type: 'slider', default: 0.4, min: 0, max: 1, step: 0.01 },
    { key: 'syncLoss', label: 'Sync Loss', type: 'slider', default: 0.2, min: 0, max: 1, step: 0.01 },
    { key: 'noise', label: 'Snow Noise', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'scanlines', label: 'Scanlines', type: 'slider', default: 0.3, min: 0, max: 1, step: 0.01 },
    { key: 'colorBleed', label: 'Color Bleed', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'headSwitching', label: 'Head Switching', type: 'slider', default: 0.2, min: 0, max: 1, step: 0.01 },
    { key: 'fade', label: 'Fade/Wash', type: 'slider', default: 0.2, min: 0, max: 1, step: 0.01 },
  ]},
  // ── Text ──
  { id: 'letterSpacing', label: 'Letter Spacing', category: 'text', type: 'object', default: null, icon: 'Type', params: [
    { key: 'value', label: 'Spacing', type: 'slider', default: 0, min: -5, max: 20 },
  ]},
  { id: 'curve', label: 'Curve', category: 'text', type: 'object', default: null, icon: 'RotateCw', params: [
    { key: 'amount', label: 'Amount', type: 'slider', default: 0, min: -1, max: 1, step: 0.01 },
  ]},
  { id: 'stretch', label: 'Stretch', category: 'text', type: 'object', default: null, icon: 'Move', params: [
    { key: 'scaleX', label: 'Scale X', type: 'slider', default: 1, min: 0.3, max: 3, step: 0.1 },
    { key: 'scaleY', label: 'Scale Y', type: 'slider', default: 1, min: 0.3, max: 3, step: 0.1 },
    { key: 'skewX', label: 'Skew X', type: 'slider', default: 0, min: -1, max: 1, step: 0.05 },
    { key: 'skewY', label: 'Skew Y', type: 'slider', default: 0, min: -1, max: 1, step: 0.05 },
  ]},
  { id: 'waveWarp', label: 'Wave Warp', category: 'transform', type: 'object', default: null, icon: 'Wave', params: [
    { key: 'amplitude', label: 'Amplitude', type: 'slider', default: 20, min: 0, max: 100, unit: 'px' },
    { key: 'frequency', label: 'Frequency', type: 'slider', default: 5, min: 1, max: 50 },
    { key: 'speed', label: 'Speed', type: 'slider', default: 1, min: 0, max: 5, step: 0.1 },
    { key: 'rotation', label: 'Rotation', type: 'slider', default: 0, min: 0, max: 360, unit: '°' },
  ]},
]

export const getDefaultEffects = () => {
  const defaults = {}
  for (const effect of EFFECTS) defaults[effect.id] = effect.default
  return defaults
}

export const hasAnyEffect = (item) => {
  const effects = item.effects || {}
  for (const effect of EFFECTS) {
    const val = effects[effect.id]
    if (val === null || val === undefined) continue
    if (typeof val === 'boolean' && val) return true
    if (typeof val === 'number' && val !== 0) return true
    if (typeof val === 'object' && val !== null) return true
    if (typeof val === 'string' && val !== 'none' && val !== '') return true
  }
  return false
}

export const getActiveEffects = (item) => {
  const effects = item.effects || {}
  const active = []
  for (const effect of EFFECTS) {
    const val = effects[effect.id]
    const isActive =
      typeof val === 'boolean' ? val
      : typeof val === 'number' ? val !== 0
      : typeof val === 'object' ? val !== null
      : typeof val === 'string' ? val !== 'none' && val !== ''
      : false
    if (isActive) active.push({ ...effect, value: val })
  }
  return active
}

export const EFFECT_PARAM_DEFAULTS = {}
for (const effect of EFFECTS) {
  if (effect.params) {
    const defs = {}
    for (const p of effect.params) defs[p.key] = p.default
    EFFECT_PARAM_DEFAULTS[effect.id] = defs
  }
}
