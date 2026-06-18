// Centralized Frame Library Registry
// Scalable architecture for frame assets

export const FRAME_LIBRARY = {
  basic: [
    {
      id: 'rectangle-frame',
      label: 'Rectangle Frame',
      frameType: 'rect',
      defaultProps: {
        width: 200,
        height: 250,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        cornerRadius: 0,
      },
      // Frame slot defines the image area
      frameSlot: {
        x: 0,
        y: 0,
        width: 200,
        height: 250,
        shape: 'rect',
        cornerRadius: 0,
      },
    },
    {
      id: 'rounded-frame',
      label: 'Rounded Frame',
      frameType: 'rect',
      defaultProps: {
        width: 200,
        height: 250,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        cornerRadius: 16,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 200,
        height: 250,
        shape: 'rect',
        cornerRadius: 16,
      },
    },
    {
      id: 'circle-frame',
      label: 'Circle Frame',
      frameType: 'circle',
      defaultProps: {
        radius: 120,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 240,
        height: 240,
        shape: 'circle',
        radius: 120,
      },
    },
    {
      id: 'arch-frame',
      label: 'Arch Frame',
      frameType: 'arch',
      defaultProps: {
        width: 200,
        height: 250,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        archRadius: 100,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 200,
        height: 250,
        shape: 'arch',
        archRadius: 100,
      },
    },
  ],

  polaroid: [
    {
      id: 'white-polaroid',
      label: 'White Polaroid',
      frameType: 'polaroid',
      defaultProps: {
        width: 200,
        height: 240,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 1,
        padding: 16,
        bottomPadding: 50,
      },
      // Polaroid slot is INSET from outer frame
      frameSlot: {
        x: 16,
        y: 16,
        width: 168, // 200 - 16*2
        height: 174, // 240 - 16 - 50
        shape: 'rect',
        cornerRadius: 0,
      },
    },
    {
      id: 'tape-polaroid',
      label: 'Tape Polaroid',
      frameType: 'polaroid-tape',
      defaultProps: {
        width: 200,
        height: 240,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 1,
        padding: 16,
        bottomPadding: 50,
        tapeColor: '#f5f1e8',
      },
      frameSlot: {
        x: 16,
        y: 16,
        width: 168,
        height: 174,
        shape: 'rect',
        cornerRadius: 0,
      },
    },
    {
      id: 'stacked-polaroid',
      label: 'Stacked Polaroid',
      frameType: 'polaroid-stacked',
      defaultProps: {
        width: 200,
        height: 240,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 1,
        padding: 16,
        bottomPadding: 50,
        stackOffset: 12,
      },
      frameSlot: {
        x: 16,
        y: 16,
        width: 168,
        height: 174,
        shape: 'rect',
        cornerRadius: 0,
      },
    },
  ],

  film: [
// REPLACE: id: 'film-strip-vertical' object
{
  id: 'film-strip-vertical',
  label: 'Film Strip Vertical',
  frameType: 'film-vertical',
  defaultProps: {
    width: 180,
    height: 280,
    fill: '#1c1c1c',
    stroke: '#111111',
    strokeWidth: 1,
    sprocketHoles: 7,
    sprocketStyle: 'rect',     // ← rectangular, lebih realistis
    showFrameNumbers: true,    // ← nomor frame
    edgeStripeWidth: 18,       // ← lebar area sprocket kiri/kanan
  },
  frameSlot: {
    x: 18,
    y: 8,
    width: 144,                // 180 - 18*2
    height: 264,
    shape: 'rect',
    cornerRadius: 0,
  },
},
// REPLACE: id: 'film-strip-horizontal' object
{
  id: 'film-strip-horizontal',
  label: 'Film Strip Horizontal',
  frameType: 'film-horizontal',
  defaultProps: {
    width: 320,
    height: 160,               // ← lebih cinematic (2:1 ratio)
    fill: '#1c1c1c',
    stroke: '#111111',
    strokeWidth: 1,
    sprocketHoles: 10,
    sprocketStyle: 'rect',
    showFrameNumbers: true,
    edgeStripeWidth: 16,
  },
  frameSlot: {
    x: 8,
    y: 16,
    width: 304,
    height: 128,               // 160 - 16*2
    shape: 'rect',
    cornerRadius: 0,
  },
},
    {
      id: 'cinema-frame',
      label: 'Cinema Frame',
      frameType: 'cinema',
      defaultProps: {
        width: 320,
        height: 180,
        fill: '#000000',
        topBarHeight: 30,
        bottomBarHeight: 30,
      },
      frameSlot: {
        x: 0,
        y: 30,
        width: 320,
        height: 120, // 180 - 30 - 30
        shape: 'rect',
        cornerRadius: 0,
      },
    },
  ],

  grid: [
    {
      id: 'grid-2',
      label: '2 Grid',
      frameType: 'grid-2',
      defaultProps: {
        width: 300,
        height: 200,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        gap: 8,
        columns: 2,
        rows: 1,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 300,
        height: 200,
        shape: 'rect',
        cornerRadius: 0,
      },
    },
    {
      id: 'grid-3',
      label: '3 Grid',
      frameType: 'grid-3',
      defaultProps: {
        width: 300,
        height: 200,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        gap: 8,
        columns: 3,
        rows: 1,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 300,
        height: 200,
        shape: 'rect',
        cornerRadius: 0,
      },
    },
    {
      id: 'collage-grid',
      label: 'Collage Grid',
      frameType: 'grid-collage',
      defaultProps: {
        width: 300,
        height: 300,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        gap: 8,
        columns: 2,
        rows: 2,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        shape: 'rect',
        cornerRadius: 0,
      },
    },
    {
      id: 'asymmetrical-grid',
      label: 'Asymmetrical Grid',
      frameType: 'grid-asymmetric',
      defaultProps: {
        width: 300,
        height: 300,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        gap: 8,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        shape: 'rect',
        cornerRadius: 0,
      },
    },
  ],

  organic: [
    {
      id: 'blob-frame',
      label: 'Blob Frame',
      frameType: 'blob',
      defaultProps: {
        width: 220,
        height: 220,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        blobPath: 'M 40 10 C 60 -10, 110 30, 90 70 C 70 110, 20 100, 10 60 C 0 20, 20 30, 40 10 Z',
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 220,
        height: 220,
        shape: 'blob',
        cornerRadius: 55,
      },
    },
    {
      id: 'wave-frame',
      label: 'Wave Frame',
      frameType: 'wave',
      defaultProps: {
        width: 240,
        height: 200,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
        waveAmplitude: 20,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 240,
        height: 200,
        shape: 'wave',
        cornerRadius: 60,
      },
    },
    {
      id: 'liquid-frame',
      label: 'Liquid Frame',
      frameType: 'liquid',
      defaultProps: {
        width: 220,
        height: 240,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 2,
      },
      frameSlot: {
        x: 0,
        y: 0,
        width: 220,
        height: 240,
        shape: 'liquid',
        cornerRadius: 55,
      },
    },
  ],

  device: [
// REPLACE: id: 'phone-frame' object
{
  id: 'phone-frame',
  label: 'iPhone Frame',
  frameType: 'phone',
  defaultProps: {
    width: 180,
    height: 360,
    fill: '#1a1a1a',
    stroke: '#2a2a2a',
    strokeWidth: 8,
    cornerRadius: 40,          // ← lebih rounded, iPhone-style
    dynamicIsland: true,       // ← pill shape, bukan notch
    islandWidth: 72,
    islandHeight: 22,
    volumeButtons: true,       // ← tombol volume kiri
    sideButton: true,          // ← power button kanan
  },
  frameSlot: {
    x: 0,
    y: 0,
    width: 180,
    height: 360,
    shape: 'rect',
    cornerRadius: 32,
  },
},
    {
      id: 'tablet-frame',
      label: 'Tablet Frame',
      frameType: 'tablet',
      defaultProps: {
        width: 280,
        height: 360,
        fill: '#1a1a1a',
        stroke: '#0a0a0a',
        strokeWidth: 12,
        cornerRadius: 16,
      },
      frameSlot: {
        x: 12,
        y: 12,
        width: 256, // 280 - 12*2
        height: 336, // 360 - 12*2
        shape: 'rect',
        cornerRadius: 8,
      },
    },
    {
      id: 'browser-window',
      label: 'Browser Window',
      frameType: 'browser',
      defaultProps: {
        width: 400,
        height: 300,
        fill: '#ffffff',
        stroke: '#e5e5e5',
        strokeWidth: 1,
        headerHeight: 32,
        headerColor: '#f5f5f5',
        cornerRadius: 8,
      },
      // Browser slot is below header
      frameSlot: {
        x: 0,
        y: 32,
        width: 400,
        height: 268, // 300 - 32
        shape: 'rect',
        cornerRadius: 0,
      },
    },
    {
      id: 'desktop-mockup',
      label: 'Desktop Mockup',
      frameType: 'desktop',
      defaultProps: {
        width: 400,
        height: 280,
        fill: '#1a1a1a',
        stroke: '#0a0a0a',
        strokeWidth: 16,
        cornerRadius: 4,
        standHeight: 40,
      },
      frameSlot: {
        x: 16,
        y: 16,
        width: 368, // 400 - 16*2
        height: 224, // 280 - 40 - 16
        shape: 'rect',
        cornerRadius: 0,
      },
    },
  ],
}

// Category metadata
export const FRAME_CATEGORIES = [
  { id: 'basic', label: 'Basic Frames', icon: 'Square' },
  { id: 'polaroid', label: 'Polaroid', icon: 'Image' },
  { id: 'film', label: 'Film', icon: 'Film' },
  { id: 'grid', label: 'Grid', icon: 'Grid3x3' },
  { id: 'organic', label: 'Organic Frames', icon: 'Sparkles' },
  { id: 'device', label: 'Device Mockups', icon: 'Smartphone' },
]

// Get all frames from a category
export const getFramesByCategory = (categoryId) => {
  return FRAME_LIBRARY[categoryId] || []
}

// Get all categories
export const getAllFrameCategories = () => {
  return FRAME_CATEGORIES
}

// Get frame by ID
export const getFrameById = (frameId) => {
  for (const category of Object.values(FRAME_LIBRARY)) {
    const frame = category.find(f => f.id === frameId)
    if (frame) return frame
  }
  return null
}
