import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowDown,
  ArrowUp,
  Bold,
  Box,
  Circle as CircleIcon,
  Compass,
  FolderOpen,
  GripVertical,
  Grid3X3,
  Home,
  Eye,
  EyeOff,
  Layers,
  Lock,
  MessageSquarePlus,
  MousePointer2,
  Plus,
  Search,
  Settings,
  Share2,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  Unlock,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  Square as SquareIcon,
  Triangle as TriangleIcon,
  Star as StarIcon,
  ArrowUpRight as ArrowUpRightIcon,
  Minus as MinusIcon,
  Diamond as DiamondIcon,
  Hexagon as HexagonIcon,
  Cloud as CloudIcon,
} from 'lucide-react'
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage, Line, Transformer, Circle, RegularPolygon, Star, Arrow, Path } from 'react-konva'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ZoomControlPill from '../components/ZoomControlPill'
import { imageSources } from '../utils/imageSources'
import { getAllBoards } from '../data/mockBoards'
import { getAssetsByBoardId } from '../data/mockAssets'
import { SHAPE_LIBRARY, SHAPE_CATEGORIES, getShapesByCategory } from '../data/shapeLibrary'
import { FRAME_LIBRARY, FRAME_CATEGORIES, getFramesByCategory, getFrameById } from '../data/frameLibrary'

const canvasSize = { width: 1280, height: 720 }
const canvasBounds = { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height }
const virtualWorkspace = { x: -2600, y: -2200, width: 6200, height: 5200 }
const minZoom = 0.25
const maxZoom = 3
const zoomSpeed = 1.08
const imageMaxSize = 280

const toImageAsset = (asset, overrides = {}) => ({
  title: asset.title,
  type: 'image',
  source: imageSources[asset.imageUrl],
  imageKey: asset.imageUrl,
  w: asset.aspectRatio >= 1 ? 230 : 170,
  h: asset.aspectRatio >= 1 ? Math.round(230 / asset.aspectRatio) : 230,
  boardId: asset.boardId,
  ...overrides,
})

const assetLibrary = [
  { title: 'Inspiration', type: 'image', source: imageSources['project-art-chromatic'], w: 220, h: 150 },
  { title: 'UI Kits', type: 'image', source: imageSources['project-art-nexus'], w: 210, h: 140 },
  { title: 'Photography', type: 'image', source: imageSources['art-1'], w: 180, h: 220 },
  { title: 'Textures', type: 'image', source: imageSources['art-5'], w: 190, h: 190 },
  { title: 'Typography', type: 'text', text: 'Aa', w: 190, h: 130 },
  { title: 'Community Picks', type: 'note', text: 'Concept note', w: 190, h: 130 },
]

const initialItems = [
]

const connectors = [
]

const workspaceGridLines = (() => {
  const lines = []
  const gridSize = 120
  const startX = Math.ceil(virtualWorkspace.x / gridSize) * gridSize
  const endX = virtualWorkspace.x + virtualWorkspace.width
  const startY = Math.ceil(virtualWorkspace.y / gridSize) * gridSize
  const endY = virtualWorkspace.y + virtualWorkspace.height

  for (let x = startX; x <= endX; x += gridSize) {
    lines.push([x, virtualWorkspace.y, x, endY])
  }

  for (let y = startY; y <= endY; y += gridSize) {
    lines.push([virtualWorkspace.x, y, endX, y])
  }

  return lines
})()

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const getClampedCanvasPosition = (w, h, position) => ({
  x: clamp(position.x, canvasBounds.x - w + 24, canvasBounds.x + canvasBounds.width - 24),
  y: clamp(position.y, canvasBounds.y - h + 24, canvasBounds.y + canvasBounds.height - 24),
})

const getCanvasContainedSize = (requestedWidth, requestedHeight) => {
  const scale = Math.min(canvasBounds.width / requestedWidth, canvasBounds.height / requestedHeight, 1)

  return {
    w: Math.max(40, requestedWidth * scale),
    h: Math.max(40, requestedHeight * scale),
  }
}

const getContainedImageSize = ({ naturalWidth, naturalHeight }, maxSize = imageMaxSize) => {
  const safeWidth = naturalWidth || maxSize
  const safeHeight = naturalHeight || maxSize
  const scale = Math.min(maxSize / safeWidth, maxSize / safeHeight, 1)

  return {
    w: Math.round(safeWidth * scale),
    h: Math.round(safeHeight * scale),
    aspectRatio: safeWidth / safeHeight,
  }
}

const loadImageMetadata = (src) => new Promise((resolve) => {
  const image = new window.Image()

  image.onload = () => resolve(getContainedImageSize(image))
  image.onerror = () => resolve(getContainedImageSize({ naturalWidth: imageMaxSize, naturalHeight: imageMaxSize }))
  image.src = src
})

// FIX: Font preloading utility — ensures font is available in the browser
// before Konva renders the Text node. Without this, fonts may render with
// a fallback first and then re-render incorrectly (especially with stroke).
const fontLoadCache = new Map()
const preloadFont = (fontFamily) => {
  if (!fontFamily || fontLoadCache.has(fontFamily)) return fontLoadCache.get(fontFamily) || Promise.resolve()
  const primaryFont = fontFamily.split(',')[0].trim()
  const promise = document.fonts.load(`16px "${primaryFont}"`).catch(() => { })
  fontLoadCache.set(fontFamily, promise)
  return promise
}

const panelTools = [
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'assets', label: 'Assets', icon: FolderOpen },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// FIX: Improved typography preset hierarchy — Heading is bold/large, Subheading is
// semibold/medium, Paragraph is regular, matching Canva/Figma visual hierarchy.
const typographyPresets = [
  { label: 'Heading', text: 'Heading', size: 72, isBold: true, isItalic: false, icon: 'H', preview: 'Aa' },
  { label: 'Subheading', text: 'Subheading', size: 48, isBold: true, isItalic: false, icon: 'T', preview: 'Aa' },
  { label: 'Paragraph', text: 'Write something', size: 28, isBold: false, isItalic: false, icon: 'P', preview: 'Aa' },
  { label: 'Quote', text: '"Add a quote"', size: 36, isBold: false, isItalic: true, icon: '"', preview: '""' },
  { label: 'Label', text: 'Label', size: 18, isBold: false, isItalic: false, icon: 'L', preview: 'Aa' },
]

const availableFonts = [
  { name: 'Inter', family: 'Inter, Arial', category: 'Sans Serif' },
  { name: 'Arial', family: 'Arial', category: 'Sans Serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial', category: 'Sans Serif' },
  { name: 'Georgia', family: 'Georgia', category: 'Serif' },
  { name: 'Times New Roman', family: 'Times New Roman', category: 'Serif' },
  { name: 'Courier New', family: 'Courier New', category: 'Monospace' },
  { name: 'Playfair Display', family: 'Playfair Display, Georgia', category: 'Serif' },
  { name: 'Roboto', family: 'Roboto, Arial', category: 'Sans Serif' },
  { name: 'Open Sans', family: 'Open Sans, Arial', category: 'Sans Serif' },
  { name: 'Lato', family: 'Lato, Arial', category: 'Sans Serif' },
  { name: 'Montserrat', family: 'Montserrat, Arial', category: 'Sans Serif' },
  { name: 'Merriweather', family: 'Merriweather, Georgia', category: 'Serif' },
]

const navItems = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Boards', to: '/boards', icon: Grid3X3 },
]

// Sortable Layer Item Component for drag & drop
function SortableLayerItem({ item, isSelected, onSelect, onToggleVisibility, onToggleLock, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Get layer icon based on item kind
  const getLayerIcon = () => {
    switch (item.kind) {
      case 'text':
        return <Type size={16} />
      case 'image':
        return <Box size={16} />
      case 'note':
        return <MessageSquarePlus size={16} />
      case 'card':
        return <Box size={16} />
      case 'palette':
        return <Circle size={16} />
      default:
        return <Layers size={16} />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`workspace-layer-item ${isSelected ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <button
        type="button"
        className="workspace-layer-drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <button
        type="button"
        className="workspace-layer-main"
        onClick={() => onSelect(item.id)}
      >
        <span className="workspace-layer-icon">{getLayerIcon()}</span>
        <span className="workspace-layer-label">{item.id}</span>
      </button>
      <button
        type="button"
        className="workspace-layer-action"
        aria-label="Toggle visibility"
        onClick={() => onToggleVisibility(item.id)}
      >
        {item.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button
        type="button"
        className="workspace-layer-action"
        aria-label="Toggle lock"
        onClick={() => onToggleLock(item.id)}
      >
        {item.locked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
      <button
        type="button"
        className="workspace-layer-action workspace-layer-delete"
        aria-label="Delete layer"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

function useCanvasImage(src) {
  const [image, setImage] = useState(null)

  useEffect(() => {
    if (!src) {
      Promise.resolve().then(() => setImage(null))
      return undefined
    }

    const nextImage = new window.Image()
    nextImage.src = src
    nextImage.onload = () => setImage(nextImage)
    nextImage.onerror = () => setImage(null)
  }, [src])

  return image
}

const getFrameDefaultSize = (frameData) => {
  if (!frameData) return { width: 200, height: 250 }
  if (frameData.defaultProps.width && frameData.defaultProps.height) {
    return { width: frameData.defaultProps.width, height: frameData.defaultProps.height }
  }
  if (frameData.defaultProps.radius) {
    return { width: frameData.defaultProps.radius * 2, height: frameData.defaultProps.radius * 2 }
  }
  return { width: 200, height: 250 }
}

const getResolvedFrameSlot = (item) => {
  const frameData = getFrameById(item.frameId)
  const sourceSlot = frameData?.frameSlot || item.frameSlot
  if (!sourceSlot) return { x: 0, y: 0, width: item.w, height: item.h, shape: 'rect', cornerRadius: item.cornerRadius || 0 }

  const baseSize = getFrameDefaultSize(frameData)
  const scaleX = item.w / baseSize.width
  const scaleY = item.h / baseSize.height
  const radiusScale = Math.min(scaleX, scaleY)

  return {
    x: sourceSlot.x * scaleX,
    y: sourceSlot.y * scaleY,
    width: sourceSlot.width * scaleX,
    height: sourceSlot.height * scaleY,
    shape: sourceSlot.shape || 'rect',
    cornerRadius: (sourceSlot.cornerRadius || 0) * radiusScale,
    radius: sourceSlot.radius ? sourceSlot.radius * radiusScale : undefined,
    archRadius: sourceSlot.archRadius ? sourceSlot.archRadius * radiusScale : undefined,
  }
}

const roundedRectPath = (ctx, x, y, width, height, radius = 0) => {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  if (safeRadius <= 0) {
    ctx.rect(x, y, width, height)
    return
  }

  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
}

const applyFrameSlotClip = (frameSlot) => {
  if (!frameSlot) return undefined

  return (ctx) => {
    const { x, y, width, height } = frameSlot
    ctx.beginPath()

    if (frameSlot.shape === 'circle') {
      ctx.arc(x + width / 2, y + height / 2, frameSlot.radius || Math.min(width, height) / 2, 0, Math.PI * 2)
    } else if (frameSlot.shape === 'arch') {
      const archRadius = frameSlot.archRadius || width / 2
      ctx.moveTo(x, y + archRadius)
      ctx.arc(x + width / 2, y + archRadius, archRadius, Math.PI, 0)
      ctx.lineTo(x + width, y + height)
      ctx.lineTo(x, y + height)
      ctx.closePath()
    } else {
      roundedRectPath(ctx, x, y, width, height, frameSlot.cornerRadius || (['blob', 'wave', 'liquid'].includes(frameSlot.shape) ? width / 4 : 0))
    }

    ctx.closePath()
  }
}

const calculateCoverFit = ({ imageWidth, imageHeight, slot, fit = 'cover', crop = { x: 0, y: 0 }, zoom = 1 }) => {
  if (!imageWidth || !imageHeight || !slot) return null

  const baseScale = fit === 'contain'
    ? Math.min(slot.width / imageWidth, slot.height / imageHeight)
    : Math.max(slot.width / imageWidth, slot.height / imageHeight)
  const scale = baseScale * (zoom || 1)
  const renderedWidth = imageWidth * scale
  const renderedHeight = imageHeight * scale

  return {
    x: slot.x + (slot.width - renderedWidth) / 2 + (crop?.x || 0),
    y: slot.y + (slot.height - renderedHeight) / 2 + (crop?.y || 0),
    width: renderedWidth,
    height: renderedHeight,
    scale,
  }
}

const renderFramePlaceholder = (frameSlot, isDropTarget) => (
  <Group listening={false}>
    <Rect
      x={frameSlot.x}
      y={frameSlot.y}
      width={frameSlot.width}
      height={frameSlot.height}
      cornerRadius={frameSlot.cornerRadius || 0}
      fill={isDropTarget ? '#f1e5ff' : '#f2f2f2'}
      opacity={0.82}
    />
    <Rect
      x={frameSlot.x + 0.5}
      y={frameSlot.y + 0.5}
      width={Math.max(0, frameSlot.width - 1)}
      height={Math.max(0, frameSlot.height - 1)}
      cornerRadius={frameSlot.cornerRadius || 0}
      stroke={isDropTarget ? '#a970ff' : '#c7c7c7'}
      strokeWidth={isDropTarget ? 2 : 1.5}
      dash={[7, 6]}
      opacity={0.9}
    />
    <Rect
      x={frameSlot.x + frameSlot.width / 2 - 22}
      y={frameSlot.y + frameSlot.height / 2 - 20}
      width={44}
      height={38}
      cornerRadius={7}
      stroke={isDropTarget ? '#8d5cf5' : '#9b9b9b'}
      strokeWidth={2}
      opacity={0.92}
    />
    <Circle
      x={frameSlot.x + frameSlot.width / 2 - 9}
      y={frameSlot.y + frameSlot.height / 2 - 9}
      radius={4}
      fill={isDropTarget ? '#8d5cf5' : '#9b9b9b'}
      opacity={0.92}
    />
    <Line
      points={[
        frameSlot.x + frameSlot.width / 2 - 17,
        frameSlot.y + frameSlot.height / 2 + 9,
        frameSlot.x + frameSlot.width / 2 - 4,
        frameSlot.y + frameSlot.height / 2 - 3,
        frameSlot.x + frameSlot.width / 2 + 17,
        frameSlot.y + frameSlot.height / 2 + 11,
      ]}
      stroke={isDropTarget ? '#8d5cf5' : '#9b9b9b'}
      strokeWidth={2}
      lineCap="round"
      lineJoin="round"
      opacity={0.92}
    />
  </Group>
)

const renderFrameImage = (frameImage, frameSlot, item, isEditing, onImageDragEnd) => {
  const fit = calculateCoverFit({
    imageWidth: frameImage.width,
    imageHeight: frameImage.height,
    slot: frameSlot,
    fit: item.frameImageFit || 'cover',
    crop: item.frameImagePosition,
    zoom: item.frameImageScale || 1,
  })
 
  if (!fit) return null
 
  return (
    <KonvaImage
      image={frameImage}
      x={fit.x}
      y={fit.y}
      width={fit.width}
      height={fit.height}
      draggable={isEditing}
      listening={isEditing}
      // FIX: Batasi drag gambar agar frame tidak ikut glitch
      // dragBoundFunc bekerja di koordinat stage, bukan lokal
      dragBoundFunc={(pos) => {
        // Kembalikan posisi apa adanya — kita handle di onDragEnd
        // Ini mencegah Konva menggeser parent Group
        return pos
      }}
      onDragStart={(e) => {
        // Simpan posisi absolut saat drag mulai
        e.target._fitX = fit.x
        e.target._fitY = fit.y
        // Cegah event naik ke parent Group (yang akan menggeser frame)
        e.cancelBubble = true
      }}
      onDragEnd={(e) => {
        if (!isEditing || !onImageDragEnd) return
        e.cancelBubble = true
 
        // Hitung delta dari posisi fit yang tersimpan saat drag start
        const startFitX = e.target._fitX ?? fit.x
        const startFitY = e.target._fitY ?? fit.y
        const dx = e.target.x() - startFitX
        const dy = e.target.y() - startFitY
 
        // WAJIB: Reset posisi node dulu sebelum state update
        // Ini mencegah glitch karena Konva render 2x
        e.target.x(startFitX)
        e.target.y(startFitY)
        e.target.getLayer()?.batchDraw()
 
        onImageDragEnd({
          x: (item.frameImagePosition?.x || 0) + dx,
          y: (item.frameImagePosition?.y || 0) + dy,
        })
      }}
      onMouseEnter={(e) => {
        if (isEditing) e.target.getStage().container().style.cursor = 'grab'
      }}
      onMouseLeave={(e) => {
        if (isEditing) e.target.getStage().container().style.cursor = 'default'
      }}
      onMouseDown={(e) => {
        if (isEditing) {
          e.target.getStage().container().style.cursor = 'grabbing'
          // Cegah event mousedown naik ke stage (akan trigger pan/deselect)
          e.cancelBubble = true
        }
      }}
      onMouseUp={(e) => {
        if (isEditing) e.target.getStage().container().style.cursor = 'grab'
      }}
    />
  )
}

const renderFrameSlot = ({ item, frameImage, frameSlot, isDropTarget, isEditing, onImageDragEnd }) => (
  <Group
    clipFunc={applyFrameSlotClip(frameSlot)}
    listening={isEditing} // FIX: hanya aktif saat edit mode
  >
    {frameImage
      ? renderFrameImage(frameImage, frameSlot, item, isEditing, onImageDragEnd)
      : renderFramePlaceholder(frameSlot, isDropTarget)
    }
  </Group>
)

const renderFrameBackground = (item, shadowProps) => {
  if (item.frameType === 'circle') {
    return (
      <Circle
        x={item.w / 2}
        y={item.h / 2}
        radius={Math.min(item.w, item.h) / 2}
        fill={item.fill || '#ffffff'}
        {...shadowProps}
      />
    )
  }

  if (item.frameType === 'phone' || item.frameType === 'tablet') {
    return <Rect width={item.w} height={item.h} cornerRadius={item.cornerRadius || 20} fill={item.fill || '#1a1a1a'} {...shadowProps} />
  }

  if (item.frameType === 'desktop') {
    return (
      <>
        <Rect width={item.w} height={item.h - (item.standHeight || 40)} cornerRadius={item.cornerRadius || 4} fill={item.fill || '#1a1a1a'} {...shadowProps} />
        <Rect x={item.w / 2 - 40} y={item.h - (item.standHeight || 40)} width={80} height={item.standHeight || 40} fill={item.fill || '#1a1a1a'} listening={false} />
      </>
    )
  }

  return (
    <Rect
      width={item.w}
      height={item.h}
      cornerRadius={item.frameType === 'browser' ? item.cornerRadius || 8 : item.frameType === 'rect' ? item.cornerRadius || 0 : item.frameType === 'blob' || item.frameType === 'wave' || item.frameType === 'liquid' ? item.w / 4 : 0}
      fill={item.fill || (item.frameType.startsWith('film') || item.frameType === 'cinema' ? '#111111' : '#ffffff')}
      {...shadowProps}
    />
  )
}

const renderFrameDecorations = (item, shadowProps, isDropTarget, isEditing, frameSlot) => (
  <>
    {item.frameType === 'circle' && (
      <Circle x={item.w / 2} y={item.h / 2} radius={Math.min(item.w, item.h) / 2} fill="transparent" stroke={item.stroke || '#e5e5e5'} strokeWidth={item.strokeWidth || 2} listening={false} />
    )}
    {item.frameType !== 'circle' && !item.frameType.startsWith('film') && item.frameType !== 'cinema' && (
      <Rect
        width={item.frameType === 'desktop' ? item.w : item.w}
        height={item.frameType === 'desktop' ? item.h - (item.standHeight || 40) : item.h}
        cornerRadius={item.frameType === 'browser' ? item.cornerRadius || 8 : item.frameType === 'phone' || item.frameType === 'tablet' ? item.cornerRadius || 20 : item.frameType === 'rect' ? item.cornerRadius || 0 : item.frameType === 'blob' || item.frameType === 'wave' || item.frameType === 'liquid' ? item.w / 4 : 0}
        fill="transparent"
        stroke={item.stroke || (item.frameType === 'phone' || item.frameType === 'tablet' || item.frameType === 'desktop' ? '#0a0a0a' : '#e5e5e5')}
        strokeWidth={item.strokeWidth || (item.frameType === 'phone' ? 8 : item.frameType === 'tablet' ? 12 : item.frameType === 'desktop' ? 16 : 2)}
        listening={false}
      />
    )}
    {item.frameType === 'arch' && (
      <Rect y={0} width={item.w} height={item.archRadius || item.w / 2} cornerRadius={[item.archRadius || item.w / 2, item.archRadius || item.w / 2, 0, 0]} fill="transparent" stroke={item.stroke || '#e5e5e5'} strokeWidth={item.strokeWidth || 2} listening={false} />
    )}
    {item.frameType === 'polaroid-tape' && (
      <Rect x={item.w / 2 - 30} y={-5} width={60} height={15} fill={item.tapeColor || '#f5f1e8'} opacity={0.72} listening={false} />
    )}
    {item.frameType.startsWith('film') && (
      <>
        <Rect width={item.w} height={item.h} fill="transparent" stroke={item.stroke || '#1a1a1a'} strokeWidth={item.strokeWidth || 2} {...shadowProps} listening={false} />
        {Array.from({ length: item.sprocketHoles || 8 }).map((_, index) => {
          const isVertical = item.frameType === 'film-vertical'
          const spacing = isVertical ? item.h / ((item.sprocketHoles || 8) + 1) : item.w / ((item.sprocketHoles || 8) + 1)
          return <Rect key={index} x={isVertical ? 2 : spacing * (index + 1) - 3} y={isVertical ? spacing * (index + 1) - 3 : 2} width={6} height={6} cornerRadius={1} fill="#0f0f0f" listening={false} />
        })}
      </>
    )}
    {item.frameType === 'cinema' && (
      <>
        <Rect y={0} width={item.w} height={item.topBarHeight || 30} fill="#000000" listening={false} />
        <Rect y={item.h - (item.bottomBarHeight || 30)} width={item.w} height={item.bottomBarHeight || 30} fill="#000000" listening={false} />
      </>
    )}
    {item.frameType === 'phone' && (
      <Rect x={item.w / 2 - (item.notchWidth || 80) / 2} y={item.strokeWidth || 8} width={item.notchWidth || 80} height={item.notchHeight || 20} cornerRadius={10} fill={item.fill || '#1a1a1a'} listening={false} />
    )}
    {item.frameType === 'browser' && (
      <>
        <Rect width={item.w} height={item.headerHeight || 32} cornerRadius={[item.cornerRadius || 8, item.cornerRadius || 8, 0, 0]} fill={item.headerColor || '#f5f5f5'} listening={false} />
        <Circle x={16} y={(item.headerHeight || 32) / 2} radius={4} fill="#ff5f56" listening={false} />
        <Circle x={32} y={(item.headerHeight || 32) / 2} radius={4} fill="#ffbd2e" listening={false} />
        <Circle x={48} y={(item.headerHeight || 32) / 2} radius={4} fill="#27c93f" listening={false} />
      </>
    )}
    {item.frameType === 'desktop' && (
      <Rect x={item.w / 2 - 40} y={item.h - (item.standHeight || 40)} width={80} height={item.standHeight || 40} fill={item.fill || '#1a1a1a'} listening={false} />
    )}
    {/* Editing mode indicator - blue dashed border around slot */}
    {isEditing && frameSlot && (
      <Rect
        x={frameSlot.x}
        y={frameSlot.y}
        width={frameSlot.width}
        height={frameSlot.height}
        cornerRadius={frameSlot.cornerRadius || 0}
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[6, 4]}
        listening={false}
      />
    )}
    {isDropTarget && frameSlot && (
      <Rect
        x={frameSlot.x - 3}
        y={frameSlot.y - 3}
        width={frameSlot.width + 6}
        height={frameSlot.height + 6}
        cornerRadius={(frameSlot.cornerRadius || 0) + 3}
        stroke="#a970ff"
        strokeWidth={3}
        shadowColor="#a970ff"
        shadowBlur={18}
        shadowOpacity={0.55}
        listening={false}
      />
    )}
  </>
)

// Canva-style Frame Slot System: outer frame, dedicated image slot, clipped content, overlay decorations.
function FrameWithImage({ item, isSelected, commonProps, isDropTarget = false, isEditing = false, onImageDragEnd }) {
  const frameImage = useCanvasImage(item.frameImageSrc)
  const groupRef = useRef(null)
  const frameSlot = getResolvedFrameSlot(item)
  const shadowProps = {
    shadowColor: isSelected || isDropTarget ? '#b88cff' : '#050505',
    shadowBlur: isDropTarget ? 30 : isSelected ? 24 : 18,
    shadowOpacity: isDropTarget ? 0.36 : 0.25,
    shadowOffsetY: 8,
  }

  return (
    <Group ref={groupRef} {...commonProps}>
      {renderFrameBackground(item, shadowProps)}
      {renderFrameSlot({ item, frameImage, frameSlot, isDropTarget, isEditing, onImageDragEnd })}
      {renderFrameDecorations(item, shadowProps, isDropTarget, isEditing, frameSlot)}
    </Group>
  )
}

function CanvasImage({ item, onSelect, onChange, onDragStart, onDragEnd, isSelected, onCursor, disableDrag }) {
  const image = useCanvasImage(item.src)
  const sizeRef = useRef({ w: item.w, h: item.h })
  useEffect(() => {
    sizeRef.current = { w: item.w, h: item.h }
  }, [item.w, item.h])

  return (
    <Group
      id={item.id}
      x={item.x}
      y={item.y}
      rotation={item.rotation || 0}
      draggable={!item.locked && !disableDrag}
      opacity={item.opacity ?? 1}
      visible={item.visible !== false}
      dragBoundFunc={(position) => getClampedCanvasPosition(sizeRef.current.w, sizeRef.current.h, position)}
      onClick={(event) => onSelect(event, item.id)}
      onTap={(event) => onSelect(event, item.id)}
      onMouseEnter={() => onCursor(item.locked ? 'default' : 'move')}
      onMouseLeave={() => onCursor('default')}
      onDragStart={(event) => onDragStart(event, item.id)}
      onDragEnd={(event) => onDragEnd(event, item.id)}
      onTransformEnd={(event) => {
        const node = event.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        const requestedWidth = Math.max(80, item.w * Math.max(scaleX, scaleY))
        const requestedHeight = item.aspectRatio ? Math.max(80, requestedWidth / item.aspectRatio) : Math.max(80, item.h * scaleY)
        const nextSize = getCanvasContainedSize(requestedWidth, requestedHeight)

        node.scaleX(1)
        node.scaleY(1)
        const nextPosition = getClampedCanvasPosition(nextSize.w, nextSize.h, { x: node.x(), y: node.y() })

        onChange({
          x: nextPosition.x,
          y: nextPosition.y,
          w: nextSize.w,
          h: nextSize.h,
          rotation: node.rotation(),
        })
      }}
    >
      <Rect
        width={item.w}
        height={item.h}
        cornerRadius={item.radius ?? 0}
        fill="#ece6db"
        shadowColor={isSelected ? '#b88cff' : '#050505'}
        shadowBlur={isSelected ? 24 : 18}
        shadowOpacity={0.25}
        shadowOffsetY={8}
      />
      {image && (
        <KonvaImage
          image={image}
          width={item.w}
          height={item.h}
          cornerRadius={item.radius ?? 0}
          listening={false}
        />
      )}
    </Group>
  )
}

// FIX BUG 1 — CanvasTextNode: dedicated component for Konva Text with reliable stroke rendering.
//
// ROOT CAUSE OF STROKE BUG:
// Konva Text nodes keep an internal off-screen canvas cache. React prop changes update
// the Konva node's attributes, but Konva does NOT automatically invalidate its cache —
// so the old bitmap (without stroke) is reused until something else forces a full redraw.
//
// APPROACH (two-layer defense):
// 1. useLayoutEffect fires synchronously after React commits changes to the DOM.
//    At that point the Konva node's attrs are already updated with the new strokeWidth/
//    stroke/fill values. We call node.clearCache() to discard the stale bitmap and
//    node.getLayer().draw() (not just batchDraw) for a synchronous immediate repaint.
//    This covers strokeWidth number-input changes.
// 2. We keep a stable `key` (just item.id) so the node is never remounted — remounting
//    causes a brief ref=null window where clearCache silently fails.
// 3. For font changes we still preload via document.fonts.load() and track fontLoaded
//    state so the node re-renders once the font metrics are available.
function CanvasTextNode({ item, commonProps, isTextEditing, onTextEdit, onChange }) {
  const textNodeRef = useRef(null)
  const [fontLoaded, setFontLoaded] = useState(false)

  // Preload font so stroke renders correctly against proper glyph metrics on first paint
  useEffect(() => {
    const fontFamily = item.fontFamily || 'Inter, Arial'
    preloadFont(fontFamily).then(() => setFontLoaded(true))
  }, [item.fontFamily])

  // FIX BUG 1 — STROKE RENDER: useLayoutEffect runs synchronously after React commits
  // the new strokeWidth/stroke/fill attrs to the Konva node. Calling clearCache() here
  // discards the stale bitmap and .draw() forces a synchronous layer repaint —
  // so the stroke appears on the SAME frame as the input change, with zero delay.
  // useLayoutEffect (vs useEffect) is critical: useEffect runs after paint, meaning
  // the user would see one frame with the old cached render before the fix kicks in.
  useLayoutEffect(() => {
    const node = textNodeRef.current
    if (!node) return
    node.clearCache()
    // FIX BUG 3: Also clear internal text cache so stroke Width changes force a true remeasure
    if (typeof node._clearTextCache === 'function') {
      node._clearTextCache()
    }
    // Use .draw() instead of .batchDraw() for synchronous repaint (no RAF delay)
    node.getLayer()?.draw()
  }, [
    item.strokeWidth,
    item.stroke,
    item.fill,
    item.gradientType,
    item.gradientStops,
    item.gradientAngle,
    item.strokeGradientType,
    item.strokeGradientStops,
    item.strokeGradientAngle,
    item.fontSize,
    item.fontFamily,
    item.isBold,
    item.isItalic,
    item.isUnderline,
    item.align,
    item.text,
    item.opacity,
    fontLoaded,
  ])

  const fontStyle = []
  if (item.isBold) fontStyle.push('bold')
  if (item.isItalic) fontStyle.push('italic')
  const combinedFontStyle = fontStyle.join(' ') || 'normal'
  const textDecoration = item.isUnderline ? 'underline' : 'none'

  // Stable key = just item.id. We never remount the node — clearCache handles updates.
  // (A changing key causes React to unmount+remount, creating a brief ref=null gap
  // where the useLayoutEffect clearCache silently fails on the new node's first render.)
  const renderKey = item.id

  // Fill gradient configuration
  const gradientProps = {}
  if (item.gradientType === 'linear' && item.gradientStops && item.gradientStops.length >= 2) {
    const angle = (item.gradientAngle || 90) * (Math.PI / 180)
    const startX = item.w / 2 - (Math.cos(angle) * item.w) / 2
    const startY = item.h / 2 - (Math.sin(angle) * item.h) / 2
    const endX = item.w / 2 + (Math.cos(angle) * item.w) / 2
    const endY = item.h / 2 + (Math.sin(angle) * item.h) / 2

    gradientProps.fillLinearGradientStartPoint = { x: startX, y: startY }
    gradientProps.fillLinearGradientEndPoint = { x: endX, y: endY }
    gradientProps.fillLinearGradientColorStops = item.gradientStops.flatMap(stop => [stop.offset, stop.color])
    gradientProps.fill = undefined
  } else if (item.gradientType === 'radial' && item.gradientStops && item.gradientStops.length >= 2) {
    gradientProps.fillRadialGradientStartPoint = { x: item.w / 2, y: item.h / 2 }
    gradientProps.fillRadialGradientEndPoint = { x: item.w / 2, y: item.h / 2 }
    gradientProps.fillRadialGradientStartRadius = 0
    gradientProps.fillRadialGradientEndRadius = Math.max(item.w, item.h) / 2
    gradientProps.fillRadialGradientColorStops = item.gradientStops.flatMap(stop => [stop.offset, stop.color])
    gradientProps.fill = undefined
  } else {
    gradientProps.fill = item.fill
  }

  // Stroke gradient configuration
  const strokeGradientProps = {}
  if (item.strokeGradientType === 'linear' && item.strokeGradientStops && item.strokeGradientStops.length >= 2) {
    const angle = (item.strokeGradientAngle || 90) * (Math.PI / 180)
    const startX = item.w / 2 - (Math.cos(angle) * item.w) / 2
    const startY = item.h / 2 - (Math.sin(angle) * item.h) / 2
    const endX = item.w / 2 + (Math.cos(angle) * item.w) / 2
    const endY = item.h / 2 + (Math.sin(angle) * item.h) / 2

    strokeGradientProps.strokeLinearGradientStartPoint = { x: startX, y: startY }
    strokeGradientProps.strokeLinearGradientEndPoint = { x: endX, y: endY }
    strokeGradientProps.strokeLinearGradientColorStops = item.strokeGradientStops.flatMap(stop => [stop.offset, stop.color])
    strokeGradientProps.stroke = undefined
  } else if (item.strokeGradientType === 'radial' && item.strokeGradientStops && item.strokeGradientStops.length >= 2) {
    strokeGradientProps.strokeRadialGradientStartPoint = { x: item.w / 2, y: item.h / 2 }
    strokeGradientProps.strokeRadialGradientEndPoint = { x: item.w / 2, y: item.h / 2 }
    strokeGradientProps.strokeRadialGradientStartRadius = 0
    strokeGradientProps.strokeRadialGradientEndRadius = Math.max(item.w, item.h) / 2
    strokeGradientProps.strokeRadialGradientColorStops = item.strokeGradientStops.flatMap(stop => [stop.offset, stop.color])
    strokeGradientProps.stroke = undefined
  } else {
    strokeGradientProps.stroke = item.stroke
  }

  return (
    <Text
      key={renderKey}
      ref={textNodeRef}
      {...commonProps}
      text={item.text}
      width={item.w}
      // BUG 1 & 2 FIX: Do NOT pass height={item.h}. Let Konva calculate actual text height natively.
      // This eliminates extra bottom padding and prevents letter cropping.
      {...gradientProps}
      {...strokeGradientProps}
      fontSize={item.fontSize}
      fontFamily={item.fontFamily || 'Inter, Arial'}
      fontStyle={combinedFontStyle}
      textDecoration={textDecoration}
      strokeWidth={item.strokeWidth || 0}
      // FIX FONT + STROKE VISUAL BUG: lineJoin="round" prevents jagged/glitchy
      // stroke corners on complex font glyphs (Montserrat, etc.). Without this,
      // the default miter join creates sharp spikes at sharp angles in letterforms.
      lineJoin="round"
      // FIX: miterLimit=2 caps the spike height for miter-style corners as a safety
      // net for any shapes that slip through (Konva may apply it before lineJoin).
      miterLimit={2}
      lineHeight={0.9}
      align={item.align || 'center'}
      opacity={isTextEditing ? 0 : item.opacity ?? 1}
      // FIX FONT + STROKE VISUAL BUG: perfectDrawEnabled=true makes Konva use a
      // two-pass render (stroke first, fill on top) which is the correct order for
      // outlined text. With false (default), fill and stroke can overlap incorrectly.
      perfectDrawEnabled={true}
      onDblClick={(event) => {
        event.cancelBubble = true
        onTextEdit(item.id)
      }}
      onDblTap={(event) => {
        event.cancelBubble = true
        onTextEdit(item.id)
      }}
      onTransform={(event) => {
        const node = event.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()

        // Detect side handle drag (only X changes)
        const isHorizontalResize = Math.abs(scaleX - 1) > 0.001 && Math.abs(scaleY - 1) < 0.001;

        if (isHorizontalResize) {
          node.setAttrs({
            width: Math.max(40, node.width() * Math.abs(scaleX)),
            scaleX: 1,
            scaleY: 1
          });
        }
      }}
      onTransformEnd={(event) => {
        const node = event.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()

        const isHorizontalResize = Math.abs(scaleX - 1) > 0.001 && Math.abs(scaleY - 1) < 0.001;

        let nextWidth = Math.max(40, node.width() * Math.abs(scaleX));
        let nextFontSize = item.fontSize || 48;

        if (!isHorizontalResize) {
          // Diagonal corner drag -> scale text proportionally
          const fontScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
          nextFontSize = clamp(nextFontSize * fontScale, 8, 220);
          nextWidth = Math.max(40, node.width() * Math.abs(scaleX));
        }

        node.scaleX(1)
        node.scaleY(1)
        node.width(nextWidth)
        node.fontSize(nextFontSize)

        // Let Konva remeasure exactly what the new height is
        const nextHeight = node.height()

        const nextPosition = getClampedCanvasPosition(nextWidth, nextHeight, { x: node.x(), y: node.y() })

        // FIX: Clear cache after transform so stroke re-renders at new size
        node.clearCache()
        if (typeof node._clearTextCache === 'function') {
          node._clearTextCache()
        }

        onChange({
          x: nextPosition.x,
          y: nextPosition.y,
          w: nextWidth,
          h: nextHeight, // Persist actual text height to state
          fontSize: nextFontSize,
          rotation: node.rotation(),
        })
      }}
    />
  )
}

function CanvasItem({ item, selectedId, onSelect, onChange, onDragStart, onDragEnd, onTextEdit, isTextEditing, onCursor, disableDrag, dropTargetFrameId, editingFrameId, onFrameImageEdit }) {
  const sizeRef = useRef({ w: item.w, h: item.h })
  useEffect(() => {
    sizeRef.current = { w: item.w, h: item.h }
  }, [item.w, item.h])

  const commonProps = {
    id: item.id,
    x: item.x,
    y: item.y,
    rotation: item.rotation || 0,
    draggable: !item.locked && !disableDrag,
    opacity: item.opacity ?? 1,
    visible: item.visible !== false,
    dragBoundFunc: (position) => getClampedCanvasPosition(sizeRef.current.w, sizeRef.current.h, position),
    onClick: (event) => onSelect(event, item.id),
    onTap: (event) => onSelect(event, item.id),
    onMouseEnter: () => onCursor(item.locked ? 'default' : 'move'),
    onMouseLeave: () => onCursor('default'),
    onDragStart: (event) => onDragStart(event, item.id),
    onDragEnd: (event) => onDragEnd(event, item.id),
    onTransformEnd: (event) => {
  const node = event.target
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()
 
  node.scaleX(1)
  node.scaleY(1)
  const nextSize = getCanvasContainedSize(Math.max(40, item.w * scaleX), Math.max(40, item.h * scaleY))
  const nextPosition = getClampedCanvasPosition(nextSize.w, nextSize.h, { x: node.x(), y: node.y() })
 
  const patch = {
    x: nextPosition.x,
    y: nextPosition.y,
    w: nextSize.w,
    h: nextSize.h,
    rotation: node.rotation(),
  }
 
  // FIX: Saat frame di-resize, reset crop position ke center
  // agar gambar tidak terlempar keluar slot
  if (item.kind === 'frame' && item.frameImageSrc) {
    patch.frameImagePosition = { x: 0, y: 0 }
  }
 
  onChange(patch)
},
  }

  if (item.kind === 'image') {
    return (
      <CanvasImage
        item={item}
        onSelect={onSelect}
        onChange={onChange}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        isSelected={selectedId === item.id}
        onCursor={onCursor}
        disableDrag={disableDrag}
      />
    )
  }

  if (item.kind === 'text') {
    return (
      <CanvasTextNode
        item={item}
        commonProps={commonProps}
        isTextEditing={isTextEditing}
        onTextEdit={onTextEdit}
        onChange={onChange}
      />
    )
  }

  if (item.kind === 'palette') {
    return (
      <Group {...commonProps}>
        <Rect width={item.w} height={item.h} cornerRadius={item.radius ?? 14} fill="#ebe6dd" shadowColor="#0a0710" shadowBlur={14} shadowOpacity={0.18} shadowOffsetY={8} />
        {['#c9a5ef', '#a695e5', '#62cfda'].map((color, index) => (
          <Rect key={color} x={14 + index * 40} y={12} width={28} height={30} cornerRadius={7} fill={color} listening={false} />
        ))}
      </Group>
    )
  } if (item.kind === 'shape') {
    const isSelected = selectedId === item.id
    const shadowProps = { shadowColor: isSelected ? '#b88cff' : '#050505', shadowBlur: isSelected ? 24 : 18, shadowOpacity: 0.25, shadowOffsetY: 8 }

    return (
      <Group {...commonProps}>
        {/* Rectangle */}
        {item.shapeType === 'rect' && (
          <Rect
            width={item.w}
            height={item.h}
            cornerRadius={item.cornerRadius || 0}
            fill={item.fill}
            {...shadowProps}
          />
        )}

        {/* Circle */}
        {item.shapeType === 'circle' && (
          <Circle
            x={item.w / 2}
            y={item.h / 2}
            radius={item.radius || Math.min(item.w, item.h) / 2}
            fill={item.fill}
            {...shadowProps}
          />
        )}

        {/* Ellipse */}
        {item.shapeType === 'ellipse' && (
          <Circle
            x={item.w / 2}
            y={item.h / 2}
            radiusX={item.radiusX || item.w / 2}
            radiusY={item.radiusY || item.h / 2}
            fill={item.fill}
            {...shadowProps}
          />
        )}

        {/* Polygon (Triangle, Pentagon, Hexagon, etc.) */}
        {item.shapeType === 'polygon' && (
          <RegularPolygon
            x={item.w / 2}
            y={item.h / 2}
            sides={item.sides || 3}
            radius={item.radius || Math.min(item.w, item.h) / 2}
            fill={item.fill}
            {...shadowProps}
          />
        )}

        {/* Star */}
        {item.shapeType === 'star' && (
          <Star
            x={item.w / 2}
            y={item.h / 2}
            numPoints={item.numPoints || 5}
            innerRadius={item.innerRadius || Math.min(item.w, item.h) / 4}
            outerRadius={item.outerRadius || Math.min(item.w, item.h) / 2}
            fill={item.fill}
            {...shadowProps}
          />
        )}

        {/* Arrow */}
        {item.shapeType === 'arrow' && (
          <Arrow
            points={item.points || [0, item.h / 2, item.w, item.h / 2]}
            pointerLength={item.pointerLength || 20}
            pointerWidth={item.pointerWidth || 20}
            fill={item.fill}
            stroke={item.stroke || item.fill}
            strokeWidth={item.strokeWidth || 3}
            {...shadowProps}
          />
        )}

        {/* Line */}
        {item.shapeType === 'line' && (
          <Line
            points={item.points || [0, item.h / 2, item.w, item.h / 2]}
            stroke={item.stroke || item.fill}
            strokeWidth={item.strokeWidth || 3}
            lineCap="round"
            {...shadowProps}
          />
        )}
      </Group>
    )
  }

  if (item.kind === 'frame') {
  const isSelected = selectedId === item.id
  const isEditing = editingFrameId === item.id
 
  return (
    <FrameWithImage
      item={item}
      isSelected={isSelected}
      commonProps={{
        ...commonProps,
        // FIX: Saat isEditing, matikan draggable pada frame itu sendiri
        // agar frame tidak ikut bergerak saat user drag gambar di dalamnya
        draggable: !item.locked && !disableDrag && !isEditing,
        onDblClick: (event) => {
          event.cancelBubble = true
          if (isEditing) {
            // Double click kedua = keluar dari edit mode
            onFrameImageEdit(null)
          } else if (item.frameImageSrc) {
            onFrameImageEdit(item.id)
          }
        },
        onDblTap: (event) => {
          event.cancelBubble = true
          if (isEditing) {
            onFrameImageEdit(null)
          } else if (item.frameImageSrc) {
            onFrameImageEdit(item.id)
          }
        },
      }}
      isDropTarget={dropTargetFrameId === item.id}
      isEditing={isEditing}
      onImageDragEnd={(position) => onChange({ frameImagePosition: position })}
    />
  )
}

  return (
    <Group {...commonProps}>
      <Rect width={item.w} height={item.h} cornerRadius={item.radius ?? (item.kind === 'note' ? 10 : 16)} fill={item.fill} shadowColor="#050505" shadowBlur={18} shadowOpacity={0.22} shadowOffsetY={8} />
      {item.kind === 'card' && (
        <>
          <Circle x={24} y={22} radius={4} fill="#fb9285" listening={false} />
          <Circle x={38} y={22} radius={4} fill="#f2c55e" listening={false} />
          <Circle x={52} y={22} radius={4} fill="#72d08a" listening={false} />
          <Rect x={24} y={45} width={item.w - 48} height={12} cornerRadius={6} fill="#d8d2c8" listening={false} />
          <Rect x={24} y={68} width={item.w - 80} height={34} cornerRadius={10} fill="#d4c5e8" listening={false} />
        </>
      )}
      {item.kind === 'note' && (
        <Text x={16} y={18} width={item.w - 32} text={item.text} fill="#231c2f" fontSize={14} fontFamily="Inter, Arial" lineHeight={1.35} listening={false} />
      )}
    </Group>
  )
}

function Workspace() {
  const [activePanel, setActivePanel] = useState('assets')
  const [activeElementCategory, setActiveElementCategory] = useState(null)
  const [assetTab, setAssetTab] = useState('boards')
  const [selectedBoardId, setSelectedBoardId] = useState('board-1')
  const [items, setItems] = useState(initialItems)
  const [selectedId, setSelectedId] = useState('image-1')
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 0.75 })
  const [viewportSize, setViewportSize] = useState({ width: canvasSize.width, height: canvasSize.height })
  const [isPanning, setIsPanning] = useState(false)
  const [isSpaceDown, setIsSpaceDown] = useState(false)
  const [stageCursor, setStageCursor] = useState('default')
  const [dropTargetFrameId, setDropTargetFrameId] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const [editingFrameId, setEditingFrameId] = useState(null)
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [colorPickerTarget, setColorPickerTarget] = useState(null)
  const [fontSearchQuery, setFontSearchQuery] = useState('')
  const stageRef = useRef(null)
  const viewportRef = useRef(null)
  const textEditorRef = useRef(null)
  const inlineTextEditorRef = useRef(null)
  const skipInlineTextBlurRef = useRef(false)
  const transformerRef = useRef(null)
  const itemCounterRef = useRef(initialItems.length)
  const pendingSelectIdRef = useRef(null)
  const justDroppedIdRef = useRef(null)
  const dragAssetRef = useRef(null)
  const panSessionRef = useRef(null)
  const cameraRef = useRef(camera)
  const zoomAnimationRef = useRef(null)
  const hasCenteredCameraRef = useRef(false)
  const imageMetadataRef = useRef(new Map())
  const activeObjectDragRef = useRef(null)
  const itemsRef = useRef(initialItems)
  const targetCameraRef = useRef(camera)

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId])
  const boards = useMemo(() => getAllBoards(), [])
  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === selectedBoardId) || boards[0],
    [boards, selectedBoardId],
  )
  const boardAssets = useMemo(
    () => getAssetsByBoardId(selectedBoard?.id).map((asset) => toImageAsset(asset, { boardName: selectedBoard?.name })),
    [selectedBoard],
  )
  const editingTextItem = useMemo(
    () => items.find((item) => item.id === editingText?.id && item.kind === 'text'),
    [editingText?.id, items],
  )

  // Drag & drop sensors for layers panel
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags on click)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const inlineTextEditorStyleRef = useRef(null)
  const inlineTextEditorStyle = useMemo(() => {
    if (!editingTextItem) {
      inlineTextEditorStyleRef.current = null
      return null
    }

    const newStyle = {
      left: camera.x + editingTextItem.x * camera.scale,
      top: camera.y + editingTextItem.y * camera.scale,
      width: Math.max(40, editingTextItem.w * camera.scale),
      minHeight: Math.max(32, editingTextItem.h * camera.scale),
      color: editingTextItem.fill || '#2b2830',
      fontSize: Math.max(8, (editingTextItem.fontSize || 48) * camera.scale),
      fontFamily: editingTextItem.fontFamily || 'Inter, Arial',
      fontWeight: editingTextItem.isBold ? 700 : 400,
      lineHeight: 0.9,
      transform: `rotate(${editingTextItem.rotation || 0}deg)`,
      transformOrigin: 'top left',
      textAlign: 'center',
    }

    const prevStyle = inlineTextEditorStyleRef.current
    if (prevStyle &&
      prevStyle.left === newStyle.left &&
      prevStyle.top === newStyle.top &&
      prevStyle.width === newStyle.width &&
      prevStyle.minHeight === newStyle.minHeight &&
      prevStyle.color === newStyle.color &&
      prevStyle.fontSize === newStyle.fontSize &&
      prevStyle.fontFamily === newStyle.fontFamily &&
      prevStyle.fontWeight === newStyle.fontWeight &&
      prevStyle.lineHeight === newStyle.lineHeight &&
      prevStyle.transform === newStyle.transform &&
      prevStyle.transformOrigin === newStyle.transformOrigin &&
      prevStyle.textAlign === newStyle.textAlign) {
      return prevStyle
    }

    inlineTextEditorStyleRef.current = newStyle
    return newStyle
  }, [camera, editingTextItem])

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  useEffect(() => {
    if (selectedItem?.kind !== 'text') return

    textEditorRef.current?.focus()
    textEditorRef.current?.select()
  }, [selectedItem?.id, selectedItem?.kind])

  useEffect(() => {
    if (!editingText) return

    requestAnimationFrame(() => {
      inlineTextEditorRef.current?.focus()
      inlineTextEditorRef.current?.select()
    })
  }, [editingText?.id])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => () => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
    }
  }, [])

  useEffect(() => {
    const viewportNode = viewportRef.current

    if (!viewportNode) return undefined

    const updateViewportSize = () => {
      const rect = viewportNode.getBoundingClientRect()
      setViewportSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      })
    }
    const observer = new ResizeObserver(updateViewportSize)

    updateViewportSize()
    observer.observe(viewportNode)

    return () => observer.disconnect()
  }, [])

  const clampCameraToCanvas = useCallback((nextCamera) => {
    const scaledCanvas = {
      width: canvasSize.width * nextCamera.scale,
      height: canvasSize.height * nextCamera.scale,
    }
    const viewportPadding = Math.min(140, Math.max(44, Math.min(viewportSize.width, viewportSize.height) * 0.14))
    const getAxisPosition = (viewportLength, scaledLength, requestedPosition) => {
      if (scaledLength <= viewportLength - viewportPadding * 2) {
        return (viewportLength - scaledLength) / 2
      }

      return clamp(requestedPosition, viewportLength - scaledLength - viewportPadding, viewportPadding)
    }

    return {
      scale: nextCamera.scale,
      x: getAxisPosition(viewportSize.width, scaledCanvas.width, nextCamera.x),
      y: getAxisPosition(viewportSize.height, scaledCanvas.height, nextCamera.y),
    }
  }, [viewportSize])

  const getCenteredCamera = useCallback(() => {
    const scale = 0.75
    const scaledCanvasWidth = canvasSize.width * scale
    const scaledCanvasHeight = canvasSize.height * scale
    return {
      scale: scale,
      x: (viewportSize.width - scaledCanvasWidth) / 2,
      y: (viewportSize.height - scaledCanvasHeight) / 2,
    }
  }, [viewportSize])

  useEffect(() => {
    if (hasCenteredCameraRef.current || !viewportSize.width || !viewportSize.height) return

    hasCenteredCameraRef.current = true
    const initialCamera = getCenteredCamera()
    targetCameraRef.current = initialCamera
    cameraRef.current = initialCamera
    setCamera(initialCamera)
  }, [viewportSize, getCenteredCamera])

  const applyCamera = useCallback((nextCamera) => {
    const boundedCamera = clampCameraToCanvas(nextCamera)

    cameraRef.current = boundedCamera
    setCamera(boundedCamera)
  }, [clampCameraToCanvas])

  // FIX BUG 2: Viewport resize (sidebar open/close) must NOT reset the zoom scale.
  // Old code called getCenteredCamera() which hardcodes scale=0.75, clobbering any zoom
  // the user had applied. The correct behavior: keep the CURRENT scale, just re-clamp
  // the x/y position so the canvas stays visible inside the new viewport dimensions.
  // We store the previous viewport width so we can detect sidebar toggles vs true resizes
  // and shift the camera x proportionally instead of re-centering from scratch.
  const prevViewportWidthRef = useRef(null)
  useEffect(() => {
    if (!hasCenteredCameraRef.current) return

    const currentCamera = cameraRef.current
    const prevWidth = prevViewportWidthRef.current

    if (prevWidth !== null && prevWidth !== viewportSize.width) {
      // Viewport width changed (sidebar toggle or window resize).
      // Shift camera.x by half the width delta so the canvas center stays stable,
      // then clamp to new bounds. Do NOT change the scale.
      const widthDelta = viewportSize.width - prevWidth
      const shifted = {
        scale: currentCamera.scale,
        x: currentCamera.x + widthDelta / 2,
        y: currentCamera.y,
      }
      const clamped = clampCameraToCanvas(shifted)
      targetCameraRef.current = clamped
      cameraRef.current = clamped
      setCamera(clamped)
    }

    prevViewportWidthRef.current = viewportSize.width
  }, [viewportSize, clampCameraToCanvas])

  const animateCameraTo = (nextCamera) => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
    }

    const fromCamera = targetCameraRef.current
    targetCameraRef.current = clampCameraToCanvas(nextCamera)

    const startedAt = performance.now()
    const duration = 95

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const interpolated = {
        scale: fromCamera.scale + (targetCameraRef.current.scale - fromCamera.scale) * eased,
        x: fromCamera.x + (targetCameraRef.current.x - fromCamera.x) * eased,
        y: fromCamera.y + (targetCameraRef.current.y - fromCamera.y) * eased,
      }

      applyCamera(interpolated)

      if (progress < 1) {
        zoomAnimationRef.current = requestAnimationFrame(tick)
      } else {
        zoomAnimationRef.current = null
      }
    }

    zoomAnimationRef.current = requestAnimationFrame(tick)
  }

  const attachTransformer = useCallback((id) => {
    if (!transformerRef.current || !stageRef.current) return

    if (!id) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
      return
    }

    const node = stageRef.current.findOne(`[id="${id}"]`) || stageRef.current.findOne(`#${id}`)
    const isLocked = itemsRef.current.find((item) => item.id === id)?.locked
    transformerRef.current.nodes(node && !isLocked ? [node] : [])
    transformerRef.current.getLayer()?.batchDraw()
  }, [])

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return

    if (pendingSelectIdRef.current !== null) {
      const id = pendingSelectIdRef.current
      pendingSelectIdRef.current = null
      setSelectedId(id)
      setIsRightPanelOpen(true)
      requestAnimationFrame(() => {
        attachTransformer(id)
        justDroppedIdRef.current = null
      })
      return
    }

    attachTransformer(selectedId)
  }, [selectedId, items, attachTransformer])

const finishFrameImageEdit = useCallback(() => {
  if (!editingFrameId) return
 
  const frameId = editingFrameId
  setEditingFrameId(null)
 
  // FIX: Re-attach transformer ke frame setelah keluar edit mode
  requestAnimationFrame(() => {
    attachTransformer(frameId)
  })
}, [attachTransformer, editingFrameId])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setIsSpaceDown(true)
        setStageCursor((current) => (current === 'grabbing' ? current : 'grab'))
      }

      if (event.key === 'Escape') {
        if (editingFrameId) {
          finishFrameImageEdit()
        } else if (isFontPickerOpen) {
          setIsFontPickerOpen(false)
          setFontSearchQuery('')
        } else if (isColorPickerOpen) {
          setIsColorPickerOpen(false)
          setColorPickerTarget(null)
        }
      }
    }

    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        setIsSpaceDown(false)
        setIsPanning(false)
        panSessionRef.current = null
        setStageCursor('default')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isFontPickerOpen, isColorPickerOpen, editingFrameId, finishFrameImageEdit])

  const openRightPanel = (panel = activePanel) => {
    console.log('[DEBUG] openRightPanel called with panel:', panel)
    setActivePanel(panel)
    setIsRightPanelOpen(true)
  }

  const deselectCanvas = () => {
    console.log('[DEBUG] deselectCanvas called')
    setSelectedId(null)
    setActivePanel(null)
    setIsRightPanelOpen(false)
  }

  const selectItem = (id) => {
    console.log('[DEBUG] selectItem called with id:', id)
    setSelectedId(id)
    setIsRightPanelOpen(true)
  }

  const deleteObject = useCallback((id) => {
    console.log('[DEBUG] deleteObject called with id:', id)
    if (!id) return

    setItems((current) => current.filter((item) => item.id !== id))
    if (selectedId === id) {
      console.log('[DEBUG] deleteObject: setting activePanel to null')
      setSelectedId(null)
      setActivePanel(null)
      setIsRightPanelOpen(false)
      attachTransformer(null)
    }
  }, [attachTransformer, selectedId])

  const deleteSelectedObject = useCallback(() => {
    deleteObject(selectedId)
  }, [deleteObject, selectedId])

  const handleZoomIn = useCallback(() => {
    const viewportCenter = {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2,
    }
    const nextScale = Math.min(camera.scale * zoomSpeed, maxZoom)
    const scaleRatio = nextScale / camera.scale
    const nextCamera = {
      scale: nextScale,
      x: viewportCenter.x - (viewportCenter.x - camera.x) * scaleRatio,
      y: viewportCenter.y - (viewportCenter.y - camera.y) * scaleRatio,
    }
    animateCameraTo(nextCamera)
  }, [camera, viewportSize])

  const handleZoomOut = useCallback(() => {
    const viewportCenter = {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2,
    }
    const nextScale = Math.max(camera.scale / zoomSpeed, minZoom)
    const scaleRatio = nextScale / camera.scale
    const nextCamera = {
      scale: nextScale,
      x: viewportCenter.x - (viewportCenter.x - camera.x) * scaleRatio,
      y: viewportCenter.y - (viewportCenter.y - camera.y) * scaleRatio,
    }
    animateCameraTo(nextCamera)
  }, [camera, viewportSize])

  const handleResetZoom = useCallback(() => {
    const nextCamera = getCenteredCamera()
    animateCameraTo(nextCamera)
  }, [getCenteredCamera])

  useEffect(() => {
    const handleDeleteKey = (event) => {
      const target = event.target
      const isEditingText = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (isEditingText || !selectedId || (event.key !== 'Delete' && event.key !== 'Backspace')) return

      event.preventDefault()
      deleteSelectedObject()
    }

    window.addEventListener('keydown', handleDeleteKey)

    return () => {
      window.removeEventListener('keydown', handleDeleteKey)
    }
  }, [deleteSelectedObject, selectedId])

  const updateItem = (id, patch) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))

    // FIX STROKE RENDER BUG: Force immediate Konva layer redraw for ALL visual property
    // changes. Previously only certain properties triggered this, causing delayed updates.
    // Now we always schedule a batchDraw to ensure the layer repaints in the next RAF.
    // The CanvasTextNode component also handles clearCache() imperatively via useEffect.
    requestAnimationFrame(() => {
      const layer = stageRef.current?.findOne('Layer')
      layer?.batchDraw()
    })
  }

  // Drag & drop handler for layers panel
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id)
      const newIndex = current.findIndex((item) => item.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return current

      // Use arrayMove from @dnd-kit/sortable for smooth reordering
      return arrayMove(current, oldIndex, newIndex)
    })
  }

  const getNextItemId = (type) => {
    const existingIds = new Set(itemsRef.current.map((item) => item.id))
    let nextId

    do {
      itemCounterRef.current += 1
      nextId = `${type}-${itemCounterRef.current}`
    } while (existingIds.has(nextId))

    return nextId
  }

  const getWorldPointFromViewport = (point) => {
    const currentCamera = cameraRef.current

    return {
      x: (point.x - currentCamera.x) / currentCamera.scale,
      y: (point.y - currentCamera.y) / currentCamera.scale,
    }
  }

  const getViewportCenterWorld = () => getWorldPointFromViewport({
    x: viewportSize.width / 2,
    y: viewportSize.height / 2,
  })

  const getSafeSpawnPosition = ({ w, h }, position) => {
    const basePosition = position || getViewportCenterWorld()
    const x = clamp(basePosition.x - w / 2, canvasBounds.x, canvasBounds.x + canvasBounds.width - w)
    const y = clamp(basePosition.y - h / 2, canvasBounds.y, canvasBounds.y + canvasBounds.height - h)

    return { x, y }
  }

  const getImageMetadata = async (src) => {
    if (!imageMetadataRef.current.has(src)) {
      imageMetadataRef.current.set(src, loadImageMetadata(src))
    }

    return imageMetadataRef.current.get(src)
  }

  const createCanvasItemFromAsset = async (asset, position = null) => {
    const id = getNextItemId(asset.type)
    const imageSize = asset.type === 'image'
      ? await getImageMetadata(asset.source)
      : { w: asset.w, h: asset.h, aspectRatio: asset.w / asset.h }
    const safePosition = getSafeSpawnPosition(imageSize, position)
    const base = {
      id,
      x: safePosition.x,
      y: safePosition.y,
      w: imageSize.w,
      h: imageSize.h,
      rotation: 0,
    }

    const nextItem = asset.type === 'image'
      ? { ...base, kind: 'image', src: asset.source, radius: 0, aspectRatio: imageSize.aspectRatio }
      : asset.type === 'text'
        ? { ...base, kind: 'text', text: asset.text, fontSize: 72, fill: '#2b2830', isBold: true, isItalic: false, isUnderline: false, fontFamily: 'Inter, Arial' }
        : { ...base, kind: 'note', text: asset.text, fill: '#f5d56b' }

    return nextItem
  }

  const addAssetToCanvas = async (asset, position) => {
    const nextItem = await createCanvasItemFromAsset(asset, position)

    pendingSelectIdRef.current = nextItem.id
    justDroppedIdRef.current = nextItem.id
    // FIX: Prepend to array so new item appears at top layer (frontmost)
    setItems((current) => [nextItem, ...current])
  }

  const addNote = () => {
    const id = getNextItemId('note')
    const position = getSafeSpawnPosition({ w: 170, h: 120 })

    pendingSelectIdRef.current = id
    justDroppedIdRef.current = id
    // FIX: Prepend to array so new note appears at top layer (frontmost)
    setItems((current) => [{ id, kind: 'note', text: 'New research note', x: position.x, y: position.y, w: 170, h: 120, fill: '#f4c2d7', rotation: -2 }, ...current])
  }

  const addShapeToCanvas = (shapeData) => {
    const id = getNextItemId('shape')

    const viewportCenter = {
      x: (viewportSize.width / 2 - camera.x) / camera.scale,
      y: (viewportSize.height / 2 - camera.y) / camera.scale,
    }

    // Calculate size based on shape type
    let size = { w: 120, h: 120 }
    if (shapeData.shapeType === 'line') {
      const points = shapeData.defaultProps.points || [0, 0, 150, 0]
      size = { w: Math.abs(points[2] - points[0]) || 150, h: Math.abs(points[3] - points[1]) || 4 }
    } else if (shapeData.shapeType === 'arrow') {
      const points = shapeData.defaultProps.points || [0, 0, 150, 0]
      size = { w: Math.abs(points[2] - points[0]) || 150, h: Math.abs(points[3] - points[1]) || 4 }
    } else if (shapeData.shapeType === 'circle') {
      const radius = shapeData.defaultProps.radius || 60
      size = { w: radius * 2, h: radius * 2 }
    } else if (shapeData.shapeType === 'ellipse') {
      const radiusX = shapeData.defaultProps.radiusX || 80
      const radiusY = shapeData.defaultProps.radiusY || 50
      size = { w: radiusX * 2, h: radiusY * 2 }
    } else if (shapeData.shapeType === 'polygon') {
      const radius = shapeData.defaultProps.radius || 60
      size = { w: radius * 2, h: radius * 2 }
    } else if (shapeData.shapeType === 'star') {
      const outerRadius = shapeData.defaultProps.outerRadius || 60
      size = { w: outerRadius * 2, h: outerRadius * 2 }
    } else if (shapeData.shapeType === 'rect') {
      size = { w: shapeData.defaultProps.width || 150, h: shapeData.defaultProps.height || 100 }
    }

    const position = {
      x: clamp(viewportCenter.x - size.w / 2, canvasBounds.x, canvasBounds.x + canvasBounds.width - size.w),
      y: clamp(viewportCenter.y - size.h / 2, canvasBounds.y, canvasBounds.y + canvasBounds.height - size.h),
    }

    const newShape = {
      id,
      kind: 'shape',
      shapeType: shapeData.shapeType,
      shapeId: shapeData.id,
      x: position.x,
      y: position.y,
      w: size.w,
      h: size.h,
      fill: shapeData.defaultProps.fill || '#a78bfa',
      rotation: shapeData.defaultProps.rotation || 0,
      // Store additional shape-specific props
      ...shapeData.defaultProps,
    }

    pendingSelectIdRef.current = id
    justDroppedIdRef.current = id
    // FIX: Prepend to array so new shape appears at top layer (frontmost)
    setItems((current) => [newShape, ...current])
  }

  const addFrameToCanvas = (frameData) => {
    const id = getNextItemId('frame')

    const viewportCenter = {
      x: (viewportSize.width / 2 - camera.x) / camera.scale,
      y: (viewportSize.height / 2 - camera.y) / camera.scale,
    }

    // Calculate size based on frame type
    let size = { w: 200, h: 250 }
    if (frameData.frameType === 'circle') {
      const radius = frameData.defaultProps.radius || 120
      size = { w: radius * 2, h: radius * 2 }
    } else if (frameData.defaultProps.width && frameData.defaultProps.height) {
      size = { w: frameData.defaultProps.width, h: frameData.defaultProps.height }
    }

    const position = {
      x: clamp(viewportCenter.x - size.w / 2, canvasBounds.x, canvasBounds.x + canvasBounds.width - size.w),
      y: clamp(viewportCenter.y - size.h / 2, canvasBounds.y, canvasBounds.y + canvasBounds.height - size.h),
    }

    const newFrame = {
      id,
      kind: 'frame',
      frameType: frameData.frameType,
      frameId: frameData.id,
      x: position.x,
      y: position.y,
      w: size.w,
      h: size.h,
      rotation: 0,
      // Frame image properties
      frameImage: null,
      frameImageSrc: null,
      frameImageFit: 'cover',
      frameImagePosition: { x: 0, y: 0 },
      frameImageScale: 1,
      // Store all frame-specific props
      ...frameData.defaultProps,
    }

    pendingSelectIdRef.current = id
    justDroppedIdRef.current = id
    // Prepend to array so new frame appears at top layer (frontmost)
    setItems((current) => [newFrame, ...current])
  }

  // Add image to frame
  const addImageToFrame = async (frameId, imageSrc) => {
    const frame = items.find(item => item.id === frameId)
    if (!frame || frame.kind !== 'frame') return

    await getImageMetadata(imageSrc)

    updateItem(frameId, {
      frameImageSrc: imageSrc,
      frameImageScale: 1,
      frameImagePosition: { x: 0, y: 0 },
      frameImageFit: 'cover',
    })
  }

  // FIX: addText now uses isBold/isItalic flags from preset instead of legacy fontStyle string.
  // This ensures the hierarchy (Heading=bold, Paragraph=normal) is reflected immediately.
  const addText = (text = 'Add text', fontSize = 48, isBold = false, isItalic = false) => {
    const existingIds = new Set(items.map((item) => item.id))
    let nextIndex = items.length + 1
    let id = `text-${nextIndex}`

    while (existingIds.has(id)) {
      nextIndex += 1
      id = `text-${nextIndex}`
    }

    const size = { w: 320, h: Math.max(80, fontSize * 1.5) }
    const viewportCenter = {
      x: (viewportSize.width / 2 - camera.x) / camera.scale,
      y: (viewportSize.height / 2 - camera.y) / camera.scale,
    }
    const position = {
      x: clamp(viewportCenter.x - size.w / 2, canvasBounds.x, canvasBounds.x + canvasBounds.width - size.w),
      y: clamp(viewportCenter.y - size.h / 2, canvasBounds.y, canvasBounds.y + canvasBounds.height - size.h),
    }

    const newText = {
      id,
      kind: 'text',
      text,
      x: position.x,
      y: position.y,
      ...size,
      rotation: 0,
      fontSize,
      fontFamily: 'Inter, Arial',
      isBold,
      isItalic,
      isUnderline: false,
      fill: '#2b2830',
    }

    // FIX: Prepend to array so new text appears at top layer (frontmost)
    setItems((current) => [newText, ...current])

    requestAnimationFrame(() => {
      selectItem(id)
    })
  }

  const beginAssetDrag = (event, asset) => {
    dragAssetRef.current = asset
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', asset.title)
  }

  const getCanvasDropPosition = (event) => {
    const stage = stageRef.current

    if (event) {
      stage?.setPointersPositions(event)
    }

    const pointer = stage?.getPointerPosition()

    if (!stage || !pointer) return null

    return getWorldPointFromViewport(pointer)
  }

  const getFrameLocalPoint = (frame, point) => {
    const rotation = -((frame.rotation || 0) * Math.PI) / 180
    const dx = point.x - frame.x
    const dy = point.y - frame.y

    return {
      x: dx * Math.cos(rotation) - dy * Math.sin(rotation),
      y: dx * Math.sin(rotation) + dy * Math.cos(rotation),
    }
  }

  const isPointInsideFrameSlot = (frame, point) => {
    const slot = getResolvedFrameSlot(frame)
    const localPoint = getFrameLocalPoint(frame, point)

    if (slot.shape === 'circle') {
      const radius = slot.radius || Math.min(slot.width, slot.height) / 2
      const dx = localPoint.x - (slot.x + slot.width / 2)
      const dy = localPoint.y - (slot.y + slot.height / 2)
      return dx * dx + dy * dy <= radius * radius
    }

    return (
      localPoint.x >= slot.x &&
      localPoint.x <= slot.x + slot.width &&
      localPoint.y >= slot.y &&
      localPoint.y <= slot.y + slot.height
    )
  }

  const getFrameAtDropPosition = (position) => {
    if (!position) return null

    return itemsRef.current.find((item) => (
      item.kind === 'frame' &&
      item.visible !== false &&
      !item.locked &&
      isPointInsideFrameSlot(item, position)
    )) || null
  }

  const updateFrameDropTarget = (event) => {
    event.preventDefault()

    const asset = dragAssetRef.current
    const position = getCanvasDropPosition(event)
    const frame = asset?.type === 'image' ? getFrameAtDropPosition(position) : null

    event.dataTransfer.dropEffect = frame ? 'copy' : 'copy'
    setDropTargetFrameId((current) => (current === frame?.id ? current : frame?.id || null))
    setStageCursor(frame ? 'copy' : 'default')
  }

  const handleCanvasDrop = async (event) => {
    event.preventDefault()

    const asset = dragAssetRef.current
    const position = getCanvasDropPosition(event)
    const targetFrame = asset?.type === 'image' ? getFrameAtDropPosition(position) : null

    dragAssetRef.current = null
    setDropTargetFrameId(null)
    setStageCursor('default')

    if (!asset || !position) return

    if (targetFrame) {
      await addImageToFrame(targetFrame.id, asset.source)
      pendingSelectIdRef.current = targetFrame.id
      requestAnimationFrame(() => {
        selectItem(targetFrame.id)
        attachTransformer(targetFrame.id)
      })
      return
    }

    await addAssetToCanvas(asset, position)
  }

  const isEmptyCanvasTarget = (target) => (
    target === target.getStage() || target.name() === 'workspace-background' || target.name() === 'canvas-background'
  )

  const handleObjectSelect = (event, id) => {
    event.cancelBubble = true

    requestAnimationFrame(() => {
      selectItem(id)
      attachTransformer(id)
    })
  }

  const handleObjectDragStart = (event, id) => {
    event.cancelBubble = true
    activeObjectDragRef.current = id
    if (justDroppedIdRef.current === id) {
      justDroppedIdRef.current = null
    }
    setSelectedId(id)
    requestAnimationFrame(() => {
      attachTransformer(id)
    })
    setStageCursor('move')
  }

  const handleObjectDragEnd = (event, id) => {
    event.cancelBubble = true

    if (activeObjectDragRef.current !== id) return

    const node = event.target
    const item = itemsRef.current.find((current) => current.id === id)
    const nextPosition = item
      ? getClampedCanvasPosition(item.w, item.h, { x: node.x(), y: node.y() })
      : { x: node.x(), y: node.y() }

    activeObjectDragRef.current = null
    setStageCursor(isSpaceDown ? 'grab' : 'default')

    // NEW: Cek apakah image canvas di-drag ke dalam frame slot
    if (item?.kind === 'image') {
      const itemCenter = {
        x: nextPosition.x + item.w / 2,
        y: nextPosition.y + item.h / 2,
      }
      const targetFrame = getFrameAtDropPosition(itemCenter)

      if (targetFrame) {
        // Masukkan gambar ke frame, hapus item gambar dari canvas
        updateItem(targetFrame.id, {
          frameImageSrc: item.src,
          frameImageScale: 1,
          frameImagePosition: { x: 0, y: 0 },
          frameImageFit: 'cover',
        })
        setItems((current) => current.filter((i) => i.id !== id))
        setDropTargetFrameId(null)

        pendingSelectIdRef.current = targetFrame.id
        requestAnimationFrame(() => {
          selectItem(targetFrame.id)
          attachTransformer(targetFrame.id)
        })
        return
      }
    }

    node.position(nextPosition)
    updateItem(id, nextPosition)
  }

  const finishTextEditing = useCallback(() => {
    if (!editingText) return

    updateItem(editingText.id, { text: editingText.value })
    setEditingText(null)
    requestAnimationFrame(() => {
      attachTransformer(editingText.id)
    })
  }, [attachTransformer, editingText])

  const cancelTextEditing = useCallback(() => {
    if (!editingText) return

    skipInlineTextBlurRef.current = true
    setEditingText(null)
    requestAnimationFrame(() => {
      attachTransformer(editingText.id)
    })
  }, [attachTransformer, editingText])

  const editTextObject = (id) => {
    const item = itemsRef.current.find((current) => current.id === id)

    if (!item || item.kind !== 'text') return

    selectItem(id)
    setEditingText({ id, value: item.text })
    attachTransformer(null)
  }

const handleFrameImageEdit = (id) => {
  // id === null berarti keluar dari edit mode (dblclick kedua)
  if (!id) {
    finishFrameImageEdit()
    return
  }
 
  const frame = itemsRef.current.find((item) => item.id === id)
  if (!frame || frame.kind !== 'frame' || !frame.frameImageSrc) return
 
  setEditingFrameId(id)
  selectItem(id)
  // FIX: Jangan hapus transformer saat masuk edit mode
  // Biarkan transformer tetap aktif tapi frame tidak bisa di-drag
  // attachTransformer(null)  <-- HAPUS baris ini
}

const beginPan = (event) => {
  const stage = stageRef.current
  const pointer = stage?.getPointerPosition()

  if (!pointer) return

  targetCameraRef.current = cameraRef.current

  panSessionRef.current = {
    pointer,
    camera: cameraRef.current,
  }
  setIsPanning(true)
  setStageCursor('grabbing')
  event.evt.preventDefault()
}

const handleStageMouseDown = (event) => {
  if (activeObjectDragRef.current) return
 
  if (editingFrameId) {
    // FIX: Cek apakah yang diklik adalah frame yang sedang di-edit
    // Jika klik di luar frame, keluar dari edit mode
    const clickedId = event.target?.id?.() || event.target?.getParent?.()?.id?.()
    if (isEmptyCanvasTarget(event.target) || clickedId !== editingFrameId) {
      finishFrameImageEdit()
    }
    return
  }
 
  if (editingText && isEmptyCanvasTarget(event.target)) {
    finishTextEditing()
    return
  }
 
  if (justDroppedIdRef.current) return
 
  const isMiddleMouse = event.evt.button === 1
  const isEmpty = isEmptyCanvasTarget(event.target)
 
  if (isSpaceDown || isMiddleMouse) {
    beginPan(event)
    return
  }
 
  if (isEmpty) {
    deselectCanvas()
    beginPan(event)
  }
}

const handleStageMouseMove = () => {
  if (activeObjectDragRef.current) {
    const draggedItem = itemsRef.current.find(i => i.id === activeObjectDragRef.current)
    if (draggedItem?.kind === 'image') {
      const stage = stageRef.current
      const pointer = stage?.getPointerPosition()
      if (pointer) {
        const worldPos = getWorldPointFromViewport(pointer)
        const frame = getFrameAtDropPosition(worldPos)
        setDropTargetFrameId(frame?.id || null)
      }
    }
    return
  }

  const stage = stageRef.current
  const session = panSessionRef.current
  const pointer = stage?.getPointerPosition()

  if (!session || !pointer) return

  applyCamera({
    ...session.camera,
    x: session.camera.x + pointer.x - session.pointer.x,
    y: session.camera.y + pointer.y - session.pointer.y,
  })
}

const endPan = () => {
  if (!panSessionRef.current) return

  panSessionRef.current = null
  setIsPanning(false)
  setStageCursor(isSpaceDown ? 'grab' : 'default')
  targetCameraRef.current = cameraRef.current
}

const handleWheel = (event) => {
  event.evt.preventDefault()

  const stage = stageRef.current
  const pointer = stage?.getPointerPosition()

  if (!pointer) return

  // FIX: Trackpad 2-finger pan support.
  // On trackpads, wheel events WITHOUT ctrlKey are pan gestures (horizontal + vertical scroll).
  // Only ctrlKey=true means pinch-to-zoom on a trackpad, or a regular mouse wheel scroll.
  // Regular mouse wheel (no trackpad, no ctrl): deltaX≈0, treat as vertical zoom.
  // We detect trackpad pan by checking if deltaX is non-trivial OR if it's a non-ctrlKey
  // wheel event where the source looks like a trackpad (fractional deltas, or deltaX != 0).
  const isTrackpadPan = !event.evt.ctrlKey && (
    Math.abs(event.evt.deltaX) > 1 || // horizontal scroll = always pan
    // Vertical-only non-ctrl: could be mouse wheel (zoom) or trackpad scroll (pan).
    // We distinguish by deltaMode: trackpads use DOM_DELTA_PIXEL (0), mouse wheels
    // typically use DOM_DELTA_LINE (1). Fractional pixel deltas also signal trackpad.
    (event.evt.deltaMode === 0 && !Number.isInteger(event.evt.deltaY))
  )

  if (isTrackpadPan) {
    // Pan the canvas by the trackpad scroll delta
    const currentCamera = cameraRef.current
    const panned = {
      scale: currentCamera.scale,
      x: currentCamera.x - event.evt.deltaX,
      y: currentCamera.y - event.evt.deltaY,
    }
    // Cancel any ongoing zoom animation so pan is immediate
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
      zoomAnimationRef.current = null
    }
    applyCamera(panned)
    targetCameraRef.current = cameraRef.current
    return
  }



  // Zoom: ctrlKey (pinch) or plain mouse wheel
  const targetCamera = targetCameraRef.current
  const actualCamera = cameraRef.current
  const zoomIntensity = event.evt.ctrlKey ? 1.035 : zoomSpeed
  const nextScale = Math.min(
    maxZoom,
    Math.max(minZoom, event.evt.deltaY < 0 ? targetCamera.scale * zoomIntensity : targetCamera.scale / zoomIntensity),
  )
  const worldPoint = {
    x: (pointer.x - actualCamera.x) / actualCamera.scale,
    y: (pointer.y - actualCamera.y) / actualCamera.scale,
  }

  animateCameraTo({
    scale: nextScale,
    x: pointer.x - worldPoint.x * nextScale,
    y: pointer.y - worldPoint.y * nextScale,
  })
}

const handleOutsideWorkspacePointerDown = (event) => {
  if (event.target === event.currentTarget) {
    deselectCanvas()
  }
}

const renderPanel = () => {
  console.log('[DEBUG] renderPanel called - activePanel:', activePanel, 'selectedItem:', selectedItem?.id, 'selectedItem.kind:', selectedItem?.kind)

  if (isColorPickerOpen && selectedItem?.kind === 'text' && colorPickerTarget) {
    const isFillTarget = colorPickerTarget === 'fill'
    const currentGradientType = isFillTarget
      ? (selectedItem.gradientType || 'solid')
      : (selectedItem.strokeGradientType || 'solid')
    const currentColor = isFillTarget ? (selectedItem.fill || '#2b2830') : (selectedItem.stroke || '#000000')
    const currentStops = isFillTarget
      ? (selectedItem.gradientStops || [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#ec4899' }])
      : (selectedItem.strokeGradientStops || [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#ec4899' }])
    const currentAngle = isFillTarget
      ? (selectedItem.gradientAngle || 90)
      : (selectedItem.strokeGradientAngle || 90)

    return (
      <>
        <div className="workspace-font-picker-header">
          <button
            type="button"
            className="workspace-back-button"
            onClick={() => {
              setIsColorPickerOpen(false)
              setColorPickerTarget(null)
            }}
          >
            ←
          </button>
          <div className="workspace-color-picker-title">
            {isFillTarget ? 'Text Fill' : 'Stroke Fill'}
          </div>
        </div>
        <div className="workspace-color-picker-content">
          <div className="workspace-gradient-section">
            <div className="workspace-gradient-header">
              <span className="workspace-gradient-label">Fill Type</span>
              <div className="workspace-gradient-toggle">
                <button
                  type="button"
                  className={`workspace-gradient-toggle-btn ${currentGradientType === 'solid' ? 'active' : ''}`}
                  onClick={() => {
                    if (isFillTarget) {
                      updateItem(selectedItem.id, { gradientType: 'solid' })
                    } else {
                      updateItem(selectedItem.id, { strokeGradientType: 'solid' })
                    }
                  }}
                >
                  Solid
                </button>
                <button
                  type="button"
                  className={`workspace-gradient-toggle-btn ${currentGradientType === 'linear' ? 'active' : ''}`}
                  onClick={() => {
                    if (isFillTarget) {
                      updateItem(selectedItem.id, {
                        gradientType: 'linear',
                        gradientStops: currentStops,
                        gradientAngle: currentAngle
                      })
                    } else {
                      updateItem(selectedItem.id, {
                        strokeGradientType: 'linear',
                        strokeGradientStops: currentStops,
                        strokeGradientAngle: currentAngle
                      })
                    }
                  }}
                >
                  Linear
                </button>
                <button
                  type="button"
                  className={`workspace-gradient-toggle-btn ${currentGradientType === 'radial' ? 'active' : ''}`}
                  onClick={() => {
                    if (isFillTarget) {
                      updateItem(selectedItem.id, {
                        gradientType: 'radial',
                        gradientStops: currentStops
                      })
                    } else {
                      updateItem(selectedItem.id, {
                        strokeGradientType: 'radial',
                        strokeGradientStops: currentStops
                      })
                    }
                  }}
                >
                  Radial
                </button>
              </div>
            </div>
          </div>

          {currentGradientType === 'solid' && (
            <div className="workspace-color-solid-section">
              <label className="workspace-color-picker-field">
                Color
                <div className={`workspace-color-picker-input-large-wrapper ${!currentColor ? 'is-null' : ''}`}>
                  <input
                    type="color"
                    value={currentColor || '#000000'}
                    onChange={(event) => {
                      if (isFillTarget) {
                        updateItem(selectedItem.id, { fill: event.target.value })
                      } else {
                        updateItem(selectedItem.id, { stroke: event.target.value })
                      }
                    }}
                    className="workspace-color-picker-input-large"
                  />
                  {!currentColor && (
                    <div className="workspace-color-picker-null-overlay">
                      <div className="workspace-color-picker-transparent-bg"></div>
                      <div className="workspace-color-picker-null-line"></div>
                    </div>
                  )}
                </div>
              </label>

              <div className="workspace-color-presets">
                {/* None/Transparent preset */}
                <button
                  type="button"
                  className="workspace-color-preset workspace-color-preset-none"
                  onClick={() => {
                    if (isFillTarget) {
                      updateItem(selectedItem.id, { fill: null })
                    } else {
                      updateItem(selectedItem.id, { stroke: null, strokeWidth: 0 })
                    }
                  }}
                  title="None"
                >
                  <span className="workspace-color-preset-none-icon"></span>
                </button>
                {['#2b2830', '#ffffff', '#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="workspace-color-preset"
                    style={{ background: color }}
                    onClick={() => {
                      if (isFillTarget) {
                        updateItem(selectedItem.id, { fill: color })
                      } else {
                        updateItem(selectedItem.id, { stroke: color })
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {currentGradientType !== 'solid' && (
            <>
              <div className="workspace-gradient-presets">
                {[
                  [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#ec4899' }],
                  [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#3b82f6' }],
                  [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#ef4444' }],
                  [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#06b6d4' }],
                  [{ offset: 0, color: '#8b5cf6' }, { offset: 0.5, color: '#ec4899' }, { offset: 1, color: '#f59e0b' }]
                ].map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    className="workspace-gradient-preset"
                    style={{ background: `linear-gradient(90deg, ${preset.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})` }}
                    onClick={() => {
                      if (isFillTarget) {
                        updateItem(selectedItem.id, { gradientStops: preset })
                      } else {
                        updateItem(selectedItem.id, { strokeGradientStops: preset })
                      }
                    }}
                  />
                ))}
              </div>

              {currentGradientType === 'linear' && (
                <label className="workspace-typography-field workspace-typography-field-full">
                  Angle
                  <div className="workspace-gradient-angle-control">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={currentAngle}
                      onChange={(event) => {
                        if (isFillTarget) {
                          updateItem(selectedItem.id, { gradientAngle: Number(event.target.value) })
                        } else {
                          updateItem(selectedItem.id, { strokeGradientAngle: Number(event.target.value) })
                        }
                      }}
                      className="workspace-gradient-angle-slider"
                    />
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={currentAngle}
                      onChange={(event) => {
                        if (isFillTarget) {
                          updateItem(selectedItem.id, { gradientAngle: Number(event.target.value) })
                        } else {
                          updateItem(selectedItem.id, { strokeGradientAngle: Number(event.target.value) })
                        }
                      }}
                      className="workspace-gradient-angle-input"
                    />
                    <span className="workspace-gradient-angle-unit">°</span>
                  </div>
                </label>
              )}

              <div className="workspace-gradient-stops">
                <div className="workspace-gradient-stops-header">
                  <span>Color Stops</span>
                  <button
                    type="button"
                    className="workspace-gradient-add-stop"
                    onClick={() => {
                      const stops = currentStops
                      const newOffset = stops.length > 0 ? 0.5 : 0
                      const newStops = [...stops, { offset: newOffset, color: '#ffffff' }].sort((a, b) => a.offset - b.offset)
                      if (isFillTarget) {
                        updateItem(selectedItem.id, { gradientStops: newStops })
                      } else {
                        updateItem(selectedItem.id, { strokeGradientStops: newStops })
                      }
                    }}
                  >
                    + Add Stop
                  </button>
                </div>
                <div className="workspace-gradient-stops-list">
                  {currentStops.map((stop, index) => (
                    <div key={index} className="workspace-gradient-stop-row">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(event) => {
                          const stops = [...currentStops]
                          stops[index] = { ...stops[index], color: event.target.value }
                          if (isFillTarget) {
                            updateItem(selectedItem.id, { gradientStops: stops })
                          } else {
                            updateItem(selectedItem.id, { strokeGradientStops: stops })
                          }
                        }}
                        className="workspace-gradient-stop-color"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(stop.offset * 100)}
                        onChange={(event) => {
                          const stops = [...currentStops]
                          stops[index] = { ...stops[index], offset: Number(event.target.value) / 100 }
                          const sortedStops = stops.sort((a, b) => a.offset - b.offset)
                          if (isFillTarget) {
                            updateItem(selectedItem.id, { gradientStops: sortedStops })
                          } else {
                            updateItem(selectedItem.id, { strokeGradientStops: sortedStops })
                          }
                        }}
                        className="workspace-gradient-stop-slider"
                      />
                      <span className="workspace-gradient-stop-value">{Math.round(stop.offset * 100)}%</span>
                      {currentStops.length > 2 && (
                        <button
                          type="button"
                          className="workspace-gradient-remove-stop"
                          onClick={() => {
                            const stops = [...currentStops]
                            stops.splice(index, 1)
                            if (isFillTarget) {
                              updateItem(selectedItem.id, { gradientStops: stops })
                            } else {
                              updateItem(selectedItem.id, { strokeGradientStops: stops })
                            }
                          }}
                          title="Remove stop"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </>
    )
  }

  if (isFontPickerOpen && selectedItem?.kind === 'text') {
    const filteredFonts = availableFonts.filter((font) =>
      font.name.toLowerCase().includes(fontSearchQuery.toLowerCase()) ||
      font.category.toLowerCase().includes(fontSearchQuery.toLowerCase())
    )

    return (
      <>
        <div className="workspace-font-picker-header">
          <button
            type="button"
            className="workspace-back-button"
            onClick={() => {
              setIsFontPickerOpen(false)
              setFontSearchQuery('')
            }}
          >
            ←
          </button>
          <div className="workspace-font-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search fonts..."
              value={fontSearchQuery}
              onChange={(event) => setFontSearchQuery(event.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="workspace-font-list">
          {filteredFonts.map((font) => (
            <button
              type="button"
              key={font.family}
              className={`workspace-font-item ${selectedItem.fontFamily === font.family ? 'active' : ''}`}
              onClick={() => {
                updateItem(selectedItem.id, { fontFamily: font.family })
              }}
            >
              <span className="workspace-font-preview" style={{ fontFamily: font.family }}>
                {font.name}
              </span>
              <small>{font.category}</small>
            </button>
          ))}
        </div>
      </>
    )
  }

  // FIX BUG 2: Check activePanel === 'layers' BEFORE selectedItem
  // This prevents auto-switch to properties panel when selecting a layer
  if (activePanel === 'layers') {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="workspace-layer-list">
            {items.map((item) => (
              <SortableLayerItem
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={(id) => {
                  console.log('[DEBUG] Layer onSelect called with id:', id, 'current activePanel:', activePanel)
                  setSelectedId(id)
                  // FIX: Do NOT change activePanel - it should already be 'layers'
                  // Just select the item, panel will stay open because activePanel === 'layers'
                }}
                onToggleVisibility={(id) => {
                  const targetItem = items.find(i => i.id === id)
                  updateItem(id, { visible: targetItem.visible === false })
                }}
                onToggleLock={(id) => {
                  const targetItem = items.find(i => i.id === id)
                  updateItem(id, { locked: !targetItem.locked })
                }}
                onDelete={deleteObject}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  if (selectedItem) {
    const supportsRadius = ['image', 'note', 'card', 'palette'].includes(selectedItem.kind)

    return (
      <>
        <div className="workspace-panel-heading">
          <span>{selectedItem.kind} selected</span>
          <strong>{selectedItem.id}</strong>
        </div>
        <div className="workspace-selection-actions">
          <button
            type="button"
            className="workspace-lock-toggle"
            onClick={() => updateItem(selectedItem.id, { locked: !selectedItem.locked })}
          >
            {selectedItem.locked ? <Lock size={15} /> : <Unlock size={15} />}
            {selectedItem.locked ? 'Unlock' : 'Lock'}
          </button>
          <button
            type="button"
            className="workspace-delete-toggle"
            onClick={deleteSelectedObject}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
        <div className="workspace-control-grid">
          {['x', 'y', 'w', 'h', 'rotation'].map((field) => (
            <label key={field}>
              {field}
              <input
                type="number"
                value={Math.round((selectedItem[field] ?? 0) * 100) / 100}
                step={1}
                onChange={(event) => updateItem(selectedItem.id, { [field]: Number(event.target.value) })}
              />
            </label>
          ))}
        </div>
        {selectedItem.kind === 'image' && (
          <>
            <div className="workspace-filter-row">
              {['Cinematic', 'Muted', 'Dreamy', 'Noir', 'Vibrant'].map((preset) => (
                <button type="button" key={preset}>{preset}</button>
              ))}
            </div>
            <div className="workspace-slider-list">
              {['Brightness', 'Contrast', 'Saturation', 'Blur', 'Shadow'].map((label) => (
                <label key={label}>{label}<input type="range" min="0" max="100" defaultValue="35" /></label>
              ))}
            </div>
          </>
        )}
        {supportsRadius && (
          <div className="workspace-slider-list">
            <label>
              Radius
              <input
                type="range"
                min="0"
                max="80"
                value={selectedItem.radius ?? 0}
                onChange={(event) => updateItem(selectedItem.id, { radius: Number(event.target.value) })}
              />
            </label>
          </div>
        )}
        {selectedItem.kind === 'frame' && (
          <div className="workspace-frame-controls">
            <div className="workspace-section-title">Frame Image</div>
            {!selectedItem.frameImageSrc ? (
              <button
                type="button"
                className="workspace-frame-add-image"
                onClick={() => {
                  // For now, use a placeholder image
                  // In production, this would open file picker or asset browser
                  const placeholderImages = [
                    imageSources['art-1'],
                    imageSources['art-2'],
                    imageSources['art-3'],
                    imageSources['art-4'],
                    imageSources['art-5'],
                    imageSources['project-art-chromatic'],
                    imageSources['project-art-noir'],
                    imageSources['project-art-nexus'],
                  ]
                  const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)]
                  addImageToFrame(selectedItem.id, randomImage)
                }}
              >
                <Plus size={16} />
                Add Image to Frame
              </button>
            ) : (
              <>
                <div className="workspace-frame-image-preview">
                  <img src={selectedItem.frameImageSrc} alt="Frame content" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                </div>
                <div className="workspace-frame-image-actions">
                  <button
                    type="button"
                    className="workspace-frame-replace-image"
                    onClick={() => {
                      const placeholderImages = [
                        imageSources['art-1'],
                        imageSources['art-2'],
                        imageSources['art-3'],
                        imageSources['art-4'],
                        imageSources['art-5'],
                        imageSources['project-art-chromatic'],
                        imageSources['project-art-noir'],
                        imageSources['project-art-nexus'],
                      ]
                      const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)]
                      addImageToFrame(selectedItem.id, randomImage)
                    }}
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    className="workspace-frame-remove-image"
                    onClick={() => {
                      updateItem(selectedItem.id, {
                        frameImageSrc: null,
                        frameImage: null,
                        frameImageScale: 1,
                        frameImagePosition: { x: 0, y: 0 },
                      })
                    }}
                  >
                    Remove Image
                  </button>
                </div>
                <div className="workspace-slider-list">
                  <label>
                    Image Fit
                    <select
                      value={selectedItem.frameImageFit || 'cover'}
                      onChange={(event) => updateItem(selectedItem.id, { frameImageFit: event.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    >
                      <option value="cover">Cover (Fill Frame)</option>
                      <option value="contain">Contain (Fit Inside)</option>
                    </select>
                  </label>
                </div>
              </>
            )}
          </div>
        )}
        {selectedItem.kind === 'text' && (
          <>
            <label className="workspace-text-editor">
              Text
              <textarea
                ref={textEditorRef}
                value={selectedItem.text}
                onChange={(event) => updateItem(selectedItem.id, { text: event.target.value })}
              />
            </label>

            <div className="workspace-section-card">
              <div className="workspace-section-title">Typography</div>

              <label className="workspace-typography-field workspace-typography-field-full">
                Font
                <button
                  type="button"
                  className="workspace-font-picker-trigger"
                  onClick={() => setIsFontPickerOpen(true)}
                >
                  {availableFonts.find((f) => f.family === selectedItem.fontFamily)?.name || 'Inter'}
                </button>
              </label>

              <label className="workspace-typography-field workspace-typography-field-full">
                Size
                <input
                  type="number"
                  min="8"
                  max="180"
                  value={selectedItem.fontSize || 48}
                  onChange={(event) => updateItem(selectedItem.id, { fontSize: Number(event.target.value) })}
                />
              </label>

              <div className="workspace-typography-grid">
                <label className="workspace-typography-field">
                  Color
                  <button
                    type="button"
                    className={`workspace-color-preview-button ${!selectedItem.fill && (!selectedItem.gradientType || selectedItem.gradientType === 'solid') ? 'workspace-color-preview-none' : ''}`}
                    style={{
                      background: selectedItem.gradientType === 'linear' && selectedItem.gradientStops
                        ? `linear-gradient(90deg, ${selectedItem.gradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                        : selectedItem.gradientType === 'radial' && selectedItem.gradientStops
                          ? `radial-gradient(circle, ${selectedItem.gradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                          : selectedItem.fill || 'transparent'
                    }}
                    onClick={() => {
                      setColorPickerTarget('fill')
                      setIsColorPickerOpen(true)
                    }}
                  >
                    {!selectedItem.fill && (!selectedItem.gradientType || selectedItem.gradientType === 'solid') && (
                      <span className="workspace-color-preview-none-icon"></span>
                    )}
                  </button>
                </label>
                <label className="workspace-typography-field">
                  Stroke Color
                  <button
                    type="button"
                    className={`workspace-color-preview-button ${!selectedItem.stroke && (!selectedItem.strokeGradientType || selectedItem.strokeGradientType === 'solid') ? 'workspace-color-preview-none' : ''}`}
                    style={{
                      background: selectedItem.strokeGradientType === 'linear' && selectedItem.strokeGradientStops
                        ? `linear-gradient(90deg, ${selectedItem.strokeGradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                        : selectedItem.strokeGradientType === 'radial' && selectedItem.strokeGradientStops
                          ? `radial-gradient(circle, ${selectedItem.strokeGradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                          : selectedItem.stroke || 'transparent'
                    }}
                    onClick={() => {
                      setColorPickerTarget('stroke')
                      setIsColorPickerOpen(true)
                    }}
                  >
                    {!selectedItem.stroke && (!selectedItem.strokeGradientType || selectedItem.strokeGradientType === 'solid') && (
                      <span className="workspace-color-preview-none-icon"></span>
                    )}
                  </button>
                </label>
              </div>

              <label className="workspace-typography-field workspace-typography-field-full">
                Stroke
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={selectedItem.strokeWidth || 0}
                  onChange={(event) => updateItem(selectedItem.id, { strokeWidth: Number(event.target.value) })}
                />
              </label>

              <label className="workspace-typography-field workspace-typography-field-full">
                Opacity
                <div className="workspace-opacity-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((selectedItem.opacity ?? 1) * 100)}
                    onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
                    className="workspace-opacity-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round((selectedItem.opacity ?? 1) * 100)}
                    onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
                    className="workspace-opacity-input"
                  />
                  <span className="workspace-opacity-unit">%</span>
                </div>
              </label>

              <div className="workspace-section-divider"></div>

              <div className="workspace-style-toolbar">
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.isBold ? 'active' : ''}`}
                  onClick={() => updateItem(selectedItem.id, { isBold: !selectedItem.isBold })}
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.isItalic ? 'active' : ''}`}
                  onClick={() => updateItem(selectedItem.id, { isItalic: !selectedItem.isItalic })}
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.isUnderline ? 'active' : ''}`}
                  onClick={() => updateItem(selectedItem.id, { isUnderline: !selectedItem.isUnderline })}
                  title="Underline"
                >
                  <Underline size={16} />
                </button>
              </div>

              <div className="workspace-style-toolbar">
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'left' ? 'active' : ''}`}
                  onClick={() => updateItem(selectedItem.id, { align: 'left' })}
                  title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'center' ? 'active' : ''}`}
                  onClick={() => updateItem(selectedItem.id, { align: 'center' })}
                  title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'right' ? 'active' : ''}`}
                  onClick={() => updateItem(selectedItem.id, { align: 'right' })}
                  title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'justify' ? 'active' : ''}`}
                  onClick={() => updateItem(selectedItem.id, { align: 'justify' })}
                  title="Justify"
                >
                  <AlignJustify size={16} />
                </button>
              </div>
            </div>

            <div className="workspace-section-card">
              <div className="workspace-section-title">Canvas Align</div>
              <div className="workspace-canvas-align-grid-modern">
                <button
                  type="button"
                  className="workspace-align-btn-modern"
                  title="Align Left"
                  onClick={() => {
                    const newX = canvasBounds.x + 20
                    updateItem(selectedItem.id, { x: newX })
                  }}
                >
                  <AlignStartHorizontal size={18} />
                  <span>Left</span>
                </button>
                <button
                  type="button"
                  className="workspace-align-btn-modern"
                  title="Align Center"
                  onClick={() => {
                    const newX = canvasBounds.x + (canvasBounds.width - selectedItem.w) / 2
                    updateItem(selectedItem.id, { x: newX })
                  }}
                >
                  <AlignHorizontalDistributeCenter size={18} />
                  <span>Center</span>
                </button>
                <button
                  type="button"
                  className="workspace-align-btn-modern"
                  title="Align Right"
                  onClick={() => {
                    const newX = canvasBounds.x + canvasBounds.width - selectedItem.w - 20
                    updateItem(selectedItem.id, { x: newX })
                  }}
                >
                  <AlignEndHorizontal size={18} />
                  <span>Right</span>
                </button>
                <button
                  type="button"
                  className="workspace-align-btn-modern"
                  title="Align Top"
                  onClick={() => {
                    const newY = canvasBounds.y + 20
                    updateItem(selectedItem.id, { y: newY })
                  }}
                >
                  <AlignStartVertical size={18} />
                  <span>Top</span>
                </button>
                <button
                  type="button"
                  className="workspace-align-btn-modern"
                  title="Align Middle"
                  onClick={() => {
                    const newY = canvasBounds.y + (canvasBounds.height - selectedItem.h) / 2
                    updateItem(selectedItem.id, { y: newY })
                  }}
                >
                  <AlignVerticalDistributeCenter size={18} />
                  <span>Middle</span>
                </button>
                <button
                  type="button"
                  className="workspace-align-btn-modern"
                  title="Align Bottom"
                  onClick={() => {
                    const newY = canvasBounds.y + canvasBounds.height - selectedItem.h - 20
                    updateItem(selectedItem.id, { y: newY })
                  }}
                >
                  <AlignEndVertical size={18} />
                  <span>Bottom</span>
                </button>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  if (!activePanel) {
    return null
  }

  if (activePanel === 'assets') {
    const visibleAssets = assetTab === 'boards' ? boardAssets : assetLibrary

    return (
      <>
        <div className="workspace-panel-tabs">
          <button type="button" className={assetTab === 'boards' ? 'active' : ''} onClick={() => setAssetTab('boards')}>Boards</button>
          <button type="button" className={assetTab === 'assets' ? 'active' : ''} onClick={() => setAssetTab('assets')}>Assets</button>
        </div>
        {assetTab === 'boards' && (
          <div className="workspace-board-strip">
            {boards.map((board) => (
              <button
                type="button"
                className={selectedBoard?.id === board.id ? 'active' : ''}
                key={board.id}
                onClick={() => setSelectedBoardId(board.id)}
              >
                <span>{board.name}</span>
                <strong>{getAssetsByBoardId(board.id).length}</strong>
              </button>
            ))}
          </div>
        )}
        <div className="workspace-asset-grid">
          {visibleAssets.map((asset, index) => (
            <button
              type="button"
              key={`${asset.title}-${asset.imageKey || asset.type}-${index}`}
              draggable
              onClick={() => addAssetToCanvas(asset)}
              onDragStart={(event) => beginAssetDrag(event, asset)}
              onDragEnd={() => {
                setTimeout(() => {
                  dragAssetRef.current = null
                  setDropTargetFrameId(null)
                  setStageCursor('default')
                }, 100)
              }}
            >
              <span className="workspace-asset-preview">{asset.type === 'image' ? <img src={asset.source} alt="" /> : asset.type === 'text' ? 'Aa' : <Sparkles size={28} />}</span>
              <strong>{asset.title}</strong>
              {asset.boardName && <small>{asset.boardName}</small>}
            </button>
          ))}
        </div>
      </>
    )
  }

  if (activePanel === 'elements') {
    if (activeElementCategory) {
      if (activeElementCategory === 'Shapes') {
        return (
          <>
            <div className="workspace-elements-header">
              <button
                type="button"
                className="workspace-back-button"
                onClick={() => setActiveElementCategory(null)}
              >
                ←
              </button>
              <div className="workspace-elements-title">Shapes</div>
            </div>
            <div className="workspace-shapes-browser">
              {SHAPE_CATEGORIES.map((category) => {
                const shapes = getShapesByCategory(category.id)
                if (shapes.length === 0) return null

                return (
                  <div key={category.id} className="workspace-shapes-category">
                    <div className="workspace-shapes-category-header">
                      <span className="workspace-shapes-category-title">{category.label}</span>
                    </div>
                    <div className="workspace-shapes-row">
                      {shapes.map((shape) => (
                        <button
                          type="button"
                          key={shape.id}
                          className="workspace-shape-card"
                          onClick={() => addShapeToCanvas(shape)}
                        >
                          <div className="workspace-shape-preview">
                            {shape.shapeType === 'rect' && (
                              <div
                                className="workspace-shape-preview-rect"
                                style={{
                                  width: '40px',
                                  height: shape.defaultProps.cornerRadius ? '30px' : '40px',
                                  borderRadius: shape.defaultProps.cornerRadius ? '8px' : '0',
                                  background: '#a78bfa',
                                }}
                              />
                            )}
                            {shape.shapeType === 'circle' && (
                              <div
                                className="workspace-shape-preview-circle"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: '#a78bfa',
                                }}
                              />
                            )}
                            {shape.shapeType === 'ellipse' && (
                              <div
                                className="workspace-shape-preview-ellipse"
                                style={{
                                  width: '50px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: '#a78bfa',
                                }}
                              />
                            )}
                            {shape.shapeType === 'polygon' && (
                              <div className="workspace-shape-preview-icon">
                                {shape.defaultProps.sides === 3 && <TriangleIcon size={32} strokeWidth={1.5} />}
                                {shape.defaultProps.sides === 4 && <DiamondIcon size={32} strokeWidth={1.5} />}
                                {shape.defaultProps.sides === 5 && <HexagonIcon size={32} strokeWidth={1.5} />}
                                {shape.defaultProps.sides === 6 && <HexagonIcon size={32} strokeWidth={1.5} />}
                                {shape.defaultProps.sides === 8 && <HexagonIcon size={32} strokeWidth={1.5} />}
                              </div>
                            )}
                            {shape.shapeType === 'star' && (
                              <div className="workspace-shape-preview-icon">
                                <StarIcon size={32} strokeWidth={1.5} />
                              </div>
                            )}
                            {shape.shapeType === 'line' && (
                              <div
                                className="workspace-shape-preview-line"
                                style={{
                                  width: '50px',
                                  height: '3px',
                                  background: '#a78bfa',
                                  borderRadius: '2px',
                                }}
                              />
                            )}
                            {shape.shapeType === 'arrow' && (
                              <div className="workspace-shape-preview-icon">
                                <ArrowUpRightIcon size={32} strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <span className="workspace-shape-label">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      }

      if (activeElementCategory === 'Frames') {
        return (
          <>
            <div className="workspace-elements-header">
              <button
                type="button"
                className="workspace-back-button"
                onClick={() => setActiveElementCategory(null)}
              >
                ←
              </button>
              <div className="workspace-elements-title">Frames</div>
            </div>
            <div className="workspace-shapes-browser">
              {FRAME_CATEGORIES.map((category) => {
                const frames = getFramesByCategory(category.id)
                if (frames.length === 0) return null

                return (
                  <div key={category.id} className="workspace-shapes-category">
                    <div className="workspace-shapes-category-header">
                      <span className="workspace-shapes-category-title">{category.label}</span>
                    </div>
                    <div className="workspace-shapes-row">
                      {frames.map((frame) => (
                        <button
                          type="button"
                          key={frame.id}
                          className="workspace-shape-card"
                          onClick={() => addFrameToCanvas(frame)}
                        >
                          <div className="workspace-shape-preview">
                            {/* Basic frames */}
                            {frame.frameType === 'rect' && (
                              <div
                                style={{
                                  width: '40px',
                                  height: '50px',
                                  border: '2px solid #a78bfa',
                                  borderRadius: frame.defaultProps.cornerRadius ? '6px' : '0',
                                  background: 'transparent',
                                }}
                              />
                            )}
                            {frame.frameType === 'circle' && (
                              <div
                                style={{
                                  width: '45px',
                                  height: '45px',
                                  border: '2px solid #a78bfa',
                                  borderRadius: '50%',
                                  background: 'transparent',
                                }}
                              />
                            )}
                            {frame.frameType === 'arch' && (
                              <div
                                style={{
                                  width: '40px',
                                  height: '50px',
                                  border: '2px solid #a78bfa',
                                  borderRadius: '20px 20px 0 0',
                                  background: 'transparent',
                                }}
                              />
                            )}
                            {/* Polaroid frames */}
                            {frame.frameType.startsWith('polaroid') && (
                              <div
                                style={{
                                  width: '40px',
                                  height: '50px',
                                  border: '2px solid #a78bfa',
                                  borderRadius: '2px',
                                  background: 'transparent',
                                  borderBottom: '8px solid #a78bfa',
                                }}
                              />
                            )}
                            {/* Film frames */}
                            {frame.frameType.startsWith('film') && (
                              <div
                                style={{
                                  width: frame.frameType === 'film-horizontal' ? '50px' : '35px',
                                  height: frame.frameType === 'film-horizontal' ? '30px' : '50px',
                                  border: '2px solid #a78bfa',
                                  background: 'transparent',
                                  position: 'relative',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  inset: '4px',
                                  border: '1px solid #a78bfa',
                                }} />
                              </div>
                            )}
                            {frame.frameType === 'cinema' && (
                              <div
                                style={{
                                  width: '50px',
                                  height: '30px',
                                  background: '#a78bfa',
                                  position: 'relative',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  inset: '6px 4px',
                                  background: 'rgba(18, 18, 20, 0.9)',
                                }} />
                              </div>
                            )}
                            {/* Grid frames */}
                            {frame.frameType.startsWith('grid') && (
                              <div
                                style={{
                                  width: '50px',
                                  height: '40px',
                                  border: '2px solid #a78bfa',
                                  background: 'transparent',
                                  display: 'grid',
                                  gridTemplateColumns: frame.frameType === 'grid-3' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                                  gap: '2px',
                                  padding: '2px',
                                }}
                              >
                                {Array.from({ length: frame.frameType === 'grid-3' ? 3 : frame.frameType === 'grid-collage' ? 4 : 2 }).map((_, i) => (
                                  <div key={i} style={{ border: '1px solid #a78bfa' }} />
                                ))}
                              </div>
                            )}
                            {/* Organic frames */}
                            {(frame.frameType === 'blob' || frame.frameType === 'wave' || frame.frameType === 'liquid') && (
                              <div
                                style={{
                                  width: '45px',
                                  height: '45px',
                                  border: '2px solid #a78bfa',
                                  borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                                  background: 'transparent',
                                }}
                              />
                            )}
                            {/* Device frames */}
                            {frame.frameType === 'phone' && (
                              <div
                                style={{
                                  width: '25px',
                                  height: '50px',
                                  border: '3px solid #a78bfa',
                                  borderRadius: '6px',
                                  background: 'transparent',
                                  position: 'relative',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '10px',
                                  height: '3px',
                                  background: '#a78bfa',
                                  borderRadius: '2px',
                                }} />
                              </div>
                            )}
                            {frame.frameType === 'tablet' && (
                              <div
                                style={{
                                  width: '40px',
                                  height: '50px',
                                  border: '4px solid #a78bfa',
                                  borderRadius: '4px',
                                  background: 'transparent',
                                }}
                              />
                            )}
                            {frame.frameType === 'browser' && (
                              <div
                                style={{
                                  width: '50px',
                                  height: '40px',
                                  border: '2px solid #a78bfa',
                                  borderRadius: '4px',
                                  background: 'transparent',
                                  position: 'relative',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '0',
                                  left: '0',
                                  right: '0',
                                  height: '8px',
                                  background: '#a78bfa',
                                  borderRadius: '2px 2px 0 0',
                                }} />
                              </div>
                            )}
                            {frame.frameType === 'desktop' && (
                              <div
                                style={{
                                  width: '50px',
                                  height: '35px',
                                  border: '3px solid #a78bfa',
                                  borderRadius: '2px',
                                  background: 'transparent',
                                  position: 'relative',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-8px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '20px',
                                  height: '6px',
                                  background: '#a78bfa',
                                }} />
                              </div>
                            )}
                          </div>
                          <span className="workspace-shape-label">{frame.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      }

      return (
        <>
          <div className="workspace-elements-header">
            <button
              type="button"
              className="workspace-back-button"
              onClick={() => setActiveElementCategory(null)}
            >
              ←
            </button>
            <div className="workspace-elements-title">{activeElementCategory}</div>
          </div>
          <div className="workspace-elements-empty" style={{ padding: '20px', color: '#a09ca6', textAlign: 'center' }}>
            Coming soon...
          </div>
        </>
      )
    }

    return (
      <div className="workspace-manual-panel">
        {['Shapes', 'Frames', 'Dividers', 'Connectors'].map((label) => (
          <button
            type="button"
            key={label}
            onClick={() => setActiveElementCategory(label)}
          >
            <Box size={16} />{label}
          </button>
        ))}
      </div>
    )
  }

  // Default panel content for text, settings, etc.
  return (
    <div className="workspace-manual-panel">
      {activePanel === 'text' && (
        // FIX: Improved typography preset hierarchy with proper visual differentiation
        <div className="workspace-typography-compact">
          {typographyPresets.map((preset) => (
            <button
              type="button"
              key={preset.label}
              className="workspace-typography-row"
              onClick={() => addText(preset.text, preset.size, preset.isBold, preset.isItalic)}
            >
              <div className="workspace-typography-left">
                <span className="workspace-typography-icon">{preset.icon}</span>
                <span className="workspace-typography-label">{preset.label}</span>
              </div>
              <div className="workspace-typography-right">
                <span
                  className="workspace-typography-preview"
                  style={{
                    fontWeight: preset.isBold ? 700 : 400,
                    fontStyle: preset.isItalic ? 'italic' : 'normal',
                    // FIX: Scale preview font size proportionally so hierarchy is visible
                    fontSize: preset.size >= 72 ? 22 : preset.size >= 48 ? 18 : preset.size >= 28 ? 15 : preset.size >= 18 ? 12 : 11,
                  }}
                >
                  {preset.preview}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {activePanel === 'settings' && ['16:9 Canvas', 'Soft Cream Background', 'Grid Toggle', 'Snap to Grid', 'Private Workspace'].map((label) => <button type="button" key={label}><Settings size={16} />{label}</button>)}
    </div>
  )
}

// Main Workspace component render
  return (
    <section
      className={`workspace-page ${isRightPanelOpen ? 'panel-open' : 'panel-collapsed'}`}
      onPointerDown={handleOutsideWorkspacePointerDown}
    >
    <aside className="workspace-left-rail">
      {panelTools.map(({ id, label, icon: Icon }) => (
        <button
          type="button"
          className={activePanel === id && !selectedItem && isRightPanelOpen ? 'active' : ''}
          key={id}
          title={label}
          onClick={() => {
            setSelectedId(null)
            openRightPanel(id)
          }}
        >
          <Icon size={18} strokeWidth={1.7} />
        </button>
      ))}
      <span />
      {navItems.map(({ label, to, icon: Icon }) => (
        <Link key={label} to={to} title={label}>
          <Icon size={18} strokeWidth={1.7} />
        </Link>
      ))}
    </aside>

    <header className="workspace-topbar">
      <div className="workspace-title"><MousePointer2 size={16} />Creative Exploration 2026</div>
      <div className="workspace-avatars"><span /><span /><span /><strong>+6</strong></div>
      <label className="workspace-search"><Search size={15} /><input placeholder="Search moodboard" /></label>
      <button type="button"><Share2 size={15} />Share</button>
      <button type="button" className="workspace-export"><ArrowDownToLine size={15} />Export</button>
    </header>

    <main
      className="workspace-canvas-wrap"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          deselectCanvas()
        }
      }}
    >
      <div
        ref={viewportRef}
        className="workspace-stage-shell"
        onDragOver={updateFrameDropTarget}
        onDragLeave={() => {
          setDropTargetFrameId(null)
          setStageCursor('default')
        }}
        onDrop={handleCanvasDrop}
      >
        <Stage
          ref={stageRef}
          width={viewportSize.width}
          height={viewportSize.height}
          draggable={false}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onContextMenu={(event) => event.evt.preventDefault()}
          style={{ cursor: isPanning ? 'grabbing' : stageCursor }}
        >
          <Layer>
            <Group
              name="world-layer"
              x={camera.x}
              y={camera.y}
              scaleX={camera.scale}
              scaleY={camera.scale}
            >
              <Rect
                name="workspace-background"
                x={virtualWorkspace.x}
                y={virtualWorkspace.y}
                width={virtualWorkspace.width}
                height={virtualWorkspace.height}
                fill="#ebe8dd"
              />
              {workspaceGridLines.map((points, index) => (
                <Line key={`grid-${index}`} points={points} stroke="#d8d2c7" strokeWidth={1} opacity={0.44} listening={false} />
              ))}
              <Rect
                name="canvas-background"
                width={canvasSize.width}
                height={canvasSize.height}
                fill="#f4f1e8"
                shadowColor="#21182b"
                shadowBlur={42}
                shadowOpacity={0.18}
                shadowOffsetY={18}
              />
              <Group
                name="canvas-content"
                clipX={canvasBounds.x}
                clipY={canvasBounds.y}
                clipWidth={canvasBounds.width}
                clipHeight={canvasBounds.height}
              >
                {connectors.map((points, index) => <Line key={index} points={points} stroke="#a9a198" strokeWidth={1.2} lineCap="round" lineJoin="round" listening={false} />)}
                {/* FIX BUG 3: Reverse items array for correct z-index
                      - First item in layers panel = rendered LAST = appears FRONTMOST
                      - Last item in layers panel = rendered FIRST = appears BACKMOST
                      This matches Figma/Photoshop/Canva behavior */}
                {[...items].reverse().map((item) => (
                  <CanvasItem
                    key={item.id}
                    item={item}
                    selectedId={selectedId}
                    onSelect={handleObjectSelect}
                    onChange={(patch) => updateItem(item.id, patch)}
                    onDragStart={handleObjectDragStart}
                    onDragEnd={handleObjectDragEnd}
                    onTextEdit={editTextObject}
                    isTextEditing={editingText?.id === item.id}
                    onCursor={setStageCursor}
                    disableDrag={isSpaceDown || isPanning}
                    dropTargetFrameId={dropTargetFrameId}
                    editingFrameId={editingFrameId}
                    onFrameImageEdit={handleFrameImageEdit}
                  />
                ))}
              </Group>
              <Transformer
                ref={transformerRef}
                rotateEnabled
                keepRatio
                enabledAnchors={
                  selectedItem?.kind === 'text'
                    ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']
                    : ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']
                }
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 40) return oldBox;
                  if (selectedItem?.kind !== 'text' && newBox.height < 40) return oldBox;
                  return newBox;
                }}
                borderStroke="#a970ff"
                anchorFill="#f4e8ff"
                anchorStroke="#a970ff"
                anchorSize={9}
              />
            </Group>
          </Layer>
        </Stage>
        {editingFrameId && (
  <div
    style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(59, 130, 246, 0.92)',
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
      padding: '6px 16px',
      borderRadius: 20,
      pointerEvents: 'none',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
    }}
  >
    <span style={{ fontSize: 16 }}>✋</span>
    Drag gambar untuk mengatur posisi · Double-click untuk selesai
  </div>
)}

        {editingText && inlineTextEditorStyle && (
          <textarea
            key={editingText.id}
            ref={inlineTextEditorRef}
            className="workspace-inline-text-editor"
            value={editingText.value}
            style={inlineTextEditorStyle}
            onChange={(event) => setEditingText((current) => (current ? { ...current, value: event.target.value } : current))}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onBlur={() => {
              if (skipInlineTextBlurRef.current) {
                skipInlineTextBlurRef.current = false
                return
              }

              finishTextEditing()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                cancelTextEditing()
              }

              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                finishTextEditing()
              }
            }}
          />
        )}
      </div>
    </main>

    <aside className={`workspace-right-panel ${isRightPanelOpen ? 'is-open' : 'is-collapsed'}`}>
      {renderPanel()}
    </aside>

    <nav className="workspace-bottom-toolbar" aria-label="Canvas quick actions">
      <button type="button" className="active" onClick={() => { setSelectedId(null); openRightPanel('elements') }}><Plus size={16} />Add Element</button>
      <button type="button"><Sparkles size={16} />Quick Actions</button>
      <button type="button" onClick={addNote}><MessageSquarePlus size={16} />Add Note</button>
      <button type="button" onClick={() => { setSelectedId(null); openRightPanel('assets') }}><Compass size={16} />Inspiration</button>
    </nav>

    <ZoomControlPill
      currentZoom={camera.scale}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onResetZoom={handleResetZoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
    />
  </section>
  )
}

export default Workspace
