export const ADJUSTMENT_CONTROLS = [
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, unit: '' },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100, unit: '' },
  { key: 'hue', label: 'Hue', min: -180, max: 180, unit: '°' },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, unit: '' },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, unit: '' },
  { key: 'whites', label: 'Whites', min: -100, max: 100, unit: '' },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, unit: '' },
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, unit: '' },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, unit: '%' },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, unit: '' },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100, unit: '' },
  { key: 'blur', label: 'Blur', min: 0, max: 24, unit: 'px' },
]

export const ADJUSTMENT_PRESETS = [
  { label: 'Cinematic', values: { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: 8, contrast: 12, saturation: 8, sharpen: 0, vignette: 0, blur: 0 } },
  { label: 'Muted', values: { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: -4, contrast: -8, saturation: -22, sharpen: 0, vignette: 0, blur: 0 } },
  { label: 'Dreamy', values: { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: 10, contrast: -6, saturation: 16, sharpen: 0, vignette: 0, blur: 1 } },
  { label: 'Noir', values: { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: -8, contrast: 28, saturation: -100, sharpen: 0, vignette: 0, blur: 0 } },
  { label: 'Vibrant', values: { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: 4, contrast: 18, saturation: 28, sharpen: 0, vignette: 0, blur: 0 } },
]

export const RESET_VALUES = {
  exposure: 0, temperature: 0, highlights: 0, shadows: 0,
  whites: 0, blacks: 0, brightness: 0, contrast: 0,
  saturation: 0, sharpen: 0, vignette: 0, blur: 0,
  hue: 0, shadow: 0, radius: 0,
}

export const getActiveAdjustmentLayers = (items) =>
  items.filter((item) => item.isAdjustmentLayer)

export const hasAnyAdjustment = (item) =>
  ADJUSTMENT_CONTROLS.some((c) => (item[c.key] ?? 0) !== 0)
