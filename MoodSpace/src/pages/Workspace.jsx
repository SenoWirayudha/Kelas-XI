import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Konva from 'konva'
import {
  ArrowDownToLine,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  Box,
  Circle as CircleIcon,
  Compass,
  FolderOpen,
  Group as GroupIcon,
  GripVertical,
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
  Unlink,
  Italic,
  Underline,
  Undo2,
  Redo2,
  Copy,
  CopyPlus,
  ClipboardPaste,
  Crop,
  MoreHorizontal,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  BringToFront,
  SendToBack,
  Square as SquareIcon,
  Triangle as TriangleIcon,
  Star as StarIcon,
  ArrowUpRight as ArrowUpRightIcon,
  Minus as MinusIcon,
  Diamond as DiamondIcon,
  Hexagon as HexagonIcon,
  Cloud as CloudIcon,
  CloudCheck,
  CloudAlert,
  CloudOff,
  LoaderCircle,
  SlidersHorizontal,
  ChevronDown,
  X,
  Paintbrush,
  PenTool,
} from 'lucide-react'
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage, Line, Transformer, Circle, Ellipse, RegularPolygon, Star, Arrow, Path } from 'react-konva'
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
import ConfirmationModal from '../components/ConfirmationModal'
import { imageSources } from '../utils/imageSources'
import { SHAPE_LIBRARY, SHAPE_CATEGORIES, getShapesByCategory } from '../data/shapeLibrary'
import { FRAME_LIBRARY, FRAME_CATEGORIES, getFramesByCategory, getFrameById } from '../data/frameLibrary'

// Constants
import {
  defaultCanvasSize, virtualWorkspace,
  transformAnchors, cornerTransformAnchors,
  snapTolerance, marginSnapTolerance, edgeSnapTolerance, canvasInnerMargin, marginGuideActivationDistance,
  minZoom, maxZoom, zoomSpeed, imageMaxSize, basicFrameTypes,
} from '../constants/canvasConstants'
import {
  canvasRatioPresets, connectorPresets, typographyPresets,
  availableFonts, connectorAnchorSides, BLEND_MODES,
} from '../constants/uiConstants'

// Utils
import { clamp, getDynamicGridLines, buildWorkspaceGridLines, rectsIntersect } from '../utils/mathUtils'
import { getClampedCanvasPosition, getCanvasContainedSize, getWorldPointFromViewport, getItemsBounds } from '../utils/canvasPositionUtils'
import { getArrowShapePath, getShapeTextBounds, getShapeMinSizeForText, getShapeMinHeightForTextWidth } from '../utils/shapeUtils'
import { fetchGoogleFonts, getGoogleFontsApiKey } from '../utils/googleFontsApi'
import { isGridFrame, getResolvedFrameSlot, getResolvedFrameSlots, clampFrameImagePosition, getMinFrameImageZoom } from '../utils/frameUtils'
import { getItemAnchorPoint, getClosestAnchorToPoint, getBestConnectorAnchors, resolveConnectorEndpointPoint, getConnectorLinePoints, getConnectorCurvePath, getConnectorArrowTail } from '../utils/connectorUtils'
import { getShadowProps, getCanvasBackgroundProps, loadImageMetadata, preloadFont } from '../utils/konvaUtils'
import { applyImageFilters } from '../utils/imageFilters'
import { getDefaultEffects } from '../utils/effectUtils'
import { effectManager } from '../utils/konva-effects-engine'

// Components
import { ObjectAnchors, ConnectorEndpointAnchors } from './canvas/ConnectorAnchors'
import ConnectorRenderer from '../components/canvas/renderers/ConnectorRenderer'
import ImageRenderer from '../components/canvas/renderers/ImageRenderer'
import TextRenderer from '../components/canvas/renderers/TextRenderer'
import ShapeRenderer from '../components/canvas/renderers/ShapeRenderer'
import FrameRenderer from '../components/canvas/renderers/FrameRenderer'
import GlobalAdjustmentLayer from '../components/canvas/GlobalAdjustmentLayer'
import AdjustmentSliders from '../components/panels/AdjustmentSliders'
import FxPanel from '../components/panels/FxPanel'
import ToolBrushPanel from '../components/panels/ToolBrushPanel'
import ToolBezierPanel from '../components/panels/ToolBezierPanel'
import ToolRemoveBgPanel from '../components/panels/ToolRemoveBgPanel'

import { getCanvasItemTransformPatch } from '../engines/transformEngine'
import { useAuth } from '../context/authState'
import { useMediaUpload } from '../hooks/useMediaUpload'
import { useCanvasImage, useCanvasImages } from '../hooks/useCanvasImages'
import { autosaveWorkspace, getWorkspace, saveWorkspace, setWorkspaceThumbnail, updateWorkspace } from '../lib/api/workspaces'
import { getHomeFeed, publishWorkspace } from '../lib/api/posts'
import { getBoard, listBoards } from '../lib/api/boards'
import { searchPosts as searchPublicPosts } from '../lib/api/search'
import { searchExternalImages } from '../lib/api/externalImages'
import { recordInterestEvent } from '../lib/api/interest'
import { uploadMediaFile } from '../lib/api/media'

let canvasSize = defaultCanvasSize
let canvasBounds = { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height }

const isBasicFrame = (item) => item?.kind === 'frame' && basicFrameTypes.has(item.frameType)

const getSnapshotHash = (snapshot) => JSON.stringify(snapshot)

const isWorkspaceMetadataNewerThanVersion = (workspace) => {
  if (!workspace?.updatedAt || !workspace?.latestVersion?.createdAt) return false
  const updatedAt = new Date(workspace.updatedAt).getTime()
  const versionCreatedAt = new Date(workspace.latestVersion.createdAt).getTime()
  return Number.isFinite(updatedAt) && Number.isFinite(versionCreatedAt) && updatedAt > versionCreatedAt
}

const sanitizeTransparentTextFills = (node) => {
  if (!node) return node
  const textNodes = [
    ...(node.getClassName?.() === 'Text' ? [node] : []),
    ...(node.find?.('Text') || []),
  ]
  textNodes.forEach((textNode) => {
    if (textNode.fillEnabled?.() !== false) return
    textNode.setAttrs({
      fill: 'rgba(0,0,0,0)',
      fillEnabled: false,
    })
    textNode.clearCache?.()
  })
  return node
}

const addWorkspaceItemClones = ({ stage, exportLayer, items, filterItem }) => {
  const renderedCompositeGroups = new Set()
  ;[...items].reverse().forEach((item) => {
    if (item.visible === false || item.isAdjustmentLayer || !filterItem(item)) return
    if (item.groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude' || items.some((candidate) => candidate.groupId === item.groupId && (candidate.compositeMode === 'mask' || candidate.compositeMode === 'exclude')))) {
      if (renderedCompositeGroups.has(item.groupId)) return
      const compositeNode = stage.findOne(`#composite-${item.groupId}`)
      if (compositeNode) {
        const compositeClone = sanitizeTransparentTextFills(compositeNode.clone({ listening: false }))
        compositeClone.draggable?.(false)
        exportLayer.add(compositeClone)
        renderedCompositeGroups.add(item.groupId)
        return
      }
    }
    const itemNode = stage.findOne(`#${item.id}`) || stage.findOne(`[id="${item.id}"]`)
    if (!itemNode) return
    const itemClone = sanitizeTransparentTextFills(itemNode.clone({ listening: false }))
    itemClone.draggable?.(false)
    exportLayer.add(itemClone)

    // Apply effects + adjustments via unified pipeline
    // Apply ke image/text child node (bukan group) agar shadow tetap independen
    try {
      const targetNode = itemClone.findOne('.canvas-image-main') || itemClone.findOne('Image') || itemClone.findOne('Text') || itemClone
      effectManager.applyAll(targetNode, item.effects || {}, item)
    } catch {
      // fallback — effects mungkin gagal di offscreen stage
    }
  })
}

const getItemCompositeOperation = (item) => {
  if (item.compositeMode === 'mask') return 'destination-in'
  if (item.compositeMode === 'exclude') return 'destination-out'
  if (item.blendMode && item.blendMode !== 'source-over') return item.blendMode
  return null
}

const addAdjustmentOverlayClones = ({ stage, exportLayer }) => {
  const overlays = stage.find('.adjustment-overlay')
  overlays.forEach((overlay) => {
    const overlayClone = overlay.clone({ listening: false })
    overlayClone.draggable?.(false)
    exportLayer.add(overlayClone)
  })
}

const getRestoredItemCounter = (items) => (
  Math.max(
    items.length,
    ...items.map((item) => {
      const match = String(item.id || '').match(/(\d+)$/)
      return match ? Number(match[1]) : 0
    }),
  )
)

const getInitialCanvasZoom = (ratio, width, height, viewportSize) => {
  const preferredZoomByRatio = {
    '16:9': 0.75,
    '9:16': 0.52,
    '4:5': 0.6,
    '1:1': 0.68,
    'a4-portrait': 0.56,
    'a4-landscape': 0.66,
  }
  const preferredZoom = preferredZoomByRatio[ratio] || 0.7
  const fitZoom = Math.min(
    (viewportSize.width * 0.82) / Math.max(1, width),
    (viewportSize.height * 0.82) / Math.max(1, height),
  )
  return Math.min(preferredZoom, Math.max(0.18, fitZoom || preferredZoom))
}

const cropPresets = [
  { id: 'free', label: 'Dimensi Bebas', ratio: null },
  { id: 'original', label: 'Asli', ratio: 'original' },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
]

const clampCropBoxToImage = (box, item, cropOffset, imageSize, ratio = null) => {
  const leftBound = Math.max(0, cropOffset.x)
  const topBound = Math.max(0, cropOffset.y)
  const rightBound = Math.min(item.w, cropOffset.x + imageSize.w)
  const bottomBound = Math.min(item.h, cropOffset.y + imageSize.h)
  const maxWidth = Math.max(24, rightBound - leftBound)
  const maxHeight = Math.max(24, bottomBound - topBound)
  let width = Math.max(24, Math.min(maxWidth, box.w))
  let height = Math.max(24, Math.min(maxHeight, box.h))

  if (ratio) {
    if (width / height > ratio) width = height * ratio
    else height = width / ratio
    if (width > maxWidth) {
      width = maxWidth
      height = width / ratio
    }
    if (height > maxHeight) {
      height = maxHeight
      width = height * ratio
    }
  }

  return {
    x: clamp(box.x, leftBound, rightBound - width),
    y: clamp(box.y, topBound, bottomBound - height),
    w: width,
    h: height,
  }
}

const toDatabaseImageAsset = (asset, overrides = {}) => {
  const source = asset.source || asset.url || asset.publicUrl
  const aspectRatio = asset.aspectRatio || (asset.width && asset.height ? asset.width / asset.height : 1)
  return {
    title: asset.title || 'Saved image',
    type: 'image',
    source,
    imageKey: asset.imageKey || asset.mediaId || source,
    mediaId: asset.mediaId,
    tags: asset.tags || [],
    description: asset.description || '',
    originalFilename: asset.originalFilename || '',
    w: aspectRatio >= 1 ? 230 : 170,
    h: aspectRatio >= 1 ? Math.round(230 / aspectRatio) : 230,
    boardId: asset.boardId,
    ...overrides,
  }
}

const normalizeSearchText = (value = '') => (
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

const compactSearchText = (value = '') => normalizeSearchText(value).replace(/[^a-z0-9]+/g, '')

const getAssetSearchScore = (asset, query) => {
  const normalizedQuery = normalizeSearchText(query)
  const compactQuery = compactSearchText(query)
  if (!normalizedQuery) return 1
  const tags = Array.isArray(asset.tags) ? asset.tags : []
  const fields = [
    asset.title,
    asset.boardName,
    asset.description,
    asset.originalFilename,
    asset.imageKey,
    ...tags,
  ].filter(Boolean)
  const normalizedFields = fields.map(normalizeSearchText)
  const compactFields = fields.map(compactSearchText)
  const tokens = normalizedQuery.split(' ').filter(Boolean)

  let score = 0
  normalizedFields.forEach((field, index) => {
    const compact = compactFields[index]
    if (field === normalizedQuery) score += 12
    if (compact && compact === compactQuery) score += 12
    if (field.includes(normalizedQuery)) score += 5
    if (compact && compactQuery && compact.includes(compactQuery)) score += 5
    tokens.forEach((token) => {
      if (field.includes(token)) score += 1.5
    })
  })

  tags.forEach((tag) => {
    const normalizedTag = normalizeSearchText(tag)
    const compactTag = compactSearchText(tag)
    if (normalizedTag === normalizedQuery || compactTag === compactQuery) score += 8
    else if (normalizedTag.includes(normalizedQuery) || compactTag.includes(compactQuery)) score += 3
  })

  return score
}

const getAssetRelatedScore = (asset, signals = []) => {
  if (!signals.length) return 0
  const assetFields = [
    asset.title,
    asset.boardName,
    asset.description,
    asset.originalFilename,
    asset.imageKey,
    ...(Array.isArray(asset.tags) ? asset.tags : []),
  ].filter(Boolean)
  const normalizedAssetFields = assetFields.map(normalizeSearchText)
  const compactAssetFields = assetFields.map(compactSearchText)

  return signals.reduce((total, signal, index) => {
    const recencyWeight = Math.max(0.35, 1 - index * 0.09)
    let score = 0
    if (signal.mediaId && asset.mediaId && signal.mediaId === asset.mediaId) score -= 30
    if (signal.postId && asset.postId && signal.postId === asset.postId) score -= 4
    if (signal.boardId && asset.boardId && signal.boardId === asset.boardId) score += 2.5
    ;(signal.normalizedFields || []).forEach((field, fieldIndex) => {
      const compact = signal.compactFields?.[fieldIndex] || ''
      normalizedAssetFields.forEach((candidate, candidateIndex) => {
        const candidateCompact = compactAssetFields[candidateIndex]
        if (!field || !candidate) return
        if (candidate === field) score += 7
        else if (candidate.includes(field) || field.includes(candidate)) score += 2
        if (compact && candidateCompact && compact === candidateCompact) score += 7
        else if (compact && candidateCompact && (candidateCompact.includes(compact) || compact.includes(candidateCompact))) score += 2.5
      })
    })
    ;(signal.tokens || []).forEach((token) => {
      normalizedAssetFields.forEach((candidate) => {
        if (candidate.includes(token)) score += 0.7
      })
    })
    return total + score * recencyWeight
  }, 0)
}

const postToBrowseAssets = (post) => {
  const media = post.media?.length ? post.media : post.cover ? [post.cover] : []
  const allowedFeedAssetSources = new Set(['post', 'workspace_thumbnail'])
  return media
    .filter((entry) => (
      entry?.url &&
      (!entry.sourceType || allowedFeedAssetSources.has(entry.sourceType))
    ))
    .map((entry, index) => toDatabaseImageAsset({
      url: entry.url,
      width: entry.width,
      height: entry.height,
      mediaId: entry.mediaId || `${post.id}-${index}`,
      imageKey: `${post.id}-${entry.mediaId || index}`,
      title: media.length > 1 ? `${post.title || 'Untitled post'} ${index + 1}` : (post.title || 'Untitled post'),
      tags: post.tags || post.metadata?.tags || [],
      description: post.caption || '',
    }, {
      boardName: post.author?.username ? `@${post.author.username}` : 'Home Feed',
      postId: post.id,
      sourceType: 'home-feed',
    }))
}

const externalImageToBrowseAsset = (image) => toDatabaseImageAsset({
  url: image.url,
  width: image.width,
  height: image.height,
  mediaId: image.id,
  imageKey: image.id,
  title: image.title || 'Open image',
  tags: image.tags || [],
  description: image.description || '',
}, {
  boardName: image.provider === 'wikimedia' ? 'Wikimedia Commons' : 'Open Image',
  sourceType: 'external-image',
  externalProvider: image.provider,
  externalId: image.externalId,
  previewSource: image.thumbnailUrl || image.url,
  sourceUrl: image.sourceUrl,
  license: image.license,
  author: image.author,
})

const getExternalBrowseQuery = (query, signals = []) => {
  const directQuery = normalizeSearchText(query)
  if (directQuery) return directQuery
  const signal = signals[0]
  const fields = [
    ...(signal?.tokens || []),
    ...(signal?.normalizedFields || []),
  ].filter((field) => field && field.length >= 3)
  return fields.slice(0, 4).join(' ') || 'design inspiration'
}

const mixInternalExternalAssets = (internalAssets = [], externalAssets = []) => {
  if (!externalAssets.length) return internalAssets
  if (!internalAssets.length) return externalAssets
  const mixed = []
  let internalIndex = 0
  let externalIndex = 0
  while (internalIndex < internalAssets.length || externalIndex < externalAssets.length) {
    for (let count = 0; count < 7 && internalIndex < internalAssets.length; count += 1) {
      mixed.push(internalAssets[internalIndex])
      internalIndex += 1
    }
    for (let count = 0; count < 3 && externalIndex < externalAssets.length; count += 1) {
      mixed.push(externalAssets[externalIndex])
      externalIndex += 1
    }
  }
  return mixed
}

const normalizeAssetContextSignals = (signals = []) => (
  Array.isArray(signals)
    ? signals.slice(0, 8).map((signal) => ({
      key: signal.key || `${signal.mediaId || signal.imageKey || signal.postId || 'asset'}-${Date.now()}`,
      mediaId: signal.mediaId || null,
      postId: signal.postId || null,
      boardId: signal.boardId || null,
      normalizedFields: Array.isArray(signal.normalizedFields) ? signal.normalizedFields.filter(Boolean).slice(0, 16) : [],
      compactFields: Array.isArray(signal.compactFields) ? signal.compactFields.filter(Boolean).slice(0, 16) : [],
      tokens: Array.isArray(signal.tokens) ? signal.tokens.filter(Boolean).slice(0, 24) : [],
    }))
    : []
)

const initialItems = [
]

const panelTools = [
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'assets', label: 'Assets', icon: FolderOpen },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const toolItems = [
  { id: 'brush', label: 'Brush', icon: Paintbrush },
  { id: 'bezier', label: 'Bezier', icon: PenTool },
  { id: 'removeBg', label: 'Remove BG', icon: Sparkles },
]

// FIX: Improved typography preset hierarchy — Heading is bold/large, Subheading is
// semibold/medium, Paragraph is regular, matching Canva/Figma visual hierarchy.
const navItems = [
  { label: 'Home', to: '/feed', icon: Home },
  { label: 'Projects', to: '/projects', icon: FolderOpen },
]

const createCheckerboardPattern = () => {
  if (typeof document === 'undefined') return null
  const tileSize = 24
  const pattern = document.createElement('canvas')
  pattern.width = tileSize * 2
  pattern.height = tileSize * 2
  const context = pattern.getContext('2d')
  if (!context) return null
  context.fillStyle = '#f3f0e8'
  context.fillRect(0, 0, pattern.width, pattern.height)
  context.fillStyle = '#ded9cf'
  context.fillRect(tileSize, 0, tileSize, tileSize)
  context.fillRect(0, tileSize, tileSize, tileSize)
  return pattern
}

// Sortable Layer Item Component for drag & drop
function SortableLayerItem({ item, isSelected, onSelect, onOpenProperties, onOpenFx, onToggleVisibility, onToggleLock, onDelete }) {
  const lastTapRef = useRef(0)
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
      case 'group':
        return <GroupIcon size={16} />
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
        onDoubleClick={() => onOpenProperties(item.id)}
        onTouchEnd={() => {
          const now = Date.now()
          if (now - lastTapRef.current < 320) {
            onOpenProperties(item.id)
            lastTapRef.current = 0
            return
          }
          lastTapRef.current = now
        }}
      >
        <span className="workspace-layer-icon">{getLayerIcon()}</span>
        <span className="workspace-layer-label">{item.kind === 'group' ? `Group (${item.members?.length || 0})` : item.id}</span>
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
        className="workspace-layer-action"
        aria-label="Open effects"
        onClick={() => onOpenFx?.(item.id)}
      >
        <Sparkles size={16} />
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

const canvasItemRenderers = {
  connector: ConnectorRenderer,
  image: ImageRenderer,
  text: TextRenderer,
  shape: ShapeRenderer,
  frame: FrameRenderer,
}

function DefaultItemRenderer({ item, commonProps }) {
  const groupRef = useRef(null)
  const filterItemRef = useRef(item)
  const rAFRef = useRef(null)

  useEffect(() => {
    filterItemRef.current = item
    if (rAFRef.current) return
    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null
      const node = groupRef.current
      if (!node) return
      effectManager.applyAll(node, filterItemRef.current.effects)
    })
    return () => {
      if (rAFRef.current) { cancelAnimationFrame(rAFRef.current); rAFRef.current = null }
    }
  }, [item.effects])

  if (item.isAdjustmentLayer) {
    return (
      <Group ref={groupRef} {...commonProps}>
        <Rect width={item.w} height={item.h} fill="transparent" listening={false} />
      </Group>
    )
  }

  if (item.kind === 'palette') {
    return (
      <Group
        ref={groupRef}
        {...commonProps}
        onDblClick={(event) => {
          event.cancelBubble = true
          commonProps.onTextEdit?.(item.id)
        }}
        onDblTap={(event) => {
          event.cancelBubble = true
          commonProps.onTextEdit?.(item.id)
        }}
      >
        <Rect width={item.w} height={item.h} cornerRadius={item.radius ?? 14} fill="#ebe6dd" {...getShadowProps(item)} />
        {['#c9a5ef', '#a695e5', '#62cfda'].map((color, index) => (
          <Rect key={color} x={14 + index * 40} y={12} width={28} height={30} cornerRadius={7} fill={color} listening={false} />
        ))}
      </Group>
    )
  }

  return (
    <Group ref={groupRef} {...commonProps}>
      <Rect width={item.w} height={item.h} cornerRadius={item.radius ?? (item.kind === 'note' ? 10 : 16)} fill={item.fill} {...getShadowProps(item)} />
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

function CanvasItem({ item, items, selectedId, selectedIds, onSelect, onChange, onDragStart, onDragMove, onDragEnd, onTextEdit, isTextEditing, onCursor, onItemHover, disableDrag, isShiftDown, getActiveTransformAnchor, dropTargetFrameId, dropTargetSlotIndex, editingFrameId, editingFrameSlot, onFrameImageEdit, onCropStart, allowComposite = false }) {
  const sizeRef = useRef({ w: item.w, h: item.h })
  const compositeOperation = allowComposite
    ? getItemCompositeOperation(item)
    : (item.blendMode && item.blendMode !== 'source-over' ? item.blendMode : null)

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
    ...(compositeOperation ? { globalCompositeOperation: compositeOperation } : {}),
    dragBoundFunc: (position) => getClampedCanvasPosition(sizeRef.current.w, sizeRef.current.h, position, canvasBounds),
    onClick: (event) => onSelect(event, item.id),
    onTap: (event) => onSelect(event, item.id),
    onMouseEnter: () => {
      onItemHover(item.id)
      onCursor(item.locked ? 'default' : 'move')
    },
    onMouseLeave: () => {
      onItemHover(null)
      onCursor('default')
    },
    onDragStart: (event) => onDragStart(event, item.id),
    onDragMove: (event) => onDragMove?.(event, item.id),
    onDragEnd: (event) => onDragEnd(event, item.id),
    onTextEdit,
    onTransformEnd: (event) => {
      if (item.kind === 'shape' && (item.shapeType === 'freehand' || item.shapeType === 'bezier-path')) return
      const patch = getCanvasItemTransformPatch({
        item,
        node: event.target,
        isShiftDown,
        activeAnchor: getActiveTransformAnchor?.(),
        canvasBounds,
      })
      onChange(patch)
    },
  }

  const Renderer = canvasItemRenderers[item.kind] || DefaultItemRenderer

  return (
    <Renderer
      item={item}
      items={items}
      commonProps={commonProps}
      selectedId={selectedId}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onChange={onChange}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTextEdit={onTextEdit}
      isTextEditing={isTextEditing}
      onCursor={onCursor}
      onItemHover={onItemHover}
      disableDrag={disableDrag}
      canvasBounds={canvasBounds}
      dropTargetFrameId={dropTargetFrameId}
      dropTargetSlotIndex={dropTargetSlotIndex}
      editingFrameId={editingFrameId}
      editingFrameSlot={editingFrameSlot}
      onFrameImageEdit={onFrameImageEdit}
      getActiveTransformAnchor={getActiveTransformAnchor}
      onCropStart={onCropStart}
    />
  )
}

const drawCompositeMaskPath = (ctx, item) => {
  if (!item) return
  const w = Math.max(1, item.w || 1)
  const h = Math.max(1, item.h || item.fontSize || 1)
  const rotation = ((item.rotation || 0) * Math.PI) / 180

  ctx.save()
  ctx.translate(item.x || 0, item.y || 0)
  if (rotation) ctx.rotate(rotation)
  ctx.beginPath()

  if (item.kind === 'text') {
    ctx.rect(0, 0, w, h)
    ctx.restore()
    return
  }

  if (item.kind === 'shape') {
    if (item.shapeType === 'circle' || item.shapeType === 'ellipse') {
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    } else if (item.shapeType === 'polygon') {
      const sides = Math.max(3, item.sides || 3)
      const radius = Math.min(w, h) / 2
      const cx = w / 2
      const cy = h / 2
      for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    } else if (item.shapeType === 'star') {
      const points = item.numPoints || 5
      const cx = w / 2
      const cy = h / 2
      const outer = Math.min(w, h) / 2
      const inner = Math.min(w, h) * (item.starInnerRatio ?? 0.25)
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outer : inner
        const angle = -Math.PI / 2 + (i * Math.PI) / points
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    } else if (item.shapeType === 'bezier-path' && item.path) {
      const parts = item.path.split(/(?=[MLZ])/i).filter(Boolean)
      let first = true
      for (const part of parts) {
        if (/^z$/i.test(part)) { ctx.closePath(); break }
        const cmd = part[0].toUpperCase()
        const nums = part.slice(1).trim().split(/[, ]+/).map(Number)
        for (let i = 0; i < nums.length; i += 2) {
          const px = nums[i], py = nums[i + 1]
          if (first) { ctx.moveTo(px, py); first = false }
          else ctx.lineTo(px, py)
        }
      }
      if (!/z/i.test(item.path)) ctx.closePath()
    } else {
      const r = Math.max(0, Math.min(item.cornerRadius || 0, w / 2, h / 2))
      if (r) {
        ctx.moveTo(r, 0)
        ctx.lineTo(w - r, 0)
        ctx.quadraticCurveTo(w, 0, w, r)
        ctx.lineTo(w, h - r)
        ctx.quadraticCurveTo(w, h, w - r, h)
        ctx.lineTo(r, h)
        ctx.quadraticCurveTo(0, h, 0, h - r)
        ctx.lineTo(0, r)
        ctx.quadraticCurveTo(0, 0, r, 0)
        ctx.closePath()
      } else {
        ctx.rect(0, 0, w, h)
      }
    }
  } else {
    const r = Math.max(0, Math.min(item.radius || item.cornerRadius || 0, w / 2, h / 2))
    if (r) {
      ctx.moveTo(r, 0)
      ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r)
      ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h)
      ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
    } else {
      ctx.rect(0, 0, w, h)
    }
  }

  ctx.restore()
}

const drawWrappedMaskText = (ctx, item, offsetX, offsetY) => {
  const fontSize = item.fontSize || 48
  const fontStyle = item.fontStyle || [item.isItalic && 'italic', item.isBold && 'bold'].filter(Boolean).join(' ')
  const fontFamily = item.fontFamily || 'Inter, Arial'
  const lineHeight = fontSize * 0.9
  const width = Math.max(1, item.w || 1)
  const rotation = ((item.rotation || 0) * Math.PI) / 180
  const scaleX = item.scaleX || 1
  const scaleY = item.scaleY || 1

  ctx.save()
  ctx.translate((item.x || 0) - offsetX, (item.y || 0) - offsetY)
  if (rotation) ctx.rotate(rotation)
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY)
  ctx.font = `${fontStyle || ''} ${fontSize}px ${fontFamily}`.trim()
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  const align = item.align || 'center'
  const lines = getMaskTextLines(ctx, item.text, width)
  ;(lines.length ? lines : ['']).forEach((line, index) => {
    const lineWidth = ctx.measureText(line).width
    const x = align === 'right'
      ? Math.max(0, width - lineWidth)
      : align === 'left'
        ? 0
        : Math.max(0, (width - lineWidth) / 2)
    ctx.fillText(line, x, index * lineHeight)
  })
  ctx.restore()
}

const getMaskTextLines = (ctx, text, width) => {
  const maxWidth = Math.max(1, width || 1)
  const lines = []
  String(text || '').split('\n').forEach((paragraph) => {
    let current = ''
    const pushCurrent = () => {
      lines.push(current.trimEnd())
      current = ''
    }

    paragraph.split(/(\s+)/).forEach((token) => {
      if (!token) return
      if (/^\s+$/.test(token)) {
        if (current && ctx.measureText(`${current}${token}`).width <= maxWidth) current += token
        return
      }

      Array.from(token).forEach((character) => {
        const next = `${current}${character}`
        if (current && ctx.measureText(next).width > maxWidth) pushCurrent()
        current += character
      })
    })
    pushCurrent()
  })
  return lines
}

const getWrappedMaskTextHeight = (item) => {
  const fontSize = item.fontSize || 48
  const width = Math.max(1, item.w || 1)
  const lineHeight = fontSize * 0.9
  if (typeof document === 'undefined') return Math.max(item.h || 0, lineHeight)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return Math.max(item.h || 0, lineHeight)
  const fontStyle = item.fontStyle || [item.isItalic && 'italic', item.isBold && 'bold'].filter(Boolean).join(' ')
  ctx.font = `${fontStyle || ''} ${fontSize}px ${item.fontFamily || 'Inter, Arial'}`.trim()
  const lineCount = getMaskTextLines(ctx, item.text, width).length
  return Math.max(item.h || 0, Math.max(1, lineCount) * lineHeight)
}

const getCompositeItemBounds = (item) => {
  const x = item.x || 0
  const y = item.y || 0
  const w = Math.max(1, item.w || 1)
  const h = Math.max(1, item.kind === 'text' ? getWrappedMaskTextHeight(item) : (item.h || item.fontSize || 1))
  const rotation = ((item.rotation || 0) * Math.PI) / 180
  const scaleX = item.scaleX || 1
  const scaleY = item.scaleY || 1
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const corners = [
    { x: 0, y: 0 },
    { x: w * scaleX, y: 0 },
    { x: w * scaleX, y: h * scaleY },
    { x: 0, y: h * scaleY },
  ].map((point) => ({
    x: x + point.x * cos - point.y * sin,
    y: y + point.x * sin + point.y * cos,
  }))
  return {
    left: Math.min(...corners.map((point) => point.x)),
    top: Math.min(...corners.map((point) => point.y)),
    right: Math.max(...corners.map((point) => point.x)),
    bottom: Math.max(...corners.map((point) => point.y)),
  }
}

const drawImageItemToCanvas = (ctx, item, image, offsetX, offsetY) => {
  if (!image || item.visible === false) return
  const x = (item.x || 0) - offsetX
  const y = (item.y || 0) - offsetY
  const w = Math.max(1, item.w || image.naturalWidth || image.width || 1)
  const h = Math.max(1, item.h || image.naturalHeight || image.height || 1)
  const rotation = ((item.rotation || 0) * Math.PI) / 180
  const sourceWidth = image.naturalWidth || image.width || w
  const sourceHeight = image.naturalHeight || image.height || h
  const crop = item.imageCropRect ? {
    x: Math.max(0, Math.min(sourceWidth, item.imageCropRect.x || 0)),
    y: Math.max(0, Math.min(sourceHeight, item.imageCropRect.y || 0)),
    width: Math.max(1, Math.min(sourceWidth, item.imageCropRect.width || sourceWidth)),
    height: Math.max(1, Math.min(sourceHeight, item.imageCropRect.height || sourceHeight)),
  } : null
  ctx.save()
  ctx.globalAlpha = item.opacity ?? 1
  ctx.translate(x, y)
  if (rotation) ctx.rotate(rotation)
  if (crop) {
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h)
  } else {
    ctx.drawImage(image, 0, 0, w, h)
  }
  ctx.restore()
}

function CompositeTextBitmap({ sourceItem, destinationItems, bounds, mode }) {
  const imageItems = useMemo(() => destinationItems.filter((item) => item.kind === 'image' && item.src), [destinationItems])
  const loadedImages = useCanvasImages(imageItems.map((item) => item.src))
  const [canvasImage, setCanvasImage] = useState(null)
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setFontReady(false)
    preloadFont(sourceItem?.fontFamily || 'Inter, Arial')
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFontReady(true)
      })
    return () => { cancelled = true }
  }, [sourceItem?.fontFamily])

  useLayoutEffect(() => {
    if (!fontReady || !sourceItem || !bounds || !imageItems.length) {
      setCanvasImage(null)
      return
    }
    const imagesReady = imageItems.every((_, index) => {
      const image = loadedImages[index]
      return image && image.complete && (image.naturalWidth || image.width)
    })
    if (!imagesReady) {
      setCanvasImage(null)
      return
    }

    const sourceWidth = Math.max(1, sourceItem.w || sourceItem.width || 1)
    const wrappedSourceHeight = getWrappedMaskTextHeight({ ...sourceItem, w: sourceWidth })
    const sourceHeight = Math.max(1, sourceItem.h || 0, sourceItem.height || 0, wrappedSourceHeight)
    const textLeft = sourceItem.x || 0
    const textTop = sourceItem.y || 0
    const textRenderItem = { ...sourceItem, x: textLeft, y: textTop, w: sourceWidth, h: sourceHeight }
    const itemBounds = [
      ...imageItems.map((item) => getCompositeItemBounds(item)),
      getCompositeItemBounds(textRenderItem),
    ]
    const groupMinX = Math.min(...itemBounds.map((item) => item.left))
    const groupMinY = Math.min(...itemBounds.map((item) => item.top))
    const groupMaxX = Math.max(...itemBounds.map((item) => item.right))
    const groupMaxY = Math.max(...itemBounds.map((item) => item.bottom))
    const groupRect = {
      x: groupMinX,
      y: groupMinY,
      width: Math.max(1, groupMaxX - groupMinX),
      height: Math.max(1, groupMaxY - groupMinY),
    }
    const width = Math.max(1, Math.ceil(groupRect.width))
    const height = Math.max(1, Math.ceil(groupRect.height))

    const contentCanvas = document.createElement('canvas')
    contentCanvas.width = width
    contentCanvas.height = height
    const contentCtx = contentCanvas.getContext('2d')
    if (!contentCtx) return
    imageItems.forEach((item, index) => {
      drawImageItemToCanvas(contentCtx, item, loadedImages[index], groupMinX, groupMinY)
    })

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (mode === 'mask') {
      drawWrappedMaskText(ctx, textRenderItem, groupMinX, groupMinY)
      ctx.globalCompositeOperation = 'source-in'
      ctx.drawImage(contentCanvas, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    } else {
      ctx.drawImage(contentCanvas, 0, 0)
      ctx.globalCompositeOperation = 'destination-out'
      drawWrappedMaskText(ctx, textRenderItem, groupMinX, groupMinY)
      ctx.globalCompositeOperation = 'source-over'
    }

    setCanvasImage({ canvas, x: groupRect.x, y: groupRect.y })
  }, [bounds, destinationItems, fontReady, imageItems, loadedImages, mode, sourceItem])

  if (!canvasImage || !bounds) return null
  return (
    <KonvaImage
      image={canvasImage.canvas}
      x={canvasImage.x}
      y={canvasImage.y}
      width={canvasImage.canvas.width}
      height={canvasImage.canvas.height}
      listening={false}
      perfectDrawEnabled={false}
    />
  )
}

function CompositeImageBitmap({ sourceItem, destinationItems, bounds, mode }) {
  const imageItems = useMemo(() => destinationItems.filter((item) => item.kind === 'image' && item.src), [destinationItems])
  const loadedImages = useCanvasImages(imageItems.map((item) => item.src))
  const sourceImage = useCanvasImage(sourceItem?.src)
  const [canvasImage, setCanvasImage] = useState(null)

  useLayoutEffect(() => {
    if (!sourceItem || !bounds || !imageItems.length || !sourceImage) {
      setCanvasImage(null)
      return
    }
    const imagesReady = imageItems.every((_, index) => {
      const img = loadedImages[index]
      return img && img.complete && (img.naturalWidth || img.width)
    })
    if (!imagesReady || !sourceImage.complete) {
      setCanvasImage(null)
      return
    }

    const itemBounds = [
      ...imageItems.map((item) => getCompositeItemBounds(item)),
      getCompositeItemBounds(sourceItem),
    ]
    const groupMinX = Math.min(...itemBounds.map((b) => b.left))
    const groupMinY = Math.min(...itemBounds.map((b) => b.top))
    const groupMaxX = Math.max(...itemBounds.map((b) => b.right))
    const groupMaxY = Math.max(...itemBounds.map((b) => b.bottom))
    const width = Math.max(1, Math.ceil(groupMaxX - groupMinX))
    const height = Math.max(1, Math.ceil(groupMaxY - groupMinY))

    const contentCanvas = document.createElement('canvas')
    contentCanvas.width = width
    contentCanvas.height = height
    const contentCtx = contentCanvas.getContext('2d')
    imageItems.forEach((item, index) => {
      drawImageItemToCanvas(contentCtx, item, loadedImages[index], groupMinX, groupMinY)
    })

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (mode === 'mask') {
      drawImageItemToCanvas(ctx, sourceItem, sourceImage, groupMinX, groupMinY)
      ctx.globalCompositeOperation = 'source-in'
      ctx.drawImage(contentCanvas, 0, 0)
    } else {
      ctx.drawImage(contentCanvas, 0, 0)
      ctx.globalCompositeOperation = 'destination-out'
      drawImageItemToCanvas(ctx, sourceItem, sourceImage, groupMinX, groupMinY)
    }
    ctx.globalCompositeOperation = 'source-over'

    setCanvasImage({ canvas, x: groupMinX, y: groupMinY })
  }, [bounds, destinationItems, imageItems, loadedImages, mode, sourceItem, sourceImage])

  if (!canvasImage || !bounds) return null
  return (
    <KonvaImage
      image={canvasImage.canvas}
      x={canvasImage.x}
      y={canvasImage.y}
      width={canvasImage.canvas.width}
      height={canvasImage.canvas.height}
      listening={false}
      perfectDrawEnabled={false}
    />
  )
}

function CompositeCanvasGroup({ entry, items, selectedId, selectedIds, onSelect, onChange, onDragStart, onDragMove, onDragEnd, onTextEdit, isTextEditing, onCursor, onItemHover, disableDrag, isShiftDown, getActiveTransformAnchor, dropTargetFrameId, dropTargetSlotIndex, editingFrameId, editingFrameSlot, onFrameImageEdit, onCropStart, cropSession, canvasSize, onSyncTransformer }) {
  const groupRef = useRef(null)
  const dragStartRef = useRef(null)
  const sourceItem = entry.members.find((item) => item.id === entry.operatorId)
  const destinationItems = entry.members.filter((item) => item.id !== entry.operatorId)
  const orderedDestinationItems = [...destinationItems].reverse()
  const sourceMode = sourceItem?.compositeMode
  const isGroupLocked = entry.members.every((item) => item.locked)
  const isCompositeSelected = entry.members.some((item) => selectedIds?.includes(item.id) || selectedId === item.id)
  const groupBounds = entry.members.reduce((bounds, item) => {
    const itemBounds = getCompositeItemBounds(item)
    const { left, top, right, bottom } = itemBounds
    if (!bounds) return { left, top, right, bottom }
    return {
      left: Math.min(bounds.left, left),
      top: Math.min(bounds.top, top),
      right: Math.max(bounds.right, right),
      bottom: Math.max(bounds.bottom, bottom),
    }
  }, null)

  useLayoutEffect(() => {
    const node = groupRef.current
    if (!node) return
    const recache = () => {
      node.clearCache()
      node.cache({
        x: 0,
        y: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        pixelRatio: 1,
      })
      node.getLayer()?.batchDraw()
    }
    recache()
    const rafId = requestAnimationFrame(recache)
    const shortTimer = window.setTimeout(recache, 120)
    const longTimer = window.setTimeout(recache, 420)
    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(shortTimer)
      window.clearTimeout(longTimer)
      node.clearCache()
    }
  }, [entry.cacheKey, canvasSize.height, canvasSize.width])

  const handleGroupPointerSelect = (event) => {
    event.cancelBubble = true
    if (sourceItem) onSelect(event, sourceItem.id)
  }

  const handleGroupDragStart = (event) => {
    event.cancelBubble = true
    dragStartRef.current = {
      x: event.target.x(),
      y: event.target.y(),
      positions: Object.fromEntries(entry.members.map((item) => [item.id, { x: item.x || 0, y: item.y || 0 }])),
    }
    onCursor('move')
  }

  const handleGroupDragMove = (event) => {
    event.cancelBubble = true
    onSyncTransformer?.()
    groupRef.current?.getLayer()?.batchDraw()
  }

  const handleGroupDragEnd = (event) => {
    event.cancelBubble = true
    const start = dragStartRef.current
    dragStartRef.current = null
    const dx = event.target.x() - (start?.x || 0)
    const dy = event.target.y() - (start?.y || 0)
    event.target.position({ x: 0, y: 0 })
    if (!start || (!dx && !dy)) {
      groupRef.current?.clearCache()
      groupRef.current?.getLayer()?.batchDraw()
      onCursor('default')
      return
    }
    entry.members.forEach((item) => {
      const pos = start.positions[item.id]
      if (!pos || item.locked) return
      onChange(item.id, { x: pos.x + dx, y: pos.y + dy })
    })
    requestAnimationFrame(() => {
      groupRef.current?.clearCache()
      groupRef.current?.getLayer()?.batchDraw()
      onSyncTransformer?.()
    })
    onCursor('default')
  }

  return (
    <Group
      id={`composite-${entry.groupId}`}
      ref={groupRef}
      name="composite-group"
      draggable={!disableDrag && !isGroupLocked}
      onClick={handleGroupPointerSelect}
      onTap={handleGroupPointerSelect}
      onMouseEnter={() => onCursor(isGroupLocked ? 'default' : 'move')}
      onMouseLeave={() => onCursor('default')}
      onDragStart={handleGroupDragStart}
      onDragMove={handleGroupDragMove}
      onDragEnd={handleGroupDragEnd}
    >
      {groupBounds && (
        <Rect
          x={groupBounds.left}
          y={groupBounds.top}
          width={Math.max(1, groupBounds.right - groupBounds.left)}
          height={Math.max(1, groupBounds.bottom - groupBounds.top)}
          fill="rgba(0,0,0,0.001)"
          strokeEnabled={false}
          listening={true}
          onClick={handleGroupPointerSelect}
          onTap={handleGroupPointerSelect}
        />
      )}
      {sourceItem?.kind === 'text' && (sourceMode === 'mask' || sourceMode === 'exclude') ? (
        <>
          <CompositeTextBitmap
            sourceItem={sourceItem}
            destinationItems={orderedDestinationItems}
            bounds={groupBounds}
            mode={sourceMode}
          />
        </>
      ) : sourceItem?.kind === 'image' && (sourceMode === 'mask' || sourceMode === 'exclude') ? (
        <CompositeImageBitmap
          sourceItem={sourceItem}
          destinationItems={orderedDestinationItems}
          bounds={groupBounds}
          mode={sourceMode}
        />
      ) : sourceMode === 'mask' ? (
        <Group
          name="composite-mask-content"
          clipFunc={(ctx) => drawCompositeMaskPath(ctx, sourceItem)}
        >
          {orderedDestinationItems.map((item) => (
            <CanvasItem
              key={item.id}
              item={item}
              items={items}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onChange={(patch) => onChange(item.id, patch)}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onTextEdit={onTextEdit}
              isTextEditing={isTextEditing?.id === item.id}
              onCursor={onCursor}
              onItemHover={onItemHover}
              disableDrag={true}
              isShiftDown={isShiftDown}
              getActiveTransformAnchor={getActiveTransformAnchor}
              dropTargetFrameId={dropTargetFrameId}
              dropTargetSlotIndex={dropTargetSlotIndex}
              editingFrameId={editingFrameId}
              editingFrameSlot={editingFrameSlot}
              onFrameImageEdit={onFrameImageEdit}
              onCropStart={onCropStart}
              isCropTarget={cropSession?.itemId === item.id}
            />
          ))}
        </Group>
      ) : (
        orderedDestinationItems.concat(sourceItem ? [sourceItem] : []).map((item) => (
        <CanvasItem
          key={item.id}
          item={item}
          items={items}
          selectedId={selectedId}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onChange={(patch) => onChange(item.id, patch)}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTextEdit={onTextEdit}
          isTextEditing={isTextEditing?.id === item.id}
          onCursor={onCursor}
          onItemHover={onItemHover}
          disableDrag={true}
          isShiftDown={isShiftDown}
          getActiveTransformAnchor={getActiveTransformAnchor}
          dropTargetFrameId={dropTargetFrameId}
          dropTargetSlotIndex={dropTargetSlotIndex}
          editingFrameId={editingFrameId}
          editingFrameSlot={editingFrameSlot}
          onFrameImageEdit={onFrameImageEdit}
          onCropStart={onCropStart}
          isCropTarget={cropSession?.itemId === item.id}
          allowComposite={item.id === entry.operatorId}
        />
        ))
      )}
    </Group>
  )
}

function Workspace() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading: isAuthLoading, requireAuth } = useAuth()
  const initialProject = useMemo(() => {
    const width = Number(searchParams.get('width'))
    const height = Number(searchParams.get('height'))
    return {
      id: searchParams.get('projectId') || null,
      name: searchParams.get('name') || 'Creative Exploration 2026',
      ratio: searchParams.get('ratio') || '16:9',
      width: Number.isFinite(width) && width >= 240 ? Math.min(4000, width) : defaultCanvasSize.width,
      height: Number.isFinite(height) && height >= 240 ? Math.min(4000, height) : defaultCanvasSize.height,
      imageSrc: searchParams.get('imageSrc') || null,
      imageW: Number(searchParams.get('imageW')) || null,
      imageH: Number(searchParams.get('imageH')) || null,
      isNew: searchParams.get('new') === '1',
    }
  }, [searchParams])
  const workspaceId = initialProject.id
  const uploadInputRef = useRef(null)
  const {
    canvasAssets: uploadedCanvasAssets,
    isLoading: isUploadsLoading,
    isUploading,
    deletingMediaIds,
    progress: uploadProgress,
    error: uploadError,
    refresh: refreshUploads,
    uploadFiles,
    retryUpload,
    removeAsset: removeUploadedAsset,
  } = useMediaUpload({ enabled: isAuthenticated })
  const [activePanel, setActivePanel] = useState('assets')
  const [activeElementCategory, setActiveElementCategory] = useState(null)
  const [assetTab, setAssetTab] = useState('boards')
  const [assetSubView, setAssetSubView] = useState(null)
  const [assetSearchQuery, setAssetSearchQuery] = useState('')
  const [assetContextSignals, setAssetContextSignals] = useState([])
  const [databaseBoards, setDatabaseBoards] = useState([])
  const [boardDetails, setBoardDetails] = useState({})
  const [publicBrowseAssets, setPublicBrowseAssets] = useState([])
  const [externalBrowseAssets, setExternalBrowseAssets] = useState([])
  const [isPublicBrowseLoading, setIsPublicBrowseLoading] = useState(false)
  const [isBrowseLoadMoreLoading, setIsBrowseLoadMoreLoading] = useState(false)
  const [browsePageInfo, setBrowsePageInfo] = useState({ internalNextOffset: null, internalNextCursor: null, externalNextCursor: null })
  const [publicBrowseError, setPublicBrowseError] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState(null)
  const [selectedBoardItem, setSelectedBoardItem] = useState(null)
  const [isBoardsLoading, setIsBoardsLoading] = useState(false)
  const [boardsError, setBoardsError] = useState('')
  const [items, setItems] = useState(() => {
    if (initialProject.imageSrc) {
      return [{
        id: 'image-1',
        kind: 'image',
        src: initialProject.imageSrc,
        x: 0,
        y: 0,
        w: initialProject.imageW || initialProject.width,
        h: initialProject.imageH || initialProject.height,
        rotation: 0,
        opacity: 1,
        radius: 0,
        effects: getDefaultEffects(),
        lockAspectRatio: true,
      }]
    }
    return initialProject.id ? [] : initialItems
  })
  const [selectedId, setSelectedId] = useState(() => {
    if (initialProject.imageSrc) return 'image-1'
    return initialProject.id ? null : 'image-1'
  })
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [mobileSheetState, setMobileSheetState] = useState('half')
  const [workspaceTitle, setWorkspaceTitle] = useState(initialProject.name)
  const shouldLoadWorkspace = !!workspaceId
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(shouldLoadWorkspace)
  const [workspaceError, setWorkspaceError] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [assetDeleteTarget, setAssetDeleteTarget] = useState(null)
  const [canvasSettings, setCanvasSettings] = useState({
    ratio: initialProject.ratio,
    width: initialProject.width,
    height: initialProject.height,
    background: { type: 'solid', color: '#ffffff', from: '#ffffff', to: '#d8d2ff', angle: 90 },
    gridVertical: 0,
    gridHorizontal: 0,
    showGrid: false,
    snapToGrid: false,
    autosave: true,
    privateWorkspace: false,
  })
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 0.75 })
  const [viewportSize, setViewportSize] = useState({ width: canvasSize.width, height: canvasSize.height })
  const [isPanning, setIsPanning] = useState(false)
  const [isSpaceDown, setIsSpaceDown] = useState(false)
  const [isShiftDown, setIsShiftDown] = useState(false)
  const [stageCursor, setStageCursor] = useState('default')
  const [dropTargetFrameId, setDropTargetFrameId] = useState(null)
  const [dropTargetSlotIndex, setDropTargetSlotIndex] = useState(null)  // ← TAMBAH INI
  const [, setHoveredItemId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => {
    if (initialProject.imageSrc) return ['image-1']
    return initialProject.id ? [] : ['image-1']
  })
  const [selectionBox, setSelectionBox] = useState(null)
  const [alignmentGuides, setAlignmentGuides] = useState([])
  const [connectorTool, setConnectorTool] = useState(null)
  const [connectorDraft, setConnectorDraft] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const [editingFrameId, setEditingFrameId] = useState(null)
  const [editingFrameSlot, setEditingFrameSlot] = useState(0)
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isBlendModeOpen, setIsBlendModeOpen] = useState(false)
  const [colorPickerTarget, setColorPickerTarget] = useState(null)
  const [fontSearchQuery, setFontSearchQuery] = useState('')
  const [selectedFontCategory, setSelectedFontCategory] = useState(null)
  const [apiFonts, setApiFonts] = useState(null)
  const [isLoadingFonts, setIsLoadingFonts] = useState(false)
  const [fontsError, setFontsError] = useState(null)
  const [fontDisplayCount, setFontDisplayCount] = useState(20)
  const fontSentinelRef = useRef(null)
  const fontPickerRef = useRef(null)
  const [loadingFont, setLoadingFont] = useState(null)
  const [editingSliderKey, setEditingSliderKey] = useState(null)
  const [isImageAdjustmentsOpen, setIsImageAdjustmentsOpen] = useState(false)
  const [cropSession, setCropSession] = useState(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState('png')
  const [exportScale, setExportScale] = useState(1)
  const [exportTransparent, setExportTransparent] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportError, setExportError] = useState('')

  // Tool states
  const [brushSettings, setBrushSettings] = useState({ size: 10, color: '#000000', opacity: 1, mode: 'paint' })
  const brushSettingsRef = useRef(brushSettings)
  brushSettingsRef.current = brushSettings
  const [currentStroke, setCurrentStroke] = useState(null)
  const currentStrokeRef = useRef(null)
  const latestPointerRef = useRef(null)
  const cursorDebugRef = useRef(null)
  const brushDrawingRef = useRef(false)
  const brushStartPosRef = useRef(null)
  const currentBrushItemIdRef = useRef(null)
  const [bezierAnchors, setBezierAnchors] = useState([])
  const [bezierSettings, setBezierSettings] = useState({ strokeColor: '#000000', strokeWidth: 3 })
  const [editingBezierId, setEditingBezierId] = useState(null)
  const [bezierMousePos, setBezierMousePos] = useState(null)
  const [bezierGuides, setBezierGuides] = useState([])
  const [bezierEditAnchors, setBezierEditAnchors] = useState(null)
  const [selectedBezierAnchorIdx, setSelectedBezierAnchorIdx] = useState(null)
  const bezierPreviewPathRef = useRef(null)
  const bezierCpRef = useRef(null)

  const computeBezierPathStr = (anchors, cpData) => {
    const n = anchors.length
    if (n < 2) return anchors.map((a) => `${a.x},${a.y}`).join(' ')
    let result = `M ${anchors[0].x},${anchors[0].y}`
    for (let i = 0; i < n; i++) {
      const curr = anchors[i]
      const next = anchors[(i + 1) % n]
      const cpOut = cpData?.[i]
      const cpIn = cpData?.[(i + 1) % n]
      const hasCurve = cpOut && cpIn && (cpOut.cpOutX || cpOut.cpOutY || cpIn.cpInX || cpIn.cpInY)
      if (hasCurve) {
        result += ` C ${curr.x + cpOut.cpOutX},${curr.y + cpOut.cpOutY} ${next.x + cpIn.cpInX},${next.y + cpIn.cpInY} ${next.x},${next.y}`
      } else {
        result += ` L ${next.x},${next.y}`
      }
    }
    return result + ' Z'
  }
  const [isRemoveBgProcessing, setIsRemoveBgProcessing] = useState(false)
  const [removeBgProgress, setRemoveBgProgress] = useState(null)
  const [isRenamingTitle, setIsRenamingTitle] = useState(false)
  const [renamingTitleValue, setRenamingTitleValue] = useState('')
  const [toolbarPos, setToolbarPos] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showAlignSubmenu, setShowAlignSubmenu] = useState(false)
  const [hasClipboard, setHasClipboard] = useState(false)
  const [isMorePanelOpen, setIsMorePanelOpen] = useState(false)
  const [isFxPanelOpen, setIsFxPanelOpen] = useState(false)
  const [isGroupSelectMode, setIsGroupSelectMode] = useState(false)
  const stageRef = useRef(null)
  const viewportRef = useRef(null)
  const textEditorRef = useRef(null)
  const inlineTextEditorRef = useRef(null)
  const skipInlineTextBlurRef = useRef(false)
  const transformerRef = useRef(null)
  const itemCounterRef = useRef(initialProject.imageSrc ? 1 : (initialProject.id ? 0 : initialItems.length))
  const pendingSelectIdRef = useRef(null)
  const justDroppedIdRef = useRef(null)
  const dragAssetRef = useRef(null)
  const touchDragAssetRef = useRef(null)
  const touchDragMovedRef = useRef(false)
  const touchDragStartPosRef = useRef(null)
  const panSessionRef = useRef(null)
  const pinchSessionRef = useRef(null)
  const touchStartPosRef = useRef(null)
  const cameraRef = useRef(camera)
  const viewportSizeRef = useRef(viewportSize)
  const prevViewportWidthRef = useRef(null)
  const zoomAnimationRef = useRef(null)
  const wheelPanClampTimerRef = useRef(null)
  const wheelPanFrameRef = useRef(null)
  const wheelPanDeltaRef = useRef({ x: 0, y: 0 })
  const hasCenteredCameraRef = useRef(false)
  const imageMetadataRef = useRef(new Map())
  const activeObjectDragRef = useRef(null)
  const multiDragRef = useRef(null)
  const selectionBoxRef = useRef(null)
  const clipboardRef = useRef([])
  const itemsRef = useRef(initialItems)
  const targetCameraRef = useRef(camera)
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const isUndoingRef = useRef(false)
  const prevItemsRef = useRef()
  const hasRestoredWorkspaceRef = useRef(!shouldLoadWorkspace)
  const lastSavedSnapshotHashRef = useRef(null)
  const autosaveTimerRef = useRef(null)
  const canvasMetadataSyncTimerRef = useRef(null)
  const lastSyncedCanvasMetadataHashRef = useRef(null)
  const isAutosavingRef = useRef(false)
  const skipNextAutosaveRef = useRef(shouldLoadWorkspace)
  const shouldCenterAfterPanelCloseRef = useRef(false)

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId])
  const selectedItems = useMemo(() => selectedIds.map((id) => items.find((item) => item.id === id)).filter(Boolean), [items, selectedIds])
  const areAllLocked = useMemo(() => selectedIds.length > 0 && selectedItems.every((item) => item.locked), [selectedIds, selectedItems])
  const activeSelectionCount = selectedIds.length || (selectedId ? 1 : 0)
  const activeGroupId = useMemo(() => {
    if (selectedItems.length < 2) return selectedItem?.groupId || null
    const groupId = selectedItems[0]?.groupId
    return groupId && selectedItems.every((item) => item.groupId === groupId) ? groupId : null
  }, [selectedItem?.groupId, selectedItems])
  const activeCompositeOperator = useMemo(() => (
    items.find((item) => selectedIds.includes(item.id) && !item.isAdjustmentLayer) || selectedItem
  ), [items, selectedId, selectedIds, selectedItem])
  const activeCompositeMode = activeCompositeOperator?.compositeMode || null
  const canUseCompositeGroupMode = useMemo(() => (
    selectedItems.filter((item) => !item.isAdjustmentLayer).length > 1
  ), [selectedItem, selectedItems])
  const isSelectedCompositeGroup = useMemo(() => {
    const groupId = activeGroupId || selectedItem?.groupId
    if (!groupId) return false
    return items.some((item) => item.groupId === groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude'))
  }, [activeGroupId, items, selectedItem?.groupId])
  const layerEntries = useMemo(() => {
    const seenGroups = new Set()
    return items.flatMap((item) => {
      if (!item.groupId) return [item]
      if (seenGroups.has(item.groupId)) return []
      seenGroups.add(item.groupId)
      const members = items.filter((candidate) => candidate.groupId === item.groupId)
      return [{
        id: item.groupId,
        kind: 'group',
        groupId: item.groupId,
        members,
        visible: members.every((member) => member.visible !== false),
        locked: members.every((member) => member.locked),
      }]
    })
  }, [items])
  const compositeGroupMap = useMemo(() => {
    const grouped = new Map()
    items.forEach((item, index) => {
      if (!item.groupId || item.isAdjustmentLayer) return
      const entry = grouped.get(item.groupId) || { groupId: item.groupId, members: [], topIndex: index, operatorId: null }
      entry.members.push(item)
      entry.topIndex = Math.min(entry.topIndex, index)
      if (item.compositeMode === 'mask' || item.compositeMode === 'exclude') entry.operatorId = item.id
      grouped.set(item.groupId, entry)
    })

    const map = new Map()
    grouped.forEach((entry) => {
      if (!entry.operatorId || entry.members.length < 2) return
      const cacheKey = JSON.stringify(entry.members)
      const normalized = { ...entry, cacheKey }
      entry.members.forEach((member) => map.set(member.id, normalized))
    })
    return map
  }, [items])
  const renderedCompositeGroupsRef = useRef(new Set())
  const cropActiveItem = useMemo(() => items.find((item) => item.id === cropSession?.itemId), [cropSession?.itemId, items])
  const cropOverlayImage = useCanvasImage(cropActiveItem?.src)
  canvasSize = { width: canvasSettings.width, height: canvasSettings.height }
  canvasBounds = { x: 0, y: 0, width: canvasSettings.width, height: canvasSettings.height }
  const workspaceGridLines = useMemo(() => buildWorkspaceGridLines(virtualWorkspace), [])
  const canvasGridLines = useMemo(
    () => getDynamicGridLines(canvasSize, canvasSettings.gridVertical, canvasSettings.gridHorizontal),
    [canvasSettings.gridHorizontal, canvasSettings.gridVertical, canvasSettings.width, canvasSettings.height],
  )
  const canvasBackgroundProps = useMemo(
    () => getCanvasBackgroundProps(canvasSettings.background, canvasSize),
    [canvasSettings.background, canvasSettings.width, canvasSettings.height],
  )
  const checkerboardPattern = useMemo(() => createCheckerboardPattern(), [])
  const isCanvasBackgroundNone = canvasSettings.background?.type === 'transparent'
  const exportOutputSize = useMemo(() => ({
    width: Math.round(canvasSettings.width * exportScale),
    height: Math.round(canvasSettings.height * exportScale),
  }), [canvasSettings.height, canvasSettings.width, exportScale])

  const lowestAdjIndex = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].isAdjustmentLayer) return i
    }
    return -1
  }, [items])

  const belowItems = useMemo(() => {
    if (lowestAdjIndex === -1) return items
    return items.filter((_, index) => index > lowestAdjIndex)
  }, [items, lowestAdjIndex])

  const aboveItems = useMemo(() => {
    if (lowestAdjIndex === -1) return []
    return items.filter((_, index) => index < lowestAdjIndex)
  }, [items, lowestAdjIndex])

  const buildWorkspaceSnapshot = useCallback(() => ({
    schemaVersion: 1,
    projectName: workspaceTitle,
    canvas: {
      width: canvasSettings.width,
      height: canvasSettings.height,
      ratio: canvasSettings.ratio,
    },
    canvasSettings,
    background: canvasSettings.background,
    items,
    layers: items.map((item, index) => ({
      id: item.id,
      index,
      kind: item.kind,
      locked: !!item.locked,
      visible: item.visible !== false,
    })),
    assetsUsed: items
      .filter((item) => item.src || item.frameImageSrc || item.frameImages?.some((image) => image?.src))
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        src: item.src || item.frameImageSrc || null,
        frameImages: item.frameImages || null,
      })),
    browseAssetContext: normalizeAssetContextSignals(assetContextSignals),
  }), [assetContextSignals, canvasSettings, items, workspaceTitle])

  const restoreWorkspaceSnapshot = useCallback((workspace) => {
    const snapshot = workspace.latestVersion?.snapshot || {}
    const restoredItems = Array.isArray(snapshot.items) ? snapshot.items.map((item) => ({
      ...item,
      effects: item.effects || getDefaultEffects(),
    })) : []
    const restoredAssetContextSignals = normalizeAssetContextSignals(snapshot.browseAssetContext)
    const restoredSettings = snapshot.canvasSettings || {}
    const workspaceSettings = workspace.settings || {}
    const restoredCanvas = snapshot.canvas || {}
    const useWorkspaceMetadata = isWorkspaceMetadataNewerThanVersion(workspace)
    const restoredBackground = useWorkspaceMetadata
      ? workspace.background || workspaceSettings.background || snapshot.background || restoredSettings.background
      : snapshot.background || workspace.background || restoredSettings.background
    const restoredRatio = useWorkspaceMetadata
      ? workspace.canvasRatio || workspaceSettings.ratio || restoredCanvas.ratio || initialProject.ratio
      : restoredCanvas.ratio || workspace.canvasRatio || initialProject.ratio
    const restoredWidth = useWorkspaceMetadata
      ? workspace.canvasWidth || workspaceSettings.width || restoredCanvas.width || initialProject.width
      : restoredCanvas.width || workspace.canvasWidth || initialProject.width
    const restoredHeight = useWorkspaceMetadata
      ? workspace.canvasHeight || workspaceSettings.height || restoredCanvas.height || initialProject.height
      : restoredCanvas.height || workspace.canvasHeight || initialProject.height
    const nextSettings = {
      gridVertical: 0,
      gridHorizontal: 0,
      showGrid: false,
      snapToGrid: false,
      autosave: true,
      privateWorkspace: workspace.visibility === 'private',
      ...restoredSettings,
      ...(useWorkspaceMetadata ? workspaceSettings : {}),
      ratio: restoredRatio,
      width: restoredWidth,
      height: restoredHeight,
      background: restoredBackground || { type: 'solid', color: '#f4f1e8', from: '#f4f1e8', to: '#d8d2ff', angle: 90 },
    }
    setWorkspaceTitle(workspace.title || snapshot.projectName || initialProject.name)
    setItems(restoredItems)
    setAssetContextSignals(restoredAssetContextSignals)
    setCanvasSettings(nextSettings)

    // Camera/zoom is intentionally not restored. After loading finishes and the
    // stage viewport is mounted, the normal center-canvas effect runs once.
    hasCenteredCameraRef.current = false
    setSelectedId(null)
    setSelectedIds([])
    setSelectionBox(null)
    setAlignmentGuides([])
    setConnectorTool(null)
    setConnectorDraft(null)
    setEditingText(null)
    setEditingFrameId(null)
    setEditingFrameSlot(0)
    setContextMenu(null)
    undoStackRef.current = []
    redoStackRef.current = []
    prevItemsRef.current = restoredItems
    itemsRef.current = restoredItems
    itemCounterRef.current = getRestoredItemCounter(restoredItems)

    const restoredSnapshot = {
      schemaVersion: 1,
      projectName: workspace.title || snapshot.projectName || initialProject.name,
      canvas: {
        width: nextSettings.width,
        height: nextSettings.height,
        ratio: nextSettings.ratio,
      },
      canvasSettings: nextSettings,
      background: nextSettings.background,
      items: restoredItems,
      layers: restoredItems.map((item, index) => ({
        id: item.id,
        index,
        kind: item.kind,
        locked: !!item.locked,
        visible: item.visible !== false,
      })),
      assetsUsed: snapshot.assetsUsed || [],
      browseAssetContext: restoredAssetContextSignals,
    }
    lastSavedSnapshotHashRef.current = getSnapshotHash(restoredSnapshot)
    lastSyncedCanvasMetadataHashRef.current = getSnapshotHash({
      canvasWidth: nextSettings.width,
      canvasHeight: nextSettings.height,
      canvasRatio: nextSettings.ratio,
      background: nextSettings.background,
      settings: nextSettings,
    })
  }, [initialProject.height, initialProject.name, initialProject.ratio, initialProject.width])
  const refreshDatabaseBoards = useCallback(async () => {
    if (!isAuthenticated) {
      setDatabaseBoards([])
      setBoardDetails({})
      return
    }
    setIsBoardsLoading(true)
    setBoardsError('')
    try {
      const payload = await listBoards()
      const boards = payload.boards || []
      setDatabaseBoards(boards)
      const details = await Promise.all(boards.map(async (board) => {
        try {
          const detailPayload = await getBoard(board.id)
          return [board.id, detailPayload.board]
        } catch {
          return [board.id, { ...board, items: [] }]
        }
      }))
      setBoardDetails(Object.fromEntries(details))
    } catch (error) {
      setBoardsError(error.message || 'Gagal memuat boards')
    } finally {
      setIsBoardsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshDatabaseBoards()
  }, [refreshDatabaseBoards])

  useEffect(() => {
    setAssetContextSignals([])
    setAssetSearchQuery('')
    setPublicBrowseAssets([])
    setExternalBrowseAssets([])
    setBrowsePageInfo({ internalNextOffset: null, internalNextCursor: null, externalNextCursor: null })
    setPublicBrowseError('')
  }, [workspaceId])

  useEffect(() => {
    if (assetTab !== 'assets' || assetSubView !== 'browse') return undefined
    let cancelled = false
    const query = assetSearchQuery.trim()
    setIsPublicBrowseLoading(true)
    setIsBrowseLoadMoreLoading(false)
    setBrowsePageInfo({ internalNextOffset: null, internalNextCursor: null, externalNextCursor: null })
    setPublicBrowseError('')
    const timer = window.setTimeout(() => {
      const internalRequest = query
        ? searchPublicPosts({ q: query, sort: 'relevance', limit: 36 })
        : getHomeFeed({ mode: 'for-you', limit: 36 })
      const externalQuery = getExternalBrowseQuery(query, assetContextSignals)
      const externalRequest = searchExternalImages({ q: externalQuery, limit: 18 })
      Promise.allSettled([internalRequest, externalRequest])
        .then(([internalResult, externalResult]) => {
          if (cancelled) return
          if (internalResult.status === 'fulfilled') {
            setPublicBrowseAssets((internalResult.value.items || []).flatMap(postToBrowseAssets))
          } else {
            setPublicBrowseAssets([])
          }
          if (externalResult.status === 'fulfilled') {
            setExternalBrowseAssets((externalResult.value.items || []).map(externalImageToBrowseAsset))
          } else {
            setExternalBrowseAssets([])
          }
          setBrowsePageInfo({
            internalNextOffset: query ? internalResult.value?.nextOffset ?? null : null,
            internalNextCursor: query ? null : internalResult.value?.nextCursor ?? null,
            externalNextCursor: externalResult.value?.nextCursor ?? null,
          })
          const errors = [internalResult, externalResult]
            .filter((result) => result.status === 'rejected')
            .map((result) => result.reason?.message)
            .filter(Boolean)
          setPublicBrowseError(errors[0] || '')
        })
        .finally(() => {
          if (!cancelled) setIsPublicBrowseLoading(false)
        })
    }, query ? 220 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [assetContextSignals, assetSearchQuery, assetSubView, assetTab])

  const hasMoreBrowseAssets = !!(browsePageInfo.internalNextOffset || browsePageInfo.internalNextCursor || browsePageInfo.externalNextCursor)

  const loadMoreBrowseAssets = useCallback(async () => {
    if (assetTab !== 'assets' || assetSubView !== 'browse' || isBrowseLoadMoreLoading || !hasMoreBrowseAssets) return
    const query = assetSearchQuery.trim()
    setIsBrowseLoadMoreLoading(true)
    setPublicBrowseError('')
    try {
      const externalQuery = getExternalBrowseQuery(query, assetContextSignals)
      const internalRequest = query
        ? browsePageInfo.internalNextOffset === null
          ? Promise.resolve({ items: [], nextOffset: null })
          : searchPublicPosts({ q: query, sort: 'relevance', limit: 24, offset: browsePageInfo.internalNextOffset })
        : browsePageInfo.internalNextCursor
          ? getHomeFeed({ mode: 'for-you', limit: 24, cursor: browsePageInfo.internalNextCursor })
          : Promise.resolve({ items: [], nextCursor: null })
      const externalRequest = browsePageInfo.externalNextCursor
        ? searchExternalImages({ q: externalQuery, limit: 12, cursor: browsePageInfo.externalNextCursor })
        : Promise.resolve({ items: [], nextCursor: null })

      const [internalResult, externalResult] = await Promise.allSettled([internalRequest, externalRequest])
      if (internalResult.status === 'fulfilled') {
        setPublicBrowseAssets((current) => [
          ...current,
          ...(internalResult.value.items || []).flatMap(postToBrowseAssets),
        ])
      }
      if (externalResult.status === 'fulfilled') {
        setExternalBrowseAssets((current) => [
          ...current,
          ...(externalResult.value.items || []).map(externalImageToBrowseAsset),
        ])
      }
      setBrowsePageInfo({
        internalNextOffset: query ? internalResult.value?.nextOffset ?? null : null,
        internalNextCursor: query ? null : internalResult.value?.nextCursor ?? null,
        externalNextCursor: externalResult.value?.nextCursor ?? null,
      })
      const errors = [internalResult, externalResult]
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason?.message)
        .filter(Boolean)
      setPublicBrowseError(errors[0] || '')
    } finally {
      setIsBrowseLoadMoreLoading(false)
    }
  }, [assetContextSignals, assetSearchQuery, assetSubView, assetTab, browsePageInfo, hasMoreBrowseAssets, isBrowseLoadMoreLoading])

  const selectedBoard = selectedBoardId ? boardDetails[selectedBoardId] : null
  const getBoardItemAssets = useCallback((item, board) => {
    const media = item.postMedia?.length ? item.postMedia : item.publicUrl ? [{
      url: item.publicUrl,
      width: item.width,
      height: item.height,
      mimeType: item.mimeType,
      mediaId: item.mediaId,
    }] : []
    return media.map((entry, index) => toDatabaseImageAsset({
      ...entry,
      mediaId: entry.mediaId || `${item.id}-${index}`,
      title: media.length > 1 ? `${item.title} ${index + 1}` : item.title,
      tags: item.tags || [],
      description: item.description || '',
      originalFilename: entry.originalFilename || item.originalFilename || '',
      boardId: board?.id,
    }, {
      boardName: board?.name,
      boardItemId: item.id,
      postId: item.postId,
    }))
  }, [])
  const uploadAssets = useMemo(
    () => uploadedCanvasAssets,
    [uploadedCanvasAssets],
  )
  const registerAssetContext = useCallback((asset) => {
    if (!asset || asset.type !== 'image') return
    const fields = [
      asset.title,
      asset.boardName,
      asset.description,
      asset.originalFilename,
      asset.imageKey,
      ...(Array.isArray(asset.tags) ? asset.tags : []),
    ].filter(Boolean)
    const normalizedFields = fields.map(normalizeSearchText).filter(Boolean)
    const compactFields = fields.map(compactSearchText).filter(Boolean)
    const tokens = normalizedFields.flatMap((field) => field.split(' ').filter((token) => token.length >= 3))
    const signal = {
      key: `${asset.mediaId || asset.imageKey || asset.source}-${Date.now()}`,
      mediaId: asset.mediaId || null,
      postId: asset.postId || null,
      boardId: asset.boardId || null,
      normalizedFields,
      compactFields,
      tokens,
    }
    setAssetContextSignals((current) => [
      signal,
      ...current.filter((item) => (
        item.mediaId !== signal.mediaId ||
        item.postId !== signal.postId ||
        item.boardId !== signal.boardId
      )),
    ].slice(0, 8))
  }, [])

  const logCanvasDropInterest = useCallback((asset) => {
    if (!isAuthenticated || !asset || asset.type !== 'image') return
    const tags = [
      ...(Array.isArray(asset.tags) ? asset.tags : []),
      asset.title,
      asset.boardName,
    ].filter(Boolean)
    const query = [asset.title, asset.description, asset.originalFilename]
      .filter(Boolean)
      .join(' ')
      .slice(0, 200)

    recordInterestEvent({
      eventType: 'drop_to_canvas',
      tags,
      query: query || null,
      projectId: workspaceId || null,
    }).catch(() => {})
  }, [isAuthenticated, workspaceId])

  const browseAssets = useMemo(() => {
    const query = assetSearchQuery.trim().toLowerCase()
    const dedupeAssets = (assets) => assets.filter((asset, index, list) => (
      list.findIndex((candidate) => (
        (candidate.mediaId || candidate.imageKey) === (asset.mediaId || asset.imageKey)
      )) === index
    ))
    const rankAssets = (assets) => {
      if (!query) {
        if (!assetContextSignals.length) return assets
        return assets
          .map((asset, index) => ({
            asset,
            score: getAssetRelatedScore(asset, assetContextSignals) + Math.max(0, 1 - index * 0.01),
          }))
          .sort((a, b) => b.score - a.score || (a.asset.title || '').localeCompare(b.asset.title || ''))
          .map(({ asset }) => asset)
      }
      return assets
        .map((asset) => ({ asset, score: getAssetSearchScore(asset, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || (a.asset.title || '').localeCompare(b.asset.title || ''))
        .map(({ asset }) => asset)
    }
    const internalAssets = dedupeAssets(publicBrowseAssets)
    const externalAssets = dedupeAssets(externalBrowseAssets)
    const rankedInternalAssets = rankAssets(internalAssets)
    const rankedExternalAssets = rankAssets(externalAssets)
    const mixedAssets = mixInternalExternalAssets(rankedInternalAssets, rankedExternalAssets)
    return mixedAssets.filter((asset, index, assets) => (
      assets.findIndex((candidate) => (
        (candidate.mediaId || candidate.imageKey) === (asset.mediaId || asset.imageKey)
      )) === index
    ))
  }, [assetContextSignals, assetSearchQuery, externalBrowseAssets, publicBrowseAssets])
  const editingTextItem = useMemo(
    () => items.find((item) => item.id === editingText?.id && (item.kind === 'text' || item.kind === 'shape')),
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

    const isShapeText = editingTextItem.kind === 'shape'
    const fontSize = isShapeText
      ? Math.max(10, (editingTextItem.shapeTextFontSize || 16) * camera.scale)
      : Math.max(8, (editingTextItem.fontSize || 48) * camera.scale)
    const textBounds = isShapeText ? getShapeTextBounds(editingTextItem) : null
    const editorLeft = isShapeText && textBounds
      ? camera.x + (editingTextItem.x + textBounds.x) * camera.scale
      : camera.x + editingTextItem.x * camera.scale
    const editorTop = isShapeText && textBounds
      ? camera.y + (editingTextItem.y + textBounds.y) * camera.scale
      : camera.y + editingTextItem.y * camera.scale
    const editorWidth = isShapeText && textBounds
      ? Math.max(20, textBounds.width * camera.scale)
      : Math.max(40, editingTextItem.w * camera.scale)
    const editorHeight = isShapeText && textBounds
      ? Math.max(20, textBounds.height * camera.scale)
      : Math.max(32, editingTextItem.h * camera.scale)
    const newStyle = {
      left: editorLeft,
      top: editorTop,
      width: editorWidth,
      height: isShapeText ? editorHeight : undefined,
      minHeight: isShapeText ? editorHeight : Math.max(32, editingTextItem.h * camera.scale),
      color: isShapeText ? (editingTextItem.shapeTextFill || '#231c2f') : (editingTextItem.fill || '#2b2830'),
      fontSize,
      fontFamily: editingTextItem.fontFamily || 'Inter, Arial',
      fontWeight: editingTextItem.isBold ? 700 : 400,
      lineHeight: isShapeText ? 1.25 : 0.9,
      paddingTop: undefined,
      transform: `rotate(${editingTextItem.rotation || 0}deg)`,
      transformOrigin: 'top left',
      textAlign: isShapeText ? (editingTextItem.shapeTextAlign || 'center') : 'center',
      overflow: 'hidden',
      resize: 'none',
    }

    const prevStyle = inlineTextEditorStyleRef.current
    if (prevStyle &&
      prevStyle.left === newStyle.left &&
      prevStyle.top === newStyle.top &&
      prevStyle.width === newStyle.width &&
      prevStyle.height === newStyle.height &&
      prevStyle.minHeight === newStyle.minHeight &&
      prevStyle.color === newStyle.color &&
      prevStyle.fontSize === newStyle.fontSize &&
      prevStyle.fontFamily === newStyle.fontFamily &&
      prevStyle.fontWeight === newStyle.fontWeight &&
      prevStyle.lineHeight === newStyle.lineHeight &&
      prevStyle.paddingTop === newStyle.paddingTop &&
      prevStyle.transform === newStyle.transform &&
      prevStyle.transformOrigin === newStyle.transformOrigin &&
      prevStyle.textAlign === newStyle.textAlign &&
      prevStyle.overflow === newStyle.overflow &&
      prevStyle.resize === newStyle.resize) {
      return prevStyle
    }

    inlineTextEditorStyleRef.current = newStyle
    return newStyle
  }, [camera, editingTextItem])

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  useEffect(() => {
    viewportSizeRef.current = viewportSize
  }, [viewportSize])

  useEffect(() => {
    const apiKey = getGoogleFontsApiKey()
    if (!apiKey) return
    let cancelled = false
    setIsLoadingFonts(true)
    setFontsError(null)
    fetchGoogleFonts(apiKey)
      .then((fonts) => { if (!cancelled) setApiFonts(fonts) })
      .catch((err) => { if (!cancelled) setFontsError(err.message) })
      .finally(() => { if (!cancelled) setIsLoadingFonts(false) })
    return () => { cancelled = true }
  }, [])

  // Reset font display count when picker opens or api fonts arrive
  useEffect(() => {
    if (isFontPickerOpen) setFontDisplayCount(20)
  }, [isFontPickerOpen])

  useEffect(() => {
    if (apiFonts) setFontDisplayCount(20)
  }, [apiFonts])

  // Reset display count on search or category change
  useEffect(() => {
    if (isFontPickerOpen) setFontDisplayCount(20)
  }, [fontSearchQuery, selectedFontCategory])

  // Infinite scroll: reconnect observer after each batch to fill container
  useEffect(() => {
    if (!isFontPickerOpen) return
    const sentinel = fontSentinelRef.current
    if (!sentinel) return
    const root = fontPickerRef.current
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setFontDisplayCount((p) => p + 10)
    }, { root, rootMargin: '200px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isFontPickerOpen, fontDisplayCount])

  useEffect(() => {
    if (!shouldLoadWorkspace) {
      setIsWorkspaceLoading(false)
      hasRestoredWorkspaceRef.current = true
      return undefined
    }

    let cancelled = false

    if (isAuthLoading) return undefined
    if (!isAuthenticated) {
      setIsWorkspaceLoading(false)
      setWorkspaceError('Login untuk membuka project ini.')
      requireAuth('login')
      return undefined
    }

    setIsWorkspaceLoading(true)
    setWorkspaceError('')

    getWorkspace(workspaceId)
      .then(({ workspace }) => {
        if (cancelled) return
        restoreWorkspaceSnapshot(workspace)
        hasRestoredWorkspaceRef.current = true
        skipNextAutosaveRef.current = true
      })
      .catch((error) => {
        if (cancelled) return
        setWorkspaceError(error.message || 'Gagal memuat workspace')
      })
      .finally(() => {
        if (!cancelled) setIsWorkspaceLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isAuthLoading, requireAuth, restoreWorkspaceSnapshot, shouldLoadWorkspace, workspaceId])

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

  useEffect(() => {
    if (exportFormat === 'jpg' || !isCanvasBackgroundNone) {
      setExportTransparent(false)
    }
  }, [exportFormat, isCanvasBackgroundNone])

  const generateWorkspaceThumbnailDataUrl = useCallback(() => {
    const stage = stageRef.current
    if (!stage || !canvasSettings.width || !canvasSettings.height) return null

    const currentCamera = cameraRef.current || camera
    const canvasBackgroundNode = stage.findOne('.canvas-background')
    const canvasContentNode = stage.findOne('.canvas-content')
    const exportWidth = canvasSettings.width
    const exportHeight = canvasSettings.height
    const exportX = 0
    const exportY = 0
    const pixelRatio = Math.max(0.1, Math.min(2, 400 / Math.max(exportWidth, exportHeight)))
    const lowestAdjIndex = items.findIndex((i) => i.isAdjustmentLayer)

    const transformer = transformerRef.current
    const wasTransformerVisible = transformer?.visible?.()
    let exportStage = null
    let exportContainer = null

    try {
      transformer?.visible?.(false)
      stage.batchDraw()

      console.log('[workspace thumbnail export]', {
        canvasX: canvasBounds.x,
        canvasY: canvasBounds.y,
        cameraX: currentCamera.x,
        cameraY: currentCamera.y,
        cameraScale: currentCamera.scale,
        exportX,
        exportY,
        exportWidth,
        exportHeight,
        canvasWidth: canvasSettings.width,
        canvasHeight: canvasSettings.height,
      })

      exportContainer = document.createElement('div')
      exportContainer.style.position = 'fixed'
      exportContainer.style.left = '-10000px'
      exportContainer.style.top = '-10000px'
      exportContainer.style.width = `${exportWidth}px`
      exportContainer.style.height = `${exportHeight}px`
      document.body.appendChild(exportContainer)

      exportStage = new Konva.Stage({
        container: exportContainer,
        width: exportWidth,
        height: exportHeight,
      })

      const exportLayer = new Konva.Layer()
      exportStage.add(exportLayer)

      if (canvasBackgroundNode) {
        exportLayer.add(canvasBackgroundNode.clone({
          x: 0,
          y: 0,
          listening: false,
        }))
      }

      if (lowestAdjIndex === -1 && canvasContentNode) {
        exportLayer.add(sanitizeTransparentTextFills(canvasContentNode.clone({
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          listening: false,
        })))
      } else if (lowestAdjIndex !== -1) {
        const exportBelowItems = items.filter((_, index) => index > lowestAdjIndex)
        const exportAboveItems = items.filter((_, index) => index < lowestAdjIndex)
        addWorkspaceItemClones({
          stage,
          exportLayer,
          items: exportBelowItems,
          filterItem: () => true,
        })
        addAdjustmentOverlayClones({ stage, exportLayer })
        addWorkspaceItemClones({
          stage,
          exportLayer,
          items: exportAboveItems,
          filterItem: () => true,
        })
      }

      exportLayer.draw()

      const dataUrl = exportStage.toDataURL({
        x: exportX,
        y: exportY,
        width: exportWidth,
        height: exportHeight,
        pixelRatio,
        mimeType: 'image/webp',
        quality: 0.78,
      })
      if (dataUrl?.startsWith('data:image/webp')) return dataUrl

      return exportStage.toDataURL({
        x: exportX,
        y: exportY,
        width: exportWidth,
        height: exportHeight,
        pixelRatio,
        mimeType: 'image/jpeg',
        quality: 0.78,
      })
    } catch (error) {
      console.warn('Failed to generate workspace thumbnail', error)
      return null
    } finally {
      if (typeof wasTransformerVisible === 'boolean') transformer?.visible?.(wasTransformerVisible)
      exportStage?.destroy()
      exportContainer?.remove()
      stage.batchDraw()
    }
  }, [camera, canvasSettings.height, canvasSettings.width, items])

  const uploadWorkspaceThumbnail = useCallback(async () => {
    if (!workspaceId) return
    const dataUrl = generateWorkspaceThumbnailDataUrl()
    if (!dataUrl) return

    try {
      const result = await setWorkspaceThumbnail(workspaceId, { dataUrl })
      console.log('[workspace thumbnail upload success]', {
        workspaceId,
        thumbnailUrl: result?.thumbnailUrl || result?.media?.url,
        thumbnailUpdatedAt: result?.updatedAt,
      })
    } catch (error) {
      console.warn('Failed to upload workspace thumbnail', error)
    }
  }, [generateWorkspaceThumbnailDataUrl, workspaceId])

  const generateWorkspaceExportDataUrl = useCallback(({ format, scale, transparent }) => {
    const stage = stageRef.current
    if (!stage || !canvasSettings.width || !canvasSettings.height) return null

    const exportWidth = canvasSettings.width
    const exportHeight = canvasSettings.height
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
    const canvasBackgroundNode = stage.findOne('.canvas-background')
    const includeCanvasBackground = !(format === 'png' && transparent)
    let exportStage = null
    let exportContainer = null

    try {
      exportContainer = document.createElement('div')
      exportContainer.style.position = 'fixed'
      exportContainer.style.left = '-10000px'
      exportContainer.style.top = '-10000px'
      exportContainer.style.width = `${exportWidth}px`
      exportContainer.style.height = `${exportHeight}px`
      document.body.appendChild(exportContainer)

      exportStage = new Konva.Stage({
        container: exportContainer,
        width: exportWidth,
        height: exportHeight,
      })

      const exportLayer = new Konva.Layer()
      exportStage.add(exportLayer)

      if (includeCanvasBackground) {
        if (canvasBackgroundNode && canvasSettings.background?.type !== 'transparent') {
          const backgroundClone = canvasBackgroundNode.clone({
            x: 0,
            y: 0,
            listening: false,
          })
          backgroundClone.setAttrs({
            shadowEnabled: false,
            shadowBlur: 0,
            shadowOpacity: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          })
          exportLayer.add(backgroundClone)
        } else {
          exportLayer.add(new Konva.Rect({
            x: 0,
            y: 0,
            width: exportWidth,
            height: exportHeight,
            fill: '#ffffff',
            listening: false,
          }))
        }
      }

      const lowestAdjIndex = items.findIndex((i) => i.isAdjustmentLayer)

      if (lowestAdjIndex === -1) {
        addWorkspaceItemClones({
          stage,
          exportLayer,
          items,
          filterItem: () => true,
        })
      } else {
        const exportBelowItems = items.filter((_, index) => index > lowestAdjIndex)
        const exportAboveItems = items.filter((_, index) => index < lowestAdjIndex)
        addWorkspaceItemClones({
          stage,
          exportLayer,
          items: exportBelowItems,
          filterItem: () => true,
        })
        addAdjustmentOverlayClones({ stage, exportLayer })
        addWorkspaceItemClones({
          stage,
          exportLayer,
          items: exportAboveItems,
          filterItem: () => true,
        })
      }

      exportLayer.draw()

      return exportStage.toDataURL({
        x: 0,
        y: 0,
        width: exportWidth,
        height: exportHeight,
        pixelRatio: scale,
        mimeType,
        quality: format === 'jpg' ? 0.92 : 1,
      })
    } catch (error) {
      console.warn('Failed to export workspace', error)
      return null
    } finally {
      exportStage?.destroy()
      exportContainer?.remove()
    }
  }, [canvasSettings.background?.type, canvasSettings.height, canvasSettings.width, items])

  const handleExportWorkspace = useCallback(async () => {
    setIsExporting(true)
    setExportProgress(8)
    setExportError('')
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      setExportProgress(24)
      await new Promise((resolve) => window.setTimeout(resolve, 30))
      const shouldExportTransparent = exportFormat === 'png' && exportTransparent && isCanvasBackgroundNone
      setExportProgress(46)
      const dataUrl = generateWorkspaceExportDataUrl({
        format: exportFormat,
        scale: exportScale,
        transparent: shouldExportTransparent,
      })
      setExportProgress(76)

      if (!dataUrl) {
        setExportError('Export gagal. Coba ulang setelah semua gambar selesai dimuat.')
        return
      }

      await new Promise((resolve) => requestAnimationFrame(resolve))
      const extension = exportFormat === 'jpg' ? 'jpg' : 'png'
      const safeTitle = (workspaceTitle || 'workspace').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'workspace'
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${safeTitle}-${exportScale}x.${extension}`
      document.body.appendChild(link)
      setExportProgress(92)
      link.click()
      link.remove()
      setExportProgress(100)
      await new Promise((resolve) => window.setTimeout(resolve, 240))
      setIsExportModalOpen(false)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [exportFormat, exportScale, exportTransparent, generateWorkspaceExportDataUrl, isCanvasBackgroundNone, workspaceTitle])

  const persistWorkspaceSnapshot = useCallback(async (saveType = 'autosave', options = {}) => {
    if (!workspaceId || !hasRestoredWorkspaceRef.current) return null
    const snapshot = buildWorkspaceSnapshot()
    const snapshotHash = getSnapshotHash(snapshot)
    if (snapshotHash === lastSavedSnapshotHashRef.current) return null

    const body = {
      snapshot,
      title: workspaceTitle,
      canvasWidth: canvasSettings.width,
      canvasHeight: canvasSettings.height,
      canvasRatio: canvasSettings.ratio,
      background: canvasSettings.background,
      settings: canvasSettings,
    }

    const result = saveType === 'manual'
      ? await saveWorkspace(workspaceId, body, { keepalive: options.keepalive })
      : await autosaveWorkspace(workspaceId, body, { keepalive: options.keepalive })
    lastSavedSnapshotHashRef.current = snapshotHash
    if (result && !result.skipped && !options.skipThumbnail) {
      await uploadWorkspaceThumbnail()
    }
    return result
  }, [buildWorkspaceSnapshot, canvasSettings, uploadWorkspaceThumbnail, workspaceId, workspaceTitle])

  const syncCanvasMetadata = useCallback(async (settings) => {
    if (!workspaceId || !hasRestoredWorkspaceRef.current || isWorkspaceLoading) return

    const metadata = {
      canvasWidth: settings.width,
      canvasHeight: settings.height,
      canvasRatio: settings.ratio,
      background: settings.background,
      settings,
    }
    const metadataHash = getSnapshotHash(metadata)
    if (metadataHash === lastSyncedCanvasMetadataHashRef.current) return

    await updateWorkspace(workspaceId, metadata)
    lastSyncedCanvasMetadataHashRef.current = metadataHash
  }, [isWorkspaceLoading, workspaceId])

  const handleManualSave = useCallback(async () => {
    if (!workspaceId) return
    setSaveStatus('Saving...')
    try {
      await persistWorkspaceSnapshot('manual')
      setSaveStatus('Saved')
    } catch (error) {
      setSaveStatus(error.message || 'Save failed')
    }
  }, [persistWorkspaceSnapshot, workspaceId])

  const handlePublishWorkspace = useCallback(async () => {
    if (!requireAuth('login')) return
    if (!workspaceId) {
      setSaveStatus('Save project first')
      return
    }
    setSaveStatus('Publishing...')
    try {
      const snapshot = buildWorkspaceSnapshot()
      await persistWorkspaceSnapshot('manual')
      await uploadWorkspaceThumbnail()
      await publishWorkspace({
        workspaceId,
        title: workspaceTitle,
        visibility: canvasSettings.privateWorkspace ? 'private' : 'public',
        snapshot,
      })
      setSaveStatus('Published')
    } catch (error) {
      setSaveStatus(error.message || 'Publish failed')
    }
  }, [
    buildWorkspaceSnapshot,
    canvasSettings.privateWorkspace,
    persistWorkspaceSnapshot,
    requireAuth,
    uploadWorkspaceThumbnail,
    workspaceId,
    workspaceTitle,
  ])

  useEffect(() => {
    if (!workspaceId || !hasRestoredWorkspaceRef.current || isWorkspaceLoading) return undefined
    if (!canvasSettings.autosave) return undefined

    const snapshot = buildWorkspaceSnapshot()
    const snapshotHash = getSnapshotHash(snapshot)

    if (skipNextAutosaveRef.current) {
      lastSavedSnapshotHashRef.current = snapshotHash
      skipNextAutosaveRef.current = false
      return undefined
    }

    if (snapshotHash === lastSavedSnapshotHashRef.current) return undefined

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(async () => {
      if (isAutosavingRef.current) return
      isAutosavingRef.current = true
      setSaveStatus('Autosaving...')
      try {
        const result = await persistWorkspaceSnapshot('autosave')
        if (result) setSaveStatus('Autosaved')
      } catch (error) {
        setSaveStatus(error.message || 'Autosave failed')
      } finally {
        isAutosavingRef.current = false
      }
    }, 2500)

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [buildWorkspaceSnapshot, canvasSettings.autosave, isWorkspaceLoading, persistWorkspaceSnapshot, workspaceId])

  useEffect(() => {
    if (!workspaceId || !hasRestoredWorkspaceRef.current || isWorkspaceLoading) return undefined

    const flushPendingSnapshot = () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
      persistWorkspaceSnapshot('autosave', { keepalive: true, skipThumbnail: true }).catch(() => {})
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPendingSnapshot()
    }

    window.addEventListener('pagehide', flushPendingSnapshot)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flushPendingSnapshot)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isWorkspaceLoading, persistWorkspaceSnapshot, workspaceId])

  useEffect(() => {
    if (!workspaceId || !hasRestoredWorkspaceRef.current || isWorkspaceLoading) return undefined

    const metadataHash = getSnapshotHash({
      canvasWidth: canvasSettings.width,
      canvasHeight: canvasSettings.height,
      canvasRatio: canvasSettings.ratio,
      background: canvasSettings.background,
      settings: canvasSettings,
    })
    if (metadataHash === lastSyncedCanvasMetadataHashRef.current) return undefined

    if (canvasMetadataSyncTimerRef.current) clearTimeout(canvasMetadataSyncTimerRef.current)
    canvasMetadataSyncTimerRef.current = setTimeout(async () => {
      try {
        await syncCanvasMetadata(canvasSettings)
      } catch (error) {
        setSaveStatus(error.message || 'Metadata sync failed')
      }
    }, 500)

    return () => {
      if (canvasMetadataSyncTimerRef.current) clearTimeout(canvasMetadataSyncTimerRef.current)
    }
  }, [canvasSettings, isWorkspaceLoading, syncCanvasMetadata, workspaceId])

  useEffect(() => {
    setEditingSliderKey(null)
    setIsImageAdjustmentsOpen(false)
    setIsRenamingTitle(false)
  }, [selectedId, selectedItem?.kind])

  useEffect(() => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false
      prevItemsRef.current = items
      return
    }
    if (!prevItemsRef.current) {
      prevItemsRef.current = items
      return
    }
    undoStackRef.current.push(JSON.parse(JSON.stringify(prevItemsRef.current)))
    if (undoStackRef.current.length > 50) undoStackRef.current.shift()
    redoStackRef.current = []
    prevItemsRef.current = items
  }, [items])

  useEffect(() => () => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
    }
    if (wheelPanClampTimerRef.current) {
      window.clearTimeout(wheelPanClampTimerRef.current)
    }
    if (wheelPanFrameRef.current) {
      cancelAnimationFrame(wheelPanFrameRef.current)
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

  // Native mousemove listener for real-time cursor tracking (faster than React batching)
  useEffect(() => {
    const stage = stageRef.current
    console.log('[EFFECT] stageRef:', !!stage, 'content:', !!stage?.content, 'canvas:', !!stage?.content?.querySelector('canvas'))
    const stageNode = stageRef.current?.content
    if (!stageNode) return
    let count = 0
    const onMove = (e) => {
      const target = e.currentTarget
      const rect = stageNode.getBoundingClientRect()
      const sw = stageRef.current?.width() || 1
      const sh = stageRef.current?.height() || 1
      const getPP = stageRef.current?.getPointerPosition?.()
      latestPointerRef.current = {
        x: e.offsetX,
        y: e.offsetY,
      }
      if (count++ < 5 || count % 10 === 0) {
        console.log('[NATIVE] offset:', Math.round(e.offsetX), Math.round(e.offsetY),
          'getPP:', Math.round(getPP?.x), Math.round(getPP?.y),
          'tag:', target?.tagName,
          'attr:', target?.width, 'x', target?.height,
          'CSS:', target?.offsetWidth, 'x', target?.offsetHeight)
      }
    }
    // Try canvas first, fallback to stage container
    const canvas = stageNode.querySelector('canvas')
    const el = canvas || stageNode
    el.addEventListener('mousemove', onMove, { passive: true })
    return () => el.removeEventListener('mousemove', onMove)
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
  }, [canvasSettings.height, canvasSettings.ratio, canvasSettings.width, viewportSize])

  const getCenteredCamera = useCallback((actualViewport = viewportSize) => {
    const scale = getInitialCanvasZoom(
      canvasSettings.ratio,
      canvasSettings.width,
      canvasSettings.height,
      actualViewport,
    )
    const scaledCanvasWidth = canvasSettings.width * scale
    const scaledCanvasHeight = canvasSettings.height * scale
    return {
      scale: scale,
      x: (actualViewport.width - scaledCanvasWidth) / 2,
      y: (actualViewport.height - scaledCanvasHeight) / 2,
    }
  }, [canvasSettings.height, canvasSettings.ratio, canvasSettings.width, viewportSize])

  const centerCanvasInCurrentViewport = useCallback((options = {}) => {
    const { animated = true } = options
    const rect = viewportRef.current?.getBoundingClientRect()
    const actualViewport = {
      width: Math.max(1, Math.round(rect?.width || viewportSize.width || 1)),
      height: Math.max(1, Math.round(rect?.height || viewportSize.height || 1)),
    }
    const scale = cameraRef.current?.scale || camera.scale
    const centeredCamera = {
      scale,
      x: (actualViewport.width - canvasSettings.width * scale) / 2,
      y: (actualViewport.height - canvasSettings.height * scale) / 2,
    }

    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
      zoomAnimationRef.current = null
    }

    viewportSizeRef.current = actualViewport
    prevViewportWidthRef.current = actualViewport.width
    setViewportSize(actualViewport)

    if (!animated) {
      targetCameraRef.current = centeredCamera
      cameraRef.current = centeredCamera
      setCamera(centeredCamera)
      return
    }

    const fromCamera = cameraRef.current || camera
    targetCameraRef.current = centeredCamera
    const startedAt = performance.now()
    const duration = 240

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextCamera = {
        scale: fromCamera.scale + (centeredCamera.scale - fromCamera.scale) * eased,
        x: fromCamera.x + (centeredCamera.x - fromCamera.x) * eased,
        y: fromCamera.y + (centeredCamera.y - fromCamera.y) * eased,
      }

      cameraRef.current = nextCamera
      setCamera(nextCamera)

      if (progress < 1) {
        zoomAnimationRef.current = requestAnimationFrame(tick)
      } else {
        zoomAnimationRef.current = null
        cameraRef.current = centeredCamera
        setCamera(centeredCamera)
      }
    }

    zoomAnimationRef.current = requestAnimationFrame(tick)
  }, [camera.scale, canvasSettings.height, canvasSettings.width, viewportSize.height, viewportSize.width])

  useLayoutEffect(() => {
    if (hasCenteredCameraRef.current || isWorkspaceLoading || (shouldLoadWorkspace && !hasRestoredWorkspaceRef.current)) return undefined

    let firstFrame = 0
    let secondFrame = 0

    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const rect = viewportRef.current?.getBoundingClientRect()
        const actualViewport = {
          width: Math.max(1, Math.round(rect?.width || viewportSize.width || 1)),
          height: Math.max(1, Math.round(rect?.height || viewportSize.height || 1)),
        }
        if (!actualViewport.width || !actualViewport.height) return

        const centeredCamera = getCenteredCamera(actualViewport)

        console.log({
          viewportWidth: actualViewport.width,
          viewportHeight: actualViewport.height,
          canvasWidth: canvasSettings.width,
          canvasHeight: canvasSettings.height,
          cameraX: centeredCamera.x,
          cameraY: centeredCamera.y,
        })

        hasCenteredCameraRef.current = true
        prevViewportWidthRef.current = actualViewport.width
        targetCameraRef.current = centeredCamera
        cameraRef.current = centeredCamera
        viewportSizeRef.current = actualViewport
        setViewportSize(actualViewport)
        setCamera(centeredCamera)
      })
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [
    canvasSettings.height,
    canvasSettings.width,
    getCenteredCamera,
    isWorkspaceLoading,
    shouldLoadWorkspace,
    viewportSize.height,
    viewportSize.width,
  ])

  useLayoutEffect(() => {
    if (!shouldCenterAfterPanelCloseRef.current) return undefined

    let firstFrame = 0
    let secondFrame = 0
    let finalCenterTimer = 0

    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        centerCanvasInCurrentViewport()
      })
    })

    finalCenterTimer = window.setTimeout(() => {
      centerCanvasInCurrentViewport()
      shouldCenterAfterPanelCloseRef.current = false
    }, 380)

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      window.clearTimeout(finalCenterTimer)
    }
  }, [centerCanvasInCurrentViewport, isRightPanelOpen])

  const applyCamera = useCallback((nextCamera) => {
    const boundedCamera = clampCameraToCanvas(nextCamera)

    cameraRef.current = boundedCamera
    setCamera(boundedCamera)
  }, [clampCameraToCanvas])

  const canPanCamera = useCallback((currentCamera = cameraRef.current) => {
    const viewport = viewportSizeRef.current || viewportSize
    const scaledCanvasWidth = canvasSettings.width * currentCamera.scale
    const scaledCanvasHeight = canvasSettings.height * currentCamera.scale
    return (
      scaledCanvasWidth > viewport.width - 2 ||
      scaledCanvasHeight > viewport.height - 2
    )
  }, [canvasSettings.height, canvasSettings.width, viewportSize])

  // FIX BUG 2: Viewport resize (sidebar open/close) must NOT reset the zoom scale.
  // Old code called getCenteredCamera() on every viewport change, clobbering any zoom
  // the user had applied. The correct behavior: keep the CURRENT scale, just re-clamp
  // the x/y position so the canvas stays visible inside the new viewport dimensions.
  // We store the previous viewport width so we can detect sidebar toggles vs true resizes
  // and shift the camera x proportionally instead of re-centering from scratch.
  useEffect(() => {
    if (!hasCenteredCameraRef.current) return
    if (shouldCenterAfterPanelCloseRef.current) {
      prevViewportWidthRef.current = viewportSize.width
      return
    }

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

    const fromCamera = cameraRef.current
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
        cameraRef.current = targetCameraRef.current
        setCamera(targetCameraRef.current)
      }
    }

    zoomAnimationRef.current = requestAnimationFrame(tick)
  }

const attachTransformer = useCallback((idOrIds) => {
  if (!transformerRef.current || !stageRef.current) return

  const ids = Array.isArray(idOrIds) ? idOrIds : (idOrIds ? [idOrIds] : [])

  if (!ids.length) {
    transformerRef.current.nodes([])
    transformerRef.current.getLayer()?.batchDraw()
    return
  }

  const selectedGroupIds = Array.from(new Set(ids.map((id) => itemsRef.current.find((item) => item.id === id)?.groupId).filter(Boolean)))
  if (selectedGroupIds.length === 1) {
    const groupId = selectedGroupIds[0]
    const groupMembers = itemsRef.current.filter((item) => item.groupId === groupId)
    const isCompositeGroup = groupMembers.some((item) => item.compositeMode === 'mask' || item.compositeMode === 'exclude')
    if (isCompositeGroup) {
      const compositeNode = stageRef.current.findOne(`#composite-${groupId}`)
      if (compositeNode) {
        transformerRef.current.nodes([compositeNode])
        transformerRef.current.forceUpdate?.()
        transformerRef.current.getLayer()?.batchDraw()
        return
      }
    }
  }

  const nodes = ids
    .map((id) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id)
      const node = stageRef.current.findOne(`[id="${id}"]`) || stageRef.current.findOne(`#${id}`)
      return node && item?.kind !== 'connector' ? node : null
    })
    .filter(Boolean)

  transformerRef.current.nodes(nodes)
  transformerRef.current.getLayer()?.batchDraw()
}, [])

  const focusCanvasItem = useCallback((id, { force = false } = {}) => {
    const item = itemsRef.current.find((candidate) => candidate.id === id)
    if (!item || item.kind === 'connector') return

    const currentCamera = cameraRef.current
    const itemWidth = Math.max(1, item.w || 80)
    const itemHeight = Math.max(1, item.h || 80)
    const screenBounds = {
      left: currentCamera.x + item.x * currentCamera.scale,
      top: currentCamera.y + item.y * currentCamera.scale,
      right: currentCamera.x + (item.x + itemWidth) * currentCamera.scale,
      bottom: currentCamera.y + (item.y + itemHeight) * currentCamera.scale,
    }
    const padding = 72
    const isVisible = (
      screenBounds.left >= padding &&
      screenBounds.top >= padding &&
      screenBounds.right <= viewportSize.width - padding &&
      screenBounds.bottom <= viewportSize.height - padding
    )

    if (!force && isVisible) return

    animateCameraTo({
      scale: currentCamera.scale,
      x: viewportSize.width / 2 - (item.x + itemWidth / 2) * currentCamera.scale,
      y: viewportSize.height / 2 - (item.y + itemHeight / 2) * currentCamera.scale,
    })
  }, [viewportSize])

  const openLayerObjectProperties = useCallback((id) => {
    const item = itemsRef.current.find((candidate) => candidate.id === id)
    if (!item) return

    setSelectedId(id)
    setSelectedIds([id])
    setActivePanel('properties')
    setIsRightPanelOpen(true)
    setIsColorPickerOpen(false)
    setColorPickerTarget(null)
    setIsFontPickerOpen(false)
    setFontSearchQuery('')
    setSelectedFontCategory(null)
    setLoadingFont(null)
    setEditingText(null)
    setConnectorTool(null)
    setConnectorDraft(null)

    requestAnimationFrame(() => {
      attachTransformer(id)
      requestAnimationFrame(() => focusCanvasItem(id))
    })
  }, [attachTransformer, focusCanvasItem])

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return

    if (pendingSelectIdRef.current !== null) {
      const id = pendingSelectIdRef.current
      pendingSelectIdRef.current = null
      setSelectedId(id)
      setSelectedIds([id])
      setIsRightPanelOpen(true)
      requestAnimationFrame(() => {
        attachTransformer(id)
        justDroppedIdRef.current = null
      })
      return
    }

    attachTransformer(selectedIds.length ? selectedIds : selectedId)
  }, [selectedId, selectedIds, items, attachTransformer])

  const finishFrameImageEdit = useCallback(() => {
    if (!editingFrameId) return
 
    const frameId = editingFrameId
    setEditingFrameId(null)
 
    // Kembalikan outer transformer ke frame
    requestAnimationFrame(() => {
      attachTransformer(frameId)
    })
  }, [attachTransformer, editingFrameId])

  const handleCopy = useCallback(() => {
    const activeIds = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    if (!activeIds.length) return
    clipboardRef.current = JSON.parse(JSON.stringify(
      itemsRef.current.filter((item) => activeIds.includes(item.id))
    ))
    setHasClipboard(true)
  }, [selectedId, selectedIds])

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current.length) return
    const pasted = JSON.parse(JSON.stringify(clipboardRef.current)).map((item) => {
      const id = getNextItemId(item.kind)
      return { ...item, id, x: (item.x || 0) + 20, y: (item.y || 0) + 20 }
    })
    const pastedIds = pasted.map((item) => item.id)
    setItems((current) => [...pasted, ...current])
    setSelectedId(pastedIds[pastedIds.length - 1])
    setSelectedIds(pastedIds)
    requestAnimationFrame(() => attachTransformer(pastedIds))
  }, [attachTransformer])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isTypingTarget = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (event.key === 'Shift') {
        setIsShiftDown(true)
      }

      if (event.code === 'Space' && !isTypingTarget) {
        event.preventDefault()
        setIsSpaceDown(true)
        setStageCursor((current) => (current === 'grabbing' ? current : 'grab'))
      }

      if (event.key === 'Escape') {
        if (connectorDraft || connectorTool) {
          setConnectorDraft(null)
          setConnectorTool(null)
          setStageCursor('default')
        } else if (editingFrameId) {
          finishFrameImageEdit()
        } else if (isFontPickerOpen) {
          setIsFontPickerOpen(false)
          setFontSearchQuery('')
          setSelectedFontCategory(null)
          setLoadingFont(null)
        } else if (isColorPickerOpen) {
          setIsColorPickerOpen(false)
          setColorPickerTarget(null)
        } else if (isBlendModeOpen) {
          setIsBlendModeOpen(false)
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !isTypingTarget) {
        event.preventDefault()
        const allIds = itemsRef.current
          .filter((item) => item.visible !== false && item.kind !== 'connector')
          .map((item) => item.id)
        setSelectedId(allIds[allIds.length - 1] || null)
        setSelectedIds(allIds)
        requestAnimationFrame(() => attachTransformer(allIds))
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && !isTypingTarget) {
        handleCopy()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v' && !isTypingTarget) {
        event.preventDefault()
        handlePaste()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !isTypingTarget) {
        event.preventDefault()
        handleUndo()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y' && !isTypingTarget) {
        event.preventDefault()
        handleRedo()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && !isTypingTarget) {
        event.preventDefault()
        handleManualSave()
      }
    }

    const handleKeyUp = (event) => {
      const target = event.target
      const isTypingTarget = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (event.key === 'Shift') {
        setIsShiftDown(false)
      }

      if (event.code === 'Space' && !isTypingTarget) {
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
  }, [isFontPickerOpen, isColorPickerOpen, editingFrameId, finishFrameImageEdit, connectorDraft, connectorTool, handleCopy, handlePaste, handleManualSave])

  const openRightPanel = (panel = activePanel) => {
    console.log('[DEBUG] openRightPanel called with panel:', panel)
    setConnectorTool(null)
    setConnectorDraft(null)
    setActivePanel(panel)
    setMobileSheetState('half')
    requestRecenterAfterWorkspaceLayoutChange()
    setIsRightPanelOpen(true)
  }

  const requestRecenterAfterWorkspaceLayoutChange = () => {
    shouldCenterAfterPanelCloseRef.current = true
  }

  const closeRightPanelAndCenter = () => {
    requestRecenterAfterWorkspaceLayoutChange()
    setMobileSheetState('collapsed')
    setIsRightPanelOpen(false)
  }

  const deselectCanvas = () => {
    console.log('[DEBUG] deselectCanvas called')
    setConnectorTool(null)
    setConnectorDraft(null)
    setSelectedId(null)
    setSelectedIds([])
    setSelectionBox(null)
    setAlignmentGuides([])
    setActivePanel(null)
    setIsGroupSelectMode(false)
    closeRightPanelAndCenter()
    setIsRenamingTitle(false)
    setEditingSliderKey(null)
    attachTransformer(null)
  }

  const selectItem = (id, options = {}) => {
    setIsBlendModeOpen(false)
    const item = itemsRef.current.find((candidate) => candidate.id === id)
    const resolvedIds = item?.groupId && !options.ignoreGroup
      ? itemsRef.current.filter((candidate) => candidate.groupId === item.groupId).map((candidate) => candidate.id)
      : (id ? [id] : [])
    setSelectedIds((current) => {
      if (options.toggle) {
        const shouldRemove = resolvedIds.every((resolvedId) => current.includes(resolvedId))
        const next = shouldRemove
          ? current.filter((currentId) => !resolvedIds.includes(currentId))
          : Array.from(new Set([...current, ...resolvedIds]))
        setSelectedId(next[next.length - 1] || null)
        requestAnimationFrame(() => attachTransformer(next))
        return next
      }

      setSelectedId(resolvedIds[resolvedIds.length - 1] || null)
      requestAnimationFrame(() => attachTransformer(resolvedIds))
      return resolvedIds
    })
    requestRecenterAfterWorkspaceLayoutChange()
    setIsRightPanelOpen(true)
    if (window.innerWidth <= 860) {
      setMobileSheetState('half')
    }
  }

  const deleteObject = useCallback((id) => {
    console.log('[DEBUG] deleteObject called with id:', id)
    if (!id) return

    setItems((current) => current.filter((item) => item.id !== id))
    if (selectedId === id) {
      console.log('[DEBUG] deleteObject: setting activePanel to null')
      setSelectedId(null)
      setSelectedIds([])
      setActivePanel(null)
      setIsGroupSelectMode(false)
      closeRightPanelAndCenter()
      attachTransformer(null)
    } else {
      setSelectedIds((current) => current.filter((currentId) => currentId !== id))
    }
  }, [attachTransformer, selectedId])

  const deleteSelectedObject = useCallback(() => {
    const idsToDelete = selectedIds.length ? selectedIds : [selectedId]
    setItems((current) => current.filter((item) => !idsToDelete.includes(item.id)))
    setSelectedId(null)
    setSelectedIds([])
    setActivePanel(null)
    setIsGroupSelectMode(false)
    closeRightPanelAndCenter()
    attachTransformer(null)
  }, [attachTransformer, selectedId, selectedIds])

  const handleGroupSelectionAction = useCallback(() => {
    const activeIds = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    if (!activeIds.length) return

    if (activeIds.length > 1) {
      const groupId = activeGroupId || `group-${Date.now()}`
      setItems((current) => {
        const selectedSet = new Set(activeIds)
        const groupMembers = current
          .filter((item) => selectedSet.has(item.id))
          .map((item) => ({ ...item, groupId }))
        const rest = current.filter((item) => !selectedSet.has(item.id))
        const firstSelectedIndex = current.findIndex((item) => selectedSet.has(item.id))
        const insertIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : 0
        return [
          ...rest.slice(0, insertIndex),
          ...groupMembers,
          ...rest.slice(insertIndex),
        ]
      })
      setIsGroupSelectMode(false)
      setSelectedId(activeIds[activeIds.length - 1])
      setSelectedIds(activeIds)
      requestAnimationFrame(() => attachTransformer(activeIds))
      return
    }

    setIsGroupSelectMode(true)
    setSelectedIds(activeIds)
    requestAnimationFrame(() => attachTransformer(activeIds))
  }, [activeGroupId, attachTransformer, selectedId, selectedIds])

  const ungroupSelectedItems = useCallback(() => {
    const groupId = activeGroupId
    if (!groupId) return
    const groupIds = itemsRef.current.filter((item) => item.groupId === groupId).map((item) => item.id)
    setItems((current) => current.map((item) => (
      item.groupId === groupId ? { ...item, groupId: null, compositeMode: null } : item
    )))
    setIsGroupSelectMode(false)
    setSelectedIds(groupIds)
    setSelectedId(groupIds[groupIds.length - 1] || null)
    requestAnimationFrame(() => attachTransformer(groupIds))
  }, [activeGroupId, attachTransformer])

  const handleUndo = useCallback(() => {
    if (!undoStackRef.current.length) return
    isUndoingRef.current = true
    redoStackRef.current.push(JSON.parse(JSON.stringify(itemsRef.current)))
    const prev = undoStackRef.current.pop()
    if (prev) setItems(prev)
  }, [])

  const handleRedo = useCallback(() => {
    if (!redoStackRef.current.length) return
    isUndoingRef.current = true
    undoStackRef.current.push(JSON.parse(JSON.stringify(itemsRef.current)))
    const next = redoStackRef.current.pop()
    if (next) setItems(next)
  }, [])

  const alignCanvasItems = useCallback((alignment) => {
    const ids = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    if (!ids.length) return
    setItems((current) => current.map((item) => {
      if (!ids.includes(item.id)) return item
      const bounds = getItemVisualBounds(item)
      switch (alignment) {
        case 'left':   return { ...item, x: (item.x || 0) + canvasBounds.x - bounds.left }
        case 'right':  return { ...item, x: (item.x || 0) + (canvasBounds.x + canvasBounds.width) - bounds.right }
        case 'center': return { ...item, x: (item.x || 0) + (canvasBounds.x + canvasBounds.width / 2) - bounds.centerX }
        case 'top':    return { ...item, y: (item.y || 0) + canvasBounds.y - bounds.top }
        case 'bottom': return { ...item, y: (item.y || 0) + (canvasBounds.y + canvasBounds.height) - bounds.bottom }
        case 'middle': return { ...item, y: (item.y || 0) + (canvasBounds.y + canvasBounds.height / 2) - bounds.centerY }
        default:       return item
      }
    }))
  }, [selectedId, selectedIds, canvasBounds])

  const duplicateItems = useCallback((ids) => {
    if (!ids.length) return
    const pasted = JSON.parse(JSON.stringify(
      itemsRef.current.filter((item) => ids.includes(item.id))
    )).map((item) => ({
      ...item,
      id: getNextItemId(item.kind),
      x: (item.x || 0) + 20,
      y: (item.y || 0) + 20,
    }))
    const pastedIds = pasted.map((item) => item.id)
    setItems((current) => [...pasted, ...current])
    setSelectedId(pastedIds[pastedIds.length - 1])
    setSelectedIds(pastedIds)
    requestAnimationFrame(() => attachTransformer(pastedIds))
  }, [attachTransformer])

  const lockToggleSelected = useCallback(() => {
    const ids = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    if (!ids.length) return
    const first = itemsRef.current.find((item) => ids.includes(item.id))
    if (!first) return
    const nextLocked = !first.locked
    setItems((current) => current.map((item) =>
      ids.includes(item.id) ? { ...item, locked: nextLocked } : item
    ))
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        attachTransformer(ids)
        updateToolbarPosition()
      })
    })
  }, [attachTransformer, selectedId, selectedIds])

  const moveLayerBlock = useCallback((direction) => {
    const groupId = activeGroupId
    const activeIds = groupId
      ? itemsRef.current.filter((item) => item.groupId === groupId).map((item) => item.id)
      : (selectedIds.length ? selectedIds : (selectedId ? [selectedId] : []))
    if (!activeIds.length) return

    setItems((current) => {
      const activeSet = new Set(activeIds)
      const block = current.filter((item) => activeSet.has(item.id))
      if (!block.length) return current
      const rest = current.filter((item) => !activeSet.has(item.id))
      const firstIndex = current.findIndex((item) => activeSet.has(item.id))
      const restBeforeBlock = current.slice(0, firstIndex).filter((item) => !activeSet.has(item.id)).length
      let insertIndex = restBeforeBlock

      if (direction === 'front') insertIndex = 0
      if (direction === 'back') insertIndex = rest.length
      if (direction === 'forward') insertIndex = Math.max(0, restBeforeBlock - 1)
      if (direction === 'backward') insertIndex = Math.min(rest.length, restBeforeBlock + 1)
      if (insertIndex === restBeforeBlock) return current

      return [
        ...rest.slice(0, insertIndex),
        ...block,
        ...rest.slice(insertIndex),
      ]
    })
  }, [activeGroupId, selectedId, selectedIds])

  const bringForward = useCallback(() => {
    if (activeGroupId || selectedIds.length > 1) {
      moveLayerBlock('forward')
      return
    }
    const id = selectedId
    if (!id) return
    setItems((current) => {
      const idx = current.findIndex((item) => item.id === id)
      if (idx <= 0) return current
      const next = [...current]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length])

  const sendBackward = useCallback(() => {
    if (activeGroupId || selectedIds.length > 1) {
      moveLayerBlock('backward')
      return
    }
    const id = selectedId
    if (!id) return
    setItems((current) => {
      const idx = current.findIndex((item) => item.id === id)
      if (idx < 0 || idx >= current.length - 1) return current
      const next = [...current]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length])

  const bringToFront = useCallback(() => {
    if (activeGroupId || selectedIds.length > 1) {
      moveLayerBlock('front')
      return
    }
    const id = selectedId
    if (!id) return
    setItems((current) => {
      const idx = current.findIndex((item) => item.id === id)
      if (idx <= 0) return current
      const item = current[idx]
      return [item, ...current.slice(0, idx), ...current.slice(idx + 1)]
    })
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length])

  const sendToBack = useCallback(() => {
    if (activeGroupId || selectedIds.length > 1) {
      moveLayerBlock('back')
      return
    }
    const id = selectedId
    if (!id) return
    setItems((current) => {
      const idx = current.findIndex((item) => item.id === id)
      if (idx < 0 || idx >= current.length - 1) return current
      const item = current[idx]
      return [...current.slice(0, idx), ...current.slice(idx + 1), item]
    })
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length])

  const moveSelected = useCallback((dx, dy) => {
    const activeIds = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    if (!activeIds.length) return
    setItems((current) => current.map((item) => {
      if (!activeIds.includes(item.id) || item.locked) return item
      if (item.kind === 'connector') {
        return {
          ...item,
          x: (item.x || 0) + dx,
          y: (item.y || 0) + dy,
          fromPoint: item.fromPoint ? { x: item.fromPoint.x + dx, y: item.fromPoint.y + dy } : item.fromPoint,
          toPoint: item.toPoint ? { x: item.toPoint.x + dx, y: item.toPoint.y + dy } : item.toPoint,
        }
      }
      const nextPosition = getClampedCanvasPosition(item.w || 1, item.h || 1, {
        x: (item.x || 0) + dx,
        y: (item.y || 0) + dy,
      }, canvasBounds)
      return { ...item, ...nextPosition }
    }))
    requestAnimationFrame(() => {
      const layer = stageRef.current?.findOne('Layer')
      layer?.batchDraw()
    })
  }, [selectedId, selectedIds, canvasBounds])

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    fontSize: 13,
    color: '#e2e8f0',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  const closeAllMenus = useCallback(() => {
    setContextMenu(null)
    setShowMoreMenu(false)
    setShowAlignSubmenu(false)
    setIsMorePanelOpen(false)
    setIsFxPanelOpen(false)
  }, [])

  const updateToolbarPosition = useCallback(() => {
    if (!transformerRef.current || !stageRef.current) {
      setToolbarPos(null)
      return
    }
    try {
      const box = transformerRef.current.getClientRect()
      if (!box || !box.width) { setToolbarPos(null); return }
      const stageEl = stageRef.current.container()
      const stageRect = stageEl.getBoundingClientRect()
      const viewportWidth = window.innerWidth || 1024
      const viewportHeight = window.innerHeight || 768
      const isMobile = viewportWidth <= 860
      const rawX = stageRect.left + box.x + box.width / 2
      const rawY = stageRect.top + box.y
      setToolbarPos({
        x: isMobile ? 10 : clamp(rawX, 180, viewportWidth - 180),
        y: clamp(rawY, isMobile ? 128 : 86, viewportHeight - 28),
        mobile: isMobile,
      })
    } catch { setToolbarPos(null) }
  }, [])

  useEffect(() => {
    if (selectedIds.length || selectedId) {
      requestAnimationFrame(updateToolbarPosition)
    } else {
      setToolbarPos(null)
    }
  }, [selectedId, selectedIds, updateToolbarPosition])

  const zoomCameraAtPoint = useCallback((nextScale, point, options = {}) => {
    const { animated = false, constrain = true } = options
    const currentCamera = cameraRef.current
    const safeScale = clamp(nextScale, minZoom, maxZoom)
    const safePoint = point || {
      x: viewportSizeRef.current.width / 2,
      y: viewportSizeRef.current.height / 2,
    }
    const worldPoint = {
      x: (safePoint.x - currentCamera.x) / currentCamera.scale,
      y: (safePoint.y - currentCamera.y) / currentCamera.scale,
    }
    const requestedCamera = {
      scale: safeScale,
      x: safePoint.x - worldPoint.x * safeScale,
      y: safePoint.y - worldPoint.y * safeScale,
    }
    const nextCamera = constrain ? clampCameraToCanvas(requestedCamera) : requestedCamera

    if (animated) {
      animateCameraTo(nextCamera)
      return
    }

    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
      zoomAnimationRef.current = null
    }
    targetCameraRef.current = nextCamera
    cameraRef.current = nextCamera
    setCamera(nextCamera)
  }, [animateCameraTo, clampCameraToCanvas])

  const handleZoomIn = useCallback(() => {
    const viewportCenter = {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2,
    }
    zoomCameraAtPoint(cameraRef.current.scale * zoomSpeed, viewportCenter, { animated: true })
  }, [viewportSize, zoomCameraAtPoint])

  const handleZoomOut = useCallback(() => {
    const viewportCenter = {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2,
    }
    zoomCameraAtPoint(cameraRef.current.scale / zoomSpeed, viewportCenter, { animated: true })
  }, [viewportSize, zoomCameraAtPoint])

  const handleResetZoom = useCallback(() => {
    const nextCamera = getCenteredCamera()
    animateCameraTo(nextCamera)
  }, [getCenteredCamera])

  useEffect(() => {
    const handleSelectionKeyboard = (event) => {
      const target = event.target
      const isEditingText = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (isEditingText || editingFrameId || !selectedId || event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteSelectedObject()
        return
      }

      const arrowDeltaMap = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      }
      const delta = arrowDeltaMap[event.key]
      if (!delta) return

      const activeIds = selectedIds.length ? selectedIds : [selectedId]
      const activeItems = itemsRef.current.filter((item) => activeIds.includes(item.id) && !item.locked)
      if (!activeItems.length) return

      event.preventDefault()
      const step = event.shiftKey ? 10 : 1
      const dx = delta.x * step
      const dy = delta.y * step

      setItems((current) => current.map((item) => {
        if (!activeIds.includes(item.id) || item.locked) return item

        if (item.kind === 'connector') {
          return {
            ...item,
            x: (item.x || 0) + dx,
            y: (item.y || 0) + dy,
            fromPoint: item.fromPoint ? { x: item.fromPoint.x + dx, y: item.fromPoint.y + dy } : item.fromPoint,
            toPoint: item.toPoint ? { x: item.toPoint.x + dx, y: item.toPoint.y + dy } : item.toPoint,
          }
        }

        const nextPosition = getClampedCanvasPosition(item.w || 1, item.h || 1, {
          x: (item.x || 0) + dx,
          y: (item.y || 0) + dy,
        }, canvasBounds)
        return { ...item, ...nextPosition }
      }))

      requestAnimationFrame(() => {
        const layer = stageRef.current?.findOne('Layer')
        layer?.batchDraw()
      })
    }

    window.addEventListener('keydown', handleSelectionKeyboard)

    return () => {
      window.removeEventListener('keydown', handleSelectionKeyboard)
    }
  }, [deleteSelectedObject, editingFrameId, selectedId, selectedIds])

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

  // ── Tool handlers ─────────────────────────────────

  const beginBrushStroke = (event) => {
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    brushStartPosRef.current = { x: pointer.x, y: pointer.y }
  }

  const tryStartBrushStroke = () => {
    if (brushStartPosRef.current) {
      const pointer = stageRef.current?.getPointerPosition()
      if (!pointer) return
      const dx = pointer.x - brushStartPosRef.current.x
      const dy = pointer.y - brushStartPosRef.current.y
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return
      brushDrawingRef.current = true
      brushStartPosRef.current = null
      const worldPoint = getWorldPointFromViewport(pointer, cameraRef.current)
      const initStroke = { id: `brush-${Date.now()}`, points: [worldPoint.x, worldPoint.y] }
      currentStrokeRef.current = initStroke
      setCurrentStroke(initStroke)
    }
  }

  const findImageAtStagePoint = (stage, worldPoints) => {
    const cam = cameraRef.current
    const step = Math.max(1, Math.floor(worldPoints.length / 8))
    for (let i = 0; i < worldPoints.length; i += step * 2) {
      const sx = worldPoints[i] * cam.scale + cam.x
      const sy = worldPoints[i + 1] * cam.scale + cam.y
      const hitNode = stage.getIntersection({ x: sx, y: sy })
      if (!hitNode || hitNode === stage) continue
      let node = hitNode
      while (node && node !== stage) {
        const id = node.id()
        if (id) {
          const item = itemsRef.current.find((candidate) => candidate.id === id)
          if (item && (item.kind === 'image' || (item.kind === 'shape' && item.shapeType === 'freehand'))) return item
        }
        node = node.parent
      }
    }
    return null
  }

  const applyEraserStroke = async (worldPoints, activeItemId) => {
    const stage = stageRef.current
    if (!stage || worldPoints.length < 2) return
    const cam = cameraRef.current

    let targetItem = null
    if (activeItemId) {
      targetItem = itemsRef.current.find((item) => item.id === activeItemId)
      if (targetItem && !(targetItem.kind === 'image' || (targetItem.kind === 'shape' && targetItem.shapeType === 'freehand'))) {
        targetItem = null
      }
    }
    if (!targetItem) {
      targetItem = findImageAtStagePoint(stage, worldPoints)
    }
    if (!targetItem) return

    const wasFreehand = targetItem.kind === 'shape' && targetItem.shapeType === 'freehand'
    const size = brushSettingsRef.current.size
    const halfSize = size / 2

    if (wasFreehand) {
      let erWMinX = Infinity, erWMinY = Infinity, erWMaxX = -Infinity, erWMaxY = -Infinity
      for (let i = 0; i < worldPoints.length; i += 2) {
        erWMinX = Math.min(erWMinX, worldPoints[i])
        erWMinY = Math.min(erWMinY, worldPoints[i + 1])
        erWMaxX = Math.max(erWMaxX, worldPoints[i])
        erWMaxY = Math.max(erWMaxY, worldPoints[i + 1])
      }
      // Convert eraser bounding box to stage coordinates for stroke comparison
      const erSMinX = erWMinX * cam.scale + cam.x - halfSize
      const erSMinY = erWMinY * cam.scale + cam.y - halfSize
      const erSMaxX = erWMaxX * cam.scale + cam.x + halfSize
      const erSMaxY = erWMaxY * cam.scale + cam.y + halfSize

      const itemX = targetItem.x
      const itemY = targetItem.y
      const strokes = targetItem.strokes || [targetItem.points]

      const splitStrokes = []
      for (const stroke of strokes) {
        let segment = []
        for (let i = 0; i < stroke.length; i += 2) {
          const sx = (stroke[i] + itemX) * cam.scale + cam.x
          const sy = (stroke[i + 1] + itemY) * cam.scale + cam.y
          const inside = sx >= erSMinX && sx <= erSMaxX && sy >= erSMinY && sy <= erSMaxY
          if (!inside) {
            segment.push(stroke[i], stroke[i + 1])
          } else if (segment.length > 0) {
            if (segment.length >= 4) splitStrokes.push(segment)
            segment = []
          }
        }
        if (segment.length >= 4) splitStrokes.push(segment)
      }

      if (splitStrokes.length === 0) {
        setItems((current) => current.filter((item) => item.id !== targetItem.id))
        setSelectedId(null)
        setSelectedIds([])
        requestAnimationFrame(() => attachTransformer(null))
        return
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const stroke of splitStrokes) {
        for (let i = 0; i < stroke.length; i += 2) {
          const wx = stroke[i] + itemX
          const wy = stroke[i + 1] + itemY
          minX = Math.min(minX, wx)
          minY = Math.min(minY, wy)
          maxX = Math.max(maxX, wx)
          maxY = Math.max(maxY, wy)
        }
      }
      const dx = minX - itemX
      const dy = minY - itemY
      const relStrokes = splitStrokes.map((s) => {
        const rel = []
        for (let i = 0; i < s.length; i += 2) {
          rel.push(s[i] - dx)
          rel.push(s[i + 1] - dy)
        }
        return rel
      })

      setItems((current) => current.map((item) => {
        if (item.id !== targetItem.id) return item
        return {
          ...item,
          x: minX, y: minY,
          w: Math.max(1, maxX - minX),
          h: Math.max(1, maxY - minY),
          strokes: relStrokes,
          points: undefined,
        }
      }))
      return
    }

    // Image item: canvas + destination-out
    const halfStroke = 0
    const padL = 0
    const padT = 0
    const paddedW = Math.ceil(targetItem.w)
    const paddedH = Math.ceil(targetItem.h)
    const originX = targetItem.x
    const originY = targetItem.y

    const canvas = document.createElement('canvas')
    canvas.width = paddedW
    canvas.height = paddedH
    const ctx = canvas.getContext('2d')

    const img = await new Promise((resolve, reject) => {
      const image = new window.Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load image'))
      image.src = targetItem.src
    })
    ctx.drawImage(img, 0, 0, paddedW, paddedH)

    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.beginPath()
    for (let i = 0; i < worldPoints.length; i += 2) {
      const lx = worldPoints[i] - originX
      const ly = worldPoints[i + 1] - originY
      if (i === 0) ctx.moveTo(lx, ly)
      else ctx.lineTo(lx, ly)
    }
    ctx.stroke()

    canvas.toBlob((blob) => {
      if (!blob) return
      const localUrl = URL.createObjectURL(blob)
      setItems((current) => current.map((item) => {
        if (item.id !== targetItem.id) return item
        return { ...item, x: originX, y: originY, w: paddedW, h: paddedH, src: localUrl }
      }))

      const file = new File([blob], `erased-${Date.now()}.png`, { type: 'image/png' })
      uploadMediaFile({ file }).then((uploaded) => {
        const url = uploaded?.media?.url
        if (url) {
          URL.revokeObjectURL(localUrl)
          setItems((current) => current.map((item) => {
            if (item.id !== targetItem.id) return item
            return { ...item, x: originX, y: originY, w: paddedW, h: paddedH, src: url }
          }))
        }
      }).catch(() => {})
    })
  }

  const handleEraserTapSelect = (stagePos) => {
    const stage = stageRef.current
    if (!stage) return
    const hitNode = stage.getIntersection({ x: stagePos.x, y: stagePos.y })
    if (!hitNode || hitNode === stage) {
      setSelectedId(null)
      setSelectedIds([])
      requestAnimationFrame(() => {
        if (transformerRef.current) {
          transformerRef.current.nodes([])
          transformerRef.current.getLayer()?.batchDraw()
        }
      })
      return
    }
    let node = hitNode
    while (node && node !== stage) {
      const id = node.id()
      if (id) {
        const item = itemsRef.current.find((c) => c.id === id)
        if (item && !item.locked && (item.kind === 'image' || (item.kind === 'shape' && item.shapeType === 'freehand'))) {
          selectItem(id)
          requestAnimationFrame(() => attachTransformer(id))
          if (item.kind === 'shape' && item.shapeType === 'freehand') {
            currentBrushItemIdRef.current = id
          }
          return
        }
      }
      node = node.parent
    }
    setSelectedId(null)
    setSelectedIds([])
    requestAnimationFrame(() => {
      if (transformerRef.current) {
        transformerRef.current.nodes([])
        transformerRef.current.getLayer()?.batchDraw()
      }
    })
  }

  const finishBrushStroke = () => {
    brushStartPosRef.current = null
    if (!brushDrawingRef.current) {
      // Tap on empty canvas → reset brush layer
      currentBrushItemIdRef.current = null
      return
    }
    brushDrawingRef.current = false
    // Save ref points before setCurrentStroke clears them (ref is always most up-to-date)
    const refPoints = currentStrokeRef.current?.points?.slice()
    latestPointerRef.current = null
    if (brushSettingsRef.current.mode === 'erase' && refPoints && refPoints.length >= 4) {
      queueMicrotask(() => applyEraserStroke(refPoints, currentBrushItemIdRef.current))
      currentStrokeRef.current = null
      setCurrentStroke(null)
      return
    }
    setCurrentStroke((prev) => {
      currentStrokeRef.current = null
      if (!prev || prev.points.length < 4) return null

      // Eraser mode: clear pixels on image item
      if (brushSettingsRef.current.mode === 'erase') {
        queueMicrotask(() => applyEraserStroke(prev.points.slice(), currentBrushItemIdRef.current))
        return null
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < prev.points.length; i += 2) {
        minX = Math.min(minX, prev.points[i])
        minY = Math.min(minY, prev.points[i + 1])
        maxX = Math.max(maxX, prev.points[i])
        maxY = Math.max(maxY, prev.points[i + 1])
      }
      const relPoints = []
      for (let i = 0; i < prev.points.length; i += 2) {
        relPoints.push(prev.points[i] - minX)
        relPoints.push(prev.points[i + 1] - minY)
      }
      if (currentBrushItemIdRef.current) {
        // Append stroke to existing brush item
        const itemId = currentBrushItemIdRef.current
        setItems((items) => items.map((item) => {
          if (item.id !== itemId) return item
          const existingStrokes = item.strokes || [item.points]
          const newX = Math.min(item.x, minX)
          const newY = Math.min(item.y, minY)
          const offsetX = newX - item.x
          const offsetY = newY - item.y
          const adjustedStrokes = existingStrokes.map((s) => {
            const adjusted = []
            for (let i = 0; i < s.length; i += 2) {
              adjusted.push(s[i] - offsetX)
              adjusted.push(s[i + 1] - offsetY)
            }
            return adjusted
          })
          const adjustedNew = []
          for (let i = 0; i < relPoints.length; i += 2) {
            adjustedNew.push(relPoints[i] + (minX - newX))
            adjustedNew.push(relPoints[i + 1] + (minY - newY))
          }
          const newStrokes = [...adjustedStrokes, adjustedNew]
          return {
            ...item,
            x: newX, y: newY,
            w: Math.max(item.w - offsetX, maxX - newX),
            h: Math.max(item.h - offsetY, maxY - newY),
            strokes: newStrokes,
          }
        }))
      } else {
        // Create new brush item
        const newItem = {
          id: prev.id,
          kind: 'shape',
          shapeType: 'freehand',
          x: minX, y: minY,
          w: Math.max(1, maxX - minX),
          h: Math.max(1, maxY - minY),
          strokes: [relPoints],
          stroke: brushSettings.color,
          strokeWidth: brushSettings.size,
          opacity: brushSettings.opacity,
          fill: 'transparent',
          rotation: 0,
          effects: getDefaultEffects(),
        }
        setItems((items) => [newItem, ...items])
        currentBrushItemIdRef.current = newItem.id
      }
      return null
    })
  }

  const cancelBrushStroke = () => {
    brushDrawingRef.current = false
    brushStartPosRef.current = null
    setCurrentStroke(null)
  }

  const snapBezierPoint = (point) => {
    if (!point || bezierAnchors.length === 0) return point
    const tolerance = 5 / cameraRef.current.scale
    let snappedX = null, snappedY = null
    let bestDistX = tolerance, bestDistY = tolerance
    for (const a of bezierAnchors) {
      const dx = Math.abs(point.x - a.x)
      const dy = Math.abs(point.y - a.y)
      if (dx < bestDistX) { bestDistX = dx; snappedX = a.x }
      if (dy < bestDistY) { bestDistY = dy; snappedY = a.y }
    }
    return {
      x: snappedX !== null ? snappedX : point.x,
      y: snappedY !== null ? snappedY : point.y,
    }
  }

  const addBezierAnchor = (event) => {
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const worldPoint = getWorldPointFromViewport(pointer, cameraRef.current)
    const snapped = snapBezierPoint(worldPoint)
    if (bezierAnchors.length >= 3) {
      const first = bezierAnchors[0]
      const dist = Math.sqrt((snapped.x - first.x) ** 2 + (snapped.y - first.y) ** 2)
      if (dist < 12) { finishBezierPath(); return }
    }
    setBezierAnchors((prev) => [...prev, snapped])
  }

  const undoBezierAnchor = () => {
    setBezierAnchors((prev) => prev.slice(0, -1))
  }

  const finishBezierPath = () => {
    if (bezierAnchors.length < 2) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const a of bezierAnchors) {
      minX = Math.min(minX, a.x); minY = Math.min(minY, a.y)
      maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y)
    }
    const rel = bezierAnchors.map((a) => ({ x: a.x - minX, y: a.y - minY }))
    let pathData = `M ${rel[0].x},${rel[0].y}`
    for (let i = 1; i < rel.length; i++) pathData += ` L ${rel[i].x},${rel[i].y}`
    pathData += ' Z'
    const fillColor = bezierSettings.strokeColor + '30'
    const newItem = {
      id: `bezier-${Date.now()}`,
      kind: 'shape',
      shapeType: 'bezier-path',
      x: minX, y: minY,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY),
      path: pathData,
      stroke: bezierSettings.strokeColor,
      strokeWidth: bezierSettings.strokeWidth,
      fill: fillColor,
      rotation: 0,
      effects: getDefaultEffects(),
    }
    setItems((items) => [newItem, ...items])
    setBezierAnchors([])
    setBezierMousePos(null)
    setBezierGuides([])
  }

  const cancelBezierPath = () => {
    setBezierAnchors([])
    setBezierMousePos(null)
    setBezierGuides([])
    setActivePanel(null)
    setIsRightPanelOpen(false)
  }

  const parseBezierAnchors = (item) => {
    const result = []
    const parts = item.path?.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/g)
    if (parts) {
      for (const p of parts) {
        const m = p.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/)
        if (m) result.push({ x: item.x + parseFloat(m[1]), y: item.y + parseFloat(m[2]) })
      }
    }
    return result
  }

  const startEditingBezier = (itemId) => {
    setEditingBezierId(itemId)
    const item = itemsRef.current.find((i) => i.id === itemId)
    if (item && item.shapeType === 'bezier-path') {
      setBezierEditAnchors(parseBezierAnchors(item))
      bezierCpRef.current = item.bezierData ? JSON.parse(JSON.stringify(item.bezierData)) : null
    }
    setStageCursor('default')
  }

  const updateBezierCornerRadius = (itemId, radius) => {
    setItems((items) => items.map((item) => {
      if (item.id !== itemId) return item
      return { ...item, cornerRadius: Math.max(0, Math.min(50, radius)) }
    }))
  }

  const moveBezierAnchor = (itemId, anchorIndex, newWorldPos) => {
    const item = itemsRef.current.find((i) => i.id === itemId)
    if (!item || item.shapeType !== 'bezier-path') return
    const anchors = parseBezierAnchors(item)
    if (anchorIndex < 0 || anchorIndex >= anchors.length) return
    anchors[anchorIndex] = { x: newWorldPos.x, y: newWorldPos.y }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const a of anchors) {
      minX = Math.min(minX, a.x); minY = Math.min(minY, a.y)
      maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y)
    }
    const rel = anchors.map((a) => ({ x: a.x - minX, y: a.y - minY }))
    let pathData = `M ${rel[0].x},${rel[0].y}`
    for (let i = 1; i < rel.length; i++) pathData += ` L ${rel[i].x},${rel[i].y}`
    pathData += ' Z'
    setItems((items) => items.map((item) => {
      if (item.id !== itemId) return item
      return { ...item, x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY), path: pathData }
    }))
    setBezierEditAnchors(anchors.map((a) => ({ x: a.x, y: a.y })))
  }

  const finishEditingBezier = () => {
    setEditingBezierId(null)
    setBezierEditAnchors(null)
    setSelectedBezierAnchorIdx(null)
    bezierPreviewPathRef.current = null
    bezierCpRef.current = null
    setStageCursor('default')
  }

  // Tool cursor management
  const handleItemCursor = useCallback((cursor) => {
    if ((activePanel === 'brush' && brushSettings.mode === 'paint') || activePanel === 'bezier' || editingBezierId) {
      return
    }
    setStageCursor(cursor)
  }, [activePanel, editingBezierId, brushSettings.mode])

  useEffect(() => {
    if (activePanel === 'brush') {
      setStageCursor(`url('/brush-cursor.svg') 16 16, crosshair`)
    } else if (activePanel === 'bezier') {
      setStageCursor('crosshair')
    } else {
      setStageCursor('default')
    }
    if (activePanel !== 'bezier') {
      setBezierMousePos(null)
      setBezierGuides([])
    }
    if (activePanel !== 'brush') {
      currentBrushItemIdRef.current = null
    } else if (brushSettings.mode === 'paint' && currentBrushItemIdRef.current) {
      const item = itemsRef.current.find((i) => i.id === currentBrushItemIdRef.current)
      if (!item || item.kind !== 'shape' || item.shapeType !== 'freehand') {
        currentBrushItemIdRef.current = null
      }
    }
  }, [activePanel, editingBezierId, brushSettings.mode])

  const getImageDimensions = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal membaca dimensi gambar')) }
    img.src = url
  })

  const processRemoveBg = async () => {
    if (!selectedItem || selectedItem.kind !== 'image') return
    setIsRemoveBgProcessing(true)
    setRemoveBgProgress({ phase: 'loading model', current: 0, total: 0 })
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const imgRes = await fetch(selectedItem.src)
      const imgBlob = await imgRes.blob()
      setRemoveBgProgress({ phase: 'processing', current: 0, total: 1 })
      const resultBlob = await removeBackground(imgBlob, {
        progress: (key, current, total) => {
          if (key === 'model') {
            setRemoveBgProgress({ phase: 'loading model', current, total })
          } else if (key === 'inference') {
            setRemoveBgProgress({ phase: 'processing', current, total })
          }
        },
        model: 'medium',
      })

      // Upload result to server so the URL persists across reloads
      setRemoveBgProgress({ phase: 'uploading', current: 0, total: 100 })
      const file = new File([resultBlob], `remove-bg-${Date.now()}.png`, { type: 'image/png' })
      const dims = await getImageDimensions(file)
      const uploaded = await uploadMediaFile({
        file,
        width: dims.width,
        height: dims.height,
        onProgress: (pct) => setRemoveBgProgress({ phase: 'uploading', current: pct, total: 100 }),
      })

      const url = uploaded.media.url
      const newItem = { ...selectedItem, id: `image-${Date.now()}`, x: selectedItem.x + 30, y: selectedItem.y + 30, src: url }
      setItems((items) => [newItem, ...items])
    } catch (error) {
      console.error('Remove background failed:', error)
    } finally {
      setIsRemoveBgProcessing(false)
      setRemoveBgProgress(null)
    }
  }

  const toggleSelectedCompositeMode = useCallback((mode) => {
    if (!selectedItem || selectedItem.isAdjustmentLayer) return
    updateItem(selectedItem.id, {
      compositeMode: selectedItem.compositeMode === mode ? null : mode,
    })
  }, [selectedItem])

  const applyCompositeGroupMode = useCallback((mode) => {
    const activeIds = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    const compositableIds = activeIds.filter((id) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id)
      return item && !item.isAdjustmentLayer
    })

    if (compositableIds.length <= 1) return

    const groupId = activeGroupId || `group-${Date.now()}`
    const selectedSet = new Set(compositableIds)
    const nextMode = activeCompositeMode === mode ? null : mode

    setItems((current) => {
      const groupMembers = current
        .filter((item) => selectedSet.has(item.id))
        .map((item, index) => ({
          ...item,
          groupId,
          compositeMode: index === 0 ? nextMode : null,
        }))
      if (groupMembers.length < 2) return current

      const rest = current.filter((item) => !selectedSet.has(item.id))
      const firstSelectedIndex = current.findIndex((item) => selectedSet.has(item.id))
      const insertIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : 0
      return [
        ...rest.slice(0, insertIndex),
        ...groupMembers,
        ...rest.slice(insertIndex),
      ]
    })

    setIsGroupSelectMode(false)
    setSelectedIds(compositableIds)
    setSelectedId(compositableIds[compositableIds.length - 1] || null)
    requestAnimationFrame(() => attachTransformer(compositableIds))
  }, [activeCompositeMode, activeGroupId, attachTransformer, selectedId, selectedIds])

  const resizeCanvas = (nextSize, ratio = canvasSettings.ratio) => {
    const previous = { width: canvasSettings.width, height: canvasSettings.height }
    const roundedSize = {
      width: Math.round(nextSize.width),
      height: Math.round(nextSize.height),
    }
    const scale = Math.min(nextSize.width / previous.width, nextSize.height / previous.height)
    const offsetX = (nextSize.width - previous.width * scale) / 2
    const offsetY = (nextSize.height - previous.height * scale) / 2

    setCanvasSettings((current) => ({
      ...current,
      ratio,
      width: roundedSize.width,
      height: roundedSize.height,
    }))
    syncCanvasMetadata({
      ...canvasSettings,
      ratio,
      width: roundedSize.width,
      height: roundedSize.height,
    }).catch((error) => {
      setSaveStatus(error.message || 'Metadata sync failed')
    })

    setItems((current) => current.map((item) => {
      const nextW = Math.max(1, (item.w || 1) * scale)
      const nextH = Math.max(1, (item.h || 1) * scale)
      const nextX = offsetX + (item.x || 0) * scale
      const nextY = offsetY + (item.y || 0) * scale
      const patch = {
        ...item,
        x: clamp(nextX, -nextW + 24, nextSize.width - 24),
        y: clamp(nextY, -nextH + 24, nextSize.height - 24),
        w: nextW,
        h: nextH,
      }

      if (item.kind === 'text') {
        patch.fontSize = clamp((item.fontSize || 48) * scale, 8, 1000)
      }
      if (item.kind === 'shape' && item.shapeTextFontSize) {
        patch.shapeTextFontSize = clamp(item.shapeTextFontSize * scale, 8, 180)
      }
      if (item.kind === 'frame' && item.frameImagePosition) {
        patch.frameImagePosition = {
          x: (item.frameImagePosition.x || 0) * scale,
          y: (item.frameImagePosition.y || 0) * scale,
        }
      }
      if (item.kind === 'frame' && item.frameImages?.length) {
        patch.frameImages = item.frameImages.map((frameImage) => frameImage ? ({
          ...frameImage,
          position: {
            x: (frameImage.position?.x || 0) * scale,
            y: (frameImage.position?.y || 0) * scale,
          },
        }) : frameImage)
      }

      return patch
    }))

    requestAnimationFrame(() => attachTransformer(selectedIds.length ? selectedIds : selectedId))
  }

  const updateCanvasBackground = (patch) => {
    setCanvasSettings((current) => ({
      ...current,
      background: { ...current.background, ...patch },
    }))
  }

  const getItemVisualBounds = (item) => {
    const x = item.x || 0
    const y = item.y || 0
    const w = item.w || 1
    const h = item.h || 1
    const rotation = ((item.rotation || 0) * Math.PI) / 180
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ].map((point) => ({
      x: x + point.x * cos - point.y * sin,
      y: y + point.x * sin + point.y * cos,
    }))
    const left = Math.min(...corners.map((point) => point.x))
    const right = Math.max(...corners.map((point) => point.x))
    const top = Math.min(...corners.map((point) => point.y))
    const bottom = Math.max(...corners.map((point) => point.y))
    const centerX = x + (w / 2) * cos - (h / 2) * sin
    const centerY = y + (w / 2) * sin + (h / 2) * cos

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
      left,
      right,
      top,
      bottom,
      centerX,
      centerY,
    }
  }

  const getItemsVisualBounds = (boundsItems) => {
    if (!boundsItems.length) return null
    const bounds = boundsItems.map(getItemVisualBounds)
    const left = Math.min(...bounds.map((item) => item.left))
    const right = Math.max(...bounds.map((item) => item.right))
    const top = Math.min(...bounds.map((item) => item.top))
    const bottom = Math.max(...bounds.map((item) => item.bottom))
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
      left,
      right,
      top,
      bottom,
      centerX: left + (right - left) / 2,
      centerY: top + (bottom - top) / 2,
    }
  }

  // Drag & drop handler for layers panel
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setItems((current) => {
      const oldIndex = layerEntries.findIndex((entry) => entry.id === active.id)
      const newIndex = layerEntries.findIndex((entry) => entry.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return current

      const byId = new Map(current.map((item) => [item.id, item]))
      const movedEntries = arrayMove(layerEntries, oldIndex, newIndex)
      return movedEntries.flatMap((entry) => {
        if (entry.kind === 'group') {
          return current.filter((item) => item.groupId === entry.groupId)
        }
        const item = byId.get(entry.id)
        return item ? [item] : []
      })
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

  const getInnerMarginGuides = (bounds) => {
    if (!bounds) return []

    const canvasLeft = canvasBounds.x
    const canvasTop = canvasBounds.y
    const canvasRight = canvasBounds.x + canvasBounds.width
    const canvasBottom = canvasBounds.y + canvasBounds.height
    const guides = []

    if (bounds.left <= canvasLeft + marginGuideActivationDistance) {
      guides.push({ axis: 'x', value: canvasLeft + canvasInnerMargin, type: 'margin' })
    }
    if (bounds.right >= canvasRight - marginGuideActivationDistance) {
      guides.push({ axis: 'x', value: canvasRight - canvasInnerMargin, type: 'margin' })
    }
    if (bounds.top <= canvasTop + marginGuideActivationDistance) {
      guides.push({ axis: 'y', value: canvasTop + canvasInnerMargin, type: 'margin' })
    }
    if (bounds.bottom >= canvasBottom - marginGuideActivationDistance) {
      guides.push({ axis: 'y', value: canvasBottom - canvasInnerMargin, type: 'margin' })
    }

    return guides
  }

  const getSnappedDelta = (movingIds, baseBounds, dx, dy) => {
    if (!baseBounds) return { dx, dy, guides: [] }

    const moved = {
      ...baseBounds,
      left: baseBounds.left + dx,
      right: baseBounds.right + dx,
      top: baseBounds.top + dy,
      bottom: baseBounds.bottom + dy,
      centerX: baseBounds.centerX + dx,
      centerY: baseBounds.centerY + dy,
    }
    const marginGuideCandidates = [
      { axis: 'x', value: canvasBounds.x + canvasInnerMargin, type: 'margin' },
      { axis: 'x', value: canvasBounds.x + canvasBounds.width - canvasInnerMargin, type: 'margin' },
      { axis: 'y', value: canvasBounds.y + canvasInnerMargin, type: 'margin' },
      { axis: 'y', value: canvasBounds.y + canvasBounds.height - canvasInnerMargin, type: 'margin' },
    ]
    const guideCandidates = [
      { axis: 'x', value: canvasBounds.x, type: 'edge' },
      { axis: 'x', value: canvasBounds.x + canvasBounds.width, type: 'edge' },
      { axis: 'y', value: canvasBounds.y, type: 'edge' },
      { axis: 'y', value: canvasBounds.y + canvasBounds.height, type: 'edge' },
      { axis: 'x', value: canvasBounds.x + canvasBounds.width / 2, type: 'canvas-center' },
      { axis: 'y', value: canvasBounds.y + canvasBounds.height / 2, type: 'canvas-center' },
      ...marginGuideCandidates,
    ]

    if (canvasSettings.snapToGrid) {
      const verticalCount = Math.max(0, Number(canvasSettings.gridVertical) || 0)
      const horizontalCount = Math.max(0, Number(canvasSettings.gridHorizontal) || 0)
      for (let i = 1; i <= verticalCount; i += 1) {
        guideCandidates.push({ axis: 'x', value: (canvasBounds.width / (verticalCount + 1)) * i, type: 'grid' })
      }
      for (let i = 1; i <= horizontalCount; i += 1) {
        guideCandidates.push({ axis: 'y', value: (canvasBounds.height / (horizontalCount + 1)) * i, type: 'grid' })
      }
    }

    itemsRef.current.forEach((item) => {
      if (movingIds.includes(item.id) || item.visible === false || item.kind === 'connector') return
      const bounds = getItemVisualBounds(item)
      const left = bounds.left
      const top = bounds.top
      const right = bounds.right
      const bottom = bounds.bottom
      guideCandidates.push(
        { axis: 'x', value: left, type: 'object' },
        { axis: 'x', value: bounds.centerX, type: 'object' },
        { axis: 'x', value: right, type: 'object' },
        { axis: 'y', value: top, type: 'object' },
        { axis: 'y', value: bounds.centerY, type: 'object' },
        { axis: 'y', value: bottom, type: 'object' },
      )
    })

    let snappedDx = dx
    let snappedDy = dy
    const guides = []
    const movingXPoints = [
      { key: 'left', value: moved.left },
      { key: 'centerX', value: moved.centerX },
      { key: 'right', value: moved.right },
    ]
    const movingYPoints = [
      { key: 'top', value: moved.top },
      { key: 'centerY', value: moved.centerY },
      { key: 'bottom', value: moved.bottom },
    ]

    const getGuideTolerance = (guide) => {
      const scale = Math.max(0.1, cameraRef.current?.scale || 1)
      if (guide.type === 'edge') return edgeSnapTolerance / scale
      if (guide.type === 'margin') return marginSnapTolerance / scale
      return snapTolerance / scale
    }
    const getGuidePoints = (guide, points) => guide.type === 'margin'
      ? points.filter((point) => !point.key.includes('center'))
      : points

    const bestX = guideCandidates
      .filter((guide) => guide.axis === 'x')
      .flatMap((guide) => getGuidePoints(guide, movingXPoints).map((point) => ({ guide, point, diff: guide.value - point.value })))
      .filter((candidate) => Math.abs(candidate.diff) <= getGuideTolerance(candidate.guide))
      .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0]
    const bestY = guideCandidates
      .filter((guide) => guide.axis === 'y')
      .flatMap((guide) => getGuidePoints(guide, movingYPoints).map((point) => ({ guide, point, diff: guide.value - point.value })))
      .filter((candidate) => Math.abs(candidate.diff) <= getGuideTolerance(candidate.guide))
      .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0]

    if (bestX) {
      snappedDx += bestX.diff
      guides.push({ axis: 'x', value: bestX.guide.value, type: bestX.guide.type })
    }
    if (bestY) {
      snappedDy += bestY.diff
      guides.push({ axis: 'y', value: bestY.guide.value, type: bestY.guide.type })
    }

    const snappedBounds = {
      ...moved,
      left: baseBounds.left + snappedDx,
      right: baseBounds.right + snappedDx,
      top: baseBounds.top + snappedDy,
      bottom: baseBounds.bottom + snappedDy,
    }

    const nextGuides = [...guides, ...getInnerMarginGuides(snappedBounds)]
    const uniqueGuides = nextGuides.filter((guide, index, allGuides) => (
      allGuides.findIndex((candidate) => (
        candidate.axis === guide.axis &&
        candidate.value === guide.value &&
        candidate.type === guide.type
      )) === index
    ))

    return { dx: snappedDx, dy: snappedDy, guides: uniqueGuides, snapped: !!(bestX || bestY) }
  }

  const getResizeSnapCandidates = (activeIds = []) => {
    const candidates = [
      { axis: 'x', value: canvasBounds.x, type: 'edge' },
      { axis: 'x', value: canvasBounds.x + canvasBounds.width, type: 'edge' },
      { axis: 'y', value: canvasBounds.y, type: 'edge' },
      { axis: 'y', value: canvasBounds.y + canvasBounds.height, type: 'edge' },
      { axis: 'x', value: canvasBounds.x + canvasBounds.width / 2, type: 'canvas-center' },
      { axis: 'y', value: canvasBounds.y + canvasBounds.height / 2, type: 'canvas-center' },
      { axis: 'x', value: canvasBounds.x + canvasInnerMargin, type: 'margin' },
      { axis: 'x', value: canvasBounds.x + canvasBounds.width - canvasInnerMargin, type: 'margin' },
      { axis: 'y', value: canvasBounds.y + canvasInnerMargin, type: 'margin' },
      { axis: 'y', value: canvasBounds.y + canvasBounds.height - canvasInnerMargin, type: 'margin' },
    ]

    if (canvasSettings.snapToGrid) {
      const verticalCount = Math.max(0, Number(canvasSettings.gridVertical) || 0)
      const horizontalCount = Math.max(0, Number(canvasSettings.gridHorizontal) || 0)
      for (let i = 1; i <= verticalCount; i += 1) {
        candidates.push({ axis: 'x', value: (canvasBounds.width / (verticalCount + 1)) * i, type: 'grid' })
      }
      for (let i = 1; i <= horizontalCount; i += 1) {
        candidates.push({ axis: 'y', value: (canvasBounds.height / (horizontalCount + 1)) * i, type: 'grid' })
      }
    }

    itemsRef.current.forEach((item) => {
      if (activeIds.includes(item.id) || item.visible === false || item.kind === 'connector') return
      const left = item.x || 0
      const top = item.y || 0
      const right = left + (item.w || 1)
      const bottom = top + (item.h || 1)
      candidates.push(
        { axis: 'x', value: left, type: 'object' },
        { axis: 'x', value: left + (right - left) / 2, type: 'object' },
        { axis: 'x', value: right, type: 'object' },
        { axis: 'y', value: top, type: 'object' },
        { axis: 'y', value: top + (bottom - top) / 2, type: 'object' },
        { axis: 'y', value: bottom, type: 'object' },
      )
    })

    return candidates
  }

  const snapResizeBox = (oldBox, newBox) => {
    const anchor = transformerRef.current?.getActiveAnchor?.()
    if (!anchor) return { box: newBox, guides: [] }

    const activeIds = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    const candidates = getResizeSnapCandidates(activeIds)
    const activeItems = itemsRef.current.filter((item) => activeIds.includes(item.id))
    const activeBounds = getItemsBounds(activeItems)
    const currentCamera = cameraRef.current
    const expectedScreenX = activeBounds ? currentCamera.x + activeBounds.left * currentCamera.scale : oldBox.x
    const expectedWorldX = activeBounds?.left ?? oldBox.x
    const boxUsesScreenCoords = Math.abs(oldBox.x - expectedScreenX) < Math.abs(oldBox.x - expectedWorldX)
    const toBoxValue = (axis, value) => (
      boxUsesScreenCoords
        ? (axis === 'x' ? currentCamera.x + value * currentCamera.scale : currentCamera.y + value * currentCamera.scale)
        : value
    )
    const toBoxTolerance = (tolerance) => (
      boxUsesScreenCoords ? Math.max(4, tolerance * currentCamera.scale) : tolerance
    )
    const edges = []
    if (anchor.includes('left')) edges.push({ axis: 'x', edge: 'left', value: newBox.x })
    if (anchor.includes('right')) edges.push({ axis: 'x', edge: 'right', value: newBox.x + newBox.width })
    if (anchor.includes('top')) edges.push({ axis: 'y', edge: 'top', value: newBox.y })
    if (anchor.includes('bottom')) edges.push({ axis: 'y', edge: 'bottom', value: newBox.y + newBox.height })

    let box = { ...newBox }
    const guides = []

    edges.forEach((edge) => {
      const best = candidates
        .filter((candidate) => candidate.axis === edge.axis)
        .map((candidate) => ({ candidate, diff: toBoxValue(candidate.axis, candidate.value) - edge.value }))
        .filter(({ candidate, diff }) => Math.abs(diff) <= toBoxTolerance(candidate.type === 'edge' ? edgeSnapTolerance : candidate.type === 'margin' ? marginSnapTolerance : snapTolerance))
        .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0]

      if (!best) return

      if (edge.axis === 'x') {
        if (edge.edge === 'left') {
          box.x += best.diff
          box.width -= best.diff
        } else {
          box.width += best.diff
        }
      } else if (edge.edge === 'top') {
        box.y += best.diff
        box.height -= best.diff
      } else {
        box.height += best.diff
      }

      guides.push({ axis: edge.axis, value: best.candidate.value, type: best.candidate.type })
    })

    return {
      box,
      guides: guides.filter((guide, index, allGuides) => (
        allGuides.findIndex((candidate) => (
          candidate.axis === guide.axis &&
          candidate.value === guide.value &&
          candidate.type === guide.type
        )) === index
      )),
    }
  }

  const getViewportCenterWorld = () => getWorldPointFromViewport({
    x: viewportSize.width / 2,
    y: viewportSize.height / 2,
  }, cameraRef.current)

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

  const getNaturalImageSize = (src) => new Promise((resolve) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve({
      width: image.naturalWidth || image.width || 1,
      height: image.naturalHeight || image.height || 1,
    })
    image.onerror = () => resolve({ width: 1, height: 1 })
    image.src = src
  })

  const beginImageCrop = (itemId = selectedId) => {
    const item = itemsRef.current.find((candidate) => candidate.id === itemId)
    if (!item || item.kind !== 'image') return
    selectItem(item.id)
    setCropSession({
      itemId: item.id,
      originalItem: { ...item },
      preset: 'free',
      box: { x: 0, y: 0, w: item.w, h: item.h },
      imageSize: { w: item.w, h: item.h },
      cropOffset: { x: 0, y: 0 },
    })
    setIsRightPanelOpen(true)
    setActivePanel(null)
    closeAllMenus()
  }

  const cancelImageCrop = () => {
    setCropSession(null)
    setStageCursor('default')
  }

  const updateCropBox = (updater) => {
    setCropSession((current) => {
      if (!current) return current
      const item = itemsRef.current.find((candidate) => candidate.id === current.itemId)
      if (!item) return current
      const preset = cropPresets.find((candidate) => candidate.id === current.preset)
      const ratio = preset?.ratio === 'original' ? item.w / item.h : preset?.ratio
      const imageSize = current.imageSize || { w: item.w, h: item.h }
      const cropOffset = current.cropOffset || { x: 0, y: 0 }
      const nextBox = typeof updater === 'function' ? updater(current.box, item, ratio, cropOffset, imageSize) : updater
      const box = clampCropBoxToImage(nextBox, item, cropOffset, imageSize, ratio)
      return {
        ...current,
        box,
        cropOffset: {
          x: clamp(cropOffset.x, box.x + box.w - imageSize.w, box.x),
          y: clamp(cropOffset.y, box.y + box.h - imageSize.h, box.y),
        },
      }
    })
  }

  const updateCropOffset = (updater) => {
    setCropSession((current) => {
      if (!current) return current
      const nextCropOffset = typeof updater === 'function'
        ? updater(current.cropOffset || { x: 0, y: 0 }, current.box, current.imageSize)
        : updater
      return { ...current, cropOffset: nextCropOffset }
    })
  }

  const setCropPreset = (presetId) => {
    setCropSession((current) => {
      if (!current) return current
      const item = itemsRef.current.find((candidate) => candidate.id === current.itemId)
      if (!item) return current
      const preset = cropPresets.find((candidate) => candidate.id === presetId) || cropPresets[0]
      const ratio = preset.ratio === 'original' ? item.w / item.h : preset.ratio
      const imageSize = current.imageSize || { w: item.w, h: item.h }
      const cropOffset = current.cropOffset || { x: 0, y: 0 }
      const box = clampCropBoxToImage(current.box, item, cropOffset, imageSize, ratio)
      return {
        ...current,
        preset: preset.id,
        box,
      }
    })
  }

  const applyImageCrop = async () => {
    const session = cropSession
    if (!session) return
    const item = itemsRef.current.find((candidate) => candidate.id === session.itemId)
    if (!item || item.kind !== 'image') {
      setCropSession(null)
      return
    }

    const naturalSize = await getNaturalImageSize(item.src)
    const baseRect = item.imageCropRect || {
      x: 0,
      y: 0,
      width: item.cropSourceWidth || naturalSize.width,
      height: item.cropSourceHeight || naturalSize.height,
    }
    const imageSize = session.imageSize || { w: item.w, h: item.h }
    const cropOffset = session.cropOffset || { x: 0, y: 0 }
    const cropRect = {
      x: baseRect.x + ((session.box.x - cropOffset.x) / imageSize.w) * baseRect.width,
      y: baseRect.y + ((session.box.y - cropOffset.y) / imageSize.h) * baseRect.height,
      width: (session.box.w / imageSize.w) * baseRect.width,
      height: (session.box.h / imageSize.h) * baseRect.height,
    }

    const rotation = ((item.rotation || 0) * Math.PI) / 180
    const offsetX = session.box.x * Math.cos(rotation) - session.box.y * Math.sin(rotation)
    const offsetY = session.box.x * Math.sin(rotation) + session.box.y * Math.cos(rotation)

    updateItem(item.id, {
      x: item.x + offsetX,
      y: item.y + offsetY,
      w: session.box.w,
      h: session.box.h,
      aspectRatio: session.box.w / session.box.h,
      imageCropRect: cropRect,
      cropSourceWidth: item.cropSourceWidth || naturalSize.width,
      cropSourceHeight: item.cropSourceHeight || naturalSize.height,
      cropEnabled: false,
    })
    setCropSession(null)
    setStageCursor('default')
    requestAnimationFrame(() => attachTransformer(item.id))
  }

  const resizeCropBoxFromHandle = (anchor, point) => {
    updateCropBox((box, item, ratio, cropOffset, imageSize) => {
      const minSize = 24
      let left = box.x
      let top = box.y
      let right = box.x + box.w
      let bottom = box.y + box.h
      const imageLeft = cropOffset.x
      const imageTop = cropOffset.y
      const imageRight = cropOffset.x + imageSize.w
      const imageBottom = cropOffset.y + imageSize.h

      if (anchor.includes('left')) left = clamp(point.x, imageLeft, right - minSize)
      if (anchor.includes('right')) right = clamp(point.x, left + minSize, imageRight)
      if (anchor.includes('top')) top = clamp(point.y, imageTop, bottom - minSize)
      if (anchor.includes('bottom')) bottom = clamp(point.y, top + minSize, imageBottom)

      let next = { x: left, y: top, w: right - left, h: bottom - top }
      if (ratio) {
        const widthDriven = anchor.includes('left') || anchor.includes('right')
        if (widthDriven) {
          next.h = next.w / ratio
          if (anchor.includes('top')) next.y = bottom - next.h
        } else {
          next.w = next.h * ratio
          if (anchor.includes('left')) next.x = right - next.w
        }
      }
      return next
    })
  }

  const renderCropOverlay = () => {
    if (!cropSession) return null
    const item = items.find((candidate) => candidate.id === cropSession.itemId)
    if (!item) return null
    const box = cropSession.box
    const imageSize = cropSession.imageSize || { w: item.w, h: item.h }
    const cropOffset = cropSession.cropOffset || { x: 0, y: 0 }
    const baseCrop = item.imageCropRect ? {
      x: item.imageCropRect.x || 0,
      y: item.imageCropRect.y || 0,
      width: item.imageCropRect.width || item.cropSourceWidth || cropOverlayImage?.naturalWidth || item.w,
      height: item.imageCropRect.height || item.cropSourceHeight || cropOverlayImage?.naturalHeight || item.h,
    } : undefined
    const boundImageBox = (next) => {
      const minX = box.x + box.w - imageSize.w
      const maxX = box.x
      const minY = box.y + box.h - imageSize.h
      const maxY = box.y
      return {
        x: clamp(next.x, minX, maxX),
        y: clamp(next.y, minY, maxY),
      }
    }
    const boundCropHandle = (anchor, localPosition) => {
      const minSize = 24
      const imageLeft = Math.max(0, cropOffset.x)
      const imageTop = Math.max(0, cropOffset.y)
      const imageRight = Math.min(item.w, cropOffset.x + imageSize.w)
      const imageBottom = Math.min(item.h, cropOffset.y + imageSize.h)
      let x = localPosition.x + 5
      let y = localPosition.y + 5

      if (anchor.includes('left')) x = clamp(x, imageLeft, box.x + box.w - minSize)
      else if (anchor.includes('right')) x = clamp(x, box.x + minSize, imageRight)
      else x = box.x + box.w / 2

      if (anchor.includes('top')) y = clamp(y, imageTop, box.y + box.h - minSize)
      else if (anchor.includes('bottom')) y = clamp(y, box.y + minSize, imageBottom)
      else y = box.y + box.h / 2

      return { x: x - 5, y: y - 5 }
    }
    const handles = [
      ['top-left', box.x, box.y],
      ['top', box.x + box.w / 2, box.y],
      ['top-right', box.x + box.w, box.y],
      ['right', box.x + box.w, box.y + box.h / 2],
      ['bottom-right', box.x + box.w, box.y + box.h],
      ['bottom', box.x + box.w / 2, box.y + box.h],
      ['bottom-left', box.x, box.y + box.h],
      ['left', box.x, box.y + box.h / 2],
    ]

    return (
      <Group x={item.x} y={item.y} rotation={item.rotation || 0} name="crop-overlay">
        <Rect
          x={virtualWorkspace.x - item.x}
          y={virtualWorkspace.y - item.y}
          width={virtualWorkspace.width}
          height={Math.max(0, item.y - virtualWorkspace.y)}
          fill="rgba(0,0,0,0.38)"
          listening={false}
        />
        <Rect
          x={virtualWorkspace.x - item.x}
          y={item.h}
          width={virtualWorkspace.width}
          height={Math.max(0, virtualWorkspace.y + virtualWorkspace.height - (item.y + item.h))}
          fill="rgba(0,0,0,0.38)"
          listening={false}
        />
        <Rect
          x={virtualWorkspace.x - item.x}
          y={0}
          width={Math.max(0, item.x - virtualWorkspace.x)}
          height={item.h}
          fill="rgba(0,0,0,0.38)"
          listening={false}
        />
        <Rect
          x={item.w}
          y={0}
          width={Math.max(0, virtualWorkspace.x + virtualWorkspace.width - (item.x + item.w))}
          height={item.h}
          fill="rgba(0,0,0,0.38)"
          listening={false}
        />
        {cropOverlayImage && (
          <KonvaImage
            image={cropOverlayImage}
            x={cropOffset.x}
            y={cropOffset.y}
            width={imageSize.w}
            height={imageSize.h}
            crop={baseCrop}
            opacity={1}
            draggable
            onMouseEnter={() => setStageCursor('grab')}
            onMouseLeave={() => setStageCursor('default')}
            onMouseDown={(event) => {
              event.cancelBubble = true
              setStageCursor('grabbing')
            }}
            onDragStart={(event) => {
              event.cancelBubble = true
              setStageCursor('grabbing')
            }}
            onDragMove={(event) => {
              event.cancelBubble = true
              const next = boundImageBox({ x: event.target.x(), y: event.target.y() })
              event.target.position(next)
              updateCropOffset(next)
            }}
            onDragEnd={(event) => {
              event.cancelBubble = true
              const next = boundImageBox({ x: event.target.x(), y: event.target.y() })
              updateCropOffset(next)
              setStageCursor('grab')
            }}
          />
        )}
        <Rect x={0} y={0} width={item.w} height={box.y} fill="rgba(0,0,0,0.5)" listening={false} />
        <Rect x={0} y={box.y + box.h} width={item.w} height={item.h - (box.y + box.h)} fill="rgba(0,0,0,0.5)" listening={false} />
        <Rect x={0} y={box.y} width={box.x} height={box.h} fill="rgba(0,0,0,0.5)" listening={false} />
        <Rect x={box.x + box.w} y={box.y} width={item.w - (box.x + box.w)} height={box.h} fill="rgba(0,0,0,0.5)" listening={false} />
        <Rect
          x={box.x}
          y={box.y}
          width={box.w}
          height={box.h}
          stroke="#ffffff"
          strokeWidth={1.5}
          dash={[8, 6]}
          listening={false}
        />
        {handles.map(([anchor, x, y]) => (
          <Rect
            key={anchor}
            x={x - 5}
            y={y - 5}
            width={10}
            height={10}
            fill="#ffffff"
            stroke="#7c3aed"
            strokeWidth={1}
            draggable
            onMouseDown={(event) => { event.cancelBubble = true }}
            onDragMove={(event) => {
              event.cancelBubble = true
              const bounded = boundCropHandle(anchor, event.target.position())
              event.target.position(bounded)
              resizeCropBoxFromHandle(anchor, {
                x: bounded.x + 5,
                y: bounded.y + 5,
              })
            }}
            onDragEnd={(event) => {
              event.cancelBubble = true
              const bounded = boundCropHandle(anchor, event.target.position())
              event.target.position(bounded)
              resizeCropBoxFromHandle(anchor, {
                x: bounded.x + 5,
                y: bounded.y + 5,
              })
            }}
          />
        ))}
      </Group>
    )
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
      effects: getDefaultEffects(),
    }

    const nextItem = asset.type === 'image'
      ? { ...base, kind: 'image', src: asset.source, radius: 0, aspectRatio: imageSize.aspectRatio, lockAspectRatio: true }
      : asset.type === 'text'
        ? { ...base, kind: 'text', text: asset.text, fontSize: 72, fill: '#2b2830', isBold: true, isItalic: false, isUnderline: false, fontFamily: 'Inter, Arial' }
        : { ...base, kind: 'note', text: asset.text, fill: '#f5d56b' }

    return nextItem
  }

  const addAssetToCanvas = async (asset, position) => {
    const nextItem = await createCanvasItemFromAsset(asset, position)
    registerAssetContext(asset)
    logCanvasDropInterest(asset)

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
    setItems((current) => [{ id, kind: 'note', text: 'New research note', x: position.x, y: position.y, w: 170, h: 120, fill: '#f4c2d7', rotation: -2, effects: getDefaultEffects() }, ...current])
  }

  const addShapeToCanvas = (shapeData) => {
    const id = getNextItemId('shape')
    const defaultProps = shapeData.defaultProps || {}
    const sanitizeSize = (nextSize) => ({
      w: Math.max(40, Number(nextSize.w) || 120),
      h: Math.max(40, Number(nextSize.h) || 120),
    })

    const viewportCenter = {
      x: (viewportSize.width / 2 - camera.x) / (camera.scale || 1),
      y: (viewportSize.height / 2 - camera.y) / (camera.scale || 1),
    }

    // Calculate size based on shape type
    let size = { w: 120, h: 120 }
    if (shapeData.shapeType === 'line') {
      const points = defaultProps.points || [0, 0, 150, 0]
      size = { w: Math.abs(points[2] - points[0]) || 150, h: Math.abs(points[3] - points[1]) || 4 }
    } else if (shapeData.shapeType === 'arrow') {
      const points = defaultProps.points || [0, 0, 150, 0]
      size = { w: Math.abs(points[2] - points[0]) || 150, h: Math.abs(points[3] - points[1]) || 4 }
    } else if (shapeData.shapeType === 'arrow-shape') {
      size = { w: defaultProps.width || 160, h: defaultProps.height || 72 }
    } else if (shapeData.shapeType === 'circle') {
      const radius = defaultProps.radius || 60
      size = { w: radius * 2, h: radius * 2 }
    } else if (shapeData.shapeType === 'ellipse') {
      const radiusX = defaultProps.radiusX || 80
      const radiusY = defaultProps.radiusY || 50
      size = { w: radiusX * 2, h: radiusY * 2 }
    } else if (shapeData.shapeType === 'polygon') {
      const radius = defaultProps.radius || 60
      size = { w: radius * 2, h: radius * 2 }
    } else if (shapeData.shapeType === 'star') {
      const outerRadius = defaultProps.outerRadius || 60
      size = { w: outerRadius * 2, h: outerRadius * 2 }
    } else if (shapeData.shapeType === 'rect') {
      size = { w: defaultProps.width || 150, h: defaultProps.height || 100 }
    }
    size = sanitizeSize(size)

    const position = {
      x: clamp(viewportCenter.x - size.w / 2, canvasBounds.x, canvasBounds.x + Math.max(0, canvasBounds.width - size.w)),
      y: clamp(viewportCenter.y - size.h / 2, canvasBounds.y, canvasBounds.y + Math.max(0, canvasBounds.height - size.h)),
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
      scaleX: 1,
      scaleY: 1,
      shapeAspectRatio: size.w / size.h,
      rotation: defaultProps.rotation || 0,
      effects: getDefaultEffects(),
      // Store additional shape-specific props
      ...defaultProps,
      fill: defaultProps.fill || '#a78bfa',
      stroke: defaultProps.stroke ?? '#3f3a46',
      strokeWidth: defaultProps.strokeWidth ?? 0,
      gradientType: defaultProps.gradientType || 'solid',
      gradientStops: defaultProps.gradientStops || null,
      gradientAngle: defaultProps.gradientAngle || 90,
      shapeText: '',
      shapeTextAlign: 'center',
      shapeTextFill: '#231c2f',
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
      effects: getDefaultEffects(),
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
  const addImageToFrame = async (frameId, imageSrc, slotIndex = null, options = {}) => {
    const frame = items.find(item => item.id === frameId)
    if (!frame || frame.kind !== 'frame') return

    await getImageMetadata(imageSrc)
    if (options.asset) {
      registerAssetContext(options.asset)
      logCanvasDropInterest(options.asset)
    }

    let patch
    if (isGridFrame(frame.frameType)) {
      const slots = getResolvedFrameSlots(frame)
      const currentImages = frame.frameImages || []
      let targetSlot = slotIndex

      if (targetSlot === null) {
        for (let i = 0; i < slots.length; i++) {
          if (!currentImages[i]?.src) {
            targetSlot = i
            break
          }
        }
        if (targetSlot === null) return
      }

      const canReplaceSlot = options.replace || (editingFrameId === frameId && editingFrameSlot === targetSlot)
      if (currentImages[targetSlot]?.src && !canReplaceSlot) return

      const newFrameImages = [...(currentImages)]
      newFrameImages[targetSlot] = {
        src: imageSrc,
        position: { x: 0, y: 0 },
        scale: 1,
        fit: 'cover',
      }

      patch = { frameImages: newFrameImages }
    } else {
      const canReplaceFrame = options.replace || editingFrameId === frameId
      if (frame.frameImageSrc && !canReplaceFrame) return

      patch = {
        frameImageSrc: imageSrc,
        frameImageScale: 1,
        frameImagePosition: { x: 0, y: 0 },
        frameImageFit: 'cover',
      }
    }

    const removeId = options.removeItemId
    setItems((current) => {
      let next = current.map((item) => (item.id === frameId ? { ...item, ...patch } : item))
      if (removeId) next = next.filter((i) => i.id !== removeId)
      return next
    })

    requestAnimationFrame(() => {
      const layer = stageRef.current?.findOne('Layer')
      layer?.batchDraw()
    })
  }

  const frameHasImages = (frame) => (
    frame?.kind === 'frame' && (
      isGridFrame(frame.frameType)
        ? !!frame.frameImages?.some((image) => image?.src)
        : !!frame.frameImageSrc
    )
  )

  const detachFrameImages = async (frameId = selectedId) => {
    const frame = itemsRef.current.find((item) => item.id === frameId)
    if (!frameHasImages(frame)) return

    const slots = getResolvedFrameSlots(frame)
    const filledSlots = isGridFrame(frame.frameType)
      ? slots
        .map((slot) => ({ slot, src: frame.frameImages?.[slot.slotIndex]?.src }))
        .filter((entry) => entry.src)
      : [{ slot: slots[0], src: frame.frameImageSrc }]
    const rotation = ((frame.rotation || 0) * Math.PI) / 180
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    const detachedImages = await Promise.all(filledSlots.map(async ({ slot, src }) => {
      const metadata = await getImageMetadata(src)
      const fitScale = Math.min(slot.width / metadata.w, slot.height / metadata.h)
      const w = Math.max(24, metadata.w * fitScale)
      const h = Math.max(24, metadata.h * fitScale)
      const localCenter = {
        x: slot.x + slot.width / 2,
        y: slot.y + slot.height / 2,
      }
      const worldCenter = {
        x: frame.x + localCenter.x * cos - localCenter.y * sin,
        y: frame.y + localCenter.x * sin + localCenter.y * cos,
      }
      const rotatedHalfSize = {
        x: (w / 2) * cos - (h / 2) * sin,
        y: (w / 2) * sin + (h / 2) * cos,
      }

      return {
        id: getNextItemId('image'),
        kind: 'image',
        src,
        x: worldCenter.x - rotatedHalfSize.x,
        y: worldCenter.y - rotatedHalfSize.y,
        w,
        h,
        rotation: frame.rotation || 0,
        radius: 0,
        aspectRatio: metadata.aspectRatio,
        effects: getDefaultEffects(),
      }
    }))

    const patch = isGridFrame(frame.frameType)
      ? { frameImages: slots.map(() => null) }
      : {
        frameImage: null,
        frameImageSrc: null,
        frameImageFit: 'cover',
        frameImagePosition: { x: 0, y: 0 },
        frameImageScale: 1,
      }
    const detachedIds = detachedImages.map((image) => image.id)

    setItems((current) => [
      ...detachedImages,
      ...current.map((item) => (item.id === frame.id ? { ...item, ...patch } : item)),
    ])
    setEditingFrameId(null)
    setEditingFrameSlot(0)
    setSelectedIds(detachedIds)
    setSelectedId(detachedIds[detachedIds.length - 1] || null)
    setIsGroupSelectMode(false)
    requestAnimationFrame(() => attachTransformer(detachedIds))
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
      effects: getDefaultEffects(),
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

  const beginConnectorDrag = (event, fromId, fromAnchor, sourceType = 'object') => {
    event.cancelBubble = true
    const item = itemsRef.current.find((candidate) => candidate.id === fromId)
    if (!item) return

    const start = sourceType === 'connector'
      ? resolveConnectorEndpointPoint(item, fromAnchor, itemsRef.current)
      : getItemAnchorPoint(item, fromAnchor)
    setConnectorDraft({
      fromId: sourceType === 'object' ? fromId : null,
      fromAnchor: sourceType === 'object' ? fromAnchor : null,
      fromPoint: start,
      fromConnectorId: sourceType === 'connector' ? fromId : null,
      fromConnectorEndpoint: sourceType === 'connector' ? fromAnchor : null,
      point: start,
      ...(connectorTool || connectorPresets[0]),
    })
    setSelectedId(fromId)
    setSelectedIds([fromId])
    attachTransformer(fromId)
    setStageCursor('crosshair')
  }

  const updateConnectorDraft = () => {
    if (!connectorDraft) return

    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return

    setConnectorDraft((current) => (
      current ? { ...current, point: getWorldPointFromViewport(pointer, cameraRef.current) } : current
    ))
  }

  const getConnectableItemAtPosition = (position, excludeId = null) => {
    if (!position) return null

    return itemsRef.current.find((item) => (
      item.kind !== 'connector' &&
      item.id !== excludeId &&
      item.visible !== false &&
      !item.locked &&
      position.x >= item.x &&
      position.x <= item.x + item.w &&
      position.y >= item.y &&
      position.y <= item.y + item.h
    )) || null
  }

  const getConnectorEndpointAtPosition = (position, excludeId = null) => {
    if (!position) return null

    const hitRadius = 12
    for (const connector of itemsRef.current) {
      if (connector.kind !== 'connector' || connector.id === excludeId || connector.visible === false) continue

      for (const endpoint of ['from', 'to']) {
        const point = resolveConnectorEndpointPoint(connector, endpoint, itemsRef.current)
        if (Math.hypot(position.x - point.x, position.y - point.y) <= hitRadius) {
          return { connectorId: connector.id, endpoint }
        }
      }
    }

    return null
  }

  const getConnectorDraftStartPoint = (draft) => {
    if (!draft) return null
    if (draft.fromConnectorId && draft.fromConnectorEndpoint) {
      const sourceConnector = itemsRef.current.find((item) => item.id === draft.fromConnectorId && item.kind === 'connector')
      if (sourceConnector) {
        return resolveConnectorEndpointPoint(sourceConnector, draft.fromConnectorEndpoint, itemsRef.current)
      }
    }
    if (draft.fromId && draft.fromAnchor) {
      const sourceItem = itemsRef.current.find((item) => item.id === draft.fromId)
      if (sourceItem) return getItemAnchorPoint(sourceItem, draft.fromAnchor)
    }
    return draft.fromPoint || draft.point || null
  }

  const beginFreeConnectorDrag = (event) => {
    if (!connectorTool) return false
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return false

    const point = getWorldPointFromViewport(pointer, cameraRef.current)
    setConnectorDraft({
      fromId: null,
      fromAnchor: null,
      fromPoint: point,
      point,
      startedFromCanvas: true,
      ...connectorTool,
    })
    attachTransformer(null)
    setStageCursor('crosshair')
    event.evt.preventDefault()
    return true
  }

  const finishConnectorDrag = (event, toId = null, toAnchor = null, targetType = 'object') => {
    if (event) event.cancelBubble = true
    if (!connectorDraft) return

    const pointer = stageRef.current?.getPointerPosition()
    const pointerWorld = pointer ? getWorldPointFromViewport(pointer, cameraRef.current) : null
    const connectorHit = targetType === 'connector'
      ? { connectorId: toId, endpoint: toAnchor }
      : getConnectorEndpointAtPosition(pointerWorld, connectorDraft.fromConnectorId)
    const fallbackTarget = !toId && !connectorHit ? getConnectableItemAtPosition(pointerWorld, connectorDraft.fromId) : null
    const toItem = targetType === 'object' && toId
      ? itemsRef.current.find((item) => item.id === toId)
      : fallbackTarget
    const toPoint = pointerWorld || connectorDraft.point || connectorDraft.fromPoint
    const fromPoint = getConnectorDraftStartPoint(connectorDraft)

    if (!toItem && !connectorHit && fromPoint && Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y) < 8) {
      setConnectorDraft(null)
      setConnectorTool(null)
      setStageCursor('default')
      return
    }

    if (toItem && toItem.id === connectorDraft.fromId) {
      setConnectorDraft(null)
      setStageCursor('default')
      return
    }

    const id = getNextItemId('connector')
    const fromItem = connectorDraft.fromId ? itemsRef.current.find((item) => item.id === connectorDraft.fromId) : null
    const fallbackAnchors = fromItem && toItem ? getBestConnectorAnchors(fromItem, toItem) : null
    const resolvedToAnchor = toAnchor || fallbackAnchors?.toAnchor || (toItem ? getClosestAnchorToPoint(toItem, fromPoint || toPoint) : null)
    const newConnector = {
      id,
      kind: 'connector',
      fromId: connectorDraft.fromId,
      toId: toItem?.id || null,
      fromAnchor: connectorDraft.fromAnchor || fallbackAnchors?.fromAnchor || null,
      toAnchor: resolvedToAnchor,
      fromPoint: fromPoint || connectorDraft.fromPoint,
      toPoint: toItem || connectorHit ? null : toPoint,
      fromConnectorId: connectorDraft.fromConnectorId || null,
      fromConnectorEndpoint: connectorDraft.fromConnectorEndpoint || null,
      toConnectorId: connectorHit?.connectorId || null,
      toConnectorEndpoint: connectorHit?.endpoint || null,
      pathType: connectorDraft.pathType || 'straight',
      arrowHead: !!connectorDraft.arrowHead,
      stroke: '#7c6df2',
      strokeWidth: 3,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      rotation: 0,
      effects: getDefaultEffects(),
    }

    pendingSelectIdRef.current = id
    justDroppedIdRef.current = id
    setItems((current) => [newConnector, ...current])
    setConnectorDraft(null)
    setStageCursor('default')
  }

  const getEventCanvasPosition = (clientX, clientY) => {
    const stage = stageRef.current
    if (!stage) return null
    const rect = stage.container().getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    return getWorldPointFromViewport({ x, y }, cameraRef.current)
  }

  const getCanvasDropPosition = (event) => {
    return getEventCanvasPosition(event.clientX, event.clientY)
  }

  const getTouchCanvasPosition = (touch) => {
    if (!touch) return null
    return getEventCanvasPosition(touch.clientX, touch.clientY)
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

  const getGridSlotIndexAtPosition = (frame, point) => {
    if (!isGridFrame(frame.frameType)) return null

    const localPoint = getFrameLocalPoint(frame, point)
    const slot = getResolvedFrameSlots(frame).find((candidate) => (
      localPoint.x >= candidate.x &&
      localPoint.x <= candidate.x + candidate.width &&
      localPoint.y >= candidate.y &&
      localPoint.y <= candidate.y + candidate.height
    ))

    return slot?.slotIndex ?? null
  }

  const canAddImageToFrameSlot = (frame, slotIndex) => {
    if (!isGridFrame(frame.frameType)) {
      const hasImage = !!frame.frameImageSrc
      const isReplacingActiveFrame = editingFrameId === frame.id
      return !hasImage || isReplacingActiveFrame
    }
    if (slotIndex === null || slotIndex === undefined) return true

    const hasImage = !!frame.frameImages?.[slotIndex]?.src
    const isReplacingActiveSlot = editingFrameId === frame.id && editingFrameSlot === slotIndex
    return !hasImage || isReplacingActiveSlot
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
    let frame = asset?.type === 'image' ? getFrameAtDropPosition(position) : null
    let hoverSlotIndex = null
    let blockedFrameDrop = false

    if (frame && isGridFrame(frame.frameType) && position) {
      hoverSlotIndex = getGridSlotIndexAtPosition(frame, position)
      if (hoverSlotIndex === null || !canAddImageToFrameSlot(frame, hoverSlotIndex)) {
        blockedFrameDrop = true
        frame = null
      }
    } else if (frame && !canAddImageToFrameSlot(frame, null)) {
      blockedFrameDrop = true
      frame = null
    }
 
    event.dataTransfer.dropEffect = blockedFrameDrop ? 'none' : 'copy'
    setDropTargetFrameId((current) => (current === frame?.id ? current : frame?.id || null))
 
    // NEW: compute which slot is being hovered for grid frames
    if (frame && isGridFrame(frame.frameType) && position) {
      setDropTargetSlotIndex(hoverSlotIndex)
    } else {
      setDropTargetSlotIndex(null)
    }
 
    setStageCursor(blockedFrameDrop ? 'not-allowed' : asset?.type === 'image' ? 'copy' : 'default')
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
      // Determine slot index for grid frames
      let slotIndex = null
      if (isGridFrame(targetFrame.frameType)) {
        slotIndex = getGridSlotIndexAtPosition(targetFrame, position)
        if (slotIndex === null || !canAddImageToFrameSlot(targetFrame, slotIndex)) return
      } else if (!canAddImageToFrameSlot(targetFrame, null)) {
        return
      }
 
      await addImageToFrame(targetFrame.id, asset.source, slotIndex, { asset })
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
    if (activePanel === 'brush' || activePanel === 'bezier') return
    const isMultiSelect = isGroupSelectMode || event.evt?.shiftKey

    requestAnimationFrame(() => {
      selectItem(id, { toggle: isMultiSelect })
    })
  }

  const handleObjectDragStart = (event, id) => {
    event.cancelBubble = true
    activeObjectDragRef.current = id
    if (justDroppedIdRef.current === id) {
      justDroppedIdRef.current = null
    }
    const activeSelection = selectedIds.includes(id) ? selectedIds : [id]
    setSelectedId(id)
    setSelectedIds(activeSelection)
    multiDragRef.current = {
      id,
      start: { x: event.target.x(), y: event.target.y() },
      positions: Object.fromEntries(
        itemsRef.current
          .filter((item) => activeSelection.includes(item.id))
          .map((item) => [item.id, { x: item.x || 0, y: item.y || 0 }])
      ),
    }
    requestAnimationFrame(() => {
      attachTransformer(activeSelection)
    })
    setStageCursor('move')
  }

  const handleObjectDragMove = (event, id) => {
    const dragSession = multiDragRef.current
    if (!dragSession || dragSession.id !== id) return

    const movingIds = Object.keys(dragSession.positions)
    const movingItems = itemsRef.current.filter((item) => movingIds.includes(item.id))
    const baseBounds = getItemsVisualBounds(movingItems.map((item) => ({ ...item, ...dragSession.positions[item.id] })))
    const rawDx = event.target.x() - dragSession.start.x
    const rawDy = event.target.y() - dragSession.start.y
    const snapped = getSnappedDelta(movingIds, baseBounds, rawDx, rawDy)

    if (movingIds.length === 1 && !snapped.snapped) {
      setAlignmentGuides(snapped.guides)
      return
    }

    movingIds.forEach((movingId) => {
      const startPosition = dragSession.positions[movingId]
      const node = stageRef.current?.findOne(`[id="${movingId}"]`) || stageRef.current?.findOne(`#${movingId}`)
      const item = itemsRef.current.find((current) => current.id === movingId)
      if (!node || !item || !startPosition) return

      const nextPosition = getClampedCanvasPosition(item.w || 1, item.h || 1, {
        x: startPosition.x + snapped.dx,
        y: startPosition.y + snapped.dy,
      }, canvasBounds)
      node.position(nextPosition)
    })

    setAlignmentGuides(snapped.guides)
    event.target.getLayer()?.batchDraw()
  }

  const handleObjectDragEnd = async (event, id) => {
    event.cancelBubble = true

    if (activeObjectDragRef.current !== id) return

    const node = event.target
    const item = itemsRef.current.find((current) => current.id === id)
    const nextPosition = item
      ? getClampedCanvasPosition(item.w, item.h, { x: node.x(), y: node.y() }, canvasBounds)
      : { x: node.x(), y: node.y() }

    const dragSession = multiDragRef.current
    activeObjectDragRef.current = null
    multiDragRef.current = null
    setAlignmentGuides([])
    setStageCursor(isSpaceDown ? 'grab' : 'default')

    if (dragSession && Object.keys(dragSession.positions).length > 1) {
      const movingIds = Object.keys(dragSession.positions)
      setItems((current) => current.map((currentItem) => {
        if (!movingIds.includes(currentItem.id)) return currentItem
        const movedNode = stageRef.current?.findOne(`[id="${currentItem.id}"]`) || stageRef.current?.findOne(`#${currentItem.id}`)
        if (!movedNode) return currentItem
        const clamped = getClampedCanvasPosition(currentItem.w || 1, currentItem.h || 1, { x: movedNode.x(), y: movedNode.y() }, canvasBounds)
        return { ...currentItem, ...clamped }
      }))
      requestAnimationFrame(() => attachTransformer(movingIds))
      return
    }

    // NEW: Cek apakah image canvas di-drag ke dalam frame slot
if (item?.kind === 'image') {
      const itemCenter = {
        x: nextPosition.x + item.w / 2,
        y: nextPosition.y + item.h / 2,
      }
      const targetFrame = getFrameAtDropPosition(itemCenter)
 
      if (targetFrame) {
        // Find which specific slot the image center is closest to
        let slotIndex = null
        if (isGridFrame(targetFrame.frameType)) {
          slotIndex = getGridSlotIndexAtPosition(targetFrame, itemCenter)
          if (slotIndex === null || !canAddImageToFrameSlot(targetFrame, slotIndex)) {
            node.position(nextPosition)
            updateItem(id, nextPosition)
            return
          }
        } else if (!canAddImageToFrameSlot(targetFrame, null)) {
          node.position(nextPosition)
          updateItem(id, nextPosition)
          return
        }
 
        await addImageToFrame(targetFrame.id, item.src, slotIndex, { removeItemId: id })
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
    requestAnimationFrame(() => requestAnimationFrame(updateToolbarPosition))
  }

  const finishTextEditing = useCallback(() => {
    if (!editingText) return

    const item = itemsRef.current.find((current) => current.id === editingText.id)
    if (!item) {
      setEditingText(null)
      return
    }

    if (item.kind === 'shape') {
      const fontSize = item.shapeTextFontSize || 16
      const minH = getShapeMinHeightForTextWidth(item, editingText.value, fontSize, item.w)
      const patch = { shapeText: editingText.value }
      if (item.h < minH) patch.h = minH
      updateItem(editingText.id, patch)
    } else {
      updateItem(editingText.id, { text: editingText.value })
    }

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

  useEffect(() => {
    if (!editingText) return

    const handleEscapeTextEdit = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      cancelTextEditing()
    }

    window.addEventListener('keydown', handleEscapeTextEdit)
    return () => window.removeEventListener('keydown', handleEscapeTextEdit)
  }, [cancelTextEditing, editingText])

  useEffect(() => {
    const preventTouch = (e) => { if (e.cancelable) e.preventDefault() }
    const targets = []
    const register = (el) => {
      if (!el || targets.includes(el)) return
      el.addEventListener('touchstart', preventTouch, { passive: false })
      el.addEventListener('touchmove', preventTouch, { passive: false })
      targets.push(el)
    }
    register(viewportRef.current)
    const stage = stageRef.current
    if (stage) {
      register(stage.container())
      register(stage.container().querySelector('canvas'))
    }
    const observer = new MutationObserver(() => {
      if (stage) {
        const canvas = stage.container().querySelector('canvas')
        if (canvas && !targets.includes(canvas)) register(canvas)
      }
    })
    if (stage?.container()) {
      observer.observe(stage.container(), { childList: true, subtree: true })
    }
    return () => {
      observer.disconnect()
      targets.forEach((el) => {
        el.removeEventListener('touchstart', preventTouch)
        el.removeEventListener('touchmove', preventTouch)
      })
    }
  }, [])

  const addAssetToCanvasRef = useRef(addAssetToCanvas)
  addAssetToCanvasRef.current = addAssetToCanvas

  useEffect(() => {
    const handleTouchEnd = (e) => {
      const asset = touchDragAssetRef.current
      touchDragAssetRef.current = null
      touchDragStartPosRef.current = null
      if (!asset || !touchDragMovedRef.current) {
        touchDragMovedRef.current = false
        return
      }
      touchDragMovedRef.current = false

      const touch = e.changedTouches?.[0]
      if (!touch) return

      const shell = viewportRef.current
      if (!shell) return
      const rect = shell.getBoundingClientRect()
      if (touch.clientX < rect.left || touch.clientX > rect.right ||
          touch.clientY < rect.top || touch.clientY > rect.bottom) return

      const position = getTouchCanvasPosition(touch)
      if (position) addAssetToCanvasRef.current(asset, position)
    }

    const handleTouchCancel = () => {
      touchDragAssetRef.current = null
      touchDragMovedRef.current = false
      touchDragStartPosRef.current = null
    }
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    return () => {
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [])

  const editTextObject = (id) => {
    const item = itemsRef.current.find((current) => current.id === id)

    if (!item || !['text', 'shape'].includes(item.kind)) return

    selectItem(id)
    setEditingText({ id, value: item.kind === 'shape' ? (item.shapeText || '') : item.text })
    attachTransformer(null)
  }

const handleFrameImageEdit = (id, slotIdx = 0) => {
  if (!id) {
    finishFrameImageEdit()
    return
  }
 
  const frame = itemsRef.current.find((item) => item.id === id)
  if (!frame || frame.kind !== 'frame') return
 
  const hasImage = isGridFrame(frame.frameType)
    ? (frame.frameImages?.some(img => img?.src) ?? false)
    : !!frame.frameImageSrc
 
  if (!hasImage) return
 
  setEditingFrameSlot(slotIdx)  // ← set slot SEBELUM editingFrameId
  setEditingFrameId(id)
  selectItem(id)
 
  requestAnimationFrame(() => {
    if (transformerRef.current) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  })
}

  const renderAssetGrid = (assets, options = {}) => (
    <div className="workspace-asset-grid">
      {assets.map((asset, index) => (
        <button
          type="button"
          key={`${asset.title}-${asset.imageKey || asset.type}-${index}`}
          title={asset.title}
          draggable
          style={{ touchAction: 'none' }}
          onClick={() => {
            addAssetToCanvas(asset)
          }}
          onTouchStart={(e) => {
            touchDragAssetRef.current = asset
            touchDragMovedRef.current = false
            touchDragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
          }}
          onTouchMove={(e) => {
            if (touchDragAssetRef.current) {
              e.preventDefault()
              const start = touchDragStartPosRef.current
              if (start) {
                const dx = e.touches[0].clientX - start.x
                const dy = e.touches[0].clientY - start.y
                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) touchDragMovedRef.current = true
              }
            }
          }}
          onDragStart={(event) => beginAssetDrag(event, asset)}
          onDragEnd={() => {
            setTimeout(() => {
              dragAssetRef.current = null
              setDropTargetFrameId(null)
              setStageCursor('default')
            }, 100)
          }}
        >
          <span className="workspace-asset-preview">{asset.type === 'image' ? <img src={asset.previewSource || asset.source} alt="" crossOrigin="anonymous" loading="lazy" /> : asset.type === 'text' ? 'Aa' : <Sparkles size={28} />}</span>
          <strong title={asset.title}>{asset.title}</strong>
          {asset.boardName && <small>{asset.boardName}</small>}
          {options.onDelete && asset.mediaId && (
            <span
              className="workspace-asset-delete"
              role="button"
              tabIndex={0}
              aria-label={`Delete ${asset.title}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setAssetDeleteTarget(asset)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                event.stopPropagation()
                setAssetDeleteTarget(asset)
              }}
            >
              <X size={14} />
            </span>
          )}
        </button>
      ))}
    </div>
  )

  const renderDatabaseBoards = () => (
    <div className="workspace-asset-home-grid">
      {databaseBoards.map((board) => (
        <button
          type="button"
          className="workspace-board-card"
          key={board.id}
          onClick={() => {
            setSelectedBoardId(board.id)
            setSelectedBoardItem(null)
          }}
        >
          <span className="workspace-board-cover">
            {(board.coverImages || []).slice(0, 4).map((url, index) => <img src={url} alt="" crossOrigin="anonymous" key={`${url}-${index}`} />)}
            {!board.coverImages?.length && <FolderOpen size={24} />}
          </span>
          <span className="workspace-board-card-copy">
            <strong>{board.name}</strong>
            <small>{board.itemCount || 0} item</small>
          </span>
        </button>
      ))}
    </div>
  )

  const renderBoardItems = () => (
    <div className="workspace-asset-grid">
      {(selectedBoard?.items || []).map((item) => {
        const assets = getBoardItemAssets(item, selectedBoard)
        const asset = assets[0]
        if (!asset) return null
        const isCarousel = assets.length > 1
        return (
          <button
            type="button"
            key={item.id}
            title={item.title}
            draggable={!isCarousel}
            style={{ touchAction: isCarousel ? 'auto' : 'none' }}
            onClick={() => {
              if (isCarousel) {
                setSelectedBoardItem(item)
              } else {
                addAssetToCanvas(asset)
              }
            }}
            onTouchStart={(e) => {
              if (isCarousel) return
              touchDragAssetRef.current = asset
              touchDragMovedRef.current = false
              touchDragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            }}
            onTouchMove={(e) => {
              if (isCarousel || !touchDragAssetRef.current) return
              e.preventDefault()
              const start = touchDragStartPosRef.current
              if (start) {
                const dx = e.touches[0].clientX - start.x
                const dy = e.touches[0].clientY - start.y
                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) touchDragMovedRef.current = true
              }
            }}
            onDragStart={(event) => {
              if (!isCarousel) beginAssetDrag(event, asset)
            }}
            onDragEnd={() => {
              dragAssetRef.current = null
              setDropTargetFrameId(null)
              setStageCursor('default')
            }}
          >
            <span className="workspace-asset-preview">
              <img src={asset.source} alt="" crossOrigin="anonymous" />
              {isCarousel && <span className="workspace-board-media-count">{assets.length}</span>}
            </span>
            <strong title={item.title}>{item.title}</strong>
            <small>{isCarousel ? `${assets.length} gambar - tap untuk pilih` : selectedBoard.name}</small>
          </button>
        )
      })}
    </div>
  )

  const confirmAssetDelete = () => {
    if (!assetDeleteTarget?.mediaId) return
    const target = assetDeleteTarget
    setAssetDeleteTarget(null)
    removeUploadedAsset(target.mediaId)
  }

const beginPan = (event) => {
  const stage = stageRef.current
  const pointer = stage?.getPointerPosition()

  if (!pointer) return
  const isTouchPan = event.evt.type?.startsWith('touch') || event.evt.pointerType === 'touch'

  if (!isTouchPan && !canPanCamera(cameraRef.current)) {
    const centeredCamera = clampCameraToCanvas(cameraRef.current)
    cameraRef.current = centeredCamera
    targetCameraRef.current = centeredCamera
    setCamera(centeredCamera)
    return
  }

  targetCameraRef.current = cameraRef.current

  panSessionRef.current = {
    pointer,
    camera: cameraRef.current,
    isTouchPan,
  }
  setIsPanning(true)
  setStageCursor('grabbing')
  event.evt.preventDefault()
}

  const handleStageMouseDown = (event) => {
    if (activeObjectDragRef.current) return

    // Tool handlers: brush
    if (activePanel === 'brush') {
      beginBrushStroke(event)
      return
    }

    // Tool handlers: bezier
    if (activePanel === 'bezier') {
      addBezierAnchor(event)
      return
    }

    // Tool handlers: editing bezier (adjust corner rounding)
    if (editingBezierId) {
      if (selectedBezierAnchorIdx !== null && isEmptyCanvasTarget(event.target)) {
        setSelectedBezierAnchorIdx(null)
        return
      }
      // Walk up parent chain to find a node with an id (child shapes like Image, Rect often don't have id)
      let targetId = null
      let node = event.target
      while (node && node !== node.getStage()) {
        const nid = typeof node.id === 'function' ? node.id() : undefined
        if (nid) { targetId = nid; break }
        node = node.parent
      }
      if (isEmptyCanvasTarget(event.target) || (targetId && targetId !== editingBezierId)) {
        if (selectedBezierAnchorIdx !== null) setSelectedBezierAnchorIdx(null)
        finishEditingBezier()
        return
      }
      return
    }

    setIsBlendModeOpen(false)
 
    if (editingFrameId) {
      // Klik di background = keluar edit mode
      if (isEmptyCanvasTarget(event.target)) {
        finishFrameImageEdit()
      }
      // Selalu return — tidak ada pan/deselect saat dalam edit mode
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
      if (event.evt.pointerType === 'touch') {
        beginPan(event)
        return
      }
      if (panSessionRef.current) return
      if (connectorTool && beginFreeConnectorDrag(event)) {
        return
      }
      const pointer = stageRef.current?.getPointerPosition()
      if (!pointer) return
      closeRightPanelAndCenter()
      setActivePanel(null)
      const worldPoint = getWorldPointFromViewport(pointer, cameraRef.current)
      selectionBoxRef.current = { start: worldPoint, current: worldPoint, append: event.evt.shiftKey }
      setSelectionBox({ x: worldPoint.x, y: worldPoint.y, width: 0, height: 0 })
      setSelectedId(null)
      if (!event.evt.shiftKey) setSelectedIds([])
      attachTransformer(null)
    }
  }

const handleStageMouseMove = (e) => {
  if (brushStartPosRef.current || brushDrawingRef.current) {
    tryStartBrushStroke()
    if (!brushDrawingRef.current) return
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    // Update latestPointerRef from the raw event for real-time cursor tracking
    if (e?.evt) {
      const rect = stageRef.current?.content?.getBoundingClientRect()
      if (rect) {
        const sw = stageRef.current?.width() || 1
        const sh = stageRef.current?.height() || 1
        latestPointerRef.current = {
          x: (e.evt.clientX - rect.left) * (sw / rect.width),
          y: (e.evt.clientY - rect.top) * (sh / rect.height),
        }
      }
    } else {
      latestPointerRef.current = pointer
    }
    const worldPoint = getWorldPointFromViewport(pointer, cameraRef.current)
    if (currentStrokeRef.current) {
      const next = { ...currentStrokeRef.current, points: [...currentStrokeRef.current.points, worldPoint.x, worldPoint.y] }
      currentStrokeRef.current = next
    }
    setCurrentStroke((prev) => {
      if (!prev) return prev
      const next = { ...prev, points: [...prev.points, worldPoint.x, worldPoint.y] }
      currentStrokeRef.current = next
      return next
    })
    return
  }

  // Bezier rubber band: track mouse position for live preview
  if (activePanel === 'bezier' && bezierAnchors.length > 0) {
    const pointer = stageRef.current?.getPointerPosition()
    if (pointer) {
      const worldPoint = getWorldPointFromViewport(pointer, cameraRef.current)
      const snapped = snapBezierPoint(worldPoint)
      const tolerance = 5 / cameraRef.current.scale
      const guides = []
      // Collect unique alignment guides from ALL anchors
      for (const a of bezierAnchors) {
        if (Math.abs(worldPoint.y - a.y) < tolerance && !guides.some(g => g.type === 'h' && Math.abs(g.value - a.y) < 0.5)) {
          guides.push({ type: 'h', value: a.y })
        }
        if (Math.abs(worldPoint.x - a.x) < tolerance && !guides.some(g => g.type === 'v' && Math.abs(g.value - a.x) < 0.5)) {
          guides.push({ type: 'v', value: a.x })
        }
      }
      setBezierGuides(guides)
      setBezierMousePos(snapped)
    }
  }

  if (connectorDraft) {
    updateConnectorDraft()
    return
  }

  if (activeObjectDragRef.current) {
    const draggedItem = itemsRef.current.find(i => i.id === activeObjectDragRef.current)
    if (draggedItem?.kind === 'image') {
      const stage = stageRef.current
      const pointer = stage?.getPointerPosition()
      if (pointer) {
        const worldPos = getWorldPointFromViewport(pointer, cameraRef.current)
        const frame = getFrameAtDropPosition(worldPos)
        setDropTargetFrameId(frame?.id || null)
      }
    }
    return
  }

  if (selectionBoxRef.current) {
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const current = getWorldPointFromViewport(pointer, cameraRef.current)
    const start = selectionBoxRef.current.start
    selectionBoxRef.current.current = current
    setSelectionBox({
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    })
    return
  }

  const stage = stageRef.current
  const session = panSessionRef.current
  const pointer = stage?.getPointerPosition()

  if (!session || !pointer) return
  if (!session.isTouchPan && !canPanCamera(session.camera)) return

  const nextCamera = {
    ...session.camera,
    x: session.camera.x + pointer.x - session.pointer.x,
    y: session.camera.y + pointer.y - session.pointer.y,
  }
  const clamped = session.isTouchPan ? clampCameraToCanvas(nextCamera) : nextCamera
  cameraRef.current = clamped
  targetCameraRef.current = clamped
  setCamera(clamped)
}

const handleStageMouseUp = (event) => {
  if (brushDrawingRef.current) {
    finishBrushStroke()
    return
  }

  if (activePanel === 'brush' && brushSettings.mode === 'erase') {
    brushStartPosRef.current = null
    const pointer = stageRef.current?.getPointerPosition()
    if (pointer) {
      handleEraserTapSelect(pointer)
    }
    return
  }

  if (connectorDraft) {
    finishConnectorDrag(event)
    return
  }

  if (selectionBoxRef.current) {
    const { start, current, append } = selectionBoxRef.current
    const box = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    }
    selectionBoxRef.current = null
    setSelectionBox(null)

    if (box && (box.width > 4 || box.height > 4)) {
      const hitIds = itemsRef.current
        .filter((item) => item.visible !== false && item.kind !== 'connector')
        .filter((item) => rectsIntersect(box, { x: item.x || 0, y: item.y || 0, width: item.w || 1, height: item.h || 1 }))
        .map((item) => item.id)
      const nextIds = append ? Array.from(new Set([...selectedIds, ...hitIds])) : hitIds
      setSelectedIds(nextIds)
      setSelectedId(nextIds[nextIds.length - 1] || null)
      requestAnimationFrame(() => attachTransformer(nextIds))
    }
    return
  }

  endPan()
}

const endPan = () => {
  setAlignmentGuides([])
  if (!panSessionRef.current) return

  panSessionRef.current = null
  setIsPanning(false)
  setStageCursor(isSpaceDown ? 'grab' : 'default')
  const clampedCamera = clampCameraToCanvas(cameraRef.current)
  targetCameraRef.current = clampedCamera
  cameraRef.current = clampedCamera
  setCamera(clampedCamera)
}

let commitTransformerChangesLock = false
const commitTransformerChanges = () => {
  if (commitTransformerChangesLock) return
  commitTransformerChangesLock = true
  const nodes = transformerRef.current?.nodes?.() || []
  if (!nodes.length) { commitTransformerChangesLock = false; return }

  const ids = nodes.map((node) => node.id()).filter(Boolean)
  setAlignmentGuides([])
  setItems((current) => current.map((item) => {
    if (!ids.includes(item.id)) return item
    if (item.locked) return item
    if (item.kind === 'text' || item.kind === 'image') return item
    if (item.kind === 'shape' && (item.shapeType === 'freehand' || item.shapeType === 'bezier-path')) return item
    const node = nodes.find((candidate) => candidate.id() === item.id)
    if (!node) return item

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    if (item.kind === 'text') {
      const activeAnchor = transformerRef.current?.getActiveAnchor?.()
      const isCornerResize = !!activeAnchor && !activeAnchor.startsWith('middle')
      const nextW = Math.max(8, (item.w || node.width() || 1) * Math.abs(scaleX || 1))
      const nextFontSize = isCornerResize
        ? clamp((item.fontSize || 48) * Math.max(Math.abs(scaleX || 1), Math.abs(scaleY || 1)), 8, 1000)
        : (item.fontSize || 48)

      node.scaleX(1)
      node.scaleY(1)
      node.width(nextW)
      node.fontSize(nextFontSize)
      node.setAttr('height', undefined)
      node.clearCache()
      if (typeof node._clearTextCache === 'function') node._clearTextCache()
      try { effectManager.applyAll(node, item.effects) } catch {}

      const textRect = node.getClientRect({ skipTransform: true, skipShadow: true })
      const nextH = Math.max(8, Math.ceil(textRect.height || node.height() || nextFontSize))
      const nextPosition = getClampedCanvasPosition(nextW, nextH, { x: node.x(), y: node.y() }, canvasBounds)

      node.position(nextPosition)
      return {
        ...item,
        x: nextPosition.x,
        y: nextPosition.y,
        w: nextW,
        h: nextH,
        fontSize: nextFontSize,
        rotation: node.rotation(),
      }
    }

    const nextW = Math.max(40, (item.w || node.width() || 1) * Math.abs(scaleX || 1))
    const nextH = Math.max(40, (item.h || node.height() || 1) * Math.abs(scaleY || 1))
    const nextSize = getCanvasContainedSize(nextW, nextH)
    const nextPosition = getClampedCanvasPosition(nextSize.w, nextSize.h, { x: node.x(), y: node.y() }, canvasBounds)
    const patch = {
      x: nextPosition.x,
      y: nextPosition.y,
      w: nextSize.w,
      h: nextSize.h,
      rotation: node.rotation(),
    }

    if (item.kind === 'shape' && (item.shapeType === 'freehand' || item.shapeType === 'bezier-path')) {
      const absScaleX = Math.abs(scaleX || 1)
      const absScaleY = Math.abs(scaleY || 1)
      if (absScaleX !== 1 || absScaleY !== 1) {
        if (item.shapeType === 'freehand') {
          const strokes = item.strokes || [item.points]
          const newStrokes = strokes.map((s) => {
            const scaled = []
            for (let i = 0; i < s.length; i += 2) {
              scaled.push(s[i] * absScaleX)
              scaled.push(s[i + 1] * absScaleY)
            }
            return scaled
          })
          patch.strokes = newStrokes
          patch.points = undefined
        } else if (item.shapeType === 'bezier-path' && item.points) {
          const scaledPoints = item.points.map((p) => ({ x: p.x * absScaleX, y: p.y * absScaleY }))
          patch.points = scaledPoints
          if (item.bezierData) {
            patch.bezierData = item.bezierData.map((cp) => ({
              cpInX: (cp.cpInX || 0) * absScaleX,
              cpInY: (cp.cpInY || 0) * absScaleY,
              cpOutX: (cp.cpOutX || 0) * absScaleX,
              cpOutY: (cp.cpOutY || 0) * absScaleY,
            }))
          }
        }
      }
    }

    if (item.kind === 'frame' && isGridFrame(item.frameType) && item.frameImages?.length) {
      const oldSlots = getResolvedFrameSlots(item)
      const nextSlots = getResolvedFrameSlots({ ...item, w: nextSize.w, h: nextSize.h })
      patch.frameImages = item.frameImages.map((frameImage, index) => {
        if (!frameImage) return frameImage
        const oldSlot = oldSlots.find((slot) => slot.slotIndex === index)
        const nextSlot = nextSlots.find((slot) => slot.slotIndex === index)
        if (!oldSlot || !nextSlot) return frameImage
        return {
          ...frameImage,
          position: {
            x: (frameImage.position?.x || 0) * (nextSlot.width / oldSlot.width),
            y: (frameImage.position?.y || 0) * (nextSlot.height / oldSlot.height),
          },
        }
      })
    } else if (item.kind === 'frame' && item.frameImageSrc) {
      patch.frameImagePosition = {
        x: (item.frameImagePosition?.x || 0) * (nextSize.w / item.w),
        y: (item.frameImagePosition?.y || 0) * (nextSize.h / item.h),
      }
      patch.frameImageScale = item.frameImageScale || 1
    }

    node.scaleX(1)
    node.scaleY(1)
    node.position(nextPosition)
    node.width?.(nextSize.w)
    node.height?.(nextSize.h)
    return { ...item, ...patch }
  }))

  requestAnimationFrame(() => { attachTransformer(ids); requestAnimationFrame(updateToolbarPosition) })
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
    (event.evt.deltaMode === 0 && (
      !Number.isInteger(event.evt.deltaY) ||
      Math.abs(event.evt.deltaY) < 80
    ))
  )

  if (isTrackpadPan) {
    if (!canPanCamera(cameraRef.current)) {
      if (wheelPanClampTimerRef.current) {
        window.clearTimeout(wheelPanClampTimerRef.current)
        wheelPanClampTimerRef.current = null
      }
      const centeredCamera = clampCameraToCanvas(cameraRef.current)
      cameraRef.current = centeredCamera
      targetCameraRef.current = centeredCamera
      setCamera(centeredCamera)
      return
    }
    // Cancel any ongoing zoom animation so pan is immediate
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current)
      zoomAnimationRef.current = null
    }
    if (wheelPanClampTimerRef.current) {
      window.clearTimeout(wheelPanClampTimerRef.current)
    }
    wheelPanDeltaRef.current = {
      x: wheelPanDeltaRef.current.x + event.evt.deltaX,
      y: wheelPanDeltaRef.current.y + event.evt.deltaY,
    }
    if (!wheelPanFrameRef.current) {
      wheelPanFrameRef.current = requestAnimationFrame(() => {
        wheelPanFrameRef.current = null
        const delta = wheelPanDeltaRef.current
        wheelPanDeltaRef.current = { x: 0, y: 0 }
        if (!delta.x && !delta.y) return
        const currentCamera = cameraRef.current
        const panned = {
          scale: currentCamera.scale,
          x: currentCamera.x - delta.x,
          y: currentCamera.y - delta.y,
        }
        const boundedCamera = clampCameraToCanvas(panned)
        cameraRef.current = boundedCamera
        targetCameraRef.current = boundedCamera
        setCamera(boundedCamera)
      })
    }
    wheelPanClampTimerRef.current = window.setTimeout(() => {
      if (wheelPanFrameRef.current) {
        cancelAnimationFrame(wheelPanFrameRef.current)
        wheelPanFrameRef.current = null
      }
      wheelPanDeltaRef.current = { x: 0, y: 0 }
      const clampedCamera = clampCameraToCanvas(cameraRef.current)
      cameraRef.current = clampedCamera
      targetCameraRef.current = clampedCamera
      setCamera(clampedCamera)
      wheelPanClampTimerRef.current = null
    }, 140)
    return
  }



  // Zoom: ctrlKey (pinch) or plain mouse wheel
  const actualCamera = cameraRef.current
  const zoomIntensity = event.evt.ctrlKey ? 1.035 : zoomSpeed
  const nextScale = Math.min(
    maxZoom,
    Math.max(minZoom, event.evt.deltaY < 0 ? actualCamera.scale * zoomIntensity : actualCamera.scale / zoomIntensity),
  )
  zoomCameraAtPoint(nextScale, pointer)
}

const getTouchDistance = (touches) => {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

const getTouchCenter = (touches) => {
  const rect = stageRef.current?.container?.()?.getBoundingClientRect?.()
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2 - (rect?.left || 0),
    y: (touches[0].clientY + touches[1].clientY) / 2 - (rect?.top || 0),
  }
}

const handleStageTouchStart = (event) => {
  event.evt.preventDefault()
  const touches = event.evt.touches
  if (touches?.length === 2) {
    panSessionRef.current = null
    setIsPanning(false)
    pinchSessionRef.current = {
      distance: getTouchDistance(touches),
      scale: cameraRef.current.scale,
    }
  } else if (isEmptyCanvasTarget(event.target)) {
    touchStartPosRef.current = stageRef.current?.getPointerPosition()
    beginPan(event)
  }
}

const doTouchPan = () => {
  const stage = stageRef.current
  const session = panSessionRef.current
  const pointer = stage?.getPointerPosition()
  if (!session || !pointer) return
  const nextCamera = {
    ...session.camera,
    x: session.camera.x + pointer.x - session.pointer.x,
    y: session.camera.y + pointer.y - session.pointer.y,
  }
  const clamped = clampCameraToCanvas(nextCamera)
  cameraRef.current = clamped
  targetCameraRef.current = clamped
  setCamera(clamped)
}

const handleStageTouchMove = (event) => {
  event.evt.preventDefault()
  const touches = event.evt.touches
  const pinchSession = pinchSessionRef.current
  if (touches?.length === 2 && pinchSession) {
    const nextDistance = getTouchDistance(touches)
    if (pinchSession.distance && nextDistance) {
      const nextScale = cameraRef.current.scale * (nextDistance / pinchSession.distance)
      pinchSession.distance = nextDistance
      pinchSession.scale = nextScale
      zoomCameraAtPoint(nextScale, getTouchCenter(touches), { constrain: false })
    }
    return
  }
  doTouchPan()
}

const handleStageTouchEnd = (event) => {
  if ((event.evt.touches?.length || 0) < 2) {
    pinchSessionRef.current = null

    if (touchStartPosRef.current && isEmptyCanvasTarget(event.target)) {
      const pointer = stageRef.current?.getPointerPosition()
      if (pointer) {
        const dx = pointer.x - touchStartPosRef.current.x
        const dy = pointer.y - touchStartPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          if (editingFrameId) {
            finishFrameImageEdit()
          } else if (editingText) {
            finishTextEditing()
          } else {
            closeRightPanelAndCenter()
            setActivePanel(null)
            setSelectedId(null)
            setSelectedIds([])
            attachTransformer(null)
          }
        }
      }
    }
    touchStartPosRef.current = null

    endPan()
  }
}

const handleOutsideWorkspacePointerDown = (event) => {
  if (event.target === event.currentTarget) {
    if (editingText) {
      finishTextEditing()
      return
    }
    deselectCanvas()
  }
}

const activePanelLabel = (
  panelTools.find((tool) => tool.id === activePanel)?.label ||
  toolItems.find((tool) => tool.id === activePanel)?.label ||
  'Panel'
)

const mobileSheetKicker = activeGroupId && selectedItems.length > 1
  ? 'group selected'
  : selectedItem
    ? `${selectedItem.kind} selected`
    : ''

const mobileSheetTitle = activeGroupId && selectedItems.length > 1
  ? `${selectedItems.length} objects`
  : selectedItem?.id || activePanelLabel

const toggleMobileSheetSize = () => {
  setMobileSheetState((current) => (current === 'expanded' ? 'half' : 'expanded'))
}

  const renderPanel = () => {
  console.log('[DEBUG] renderPanel called - activePanel:', activePanel, 'selectedItem:', selectedItem?.id, 'selectedItem.kind:', selectedItem?.kind)

  if (isColorPickerOpen && ['text', 'shape', 'image'].includes(selectedItem?.kind) && colorPickerTarget) {
    const isImageStrokeTarget = selectedItem.kind === 'image' && colorPickerTarget === 'imageStroke'
    const isShapeTextTarget = colorPickerTarget === 'shapeText'
    const isFillTarget = colorPickerTarget === 'fill'
    const supportsGradient = !isShapeTextTarget && (isImageStrokeTarget || selectedItem.kind === 'text' || isFillTarget)
    const currentGradientType = isImageStrokeTarget
      ? (selectedItem.imageStrokeGradientType || 'solid')
      : isFillTarget
      ? (selectedItem.gradientType || 'solid')
      : (supportsGradient ? (selectedItem.strokeGradientType || 'solid') : 'solid')
    const currentColor = isImageStrokeTarget ? selectedItem.imageStrokeColor : (isFillTarget ? selectedItem.fill : selectedItem.stroke)
    const colorInputValue = currentColor || (isImageStrokeTarget ? '#ffffff' : isFillTarget ? '#a78bfa' : '#3f3a46')
    const currentStops = isImageStrokeTarget
      ? (selectedItem.imageStrokeGradientStops || [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#ec4899' }])
      : isFillTarget
      ? (selectedItem.gradientStops || [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#ec4899' }])
      : (selectedItem.strokeGradientStops || [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#ec4899' }])
    const currentAngle = isImageStrokeTarget
      ? (selectedItem.imageStrokeGradientAngle || 90)
      : isFillTarget
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
            <ArrowLeft size={16} />
          </button>
          <div className="workspace-color-picker-title">
            {isImageStrokeTarget
              ? 'Image Stroke'
              : isShapeTextTarget
              ? 'Text Color'
              : selectedItem.kind === 'shape'
                ? (isFillTarget ? 'Shape Fill' : 'Shape Stroke')
                : (isFillTarget ? 'Text Fill' : 'Stroke Fill')}
          </div>
        </div>
        <div className="workspace-color-picker-content">
          {supportsGradient && (
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
                    } else if (isImageStrokeTarget) {
                      updateItem(selectedItem.id, {
                        imageStrokeEnabled: true,
                        imageStrokeGradientType: 'solid',
                        imageStrokeWidth: selectedItem.imageStrokeWidth || 3,
                      })
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
                  disabled={!supportsGradient}
                  onClick={() => {
                    if (!supportsGradient) return
                    if (isFillTarget) {
                      updateItem(selectedItem.id, {
                        gradientType: 'linear',
                        gradientStops: currentStops,
                        gradientAngle: currentAngle
                      })
                    } else if (isImageStrokeTarget) {
                      updateItem(selectedItem.id, {
                        imageStrokeEnabled: true,
                        imageStrokeGradientType: 'linear',
                        imageStrokeGradientStops: currentStops,
                        imageStrokeGradientAngle: currentAngle,
                        imageStrokeWidth: selectedItem.imageStrokeWidth || 3,
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
                  disabled={!supportsGradient}
                  onClick={() => {
                    if (!supportsGradient) return
                    if (isFillTarget) {
                      updateItem(selectedItem.id, {
                        gradientType: 'radial',
                        gradientStops: currentStops
                      })
                    } else if (isImageStrokeTarget) {
                      updateItem(selectedItem.id, {
                        imageStrokeEnabled: true,
                        imageStrokeGradientType: 'radial',
                        imageStrokeGradientStops: currentStops,
                        imageStrokeWidth: selectedItem.imageStrokeWidth || 3,
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
          )}

          {currentGradientType === 'solid' && (
            <div className="workspace-color-solid-section">
              <label className="workspace-color-picker-field">
                Color
                <div className={`workspace-color-picker-input-large-wrapper ${!currentColor ? 'is-null' : ''}`}>
                  <input
                    type="color"
                    value={colorInputValue}
                    onChange={(event) => {
                      if (isShapeTextTarget) {
                        updateItem(selectedItem.id, { shapeTextFill: event.target.value })
                      } else if (isImageStrokeTarget) {
                        updateItem(selectedItem.id, {
                          imageStrokeEnabled: true,
                          imageStrokeGradientType: 'solid',
                          imageStrokeColor: event.target.value,
                          imageStrokeWidth: selectedItem.imageStrokeWidth || 3,
                        })
                      } else if (isFillTarget) {
                        updateItem(selectedItem.id, { fill: event.target.value })
                      } else {
                        updateItem(selectedItem.id, {
                          stroke: event.target.value,
                          strokeWidth: selectedItem.kind === 'shape' && !selectedItem.strokeWidth ? 2 : selectedItem.strokeWidth,
                        })
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
                      if (isShapeTextTarget) {
                        updateItem(selectedItem.id, { shapeTextFill: '#231c2f' })
                      } else if (isImageStrokeTarget) {
                        updateItem(selectedItem.id, { imageStrokeEnabled: false, imageStrokeWidth: 0, imageStrokeGradientType: 'solid' })
                      } else if (isFillTarget) {
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
                      if (isShapeTextTarget) {
                        updateItem(selectedItem.id, { shapeTextFill: color })
                      } else if (isImageStrokeTarget) {
                        updateItem(selectedItem.id, {
                          imageStrokeEnabled: true,
                          imageStrokeGradientType: 'solid',
                          imageStrokeColor: color,
                          imageStrokeWidth: selectedItem.imageStrokeWidth || 3,
                        })
                      } else if (isFillTarget) {
                        updateItem(selectedItem.id, { fill: color })
                      } else {
                        updateItem(selectedItem.id, {
                          stroke: color,
                          strokeWidth: selectedItem.kind === 'shape' && !selectedItem.strokeWidth ? 2 : selectedItem.strokeWidth,
                        })
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
                      } else if (isImageStrokeTarget) {
                        updateItem(selectedItem.id, {
                          imageStrokeEnabled: true,
                          imageStrokeGradientStops: preset,
                          imageStrokeWidth: selectedItem.imageStrokeWidth || 3,
                        })
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
                        } else if (isImageStrokeTarget) {
                          updateItem(selectedItem.id, { imageStrokeGradientAngle: Number(event.target.value) })
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
                        } else if (isImageStrokeTarget) {
                          updateItem(selectedItem.id, { imageStrokeGradientAngle: Number(event.target.value) })
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
                      } else if (isImageStrokeTarget) {
                        updateItem(selectedItem.id, { imageStrokeGradientStops: newStops })
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
                          } else if (isImageStrokeTarget) {
                            updateItem(selectedItem.id, { imageStrokeGradientStops: stops })
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
                          } else if (isImageStrokeTarget) {
                            updateItem(selectedItem.id, { imageStrokeGradientStops: sortedStops })
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
                            } else if (isImageStrokeTarget) {
                              updateItem(selectedItem.id, { imageStrokeGradientStops: stops })
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

  if (cropSession) {
    const cropItem = items.find((item) => item.id === cropSession.itemId)
    return (
      <>
        <div className="workspace-panel-heading">
          <span>Crop</span>
          <strong>{cropItem?.id || 'Image'}</strong>
        </div>
        <div className="workspace-section-card">
          <div className="workspace-section-title">Preset</div>
          <div className="workspace-crop-preset-grid">
            {cropPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={cropSession.preset === preset.id ? 'active' : ''}
                onClick={() => setCropPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div className="workspace-crop-action-bar">
          <button type="button" onClick={cancelImageCrop}>Cancel</button>
          <button type="button" className="primary" onClick={applyImageCrop}>Done</button>
        </div>
      </>
    )
  }

  const allCategories = ['All', 'Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace']

  if (isFontPickerOpen && ['text', 'shape'].includes(selectedItem?.kind)) {
    const fonts = apiFonts
      ? [...availableFonts, ...apiFonts.filter((f) => !availableFonts.some((a) => a.name.toLowerCase() === f.name.toLowerCase()))]
      : availableFonts
    const filteredFonts = fonts.filter((font) => {
      const matchesSearch = !fontSearchQuery || font.name.toLowerCase().includes(fontSearchQuery.toLowerCase())
      const matchesCategory = !selectedFontCategory || selectedFontCategory === 'All' || font.category === selectedFontCategory
      return matchesSearch && matchesCategory
    })

    return (
      <div ref={fontPickerRef} className="workspace-font-picker">
        <div className="workspace-font-sticky-top">
          <div className="workspace-font-picker-header">
            <button
              type="button"
              className="workspace-back-button"
              onClick={() => {
                setIsFontPickerOpen(false)
                setFontSearchQuery('')
                setSelectedFontCategory(null)
                setLoadingFont(null)
              }}
            >
              <ArrowLeft size={16} />
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
              {fontSearchQuery && (
                <button
                  type="button"
                  className="workspace-font-search-clear"
                  onClick={() => setFontSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="workspace-font-categories">
            {allCategories.map((cat) => (
              <button
                type="button"
                key={cat}
                className={`workspace-font-category-chip ${(selectedFontCategory === cat || (!selectedFontCategory && cat === 'All')) ? 'active' : ''}`}
                onClick={() => setSelectedFontCategory(cat === 'All' ? null : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="workspace-font-list">
          {isLoadingFonts && !apiFonts && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(246,247,251,0.4)', fontSize: 12 }}>
              Loading Google Fonts…
            </div>
          )}
          {fontsError && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(246,247,251,0.4)', fontSize: 12 }}>
              Could not load Google Fonts.
            </div>
          )}
          {filteredFonts.slice(0, fontDisplayCount).map((font) => (
            <button
              type="button"
              key={font.family}
              disabled={loadingFont === font.family}
              className={`workspace-font-item ${selectedItem.fontFamily === font.family ? 'active' : ''}`}
              onClick={async () => {
                setLoadingFont(font.family)
                try {
                  await preloadFont(font.family)
                  updateItem(selectedItem.id, { fontFamily: font.family })
                } finally {
                  setLoadingFont(null)
                }
              }}
            >
              <span className="workspace-font-preview" style={{ fontFamily: font.family }}>
                {loadingFont === font.family ? 'Loading…' : font.name}
              </span>
              <small>{font.category}</small>
            </button>
          ))}
          {fontDisplayCount < filteredFonts.length && (
            <div ref={fontSentinelRef} style={{ height: 1 }} />
          )}
        </div>
      </div>
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
          items={layerEntries.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="workspace-layer-list">
            {layerEntries.map((item) => (
              <SortableLayerItem
                key={item.id}
                item={item}
                isSelected={item.kind === 'group' ? item.members?.some((member) => selectedIds.includes(member.id)) : selectedIds.includes(item.id)}
                onSelect={(id) => {
                  console.log('[DEBUG] Layer onSelect called with id:', id, 'current activePanel:', activePanel)
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  const ids = entry?.kind === 'group' ? entry.members.map((member) => member.id) : [id]
                  setSelectedId(ids[ids.length - 1] || null)
                  setSelectedIds(ids)
                  requestAnimationFrame(() => attachTransformer(ids))
                  // FIX: Do NOT change activePanel - it should already be 'layers'
                  // Just select the item, panel will stay open because activePanel === 'layers'
                }}
                onOpenProperties={(id) => {
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  if (entry?.kind === 'group') {
                    const ids = entry.members.map((member) => member.id)
                    setSelectedId(ids[ids.length - 1] || null)
                    setSelectedIds(ids)
                    setActivePanel('properties')
                    setIsRightPanelOpen(true)
                    requestAnimationFrame(() => attachTransformer(ids))
                    return
                  }
                  openLayerObjectProperties(id)
                }}
                onOpenFx={(id) => {
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  if (entry?.kind === 'group') {
                    const ids = entry.members.map((member) => member.id)
                    setSelectedId(ids[ids.length - 1] || null)
                    setSelectedIds(ids)
                    requestAnimationFrame(() => attachTransformer(ids))
                  } else {
                    setSelectedId(id)
                    setSelectedIds([id])
                    requestAnimationFrame(() => attachTransformer(id))
                  }
                  setActivePanel('properties')
                  setIsRightPanelOpen(true)
                  setIsFxPanelOpen(true)
                }}
                onToggleVisibility={(id) => {
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  if (entry?.kind === 'group') {
                    const nextVisible = entry.visible === false
                    setItems((current) => current.map((currentItem) => (
                      currentItem.groupId === id ? { ...currentItem, visible: nextVisible } : currentItem
                    )))
                    return
                  }
                  const targetItem = items.find(i => i.id === id)
                  updateItem(id, { visible: targetItem.visible === false })
                }}
                onToggleLock={(id) => {
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  if (entry?.kind === 'group') {
                    const nextLocked = !entry.locked
                    setItems((current) => current.map((currentItem) => (
                      currentItem.groupId === id ? { ...currentItem, locked: nextLocked } : currentItem
                    )))
                    return
                  }
                  const targetItem = items.find(i => i.id === id)
                  updateItem(id, { locked: !targetItem.locked })
                }}
                onDelete={(id) => {
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  if (entry?.kind === 'group') {
                    const ids = entry.members.map((member) => member.id)
                    setItems((current) => current.filter((item) => !ids.includes(item.id)))
                    setSelectedId(null)
                    setSelectedIds([])
                    attachTransformer(null)
                    return
                  }
                  deleteObject(id)
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  // Tool panels — placed BEFORE selectedItem to take priority
  if (activePanel === 'brush') {
    return (
      <ToolBrushPanel
        settings={brushSettings}
        onChange={setBrushSettings}
        onBack={() => { setActivePanel(null); setIsRightPanelOpen(false) }}
      />
    )
  }

  if (activePanel === 'bezier') {
    return (
      <ToolBezierPanel
        anchors={bezierAnchors}
        strokeColor={bezierSettings.strokeColor}
        strokeWidth={bezierSettings.strokeWidth}
        onStrokeChange={setBezierSettings}
        onComplete={finishBezierPath}
        onCancel={cancelBezierPath}
        onUndo={undoBezierAnchor}
        onBack={() => { setActivePanel(null); setIsRightPanelOpen(false) }}
      />
    )
  }

  if (activePanel === 'removeBg') {
    return (
      <ToolRemoveBgPanel
        selectedItem={selectedItem}
        isProcessing={isRemoveBgProcessing}
        progress={removeBgProgress}
        onProcess={processRemoveBg}
        onBack={() => { setActivePanel(null); setIsRightPanelOpen(false) }}
      />
    )
  }

  if (selectedItem) {
    if (activeGroupId && selectedItems.length > 1) {
      return (
        <>
          <div className="workspace-panel-heading">
            <span>group selected</span>
            <strong>{selectedItems.length} objects</strong>
          </div>
          <div className="workspace-selection-actions">
            <button
              type="button"
              className="workspace-lock-toggle"
              onClick={lockToggleSelected}
            >
              {areAllLocked ? <Unlock size={15} /> : <Lock size={15} />}
              {areAllLocked ? 'Unlock' : 'Lock'}
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
          <div className="workspace-section-card">
            <div className="workspace-section-title">Group</div>
            <button
              type="button"
              className="workspace-align-btn-modern workspace-group-panel-action"
              title="Pisahkan group"
              onClick={ungroupSelectedItems}
            >
              <Unlink size={18} />
              <span>Pisahkan</span>
              <strong>{selectedItems.length}</strong>
            </button>
          </div>
          {canUseCompositeGroupMode && (
            <div className="workspace-section-card">
              <div className="workspace-section-title">Composite Group</div>
              <div className="workspace-canvas-align-grid-modern workspace-composite-mode-grid">
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'mask' ? 'active' : ''}`}
                  title="Layer paling atas menjadi mask untuk object terpilih di bawahnya"
                  onClick={() => applyCompositeGroupMode('mask')}
                >
                  <Box size={18} />
                  <span>Masking</span>
                </button>
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'exclude' ? 'active' : ''}`}
                  title="Layer paling atas melubangi object terpilih di bawahnya"
                  onClick={() => applyCompositeGroupMode('exclude')}
                >
                  <MinusIcon size={18} />
                  <span>Exclude</span>
                </button>
              </div>
            </div>
          )}
          <div className="workspace-section-card">
            <div className="workspace-section-title">Move</div>
            <div className="workspace-canvas-align-grid-modern">
              <button type="button" className="workspace-align-btn-modern" title="Move Left" onClick={() => moveSelected(-10, 0)}><ArrowLeft size={18} /><span>Left</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Move Right" onClick={() => moveSelected(10, 0)}><ArrowRight size={18} /><span>Right</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Move Up" onClick={() => moveSelected(0, -10)}><ArrowUp size={18} /><span>Up</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Move Down" onClick={() => moveSelected(0, 10)}><ArrowDown size={18} /><span>Down</span></button>
            </div>
          </div>
          <div className="workspace-section-card">
            <div className="workspace-section-title">Layer Position</div>
            <div className="workspace-canvas-align-grid-modern">
              <button type="button" className="workspace-align-btn-modern" title="Bring Forward" onClick={() => bringForward()}><ArrowUp size={18} /><span>Forward</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Send Backward" onClick={() => sendBackward()}><ArrowDown size={18} /><span>Backward</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Bring To Front" onClick={() => bringToFront()}><BringToFront size={18} /><span>To Front</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Send To Back" onClick={() => sendToBack()}><SendToBack size={18} /><span>To Back</span></button>
            </div>
          </div>
          <div className="workspace-section-card">
            <div className="workspace-section-title">Canvas Align</div>
            <div className="workspace-canvas-align-grid-modern">
              <button type="button" className="workspace-align-btn-modern" title="Align Left" onClick={() => alignCanvasItems('left')}><AlignStartHorizontal size={18} /><span>Left</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Align Center" onClick={() => alignCanvasItems('center')}><AlignHorizontalDistributeCenter size={18} /><span>Center</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Align Right" onClick={() => alignCanvasItems('right')}><AlignEndHorizontal size={18} /><span>Right</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Align Top" onClick={() => alignCanvasItems('top')}><AlignStartVertical size={18} /><span>Top</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Align Middle" onClick={() => alignCanvasItems('middle')}><AlignVerticalDistributeCenter size={18} /><span>Middle</span></button>
              <button type="button" className="workspace-align-btn-modern" title="Align Bottom" onClick={() => alignCanvasItems('bottom')}><AlignEndVertical size={18} /><span>Bottom</span></button>
            </div>
          </div>
        </>
      )
    }

    if (isFxPanelOpen) {
      const handleBack = () => setIsFxPanelOpen(false)
      return (
        <FxPanel
          item={selectedItem}
          onBack={handleBack}
          onUpdate={updateItem}
        />
      )
    }

    if (isMorePanelOpen) {
      const handleBack = () => setIsMorePanelOpen(false)
      return (
        <>
          <div className="workspace-font-picker-header">
            <button type="button" className="workspace-back-button" onClick={handleBack}>
              <ArrowLeft size={16} />
            </button>
            <div className="workspace-color-picker-title">More Options</div>
          </div>

          <div className="workspace-section-card">
            <div className="workspace-section-title">Move</div>
            <div className="workspace-canvas-align-grid-modern">
              <button type="button" className="workspace-align-btn-modern" title="Move Left"
                onClick={() => moveSelected(-10, 0)}>
                <ArrowLeft size={18} /><span>Left</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Move Right"
                onClick={() => moveSelected(10, 0)}>
                <ArrowRight size={18} /><span>Right</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Move Up"
                onClick={() => moveSelected(0, -10)}>
                <ArrowUp size={18} /><span>Up</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Move Down"
                onClick={() => moveSelected(0, 10)}>
                <ArrowDown size={18} /><span>Down</span>
              </button>
            </div>
          </div>

          <div className="workspace-section-card">
            <div className="workspace-section-title">Group</div>
            <button
              type="button"
              className="workspace-align-btn-modern workspace-group-panel-action"
              title={activeSelectionCount > 1 ? 'Kelompokkan object terpilih' : 'Aktifkan group selection'}
              onClick={activeGroupId && activeSelectionCount > 1 ? ungroupSelectedItems : handleGroupSelectionAction}
            >
              {activeGroupId && activeSelectionCount > 1 ? <Unlink size={18} /> : <GroupIcon size={18} />}
              <span>{activeGroupId && activeSelectionCount > 1 ? 'Pisahkan' : activeSelectionCount > 1 ? 'Kelompokkan' : 'Group'}</span>
              {activeSelectionCount > 1 && <strong>{activeSelectionCount}</strong>}
            </button>
          </div>

          {canUseCompositeGroupMode && (
            <div className="workspace-section-card">
              <div className="workspace-section-title">{activeSelectionCount > 1 ? 'Composite Group' : 'Masking & Exclude'}</div>
              <div className="workspace-canvas-align-grid-modern workspace-composite-mode-grid">
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'mask' ? 'active' : ''}`}
                  title={activeSelectionCount > 1 ? 'Layer paling atas menjadi mask untuk object terpilih di bawahnya' : 'Layer ini menjadi mask untuk layer di bawahnya'}
                  onClick={() => applyCompositeGroupMode('mask')}
                >
                  <Box size={18} />
                  <span>Masking</span>
                </button>
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'exclude' ? 'active' : ''}`}
                  title={activeSelectionCount > 1 ? 'Layer paling atas melubangi object terpilih di bawahnya' : 'Layer ini melubangi layer di bawahnya'}
                  onClick={() => applyCompositeGroupMode('exclude')}
                >
                  <MinusIcon size={18} />
                  <span>Exclude</span>
                </button>
              </div>
            </div>
          )}

          <div className="workspace-section-card">
            <div className="workspace-section-title">Layer Position</div>
            <div className="workspace-canvas-align-grid-modern">
              <button type="button" className="workspace-align-btn-modern" title="Bring Forward"
                onClick={() => bringForward()}>
                <ArrowUp size={18} /><span>Forward</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Send Backward"
                onClick={() => sendBackward()}>
                <ArrowDown size={18} /><span>Backward</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Bring To Front"
                onClick={() => bringToFront()}>
                <BringToFront size={18} /><span>To Front</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Send To Back"
                onClick={() => sendToBack()}>
                <SendToBack size={18} /><span>To Back</span>
              </button>
            </div>
          </div>

          <div className="workspace-section-card">
            <div className="workspace-section-title">Canvas Align</div>
            <div className="workspace-canvas-align-grid-modern">
              <button type="button" className="workspace-align-btn-modern" title="Align Left"
                onClick={() => alignCanvasItems('left')}>
                <AlignStartHorizontal size={18} /><span>Left</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Align Center"
                onClick={() => alignCanvasItems('center')}>
                <AlignHorizontalDistributeCenter size={18} /><span>Center</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Align Right"
                onClick={() => alignCanvasItems('right')}>
                <AlignEndHorizontal size={18} /><span>Right</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Align Top"
                onClick={() => alignCanvasItems('top')}>
                <AlignStartVertical size={18} /><span>Top</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Align Middle"
                onClick={() => alignCanvasItems('middle')}>
                <AlignVerticalDistributeCenter size={18} /><span>Middle</span>
              </button>
              <button type="button" className="workspace-align-btn-modern" title="Align Bottom"
                onClick={() => alignCanvasItems('bottom')}>
                <AlignEndVertical size={18} /><span>Bottom</span>
              </button>
            </div>
          </div>
        </>
      )
    }

    const supportsRadius = ['image', 'note', 'card', 'palette'].includes(selectedItem.kind)
    const supportsShadow = ['image', 'text', 'shape'].includes(selectedItem.kind) && !selectedItem.isAdjustmentLayer

    return (
      <>
        <div className="workspace-panel-heading" style={{ position: 'relative' }}>
          <span>{selectedItem.kind} selected</span>
          {isRenamingTitle ? (
            <input
              type="text"
              defaultValue={renamingTitleValue}
              autoFocus
              style={{ fontSize: '13px', fontWeight: 600, padding: '2px 6px', border: '1px solid #7c6df2', borderRadius: '4px', background: '#1a1721', color: '#e6e1ed', outline: 'none', width: '100%' }}
              onBlur={(e) => {
                const val = e.target.value.trim()
                const oldId = selectedItem.id
                if (val && val !== oldId) {
                  updateItem(oldId, { id: val })
                  setSelectedId(val)
                  setSelectedIds((prev) => prev.map((id) => (id === oldId ? val : id)))
                  requestAnimationFrame(() => attachTransformer(val))
                }
                setIsRenamingTitle(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setIsRenamingTitle(false)
              }}
            />
          ) : (
            <strong style={{ cursor: 'text' }} onDoubleClick={() => { setIsRenamingTitle(true); setRenamingTitleValue(selectedItem.id) }}>
              {selectedItem.id}
            </strong>
          )}
          <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setIsFxPanelOpen(true)}
              style={{ background: 'transparent', border: 'none', color: '#a09ca6', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex' }}
            >
              <Sparkles size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsMorePanelOpen(true)}
              style={{ background: 'transparent', border: 'none', color: '#a09ca6', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex' }}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
        <div className="workspace-selection-actions">
          <button
            type="button"
            className="workspace-lock-toggle"
            onClick={lockToggleSelected}
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
          {['x', 'y'].map((field) => (
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
          {selectedItem.kind === 'image' ? (
            <div className="workspace-size-row">
              <div className="workspace-aspect-lock-cell">
                <button
                  type="button"
                  className="workspace-aspect-lock-toggle"
                  onClick={() => updateItem(selectedItem.id, { lockAspectRatio: !selectedItem.lockAspectRatio })}
                  title={selectedItem.lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                >
                  {selectedItem.lockAspectRatio ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>
              <label>
                w
                <input
                  type="number"
                  value={Math.round((selectedItem.w ?? 0) * 100) / 100}
                  step={1}
                  onChange={(event) => {
                    const newW = Number(event.target.value)
                    if (selectedItem.lockAspectRatio && selectedItem.h > 0) {
                      const ratio = selectedItem.w / selectedItem.h
                      updateItem(selectedItem.id, { w: newW, h: Math.round(newW / ratio) })
                    } else {
                      updateItem(selectedItem.id, { w: newW })
                    }
                  }}
                />
              </label>
              <label>
                h
                <input
                  type="number"
                  value={Math.round((selectedItem.h ?? 0) * 100) / 100}
                  step={1}
                  onChange={(event) => {
                    const newH = Number(event.target.value)
                    if (selectedItem.lockAspectRatio && selectedItem.w > 0) {
                      const ratio = selectedItem.w / selectedItem.h
                      updateItem(selectedItem.id, { h: newH, w: Math.round(newH * ratio) })
                    } else {
                      updateItem(selectedItem.id, { h: newH })
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            ['w', 'h'].map((field) => (
              <label key={field}>
                {field}
                <input
                  type="number"
                  value={Math.round((selectedItem[field] ?? 0) * 100) / 100}
                  step={1}
                  onChange={(event) => updateItem(selectedItem.id, { [field]: Number(event.target.value) })}
                />
              </label>
            ))
          )}
          {['rotation'].map((field) => (
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
            <button
              type="button"
              className={`workspace-adjustment-card ${isImageAdjustmentsOpen ? 'active' : ''}`}
              aria-expanded={isImageAdjustmentsOpen}
              onClick={() => setIsImageAdjustmentsOpen((current) => !current)}
            >
              <span className="workspace-adjustment-card-icon"><SlidersHorizontal size={16} /></span>
              <span>
                <strong>Adjustment</strong>
                <small>Color, light, tone, and blur</small>
              </span>
              <ChevronDown size={16} className="workspace-adjustment-card-chevron" />
            </button>
            {isImageAdjustmentsOpen && (
              <div className="workspace-adjustment-content">
            <div className="workspace-filter-row">
              <button type="button" onClick={() => updateItem(selectedItem.id, { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: 8, contrast: 12, saturation: 8, sharpen: 0, vignette: 0, blur: 0, shadow: 0 })}>Cinematic</button>
              <button type="button" onClick={() => updateItem(selectedItem.id, { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: -4, contrast: -8, saturation: -22, sharpen: 0, vignette: 0, blur: 0, shadow: 0 })}>Muted</button>
              <button type="button" onClick={() => updateItem(selectedItem.id, { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: 10, contrast: -6, saturation: 16, sharpen: 0, vignette: 0, blur: 1, shadow: 0 })}>Dreamy</button>
              <button type="button" onClick={() => updateItem(selectedItem.id, { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: -8, contrast: 28, saturation: -100, sharpen: 0, vignette: 0, blur: 0, shadow: 0 })}>Noir</button>
              <button type="button" onClick={() => updateItem(selectedItem.id, { exposure: 0, temperature: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: 4, contrast: 18, saturation: 28, sharpen: 0, vignette: 0, blur: 0, shadow: 0 })}>Vibrant</button>
            </div>
<div className="workspace-slider-list">
  {[
    { key: 'exposure', label: 'Exposure', min: -100, max: 100, value: selectedItem.exposure ?? 0, unit: '' },
    { key: 'temperature', label: 'Temperature', min: -100, max: 100, value: selectedItem.temperature ?? 0, unit: '' },
    { key: 'hue', label: 'Hue', min: -180, max: 180, value: selectedItem.hue ?? 0, unit: '°' },
    { key: 'highlights', label: 'Highlights', min: -100, max: 100, value: selectedItem.highlights ?? 0, unit: '' },
    { key: 'shadows', label: 'Shadows', min: -100, max: 100, value: selectedItem.shadows ?? 0, unit: '' },
    { key: 'whites', label: 'Whites', min: -100, max: 100, value: selectedItem.whites ?? 0, unit: '' },
    { key: 'blacks', label: 'Blacks', min: -100, max: 100, value: selectedItem.blacks ?? 0, unit: '' },
    { key: 'brightness', label: 'Brightness', min: -100, max: 100, value: selectedItem.brightness ?? 0, unit: '%' },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100, value: selectedItem.contrast ?? 0, unit: '' },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100, value: selectedItem.saturation ?? 0, unit: '%' },
    { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, value: selectedItem.sharpen ?? 0, unit: '' },
    { key: 'vignette', label: 'Vignette', min: 0, max: 100, value: selectedItem.vignette ?? 0, unit: '' },
    { key: 'blur', label: 'Blur', min: 0, max: 24, value: selectedItem.blur ?? 0, unit: 'px' },
  ].map((control) => (
    <label key={control.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>
          {control.label}
        </span>
        {editingSliderKey === control.key ? (
          <input
            type="number"
            defaultValue={control.value}
            min={control.min}
            max={control.max}
            autoFocus
            style={{ width: '52px', fontSize: '11px', textAlign: 'right', padding: '1px 4px', border: '1px solid #7c6df2', borderRadius: '4px', background: '#1a1721', color: '#c4bfd4', outline: 'none' }}
            onBlur={(e) => {
              const val = Math.max(control.min, Math.min(control.max, Number(e.target.value)))
              updateItem(selectedItem.id, { [control.key]: val })
              setEditingSliderKey(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditingSliderKey(null)
            }}
          />
        ) : (
          <span
            style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right', cursor: 'text' }}
            onDoubleClick={() => setEditingSliderKey(control.key)}
          >
            {control.value}{control.unit}
          </span>
        )}
      </div>
      <input
        type="range"
        min={control.min}
        max={control.max}
        value={control.value}
        className={control.key === 'temperature' ? 'slider-temperature' : control.key === 'hue' ? 'slider-hue' : ''}
        style={control.key === 'hue' ? {
          '--hue-track': `linear-gradient(to right,
            hsl(${control.value + 180}, 100%, 50%),
            hsl(${control.value + 270}, 100%, 50%),
            hsl(${control.value + 360}, 100%, 50%),
            hsl(${control.value + 450}, 100%, 50%),
            hsl(${control.value + 540}, 100%, 50%)
          )`,
        } : {}}
        onChange={(event) => updateItem(selectedItem.id, { [control.key]: Number(event.target.value) })}
      />
    </label>
  ))}
              <button
                type="button"
                className="workspace-reset-adjustments"
                onClick={() => updateItem(selectedItem.id, { exposure: 0, temperature: 0, hue: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, brightness: 0, contrast: 0, saturation: 0, sharpen: 0, vignette: 0, blur: 0, shadow: 0, radius: 0 })}
              >
                Reset adjustments
              </button>
            </div>
              </div>
            )}
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
        {selectedItem.kind === 'image' && (
          <div className="workspace-section-card">
            <div className="workspace-section-title">Stroke</div>
            <label className="workspace-shadow-toggle">
              <input
                type="checkbox"
                checked={!!selectedItem.imageStrokeEnabled && (selectedItem.imageStrokeWidth ?? 0) > 0}
                onChange={(event) => {
                  if (event.target.checked) {
                    updateItem(selectedItem.id, {
                      imageStrokeEnabled: true,
                      imageStrokeColor: selectedItem.imageStrokeColor || '#ffffff',
                      imageStrokeWidth: selectedItem.imageStrokeWidth || 3,
                    })
                  } else {
                    updateItem(selectedItem.id, { imageStrokeEnabled: false, imageStrokeWidth: 0 })
                  }
                }}
              />
              <span className="toggle-track" />
              <span className="toggle-label">Enable Stroke</span>
            </label>
            {!!selectedItem.imageStrokeEnabled && (selectedItem.imageStrokeWidth ?? 0) > 0 && (
              <div className="workspace-slider-list">
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>Color</span>
                  <button
                    type="button"
                    className="workspace-color-preview-button"
                    style={{
                      background: selectedItem.imageStrokeGradientType === 'linear' && selectedItem.imageStrokeGradientStops
                        ? `linear-gradient(90deg, ${selectedItem.imageStrokeGradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                        : selectedItem.imageStrokeGradientType === 'radial' && selectedItem.imageStrokeGradientStops
                          ? `radial-gradient(circle, ${selectedItem.imageStrokeGradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                          : selectedItem.imageStrokeColor || '#ffffff'
                    }}
                    onClick={() => {
                      setColorPickerTarget('imageStroke')
                      setIsColorPickerOpen(true)
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>Width</span>
                    <span style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right' }}>
                      {selectedItem.imageStrokeWidth ?? 3}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={selectedItem.imageStrokeWidth ?? 3}
                    onChange={(event) => updateItem(selectedItem.id, {
                      imageStrokeEnabled: true,
                      imageStrokeWidth: Number(event.target.value),
                    })}
                  />
                </label>
                <label className="workspace-shadow-toggle" title="Untuk PNG atau gambar transparan, stroke mengikuti alpha/bentuk objek.">
                  <input
                    type="checkbox"
                    checked={!!selectedItem.imageStrokeMaskEnabled}
                    onChange={(event) => updateItem(selectedItem.id, { imageStrokeMaskEnabled: event.target.checked })}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-label">Mask ke bentuk objek</span>
                </label>
              </div>
            )}
          </div>
        )}
        {supportsShadow && (
          <div className="workspace-section-card">
            <div className="workspace-section-title">Drop Shadow</div>
            <label className="workspace-shadow-toggle">
              <input
                type="checkbox"
                checked={!!selectedItem.shadowEnabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateItem(selectedItem.id, { shadowEnabled: true, shadow: 15, shadowOpacity: 0.35, shadowOffsetX: 0, shadowOffsetY: 4, shadowColor: '#050505' })
                  } else {
                    updateItem(selectedItem.id, { shadowEnabled: false })
                  }
                }}
              />
              <span className="toggle-track" />
              <span className="toggle-label">Enable Shadow</span>
            </label>
            {selectedItem.shadowEnabled && (
              <div className="workspace-slider-list">
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>Color</span>
                  <input
                    type="color"
                    className="workspace-shadow-color"
                    value={selectedItem.shadowColor || '#050505'}
                    onChange={(e) => updateItem(selectedItem.id, { shadowColor: e.target.value })}
                  />
                </label>
                {[
                  { key: 'shadow', label: 'Blur', min: 0, max: 100, value: selectedItem.shadow ?? 15, unit: '' },
                  { key: 'shadowOpacity', label: 'Opacity', min: 0, max: 100, value: Math.round((selectedItem.shadowOpacity ?? 0.35) * 100), unit: '%' },
                  { key: 'shadowOffsetX', label: 'Offset X', min: -50, max: 50, value: selectedItem.shadowOffsetX ?? 0, unit: '' },
                  { key: 'shadowOffsetY', label: 'Offset Y', min: -50, max: 50, value: selectedItem.shadowOffsetY ?? 4, unit: '' },
                ].map((ctrl) => (
                  <label key={ctrl.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>{ctrl.label}</span>
                      {editingSliderKey === ctrl.key ? (
                        <input
                          type="number"
                          defaultValue={ctrl.value}
                          min={ctrl.min}
                          max={ctrl.max}
                          autoFocus
                          style={{ width: '52px', fontSize: '11px', textAlign: 'right', padding: '1px 4px', border: '1px solid #7c6df2', borderRadius: '4px', background: '#1a1721', color: '#c4bfd4', outline: 'none' }}
                          onBlur={(e) => {
                            const val = Math.max(ctrl.min, Math.min(ctrl.max, Number(e.target.value)))
                            updateItem(selectedItem.id, { [ctrl.key]: ctrl.key === 'shadowOpacity' ? val / 100 : val })
                            setEditingSliderKey(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur()
                            if (e.key === 'Escape') setEditingSliderKey(null)
                          }}
                        />
                      ) : (
                        <span
                          style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right', cursor: 'text' }}
                          onDoubleClick={() => setEditingSliderKey(ctrl.key)}
                        >
                          {ctrl.value}{ctrl.unit}
                        </span>
                      )}
                    </div>
                    <input
                      type="range"
                      min={ctrl.min}
                      max={ctrl.max}
                      value={ctrl.value}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        updateItem(selectedItem.id, { [ctrl.key]: ctrl.key === 'shadowOpacity' ? val / 100 : val })
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {selectedItem.kind === 'image' && (
          <button
            type="button"
            className="workspace-adjustment-card"
            onClick={() => beginImageCrop(selectedItem.id)}
          >
            <span className="workspace-adjustment-card-icon"><Crop size={16} /></span>
            <span>
              <strong>Pangkas</strong>
              <small>Resize crop frame bebas atau pakai preset</small>
            </span>
            <ChevronDown size={16} className="workspace-adjustment-card-chevron" />
          </button>
        )}
{selectedItem.kind === 'shape' && (() => {
  const isShapeAdjustmentLayer = selectedItem.isAdjustmentLayer
  return (
    <>
      <div className="workspace-section-card">
        <div className="workspace-section-title">Shape Style</div>

        <label className="workspace-shadow-toggle" style={{ marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={!!isShapeAdjustmentLayer}
            onChange={(e) => {
              if (e.target.checked) {
                updateItem(selectedItem.id, {
                  isAdjustmentLayer: true,
                  compositeMode: null,
                  fill: null,
                  stroke: null,
                  strokeWidth: 0,
                  exposure: 0, temperature: 0, highlights: 0, shadows: 0,
                  whites: 0, blacks: 0, brightness: 0, contrast: 0,
                  saturation: 0, sharpen: 0, vignette: 0, blur: 0,
                  effects: getDefaultEffects(),
                })
              } else {
                updateItem(selectedItem.id, { isAdjustmentLayer: false })
              }
            }}
          />
          <span className="toggle-track" />
          <span className="toggle-label">Jadikan Adjustment Layer</span>
        </label>

        {isShapeAdjustmentLayer ? (
          <AdjustmentSliders item={selectedItem} onChange={(id, patch) => updateItem(id, patch)} />
        ) : (
          <>
            <div className="workspace-typography-grid">
              <label className="workspace-typography-field">
                Fill Color
                <button
                  type="button"
                  className={`workspace-color-preview-button ${selectedItem.fill === null ? 'workspace-color-preview-none' : ''}`}
                  style={{
                    background: selectedItem.fill === null
                      ? 'transparent'
                      : selectedItem.gradientType === 'linear' && selectedItem.gradientStops
                        ? `linear-gradient(90deg, ${selectedItem.gradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                        : selectedItem.gradientType === 'radial' && selectedItem.gradientStops
                          ? `radial-gradient(circle, ${selectedItem.gradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                          : selectedItem.fill || '#a78bfa'
                  }}
                  onClick={() => {
                    setColorPickerTarget('fill')
                    setIsColorPickerOpen(true)
                  }}
                >
                  {selectedItem.fill === null && <span className="workspace-color-preview-none-icon"></span>}
                </button>
              </label>
              <label className="workspace-typography-field">
                Stroke Color
                <button
                  type="button"
                  className={`workspace-color-preview-button ${selectedItem.stroke === null ? 'workspace-color-preview-none' : ''}`}
                  style={{ background: selectedItem.stroke || 'transparent' }}
                  onClick={() => {
                    setColorPickerTarget('stroke')
                    setIsColorPickerOpen(true)
                  }}
                >
                  {selectedItem.stroke === null && <span className="workspace-color-preview-none-icon"></span>}
                </button>
              </label>
            </div>

            <label className="workspace-typography-field workspace-typography-field-full">
              Stroke Width
              <input
                type="number"
                min="0"
                max="40"
                value={selectedItem.strokeWidth ?? 0}
                onChange={(event) => updateItem(selectedItem.id, {
                  strokeWidth: Number(event.target.value),
                  stroke: Number(event.target.value) > 0 && selectedItem.stroke === null ? '#3f3a46' : selectedItem.stroke,
                })}
              />
            </label>

            {selectedItem.shapeType === 'star' && (
              <>
                <label className="workspace-typography-field workspace-typography-field-full">
                  Jumlah Titik
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={selectedItem.numPoints || 5}
                    onChange={(event) => updateItem(selectedItem.id, { numPoints: Math.max(3, Math.min(20, Number(event.target.value))) })}
                  />
                </label>
                <label className="workspace-typography-field workspace-typography-field-full">
                  Kelancipan
                  <div className="workspace-opacity-control">
                    <input
                      type="range"
                      min="5"
                      max="48"
                      value={Math.round((selectedItem.starInnerRatio ?? 0.25) * 100)}
                      onChange={(event) => updateItem(selectedItem.id, { starInnerRatio: Number(event.target.value) / 100 })}
                      className="workspace-opacity-slider"
                    />
                    <input
                      type="number"
                      min="5"
                      max="48"
                      value={Math.round((selectedItem.starInnerRatio ?? 0.25) * 100)}
                      onChange={(event) => updateItem(selectedItem.id, { starInnerRatio: Math.max(0.05, Math.min(0.48, Number(event.target.value) / 100)) })}
                      className="workspace-opacity-input"
                    />
                    <span className="workspace-opacity-unit">%</span>
                  </div>
                </label>
              </>
            )}

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

            <label className="workspace-typography-field workspace-typography-field-full">
              Blend Mode
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="workspace-font-picker-trigger"
                  onClick={() => setIsBlendModeOpen(!isBlendModeOpen)}
                >
                  {(BLEND_MODES.find((m) => m.value === (selectedItem.blendMode || 'source-over'))?.label) || 'Normal'}
                </button>
                {isBlendModeOpen && (
                  <div className="workspace-blend-mode-dropdown">
                    {BLEND_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        className={`workspace-blend-mode-item ${(selectedItem.blendMode === mode.value || (!selectedItem.blendMode && mode.value === 'source-over')) ? 'active' : ''}`}
                        onClick={() => {
                          updateItem(selectedItem.id, { blendMode: mode.value === 'source-over' ? undefined : mode.value })
                          setIsBlendModeOpen(false)
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </>
        )}
      </div>

      {!isShapeAdjustmentLayer && (
        <div className="workspace-section-card">
          <div className="workspace-section-title">Shape Text</div>

          {/* Font */}
          <label className="workspace-typography-field workspace-typography-field-full">
            Font
            <button
              type="button"
              className="workspace-font-picker-trigger"
              onClick={() => setIsFontPickerOpen(true)}
            >
              {(apiFonts || []).find((f) => f.family === selectedItem.fontFamily)?.name || availableFonts.find((f) => f.family === selectedItem.fontFamily)?.name || 'Inter'}
            </button>
          </label>

          {/* Size */}
          <label className="workspace-typography-field workspace-typography-field-full">
            Size
            <input
              type="number"
              min="8"
              max="180"
              value={selectedItem.shapeTextFontSize || 16}
              onChange={(event) => {
                const newFontSize = Number(event.target.value)
                const { minW, minH } = getShapeMinSizeForText(
                  selectedItem,
                  selectedItem.shapeText || '',
                  newFontSize
                )
                const patch = { shapeTextFontSize: newFontSize }
                if (selectedItem.w < minW) patch.w = minW
                if (selectedItem.h < minH) patch.h = minH
                updateItem(selectedItem.id, patch)
              }}
            />
          </label>

          {/* Text Fill — pakai color picker yang sama dengan shape fill */}
          <label className="workspace-typography-field workspace-typography-field-full">
            Text Color
            <button
              type="button"
              className="workspace-color-preview-button"
              style={{ background: selectedItem.shapeTextFill || '#231c2f' }}
              onClick={() => {
                setColorPickerTarget('shapeText')
                setIsColorPickerOpen(true)
              }}
            />
          </label>

          {/* Bold / Italic */}
          <div className="workspace-style-toolbar" style={{ marginTop: '4px' }}>
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
          </div>

          {/* Text Align */}
          <div className="workspace-style-toolbar" style={{ marginTop: '8px' }}>
            <button
              type="button"
              className={`workspace-style-btn ${(selectedItem.shapeTextAlign || 'center') === 'left' ? 'active' : ''}`}
              onClick={() => updateItem(selectedItem.id, { shapeTextAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              type="button"
              className={`workspace-style-btn ${(selectedItem.shapeTextAlign || 'center') === 'center' ? 'active' : ''}`}
              onClick={() => updateItem(selectedItem.id, { shapeTextAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              type="button"
              className={`workspace-style-btn ${(selectedItem.shapeTextAlign || 'center') === 'right' ? 'active' : ''}`}
              onClick={() => updateItem(selectedItem.id, { shapeTextAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
          </div>
        </div>
      )}

    </>
  )
})()}

        {selectedItem.kind === 'frame' && (
          <div className="workspace-frame-controls">
            <div className="workspace-section-title">Frame Image</div>
            {!selectedItem.frameImageSrc ? (
              <button
                type="button"
                className="workspace-frame-add-image"
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
                <Plus size={16} />
                Add Image to Frame
              </button>
            ) : (
              <>
                <div className="workspace-frame-image-preview">
                  <img src={selectedItem.frameImageSrc} alt="Frame content" crossOrigin="anonymous" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                </div>
 
                {/* FIX: Edit Position button — masuk ke edit mode */}
                <button
                  type="button"
                  className="workspace-frame-edit-position"
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '8px',
                    background: editingFrameId === selectedItem.id
                      ? 'rgba(59,130,246,0.18)'
                      : 'rgba(255,255,255,0.06)',
                    border: editingFrameId === selectedItem.id
                      ? '1px solid rgba(59,130,246,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: editingFrameId === selectedItem.id ? '#60a5fa' : '#c4bfd4',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => {
                    if (editingFrameId === selectedItem.id) {
                      finishFrameImageEdit()
                    } else {
                      handleFrameImageEdit(selectedItem.id)
                    }
                  }}
                >
                  {editingFrameId === selectedItem.id ? (
                    <>✓ Selesai Atur Posisi</>
                  ) : (
                    <>✋ Atur Posisi Gambar</>
                  )}
                </button>
 
                {/* FIX: Image Scale / Zoom slider */}
                <div className="workspace-slider-list" style={{ marginTop: '12px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#a09ca6' }}>
                    <span>Zoom Gambar</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="100"
                        max="300"
                        step="1"
                        value={Math.round((selectedItem.frameImageScale || 1) * 100)}
                        onChange={(event) => {
  const newScale = Number(event.target.value) / 100
 
  if (selectedItem.frameImageSrc) {
    const imgEl = new window.Image()
    imgEl.crossOrigin = 'anonymous'
    imgEl.src = selectedItem.frameImageSrc
 
    const imgW = imgEl.naturalWidth || 800
    const imgH = imgEl.naturalHeight || 600
 
    const frameSlotForCalc = getResolvedFrameSlot(selectedItem)
 
    // Hitung minimum zoom (cover) — tidak boleh di bawah ini
    const minZoom = getMinFrameImageZoom({
      imageWidth: imgW,
      imageHeight: imgH,
      slot: frameSlotForCalc,
      fit: selectedItem.frameImageFit || 'cover',
    })
 
    // Clamp: min = cover, max = 300% dari cover
    const clampedScale = Math.max(minZoom, newScale)
 
    const clampedPos = clampFrameImagePosition({
      imageWidth: imgW,
      imageHeight: imgH,
      slot: frameSlotForCalc,
      fit: selectedItem.frameImageFit || 'cover',
      zoom: clampedScale,
      position: selectedItem.frameImagePosition,
    })
 
    updateItem(selectedItem.id, {
      frameImageScale: clampedScale,
      frameImagePosition: clampedPos,
    })
  } else {
    updateItem(selectedItem.id, { frameImageScale: newScale })
  }
}}
                        style={{ flex: 1 }}
                      />
                      <span style={{ minWidth: '36px', textAlign: 'right', color: '#fff', fontSize: '12px' }}>
                        {Math.round((selectedItem.frameImageScale || 1) * 100)}%
                      </span>
                    </div>
                  </label>
 
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#a09ca6', marginTop: '8px' }}>
                    <span>Image Fit</span>
                    <select
                      value={selectedItem.frameImageFit || 'cover'}
                      onChange={(event) => updateItem(selectedItem.id, { frameImageFit: event.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px' }}
                    >
                      <option value="cover">Cover (Fill Frame)</option>
                      <option value="contain">Contain (Fit Inside)</option>
                    </select>
                  </label>
 
                  {/* Reset Position button */}
                  <button
                    type="button"
                    onClick={() => updateItem(selectedItem.id, {
                      frameImagePosition: { x: 0, y: 0 },
                      frameImageScale: 1,
                    })}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '7px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      color: '#a09ca6',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ↺ Reset Posisi & Zoom
                  </button>
                </div>
 
                <div className="workspace-frame-image-actions" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="workspace-frame-replace-image"
                    style={{ flex: 1 }}
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
                    Replace
                  </button>
                  <button
                    type="button"
                    className="workspace-frame-remove-image"
                    style={{ flex: 1 }}
                    onClick={() => {
                      updateItem(selectedItem.id, {
                        frameImageSrc: null,
                        frameImage: null,
                        frameImageScale: 1,
                        frameImagePosition: { x: 0, y: 0 },
                      })
                    }}
                  >
                    Remove
                  </button>
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
                  {(apiFonts || []).find((f) => f.family === selectedItem.fontFamily)?.name || availableFonts.find((f) => f.family === selectedItem.fontFamily)?.name || 'Inter'}
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

              <label className="workspace-typography-field workspace-typography-field-full">
                Blend Mode
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="workspace-font-picker-trigger"
                    onClick={() => setIsBlendModeOpen(!isBlendModeOpen)}
                  >
                    {(BLEND_MODES.find((m) => m.value === (selectedItem.blendMode || 'source-over'))?.label) || 'Normal'}
                  </button>
                  {isBlendModeOpen && (
                    <div className="workspace-blend-mode-dropdown">
                      {BLEND_MODES.map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          className={`workspace-blend-mode-item ${(selectedItem.blendMode === mode.value || (!selectedItem.blendMode && mode.value === 'source-over')) ? 'active' : ''}`}
                          onClick={() => {
                            updateItem(selectedItem.id, { blendMode: mode.value === 'source-over' ? undefined : mode.value })
                            setIsBlendModeOpen(false)
                          }}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  )}
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

          </>
        )}
      </>
    )
  }

  if (!activePanel) {
    return null
  }

  if (activePanel === 'assets') {
    return (
      <>
        <div className="workspace-panel-tabs">
          <button type="button" className={assetTab === 'boards' ? 'active' : ''} onClick={() => { setAssetTab('boards'); setAssetSubView(null); setSelectedBoardId(null); setSelectedBoardItem(null) }}>Boards</button>
          <button type="button" className={assetTab === 'assets' ? 'active' : ''} onClick={() => { setAssetTab('assets'); setAssetSubView(null); setSelectedBoardId(null); setSelectedBoardItem(null) }}>Assets</button>
        </div>

        {assetTab === 'boards' && !selectedBoardId && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <div className="workspace-elements-title">Boards</div>
              {isAuthenticated && <button type="button" className="workspace-refresh-button" onClick={refreshDatabaseBoards} disabled={isBoardsLoading}>Refresh</button>}
            </div>
            {!isAuthenticated && <div className="workspace-upload-hint">Login untuk membuka board tersimpan.</div>}
            {boardsError && <div className="workspace-upload-error"><span>{boardsError}</span></div>}
            {isBoardsLoading ? <div className="workspace-upload-empty">Memuat boards...</div> : databaseBoards.length ? renderDatabaseBoards() : <div className="workspace-upload-empty">Belum ada board.</div>}
          </div>
        )}

        {assetTab === 'boards' && selectedBoardId && !selectedBoardItem && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <button type="button" className="workspace-back-button" onClick={() => setSelectedBoardId(null)}><ArrowLeft size={16} /></button>
              <div className="workspace-elements-title">{selectedBoard?.name || 'Board'}</div>
            </div>
            {selectedBoard?.items?.length ? renderBoardItems() : <div className="workspace-upload-empty">Board masih kosong.</div>}
          </div>
        )}

        {assetTab === 'boards' && selectedBoardId && selectedBoardItem && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <button type="button" className="workspace-back-button" onClick={() => setSelectedBoardItem(null)}><ArrowLeft size={16} /></button>
              <div className="workspace-elements-title">Pilih Gambar</div>
            </div>
            <p className="workspace-upload-hint">{selectedBoardItem.title}</p>
            {renderAssetGrid(getBoardItemAssets(selectedBoardItem, selectedBoard))}
          </div>
        )}

        {assetTab === 'assets' && !assetSubView && (
          <div className="workspace-asset-home-grid">
            <button type="button" className="workspace-asset-home-card" onClick={() => setAssetSubView('uploads')}>
              <span className="workspace-asset-home-icon"><Plus size={22} /></span>
              <strong>Unggahan</strong>
              <small>Gambar yang kamu tambahkan</small>
            </button>
            <button type="button" className="workspace-asset-home-card" onClick={() => setAssetSubView('browse')}>
              <span className="workspace-asset-home-icon"><Search size={22} /></span>
              <strong>Browse Asset</strong>
              <small>Cari visual dari library</small>
            </button>
          </div>
        )}

        {assetTab === 'assets' && assetSubView === 'uploads' && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <button type="button" className="workspace-back-button" onClick={() => setAssetSubView(null)}><ArrowLeft size={16} /></button>
              <div className="workspace-elements-title">Unggahan</div>
              {isAuthenticated && (
                <button type="button" className="workspace-refresh-button" onClick={refreshUploads} disabled={isUploadsLoading || isUploading || deletingMediaIds.size > 0}>
                  Refresh
                </button>
              )}
            </div>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="workspace-upload-input"
              onChange={(event) => {
                uploadFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <div
              className="workspace-upload-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                if (!requireAuth('login')) return
                uploadFiles(event.dataTransfer.files)
              }}
              onClick={() => {
                if (!requireAuth('login')) return
                uploadInputRef.current?.click()
              }}
            >
              {isUploading ? `Uploading ${uploadProgress}%` : 'Drag image ke sini atau pakai tombol plus'}
            </div>
            {isUploading && (
              <div className="workspace-upload-progress">
                <span style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            {uploadError && (
              <div className="workspace-upload-error">
                <span>{uploadError}</span>
                <button type="button" onClick={retryUpload}>Retry</button>
              </div>
            )}
            {deletingMediaIds.size > 0 && (
              <div className="workspace-upload-empty">Menghapus unggahan...</div>
            )}
            {!isAuthenticated && (
              <p className="workspace-upload-hint">Login untuk menyimpan unggahan ke asset library.</p>
            )}
            {isUploadsLoading ? (
              <div className="workspace-upload-empty">Memuat unggahan...</div>
            ) : uploadAssets.length ? (
              renderAssetGrid(uploadAssets, { onDelete: removeUploadedAsset })
            ) : (
              <div className="workspace-upload-empty">Belum ada unggahan.</div>
            )}
            <button
              type="button"
              className="workspace-upload-fab"
              title="Upload image"
              onClick={() => {
                if (!requireAuth('login')) return
                uploadInputRef.current?.click()
              }}
              disabled={isUploading || deletingMediaIds.size > 0}
            >
              <Plus size={22} />
            </button>
          </div>
        )}

        {assetTab === 'assets' && assetSubView === 'browse' && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <button type="button" className="workspace-back-button" onClick={() => setAssetSubView(null)}><ArrowLeft size={16} /></button>
              <div className="workspace-elements-title">Browse Asset</div>
            </div>
            <label className="workspace-asset-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search asset"
                value={assetSearchQuery}
                onChange={(event) => setAssetSearchQuery(event.target.value)}
              />
              {assetSearchQuery && (
                <button type="button" className="workspace-asset-search-clear" onClick={() => setAssetSearchQuery('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>
            {!assetSearchQuery.trim() && assetContextSignals.length > 0 && (
              <p className="workspace-asset-context-hint">Related to images on canvas</p>
            )}
            {isPublicBrowseLoading && (
              <div className="workspace-upload-empty">Memuat asset feed...</div>
            )}
            {publicBrowseError && (
              <div className="workspace-upload-error"><span>{publicBrowseError}</span></div>
            )}
            {renderAssetGrid(browseAssets)}
            {isBrowseLoadMoreLoading && (
              <div className="workspace-upload-empty">Memuat asset berikutnya...</div>
            )}
            {!isPublicBrowseLoading && !isBrowseLoadMoreLoading && hasMoreBrowseAssets && (
              <button type="button" className="workspace-load-more-assets" onClick={loadMoreBrowseAssets}>
                Load more assets
              </button>
            )}
          </div>
        )}
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
                <ArrowLeft size={16} />
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
                            {shape.shapeType === 'arrow-shape' && (
                              <svg
                                width="56"
                                height="40"
                                viewBox="0 0 56 40"
                                aria-hidden="true"
                                className="workspace-shape-preview-arrow-solid"
                              >
                                <path
                                  d={getArrowShapePath({
                                    w: 56,
                                    h: 40,
                                    arrowVariant: shape.defaultProps.arrowVariant,
                                  })}
                                  fill="#a78bfa"
                                />
                              </svg>
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
                <ArrowLeft size={16} />
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

      if (activeElementCategory === 'Connectors') {
        return (
          <>
            <div className="workspace-elements-header">
              <button
                type="button"
                className="workspace-back-button"
                onClick={() => setActiveElementCategory(null)}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="workspace-elements-title">Connectors</div>
            </div>
            <div className="workspace-shapes-browser">
              <div className="workspace-shapes-category">
                <div className="workspace-shapes-category-header">
                  <span className="workspace-shapes-category-title">Connector Lines</span>
                </div>
                <div className="workspace-shapes-row">
                  {connectorPresets.map((connector) => (
                    <button
                      type="button"
                      key={connector.id}
                      className="workspace-shape-card"
                      onClick={() => {
                        setConnectorDraft(null)
                        setConnectorTool((current) => (current?.id === connector.id ? null : connector))
                      }}
                      style={{
                        borderColor: connectorTool?.id === connector.id ? '#7c6df2' : undefined,
                        boxShadow: connectorTool?.id === connector.id ? '0 0 0 1px rgba(124,109,242,0.45)' : undefined,
                      }}
                    >
                      <div className="workspace-shape-preview">
                        {connector.pathType === 'curve' ? (
                          <div className="workspace-shape-preview-icon">
                            <ArrowUpRightIcon size={32} strokeWidth={1.5} />
                          </div>
                        ) : connector.arrowHead ? (
                          <div className="workspace-shape-preview-icon">
                            <ArrowUpRightIcon size={32} strokeWidth={1.5} />
                          </div>
                        ) : (
                          <div
                            className="workspace-shape-preview-line"
                            style={{
                              width: connector.pathType === 'elbow' ? '42px' : '50px',
                              height: '3px',
                              background: '#7c6df2',
                              borderRadius: '2px',
                            }}
                          />
                        )}
                      </div>
                      <span className="workspace-shape-label">{connector.label}</span>
                    </button>
                  ))}
                </div>
              </div>
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
              <ArrowLeft size={16} />
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
        {['Shapes', 'Frames', 'Connectors'].map((label) => (
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
      {activePanel === 'settings' && (
        <div className="workspace-typography-compact">
          <div className="workspace-section-card">
            <div className="workspace-section-title">Canvas Ratio</div>
            <div className="workspace-style-toolbar" style={{ flexWrap: 'wrap' }}>
              {canvasRatioPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`workspace-style-btn ${canvasSettings.ratio === preset.id ? 'active' : ''}`}
                  onClick={() => resizeCanvas({ width: preset.width, height: preset.height }, preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {canvasSettings.ratio === 'custom' && (
              <div className="workspace-typography-grid">
                <label className="workspace-typography-field">
                  Width
                  <input type="number" min="240" max="4000" value={canvasSettings.width} onChange={(event) => resizeCanvas({ width: Number(event.target.value), height: canvasSettings.height }, 'custom')} />
                </label>
                <label className="workspace-typography-field">
                  Height
                  <input type="number" min="240" max="4000" value={canvasSettings.height} onChange={(event) => resizeCanvas({ width: canvasSettings.width, height: Number(event.target.value) }, 'custom')} />
                </label>
              </div>
            )}
          </div>

          <div className="workspace-section-card">
            <div className="workspace-section-title">Background</div>
            <div className="workspace-style-toolbar">
              {['solid', 'gradient', 'transparent'].map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`workspace-style-btn ${canvasSettings.background.type === type ? 'active' : ''}`}
                  onClick={() => updateCanvasBackground({ type })}
                >
                  {type === 'transparent' ? 'None' : type}
                </button>
              ))}
            </div>
            {canvasSettings.background.type === 'solid' && (
              <label className="workspace-typography-field workspace-typography-field-full">
                Color
                <input type="color" value={canvasSettings.background.color} onChange={(event) => updateCanvasBackground({ color: event.target.value })} />
              </label>
            )}
            {canvasSettings.background.type === 'gradient' && (
              <div className="workspace-typography-grid">
                <label className="workspace-typography-field">
                  From
                  <input type="color" value={canvasSettings.background.from} onChange={(event) => updateCanvasBackground({ from: event.target.value })} />
                </label>
                <label className="workspace-typography-field">
                  To
                  <input type="color" value={canvasSettings.background.to} onChange={(event) => updateCanvasBackground({ to: event.target.value })} />
                </label>
                <label className="workspace-typography-field workspace-typography-field-full">
                  Angle
                  <input type="range" min="0" max="360" value={canvasSettings.background.angle} onChange={(event) => updateCanvasBackground({ angle: Number(event.target.value) })} />
                </label>
              </div>
            )}
          </div>

          <div className="workspace-section-card">
            <div className="workspace-section-title">Grid</div>
            <label className="workspace-toggle-row">
              <input type="checkbox" checked={canvasSettings.showGrid} onChange={(event) => setCanvasSettings((current) => ({ ...current, showGrid: event.target.checked }))} />
              <span className="toggle-track" />
              Show Grid
            </label>
            <label className="workspace-toggle-row">
              <input type="checkbox" checked={canvasSettings.snapToGrid} onChange={(event) => setCanvasSettings((current) => ({ ...current, snapToGrid: event.target.checked }))} />
              <span className="toggle-track" />
              Snap to Grid
            </label>
            <div className="workspace-typography-grid">
              <label className="workspace-typography-field">
                Vertical
                <input type="number" min="0" max="64" value={canvasSettings.gridVertical} onChange={(event) => setCanvasSettings((current) => ({ ...current, gridVertical: Number(event.target.value) }))} />
              </label>
              <label className="workspace-typography-field">
                Horizontal
                <input type="number" min="0" max="64" value={canvasSettings.gridHorizontal} onChange={(event) => setCanvasSettings((current) => ({ ...current, gridHorizontal: Number(event.target.value) }))} />
              </label>
            </div>
          </div>

          <div className="workspace-section-card">
            <label className="workspace-toggle-row">
              <input type="checkbox" checked={canvasSettings.autosave} onChange={(event) => setCanvasSettings((current) => ({ ...current, autosave: event.target.checked }))} />
              <span className="toggle-track" />
              Simpan Otomatis
            </label>
            <label className="workspace-toggle-row">
              <input type="checkbox" checked={canvasSettings.privateWorkspace} onChange={(event) => setCanvasSettings((current) => ({ ...current, privateWorkspace: event.target.checked }))} />
              <span className="toggle-track" />
              Workspace Privat
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Workspace component render
  const saveIndicator = (() => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
    if (isOffline) return { label: 'Offline', state: 'offline', Icon: CloudOff }
    if (!saveStatus) return { label: 'Belum disimpan', state: 'idle', Icon: CloudIcon }
    if (saveStatus === 'Autosaved' || saveStatus === 'Saved') {
      return { label: 'Tersimpan', state: 'success', Icon: CloudCheck }
    }
    if (saveStatus.includes('failed') || saveStatus.includes('gagal') || saveStatus.includes('Gagal')) {
      return { label: 'Gagal simpan', state: 'error', Icon: CloudAlert }
    }
    return { label: 'Menyimpan', state: 'saving', Icon: CloudIcon }
  })()
  const SaveStatusIcon = saveIndicator.Icon
  const renderCanvasStackItems = (stackItems) => {
    const renderedGroups = new Set()
    return [...stackItems].reverse().filter((item) => !item.isAdjustmentLayer).map((item) => {
      const compositeEntry = compositeGroupMap.get(item.id)
      if (compositeEntry) {
        if (renderedGroups.has(compositeEntry.groupId)) return null
        renderedGroups.add(compositeEntry.groupId)
        return (
          <CompositeCanvasGroup
            key={`composite-${compositeEntry.groupId}`}
            entry={compositeEntry}
            items={items}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={handleObjectSelect}
            onChange={(id, patch) => updateItem(id, patch)}
            onDragStart={handleObjectDragStart}
            onDragMove={handleObjectDragMove}
            onDragEnd={handleObjectDragEnd}
            onTextEdit={editTextObject}
            isTextEditing={editingText}
            onCursor={handleItemCursor}
            onItemHover={setHoveredItemId}
            disableDrag={isSpaceDown || isPanning || activePanel === 'brush'}
            isShiftDown={isShiftDown}
            getActiveTransformAnchor={() => transformerRef.current?.getActiveAnchor?.()}
            dropTargetFrameId={dropTargetFrameId}
            dropTargetSlotIndex={dropTargetSlotIndex}
            editingFrameId={editingFrameId}
            editingFrameSlot={editingFrameSlot}
            onFrameImageEdit={handleFrameImageEdit}
            onCropStart={beginImageCrop}
            cropSession={cropSession}
            canvasSize={canvasSize}
            onSyncTransformer={() => {
              transformerRef.current?.forceUpdate?.()
              transformerRef.current?.getLayer()?.batchDraw()
              requestAnimationFrame(updateToolbarPosition)
            }}
          />
        )
      }
      return (
        <CanvasItem
          key={item.id}
          item={item}
          items={items}
          selectedId={selectedId}
          selectedIds={selectedIds}
          onSelect={handleObjectSelect}
          onChange={(patch) => updateItem(item.id, patch)}
          onDragStart={handleObjectDragStart}
          onDragMove={handleObjectDragMove}
          onDragEnd={handleObjectDragEnd}
          onTextEdit={editTextObject}
          isTextEditing={editingText?.id === item.id}
          onCursor={handleItemCursor}
          onItemHover={setHoveredItemId}
          disableDrag={isSpaceDown || isPanning || activePanel === 'brush' || cropSession?.itemId === item.id}
          isShiftDown={isShiftDown}
          getActiveTransformAnchor={() => transformerRef.current?.getActiveAnchor?.()}
          dropTargetFrameId={dropTargetFrameId}
          dropTargetSlotIndex={dropTargetSlotIndex}
          editingFrameId={editingFrameId}
          editingFrameSlot={editingFrameSlot}
          onFrameImageEdit={handleFrameImageEdit}
          onCropStart={beginImageCrop}
          isCropTarget={cropSession?.itemId === item.id}
        />
      )
    })
  }

  if (isWorkspaceLoading || (shouldLoadWorkspace && isAuthLoading)) {
    return (
      <section className="workspace-page workspace-loading-state">
        <div className="workspace-loading-card">Memuat workspace...</div>
      </section>
    )
  }

  if (workspaceError) {
    return (
      <section className="workspace-page workspace-loading-state">
        <div className="workspace-loading-card">{workspaceError}</div>
      </section>
    )
  }

  return (
    <section
      className={`workspace-page ${isRightPanelOpen ? 'panel-open' : 'panel-collapsed'} sheet-${mobileSheetState}`}
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
            setSelectedIds([])
            attachTransformer(null)
            openRightPanel(id)
          }}
        >
          <Icon size={18} strokeWidth={1.7} />
        </button>
      ))}
      <span />
      {toolItems.map(({ id, label, icon: Icon }) => (
        <button
          type="button"
          className={activePanel === id ? 'active' : ''}
          key={id}
          title={label}
          onClick={() => {
            if (id !== 'removeBg') {
              setSelectedId(null)
              setSelectedIds([])
              attachTransformer(null)
            }
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

    <nav className="workspace-mobile-toolbar" aria-label="Workspace tools">
      {[...panelTools, ...toolItems].map(({ id, label, icon: Icon }) => {
        const isCanvasTool = toolItems.some((tool) => tool.id === id)
        return (
        <button
          type="button"
          className={activePanel === id && isRightPanelOpen ? 'active' : ''}
          key={id}
          aria-label={label}
          title={label}
          onClick={() => {
            if (!isCanvasTool || id !== 'removeBg') {
              setSelectedId(null)
              setSelectedIds([])
              attachTransformer(null)
            }
            openRightPanel(id)
          }}
        >
          <Icon size={19} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
        )
      })}
    </nav>

    <header className="workspace-topbar">
      <div className="workspace-title">
        <button
          type="button"
          className="workspace-title-back"
          onClick={() => {
            if (window.history.length > 1) navigate(-1)
            else navigate('/projects')
          }}
          aria-label="Back"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <span>{workspaceTitle}</span>
      </div>
      <div className="workspace-avatars"><span /><span /><span /><strong>+6</strong></div>
      <button type="button" className={`workspace-save-status ${saveIndicator.state}`} title={saveIndicator.label} onClick={handleManualSave} disabled={!workspaceId}>
        <span className="workspace-save-icon-wrap">
          <SaveStatusIcon size={15} />
          {saveIndicator.state === 'saving' && <LoaderCircle size={10} className="workspace-save-spinner" />}
        </span>
        <span>{saveIndicator.label}</span>
      </button>
      <button type="button" className="workspace-mobile-history" onClick={handleUndo} aria-label="Undo" title="Undo">
        <Undo2 size={15} />
      </button>
      <button type="button" className="workspace-mobile-history" onClick={handleRedo} aria-label="Redo" title="Redo">
        <Redo2 size={15} />
      </button>
      <button type="button" className="workspace-share" onClick={handlePublishWorkspace}><Share2 size={15} /><span>Share</span></button>
      <button
        type="button"
        className="workspace-export"
        onClick={() => {
          if (editingText) finishTextEditing()
          setExportError('')
          setIsExportModalOpen(true)
        }}
      >
        <ArrowDownToLine size={15} />Export
      </button>
    </header>

    <main
      className="workspace-canvas-wrap"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          if (editingText) {
            finishTextEditing()
            return
          }
          deselectCanvas()
        }
      }}
      onTouchStart={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        ref={viewportRef}
        className="workspace-stage-shell"
        onTouchStart={(e) => {
          touchDragAssetRef.current = null
          touchDragMovedRef.current = false
          e.preventDefault()
        }}
        onTouchMove={(e) => e.preventDefault()}
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
          onMouseUp={handleStageMouseUp}
          onMouseLeave={endPan}
          onTouchStart={handleStageTouchStart}
          onTouchMove={handleStageTouchMove}
          onTouchEnd={handleStageTouchEnd}
          onContextMenu={(event) => {
            event.evt.preventDefault()
            const target = event.target
            if (isEmptyCanvasTarget(target)) { setContextMenu(null); return }
            const pointer = event.evt
            setContextMenu({ x: pointer.clientX, y: pointer.clientY })
          }}
          onDblClick={(event) => {
            if (!editingBezierId) {
              let target = event.target
              while (target && target !== event.currentTarget) {
                const id = target.id?.()
                if (id && id.startsWith('bezier-')) {
                  event.evt.preventDefault()
                  startEditingBezier(id)
                  return
                }
                target = target.parent
              }
            } else {
              finishEditingBezier()
            }
          }}
          onDblTap={(event) => {
            if (!editingBezierId) {
              let target = event.target
              while (target && target !== event.currentTarget) {
                const id = target.id?.()
                if (id && id.startsWith('bezier-')) {
                  event.evt.preventDefault()
                  startEditingBezier(id)
                  return
                }
                target = target.parent
              }
            } else {
              finishEditingBezier()
            }
          }}
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
                <Line key={`workspace-grid-${index}`} points={points} stroke="#d8d2c7" strokeWidth={1} opacity={0.44} listening={false} />
              ))}
              {canvasSettings.background.type === 'transparent' && checkerboardPattern && (
                <Rect
                  x={0}
                  y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  fillPatternImage={checkerboardPattern}
                  fillPatternRepeat="repeat"
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
              {canvasSettings.background.type !== 'transparent' && (
                <Rect
                  x={0} y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  fill="white"
                  shadowColor="#000000"
                  shadowBlur={200}
                  shadowOpacity={1.0}
                  shadowOffsetX={0}
                  shadowOffsetY={0}
                  listening={false}
                />
              )}
              <Group
                name="canvas-composite"
                clipX={0}
                clipY={0}
                clipWidth={canvasSize.width}
                clipHeight={canvasSize.height}
              >
                <Rect
                  name="canvas-background"
                  width={canvasSize.width}
                  height={canvasSize.height}
                  {...canvasBackgroundProps}
                />
                <Group name="canvas-content">
                  {renderCanvasStackItems(belowItems)}
                </Group>
              </Group>

              <Group
                name="canvas-content-above"
                clipX={0}
                clipY={0}
                clipWidth={canvasSize.width}
                clipHeight={canvasSize.height}
              >
                <GlobalAdjustmentLayer
                  stageRef={stageRef}
                  items={items}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                />
                {[...items].reverse().filter((item) => item.isAdjustmentLayer).map((item) => (
                  <CanvasItem
                    key={item.id}
                    item={item}
                    items={items}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    onSelect={handleObjectSelect}
                    onChange={(patch) => updateItem(item.id, patch)}
                    onDragStart={handleObjectDragStart}
                    onDragMove={handleObjectDragMove}
                    onDragEnd={handleObjectDragEnd}
                    onTextEdit={editTextObject}
                    isTextEditing={editingText?.id === item.id}
                    onCursor={handleItemCursor}
                    onItemHover={setHoveredItemId}
                    disableDrag={isSpaceDown || isPanning || activePanel === 'brush' || cropSession?.itemId === item.id}
                    isShiftDown={isShiftDown}
                    getActiveTransformAnchor={() => transformerRef.current?.getActiveAnchor?.()}
                    dropTargetFrameId={dropTargetFrameId}
                    dropTargetSlotIndex={dropTargetSlotIndex} 
                    editingFrameId={editingFrameId}
                    editingFrameSlot={editingFrameSlot}
                    onFrameImageEdit={handleFrameImageEdit}
                    onCropStart={beginImageCrop}
                    isCropTarget={cropSession?.itemId === item.id}
                  />
                ))}
                {renderCanvasStackItems(aboveItems)}
                {items.map((item) => (
                  <ObjectAnchors
                    key={`anchors-${item.id}`}
                    item={item}
                    visible={
                      item.kind !== 'connector' &&
                      !!(connectorTool || connectorDraft)
                    }
                    onConnectorStart={beginConnectorDrag}
                    onConnectorEnd={finishConnectorDrag}
                  />
                ))}
                {items.filter((item) => item.kind === 'connector').map((connector) => (
                  <ConnectorEndpointAnchors
                    key={`connector-anchors-${connector.id}`}
                    connector={connector}
                    items={items}
                    visible={!!(connectorTool || connectorDraft)}
                    onConnectorStart={beginConnectorDrag}
                    onConnectorEnd={finishConnectorDrag}
                  />
                ))}
                {connectorDraft && (() => {
                  const start = getConnectorDraftStartPoint(connectorDraft)
                  if (!start) return null
                  const end = connectorDraft.point || start
                  return connectorDraft.pathType === 'curve' ? (
                    <Path
                      data={getConnectorCurvePath(start, end)}
                      stroke="#7c6df2"
                      strokeWidth={3}
                      dash={[8, 6]}
                      lineCap="round"
                      fillEnabled={false}
                      listening={false}
                    />
                  ) : connectorDraft.arrowHead ? (
                    <Arrow
                      points={getConnectorLinePoints(start, end, connectorDraft.pathType)}
                      stroke="#7c6df2"
                      fill="#7c6df2"
                      strokeWidth={3}
                      dash={[8, 6]}
                      pointerLength={14}
                      pointerWidth={14}
                      listening={false}
                    />
                  ) : (
                    <Line
                      points={getConnectorLinePoints(start, end, connectorDraft.pathType)}
                      stroke="#7c6df2"
                      strokeWidth={3}
                      dash={[8, 6]}
                      lineCap="round"
                      lineJoin="round"
                      listening={false}
                    />
                  )
                })()}
              </Group>

                {/* Visual mask: hide items outside canvas without affecting hit detection */}
                <Rect listening={false} fill="#ebe8dd" x={virtualWorkspace.x} y={virtualWorkspace.y} width={canvasBounds.x - virtualWorkspace.x} height={virtualWorkspace.height} />
                <Rect listening={false} fill="#ebe8dd" x={canvasBounds.x + canvasBounds.width} y={virtualWorkspace.y} width={virtualWorkspace.x + virtualWorkspace.width - (canvasBounds.x + canvasBounds.width)} height={virtualWorkspace.height} />
                <Rect listening={false} fill="#ebe8dd" x={canvasBounds.x} y={virtualWorkspace.y} width={canvasBounds.width} height={canvasBounds.y - virtualWorkspace.y} />
                <Rect listening={false} fill="#ebe8dd" x={canvasBounds.x} y={canvasBounds.y + canvasBounds.height} width={canvasBounds.width} height={virtualWorkspace.y + virtualWorkspace.height - (canvasBounds.y + canvasBounds.height)} />
                <Rect
                  x={0}
                  y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  fill="rgba(255,255,255,0.018)"
                  shadowColor="#12091f"
                  shadowBlur={92}
                  shadowOpacity={0.76}
                  shadowOffsetX={0}
                  shadowOffsetY={28}
                  listening={false}
                  perfectDrawEnabled={false}
                />
                {canvasSettings.showGrid && canvasGridLines.map((points, index) => (
                  <Line
                    key={`grid-overlay-${index}`}
                    points={points}
                    stroke="#a970ff"
                    strokeWidth={1}
                    opacity={0.42}
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                ))}
                {alignmentGuides.map((guide, index) => (
                  guide.axis === 'x' ? (
                    <Line
                      key={`guide-${index}`}
                      points={[guide.value, canvasBounds.y, guide.value, canvasBounds.y + canvasBounds.height]}
                      stroke={guide.type === 'canvas-center' ? '#ff4fd8' : guide.type === 'edge' ? '#f59e0b' : guide.type === 'margin' ? '#6b6475' : '#38bdf8'}
                      strokeWidth={guide.type === 'margin' ? 0.75 : 1}
                      opacity={guide.type === 'margin' ? 0.38 : 1}
                      dash={guide.type === 'margin' ? [] : [6, 5]}
                      listening={false}
                    />
                  ) : (
                    <Line
                      key={`guide-${index}`}
                      points={[canvasBounds.x, guide.value, canvasBounds.x + canvasBounds.width, guide.value]}
                      stroke={guide.type === 'canvas-center' ? '#ff4fd8' : guide.type === 'edge' ? '#f59e0b' : guide.type === 'margin' ? '#6b6475' : '#38bdf8'}
                      strokeWidth={guide.type === 'margin' ? 0.75 : 1}
                      opacity={guide.type === 'margin' ? 0.38 : 1}
                      dash={guide.type === 'margin' ? [] : [6, 5]}
                      listening={false}
                    />
                  )
                ))}
                {/* Bezier alignment guides */}
                {bezierGuides.map((g, i) => (
                  g.type === 'h' ? (
                    <Line
                      key={`bz-guide-${i}`}
                      points={[canvasBounds.x, g.value, canvasBounds.x + canvasBounds.width, g.value]}
                      stroke="#38bdf8"
                      strokeWidth={1}
                      opacity={0.6}
                      dash={[4, 4]}
                      listening={false}
                    />
                  ) : (
                    <Line
                      key={`bz-guide-${i}`}
                      points={[g.value, canvasBounds.y, g.value, canvasBounds.y + canvasBounds.height]}
                      stroke="#38bdf8"
                      strokeWidth={1}
                      opacity={0.6}
                      dash={[4, 4]}
                      listening={false}
                    />
                  )
                ))}
                {/* Brush stroke preview */}
                {(activePanel === 'brush' && (currentStroke || currentStrokeRef.current)) && (
                  brushSettings.mode === 'erase' ? (
                    <>
                      <Line
                        points={(() => {
                          const pts = currentStrokeRef.current?.points
                          if (!pts) return []
                          if (!brushDrawingRef.current || !latestPointerRef.current) return pts
                          const s = camera.scale || 1
                          const cx = camera.x || 0
                          const cy = camera.y || 0
                          return [...pts, (latestPointerRef.current.x - cx) / s, (latestPointerRef.current.y - cy) / s]
                        })()}
                        stroke="#ff4444"
                        strokeWidth={brushSettings.size + 4}
                        opacity={0.5}
                        tension={0.3}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                        dash={[8, 6]}
                      />
                      <Line
                        points={(() => {
                          const pts = currentStrokeRef.current?.points
                          if (!pts) return []
                          if (!brushDrawingRef.current || !latestPointerRef.current) return pts
                          const s = camera.scale || 1
                          const cx = camera.x || 0
                          const cy = camera.y || 0
                          return [...pts, (latestPointerRef.current.x - cx) / s, (latestPointerRef.current.y - cy) / s]
                        })()}
                        stroke="#ffffff"
                        strokeWidth={brushSettings.size}
                        opacity={0.7}
                        tension={0.3}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                      />
                    </>
                  ) : (
                    <Line
                      points={currentStrokeRef.current?.points?.slice() || []}
                      stroke={brushSettings.color}
                      strokeWidth={brushSettings.size}
                      opacity={brushSettings.opacity}
                      tension={0.3}
                      lineCap="round"
                      lineJoin="round"
                      listening={false}
                    />
                  )
                )}
                {/* Bezier anchors preview */}
                {activePanel === 'bezier' && bezierAnchors.length > 0 && (
                  <>
                    {(() => {
                      const d = bezierAnchors.map((a, i) => `${i === 0 ? 'M' : 'L'} ${a.x},${a.y}`).join(' ') + ' Z'
                      const fillColor = bezierSettings.strokeColor + '30'
                      return <Path data={d} stroke={bezierSettings.strokeColor} strokeWidth={bezierSettings.strokeWidth} fill={fillColor} listening={false} />
                    })()}
                    {bezierAnchors.map((a, i) => (
                      <Circle key={i} x={a.x} y={a.y} radius={4} fill={bezierSettings.strokeColor} listening={false} />
                    ))}
                    {/* Rubber band: line from last anchor to mouse position */}
                    {bezierMousePos && (
                      <Line
                        points={[bezierAnchors[bezierAnchors.length - 1].x, bezierAnchors[bezierAnchors.length - 1].y, bezierMousePos.x, bezierMousePos.y]}
                        stroke={bezierSettings.strokeColor}
                        strokeWidth={bezierSettings.strokeWidth}
                        dash={[6, 4]}
                        opacity={0.5}
                        lineCap="round"
                        listening={false}
                      />
                    )}
                  </>
                )}
                {selectionBox && (
                  <Rect
                    x={selectionBox.x}
                    y={selectionBox.y}
                    width={selectionBox.width}
                    height={selectionBox.height}
                    fill="rgba(124, 109, 242, 0.10)"
                    stroke="#7c6df2"
                    strokeWidth={1}
                    dash={[6, 4]}
                    listening={false}
                  />
                )}
                {editingBezierId && bezierEditAnchors && (() => {
                  const anchors = bezierEditAnchors
                  const previewPathStr = anchors.length >= 2
                    ? anchors.map((a, i) => `${i === 0 ? 'M' : 'L'} ${a.x},${a.y}`).join(' ') + ' Z'
                    : ''
                  return (
                    <>
                      {previewPathStr && (
                        <Path
                          ref={bezierPreviewPathRef}
                          data={previewPathStr}
                          stroke="#7c6df2"
                          strokeWidth={1.5}
                          dash={[6, 4]}
                          fill="rgba(124, 109, 242, 0.08)"
                          listening={false}
                        />
                      )}
                      {anchors.map((a, i) => (
                        <Circle
                          key={i}
                          x={a.x}
                          y={a.y}
                          radius={5}
                          fill={selectedBezierAnchorIdx === i ? '#fff' : '#7c6df2'}
                          stroke={selectedBezierAnchorIdx === i ? '#7c6df2' : '#fff'}
                          strokeWidth={1.5}
                          draggable={true}
                          listening={true}
                          onClick={() => {
                            const nextIdx = selectedBezierAnchorIdx === i ? null : i
                            setSelectedBezierAnchorIdx(nextIdx)
                            if (nextIdx !== null && anchors.length >= 2) {
                              if (!bezierCpRef.current) {
                                bezierCpRef.current = anchors.map(() => ({ cpOutX: 0, cpOutY: 0, cpInX: 0, cpInY: 0 }))
                              }
                              const cp = bezierCpRef.current[nextIdx]
                              if (!cp || (!cp.cpOutX && !cp.cpOutY && !cp.cpInX && !cp.cpInY)) {
                                const prev = anchors[(nextIdx - 1 + anchors.length) % anchors.length]
                                const nextA = anchors[(nextIdx + 1) % anchors.length]
                                const dxOut = nextA.x - a.x; const dyOut = nextA.y - a.y
                                const lenOut = Math.sqrt(dxOut * dxOut + dyOut * dyOut) || 1
                                const dxIn = prev.x - a.x; const dyIn = prev.y - a.y
                                const lenIn = Math.sqrt(dxIn * dxIn + dyIn * dyIn) || 1
                                bezierCpRef.current[nextIdx] = {
                                  cpOutX: (dxOut / lenOut) * 30, cpOutY: (dyOut / lenOut) * 30,
                                  cpInX: (dxIn / lenIn) * 30, cpInY: (dyIn / lenIn) * 30,
                                }
                                const previewStr = computeBezierPathStr(anchors, bezierCpRef.current)
                                bezierPreviewPathRef.current?.setAttrs({ data: previewStr })
                              }
                            }
                          }}
                          onTap={() => {
                            const nextIdx = selectedBezierAnchorIdx === i ? null : i
                            setSelectedBezierAnchorIdx(nextIdx)
                            if (nextIdx !== null && anchors.length >= 2) {
                              if (!bezierCpRef.current) {
                                bezierCpRef.current = anchors.map(() => ({ cpOutX: 0, cpOutY: 0, cpInX: 0, cpInY: 0 }))
                              }
                              const cp = bezierCpRef.current[nextIdx]
                              if (!cp || (!cp.cpOutX && !cp.cpOutY && !cp.cpInX && !cp.cpInY)) {
                                const prev = anchors[(nextIdx - 1 + anchors.length) % anchors.length]
                                const nextA = anchors[(nextIdx + 1) % anchors.length]
                                const dxOut = nextA.x - a.x; const dyOut = nextA.y - a.y
                                const lenOut = Math.sqrt(dxOut * dxOut + dyOut * dyOut) || 1
                                const dxIn = prev.x - a.x; const dyIn = prev.y - a.y
                                const lenIn = Math.sqrt(dxIn * dxIn + dyIn * dyIn) || 1
                                bezierCpRef.current[nextIdx] = {
                                  cpOutX: (dxOut / lenOut) * 30, cpOutY: (dyOut / lenOut) * 30,
                                  cpInX: (dxIn / lenIn) * 30, cpInY: (dyIn / lenIn) * 30,
                                }
                                const previewStr = computeBezierPathStr(anchors, bezierCpRef.current)
                                bezierPreviewPathRef.current?.setAttrs({ data: previewStr })
                              }
                            }
                          }}
                          onDragMove={(e) => {
                            const newPos = { x: e.target.x(), y: e.target.y() }
                            const cp = bezierCpRef.current
                            const previewStr = cp
                              ? computeBezierPathStr(
                                  anchors.map((pa, idx) => ({ ...pa, x: idx === i ? newPos.x : pa.x, y: idx === i ? newPos.y : pa.y })),
                                  cp
                                )
                              : anchors.map((pa, idx) =>
                                  `${idx === 0 ? 'M' : 'L'} ${idx === i ? newPos.x : pa.x},${idx === i ? newPos.y : pa.y}`
                                ).join(' ') + ' Z'
                            bezierPreviewPathRef.current?.setAttrs({ data: previewStr })
                          }}
                          onDragEnd={(e) => {
                            moveBezierAnchor(editingBezierId, i, { x: e.target.x(), y: e.target.y() })
                          }}
                        />
                      ))}
                      {selectedBezierAnchorIdx !== null && (() => {
                        const si = selectedBezierAnchorIdx
                        const anchor = anchors[si]
                        if (!anchor) return null
                        if (!bezierCpRef.current) return null
                        const cp = bezierCpRef.current[si]
                        if (!cp) return null
                        const outX = anchor.x + cp.cpOutX
                        const outY = anchor.y + cp.cpOutY
                        const inX = anchor.x + cp.cpInX
                        const inY = anchor.y + cp.cpInY
                        return (
                          <>
                            <Line
                              points={[anchor.x, anchor.y, outX, outY]}
                              stroke="#7c6df2"
                              strokeWidth={1.5}
                              dash={[3, 3]}
                              listening={false}
                            />
                            <Circle
                              x={outX}
                              y={outY}
                              radius={4}
                              fill="#7c6df2"
                              stroke="#fff"
                              strokeWidth={1}
                              draggable={true}
                              onDragMove={(e) => {
                                const hx = e.target.x(); const hy = e.target.y()
                                bezierCpRef.current[si] = { ...cp, cpOutX: hx - anchor.x, cpOutY: hy - anchor.y }
                                const previewStr = computeBezierPathStr(anchors, bezierCpRef.current)
                                bezierPreviewPathRef.current?.setAttrs({ data: previewStr })
                              }}
                              onDragEnd={(e) => {
                                const hx = e.target.x(); const hy = e.target.y()
                                const newCp = { ...cp, cpOutX: hx - anchor.x, cpOutY: hy - anchor.y }
                                bezierCpRef.current[si] = newCp
                                setItems((items) => items.map((it) => {
                                  if (it.id !== editingBezierId) return it
                                  const data = it.bezierData ? [...it.bezierData] : anchors.map(() => ({ cpOutX: 0, cpOutY: 0, cpInX: 0, cpInY: 0 }))
                                  data[si] = newCp
                                  return { ...it, bezierData: data }
                                }))
                              }}
                            />
                            <Line
                              points={[anchor.x, anchor.y, inX, inY]}
                              stroke="#7c6df2"
                              strokeWidth={1.5}
                              dash={[3, 3]}
                              listening={false}
                            />
                            <Circle
                              x={inX}
                              y={inY}
                              radius={4}
                              fill="#7c6df2"
                              stroke="#fff"
                              strokeWidth={1}
                              draggable={true}
                              onDragMove={(e) => {
                                const hx = e.target.x(); const hy = e.target.y()
                                bezierCpRef.current[si] = { ...cp, cpInX: hx - anchor.x, cpInY: hy - anchor.y }
                                const previewStr = computeBezierPathStr(anchors, bezierCpRef.current)
                                bezierPreviewPathRef.current?.setAttrs({ data: previewStr })
                              }}
                              onDragEnd={(e) => {
                                const hx = e.target.x(); const hy = e.target.y()
                                const newCp = { ...cp, cpInX: hx - anchor.x, cpInY: hy - anchor.y }
                                bezierCpRef.current[si] = newCp
                                setItems((items) => items.map((it) => {
                                  if (it.id !== editingBezierId) return it
                                  const data = it.bezierData ? [...it.bezierData] : anchors.map(() => ({ cpOutX: 0, cpOutY: 0, cpInX: 0, cpInY: 0 }))
                                  data[si] = newCp
                                  return { ...it, bezierData: data }
                                }))
                              }}
                            />
                          </>
                        )
                      })()}
                    </>
                  )
                })()}
                {renderCropOverlay()}
                {!cropSession && (
                             <Transformer
                ref={transformerRef}
                rotateEnabled={!areAllLocked}
                keepRatio={!areAllLocked && (
                  isSelectedCompositeGroup
                    ? true
                    : selectedItems.length > 1
                    ? !isShiftDown
                    : selectedItem?.kind === 'frame'
                      ? !isBasicFrame(selectedItem)
                      : selectedItem?.kind === 'text'
                        ? false
                      : selectedItem?.kind === 'shape'
                        ? selectedItem.shapeType !== 'arrow-shape' && !isShiftDown
                        : selectedItem?.kind === 'image'
                          ? false
                          : true
                )}
                shiftBehavior="invert"
                enabledAnchors={
                  activePanel === 'brush' && brushSettings.mode === 'erase' ? [] : (
                  areAllLocked ? [] : (
                  isSelectedCompositeGroup
                    ? cornerTransformAnchors
                    : selectedItems.length > 1
                    ? transformAnchors
                    : selectedItem?.kind === 'frame' && !isBasicFrame(selectedItem)
                      ? cornerTransformAnchors
                        : selectedItem?.kind === 'text'
                        ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']
                        : selectedItem?.kind === 'shape' && (selectedItem?.shapeType === 'freehand' || selectedItem?.shapeType === 'bezier-path')
                          ? []
                          : transformAnchors
                  ))
                }
                onTransform={() => {
                  const box = transformerRef.current?.getClientRect?.()
                  if (!box) return
                  const worldBox = {
                    left: box.x,
                    right: box.x + box.width,
                    top: box.y,
                    bottom: box.y + box.height,
                    centerX: box.x + box.width / 2,
                    centerY: box.y + box.height / 2,
                  }
                  const guides = []
                  const canvasCenterX = canvasBounds.x + canvasBounds.width / 2
                  const canvasCenterY = canvasBounds.y + canvasBounds.height / 2
                  if (Math.abs(worldBox.centerX - canvasCenterX) <= snapTolerance) guides.push({ axis: 'x', value: canvasCenterX, type: 'canvas-center' })
                  if (Math.abs(worldBox.centerY - canvasCenterY) <= snapTolerance) guides.push({ axis: 'y', value: canvasCenterY, type: 'canvas-center' })
                  setAlignmentGuides(guides)
                  requestAnimationFrame(updateToolbarPosition)
                }}
                onTransformEnd={commitTransformerChanges}
                boundBoxFunc={(oldBox, newBox) => {
                  const snappedResize = snapResizeBox(oldBox, newBox)
                  const candidateBox = snappedResize.box
                  setAlignmentGuides(snappedResize.guides)

                  if (candidateBox.width < (selectedItem?.kind === 'text' ? 24 : 40)) return oldBox
                  if (selectedItem?.kind !== 'text' && candidateBox.height < 40) return oldBox
                  if (selectedItems.length === 1 && selectedItem?.kind === 'frame' && !isBasicFrame(selectedItem)) {
                    const activeAnchor = transformerRef.current?.getActiveAnchor?.()
                    if (activeAnchor?.startsWith('middle') || activeAnchor === 'top-center' || activeAnchor === 'bottom-center') return oldBox
                    const aspectRatio = (selectedItem.w / selectedItem.h) || 1
                    return { ...candidateBox, height: candidateBox.width / aspectRatio }
                  }
                  if (selectedItems.length === 1 && selectedItem?.kind === 'image' && selectedItem?.lockAspectRatio) {
                    const activeAnchor = transformerRef.current?.getActiveAnchor?.()
                    if (activeAnchor?.startsWith('middle') || activeAnchor === 'top-center' || activeAnchor === 'bottom-center') return oldBox
                    const aspectRatio = (selectedItem.w / selectedItem.h) || 1
                    return { ...candidateBox, height: candidateBox.width / aspectRatio }
                  }
                  if (selectedItem?.kind === 'shape' && selectedItem.shapeType === 'arrow-shape') {
                    const activeAnchor = transformerRef.current?.getActiveAnchor?.()
                    if (activeAnchor === 'middle-left' || activeAnchor === 'middle-right') {
                      return { ...candidateBox, y: oldBox.y, height: oldBox.height }
                    }
                    if (activeAnchor === 'top-center' || activeAnchor === 'bottom-center') {
                      return { ...candidateBox, x: oldBox.x, width: oldBox.width }
                    }
                  }
                  if (selectedItem?.kind === 'shape' && selectedItem.shapeType === 'circle') {
                    const size = Math.max(candidateBox.width, candidateBox.height)
                    return { ...candidateBox, width: size, height: size }
                  }
                  if (
                    selectedItem?.kind === 'shape' &&
                    !isShiftDown &&
                    ['ellipse', 'polygon', 'star'].includes(selectedItem.shapeType)
                  ) {
                    const aspectRatio = selectedItem.shapeAspectRatio || (selectedItem.w / selectedItem.h) || 1
                    return {
                      ...candidateBox,
                      height: candidateBox.width / aspectRatio,
                    }
                  }
                  return candidateBox
                }}
                borderStroke="#a970ff"
                anchorFill="#f4e8ff"
                anchorStroke="#a970ff"
                anchorSize={9}
              />
                )}
            </Group>
          </Layer>
        </Stage>
        {editingFrameId && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10, 10, 16, 0.92)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              padding: '9px 20px',
              borderRadius: 28,
              pointerEvents: 'none',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.15), 0 8px 24px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Dot indicator biru */}
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'inline-block',
              boxShadow: '0 0 8px #3b82f6',
              flexShrink: 0,
            }} />
            <span style={{ color: '#e2e8f0' }}>Drag posisi · Pinch/drag sudut untuk zoom</span>
            <span style={{
              width: 1, height: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ opacity: 0.45, fontSize: 11.5 }}>Klik di luar untuk selesai</span>
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
      <div className="workspace-mobile-sheet-header">
        <button
          type="button"
          className="workspace-mobile-sheet-handle"
          onClick={toggleMobileSheetSize}
          aria-label={mobileSheetState === 'expanded' ? 'Collapse panel' : 'Expand panel'}
        >
          <span />
        </button>
        <div className="workspace-mobile-sheet-title">
          {mobileSheetKicker && <span>{mobileSheetKicker}</span>}
          <strong>{mobileSheetTitle}</strong>
        </div>
        <div className="workspace-mobile-sheet-actions">
          {selectedItem && !cropSession && (
            <>
              <button type="button" onClick={() => setIsFxPanelOpen(true)} aria-label="Effects">
                <Sparkles size={18} />
              </button>
              <button type="button" onClick={() => setIsMorePanelOpen(true)} aria-label="More settings">
                <MoreHorizontal size={18} />
              </button>
            </>
          )}
          <button type="button" onClick={toggleMobileSheetSize} aria-label={mobileSheetState === 'expanded' ? 'Collapse panel' : 'Expand panel'}>
            <ChevronDown size={18} className={mobileSheetState === 'expanded' ? '' : 'is-up'} />
          </button>
          <button type="button" onClick={closeRightPanelAndCenter} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="workspace-panel-scroll">
        {renderPanel()}
      </div>
    </aside>

    <div className="canvas-bottom-toolbar">
      <ZoomControlPill
        currentZoom={camera.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
      >
        <button
          className="zoom-btn"
          onClick={handleUndo}
          aria-label="Undo"
          type="button"
          title="Undo (Ctrl+Z)"
          style={{ fontSize: '16px' }}
        >
          <Undo2 size={16} />
        </button>
        <button
          className="zoom-btn"
          onClick={handleRedo}
          aria-label="Redo"
          type="button"
          title="Redo (Ctrl+Y)"
          style={{ fontSize: '16px' }}
        >
          <Redo2 size={16} />
        </button>
      </ZoomControlPill>
    </div>

    {/* Menu backdrop */}
    {(contextMenu || showMoreMenu || showAlignSubmenu) && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={closeAllMenus} />
    )}

    {/* Floating context toolbar */}
    {toolbarPos && (selectedIds.length || selectedId) && (
      <div className="workspace-floating-context-toolbar" style={{
        position: 'fixed',
        left: toolbarPos.x,
        top: toolbarPos.y - 8,
        transform: toolbarPos.mobile ? 'translateY(-100%)' : 'translate(-50%, -100%)',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px 6px',
        maxWidth: toolbarPos.mobile ? 'calc(100vw - 20px)' : 'min(520px, calc(100vw - 20px))',
        overflow: 'visible',
        background: 'rgba(18, 18, 20, 0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 200,
      }}>
        {activeGroupId && activeSelectionCount > 1 ? (
          <button
            className="zoom-btn workspace-floating-group-btn active"
            onClick={ungroupSelectedItems}
            title="Pisahkan group"
            type="button"
          >
            <Unlink size={14} />
            <span>Pisahkan</span>
            <strong>{activeSelectionCount}</strong>
          </button>
        ) : (
          <button
            className={`zoom-btn workspace-floating-group-btn ${isGroupSelectMode ? 'active' : ''}`}
            onClick={handleGroupSelectionAction}
            title={activeSelectionCount > 1 ? 'Kelompokkan object terpilih' : 'Group selection'}
            type="button"
          >
            <GroupIcon size={14} />
            <span>{activeSelectionCount > 1 ? 'Kelompokkan' : 'Group'}</span>
            {activeSelectionCount > 1 && <strong>{activeSelectionCount}</strong>}
          </button>
        )}
        <button className="zoom-btn" onClick={() => duplicateItems(selectedIds.length ? selectedIds : [selectedId])} title="Duplicate" type="button" style={{ width: 28, height: 28, fontSize: 14 }}><Copy size={14} /></button>
        <button className="zoom-btn" onClick={lockToggleSelected} title="Lock/Unlock" type="button" style={{ width: 28, height: 28, fontSize: 14 }}>{selectedItem?.locked ? <Unlock size={14} /> : <Lock size={14} />}</button>
        {selectedItem?.kind === 'image' && selectedIds.length <= 1 && (
          <button className="zoom-btn" onClick={() => beginImageCrop(selectedItem.id)} title="Crop" type="button" style={{ width: 28, height: 28, fontSize: 14 }}><Crop size={14} /></button>
        )}
        {selectedItem?.kind === 'frame' && selectedIds.length <= 1 && frameHasImages(selectedItem) && (
          <button className="zoom-btn" onClick={() => detachFrameImages(selectedItem.id)} title="Pisahkan gambar" type="button" style={{ width: 28, height: 28, fontSize: 14 }}><Unlink size={14} /></button>
        )}
        <button className="zoom-btn" onClick={deleteSelectedObject} title="Delete" type="button" style={{ width: 28, height: 28, fontSize: 14 }}><Trash2 size={14} /></button>
        <div style={{ position: 'relative' }}>
          <button className="zoom-btn" onClick={() => { setShowMoreMenu((v) => !v); setShowAlignSubmenu(false) }} title="More" type="button" style={{ width: 28, height: 28, fontSize: 14, fontWeight: 600 }}><MoreHorizontal size={14} /></button>
          {showMoreMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              minWidth: 180,
              padding: '4px 0',
              background: 'rgba(24, 24, 28, 0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 210,
            }}>
              {[
                { label: 'Salin (Ctrl+C)', action: handleCopy, Icon: Copy },
                ...(hasClipboard ? [{ label: 'Tempel (Ctrl+V)', action: handlePaste, Icon: ClipboardPaste }] : []),
                activeGroupId && activeSelectionCount > 1
                  ? { label: `Pisahkan (${activeSelectionCount})`, action: ungroupSelectedItems, Icon: Unlink }
                  : { label: activeSelectionCount > 1 ? `Kelompokkan (${activeSelectionCount})` : 'Group', action: handleGroupSelectionAction, Icon: GroupIcon },
                { label: 'Duplikat', action: () => duplicateItems(selectedIds.length ? selectedIds : [selectedId]), Icon: CopyPlus },
                { label: 'Hapus (Delete)', action: deleteSelectedObject, Icon: Trash2 },
                ...(selectedItem?.kind === 'image' && selectedIds.length <= 1 ? [{ label: 'Pangkas', action: () => beginImageCrop(selectedItem.id), Icon: Crop }] : []),
                ...(canUseCompositeGroupMode ? [
                  { label: activeCompositeMode === 'mask' ? 'Matikan Masking' : activeSelectionCount > 1 ? `Masking (${activeSelectionCount})` : 'Masking', action: () => applyCompositeGroupMode('mask'), Icon: Box },
                  { label: activeCompositeMode === 'exclude' ? 'Matikan Exclude' : activeSelectionCount > 1 ? `Exclude (${activeSelectionCount})` : 'Exclude', action: () => applyCompositeGroupMode('exclude'), Icon: MinusIcon },
                ] : []),
                { label: '---' },
                { label: 'Canvas Align', action: 'submenu', Icon: AlignCenter },
                { label: '---' },
                { label: selectedItem?.locked ? 'Buka Kunci' : 'Kunci', action: lockToggleSelected, Icon: selectedItem?.locked ? Unlock : Lock },
              ].map((item, i) => {
                if (item.label === '---') return <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 8px' }} />
                if (item.action === 'submenu') {
                  return (
                    <div key={i} style={{ position: 'relative' }}
                      onMouseEnter={() => setShowAlignSubmenu(true)}
                      onMouseLeave={() => setShowAlignSubmenu(false)}
                    >
                      <div style={menuItemStyle}>
                        {item.Icon && <item.Icon size={14} style={{ flexShrink: 0 }} />}
                        <span>Canvas Align</span>
                        <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 10 }}>▶</span>
                      </div>
                      {showAlignSubmenu && (
                        <div style={{
                          position: 'absolute',
                          left: '100%',
                          top: 0,
                          marginLeft: 4,
                          minWidth: 170,
                          padding: '4px 0',
                          background: 'rgba(24, 24, 28, 0.97)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                          zIndex: 220,
                        }}>
                          {[
                            { label: 'Align Left', action: () => alignCanvasItems('left'), Icon: AlignStartHorizontal },
                            { label: 'Align Center H', action: () => alignCanvasItems('center'), Icon: AlignHorizontalDistributeCenter },
                            { label: 'Align Right', action: () => alignCanvasItems('right'), Icon: AlignEndHorizontal },
                            { label: 'Align Top', action: () => alignCanvasItems('top'), Icon: AlignStartVertical },
                            { label: 'Align Center V', action: () => alignCanvasItems('middle'), Icon: AlignVerticalDistributeCenter },
                            { label: 'Align Bottom', action: () => alignCanvasItems('bottom'), Icon: AlignEndVertical },
                          ].map((sub, j) => (
                            <div key={j} style={menuItemStyle} onClick={() => { sub.action(); closeAllMenus() }}>
                              {sub.Icon && <sub.Icon size={14} style={{ flexShrink: 0 }} />}
                              <span>{sub.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <div key={i} style={menuItemStyle} onClick={() => { item.action(); closeAllMenus() }}>
                    {item.Icon && <item.Icon size={14} style={{ flexShrink: 0 }} />}
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )}

    {/* Right-click context menu */}
    {contextMenu && (
      <div style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        minWidth: 200,
        padding: '4px 0',
        background: 'rgba(24, 24, 28, 0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        zIndex: 210,
      }}>
        {[
          { label: 'Salin', shortcut: 'Ctrl+C', action: handleCopy, Icon: Copy },
          ...(hasClipboard ? [{ label: 'Tempel', shortcut: 'Ctrl+V', action: handlePaste, Icon: ClipboardPaste }] : []),
          activeGroupId && activeSelectionCount > 1
            ? { label: `Pisahkan (${activeSelectionCount})`, shortcut: '', action: ungroupSelectedItems, Icon: Unlink }
            : { label: activeSelectionCount > 1 ? `Kelompokkan (${activeSelectionCount})` : 'Group', shortcut: '', action: handleGroupSelectionAction, Icon: GroupIcon },
          { label: 'Duplikat', shortcut: '', action: () => duplicateItems(selectedIds.length ? selectedIds : [selectedId]), Icon: CopyPlus },
          ...(selectedItem?.kind === 'image' && selectedIds.length <= 1 ? [{ label: 'Pangkas', shortcut: '', action: () => beginImageCrop(selectedItem.id), Icon: Crop }] : []),
          ...(canUseCompositeGroupMode ? [
            { label: activeCompositeMode === 'mask' ? 'Matikan Masking' : activeSelectionCount > 1 ? `Masking (${activeSelectionCount})` : 'Masking', shortcut: '', action: () => applyCompositeGroupMode('mask'), Icon: Box },
            { label: activeCompositeMode === 'exclude' ? 'Matikan Exclude' : activeSelectionCount > 1 ? `Exclude (${activeSelectionCount})` : 'Exclude', shortcut: '', action: () => applyCompositeGroupMode('exclude'), Icon: MinusIcon },
          ] : []),
          { label: '---' },
          { label: 'Canvas Align', shortcut: '', action: 'submenu', Icon: AlignCenter },
          { label: '---' },
          { label: selectedItem?.locked ? 'Buka Kunci' : 'Kunci', shortcut: '', action: lockToggleSelected, Icon: selectedItem?.locked ? Unlock : Lock },
          { label: 'Hapus', shortcut: 'Del', action: deleteSelectedObject, Icon: Trash2 },
        ].map((item, i) => {
          if (item.label === '---') return <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 8px' }} />
          if (item.action === 'submenu') {
            return (
              <div key={i} style={{ position: 'relative' }}
                onMouseEnter={() => setShowAlignSubmenu(true)}
                onMouseLeave={() => setShowAlignSubmenu(false)}
              >
                <div style={menuItemStyle}>
                  {item.Icon && <item.Icon size={14} style={{ flexShrink: 0 }} />}
                  <span>Canvas Align</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 10 }}>▶</span>
                </div>
                {showAlignSubmenu && (
                  <div style={{
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    marginLeft: 4,
                    minWidth: 170,
                    padding: '4px 0',
                    background: 'rgba(24, 24, 28, 0.97)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 220,
                  }}>
                    {[
                      { label: 'Align Left', action: () => alignCanvasItems('left'), Icon: AlignStartHorizontal },
                      { label: 'Align Center H', action: () => alignCanvasItems('center'), Icon: AlignHorizontalDistributeCenter },
                      { label: 'Align Right', action: () => alignCanvasItems('right'), Icon: AlignEndHorizontal },
                      { label: 'Align Top', action: () => alignCanvasItems('top'), Icon: AlignStartVertical },
                      { label: 'Align Center V', action: () => alignCanvasItems('middle'), Icon: AlignVerticalDistributeCenter },
                      { label: 'Align Bottom', action: () => alignCanvasItems('bottom'), Icon: AlignEndVertical },
                    ].map((sub, j) => (
                      <div key={j} style={menuItemStyle} onClick={() => { sub.action(); closeAllMenus() }}>
                        {sub.Icon && <sub.Icon size={14} style={{ flexShrink: 0 }} />}
                        <span>{sub.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <div key={i} style={menuItemStyle} onClick={() => { item.action(); closeAllMenus() }}>
              {item.Icon && <item.Icon size={14} style={{ flexShrink: 0 }} />}
              <span>{item.label}</span>
              {item.shortcut && <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 11 }}>{item.shortcut}</span>}
            </div>
          )
        })}
      </div>
    )}

    {isExportModalOpen && (
      <div
        className="workspace-export-modal-backdrop"
        role="presentation"
        onMouseDown={() => {
          if (!isExporting) setIsExportModalOpen(false)
        }}
      >
        <section
          className="workspace-export-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-export-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="workspace-export-modal-header">
            <div>
              <p>EXPORT AS</p>
              <h2 id="workspace-export-title">Export Workspace</h2>
            </div>
          </div>

          <div className="workspace-export-options">
            <label className={`workspace-export-option ${exportFormat === 'png' ? 'active' : ''}`}>
              <input
                type="radio"
                name="export-format"
                value="png"
                checked={exportFormat === 'png'}
                onChange={() => setExportFormat('png')}
              />
              <span>PNG</span>
            </label>
            <label className={`workspace-export-option ${exportFormat === 'jpg' ? 'active' : ''}`}>
              <input
                type="radio"
                name="export-format"
                value="jpg"
                checked={exportFormat === 'jpg'}
                onChange={() => {
                  setExportFormat('jpg')
                  setExportTransparent(false)
                }}
              />
              <span>JPG</span>
            </label>
          </div>

          <div className="workspace-export-section">
            <span className="workspace-export-section-title">Resolution</span>
            <div className="workspace-export-options">
              {[1, 2, 4].map((scale) => (
                <label key={scale} className={`workspace-export-option ${exportScale === scale ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="export-scale"
                    value={scale}
                    checked={exportScale === scale}
                    onChange={() => setExportScale(scale)}
                  />
                  <span>{scale}x</span>
                </label>
              ))}
            </div>
          </div>

          <div className="workspace-export-toggle-row">
            <div>
              <span>Transparent Background</span>
              {!isCanvasBackgroundNone && (
                <small>Background harus None untuk export transparan</small>
              )}
              {exportFormat === 'jpg' && isCanvasBackgroundNone && (
                <small>JPG tidak mendukung transparansi</small>
              )}
            </div>
            <button
              type="button"
              className={`workspace-export-toggle ${exportTransparent ? 'active' : ''}`}
              disabled={!isCanvasBackgroundNone || exportFormat === 'jpg'}
              aria-pressed={exportTransparent}
              onClick={() => setExportTransparent((value) => !value)}
            >
              <span />
            </button>
          </div>

          <div className="workspace-export-preview">
            <span className="workspace-export-section-title">Preview Info</span>
            <div>
              <span>Canvas Size</span>
              <strong>{canvasSettings.width} x {canvasSettings.height}px</strong>
            </div>
            <div>
              <span>Estimated Output Size</span>
              <strong>{exportOutputSize.width} x {exportOutputSize.height}px</strong>
            </div>
          </div>

          {exportError && <p className="workspace-export-error">{exportError}</p>}
          {isExporting && (
            <div className="workspace-export-progress" role="status" aria-live="polite">
              <div className="workspace-export-progress-label">
                <span>Exporting...</span>
                <strong>{exportProgress}%</strong>
              </div>
              <div className="workspace-export-progress-track">
                <span style={{ width: `${exportProgress}%` }} />
              </div>
            </div>
          )}

          <div className="workspace-export-modal-footer">
            <button type="button" className="workspace-export-cancel" onClick={() => setIsExportModalOpen(false)} disabled={isExporting}>
              Cancel
            </button>
            <button type="button" className="workspace-export-confirm" onClick={handleExportWorkspace} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </section>
      </div>
    )}

    <ConfirmationModal
      isOpen={!!assetDeleteTarget}
      title="Delete Asset?"
      description={`"${assetDeleteTarget?.title}" will be removed from your uploads.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      isConfirming={false}
      isDanger
      onConfirm={confirmAssetDelete}
      onCancel={() => setAssetDeleteTarget(null)}
    />
  </section>
  )
}



export default Workspace
