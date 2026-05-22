# Technical Design Document

## Introduction

This document provides the technical design for enhancing the MoodSpace Workspace UX with improved zoom navigation, typography workflow, and font selection capabilities. The design focuses on creating a cinematic, immersive editing experience that matches modern design tools like Canva, Figma, and FigJam.

## System Architecture

### High-Level Architecture

The Workspace UX improvements follow a component-based architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Workspace Component                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Camera & Zoom Management                  │ │
│  │  • Camera State (x, y, scale)                         │ │
│  │  • Zoom Animation Engine                              │ │
│  │  • Viewport Bounds Calculation                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              UI Control Components                     │ │
│  │  • ZoomControlPill (bottom-right overlay)            │ │
│  │  • FontSidebar (right panel replacement)             │ │
│  │  • TextPanel (with typography previews)              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Font Management System                    │ │
│  │  • Font Registry (Google Fonts + System Fonts)       │ │
│  │  • Font Loader (async loading with fallback)         │ │
│  │  • Font Cache (session-based)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Initialization Flow**:
   - Workspace mounts → Calculate viewport dimensions
   - Set initial camera state: `{ scale: 0.75, x: centered, y: centered }`
   - Render canvas with 75% zoom before first paint

2. **Zoom Control Flow**:
   - User clicks zoom button → Calculate target camera state
   - Trigger `animateCameraTo(targetCamera)` → Smooth animation (80-120ms)
   - Update ZoomControlPill display in realtime during animation

3. **Font Selection Flow**:
   - User opens font picker → Replace right sidebar with FontSidebar
   - User clicks font → Check if Google Font → Load if needed (3s timeout)
   - Apply font to selected text object → Update Konva rendering
   - Cache loaded font for session

## Component Design

### 1. ZoomControlPill Component

**Purpose**: Provides visible zoom controls in the bottom-right corner of the viewport.

**Props**:
```javascript
{
  currentZoom: number,        // Current zoom scale (0.25 - 3.0)
  onZoomIn: () => void,       // Increase zoom by one step
  onZoomOut: () => void,      // Decrease zoom by one step
  onResetZoom: () => void,    // Reset to 75% and center
  minZoom: number,            // Minimum zoom limit (0.25)
  maxZoom: number             // Maximum zoom limit (3.0)
}
```

**State**:
- None (fully controlled component)

**Rendering Logic**:
```javascript
const zoomPercentage = Math.round(currentZoom * 100)
const canZoomOut = currentZoom > minZoom
const canZoomIn = currentZoom < maxZoom

return (
  <div className="zoom-control-pill">
    <button disabled={!canZoomOut} onClick={onZoomOut}>−</button>
    <span onClick={onResetZoom}>{zoomPercentage}%</span>
    <button disabled={!canZoomIn} onClick={onZoomIn}>+</button>
  </div>
)
```

**Styling**:
```css
.zoom-control-pill {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(18, 18, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  z-index: 100;
}

.zoom-control-pill button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(246, 247, 251, 0.9);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-control-pill button:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.25);
  transform: scale(1.1);
}

.zoom-control-pill button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-control-pill span {
  min-width: 48px;
  text-align: center;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 14px;
  color: rgba(246, 247, 251, 0.9);
  cursor: pointer;
  user-select: none;
}

.zoom-control-pill span:hover {
  color: #c084fc;
}
```

### 2. FontSidebar Component

**Purpose**: Dedicated sidebar for browsing and selecting fonts with visual previews.

**Props**:
```javascript
{
  selectedTextItem: CanvasItem | null,  // Currently selected text object
  currentFont: string,                   // Current font family of selected text
  onFontSelect: (fontFamily: string) => void,
  onClose: () => void
}
```

**State**:
```javascript
{
  fonts: FontItem[],           // List of available fonts
  loadingFonts: Set<string>,   // Fonts currently loading
  loadedFonts: Set<string>,    // Successfully loaded fonts
  searchQuery: string          // Font search filter
}
```

**Font Data Structure**:
```javascript
interface FontItem {
  family: string;           // Font family name (e.g., "Inter", "Playfair Display")
  category: string;         // Font category (e.g., "sans-serif", "serif", "display")
  source: 'google' | 'system';  // Font source
  variants?: string[];      // Available variants (e.g., ["400", "700", "400italic"])
  previewText?: string;     // Custom preview text
}
```

**Curated Font List**:
```javascript
const CURATED_FONTS = [
  // Google Fonts (prioritized)
  { family: 'Inter', category: 'sans-serif', source: 'google', variants: ['400', '600', '700'] },
  { family: 'Playfair Display', category: 'serif', source: 'google', variants: ['400', '700'] },
  { family: 'Poppins', category: 'sans-serif', source: 'google', variants: ['400', '600', '700'] },
  { family: 'Merriweather', category: 'serif', source: 'google', variants: ['400', '700'] },
  { family: 'Roboto Mono', category: 'monospace', source: 'google', variants: ['400', '700'] },
  { family: 'Bebas Neue', category: 'display', source: 'google', variants: ['400'] },
  { family: 'Lora', category: 'serif', source: 'google', variants: ['400', '700'] },
  { family: 'Montserrat', category: 'sans-serif', source: 'google', variants: ['400', '600', '700'] },
  
  // System Fonts (fallback)
  { family: 'Arial', category: 'sans-serif', source: 'system' },
  { family: 'Georgia', category: 'serif', source: 'system' },
  { family: 'Courier New', category: 'monospace', source: 'system' },
  { family: 'Times New Roman', category: 'serif', source: 'system' },
]
```

**Rendering Logic**:
```javascript
const filteredFonts = fonts.filter(font => 
  font.family.toLowerCase().includes(searchQuery.toLowerCase())
)

return (
  <div className="font-sidebar">
    <div className="font-sidebar-header">
      <h3>Fonts</h3>
      <button onClick={onClose} className="font-sidebar-close">
        <X size={20} />
      </button>
    </div>
    
    <div className="font-search">
      <Search size={16} />
      <input 
        type="text" 
        placeholder="Search fonts..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
    
    <div className="font-list">
      {filteredFonts.map(font => (
        <FontItem
          key={font.family}
          font={font}
          isSelected={currentFont === font.family}
          isLoading={loadingFonts.has(font.family)}
          isDisabled={!selectedTextItem}
          onClick={() => handleFontClick(font)}
        />
      ))}
    </div>
  </div>
)
```

### 3. FontItem Component

**Purpose**: Individual font list item with preview rendered in actual font.

**Props**:
```javascript
{
  font: FontItem,
  isSelected: boolean,
  isLoading: boolean,
  isDisabled: boolean,
  onClick: () => void
}
```

**Rendering Logic**:
```javascript
return (
  <button
    className={`font-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
    onClick={onClick}
    disabled={isDisabled}
  >
    <div className="font-preview" style={{ fontFamily: font.family }}>
      {font.previewText || 'The quick brown fox'}
    </div>
    <div className="font-info">
      <span className="font-name">{font.family}</span>
      <span className="font-category">{font.category}</span>
    </div>
    {isLoading && <Loader size={16} className="font-loading-spinner" />}
    {isSelected && <Check size={16} className="font-selected-icon" />}
  </button>
)
```

**Styling**:
```css
.font-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(18, 18, 20, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.font-item:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.4);
  transform: translateY(-2px);
}

.font-item.selected {
  background: rgba(124, 58, 237, 0.25);
  border-color: rgba(124, 58, 237, 0.6);
}

.font-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.font-preview {
  font-size: 18px;
  color: rgba(246, 247, 251, 0.95);
  line-height: 1.4;
}

.font-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.font-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(246, 247, 251, 0.85);
}

.font-category {
  font-size: 11px;
  color: rgba(246, 247, 251, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### 4. TextPanel Enhancement

**Purpose**: Add typography previews to existing text type options.

**Text Type Configuration**:
```javascript
const TEXT_TYPES = [
  {
    id: 'heading',
    label: 'Heading',
    preview: 'Heading',
    fontSize: 58,
    fontWeight: 'bold',
    fontFamily: 'Inter, Arial',
  },
  {
    id: 'subheading',
    label: 'Subheading',
    preview: 'Subheading',
    fontSize: 36,
    fontWeight: '600',
    fontFamily: 'Inter, Arial',
  },
  {
    id: 'body',
    label: 'Body Text',
    preview: 'Body Text',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter, Arial',
  },
  {
    id: 'quote',
    label: 'Quote',
    preview: 'Quote',
    fontSize: 24,
    fontStyle: 'italic',
    fontFamily: 'Georgia, serif',
  },
]
```

**Rendering Logic**:
```javascript
return (
  <div className="text-panel">
    <h4>Text Types</h4>
    <div className="text-type-list">
      {TEXT_TYPES.map(type => (
        <button
          key={type.id}
          className="text-type-option"
          onClick={() => onAddText(type)}
        >
          <span className="text-type-label">{type.label}</span>
          <span 
            className="text-type-preview"
            style={{
              fontFamily: type.fontFamily,
              fontSize: `${Math.min(type.fontSize / 3, 18)}px`,
              fontWeight: type.fontWeight,
              fontStyle: type.fontStyle,
            }}
          >
            {type.preview}
          </span>
        </button>
      ))}
    </div>
  </div>
)
```

**Styling**:
```css
.text-type-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(18, 18, 20, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.text-type-option:hover {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.4);
}

.text-type-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(246, 247, 251, 0.85);
}

.text-type-preview {
  color: rgba(246, 247, 251, 0.7);
  line-height: 1.2;
}
```

## Core Systems

### Camera & Zoom Management

**Camera State**:
```javascript
interface CameraState {
  x: number;      // Camera x position in viewport coordinates
  y: number;      // Camera y position in viewport coordinates
  scale: number;  // Zoom scale (0.25 - 3.0)
}
```

**Initial Camera Calculation**:
```javascript
const calculateInitialCamera = (viewportSize, canvasSize) => {
  const scale = 0.75  // Default 75% zoom
  const scaledCanvas = {
    width: canvasSize.width * scale,
    height: canvasSize.height * scale,
  }
  
  return {
    scale,
    x: (viewportSize.width - scaledCanvas.width) / 2,
    y: (viewportSize.height - scaledCanvas.height) / 2,
  }
}
```

**Zoom Step Calculation**:
```javascript
const ZOOM_SPEED = 1.08  // ~8% per step

const zoomIn = (currentCamera, viewportCenter) => {
  const nextScale = Math.min(currentCamera.scale * ZOOM_SPEED, maxZoom)
  return calculateZoomCamera(currentCamera, nextScale, viewportCenter)
}

const zoomOut = (currentCamera, viewportCenter) => {
  const nextScale = Math.max(currentCamera.scale / ZOOM_SPEED, minZoom)
  return calculateZoomCamera(currentCamera, nextScale, viewportCenter)
}

const calculateZoomCamera = (currentCamera, nextScale, zoomOrigin) => {
  // Zoom toward the specified origin point (viewport center for button zoom)
  const scaleRatio = nextScale / currentCamera.scale
  
  return {
    scale: nextScale,
    x: zoomOrigin.x - (zoomOrigin.x - currentCamera.x) * scaleRatio,
    y: zoomOrigin.y - (zoomOrigin.y - currentCamera.y) * scaleRatio,
  }
}
```

**Reset Zoom**:
```javascript
const resetZoom = (viewportSize, canvasSize) => {
  return calculateInitialCamera(viewportSize, canvasSize)
}
```

**Camera Bounds Clamping**:
```javascript
const clampCameraToCanvas = (camera, viewportSize, canvasSize) => {
  const scaledCanvas = {
    width: canvasSize.width * camera.scale,
    height: canvasSize.height * camera.scale,
  }
  
  const viewportPadding = Math.min(140, Math.max(44, Math.min(viewportSize.width, viewportSize.height) * 0.14))
  
  const clampAxis = (viewportLength, scaledLength, requestedPosition) => {
    if (scaledLength <= viewportLength - viewportPadding * 2) {
      // Canvas smaller than viewport: center it
      return (viewportLength - scaledLength) / 2
    }
    
    // Canvas larger than viewport: clamp with padding
    return clamp(
      requestedPosition,
      viewportLength - scaledLength - viewportPadding,
      viewportPadding
    )
  }
  
  return {
    scale: camera.scale,
    x: clampAxis(viewportSize.width, scaledCanvas.width, camera.x),
    y: clampAxis(viewportSize.height, scaledCanvas.height, camera.y),
  }
}
```

**Zoom Animation Engine**:
```javascript
const animateCameraTo = (targetCamera, currentCamera, onUpdate) => {
  // Cancel any existing animation
  if (zoomAnimationRef.current) {
    cancelAnimationFrame(zoomAnimationRef.current)
  }
  
  const fromCamera = targetCameraRef.current  // Start from last target, not current animated position
  targetCameraRef.current = clampCameraToCanvas(targetCamera)
  
  const startTime = performance.now()
  const duration = 95  // milliseconds (within 80-120ms requirement)
  
  const tick = (now) => {
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)
    
    // Cubic ease-out for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3)
    
    const interpolated = {
      scale: fromCamera.scale + (targetCameraRef.current.scale - fromCamera.scale) * eased,
      x: fromCamera.x + (targetCameraRef.current.x - fromCamera.x) * eased,
      y: fromCamera.y + (targetCameraRef.current.y - fromCamera.y) * eased,
    }
    
    onUpdate(interpolated)
    
    if (progress < 1) {
      zoomAnimationRef.current = requestAnimationFrame(tick)
    } else {
      zoomAnimationRef.current = null
    }
  }
  
  zoomAnimationRef.current = requestAnimationFrame(tick)
}
```

### Font Management System

**Font Loader**:
```javascript
class FontLoader {
  constructor() {
    this.loadedFonts = new Set()
    this.loadingPromises = new Map()
  }
  
  async loadGoogleFont(fontFamily, variants = ['400']) {
    // Check cache first
    if (this.loadedFonts.has(fontFamily)) {
      return { success: true, cached: true }
    }
    
    // Check if already loading
    if (this.loadingPromises.has(fontFamily)) {
      return this.loadingPromises.get(fontFamily)
    }
    
    // Start loading
    const loadPromise = this._loadFont(fontFamily, variants)
    this.loadingPromises.set(fontFamily, loadPromise)
    
    try {
      const result = await loadPromise
      this.loadedFonts.add(fontFamily)
      return result
    } finally {
      this.loadingPromises.delete(fontFamily)
    }
  }
  
  async _loadFont(fontFamily, variants) {
    const variantString = variants.join(',')
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${variantString}&display=swap`
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontUrl
      
      const timeout = setTimeout(() => {
        reject(new Error('Font load timeout'))
      }, 3000)  // 3 second timeout
      
      link.onload = () => {
        clearTimeout(timeout)
        // Wait for font to be ready
        document.fonts.ready.then(() => {
          resolve({ success: true, cached: false })
        })
      }
      
      link.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('Font load failed'))
      }
      
      document.head.appendChild(link)
    })
  }
  
  isLoaded(fontFamily) {
    return this.loadedFonts.has(fontFamily)
  }
}

const fontLoader = new FontLoader()
```

**Font Application Logic**:
```javascript
const handleFontSelect = async (font, selectedTextItem, updateItem) => {
  if (!selectedTextItem || selectedTextItem.kind !== 'text') {
    return
  }
  
  let fontFamily = font.family
  
  // Load Google Font if needed
  if (font.source === 'google' && !fontLoader.isLoaded(font.family)) {
    try {
      setLoadingFonts(prev => new Set(prev).add(font.family))
      await fontLoader.loadGoogleFont(font.family, font.variants)
    } catch (error) {
      console.warn(`Failed to load font ${font.family}, using fallback`)
      // Use system fallback
      fontFamily = `${font.family}, ${font.category}`
    } finally {
      setLoadingFonts(prev => {
        const next = new Set(prev)
        next.delete(font.family)
        return next
      })
    }
  }
  
  // Apply font to selected text
  updateItem(selectedTextItem.id, {
    fontFamily: font.source === 'system' 
      ? `${fontFamily}, ${font.category}`
      : `${fontFamily}, Arial`
  })
}
```

## Data Models

### Camera State Model
```javascript
interface CameraState {
  x: number;          // Camera x position in viewport coordinates
  y: number;          // Camera y position in viewport coordinates
  scale: number;      // Zoom scale (0.25 - 3.0)
}
```

### Font Item Model
```javascript
interface FontItem {
  family: string;              // Font family name
  category: string;            // Font category (sans-serif, serif, monospace, display)
  source: 'google' | 'system'; // Font source
  variants?: string[];         // Available font weights
  previewText?: string;        // Custom preview text
}
```

### Text Type Model
```javascript
interface TextType {
  id: string;           // Unique identifier
  label: string;        // Display label
  preview: string;      // Preview text
  fontSize: number;     // Default font size
  fontWeight?: string;  // Font weight
  fontStyle?: string;   // Font style (italic, normal)
  fontFamily: string;   // Default font family
}
```

## Integration Points

### 1. Workspace Component Integration

**State Additions**:
```javascript
const [camera, setCamera] = useState({ x: 0, y: 0, scale: 0.75 })
const [activePanel, setActivePanel] = useState('assets')  // Add 'fonts' option
const targetCameraRef = useRef(camera)
const zoomAnimationRef = useRef(null)
```

**Initialization Hook**:
```javascript
useEffect(() => {
  if (hasCenteredCameraRef.current || !viewportSize.width || !viewportSize.height) return
  
  hasCenteredCameraRef.current = true
  const initialCamera = calculateInitialCamera(viewportSize, canvasSize)
  targetCameraRef.current = initialCamera
  setCamera(initialCamera)
}, [viewportSize])
```

**Zoom Control Handlers**:
```javascript
const handleZoomIn = useCallback(() => {
  const viewportCenter = {
    x: viewportSize.width / 2,
    y: viewportSize.height / 2,
  }
  const nextCamera = zoomIn(camera, viewportCenter)
  animateCameraTo(nextCamera, camera, setCamera)
}, [camera, viewportSize])

const handleZoomOut = useCallback(() => {
  const viewportCenter = {
    x: viewportSize.width / 2,
    y: viewportSize.height / 2,
  }
  const nextCamera = zoomOut(camera, viewportCenter)
  animateCameraTo(nextCamera, camera, setCamera)
}, [camera, viewportSize])

const handleResetZoom = useCallback(() => {
  const nextCamera = resetZoom(viewportSize, canvasSize)
  animateCameraTo(nextCamera, camera, setCamera)
}, [camera, viewportSize])
```

**Font Sidebar Integration**:
```javascript
const handleOpenFontPicker = () => {
  setActivePanel('fonts')
  setIsRightPanelOpen(true)
}

const handleCloseFontSidebar = () => {
  setActivePanel('text')  // Return to text panel
  setIsRightPanelOpen(true)
}

// In right panel rendering
{activePanel === 'fonts' && (
  <FontSidebar
    selectedTextItem={selectedItem}
    currentFont={selectedItem?.fontFamily}
    onFontSelect={handleFontSelect}
    onClose={handleCloseFontSidebar}
  />
)}
```

### 2. Right Panel Layout

**Panel Switching Logic**:
```javascript
const renderRightPanel = () => {
  if (!isRightPanelOpen) return null
  
  switch (activePanel) {
    case 'fonts':
      return (
        <FontSidebar
          selectedTextItem={selectedItem}
          currentFont={selectedItem?.fontFamily}
          onFontSelect={handleFontSelect}
          onClose={handleCloseFontSidebar}
        />
      )
    
    case 'text':
      return (
        <TextPanel
          selectedItem={selectedItem}
          onAddText={handleAddText}
          onOpenFontPicker={handleOpenFontPicker}
          onUpdateText={updateItem}
        />
      )
    
    case 'assets':
      return <AssetsPanel {...assetsPanelProps} />
    
    default:
      return null
  }
}
```

## Error Handling

### Font Loading Errors

**Timeout Handling**:
```javascript
try {
  await fontLoader.loadGoogleFont(font.family, font.variants)
} catch (error) {
  if (error.message === 'Font load timeout') {
    console.warn(`Font ${font.family} timed out, using fallback`)
    // Apply with system fallback
    fontFamily = `${font.family}, ${font.category}`
  } else {
    console.error(`Font load failed: ${error.message}`)
    // Use pure system font
    fontFamily = font.category
  }
}
```

**Network Error Handling**:
```javascript
link.onerror = () => {
  clearTimeout(timeout)
  reject(new Error('Font load failed'))
}
```

### Zoom Animation Errors

**Animation Cleanup**:
```javascript
useEffect(() => {
  return () => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
    }
  }
}, [])
```

**Bounds Validation**:
```javascript
const clampCameraToCanvas = (camera, viewportSize, canvasSize) => {
  // Ensure scale is within bounds
  const clampedScale = clamp(camera.scale, minZoom, maxZoom)
  
  // Calculate clamped position
  // ... (see Camera Bounds Clamping section)
  
  return clampedCamera
}
```

## Performance Considerations

### Font Loading Optimization

1. **Session Caching**: Loaded fonts are cached in memory for the session duration
2. **Deduplication**: Multiple requests for the same font share a single loading promise
3. **Lazy Loading**: Fonts are only loaded when selected, not on sidebar open
4. **Timeout**: 3-second timeout prevents indefinite loading states

### Zoom Animation Optimization

1. **RAF-based Animation**: Uses `requestAnimationFrame` for smooth 60fps animation
2. **Animation Chaining**: Rapid zoom actions chain smoothly by starting from last target
3. **Early Termination**: Animation stops immediately when progress reaches 1.0
4. **Cleanup**: Animations are cancelled on component unmount

### Rendering Optimization

1. **Memoization**: Font list filtered with `useMemo` to prevent unnecessary recalculation
2. **Virtual Scrolling**: Consider implementing virtual scrolling for large font lists (future enhancement)
3. **Debounced Search**: Font search input debounced to reduce filtering operations

## Accessibility

### Keyboard Navigation

**Zoom Controls**:
- `Ctrl/Cmd + =`: Zoom in
- `Ctrl/Cmd + -`: Zoom out
- `Ctrl/Cmd + 0`: Reset zoom to 75%

**Font Sidebar**:
- `Tab`: Navigate between font items
- `Enter/Space`: Select focused font
- `Esc`: Close font sidebar
- `Arrow Up/Down`: Navigate font list

### Screen Reader Support

**ARIA Labels**:
```javascript
<button 
  aria-label="Zoom out" 
  disabled={camera.scale <= minZoom}
  onClick={handleZoomOut}
>
  −
</button>

<span 
  role="button"
  tabIndex={0}
  aria-label={`Current zoom: ${zoomPercentage}%. Click to reset to 75%`}
  onClick={handleResetZoom}
>
  {zoomPercentage}%
</span>

<button 
  aria-label="Zoom in" 
  disabled={camera.scale >= maxZoom}
  onClick={handleZoomIn}
>
  +
</button>
```

**Font Item Accessibility**:
```javascript
<button
  role="option"
  aria-selected={isSelected}
  aria-disabled={isDisabled}
  aria-label={`${font.family}, ${font.category} font`}
  onClick={onClick}
>
  {/* ... */}
</button>
```

### Color Contrast

All text elements meet WCAG AA standards:
- Zoom percentage: `rgba(246, 247, 251, 0.9)` on `rgba(18, 18, 20, 0.95)` = 14.2:1
- Font names: `rgba(246, 247, 251, 0.85)` on `rgba(18, 18, 20, 0.6)` = 12.8:1
- Disabled states: Minimum 4.5:1 contrast ratio maintained

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties. Many criteria are specific examples or integration tests rather than universal properties. The properties below represent the core invariants and universal behaviors that should hold across all inputs.

**Redundancy Analysis**:
- Properties 3.3 and 7.2 both test font rendering but at different scopes (zoom display vs font preview)
- Property 11.2 is a specific instance of camera centering calculation that applies universally
- Most requirements are example-based tests or integration tests, not universal properties

### Property 1: Zoom Percentage Display Format

*For any* zoom scale value between minZoom and maxZoom, the displayed zoom percentage SHALL be formatted as a whole number followed by the percent symbol.

**Validates: Requirements 3.3**

### Property 2: Font Preview Rendering

*For any* font in the font list, the rendered font item SHALL use the font's actual font family in its CSS fontFamily property.

**Validates: Requirements 7.2**

### Property 3: Camera Centering Calculation

*For any* viewport dimensions and canvas dimensions, when calculating the initial centered camera position, the camera x and y coordinates SHALL position the canvas center at the viewport center.

**Validates: Requirements 11.2**

## Testing Strategy

### Unit Tests

Unit tests will cover specific examples, edge cases, and component behavior:

1. **Zoom Control Tests**:
   - Initial zoom is 75%
   - Reset zoom returns to 75% and centers canvas
   - Zoom buttons disabled at min/max limits
   - Clicking percentage triggers reset
   - Zoom step calculations use correct zoom speed

2. **Font Sidebar Tests**:
   - Font sidebar replaces right panel when opened
   - Close button restores previous panel
   - Font items disabled when no text selected
   - Selected font highlighted in list
   - Google fonts appear before system fonts

3. **Font Loading Tests**:
   - Google font loading triggers API call
   - Font load timeout applies fallback
   - System fonts apply immediately
   - Loaded fonts cached for session
   - Duplicate load requests deduplicated

4. **Typography Preview Tests**:
   - Heading preview uses bold and larger size
   - Quote preview uses italic style
   - Paragraph preview uses smaller size
   - Preview fontFamily matches text type

5. **Camera Tests**:
   - Initial camera centers canvas at 75% zoom
   - Camera bounds clamping keeps canvas visible
   - Viewport resize maintains centered position
   - Centering only occurs once on initial load

### Property-Based Tests

Property tests will verify universal behaviors across randomized inputs:

1. **Property Test 1: Zoom Percentage Display Format**
   - Generate random scale values between 0.25 and 3.0
   - Verify displayed text matches `Math.round(scale * 100) + '%'`
   - Minimum 100 iterations

2. **Property Test 2: Font Preview Rendering**
   - Generate random font items with various family names
   - Verify each rendered item has `fontFamily: font.family` in style
   - Minimum 100 iterations

3. **Property Test 3: Camera Centering Calculation**
   - Generate random viewport and canvas dimensions
   - Calculate initial camera position
   - Verify canvas center aligns with viewport center
   - Minimum 100 iterations

### Integration Tests

Integration tests will verify external service interactions:

1. **Google Fonts API Integration**:
   - Verify correct font URL construction
   - Test network error handling
   - Verify font load timeout behavior

2. **Font Rendering Integration**:
   - Verify loaded fonts render correctly in Konva
   - Test fallback font rendering
   - Verify font cache persistence

### Manual Testing

Manual testing required for:

1. **Visual Quality**:
   - Zoom animation smoothness
   - Font preview visual accuracy
   - UI consistency with design system

2. **Performance**:
   - Font list scroll performance
   - Zoom animation frame rate
   - Font loading impact on UI responsiveness

3. **Accessibility**:
   - Keyboard navigation functionality
   - Screen reader announcements
   - Color contrast verification

## Implementation Notes

### Phase 1: Zoom Controls (Priority: High)

1. Create `ZoomControlPill` component
2. Add zoom control handlers to Workspace
3. Update initial camera state to 75%
4. Implement reset zoom functionality
5. Add zoom animation engine improvements

### Phase 2: Typography Previews (Priority: Medium)

1. Define text type configuration
2. Update TextPanel component with previews
3. Style typography preview elements

### Phase 3: Font Sidebar (Priority: High)

1. Create `FontLoader` utility class
2. Define curated font list
3. Create `FontSidebar` component
4. Create `FontItem` component
5. Integrate font sidebar into right panel
6. Implement font selection logic
7. Add font loading with timeout and fallback

### Phase 4: Polish & Testing (Priority: High)

1. Add keyboard shortcuts
2. Implement accessibility features
3. Write unit tests
4. Write property-based tests
5. Perform manual testing
6. Performance optimization

## Future Enhancements

1. **Font Search**: Add search/filter functionality to font sidebar
2. **Font Favorites**: Allow users to favorite frequently used fonts
3. **Custom Fonts**: Support uploading custom font files
4. **Font Pairing**: Suggest complementary font combinations
5. **Virtual Scrolling**: Optimize font list rendering for large lists
6. **Font Preview Customization**: Allow users to customize preview text
7. **Zoom Presets**: Add quick zoom preset buttons (50%, 100%, 200%)
8. **Fit to Screen**: Add button to fit canvas to viewport
