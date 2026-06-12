// ─── Canvas ratio presets ────────────────────────────────────────────────────
export const canvasRatioPresets = [
  { id: '16:9',   label: '16:9',   width: 1280, height: 720  },
  { id: '9:16',   label: '9:16',   width: 720,  height: 1280 },
  { id: '4:5',    label: '4:5',    width: 1080, height: 1350 },
  { id: '1:1',    label: '1:1',    width: 1080, height: 1080 },
  { id: '4:3',    label: '4:3',    width: 1200, height: 900  },
  { id: 'custom', label: 'Custom', width: 1280, height: 720  },
]

// ─── Connector presets ────────────────────────────────────────────────────────
export const connectorPresets = [
  { id: 'straight',       label: 'Straight',       pathType: 'straight', arrowHead: false },
  { id: 'straight-arrow', label: 'Straight Arrow', pathType: 'straight', arrowHead: true  },
  { id: 'elbow',          label: 'Elbow',          pathType: 'elbow',    arrowHead: false },
  { id: 'elbow-arrow',    label: 'Elbow Arrow',    pathType: 'elbow',    arrowHead: true  },
  { id: 'curve',          label: 'Curve',          pathType: 'curve',    arrowHead: false },
  { id: 'curve-arrow',    label: 'Curve Arrow',    pathType: 'curve',    arrowHead: true  },
]

// ─── Typography presets ───────────────────────────────────────────────────────
export const typographyPresets = [
  { label: 'Heading',    text: 'Heading',          size: 72, isBold: true,  isItalic: false, icon: 'H',  preview: 'Aa' },
  { label: 'Subheading', text: 'Subheading',       size: 48, isBold: true,  isItalic: false, icon: 'T',  preview: 'Aa' },
  { label: 'Paragraph',  text: 'Write something',  size: 28, isBold: false, isItalic: false, icon: 'P',  preview: 'Aa' },
  { label: 'Quote',      text: '"Add a quote"',    size: 36, isBold: false, isItalic: true,  icon: '"',  preview: '""' },
  { label: 'Label',      text: 'Label',            size: 18, isBold: false, isItalic: false, icon: 'L',  preview: 'Aa' },
]

// ─── System-only fonts (NOT on Google Fonts — used by preloadFont) ──────────
export const SYSTEM_FONTS = new Set([
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Palatino Linotype',
  'Lucida Console',
  'Comic Sans MS',
])

// ─── Available fonts ──────────────────────────────────────────────────────────
export const availableFonts = [
  { name: 'Inter',            family: 'Inter, Arial',              category: 'Sans Serif' },
  { name: 'Arial',            family: 'Arial',                     category: 'Sans Serif' },
  { name: 'Helvetica',        family: 'Helvetica, Arial',          category: 'Sans Serif' },
  { name: 'Georgia',          family: 'Georgia',                   category: 'Serif'      },
  { name: 'Times New Roman',  family: 'Times New Roman',           category: 'Serif'      },
  { name: 'Courier New',      family: 'Courier New',               category: 'Monospace'  },
  { name: 'Playfair Display', family: 'Playfair Display, Georgia', category: 'Serif'      },
  { name: 'Roboto',           family: 'Roboto, Arial',             category: 'Sans Serif' },
  { name: 'Open Sans',        family: 'Open Sans, Arial',          category: 'Sans Serif' },
  { name: 'Lato',             family: 'Lato, Arial',               category: 'Sans Serif' },
  { name: 'Montserrat',       family: 'Montserrat, Arial',         category: 'Sans Serif' },
  { name: 'Merriweather',     family: 'Merriweather, Georgia',     category: 'Serif'      },
]

// ─── Left-rail panel tools ────────────────────────────────────────────────────
// Icons are imported in the component, so we export IDs + labels only.
// The component maps these to actual icon components.
export const panelToolIds = [
  { id: 'elements', label: 'Elements' },
  { id: 'assets',   label: 'Assets'   },
  { id: 'text',     label: 'Text'     },
  { id: 'layers',   label: 'Layers'   },
  { id: 'settings', label: 'Settings' },
]

// ─── Connector anchor sides ───────────────────────────────────────────────────
export const connectorAnchorSides = ['top', 'right', 'bottom', 'left']

// ─── Blend modes (globalCompositeOperation values) ────────────────────────────
export const BLEND_MODES = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply',    label: 'Multiply' },
  { value: 'screen',      label: 'Screen' },
  { value: 'overlay',     label: 'Overlay' },
  { value: 'darken',      label: 'Darken' },
  { value: 'lighten',     label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn',  label: 'Color Burn' },
  { value: 'hard-light',  label: 'Hard Light' },
  { value: 'soft-light',  label: 'Soft Light' },
  { value: 'difference',  label: 'Difference' },
  { value: 'exclusion',   label: 'Exclusion' },
  { value: 'hue',         label: 'Hue' },
  { value: 'saturation',  label: 'Saturation' },
  { value: 'color',       label: 'Color' },
  { value: 'luminosity',  label: 'Luminosity' },
]