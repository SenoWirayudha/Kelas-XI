import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  Upload,
  Italic,
  Underline,
  Undo2,
  Redo2,
  RotateCw,
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
  ChevronRight,
  X,
  Paintbrush,
  PenTool,
  WandSparkles,
  List,
  ListOrdered,
  Image,
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
import { getShadowProps, getCanvasBackgroundProps, loadImageMetadata, preloadFont, clearFontCache } from '../utils/konvaUtils'
import { applyImageFilters } from '../utils/imageFilters'
import { getDefaultEffects } from '../utils/effectUtils'
import { effectManager } from '../utils/konva-effects-engine'
import { createGrid, cloneGrid, renderWarpedImage, buildSubdividedGrid, gridCorners, updateGridCorners, subdivideMeshGrid, PERSPECTIVE_SUBDIVISIONS, APPLY_SUBDIVISIONS, WARP_PADDING } from '../utils/mesh-warp'
import { extractDominantColors, clearDominantColorCache } from '../utils/dominantColors'

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
import ToolsPanel from '../components/panels/ToolsPanel'
import ToolWarpPanel from '../components/panels/ToolWarpPanel'
import ToolRelightPanel from '../components/panels/ToolRelightPanel'
import WarpHandles from '../components/canvas/WarpHandles'
import RichTextEditor from '../components/RichTextEditor'
import { getRuns, runsToHtml, runsToText, stripListPrefix } from '../utils/textRuns'

import { getCanvasItemTransformPatch } from '../engines/transformEngine'
import RelightBalls, { LightOverlay } from '../components/canvas/RelightBalls'
import RemoveBgOverlay from '../components/canvas/RemoveBgOverlay'
import { useAuth } from '../context/authState'
import { CollaborationProvider } from '../context/CollaborationContext'
import { useToast } from '../context/ToastContext'
import { ToastProvider } from '../context/ToastContext'
import { ToastContainer } from '../components/ToastContainer'
import { CollaborationPresence } from '../components/canvas/CollaborationPresence'
import { CollaborationCursors } from '../components/canvas/CollaborationCursors'
import { CollaborationSelectionIndicators } from '../components/canvas/CollaborationSelectionIndicators'
import { CollaborationSelectionLabels } from '../components/canvas/CollaborationSelectionLabels'
import { useCursorBroadcast } from '../hooks/useCursorBroadcast'
import { useCollaboration } from '../hooks/useCollaboration'
import { getCursorColor } from '../utils/cursorColors'
import ShareModal from '../components/workspace/ShareModal'
import { useMediaUpload } from '../hooks/useMediaUpload'
import { useCanvasImage, useCanvasImages } from '../hooks/useCanvasImages'
import { autosaveWorkspace, getWorkspace, saveWorkspace, setWorkspaceThumbnail, updateWorkspace } from '../lib/api/workspaces'
import { getHomeFeed, getSavedPosts, getSimilarPostsByImage, publishWorkspace } from '../lib/api/posts'
import { getBoard, listBoards } from '../lib/api/boards'
import { searchPosts as searchPublicPosts } from '../lib/api/search'
import { ensureExternalImage, searchExternalImages } from '../lib/api/externalImages'
import { recordInterestEvent } from '../lib/api/interest'
import { deleteMediaByUrl, uploadMediaFile } from '../lib/api/media'
import { listFonts as apiListFonts, uploadFont as apiUploadFont, deleteFont as apiDeleteFont, getFavorites as apiGetFavorites, addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite } from '../lib/api/fonts'

let canvasSize = defaultCanvasSize
let canvasBounds = { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height }
let _brushOffscreenCanvas = null
let _brushImageNode = null
let _brushFallbackImg = null

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

const addRelightOverlayClones = ({ stage, items, exportLayer }) => {
  items.filter((i) => i.relight).forEach((item) => {
    const node = stage?.findOne(`#${item.id}`)
    const konvaImage = node?.findOne('.canvas-image-main') || node?.findOne('Image')
    const htmlImg = konvaImage?.image()
    if (!htmlImg) return

    const w = item.w
    const h = item.h
    if (w <= 0 || h <= 0) return

    const relight = item.relight
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.max(w, h) * 0.7

    // Light overlay canvas
    const lCanvas = document.createElement('canvas')
    lCanvas.width = Math.round(w)
    lCanvas.height = Math.round(h)
    const lctx = lCanvas.getContext('2d')
    for (const key of ['lightA', 'lightB']) {
      const light = relight[key]
      const localX = cx + light.offsetX
      const localY = cy + light.offsetY
      const gradient = lctx.createRadialGradient(localX, localY, 0, localX, localY, maxR)
      gradient.addColorStop(0, light.color)
      gradient.addColorStop(0.5, light.color + '99')
      gradient.addColorStop(1, 'transparent')
      lctx.globalAlpha = light.intensity ?? 1
      lctx.fillStyle = gradient
      lctx.fillRect(0, 0, w, h)
    }
    lctx.globalCompositeOperation = 'destination-in'
    lctx.globalAlpha = 1
    lctx.drawImage(htmlImg, 0, 0, w, h)

    // Shadow mask canvas
    if (relight.darken > 0) {
      const sCanvas = document.createElement('canvas')
      sCanvas.width = Math.round(w)
      sCanvas.height = Math.round(h)
      const sctx = sCanvas.getContext('2d')
      sctx.fillStyle = 'black'
      sctx.fillRect(0, 0, w, h)
      sctx.globalCompositeOperation = 'destination-out'
      for (const key of ['lightA', 'lightB']) {
        const light = relight[key]
        const localX = cx + light.offsetX
        const localY = cy + light.offsetY
        const gradient = sctx.createRadialGradient(localX, localY, 0, localX, localY, maxR)
        gradient.addColorStop(0, 'white')
        gradient.addColorStop(0.5, 'white')
        gradient.addColorStop(1, 'transparent')
        sctx.globalAlpha = light.intensity ?? 1
        sctx.fillStyle = gradient
        sctx.fillRect(0, 0, w, h)
      }
      sctx.globalCompositeOperation = 'destination-in'
      sctx.globalAlpha = 1
      sctx.drawImage(htmlImg, 0, 0, w, h)

      exportLayer.add(new Konva.Image({
        image: sCanvas,
        x: item.x,
        y: item.y,
        width: w,
        height: h,
        opacity: relight.darken,
        listening: false,
      }))
    }

    exportLayer.add(new Konva.Image({
      image: lCanvas,
      x: item.x,
      y: item.y,
      width: w,
      height: h,
      globalCompositeOperation: 'overlay',
      listening: false,
    }))
  })
}

const BROADCAST_KEYS = new Set([
  'x', 'y', 'w', 'h', 'rotation', 'compositeGroupX', 'compositeGroupY', 'compositeGroupScaleX', 'compositeGroupScaleY', 'compositeGroupRotation',
  'groupId', 'parentGroupId', 'maskSourceType',
  'frameImageSrc', 'frameImages', 'frameImagePosition', 'frameImageScale', 'frameImageFit',
  'runs', 'text', 'isBold', 'isItalic', 'isUnderline', 'fontSize', 'fontFamily', 'fill', 'align', 'shapeText',
  'opacity', 'blendMode',
  'exposure', 'temperature', 'hue', 'highlights', 'shadows', 'whites', 'blacks',
  'brightness', 'contrast', 'saturation', 'sharpen', 'vignette', 'blur', 'radius',
  'stroke', 'strokeWidth', 'strokeGradientType', 'strokeGradientStops', 'strokeGradientAngle',
  'gradientType', 'gradientStops', 'gradientAngle',
  'imageStrokeGradientType', 'imageStrokeGradientStops', 'imageStrokeGradientAngle',
  'visible', 'locked',
  'shadowEnabled', 'shadow', 'shadowColor', 'shadowOpacity', 'shadowOffsetX', 'shadowOffsetY',
  'compositeOpacity', 'compositeBlendMode', 'compositeMode',
  'compositeShadowEnabled', 'compositeShadow', 'compositeShadowColor', 'compositeShadowOpacity',
  'compositeShadowOffsetX', 'compositeShadowOffsetY',
  'compositeStrokeEnabled', 'compositeStrokeWidth', 'compositeStrokeColor',
  'imageStrokeEnabled', 'imageStrokeColor', 'imageStrokeWidth',
  'imageCropRect', 'cropSourceWidth', 'cropSourceHeight', 'cropEnabled',
  'bezierData', 'path',
  'src', 'effects',
  'isAdjustmentLayer', '_preAdjustmentState',
])

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

const FALLBACK_QUERIES = ['design inspiration', 'mood board', 'creative art', 'visual ideas', 'aesthetic', 'texture pattern', 'color palette', 'art reference']
const QUERY_NOISE_WORDS = new Set(['untitled', 'image', 'photo', 'picture', 'file', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'background', 'wallpaper', 'hd', 'ultra', 'and', 'the', 'this', 'that', 'with', 'from', 'led', 'artstation', 'deviantart', 'pinterest', 'gettyimages', 'shutterstock', 'vecteezy', 'freepik', '2000', '3000', '1920', '1080', '4k', '8k'])

const getExternalBrowseQuery = (query, signals = [], seed = 0) => {
const CANCELED = {}
  const directQuery = normalizeSearchText(query)
  if (directQuery) return directQuery
  const tokenCounts = new Map()
  const fieldScores = new Map()
  signals.forEach((s, i) => {
    const weight = Math.max(0.3, 1 - i * 0.1)
    ;(s?.tokens || []).filter((t) => t && t.length >= 3 && !QUERY_NOISE_WORDS.has(t)).forEach((t) => {
      tokenCounts.set(t, (tokenCounts.get(t) || 0) + weight)
    })
    ;(s?.normalizedFields || []).filter(Boolean).forEach((f) => {
      const cleaned = f.split(' ').filter((w) => !QUERY_NOISE_WORDS.has(w)).join(' ').trim()
      if (cleaned) fieldScores.set(cleaned, (fieldScores.get(cleaned) || 0) + weight)
    })
  })
  const topTokens = [...tokenCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t)
  const topFields = [...fieldScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f]) => f)
  const combined = [...topTokens, ...topFields].filter(Boolean)
  if (combined.length) return combined.slice(0, 6).join(' ')
  return FALLBACK_QUERIES[seed % FALLBACK_QUERIES.length]
}

const hashStr = (s) => {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const normalizeAssetContextSignals = (signals = []) => (
  Array.isArray(signals)
    ? signals.slice(0, 5).map((signal) => ({
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
  { id: 'tools', label: 'Tools', icon: WandSparkles },
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

function BrushLayerRenderer({ item, commonProps, onSelect, onChange, onDragStart, onDragMove, onDragEnd, onCursor, onItemHover, disableDrag, canvasBounds }) {
  const nodeRef = useRef(null)
  const fallbackImgRef = useRef(null)
  const sizeRef = useRef({ w: item.w, h: item.h })
  useEffect(() => { sizeRef.current = { w: item.w, h: item.h } }, [item.w, item.h])

  useLayoutEffect(() => {
    _brushImageNode = nodeRef.current
  })

  useEffect(() => {
    if (!_brushOffscreenCanvas && item.src) {
      const img = new window.Image()
      img.onload = () => {
        fallbackImgRef.current = img
        _brushFallbackImg = img
        nodeRef.current?.getLayer()?.batchDraw()
      }
      img.src = item.src
    }
  }, [item.src])

  const imageObj = _brushOffscreenCanvas || fallbackImgRef.current

  return (
    <Group
      id={item.id}
      x={item.x}
      y={item.y}
      rotation={item.rotation || 0}
      draggable={!item.locked && !disableDrag}
      opacity={item.opacity ?? 1}
      visible={item.visible !== false}
      onClick={(e) => onSelect(e, item.id)}
      onTap={(e) => onSelect(e, item.id)}
      onMouseEnter={() => { onItemHover(item.id); onCursor(item.locked ? 'default' : 'move') }}
      onMouseLeave={() => { onItemHover(null); onCursor('default') }}
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragMove={(e) => onDragMove?.(e, item.id)}
      onDragEnd={(e) => onDragEnd(e, item.id)}
    >
      <KonvaImage
        ref={nodeRef}
        image={imageObj}
        width={item.w}
        height={item.h}
        listening={false}
      />
      <Rect
        width={item.w}
        height={item.h}
        fill="transparent"
      />
    </Group>
  )
}

const canvasItemRenderers = {
  connector: ConnectorRenderer,
  image: ImageRenderer,
  text: TextRenderer,
  shape: ShapeRenderer,
  frame: FrameRenderer,
  brushLayer: BrushLayerRenderer,
}

function DefaultItemRenderer({ item, commonProps }) {
  const groupRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const node = groupRef.current
      if (!node) return
      effectManager.applyAll(node, item.effects, item)
    })
    return () => cancelAnimationFrame(raf)
  }, [item.effects, item])

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

const CanvasItemComparitor = (prev, next) => {
  if (prev.item !== next.item) return false
  if (prev.selectedId !== next.selectedId) return false
  if (prev.selectedIds !== next.selectedIds) return false
  if (prev.isTextEditing !== next.isTextEditing) return false
  if (prev.disableDrag !== next.disableDrag) return false
  if (prev.isShiftDown !== next.isShiftDown) return false
  if (prev.isCropTarget !== next.isCropTarget) return false
  if (prev.fontInjectVersion !== next.fontInjectVersion) return false
  return true
}
const CanvasItem = memo(function CanvasItemInner({ item, items, selectedId, selectedIds, onSelect, onChange, onDragStart, onDragMove, onDragEnd, onTextEdit, isTextEditing, onCursor, onItemHover, disableDrag, isShiftDown, getActiveTransformAnchor, dropTargetFrameId, dropTargetSlotIndex, editingFrameId, editingFrameSlot, onFrameImageEdit, onCropStart, allowComposite = false, fontInjectVersion }) {
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
      if (item.kind === 'shape' && item.shapeType === 'freehand') return
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
      fontInjectVersion={fontInjectVersion}
    />
  )
})

// Rect-type shapes: rotate corners (0,0),(w,0),(w,h),(0,h) around origin (ox,oy)
const drawRotatedRect = (ctx, ox, oy, w, h, cos, sin) => {
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox + w * cos, oy + w * sin)
  ctx.lineTo(ox + w * cos - h * sin, oy + w * sin + h * cos)
  ctx.lineTo(ox - h * sin, oy + h * cos)
  ctx.closePath()
}

// Rounded rect-type shapes: rotate all 12 points around origin (ox,oy)
const drawRotatedRoundedRect = (ctx, ox, oy, w, h, r, cos, sin) => {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  const rot = (x, y) => ({ x: ox + x * cos - y * sin, y: oy + x * sin + y * cos })
  const A1 = rot(r, 0), A2 = rot(w - r, 0)
  const Bc = rot(w, 0), B1 = rot(w, r), B2 = rot(w, h - r)
  const Cc = rot(w, h), C1 = rot(w - r, h), C2 = rot(r, h)
  const Dc = rot(0, h), D1 = rot(0, h - r), D2 = rot(0, r)
  const Ac = rot(0, 0)
  ctx.moveTo(A1.x, A1.y)
  ctx.lineTo(A2.x, A2.y)
  ctx.quadraticCurveTo(Bc.x, Bc.y, B1.x, B1.y)
  ctx.lineTo(B2.x, B2.y)
  ctx.quadraticCurveTo(Cc.x, Cc.y, C1.x, C1.y)
  ctx.lineTo(C2.x, C2.y)
  ctx.quadraticCurveTo(Dc.x, Dc.y, D1.x, D1.y)
  ctx.lineTo(D2.x, D2.y)
  ctx.quadraticCurveTo(Ac.x, Ac.y, A1.x, A1.y)
  ctx.closePath()
}

const drawCompositeMaskPath = (ctx, item) => {
  if (!item) return
  const w = Math.max(1, item.w || 1)
  const h = Math.max(1, item.h || item.fontSize || 1)
  const rotationDeg = item.rotation || 0
  const rotation = (rotationDeg * Math.PI) / 180
  const ox = item.x || 0
  const oy = item.y || 0
  const cx = ox + w / 2
  const cy = oy + h / 2

  ctx.beginPath()

  if (item.kind === 'text') {
    if (rotation) {
      const cos = Math.cos(rotation), sin = Math.sin(rotation)
      drawRotatedRect(ctx, ox, oy, w, h, cos, sin)
    } else {
      ctx.rect(ox, oy, w, h)
    }
    return
  }

  if (item.kind === 'shape') {
    if (item.shapeType === 'circle' || item.shapeType === 'ellipse') {
      if (rotation) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        const cx_abs = ox + (w / 2) * cos - (h / 2) * sin
        const cy_abs = oy + (w / 2) * sin + (h / 2) * cos
        ctx.ellipse(cx_abs, cy_abs, w / 2, h / 2, rotation, 0, Math.PI * 2)
      } else {
        ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
      }
    } else if (item.shapeType === 'polygon') {
      let centerX = cx, centerY = cy
      if (rotation) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        centerX = ox + (w / 2) * cos - (h / 2) * sin
        centerY = oy + (w / 2) * sin + (h / 2) * cos
      }
      const sides = Math.max(3, item.sides || 3)
      const radius = Math.min(w, h) / 2
      for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides + rotation
        const px = centerX + Math.cos(angle) * radius
        const py = centerY + Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
    } else if (item.shapeType === 'star') {
      let centerX = cx, centerY = cy
      if (rotation) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        centerX = ox + (w / 2) * cos - (h / 2) * sin
        centerY = oy + (w / 2) * sin + (h / 2) * cos
      }
      const points = item.numPoints || 5
      const outer = Math.min(w, h) / 2
      const inner = Math.min(w, h) * (item.starInnerRatio ?? 0.25)
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outer : inner
        const angle = -Math.PI / 2 + (i * Math.PI) / points + rotation
        const px = centerX + Math.cos(angle) * radius
        const py = centerY + Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
    } else if (item.shapeType === 'bezier-path' && item.path) {
      const cos = Math.cos(rotation), sin = Math.sin(rotation)
      const parts = item.path.split(/(?=[MLZ])/i).filter(Boolean)
      let first = true
      for (const part of parts) {
        if (/^z$/i.test(part)) { ctx.closePath(); break }
        const nums = part.slice(1).trim().split(/[, ]+/).map(Number)
        for (let i = 0; i < nums.length; i += 2) {
          const px = rotation ? ox + nums[i] * cos - nums[i + 1] * sin : ox + nums[i]
          const py = rotation ? oy + nums[i] * sin + nums[i + 1] * cos : oy + nums[i + 1]
          if (first) { ctx.moveTo(px, py); first = false }
          else ctx.lineTo(px, py)
        }
      }
      if (!/z/i.test(item.path)) ctx.closePath()
    } else {
      const r = Math.max(0, Math.min(item.cornerRadius || 0, w / 2, h / 2))
      if (rotation) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        if (r) {
          drawRotatedRoundedRect(ctx, ox, oy, w, h, r, cos, sin)
        } else {
          drawRotatedRect(ctx, ox, oy, w, h, cos, sin)
        }
      } else {
        if (r) {
          ctx.moveTo(ox + r, oy)
          ctx.lineTo(ox + w - r, oy)
          ctx.quadraticCurveTo(ox + w, oy, ox + w, oy + r)
          ctx.lineTo(ox + w, oy + h - r)
          ctx.quadraticCurveTo(ox + w, oy + h, ox + w - r, oy + h)
          ctx.lineTo(ox + r, oy + h)
          ctx.quadraticCurveTo(ox, oy + h, ox, oy + h - r)
          ctx.lineTo(ox, oy + r)
          ctx.quadraticCurveTo(ox, oy, ox + r, oy)
          ctx.closePath()
        } else {
          ctx.rect(ox, oy, w, h)
        }
      }
    }
  } else {
    const r = Math.max(0, Math.min(item.radius || item.cornerRadius || 0, w / 2, h / 2))
    if (rotation) {
      const cos = Math.cos(rotation), sin = Math.sin(rotation)
      if (r) {
        drawRotatedRoundedRect(ctx, ox, oy, w, h, r, cos, sin)
      } else {
        drawRotatedRect(ctx, ox, oy, w, h, cos, sin)
      }
    } else {
      if (r) {
        ctx.moveTo(ox + r, oy)
        ctx.lineTo(ox + w - r, oy)
        ctx.quadraticCurveTo(ox + w, oy, ox + w, oy + r)
        ctx.lineTo(ox + w, oy + h - r)
        ctx.quadraticCurveTo(ox + w, oy + h, ox + w - r, oy + h)
        ctx.lineTo(ox + r, oy + h)
        ctx.quadraticCurveTo(ox, oy + h, ox, oy + h - r)
        ctx.lineTo(ox, oy + r)
        ctx.quadraticCurveTo(ox, oy, ox + r, oy)
        ctx.closePath()
      } else {
        ctx.rect(ox, oy, w, h)
      }
    }
  }
}

const renderTextViaKonva = (item, isMask) => {
  const fontSize = item.fontSize || 48
  const fontFamily = item.fontFamily || 'Inter, Arial'
  const fontStyle = [item.isItalic && 'italic', item.isBold && 'bold'].filter(Boolean).join(' ')
  const maxW = Math.max(1, item.w || 1)
  const runs = item.runs || []
  const isMultiRun = runs.length > 1 || (runs.length === 1 && runs[0].fontFamily && runs[0].fontFamily !== fontFamily)
  const hasEffects = item.effects && Object.keys(item.effects).some(k => !['letterSpacing', 'curve'].includes(k))
  const fill = isMask ? '#ffffff' : (item.fill || '#ffffff')

  if (!isMultiRun) {
    const expectedH = Math.max(1, getWrappedMaskTextHeight(item))
    const container = document.createElement('div')
    const stage = new Konva.Stage({ width: maxW, height: expectedH, container })
    const layer = new Konva.Layer()
    stage.add(layer)
    const textNode = new Konva.Text({
      x: 0, y: 0,
      text: item.text,
      width: maxW,
      fontSize,
      fontFamily,
      fontStyle,
      lineHeight: hasEffects ? 1.25 : 0.9,
      wrap: 'word',
      align: item.align || 'center',
      fill,
      perfectDrawEnabled: false,
      listening: false,
    })
    layer.add(textNode)
    layer.draw()
    const actualH = Math.max(1, Math.ceil(textNode.height()))
    if (actualH !== expectedH) {
      stage.height(actualH); layer.draw()
    }
    const canvas = stage.toCanvas({ pixelRatio: 1 })
    stage.destroy()
    return { canvas, originY: 0 }
  }

  const measureCtx = document.createElement('canvas').getContext('2d')
  const lineHeight = fontSize * 0.9

  const charFonts = []
  for (const run of runs) {
    const rfs = run.fontSize || fontSize
    const rfsStyle = [run.italic && 'italic', run.bold && 'bold'].filter(Boolean).join(' ') || 'normal'
    const rff = run.fontFamily || fontFamily
    const rf = `${rfsStyle || ''} ${rfs}px ${rff}`.trim()
    const runFill = isMask ? '#ffffff' : (run.fill || item.fill || '#ffffff')
    for (const ch of run.text || '') {
      charFonts.push({ char: ch, font: rf, fontFamily: rff, fontStyle: rfsStyle, fill: runFill })
    }
  }

  const lines = []
  let currentLine = [], currentWidth = 0
  for (const cf of charFonts) {
    measureCtx.font = cf.font
    const cw = measureCtx.measureText(cf.char).width
    if (currentWidth + cw > maxW && currentLine.length > 0) {
      lines.push(currentLine); currentLine = []; currentWidth = 0
    }
    currentLine.push(cf); currentWidth += cw
  }
  if (currentLine.length > 0) lines.push(currentLine)

  const tYCache = {}
  const getTranslateY = (ff, fsStyle) => {
    const key = `${fsStyle}|${ff}`
    if (tYCache[key] !== undefined) return tYCache[key]
    measureCtx.font = `${fsStyle} ${fontSize}px ${ff}`
    const m = measureCtx.measureText('M')
    const tAcc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent ?? fontSize * 0.7
    const tDesc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent ?? fontSize * 0.2
    tYCache[key] = (tAcc - tDesc) / 2 + fontSize / 2
    return tYCache[key]
  }

  const baseFontFamily = item.fontFamily || 'Inter, Arial'
  const baseTranslateY = getTranslateY(baseFontFamily, 'normal')
  const align = item.align || 'center'

  let minYOff = 0, maxYOff = 0
  const konvaNodes = []
  lines.forEach((lineChars, li) => {
    let lineWidth = 0
    for (const lc of lineChars) { measureCtx.font = lc.font; lineWidth += measureCtx.measureText(lc.char).width }
    const startX = align === 'right'
      ? Math.max(0, maxW - lineWidth)
      : align === 'left' ? 0 : Math.max(0, (maxW - lineWidth) / 2)
    let cursorX = startX
    for (const lc of lineChars) {
      const charTranslateY = getTranslateY(lc.fontFamily, lc.fontStyle || 'normal')
      const yOff = Math.round(baseTranslateY - charTranslateY)
      if (yOff < minYOff) minYOff = yOff
      if (yOff > maxYOff) maxYOff = yOff
      measureCtx.font = lc.font
      konvaNodes.push({
        x: cursorX,
        y: li * lineHeight + yOff,
        text: lc.char,
        w: measureCtx.measureText(lc.char).width + 2,
        fontFamily: lc.fontFamily,
        fontStyle: lc.fontStyle || 'normal',
        fill: lc.fill,
      })
      cursorX += measureCtx.measureText(lc.char).width
    }
  })

  const baseH = Math.max(1, (lines.length || 1) * lineHeight)
  let originY = 0
  let stageH = baseH
  if (minYOff < 0) { originY = -minYOff; stageH = baseH + originY }
  if (maxYOff > 0) stageH = baseH + originY + maxYOff
  const container = document.createElement('div')
  const stage = new Konva.Stage({ width: maxW, height: Math.max(1, stageH), container })
  const layer = new Konva.Layer()
  stage.add(layer)

  for (const n of konvaNodes) {
    layer.add(new Konva.Text({
      x: n.x, y: n.y + originY,
      text: n.text, width: n.w,
      fontSize, fontFamily: n.fontFamily, fontStyle: n.fontStyle,
      fill: n.fill || fill, wrap: 'none',
      perfectDrawEnabled: false, listening: false,
    }))
  }

  layer.draw()
  const canvas = stage.toCanvas({ pixelRatio: 1 })
  stage.destroy()
  return { canvas, originY: -(originY) }
}

const drawWrappedMaskText = (ctx, item, offsetX, offsetY) => {
  const rotation = ((item.rotation || 0) * Math.PI) / 180
  const scaleX = item.scaleX || 1
  const scaleY = item.scaleY || 1
  const result = renderTextViaKonva(item, true)
  if (!result) return
  ctx.save()
  ctx.translate((item.x || 0) - offsetX, (item.y || 0) - offsetY)
  if (rotation) ctx.rotate(rotation)
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY)
  ctx.drawImage(result.canvas, 0, result.originY)
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
  const fontFamily = item.fontFamily || 'Inter, Arial'
  const width = Math.max(1, item.w || 1)
  const lineHeight = fontSize * 0.9
  if (typeof document === 'undefined') return Math.max(item.h || 0, lineHeight)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return Math.max(item.h || 0, lineHeight)
  const runs = item.runs || []
  const isMultiRun = runs.length > 1 || (runs.length === 1 && runs[0].fontFamily && runs[0].fontFamily !== fontFamily)
  let lineCount
  if (!isMultiRun) {
    const fontStyle = item.fontStyle || [item.isItalic && 'italic', item.isBold && 'bold'].filter(Boolean).join(' ')
    ctx.font = `${fontStyle || ''} ${fontSize}px ${fontFamily}`.trim()
    lineCount = getMaskTextLines(ctx, item.text, width).length
  } else {
    const charFonts = []
    for (const run of runs) {
      const runFontSize = run.fontSize || fontSize
      const runFontStyle = [run.italic && 'italic', run.bold && 'bold'].filter(Boolean).join(' ')
      const runFontFamily = run.fontFamily || fontFamily
      const runFont = `${runFontStyle || ''} ${runFontSize}px ${runFontFamily}`.trim()
      for (const ch of run.text || '') {
        charFonts.push({ char: ch, font: runFont })
      }
    }
    const lines = []
    let currentLine = []
    let currentWidth = 0
    for (const cf of charFonts) {
      ctx.font = cf.font
      const charWidth = ctx.measureText(cf.char).width
      if (currentWidth + charWidth > width && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = []
        currentWidth = 0
      }
      currentLine.push(cf)
      currentWidth += charWidth
    }
    if (currentLine.length > 0) lines.push(currentLine)
    lineCount = lines.length || 1
  }
  return Math.max(item.h || 0, Math.max(1, lineCount) * lineHeight)
}

const drawDestinationTextItem = (ctx, item, offsetX, offsetY) => {
  if (!item || item.visible === false) return
  const rotation = ((item.rotation || 0) * Math.PI) / 180
  const scaleX = item.scaleX || 1
  const scaleY = item.scaleY || 1
  const result = renderTextViaKonva(item, false)
  if (!result) return
  ctx.save()
  ctx.translate((item.x || 0) - offsetX, (item.y || 0) - offsetY)
  if (rotation) ctx.rotate(rotation)
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY)
  ctx.globalAlpha = item.opacity ?? 1
  ctx.drawImage(result.canvas, 0, result.originY)
  ctx.restore()
}

const drawDestinationShapeItem = (ctx, item, offsetX, offsetY) => {
  if (!item || item.visible === false) return
  const x = (item.x || 0) - offsetX
  const y = (item.y || 0) - offsetY
  const rotation = ((item.rotation || 0) * Math.PI) / 180
  const scaleX = item.scaleX || 1
  const scaleY = item.scaleY || 1
  ctx.save()
  ctx.translate(x, y)
  if (rotation) ctx.rotate(rotation)
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY)
  ctx.globalAlpha = item.opacity ?? 1
  const w = Math.max(1, item.w || 1)
  const h = Math.max(1, item.h || 1)
  const st = item.shapeType
  ctx.beginPath()
  if (st === 'circle' || st === 'ellipse') {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  } else if (st === 'polygon') {
    const sides = Math.max(3, item.sides || 3)
    const radius = Math.min(w, h) / 2
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides
      const px = w / 2 + Math.cos(angle) * radius
      const py = h / 2 + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath()
  } else if (st === 'star') {
    const pts = item.numPoints || 5
    const outer = Math.min(w, h) / 2
    const inner = Math.min(w, h) * (item.starInnerRatio ?? 0.25)
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const angle = -Math.PI / 2 + (i * Math.PI) / pts
      const px = w / 2 + Math.cos(angle) * r
      const py = h / 2 + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath()
  } else if (st === 'bezier-path' && item.path) {
    const parts = item.path.split(/(?=[MLZ])/i).filter(Boolean)
    let first = true
    for (const part of parts) {
      if (/^z$/i.test(part)) { ctx.closePath(); break }
      const nums = part.slice(1).trim().split(/[, ]+/).map(Number)
      for (let i = 0; i < nums.length; i += 2) {
        const px = nums[i]; const py = nums[i + 1]
        if (first) { ctx.moveTo(px, py); first = false }
        else ctx.lineTo(px, py)
      }
    }
    if (!/z/i.test(item.path)) ctx.closePath()
  } else {
    const r = Math.max(0, Math.min(item.cornerRadius || 0, w / 2, h / 2))
    if (r) {
      ctx.moveTo(r, 0); ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
    } else {
      ctx.rect(0, 0, w, h)
    }
  }
  const fillColor = item.fill
  if (fillColor && fillColor !== 'transparent') {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
  const sw = item.strokeWidth || 0
  if (sw > 0 && item.stroke) {
    ctx.strokeStyle = item.stroke
    ctx.lineWidth = sw
    ctx.stroke()
  }
  ctx.restore()
}

const getCompositeItemBounds = (item) => {
  const x = item.x || 0
  const y = item.y || 0
  const w = Math.max(1, item.w || 1)
  const h = Math.max(1, item.kind === 'text' ? getWrappedMaskTextHeight(item) : (item.h || item.fontSize || 1))
  const rotationDeg = item.rotation || 0
  const rotation = (rotationDeg * Math.PI) / 180
  const scaleX = item.scaleX || 1
  const scaleY = item.scaleY || 1
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const dw = w * scaleX
  const dh = h * scaleY
  const corners = [
    { x: 0, y: 0 },
    { x: dw, y: 0 },
    { x: dw, y: dh },
    { x: 0, y: dh },
  ].map((point) => ({
    x: x + point.x * cos - point.y * sin,
    y: y + point.x * sin + point.y * cos,
  }))
  const result = {
    left: Math.min(...corners.map((point) => point.x)),
    top: Math.min(...corners.map((point) => point.y)),
    right: Math.max(...corners.map((point) => point.x)),
    bottom: Math.max(...corners.map((point) => point.y)),
  }
  return result
}

const drawImageItemToCanvas = (ctx, item, image, offsetX, offsetY) => {
  if (!image || item.visible === false) return
  const x = (item.x || 0) - offsetX
  const y = (item.y || 0) - offsetY
  const w = Math.max(1, item.w || image.naturalWidth || image.width || 1)
  const h = Math.max(1, item.h || image.naturalHeight || image.height || 1)
  const rotation = ((item.rotation || 0) * Math.PI) / 180
  const scaleX = item.scaleX || 1
  const scaleY = item.scaleY || 1
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
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY)
  if (crop) {
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h)
  } else {
    ctx.drawImage(image, 0, 0, w, h)
  }
  ctx.restore()
}

const renderCompositeShadow = (contentCanvas, sourceItem) => {
  if (!sourceItem?.compositeShadowEnabled) return null
  const shadowColor = sourceItem.compositeShadowColor || '#050505'
  const shadowBlur = Math.max(0, sourceItem.compositeShadow ?? 15)
  const shadowOpacity = Math.max(0, Math.min(1, sourceItem.compositeShadowOpacity ?? 0.35))
  const shadowOffsetX = sourceItem.compositeShadowOffsetX ?? 0
  const shadowOffsetY = sourceItem.compositeShadowOffsetY ?? 4
  const expand = Math.ceil(shadowBlur + Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY), 0))
  if (!expand) return null
  const W = contentCanvas.width
  const H = contentCanvas.height
  if (!W || !H) return null
  const newW = W + expand * 2
  const newH = H + expand * 2

  // Fill content shape with shadow color, preserving alpha
  const shadowContent = document.createElement('canvas')
  shadowContent.width = newW
  shadowContent.height = newH
  const scCtx = shadowContent.getContext('2d')
  if (!scCtx) return null
  scCtx.drawImage(contentCanvas, expand, expand)
  scCtx.globalCompositeOperation = 'source-in'
  scCtx.globalAlpha = shadowOpacity
  scCtx.fillStyle = shadowColor
  scCtx.fillRect(0, 0, newW, newH)
  scCtx.globalCompositeOperation = 'source-over'
  scCtx.globalAlpha = 1

  // Blur shadow
  const blurredShadow = document.createElement('canvas')
  blurredShadow.width = newW
  blurredShadow.height = newH
  const bsCtx = blurredShadow.getContext('2d')
  if (!bsCtx) return null
  bsCtx.filter = `blur(${shadowBlur}px)`
  bsCtx.drawImage(shadowContent, 0, 0)
  bsCtx.filter = 'none'

  // Composite: shadow + content
  const result = document.createElement('canvas')
  result.width = newW
  result.height = newH
  const rCtx = result.getContext('2d')
  if (!rCtx) return null
  rCtx.drawImage(blurredShadow, shadowOffsetX, shadowOffsetY)
  rCtx.drawImage(contentCanvas, expand, expand)

  return { canvas: result, offsetX: -expand, offsetY: -expand }
}

const createCompositeStrokeCanvas = (sourceCanvas, strokeWidth, strokeColor) => {
  const sw = Math.max(1, Math.round(strokeWidth || 0))
  if (!sw) return null
  const w = sourceCanvas.width
  const h = sourceCanvas.height
  const canvas = document.createElement('canvas')
  canvas.width = w + sw * 2
  canvas.height = h + sw * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const steps = Math.max(16, Math.min(40, sw * 4))
  for (let i = 0; i < steps; i++) {
    const angle = (Math.PI * 2 * i) / steps
    ctx.drawImage(sourceCanvas, sw + Math.cos(angle) * sw, sw + Math.sin(angle) * sw)
  }
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = strokeColor || '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'source-over'
  return canvas
}

const _destFxCache = new Map()
const _DESTFX_CACHE_MAX = 32

const getDestFxKey = (item) =>
  `${item.src}|${item.w}|${item.h}|${item.scaleX}|${item.scaleY}|${item.rotation}|${item.opacity}|${JSON.stringify(item.imageCropRect)}|${JSON.stringify(item.effects)}`

const drawDestinationWithEffects = (contentCtx, item, image, groupMinX, groupMinY) => {
  if (!item.effects || Object.keys(item.effects).length === 0) {
    drawImageItemToCanvas(contentCtx, item, image, groupMinX, groupMinY)
    return
  }
  const b = getCompositeItemBounds(item)
  const itemW = Math.ceil(b.right - b.left)
  const itemH = Math.ceil(b.bottom - b.top)
  const cacheKey = getDestFxKey(item)
  const cached = _destFxCache.get(cacheKey)
  if (cached && cached.w === itemW && cached.h === itemH) {
    contentCtx.drawImage(cached.canvas, b.left - groupMinX, b.top - groupMinY)
    return
  }
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = itemW
  tempCanvas.height = itemH
  const tempCtx = tempCanvas.getContext('2d')
  try {
    drawImageItemToCanvas(tempCtx, item, image, b.left, b.top)
    const imageData = tempCtx.getImageData(0, 0, itemW, itemH)
    effectManager.applyEffectsToImageData(imageData, item.effects)
    tempCtx.putImageData(imageData, 0, 0)
    contentCtx.drawImage(tempCanvas, b.left - groupMinX, b.top - groupMinY)
    if (_destFxCache.size >= _DESTFX_CACHE_MAX) {
      const firstKey = _destFxCache.keys().next().value
      _destFxCache.delete(firstKey)
    }
    _destFxCache.set(cacheKey, { canvas: tempCanvas, w: itemW, h: itemH })
  } catch (e) {
    console.warn('[drawDestinationWithEffects] fallback to raw draw:', e)
    drawImageItemToCanvas(contentCtx, item, image, groupMinX, groupMinY)
  }
}

const drawAnyItemToCanvas = (ctx, item, imageMap, offsetX, offsetY) => {
  if (!item || item.visible === false) return
  if (item.kind === 'image') {
    const img = imageMap?.[item.id || item.src] || imageMap?.[item.src]
    if (img) drawDestinationWithEffects(ctx, item, img, offsetX, offsetY)
  } else if (item.kind === 'text') {
    drawDestinationTextItem(ctx, item, offsetX, offsetY)
  } else if (item.kind === 'shape') {
    drawDestinationShapeItem(ctx, item, offsetX, offsetY)
  }
}

function CompositeTextBitmap({ sourceItem, destinationItems, bounds, mode, isDraggingRef }) {
  const allItems = useMemo(() => destinationItems, [destinationItems])
  const imageItems = useMemo(() => destinationItems.filter((item) => item.kind === 'image' && item.src), [destinationItems])
  const loadedImages = useCanvasImages(imageItems.map((item) => item.src))
  const imageMap = useMemo(() => {
    const map = {}
    imageItems.forEach((item, i) => { map[item.id] = loadedImages[i]; map[item.src] = loadedImages[i] })
    return map
  }, [imageItems, loadedImages])
  const imageRef = useRef(null)
  const [fontReady, setFontReady] = useState(false)
  const prevImageIdsRef = useRef()
  const prevModeRef = useRef()

  useEffect(() => {
    let cancelled = false
    setFontReady(false)
    const families = new Set([sourceItem?.fontFamily || 'Inter, Arial'])
    ;(sourceItem?.runs || []).forEach(r => { if (r.fontFamily) families.add(r.fontFamily) })
    Promise.all([...families].map(f => preloadFont(f).catch(() => {})))
      .finally(() => {
        if (!cancelled) setFontReady(true)
      })
    return () => { cancelled = true }
  }, [sourceItem?.fontFamily, sourceItem?.runs])

  const strokeRef = useRef(null)

  useLayoutEffect(() => {
    const updateBitmap = (newCanvas, newX, newY, w, h) => {
      const node = imageRef.current
      if (!node) return
      node.image(newCanvas || null)
      node.x(newX || 0)
      node.y(newY || 0)
      node.width(w || 0)
      node.height(h || 0)
      node.getLayer()?.batchDraw()
    }
    const updateStrokeBitmap = (sourceCanvas, sw, sc, imgX, imgY) => {
      const sNode = strokeRef.current
      if (!sNode || !sw || !sourceCanvas) {
        if (sNode) { sNode.image(null); sNode.getLayer()?.batchDraw() }
        return
      }
      const strokeCanvas = createCompositeStrokeCanvas(sourceCanvas, sw, sc || '#ffffff')
      if (!strokeCanvas) { sNode.image(null); sNode.getLayer()?.batchDraw(); return }
      sNode.image(strokeCanvas)
      sNode.x((imgX || 0) - sw)
      sNode.y((imgY || 0) - sw)
      sNode.width(strokeCanvas.width)
      sNode.height(strokeCanvas.height)
      sNode.getLayer()?.batchDraw()
    }

    if (isDraggingRef?.current) return () => {}

    if (!fontReady || !sourceItem || !bounds || !allItems.length) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      return
    }
    const imagesReady = !imageItems.length || imageItems.every((_, index) => {
      const image = loadedImages[index]
      return image && image.complete && (image.naturalWidth || image.width)
    })
    if (!imagesReady) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      return
    }

    const currentItemIds = allItems.map(i => i.id).join(',')
    const isNewContent = currentItemIds !== prevImageIdsRef.current
      || mode !== prevModeRef.current
    prevImageIdsRef.current = currentItemIds
    prevModeRef.current = mode

    if (isNewContent) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
    }

    const rafId = requestAnimationFrame(() => {
      const sourceWidth = Math.max(1, sourceItem.w || sourceItem.width || 1)
      const wrappedSourceHeight = getWrappedMaskTextHeight({ ...sourceItem, w: sourceWidth })
      const sourceHeight = Math.max(1, sourceItem.h || 0, sourceItem.height || 0, wrappedSourceHeight)
      const textLeft = sourceItem.x || 0
      const textTop = sourceItem.y || 0
      const textRenderItem = { ...sourceItem, x: textLeft, y: textTop, w: sourceWidth, h: sourceHeight }
      const itemBounds = [
        ...allItems.map((item) => getCompositeItemBounds(item)),
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
      allItems.forEach((item) => {
        drawAnyItemToCanvas(contentCtx, item, imageMap, groupMinX, groupMinY)
      })

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

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

      const shadowResult = renderCompositeShadow(canvas, sourceItem)
      const finalCanvas = shadowResult?.canvas || canvas
      const finalX = shadowResult ? groupRect.x + (shadowResult.offsetX || 0) : groupRect.x
      const finalY = shadowResult ? groupRect.y + (shadowResult.offsetY || 0) : groupRect.y
      const finalW = shadowResult ? finalCanvas.width : width
      const finalH = shadowResult ? finalCanvas.height : height

      updateBitmap(finalCanvas, finalX, finalY, finalW, finalH)
      const compositeStrokeEnabled = !!(sourceItem?.compositeStrokeEnabled && (sourceItem?.compositeStrokeWidth ?? 0) > 0)
      if (compositeStrokeEnabled) {
        const sw = sourceItem?.compositeStrokeWidth || 0
        updateStrokeBitmap(canvas, sw, sourceItem?.compositeStrokeColor || '#ffffff', groupRect.x, groupRect.y)
      } else {
        updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [bounds, destinationItems, allItems, imageItems, imageMap, loadedImages, mode, sourceItem])

  return (
    <>
      <KonvaImage
        ref={strokeRef}
        listening={false}
        perfectDrawEnabled={false}
      />
      <KonvaImage
        ref={imageRef}
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  )
}


function CompositeImageBitmap({ sourceItem, destinationItems, bounds, mode, isDraggingRef }) {
  const allItems = useMemo(() => destinationItems, [destinationItems])
  const imageItems = useMemo(() => destinationItems.filter((item) => item.kind === 'image' && item.src), [destinationItems])
  const loadedImages = useCanvasImages(imageItems.map((item) => item.src))
  const imageMap = useMemo(() => {
    const map = {}
    imageItems.forEach((item, i) => { map[item.id] = loadedImages[i]; map[item.src] = loadedImages[i] })
    return map
  }, [imageItems, loadedImages])
  const sourceImage = useCanvasImage(sourceItem?.src)
  const imageRef = useRef(null)
  const strokeRef = useRef(null)
  const prevSourceIdRef = useRef()
  const prevSourceSrcRef = useRef()
  const prevImageIdsRef = useRef()
  const prevModeRef = useRef()

  useLayoutEffect(() => {
    const updateBitmap = (newCanvas, newX, newY, w, h) => {
      const node = imageRef.current
      if (!node) return
      node.image(newCanvas || null)
      node.x(newX || 0)
      node.y(newY || 0)
      node.width(w || 0)
      node.height(h || 0)
      node.getLayer()?.batchDraw()
    }
    const updateStrokeBitmap = (sourceCanvas, sw, sc, imgX, imgY) => {
      const sNode = strokeRef.current
      if (!sNode || !sw || !sourceCanvas) {
        if (sNode) { sNode.image(null); sNode.getLayer()?.batchDraw() }
        return
      }
      const strokeCanvas = createCompositeStrokeCanvas(sourceCanvas, sw, sc || '#ffffff')
      if (!strokeCanvas) { sNode.image(null); sNode.getLayer()?.batchDraw(); return }
      sNode.image(strokeCanvas)
      sNode.x((imgX || 0) - sw)
      sNode.y((imgY || 0) - sw)
      sNode.width(strokeCanvas.width)
      sNode.height(strokeCanvas.height)
      sNode.getLayer()?.batchDraw()
    }

    if (isDraggingRef?.current) return () => {}

    if (!sourceItem || !bounds || !allItems.length || !sourceImage) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      return
    }
    const imagesReady = !imageItems.length || imageItems.every((_, index) => {
      const img = loadedImages[index]
      return img && img.complete && (img.naturalWidth || img.width)
    })
    if (!imagesReady || !sourceImage.complete) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      return
    }

    const currentItemIds = allItems.map(i => i.id).join(',')
    const isNewContent = sourceItem?.id !== prevSourceIdRef.current
      || sourceItem?.src !== prevSourceSrcRef.current
      || currentItemIds !== prevImageIdsRef.current
      || mode !== prevModeRef.current
    prevSourceIdRef.current = sourceItem?.id
    prevSourceSrcRef.current = sourceItem?.src
    prevImageIdsRef.current = currentItemIds
    prevModeRef.current = mode

    if (isNewContent) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
    }

    const rafId = requestAnimationFrame(() => {
      const itemBounds = [
        ...allItems.map((item) => getCompositeItemBounds(item)),
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
      allItems.forEach((item) => {
        drawAnyItemToCanvas(contentCtx, item, imageMap, groupMinX, groupMinY)
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

      const shadowResult = renderCompositeShadow(canvas, sourceItem)
      const finalCanvas = shadowResult?.canvas || canvas
      const finalX = shadowResult ? groupMinX + (shadowResult.offsetX || 0) : groupMinX
      const finalY = shadowResult ? groupMinY + (shadowResult.offsetY || 0) : groupMinY
      const finalW = shadowResult ? finalCanvas.width : width
      const finalH = shadowResult ? finalCanvas.height : height

      updateBitmap(finalCanvas, finalX, finalY, finalW, finalH)
      const compositeStrokeEnabled = !!(sourceItem?.compositeStrokeEnabled && (sourceItem?.compositeStrokeWidth ?? 0) > 0)
      if (compositeStrokeEnabled) {
        const sw = sourceItem?.compositeStrokeWidth || 0
        updateStrokeBitmap(canvas, sw, sourceItem?.compositeStrokeColor || '#ffffff', groupMinX, groupMinY)
      } else {
        updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [bounds, destinationItems, allItems, imageItems, imageMap, loadedImages, mode, sourceItem, sourceImage])

  return (
    <>
      <KonvaImage
        ref={strokeRef}
        listening={false}
        perfectDrawEnabled={false}
      />
      <KonvaImage
        ref={imageRef}
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  )
}

const getEffectedAlphaMask = (sourceItem, sourceImage) => {
  if (!sourceItem || !sourceImage) return null
  const w = Math.max(1, Math.ceil(sourceItem.w || sourceImage.naturalWidth || sourceImage.width || 1))
  const h = Math.max(1, Math.ceil(sourceItem.h || sourceImage.naturalHeight || sourceImage.height || 1))
  const scaleX = sourceItem.scaleX || 1
  const scaleY = sourceItem.scaleY || 1
  const rotation = ((sourceItem.rotation || 0) * Math.PI) / 180
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const dw = w * scaleX
  const dh = h * scaleY
  /* Origin-based AABB: rotate rect (0,0)-(dw,dh) around origin (0,0) */
  const corners = [
    { x: 0, y: 0 },
    { x: dw, y: 0 },
    { x: dw, y: dh },
    { x: 0, y: dh },
  ].map((p) => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }))
  const canvasMinX = Math.min(...corners.map((p) => p.x))
  const canvasMinY = Math.min(...corners.map((p) => p.y))
  const canvasW = Math.max(1, Math.ceil(Math.max(...corners.map((p) => p.x)) - canvasMinX))
  const canvasH = Math.max(1, Math.ceil(Math.max(...corners.map((p) => p.y)) - canvasMinY))
  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const sourceWidth = sourceImage.naturalWidth || sourceImage.width || w
  const sourceHeight = sourceImage.naturalHeight || sourceImage.height || h
  const crop = sourceItem.imageCropRect ? {
    x: Math.max(0, Math.min(sourceWidth, sourceItem.imageCropRect.x || 0)),
    y: Math.max(0, Math.min(sourceHeight, sourceItem.imageCropRect.y || 0)),
    width: Math.max(1, Math.min(sourceWidth, sourceItem.imageCropRect.width || sourceWidth)),
    height: Math.max(1, Math.min(sourceHeight, sourceItem.imageCropRect.height || sourceHeight)),
  } : null

  const timerLabel = `[getEffectedAlphaMask] ${sourceItem.id || 'anon'} ${canvasW}x${canvasH}`
  console.time(timerLabel)

  ctx.save()
  ctx.globalAlpha = sourceItem.opacity ?? 1
  ctx.translate(-canvasMinX, -canvasMinY)
  if (rotation) ctx.rotate(rotation)
  ctx.scale(scaleX, scaleY)
  if (crop) {
    ctx.drawImage(sourceImage, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h)
  } else {
    ctx.drawImage(sourceImage, 0, 0, w, h)
  }
  ctx.restore()

  if (sourceItem.effects && Object.keys(sourceItem.effects).length > 0) {
    try {
      const imageData = ctx.getImageData(0, 0, canvasW, canvasH)
      effectManager.applyEffectsToImageData(imageData, sourceItem.effects)
      ctx.putImageData(imageData, 0, 0)
    } catch (e) {
      console.warn('[getEffectedAlphaMask] effect apply failed:', e)
    }
  }

  /* Fill AABB gaps with transparent black — alpha compositing should not extend beyond original image content */
  if (rotation !== 0 && scaleX && scaleY) {
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH)
    const cosR = Math.cos(rotation)
    const sinR = Math.sin(rotation)
    for (let y = 0; y < canvasH; y++) {
      for (let x = 0; x < canvasW; x++) {
        const idx = (y * canvasW + x) * 4
        if (imageData.data[idx + 3] > 0) continue /* already opaque */
        /* Inverse-rotate pixel to check if it's within the unrotated rectangle at origin */
        const dx = x + canvasMinX
        const dy = y + canvasMinY
        const rx = dx * cosR + dy * sinR
        const ry = -dx * sinR + dy * cosR
        if (rx >= 0 && rx <= dw && ry >= 0 && ry <= dh) continue /* intentional alpha=0 (transparent image or chroma key) */
        /* Outside unrotated rect → AABB gap → fill transparent (no mask contribution) */
        imageData.data[idx + 3] = 0
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

  console.timeEnd(timerLabel)

  return { canvas, originOffsetX: canvasMinX, originOffsetY: canvasMinY }
}

const getBezierMaskCanvas = (sourceItem) => {
  if (!sourceItem || !sourceItem.path) return null
  const w = Math.max(1, Math.ceil(sourceItem.w || 1))
  const h = Math.max(1, Math.ceil(sourceItem.h || 1))
  const scaleX = sourceItem.scaleX || 1
  const scaleY = sourceItem.scaleY || 1
  const rotation = ((sourceItem.rotation || 0) * Math.PI) / 180
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const dw = w * scaleX
  const dh = h * scaleY
  /* Origin-based AABB */
  const corners = [
    { x: 0, y: 0 },
    { x: dw, y: 0 },
    { x: dw, y: dh },
    { x: 0, y: dh },
  ].map((p) => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }))
  const canvasMinX = Math.min(...corners.map((p) => p.x))
  const canvasMinY = Math.min(...corners.map((p) => p.y))
  const canvasW = Math.max(1, Math.ceil(Math.max(...corners.map((p) => p.x)) - canvasMinX))
  const canvasH = Math.max(1, Math.ceil(Math.max(...corners.map((p) => p.y)) - canvasMinY))
  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.save()
  ctx.globalAlpha = sourceItem.opacity ?? 1
  ctx.translate(-canvasMinX, -canvasMinY)
  if (rotation) ctx.rotate(rotation)
  ctx.scale(scaleX, scaleY)
  try {
    const maskPathStr = sourceItem.bezierData ? (() => {
      const pts = []
      const parts = sourceItem.path?.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/g)
      if (parts && parts.length >= 2) {
        for (const p of parts) {
          const m = p.match(/[ML]\s+([\d.]+)\s*,\s*([\d.]+)/)
          if (m) pts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) })
        }
        const cp = sourceItem.bezierData
        const n = pts.length
        let result = `M ${pts[0].x},${pts[0].y}`
        for (let i = 0; i < n; i++) {
          const curr = pts[i]; const next = pts[(i + 1) % n]
          const cpo = cp?.[i]; const cpi = cp?.[(i + 1) % n]
          const hasCurve = cpo && cpi && (cpo.cpOutX || cpo.cpOutY || cpi.cpInX || cpi.cpInY)
          if (hasCurve) {
            result += ` C ${curr.x + cpo.cpOutX},${curr.y + cpo.cpOutY} ${next.x + cpi.cpInX},${next.y + cpi.cpInY} ${next.x},${next.y}`
          } else {
            result += ` L ${next.x},${next.y}`
          }
        }
        return result + ' Z'
      }
      return sourceItem.path
    })() : (sourceItem.path || '')
    const path = new Path2D(maskPathStr)
    ctx.fillStyle = '#ffffff'
    ctx.fill(path)
  } catch (e) {
    console.warn('[getBezierMaskCanvas] Path2D failed:', e)
    ctx.restore()
    return null
  }
  ctx.restore()

  if (sourceItem.effects && Object.keys(sourceItem.effects).length > 0) {
    try {
      const imageData = ctx.getImageData(0, 0, canvasW, canvasH)
      effectManager.applyEffectsToImageData(imageData, sourceItem.effects)
      ctx.putImageData(imageData, 0, 0)
    } catch (e) {
      console.warn('[getBezierMaskCanvas] effect apply failed:', e)
    }
  }

  return { canvas, originOffsetX: canvasMinX, originOffsetY: canvasMinY }
}

const getShapeMaskCanvas = (sourceItem) => {
  if (!sourceItem) return null
  const w = Math.max(1, Math.ceil(sourceItem.w || 1))
  const h = Math.max(1, Math.ceil(sourceItem.h || 1))
  const scaleX = sourceItem.scaleX || 1
  const scaleY = sourceItem.scaleY || 1
  const rotation = ((sourceItem.rotation || 0) * Math.PI) / 180
  const cos = Math.cos(rotation), sin = Math.sin(rotation)
  const dw = w * scaleX, dh = h * scaleY
  const corners = [
    { x: 0, y: 0 }, { x: dw, y: 0 }, { x: dw, y: dh }, { x: 0, y: dh },
  ].map(p => ({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos }))
  const canvasMinX = Math.min(...corners.map(p => p.x))
  const canvasMinY = Math.min(...corners.map(p => p.y))
  const canvasW = Math.max(1, Math.ceil(Math.max(...corners.map(p => p.x)) - canvasMinX))
  const canvasH = Math.max(1, Math.ceil(Math.max(...corners.map(p => p.y)) - canvasMinY))
  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.save()
  ctx.globalAlpha = sourceItem.opacity ?? 1
  ctx.translate(-canvasMinX, -canvasMinY)
  if (rotation) ctx.rotate(rotation)
  ctx.scale(scaleX, scaleY)

  ctx.beginPath()
  const st = sourceItem.shapeType
  if (st === 'circle' || st === 'ellipse') {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  } else if (st === 'polygon') {
    const sides = Math.max(3, sourceItem.sides || 3)
    const radius = Math.min(w, h) / 2
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides
      const px = w / 2 + Math.cos(angle) * radius
      const py = h / 2 + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath()
  } else if (st === 'star') {
    const pts = sourceItem.numPoints || 5
    const outer = Math.min(w, h) / 2
    const inner = Math.min(w, h) * (sourceItem.starInnerRatio ?? 0.25)
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const angle = -Math.PI / 2 + (i * Math.PI) / pts
      const px = w / 2 + Math.cos(angle) * r
      const py = h / 2 + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath()
  } else if (st === 'bezier-path' && sourceItem.path) {
    const parts = sourceItem.path.split(/(?=[MLZ])/i).filter(Boolean)
    let first = true
    for (const part of parts) {
      if (/^z$/i.test(part)) { ctx.closePath(); break }
      const nums = part.slice(1).trim().split(/[, ]+/).map(Number)
      for (let i = 0; i < nums.length; i += 2) {
        const px = nums[i]; const py = nums[i + 1]
        if (first) { ctx.moveTo(px, py); first = false }
        else ctx.lineTo(px, py)
      }
    }
    if (!/z/i.test(sourceItem.path)) ctx.closePath()
  } else {
    const r = Math.max(0, Math.min(sourceItem.cornerRadius || 0, w / 2, h / 2))
    if (r) {
      ctx.moveTo(r, 0); ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
    } else {
      ctx.rect(0, 0, w, h)
    }
  }
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  if (sourceItem.effects && Object.keys(sourceItem.effects).length > 0) {
    try {
      const imageData = ctx.getImageData(0, 0, canvasW, canvasH)
      effectManager.applyEffectsToImageData(imageData, sourceItem.effects)
      ctx.putImageData(imageData, 0, 0)
    } catch (e) {
      console.warn('[getShapeMaskCanvas] effect apply failed:', e)
    }
  }

  if (rotation !== 0 && scaleX && scaleY) {
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH)
    for (let y = 0; y < canvasH; y++) {
      for (let x = 0; x < canvasW; x++) {
        const idx = (y * canvasW + x) * 4
        if (imageData.data[idx + 3] > 0) continue
        const dx = x + canvasMinX, dy = y + canvasMinY
        const rx = dx * cos + dy * sin, ry = -dx * sin + dy * cos
        if (rx >= 0 && rx <= dw && ry >= 0 && ry <= dh) continue
        imageData.data[idx + 3] = 0
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

  return { canvas, originOffsetX: canvasMinX, originOffsetY: canvasMinY }
}

function CompositeAlphaBitmap({ sourceItem, destinationItems, bounds, mode, isDraggingRef }) {
  const allItems = useMemo(() => destinationItems, [destinationItems])
  const imageItems = useMemo(() => destinationItems.filter((item) => item.kind === 'image' && item.src), [destinationItems])
  const loadedImages = useCanvasImages(imageItems.map((item) => item.src))
  const imageMap = useMemo(() => {
    const map = {}
    imageItems.forEach((item, i) => { map[item.id] = loadedImages[i]; map[item.src] = loadedImages[i] })
    return map
  }, [imageItems, loadedImages])
  const sourceImage = useCanvasImage(sourceItem?.src)
  const imageRef = useRef(null)
  const strokeRef = useRef(null)
  const maskCacheRef = useRef(null)
  const maskKeyRef = useRef(null)
  const prevSourceIdRef = useRef()
  const prevSourceSrcRef = useRef()
  const prevImageIdsRef = useRef()
  const prevModeRef = useRef()

  useLayoutEffect(() => {
    const updateBitmap = (newCanvas, newX, newY, w, h) => {
      const node = imageRef.current
      if (!node) return
      node.image(newCanvas || null)
      node.x(newX || 0)
      node.y(newY || 0)
      node.width(w || 0)
      node.height(h || 0)
      node.getLayer()?.batchDraw()
    }
    const updateStrokeBitmap = (sourceCanvas, sw, sc, imgX, imgY) => {
      const sNode = strokeRef.current
      if (!sNode || !sw || !sourceCanvas) {
        if (sNode) { sNode.image(null); sNode.getLayer()?.batchDraw() }
        return
      }
      const strokeCanvas = createCompositeStrokeCanvas(sourceCanvas, sw, sc || '#ffffff')
      if (!strokeCanvas) { sNode.image(null); sNode.getLayer()?.batchDraw(); return }
      sNode.image(strokeCanvas)
      sNode.x((imgX || 0) - sw)
      sNode.y((imgY || 0) - sw)
      sNode.width(strokeCanvas.width)
      sNode.height(strokeCanvas.height)
      sNode.getLayer()?.batchDraw()
    }

    if (isDraggingRef?.current) return () => {}

    if (!sourceItem || !bounds || !allItems.length) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      return
    }
    const isBezier = sourceItem.kind === 'shape' && sourceItem.shapeType === 'bezier-path'
    const isShape = sourceItem.kind === 'shape'
    if (!isBezier && !isShape && !sourceImage) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      return
    }
    const imagesReady = !imageItems.length || imageItems.every((_, index) => {
      const img = loadedImages[index]
      return img && img.complete && (img.naturalWidth || img.width)
    })
    if (!imagesReady || (!isBezier && !isShape && !sourceImage?.complete)) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      return
    }

    const currentItemIds = allItems.map(i => i.id).join(',')
    const isNewContent = sourceItem?.id !== prevSourceIdRef.current
      || sourceItem?.src !== prevSourceSrcRef.current
      || currentItemIds !== prevImageIdsRef.current
      || mode !== prevModeRef.current
    prevSourceIdRef.current = sourceItem?.id
    prevSourceSrcRef.current = sourceItem?.src
    prevImageIdsRef.current = currentItemIds
    prevModeRef.current = mode

    if (isNewContent) {
      updateBitmap(null, 0, 0, 0, 0)
      updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
    }

    const rafId = requestAnimationFrame(() => {
      const effectsKey = JSON.stringify({
        src: sourceItem?.src,
        effects: sourceItem?.effects,
        w: sourceItem?.w,
        h: sourceItem?.h,
        rotation: sourceItem?.rotation,
        imageCropRect: sourceItem?.imageCropRect,
        opacity: sourceItem?.opacity,
        path: isBezier ? sourceItem.path : undefined,
        shapeType: sourceItem?.shapeType,
        cornerRadius: sourceItem?.cornerRadius,
        sides: sourceItem?.sides,
        numPoints: sourceItem?.numPoints,
        starInnerRatio: sourceItem?.starInnerRatio,
      })

      let maskCanvasResult
      if (maskKeyRef.current === effectsKey && maskCacheRef.current) {
        maskCanvasResult = maskCacheRef.current
      } else if (isBezier) {
        maskCanvasResult = getBezierMaskCanvas(sourceItem)
        maskCacheRef.current = maskCanvasResult
        maskKeyRef.current = effectsKey
      } else if (isShape) {
        maskCanvasResult = getShapeMaskCanvas(sourceItem)
        maskCacheRef.current = maskCanvasResult
        maskKeyRef.current = effectsKey
      } else {
        maskCanvasResult = getEffectedAlphaMask(sourceItem, sourceImage)
        maskCacheRef.current = maskCanvasResult
        maskKeyRef.current = effectsKey
      }

      if (!maskCanvasResult) {
        updateBitmap(null, 0, 0, 0, 0)
        updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
        return
      }
      const maskCanvas = maskCanvasResult.canvas
      const originOffsetX = maskCanvasResult.originOffsetX
      const originOffsetY = maskCanvasResult.originOffsetY

      const itemBounds = [
        ...allItems.map((item) => getCompositeItemBounds(item)),
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
      allItems.forEach((item) => {
        drawAnyItemToCanvas(contentCtx, item, imageMap, groupMinX, groupMinY)
      })

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      const maskOriginX = (sourceItem.x || 0) - groupMinX
      const maskOriginY = (sourceItem.y || 0) - groupMinY
      const maskX = maskOriginX + originOffsetX
      const maskY = maskOriginY + originOffsetY

      if (mode === 'mask') {
        ctx.drawImage(maskCanvas, maskX, maskY)
        ctx.globalCompositeOperation = 'source-in'
        ctx.drawImage(contentCanvas, 0, 0)
      } else {
        ctx.drawImage(contentCanvas, 0, 0)
        ctx.globalCompositeOperation = 'destination-out'
        ctx.drawImage(maskCanvas, maskX, maskY)
      }
      ctx.globalCompositeOperation = 'source-over'

      const shadowResult = renderCompositeShadow(canvas, sourceItem)
      const finalCanvas = shadowResult?.canvas || canvas
      const finalX = shadowResult ? groupMinX + (shadowResult.offsetX || 0) : groupMinX
      const finalY = shadowResult ? groupMinY + (shadowResult.offsetY || 0) : groupMinY
      const finalW = shadowResult ? finalCanvas.width : width
      const finalH = shadowResult ? finalCanvas.height : height

      updateBitmap(finalCanvas, finalX, finalY, finalW, finalH)
      const compositeStrokeEnabled = !!(sourceItem?.compositeStrokeEnabled && (sourceItem?.compositeStrokeWidth ?? 0) > 0)
      if (compositeStrokeEnabled) {
        const sw = sourceItem?.compositeStrokeWidth || 0
        updateStrokeBitmap(canvas, sw, sourceItem?.compositeStrokeColor || '#ffffff', groupMinX, groupMinY)
      } else {
        updateStrokeBitmap(null, 0, '#ffffff', 0, 0)
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [bounds, destinationItems, allItems, imageItems, imageMap, loadedImages, mode, sourceItem, sourceImage])

  return (
    <>
      <KonvaImage
        ref={strokeRef}
        listening={false}
        perfectDrawEnabled={false}
      />
      <KonvaImage
        ref={imageRef}
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  )
}

const CompositeCanvasGroupMemoComparitor = (prev, next) => {
  if (prev.entry !== next.entry) return false
  if (prev.selectedId !== next.selectedId) return false
  if (prev.selectedIds !== next.selectedIds) return false
  if (prev.isTextEditing !== next.isTextEditing) return false
  if (prev.disableDrag !== next.disableDrag) return false
  if (prev.isShiftDown !== next.isShiftDown) return false
  if (prev.cropSession !== next.cropSession) return false
  if (prev.canvasSize !== next.canvasSize) return false
  if (prev.fontInjectVersion !== next.fontInjectVersion) return false
  return true
}
const CompositeCanvasGroup = memo(function CompositeCanvasGroupInner({ entry, items, selectedId, selectedIds, onSelect, onChange, onDragStart, onDragMove, onDragEnd, onTextEdit, isTextEditing, onCursor, onItemHover, disableDrag, isShiftDown, getActiveTransformAnchor, dropTargetFrameId, dropTargetSlotIndex, editingFrameId, editingFrameSlot, onFrameImageEdit, onCropStart, cropSession, canvasSize, onSyncTransformer, fontInjectVersion, getItemsVisualBounds, getCompositeSnapBounds, getSnappedDelta, setAlignmentGuides, setRotationSnapGuide, skipGroupDragEndRef, selectedIdsRef, itemsRef, multiDragRef, multiDragActiveRef, stageRef, setStageCursor, getInteractionNode }) {
  const groupRef = useRef(null)
  const dragStartRef = useRef(null)
  const snapResultRef = useRef(null)
  const isDraggingRef = useRef(false)
  const alignmentGuidesFrameRef = useRef(null)
  const sourceItem = entry.members.find((item) => item.id === entry.operatorId)
  const destinationItems = entry.members.filter((item) => item.id !== entry.operatorId)
  const orderedDestinationItems = [...destinationItems].reverse()
  const sourceMode = sourceItem?.compositeMode
  const isGroupLocked = entry.members.every((item) => item.locked)
  const isCompositeSelected = entry.members.some((item) => selectedIds?.includes(item.id) || selectedId === item.id)
  const externalSel = selectedIdsRef?.current || selectedIds
  const hasExternalSelection = externalSel?.length > 0 && externalSel.some((sid) => !entry.members.some((m) => m.id === sid))
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
    const rafId = requestAnimationFrame(() => {
      try {
        const worldLayer = stageRef.current?.findOne('.world-layer')
        const rect = worldLayer ? node.getClientRect({ relativeTo: worldLayer }) : node.getClientRect()
        const memberPositions = entry.members.map((m) => ({
          id: m.id,
          stateX: m.x,
          stateY: m.y,
        }))
        console.log('[DRAG_END_DEBUG] STEP 4 - group bounds after React commit:', { groupId: entry.groupId, rect, members: memberPositions })
      } catch (e) {}
      node.getLayer()?.batchDraw()
      onSyncTransformer?.()
    })
    return () => cancelAnimationFrame(rafId)
  }, [entry.cacheKey])

  const handleGroupPointerSelect = (event) => {
    event.cancelBubble = true
    if (sourceItem) onSelect(event, sourceItem.id)
  }

  const computeGroupSnap = (rawDx, rawDy) => {
    const start = dragStartRef.current
    if (!start) return null
    const adjustedMembers = entry.members.filter((item) => item.visible !== false).map((item) => {
      const pos = start.positions[item.id]
      return { ...item, x: pos?.x ?? item.x ?? 0, y: pos?.y ?? item.y ?? 0 }
    })
    const baseBounds = getCompositeSnapBounds(entry, adjustedMembers)
    if (!baseBounds) return null
    return getSnappedDelta(entry.members.map((m) => m.id), baseBounds, rawDx, rawDy)
  }

  const handleGroupDragStart = (event) => {
    event.cancelBubble = true
    // Jika multi-drag session aktif (drag dari item non-composite), skip — handleObjectDragStart/Move/End yg handle
    if (multiDragRef?.current) {
      dragStartRef.current = null
      return
    }
    // BLOCK: composite group di-drag saat multi-select dengan item non-composite
    {
      const selIds = selectedIdsRef?.current || selectedIds || []
      if (selIds.length > 1 && selIds.some((sid) => !entry.members.some((m) => m.id === sid))) {
        event.target.stopDrag()
        setStageCursor('not-allowed')
        setTimeout(() => setStageCursor('default'), 800)
        return
      }
    }
    // Guard: drag HANYA boleh jika composite group ADA di selection saat ini
    const currentSelectedIds = selectedIdsRef?.current || selectedIds || []
    let isCompositeInSelection = entry.members.some((item) => currentSelectedIds.includes(item.id) || selectedId === item.id)
    if (!isCompositeInSelection) {
      // Composite belum di-select — coba select dulu synchronously (seperti regular items)
      if (sourceItem) {
        if (selectedIdsRef) {
          selectedIdsRef.current = currentSelectedIds.includes(sourceItem.id) ? currentSelectedIds : [...currentSelectedIds, sourceItem.id]
        }
        isCompositeInSelection = true
        // Trigger React state update via handler yang benar (async, tapi ref sudah sync)
        onSelect(event, sourceItem.id)
      }
      // Kalo setelah sync masih tidak di selection, batalkan drag
      if (!isCompositeInSelection) return
    }
    // Cari external items dari selection (multi-select case)
    const externalIds = (selectedIdsRef?.current || selectedIds || []).filter((sid) => !entry.members.some((m) => m.id === sid))
    console.log('[GroupDragStart]', {
      groupId: entry.groupId,
      currentSelectedIds,
      externalIds,
      hasMultiDrag: !!multiDragRef?.current,
      isCompositeSelected,
      sourceItemId: sourceItem?.id,
      groupNodeX: event.target.x(),
      groupNodeY: event.target.y(),
    })
    // BAKE: compositeGroup* → member positions at drag start (non-identity only)
    const cgx = sourceItem?.compositeGroupX
    const cgy = sourceItem?.compositeGroupY
    const cgsx = sourceItem?.compositeGroupScaleX
    const cgsy = sourceItem?.compositeGroupScaleY
    const cgr = sourceItem?.compositeGroupRotation
    const hasCompositeBake = (cgx || cgy || (cgsx && cgsx !== 1) || (cgsy && cgsy !== 1) || cgr)
    let bakeMemberPositions
    if (hasCompositeBake) {
      const bakedMembers = entry.members.map((member) => ({
        id: member.id,
        x: (cgx || 0) + (member.x || 0) * (cgsx || 1),
        y: (cgy || 0) + (member.y || 0) * (cgsy || 1),
        w: (cgsx && cgsx !== 1) ? (member.w || 1) * cgsx : member.w,
        h: (cgsy && cgsy !== 1) ? (member.h || 1) * cgsy : member.h,
        rotation: cgr ? (member.rotation || 0) + cgr : member.rotation,
      }))
      bakeMemberPositions = bakedMembers
      // Update itemsRef synchronously (React state di-update di drag-end via onChange)
      const updatedItems = itemsRef.current.map((item) => {
        if (item.groupId !== entry.groupId) return item
        if (item.compositeMode) {
          return { ...item, x: (cgx || 0) + (item.x || 0) * (cgsx || 1), y: (cgy || 0) + (item.y || 0) * (cgsy || 1), w: (cgsx && cgsx !== 1) ? (item.w || 1) * cgsx : item.w, h: (cgsy && cgsy !== 1) ? (item.h || 1) * cgsy : item.h, rotation: cgr ? (item.rotation || 0) + cgr : item.rotation, compositeGroupX: undefined, compositeGroupY: undefined, compositeGroupScaleX: undefined, compositeGroupScaleY: undefined, compositeGroupRotation: undefined }
        }
        const baked = bakedMembers.find((b) => b.id === item.id)
        return baked ? { ...item, x: baked.x, y: baked.y, w: baked.w ?? item.w, h: baked.h ?? item.h, rotation: baked.rotation ?? item.rotation } : item
      })
      itemsRef.current = updatedItems
      // Update Konva nodes synchronously so drag delta is 0
      const groupNode = event.target
      groupNode.position({ x: 0, y: 0 })
      groupNode.scale({ x: 1, y: 1 })
      groupNode.rotation(0)
      bakedMembers.forEach((member) => {
        const node = stageRef.current.findOne(`#${member.id}`)
        if (node) {
          node.x(member.x)
          node.y(member.y)
          if (member.w !== undefined) node.width(member.w)
          if (member.h !== undefined) node.height(member.h)
          if (member.rotation !== undefined) node.rotation(member.rotation)
        }
      })
    }
    // Ambil posisi ALL selected items (composite members + external items)
    const memberPositions = Object.fromEntries((bakeMemberPositions || entry.members).map((item) => [item.id, { x: item.x || 0, y: item.y || 0 }]))
    const externalPositions = externalIds.length > 0
      ? Object.fromEntries(
          externalIds.map((sid) => {
            const item = itemsRef.current.find((i) => i.id === sid)
            return [sid, { x: item?.x || 0, y: item?.y || 0 }]
          })
        )
      : {}
    dragStartRef.current = {
      x: event.target.x(),
      y: event.target.y(),
      startTime: Date.now(),
      moveCount: 0,
      positions: { ...memberPositions, ...externalPositions },
      posCount: Object.keys({ ...memberPositions, ...externalPositions }).length,
    }
    isDraggingRef.current = true
    snapResultRef.current = null
    onCursor('move')
  }

  const handleGroupDragMove = (event) => {
    event.cancelBubble = true
    if (multiDragRef?.current) return
    if (!dragStartRef.current) return
    const start = dragStartRef.current
    if (start) {
      start.moveCount = (start.moveCount || 0) + 1
      const rawDx = event.target.x() - start.x
      const rawDy = event.target.y() - start.y
      const result = computeGroupSnap(rawDx, rawDy)
      console.log('[SnapDebug] composite handleGroupDragMove:', {
        rawDx, rawDy, hasResult: !!result, guideCount: result?.guides?.length, snapped: result?.snapped,
        startX: start.x, startY: start.y,
        baseBounds: result?._baseBounds || '(null)',
      })
      if (result) {
        snapResultRef.current = result
        setAlignmentGuides(result.guides)
        // Snap group position ke snapped delta (bukan raw), biar guide line & posisi konsisten
        if (result.snapped) {
          event.target.position({ x: start.x + result.dx, y: start.y + result.dy })
        }
      }
      // Gerakkin external items secara real-time bareng composite group
      const dx = result?.dx ?? rawDx
      const dy = result?.dy ?? rawDy
      let movedExternal = false
      Object.entries(start.positions).forEach(([itemId, pos]) => {
        if (entry.members.some((m) => m.id === itemId)) return
        const node = getInteractionNode(itemId)
        if (!node) return
        movedExternal = true
        node.position({ x: pos.x + dx, y: pos.y + dy })
      })
      if (movedExternal) onSyncTransformer?.()
    }
    groupRef.current?.getLayer()?.batchDraw()
  }

  const handleGroupDragEnd = (event) => {
    event.cancelBubble = true
    console.log('[DRAG_END_DEBUG] GROUP_DRAG_END FIRED', { hasDragStart: !!dragStartRef.current, skip: multiDragActiveRef?.current || skipGroupDragEndRef?.current, groupX: event.target.x(), groupY: event.target.y() })
    if (!dragStartRef.current) return
    // Skip jika handleObjectDragStart sedang aktif (multi-drag session)
    if (multiDragActiveRef?.current) return
    // Skip jika handleObjectDragEnd sudah handle semua (multi-drag source bukan composite)
    if (skipGroupDragEndRef?.current) return
    const start = dragStartRef.current
    // Log metrics di handleGroupDragEnd
    if (start) {
      const hasExternalItems = start.posCount > entry.members.length
      const anyCompositeHasParentGroup = entry.members.some((m) => m.parentGroupId)
      const externalGroupIds = new Set(
        Object.keys(start.positions)
          .filter((pid) => !entry.members.some((m) => m.id === pid))
          .map((pid) => itemsRef.current.find((i) => i.id === pid)?.groupId)
          .filter(Boolean),
      )
      const isParentGroup = anyCompositeHasParentGroup && externalGroupIds.size === 1
      console.log('[DragEndMetrics-group]', {
        timestamp: Date.now(),
        groupId: entry.groupId,
        isSkipped: skipGroupDragEndRef?.current,
        dragDurationMs: Date.now() - (start.startTime || Date.now()),
        moveCount: start.moveCount || 0,
        rawDx: event.target.x() - start.x,
        rawDy: event.target.y() - start.y,
        zoomLevel: 1,
        sourceKind: sourceItem?.kind || 'unknown',
        compositeMode: sourceItem?.compositeMode || 'none',
        groupType: !hasExternalItems ? 'standalone' : isParentGroup ? 'parentGroup' : 'multiSelect',
        externalCount: Object.keys(start.positions).length - entry.members.length,
        isParentGroup,
        snapActive: !!snapResultRef?.current,
      })
    }
    const rawDx = event.target.x() - (start?.x || 0)
    const rawDy = event.target.y() - (start?.y || 0)
    const result = start ? computeGroupSnap(rawDx, rawDy) : null
    console.log('[GroupSnapEnd]', { rawDx, rawDy, result: result ? { dx: result.dx, dy: result.dy, snapped: result.snapped, guideCount: result.guides?.length } : null, finalDx: result?.dx ?? rawDx, finalDy: result?.dy ?? rawDy })
    const dx = result?.dx ?? rawDx
    const dy = result?.dy ?? rawDy
    setAlignmentGuides([])
    setRotationSnapGuide(null)
    dragStartRef.current = null
    snapResultRef.current = null
    isDraggingRef.current = false
    cancelAnimationFrame(alignmentGuidesFrameRef.current)
    alignmentGuidesFrameRef.current = null
    if (!start || (!dx && !dy)) {
      event.target.position({ x: 0, y: 0 })
      groupRef.current?.getLayer()?.batchDraw()
      setStageCursor('default')
      return
    }
    const isMultiDragActive = !!multiDragRef?.current
    console.log('[GroupDragEnd]', {
      groupId: entry.groupId,
      isMultiDragActive,
      rawDx,
      rawDy,
      dx,
      dy,
      posCount: start.posCount,
      entriesCount: Object.keys(start.positions).length,
      entriesToWriteCount: isMultiDragActive
        ? Object.entries(start.positions).filter(([id]) => entry.members.some((m) => m.id === id)).length
        : Object.entries(start.positions).length,
    })
    // Jika multiDragRef aktif (drag via child), handleObjectDragEnd handle external items
    // Jika tidak aktif (drag via Group Rect), kita handle ALL items
    const entriesToWrite = isMultiDragActive
      ? Object.entries(start.positions).filter(([id]) => entry.members.some((m) => m.id === id))
      : Object.entries(start.positions)
    const itemUpdates = []
    entriesToWrite.forEach(([itemId, pos]) => {
      const item = entry.members.find((m) => m.id === itemId) || itemsRef.current.find((i) => i.id === itemId) || items.find((i) => i.id === itemId)
      if (!item || item.locked) return
      const newX = pos.x + dx
      const newY = pos.y + dy
      // Clamp external items (bukan composite member) ke canvas bounds
      const isCompositeMember = entry.members.some((m) => m.id === itemId)
      const clamped = isCompositeMember
        ? { x: newX, y: newY }
        : getClampedCanvasPosition(item.w || 1, item.h || 1, { x: newX, y: newY }, { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height })
      console.log('[DragEndDebug]', {
        location: 'handleGroupDragEnd',
        groupId: entry.groupId,
        memberId: itemId,
        oldX: item.x,
        oldY: item.y,
        startX: pos.x,
        startY: pos.y,
        dx,
        dy,
        newX,
        newY,
        clamped,
        source: multiDragRef?.current ? 'compositeOnly (multiDragRef active)' : 'allItems (no multiDragRef)',
      })
      itemUpdates.push({ itemId, patch: { x: clamped.x, y: clamped.y } })
    })
    console.log('[GROUP_DRAG_DEBUG] itemUpdates:', itemUpdates.map((u) => ({ itemId: u.itemId, x: u.patch.x, y: u.patch.y, isComposite: entry.members.some((m) => m.id === u.itemId) })))
    // Directly set Konva node positions BEFORE group reset (sync, no react-konva delay)
    itemUpdates.forEach(({ itemId, patch }) => {
      const node = stageRef.current?.findOne(`#${itemId}`)
      const found = !!node
      console.log('[GROUP_DRAG_DEBUG] findOne:', { itemId, found, oldX: node?.x(), oldY: node?.y(), newX: patch.x, newY: patch.y, isComposite: entry.members.some((m) => m.id === itemId) })
      if (node) {
        node.position({ x: patch.x, y: patch.y })
      }
    })
    // Update React state (persistence — no visual glitch since Konva already correct)
    itemUpdates.forEach(({ itemId, patch }) => onChange(itemId, patch))
    // Clear compositeGroup* pada operator setelah member positions final (React batch)
    if (sourceItem?.compositeGroupX !== undefined || sourceItem?.compositeGroupScaleX !== undefined) {
      onChange(sourceItem.id, {
        compositeGroupX: undefined,
        compositeGroupY: undefined,
        compositeGroupScaleX: undefined,
        compositeGroupScaleY: undefined,
        compositeGroupRotation: undefined,
      })
    }
    // Reset Group position AFTER all items are at their final absolute positions
    event.target.position({ x: 0, y: 0 })
    console.log('[GROUP_DRAG_DEBUG] groupPos after reset:', { x: event.target.x(), y: event.target.y() })
    // Force immediate redraw
    groupRef.current?.getLayer()?.batchDraw()
    console.log('[GROUP_DRAG_DEBUG] dragEnd complete')
    setStageCursor('default')
  }

  // Cleanup RAF on unmount (prevents setState on unmounted component from stale RAF)
  useEffect(() => {
    return () => cancelAnimationFrame(alignmentGuidesFrameRef.current)
  }, [])

  return (
    <Group
      id={`composite-${entry.groupId}`}
      x={sourceItem?.compositeGroupX ?? 0}
      y={sourceItem?.compositeGroupY ?? 0}
      scaleX={sourceItem?.compositeGroupScaleX ?? 1}
      scaleY={sourceItem?.compositeGroupScaleY ?? 1}
      rotation={sourceItem?.compositeGroupRotation ?? 0}
      ref={groupRef}
      name="composite-group"
      listening={!multiDragActiveRef?.current}
      draggable={!disableDrag && !isGroupLocked}
      onClick={handleGroupPointerSelect}
      onTap={handleGroupPointerSelect}
      onMouseEnter={() => onCursor(isGroupLocked ? 'default' : 'move')}
      onMouseLeave={() => onCursor('default')}
      onDragStart={handleGroupDragStart}
      onDragMove={handleGroupDragMove}
      onDragEnd={handleGroupDragEnd}
      opacity={sourceItem?.compositeOpacity ?? 1}
      globalCompositeOperation={sourceItem?.compositeBlendMode && sourceItem?.compositeBlendMode !== 'source-over' ? sourceItem.compositeBlendMode : undefined}
      shadowColor={sourceItem?.compositeShadowEnabled ? (sourceItem.compositeShadowColor || '#050505') : undefined}
      shadowBlur={sourceItem?.compositeShadowEnabled ? (sourceItem.compositeShadow ?? 15) : undefined}
      shadowOpacity={sourceItem?.compositeShadowEnabled ? (sourceItem.compositeShadowOpacity ?? 0.35) : undefined}
      shadowOffsetX={sourceItem?.compositeShadowEnabled ? (sourceItem.compositeShadowOffsetX ?? 0) : undefined}
      shadowOffsetY={sourceItem?.compositeShadowEnabled ? (sourceItem.compositeShadowOffsetY ?? 4) : undefined}
    >
      {groupBounds && !multiDragActiveRef?.current && (
        <Rect
          x={groupBounds.left}
          y={groupBounds.top}
          width={Math.max(1, groupBounds.right - groupBounds.left)}
          height={Math.max(1, groupBounds.bottom - groupBounds.top)}
          fill="rgba(0,0,0,0.001)"
          strokeEnabled={false}
          shadowEnabled={false}
          listening={true}
          onClick={handleGroupPointerSelect}
          onTap={handleGroupPointerSelect}
        />
      )}
      {(
        (() => {
          const hasEffects = sourceItem?.effects && Object.keys(sourceItem.effects).length > 0
          console.log('[LOAD] CompositeCanvasGroup render', {
            groupId: entry.groupId,
            operatorId: entry.operatorId,
            memberCount: entry.members.length,
            sourceKind: sourceItem?.kind,
            sourceMode,
            maskSourceType: sourceItem?.maskSourceType,
            hasEffects,
            effectsKeys: sourceItem?.effects ? Object.keys(sourceItem.effects).filter(k => sourceItem.effects[k]) : [],
            src: sourceItem?.src?.substring(0, 60),
            branch: sourceItem?.maskSourceType === 'alpha' ? 'ALPHA'
              : sourceItem?.kind === 'text' ? 'TEXT'
              : sourceItem?.kind === 'image' ? 'IMAGE'
              : sourceItem?.kind === 'shape' ? 'SHAPE'
              : sourceMode === 'mask' ? 'CLIPFUNC'
              : 'FALLBACK',
          })
          return null
        })()
      )}
      {sourceItem?.maskSourceType === 'alpha' && (sourceMode === 'mask' || sourceMode === 'exclude') ? (
        <CompositeAlphaBitmap
          sourceItem={sourceItem}
          destinationItems={orderedDestinationItems}
          bounds={groupBounds}
          mode={sourceMode}
          stageRef={stageRef}
          isDraggingRef={isDraggingRef}
        />
      ) : sourceItem?.kind === 'text' && (sourceMode === 'mask' || sourceMode === 'exclude') ? (
        <>
          <CompositeTextBitmap
            sourceItem={sourceItem}
            destinationItems={orderedDestinationItems}
            bounds={groupBounds}
            mode={sourceMode}
            isDraggingRef={isDraggingRef}
          />
        </>
      ) : sourceItem?.kind === 'image' && (sourceMode === 'mask' || sourceMode === 'exclude') ? (
        <CompositeImageBitmap
          sourceItem={sourceItem}
          destinationItems={orderedDestinationItems}
          bounds={groupBounds}
          mode={sourceMode}
          isDraggingRef={isDraggingRef}
        />
      ) : sourceItem?.kind === 'shape' && (sourceMode === 'mask' || sourceMode === 'exclude') ? (
        <CompositeAlphaBitmap
          sourceItem={sourceItem}
          destinationItems={orderedDestinationItems}
          bounds={groupBounds}
          mode={sourceMode}
          stageRef={stageRef}
          isDraggingRef={isDraggingRef}
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
              fontInjectVersion={fontInjectVersion}
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
          fontInjectVersion={fontInjectVersion}
          allowComposite={item.id === entry.operatorId}
        />
        ))
      )}
    </Group>
  )
})

const ADJUSTMENT_PRESETS = [
  {
    label: 'Cinematic',
    values: {
      exposure: 0, temperature: -5, hue: 0, highlights: -10, shadows: 15,
      whites: -5, blacks: 10, brightness: 8, contrast: 12, saturation: 8,
      sharpen: 5, vignette: 15, blur: 0,
    },
  },
  {
    label: 'Muted',
    values: {
      exposure: 0, temperature: 0, hue: 0, highlights: -5, shadows: 5,
      whites: -10, blacks: -5, brightness: -4, contrast: -8, saturation: -22,
      sharpen: 0, vignette: 0, blur: 0,
    },
  },
  {
    label: 'Dreamy',
    values: {
      exposure: 5, temperature: 5, hue: 0, highlights: 15, shadows: -5,
      whites: 10, blacks: -5, brightness: 10, contrast: -6, saturation: 16,
      sharpen: -10, vignette: 8, blur: 1,
    },
  },
  {
    label: 'Noir',
    values: {
      exposure: -5, temperature: -10, hue: 0, highlights: 20, shadows: -20,
      whites: -15, blacks: 20, brightness: -8, contrast: 28, saturation: -100,
      sharpen: 15, vignette: 10, blur: 0,
    },
  },
  {
    label: 'Vibrant',
    values: {
      exposure: 3, temperature: 2, hue: 0, highlights: 8, shadows: -5,
      whites: 5, blacks: -8, brightness: 4, contrast: 18, saturation: 28,
      sharpen: 5, vignette: 0, blur: 0,
    },
  },
]

function Workspace() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, isLoading: isAuthLoading, requireAuth } = useAuth()
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
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState(null)
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
  const [isPublicBrowseLoading, setIsPublicBrowseLoading] = useState(false)
  const [isBrowseLoadMoreLoading, setIsBrowseLoadMoreLoading] = useState(false)
  const [browsePageInfo, setBrowsePageInfo] = useState({ internalNextOffset: null, internalNextCursor: null, externalNextCursor: null })
  const [browseRefreshKey, setBrowseRefreshKey] = useState(0)
  const [browseShuffleSeed, setBrowseShuffleSeed] = useState(0)
  const [isBrowseRefreshing, setIsBrowseRefreshing] = useState(false)
  const [publicBrowseError, setPublicBrowseError] = useState('')
  const [mixedBrowseAssets, setMixedBrowseAssets] = useState([])
  const lastMixedKeysRef = useRef(new Set())
  const [selectedBoardId, setSelectedBoardId] = useState(null)
  const [selectedBoardItem, setSelectedBoardItem] = useState(null)
  const [isBoardsLoading, setIsBoardsLoading] = useState(false)
  const [boardsError, setBoardsError] = useState('')
  const [savedPosts, setSavedPosts] = useState([])
  const [isSavedPostsLoading, setIsSavedPostsLoading] = useState(false)
  const [savedPostsError, setSavedPostsError] = useState('')
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
  const [loadingPhase, setLoadingPhase] = useState('loading')
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
  const [rotationSnapGuide, setRotationSnapGuide] = useState(null)
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  const [connectorTool, setConnectorTool] = useState(null)
  const [connectorDraft, setConnectorDraft] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const [editingFrameId, setEditingFrameId] = useState(null)
  const [editingFrameSlot, setEditingFrameSlot] = useState(0)
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isBlendModeOpen, setIsBlendModeOpen] = useState(false)
  const [colorPickerTarget, setColorPickerTarget] = useState(null)
  const colorPickerActiveRef = useRef(false)
  const pendingColorPickerPatchRef = useRef(null)
  const [fontSearchQuery, setFontSearchQuery] = useState('')
  const [selectedFontCategory, setSelectedFontCategory] = useState(null)
  const [apiFonts, setApiFonts] = useState(null)
  const [isLoadingFonts, setIsLoadingFonts] = useState(false)
  const [fontsError, setFontsError] = useState(null)
  const [fontDisplayCount, setFontDisplayCount] = useState(20)
  const fontSentinelRef = useRef(null)
  const fontPickerRef = useRef(null)
  const [loadingFont, setLoadingFont] = useState(null)
  const [customFonts, setCustomFonts] = useState([])
  const [isUploadingFont, setIsUploadingFont] = useState(false)
  const [fontUploadProgress, setFontUploadProgress] = useState(0)
  const [favoriteFonts, setFavoriteFonts] = useState([])
  const [fontInjectVersion, setFontInjectVersion] = useState(0)
  const importFontInputRef = useRef(null)
  const loadFavorites = useCallback(async () => {
    try {
      const payload = await apiGetFavorites()
      setFavoriteFonts(payload.favorites || [])
    } catch {}
  }, [])
  const toggleFavorite = useCallback(async (fontFamily) => {
    const isFav = favoriteFonts.includes(fontFamily)
    try {
      if (isFav) {
        await apiRemoveFavorite(fontFamily)
        setFavoriteFonts((prev) => prev.filter((f) => f !== fontFamily))
      } else {
        await apiAddFavorite(fontFamily)
        setFavoriteFonts((prev) => [...prev, fontFamily])
      }
    } catch {}
  }, [favoriteFonts])
  const handleImportFont = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploadingFont(true)
    setFontUploadProgress(0)
    try {
      const payload = await apiUploadFont({ file, onProgress: setFontUploadProgress })
      const fontData = { ...payload.font, category: 'Import' }
      const familyName = fontData.family || fontData.name
      const fontUrl = fontData.url
      if (fontUrl) {
        const fontFace = new FontFace(familyName, `url(${fontUrl})`)
        try { await fontFace.load(); document.fonts.add(fontFace) } catch {}
      }
      setCustomFonts((prev) => [fontData, ...prev])
    } catch (error) {
      console.error('Failed to import font:', error)
    } finally {
      setIsUploadingFont(false)
      setFontUploadProgress(0)
      if (importFontInputRef.current) importFontInputRef.current.value = ''
    }
  }, [])
  const [editingSliderKey, setEditingSliderKey] = useState(null)
  const [isImageAdjustmentsOpen, setIsImageAdjustmentsOpen] = useState(false)
  const [cropSession, setCropSession] = useState(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState('png')
  const [exportScale, setExportScale] = useState(1)
  const [exportTransparent, setExportTransparent] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportError, setExportError] = useState('')

  // Tool states
  const [brushSettings, setBrushSettings] = useState({ size: 10, color: '#000000', opacity: 1, mode: 'paint', type: 'solid' })
  const brushSettingsRef = useRef(brushSettings)
  useEffect(() => { brushSettingsRef.current = brushSettings })
  // Offscreen brush layer infrastructure
  const brushCanvasRef = useRef(null)
  const brushCtxRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastBrushPosRef = useRef(null)
  const lastStampPosRef = useRef(null)
  const activeBrushLayerIdRef = useRef(null)
  const brushUndoStackRef = useRef([])
  const eraserImageTargetRef = useRef(null)
  const eraserImagePointsRef = useRef([])
  const brushPaintDebounceRef = useRef(null)
  const brushEraseDebounceRef = useRef(null)

  const hitTestImageAtPointer = (stage, viewportPoint) => {
    const hitNode = stage.getIntersection({ x: viewportPoint.x, y: viewportPoint.y })
    if (!hitNode || hitNode === stage) return null
    let node = hitNode
    while (node && node !== stage) {
      const id = node.id()
      if (id) {
        const item = itemsRef.current.find((c) => c.id === id)
        if (item?.kind === 'image') return item
        if (item?.kind === 'brushLayer') return null
      }
      node = node.parent
    }
    return null
  }

  const ensureBrushLayer = () => {
    const existingBrushLayer = items.find(i => i.kind === 'brushLayer')

    if (existingBrushLayer) {
      activeBrushLayerIdRef.current = existingBrushLayer.id
      if (brushCanvasRef.current) return existingBrushLayer.id
    }

    const canvas = document.createElement('canvas')
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height
    const ctx = canvas.getContext('2d')
    brushCanvasRef.current = canvas
    brushCtxRef.current = ctx
    _brushOffscreenCanvas = canvas

    if (existingBrushLayer?.src && _brushFallbackImg) {
      ctx.drawImage(_brushFallbackImg, 0, 0)
    }

    if (existingBrushLayer) {
      brushUndoStackRef.current = []
      _brushImageNode = null
      return existingBrushLayer.id
    }

    const id = `brush-${Date.now()}`
    const newItem = {
      id,
      kind: 'brushLayer',
      x: 0, y: 0,
      w: canvasSize.width,
      h: canvasSize.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      effects: getDefaultEffects(),
    }
    setItems(items => [newItem, ...items])
    if (collaboratorsGuardRef.current.length > 1) {
      broadcastItemAdd(newItem)
    }
    activeBrushLayerIdRef.current = id
    brushUndoStackRef.current = []
    _brushImageNode = null
    return id
  }

  const prepareCtxForBrushType = (ctx, type, mode, lineWidth) => {
    console.log('[prepareCtx] type received:', type)
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over'
    ctx.lineWidth = lineWidth
    if (type === 'dashed') {
      ctx.lineCap = 'butt'
      ctx.lineJoin = 'miter'
      ctx.setLineDash([lineWidth * 3, lineWidth])
    } else if (type === 'dotted') {
      ctx.lineCap = 'round'
      ctx.setLineDash([0, lineWidth * 2.25])
    } else if (type === 'pixel') {
      ctx.lineCap = 'square'
      ctx.lineJoin = 'miter'
    } else if (type === 'airbrush') {
      ctx.globalAlpha = 0.2
    }
    if (mode === 'paint') {
      ctx.fillStyle = brushSettings.color
      ctx.strokeStyle = brushSettings.color
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    }
  }

  const airbrushSpray = (ctx, cx, cy, radius, count) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * radius
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist
      const dotSize = Math.max(1, radius * 0.15)
      ctx.beginPath()
      ctx.arc(x, y, dotSize, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawWatercolor = (ctx, x, y, size, color, opacity) => {
    console.log('[watercolor] drawing at', x, y, 'size:', size, 'color:', color)
    const stamps = 8
    for (let i = 0; i < stamps; i++) {
      const angle = (i / stamps) * Math.PI * 2
      const r = size * 0.3 * Math.random()
      const ox = Math.cos(angle) * r
      const oy = Math.sin(angle) * r
      const s = size * (0.6 + Math.random() * 0.4)

      ctx.save()
      ctx.globalAlpha = opacity * 0.4
      ctx.beginPath()
      ctx.arc(x + ox, y + oy, s, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      ctx.globalAlpha = opacity * 0.2
      ctx.beginPath()
      ctx.arc(x + ox, y + oy, s * 1.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  const handleBrushStart = (e) => {
    if (brushSettings.mode === 'erase') {
      const pointer = stageRef.current?.getPointerPosition()
      if (!pointer) { eraserImageTargetRef.current = null; return }

      let clickedId = null
      const hitNode = stageRef.current?.getIntersection({ x: pointer.x, y: pointer.y })
      if (hitNode && hitNode !== stageRef.current) {
        let node = hitNode
        while (node && node !== stageRef.current) {
          const id = node.id()
          if (id) { clickedId = id; break }
          node = node.parent
        }
      }

      let targetItem = null
      if (clickedId && clickedId === selectedId) {
        targetItem = selectedId ? itemsRef.current.find(i => i.id === selectedId) : null
      } else if (!selectedId && activeBrushLayerIdRef.current) {
        const activeLayer = itemsRef.current.find(i => i.id === activeBrushLayerIdRef.current)
        if (activeLayer?.kind === 'brushLayer') {
          targetItem = activeLayer
          setSelectedId(activeLayer.id)
          setSelectedIds([activeLayer.id])
        }
      }

      if (targetItem?.kind === 'image') {
        eraserImageTargetRef.current = targetItem
        eraserImagePointsRef.current = []
        const worldPos = getWorldPointFromViewport(pointer, cameraRef.current)
        eraserImagePointsRef.current.push(worldPos.x, worldPos.y)
        isDrawingRef.current = true
        lastBrushPosRef.current = worldPos
        return
      }

      eraserImageTargetRef.current = null
      if (!targetItem || targetItem.kind !== 'brushLayer') return
    }

    ensureBrushLayer()
    const ctx = brushCtxRef.current
    if (!ctx) return
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const worldPos = getWorldPointFromViewport(pointer, cameraRef.current)
    isDrawingRef.current = true
    lastBrushPosRef.current = worldPos
    lastStampPosRef.current = { x: worldPos.x, y: worldPos.y }
    const radius = brushSettings.size / (cameraRef.current.scale || 1) / 2
    const type = brushSettings.type
    const mode = brushSettings.mode
    const lineWidth = radius * 2

    prepareCtxForBrushType(ctx, type, mode, lineWidth)

    if (type === 'airbrush') {
      airbrushSpray(ctx, worldPos.x, worldPos.y, radius, Math.round(radius * 3))
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    if (type === 'pixel') {
      const d = Math.max(1, lineWidth)
      ctx.fillRect(worldPos.x - d / 2, worldPos.y - d / 2, d, d)
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    if (type === 'dotted') {
      ctx.beginPath()
      ctx.arc(worldPos.x, worldPos.y, lineWidth / 2, 0, Math.PI * 2)
      ctx.fill()
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    if (type === 'dashed') {
      ctx.beginPath()
      ctx.moveTo(worldPos.x, worldPos.y)
      ctx.lineTo(worldPos.x + lineWidth * 2, worldPos.y)
      ctx.stroke()
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    if (type === 'watercolor') {
      const wcSize = lineWidth * 2.5
      drawWatercolor(ctx, worldPos.x, worldPos.y, wcSize, brushSettings.color, 0.2)
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    ctx.beginPath()
    ctx.arc(worldPos.x, worldPos.y, radius, 0, Math.PI * 2)
    ctx.fill()
    _brushImageNode?.getLayer()?.batchDraw()
  }

  const handleBrushMove = (e) => {
    if (!isDrawingRef.current) return

    if (eraserImageTargetRef.current) {
      const pointer = stageRef.current?.getPointerPosition()
      if (!pointer) return
      const worldPos = getWorldPointFromViewport(pointer, cameraRef.current)
      eraserImagePointsRef.current.push(worldPos.x, worldPos.y)
      lastBrushPosRef.current = worldPos
      return
    }

    const ctx = brushCtxRef.current
    const last = lastBrushPosRef.current
    if (!ctx || !last) return
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const worldPos = getWorldPointFromViewport(pointer, cameraRef.current)
    const radius = brushSettings.size / (cameraRef.current.scale || 1) / 2
    const type = brushSettings.type
    const mode = brushSettings.mode

    const dx = worldPos.x - last.x
    const dy = worldPos.y - last.y
    const segDist = Math.sqrt(dx * dx + dy * dy)
    if (segDist === 0) return

    const lineWidth = radius * 2

    if (type === 'dotted' || type === 'dashed' || type === 'pixel') {
      const stampDist = type === 'dotted' ? lineWidth * 2.25
        : type === 'dashed' ? lineWidth * 4
        : lineWidth
      const dashLen = type === 'dashed' ? lineWidth * 3 : 0
      const lastStamp = lastStampPosRef.current
      if (!lastStamp) return

      const sdx = worldPos.x - lastStamp.x
      const sdy = worldPos.y - lastStamp.y
      const sDist = Math.sqrt(sdx * sdx + sdy * sdy)

      if (sDist >= stampDist) {
        prepareCtxForBrushType(ctx, type, mode, lineWidth)
        const nx = sdx / sDist
        const ny = sdy / sDist
        let placed = 0

        while (placed + stampDist <= sDist) {
          placed += stampDist

          if (type === 'dotted') {
            const px = lastStamp.x + nx * placed
            const py = lastStamp.y + ny * placed
            ctx.beginPath()
            ctx.arc(px, py, lineWidth / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (type === 'pixel') {
            const px = lastStamp.x + nx * placed
            const py = lastStamp.y + ny * placed
            const d = Math.max(1, lineWidth)
            ctx.fillRect(px - d / 2, py - d / 2, d, d)
          } else if (type === 'dashed') {
            const halfDash = dashLen / 2
            const cx = lastStamp.x + nx * placed
            const cy = lastStamp.y + ny * placed
            const sx = cx - nx * halfDash
            const sy = cy - ny * halfDash
            const ex = cx + nx * halfDash
            const ey = cy + ny * halfDash
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(ex, ey)
            ctx.stroke()
          }
        }

        lastStampPosRef.current = {
          x: lastStamp.x + nx * placed,
          y: lastStamp.y + ny * placed,
        }
      }

      lastBrushPosRef.current = worldPos
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    if (type === 'airbrush') {
      prepareCtxForBrushType(ctx, type, mode, lineWidth)
      const steps = Math.max(1, Math.round(segDist / (radius * 0.5)))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const px = last.x + dx * t
        const py = last.y + dy * t
        airbrushSpray(ctx, px, py, radius, Math.round(radius * 2))
      }
      lastBrushPosRef.current = worldPos
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    if (type === 'watercolor') {
      const wcSize = lineWidth * 2.5
      const steps = Math.max(1, Math.round(segDist / (wcSize * 0.4)))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const px = last.x + dx * t
        const py = last.y + dy * t
        drawWatercolor(ctx, px, py, wcSize, brushSettings.color, 0.2)
      }
      lastBrushPosRef.current = worldPos
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }

    prepareCtxForBrushType(ctx, type, mode, lineWidth)
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(worldPos.x, worldPos.y)
    ctx.stroke()
    lastBrushPosRef.current = worldPos
    _brushImageNode?.getLayer()?.batchDraw()
  }

  const eraseImageStroke = async () => {
    const targetItem = eraserImageTargetRef.current
    const points = eraserImagePointsRef.current
    eraserImageTargetRef.current = null
    eraserImagePointsRef.current = []
    if (!targetItem || points.length < 2) return

    const img = await new Promise((resolve, reject) => {
      const image = new window.Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => reject()
      image.src = targetItem.src
    })
    if (!img) return

    const originX = targetItem.x
    const originY = targetItem.y
    const displayW = Math.max(1, Math.ceil(targetItem.w))
    const displayH = Math.max(1, Math.ceil(targetItem.h))
    const nativeW = img.naturalWidth
    const nativeH = img.naturalHeight
    const cam = cameraRef.current
    const radius = brushSettingsRef.current.size / (cam.scale || 1) / 2
    const lineWidth = radius * 2
    const type = brushSettingsRef.current.type
    console.log('[eraseImage] brushType:', type)

    // Convert world points to display-local coordinates
    const localPts = []
    for (let i = 0; i < points.length; i += 2) {
      localPts.push({ x: points[i] - originX, y: points[i + 1] - originY })
    }

    // Build eraser mask canvas at display resolution using the same brush engine
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = displayW
    maskCanvas.height = displayH
    const maskCtx = maskCanvas.getContext('2d')

    const typeIsStamp = type === 'dotted' || type === 'dashed' || type === 'pixel'

    console.log('[eraseImage] prepareCtxForBrushType dipanggil?')
    if (type === 'solid') {
      prepareCtxForBrushType(maskCtx, type, 'paint', lineWidth)
      maskCtx.fillStyle = 'rgba(0,0,0,1)'
      maskCtx.strokeStyle = 'rgba(0,0,0,1)'
      maskCtx.beginPath()
      maskCtx.moveTo(localPts[0].x, localPts[0].y)
      for (let i = 1; i < localPts.length; i++) {
        maskCtx.lineTo(localPts[i].x, localPts[i].y)
      }
      maskCtx.stroke()
    } else if (typeIsStamp) {
      const stampDist = type === 'dotted' ? lineWidth * 2.25
        : type === 'dashed' ? lineWidth * 4
        : lineWidth
      const dashLen = type === 'dashed' ? lineWidth * 3 : 0

      // Draw initial stamp at first point (same as handleBrushStart)
      prepareCtxForBrushType(maskCtx, type, 'paint', lineWidth)
      maskCtx.fillStyle = 'rgba(0,0,0,1)'
      maskCtx.strokeStyle = 'rgba(0,0,0,1)'
      if (type === 'dotted') {
        maskCtx.beginPath()
        maskCtx.arc(localPts[0].x, localPts[0].y, lineWidth / 2, 0, Math.PI * 2)
        maskCtx.fill()
      } else if (type === 'pixel') {
        const d = Math.max(1, lineWidth)
        maskCtx.fillRect(localPts[0].x - d / 2, localPts[0].y - d / 2, d, d)
      } else if (type === 'dashed') {
        maskCtx.beginPath()
        maskCtx.moveTo(localPts[0].x, localPts[0].y)
        maskCtx.lineTo(localPts[0].x + lineWidth * 2, localPts[0].y)
        maskCtx.stroke()
      }

      let lastStamp = { x: localPts[0].x, y: localPts[0].y }

      for (let i = 1; i < localPts.length; i++) {
        const end = localPts[i]
        const sdx = end.x - lastStamp.x
        const sdy = end.y - lastStamp.y
        const sDist = Math.sqrt(sdx * sdx + sdy * sdy)

        if (sDist >= stampDist) {
          prepareCtxForBrushType(maskCtx, type, 'paint', lineWidth)
          maskCtx.fillStyle = 'rgba(0,0,0,1)'
          maskCtx.strokeStyle = 'rgba(0,0,0,1)'

          const nx = sdx / sDist
          const ny = sdy / sDist
          let placed = 0

          while (placed + stampDist <= sDist) {
            placed += stampDist

            if (type === 'dotted') {
              const px = lastStamp.x + nx * placed
              const py = lastStamp.y + ny * placed
              maskCtx.beginPath()
              maskCtx.arc(px, py, lineWidth / 2, 0, Math.PI * 2)
              maskCtx.fill()
            } else if (type === 'pixel') {
              const px = lastStamp.x + nx * placed
              const py = lastStamp.y + ny * placed
              const d = Math.max(1, lineWidth)
              maskCtx.fillRect(px - d / 2, py - d / 2, d, d)
            } else if (type === 'dashed') {
              const halfDash = dashLen / 2
              const cx = lastStamp.x + nx * placed
              const cy = lastStamp.y + ny * placed
              const sx = cx - nx * halfDash
              const sy = cy - ny * halfDash
              const ex = cx + nx * halfDash
              const ey = cy + ny * halfDash
              maskCtx.beginPath()
              maskCtx.moveTo(sx, sy)
              maskCtx.lineTo(ex, ey)
              maskCtx.stroke()
            }
          }

          lastStamp = {
            x: lastStamp.x + nx * placed,
            y: lastStamp.y + ny * placed,
          }
        }
      }
    } else if (type === 'airbrush') {
      // First point spray
      prepareCtxForBrushType(maskCtx, type, 'paint', lineWidth)
      airbrushSpray(maskCtx, localPts[0].x, localPts[0].y, radius, Math.round(radius * 3))

      for (let i = 1; i < localPts.length; i++) {
        const last = localPts[i - 1]
        const curr = localPts[i]
        const dx = curr.x - last.x
        const dy = curr.y - last.y
        const segDist = Math.sqrt(dx * dx + dy * dy)
        if (segDist === 0) continue

        prepareCtxForBrushType(maskCtx, type, 'paint', lineWidth)
        const steps = Math.max(1, Math.round(segDist / (radius * 0.5)))
        for (let j = 0; j <= steps; j++) {
          const t = j / steps
          const px = last.x + dx * t
          const py = last.y + dy * t
          airbrushSpray(maskCtx, px, py, radius, Math.round(radius * 2))
        }
      }
    } else if (type === 'watercolor') {
      const wcSize = lineWidth * 2.5
      // First point
      drawWatercolor(maskCtx, localPts[0].x, localPts[0].y, wcSize, 'rgba(0,0,0,1)', 0.2)

      for (let i = 1; i < localPts.length; i++) {
        const last = localPts[i - 1]
        const curr = localPts[i]
        const dx = curr.x - last.x
        const dy = curr.y - last.y
        const segDist = Math.sqrt(dx * dx + dy * dy)
        if (segDist === 0) continue

        const steps = Math.max(1, Math.round(segDist / (wcSize * 0.4)))
        for (let j = 0; j <= steps; j++) {
          const t = j / steps
          const px = last.x + dx * t
          const py = last.y + dy * t
          drawWatercolor(maskCtx, px, py, wcSize, 'rgba(0,0,0,1)', 0.2)
        }
      }
    }

    // Capture oldSrc synchronously before any async boundary
    const oldSrc = targetItem.src

    // Render native image and composite mask with destination-out
    const nativeCanvas = document.createElement('canvas')
    nativeCanvas.width = nativeW
    nativeCanvas.height = nativeH
    const nativeCtx = nativeCanvas.getContext('2d')
    nativeCtx.drawImage(img, 0, 0, nativeW, nativeH)
    nativeCtx.globalCompositeOperation = 'destination-out'
    nativeCtx.drawImage(maskCanvas, 0, 0, nativeW, nativeH)

    nativeCanvas.toBlob((blob) => {
      if (!blob) return
      const localUrl = URL.createObjectURL(blob)
      setItems((current) => current.map((item) => {
        if (item.id !== targetItem.id) return item
        return { ...item, src: localUrl, _oldSrc: oldSrc, _pendingUpload: blob }
      }))
      debouncedBrushUpload({ eraseBlob: blob, eraseItemId: targetItem.id })
    })
  }

  const handleBrushEnd = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    if (eraserImageTargetRef.current) {
      lastBrushPosRef.current = null
      lastStampPosRef.current = null
      if (eraserImagePointsRef.current.length >= 4) {
        eraseImageStroke()
      } else {
        eraserImageTargetRef.current = null
        eraserImagePointsRef.current = []
      }
      return
    }

    lastBrushPosRef.current = null
    lastStampPosRef.current = null
    const canvas = brushCanvasRef.current
    if (!canvas) return
    const snapshot = brushCtxRef.current?.getImageData(0, 0, canvas.width, canvas.height)
    if (snapshot) brushUndoStackRef.current.push(snapshot)

    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob) return
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result
          setItems(current => current.map(item =>
            item.id === activeBrushLayerIdRef.current
              ? { ...item, src: dataUrl }
              : item
          ))
        }
        reader.readAsDataURL(blob)
      }, 'image/png')
    }, 0)
    debouncedBrushUpload()
  }

  const undoActiveBrushLayer = useCallback(() => {
    const stack = brushUndoStackRef.current
    const ctx = brushCtxRef.current
    const canvas = brushCanvasRef.current
    if (!ctx || !canvas) return
    if (stack.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      _brushImageNode?.getLayer()?.batchDraw()
      return
    }
    stack.pop()
    if (stack.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    } else {
      ctx.putImageData(stack[stack.length - 1], 0, 0)
    }
    _brushImageNode?.getLayer()?.batchDraw()

    const exportCanvas = brushCanvasRef.current
    if (exportCanvas) {
      exportCanvas.toBlob((blob) => {
        if (!blob) return
        if (brushPaintDebounceRef.current) clearTimeout(brushPaintDebounceRef.current)
        if (brushEraseDebounceRef.current) clearTimeout(brushEraseDebounceRef.current)
        const reader = new FileReader()
        reader.onload = () => {
          setItems(current => current.map(item =>
            item.id === activeBrushLayerIdRef.current
              ? { ...item, src: reader.result }
              : item
          ))
        }
        reader.readAsDataURL(blob)
        if (collaboratorsGuardRef.current.length > 1) {
          const id = activeBrushLayerIdRef.current
          if (id) {
            uploadForBroadcast(blob, 'brush').then((realUrl) => {
              if (realUrl) {
                setItems((prev) => prev.map((item) =>
                  item.id === id ? { ...item, src: realUrl, _pendingUpload: undefined } : item
                ))
                broadcastItemUpdate(id, { src: realUrl })
              }
            })
          }
        }
      }, 'image/png')
    }
  }, [])

  const debouncedBrushUpload = useCallback(({ eraseBlob, eraseItemId } = {}) => {
    const isErase = !!(eraseBlob && eraseItemId)
    const debounceRef = isErase ? brushEraseDebounceRef : brushPaintDebounceRef
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null
      if (collaboratorsGuardRef.current.length <= 1) return
      let blob, itemId, prefix
      if (isErase) {
        blob = eraseBlob
        itemId = eraseItemId
        prefix = 'erase'
      } else {
        const canvas = brushCanvasRef.current
        const id = activeBrushLayerIdRef.current
        if (!canvas || !id) return
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        itemId = id
        prefix = 'brush'
      }
      if (!blob || !itemId) return
      const realUrl = await uploadForBroadcast(blob, prefix)
      if (realUrl) {
        setItems((prev) => prev.map((item) =>
          item.id === itemId ? { ...item, src: realUrl, _pendingUpload: undefined } : item
        ))
        broadcastItemUpdate(itemId, { src: realUrl })
      }
    }, 500)
  }, [])

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
  const removeBgCancelRef = useRef(false)
  const [removeBgProgress, setRemoveBgProgress] = useState(null)
  const [activeToolCard, setActiveToolCard] = useState(null)
  const warpStateRef = useRef(null)
  const [relightActive, setRelightActive] = useState(false)
  const warpImageRef = useRef(null)
  const layerRef = useRef(null)
  const warpImageNodeRef = useRef(null)
  const warpedItemIdRef = useRef(null)
  const [warpRenderTick, setWarpRenderTick] = useState(0)
  const [isRenamingTitle, setIsRenamingTitle] = useState(false)
  const [renamingTitleValue, setRenamingTitleValue] = useState('')
  const [toolbarPos, setToolbarPos] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showAlignSubmenu, setShowAlignSubmenu] = useState(false)
  const [hasClipboard, setHasClipboard] = useState(false)
  const [isMorePanelOpen, setIsMorePanelOpen] = useState(false)
  const [isFxPanelOpen, setIsFxPanelOpen] = useState(false)
  const [destFxTargetId, setDestFxTargetId] = useState(null)
  const [showDestPicker, setShowDestPicker] = useState(false)
  const [isGroupSelectMode, setIsGroupSelectMode] = useState(false)
  const stageRef = useRef(null)
  const viewportRef = useRef(null)
  const textEditorRef = useRef(null)
  const inlineTextEditorRef = useRef(null)
  const richTextEditorRef = useRef(null)
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
  // Moved inside CursorOverlay which renders under CollaborationProvider
  const wheelZoomAccumRef = useRef(null)
  const wheelZoomFrameRef = useRef(null)
  const mousePanAccumRef = useRef(null)
  const mousePanFrameRef = useRef(null)
  const touchPinchAccumRef = useRef(null)
  const touchPinchFrameRef = useRef(null)
  const hasCenteredCameraRef = useRef(false)
  const imageMetadataRef = useRef(new Map())
  const activeObjectDragRef = useRef(null)
  const multiDragRef = useRef(null)
  const multiDragActiveRef = useRef(false)
  const skipGroupDragEndRef = useRef(false)
  const pendingGroupDeltasRef = useRef({})
  const broadcastRef = useRef(null)
  const itemUpdateThrottleRef = useRef({})
  const broadcastItemUpdate = useCallback((itemId, patch) => {
    const now = Date.now()
    const throttle = itemUpdateThrottleRef.current
    if (!throttle[itemId] || now - throttle[itemId] > 200) {
      throttle[itemId] = now
      const safePatch = {}
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'src' && typeof v === 'string' && v.startsWith('blob:')) continue
        safePatch[k] = v === undefined ? null : v
      }
      // effectPatch: only send entries that differ from defaults (active effects)
      // plus entries that were active but are now being cleared (toggle-off)
      if (safePatch.effects && typeof safePatch.effects === 'object') {
        const defaults = getDefaultEffects()
        const currentItem = itemsRef.current.find((i) => i.id === itemId)
        const currentEffects = currentItem?.effects || defaults
        const nonDefaults = {}
        for (const [k, v] of Object.entries(safePatch.effects)) {
          const diffFromDefault = JSON.stringify(v) !== JSON.stringify(defaults[k])
          const wasActive = currentEffects[k] != null && JSON.stringify(currentEffects[k]) !== JSON.stringify(defaults[k])
          if (diffFromDefault || wasActive) {
            nonDefaults[k] = v === undefined ? null : v
          }
        }
        safePatch.effectPatch = nonDefaults
        delete safePatch.effects
      }
      broadcastRef.current?.('item_update', { userId: user?.id, itemId, patch: safePatch })
    }
  }, [user?.id])
  const itemUpdateHandlerRef = useRef(null)
  itemUpdateHandlerRef.current = (itemId, patch) => {
    setItems((prev) => {
      skipUndoCaptureRef.current = true
      return prev.map((item) => {
        if (item.id !== itemId) return item
        const updated = { ...item }
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) {
            delete updated[k]
          } else if (k === 'effectPatch' && typeof v === 'object' && !Array.isArray(v)) {
            updated.effects = { ...(item.effects || getDefaultEffects()) }
            for (const [effectId, effectVal] of Object.entries(v)) {
              if (effectVal === null || effectVal === undefined) {
                delete updated.effects[effectId]
              } else {
                updated.effects[effectId] = effectVal
              }
            }
          } else {
            updated[k] = v
          }
        }
        return updated
      })
    })
  }
  const uploadForBroadcast = async (blob, prefix = 'img') => {
    try {
      const file = new File([blob], `${prefix}-${Date.now()}.png`, { type: 'image/png' })
      const uploaded = await uploadMediaFile({ file, addToUploads: false })
      return uploaded?.media?.url || null
    } catch (err) {
      console.error('[uploadForBroadcast]', err)
      return null
    }
  }

  const broadcastItemAdd = useCallback((item) => {
    if (item.src?.startsWith('blob:')) return
    broadcastRef.current?.('item_added', { userId: user?.id, item })
  }, [user?.id])
  const itemAddHandlerRef = useRef(null)
  itemAddHandlerRef.current = (newItem) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === newItem.id)) return prev
      skipUndoCaptureRef.current = true
      if (newItem.kind === 'brushLayer') {
        const existing = prev.find((item) => item.kind === 'brushLayer' && item.id !== newItem.id)
        if (existing) {
          activeBrushLayerIdRef.current = newItem.id
          return prev.map((item) => item.id === existing.id ? newItem : item)
        }
      }
      return [newItem, ...prev]
    })
  }
  const broadcastItemRemove = useCallback((itemId) => {
    broadcastRef.current?.('item_removed', { userId: user?.id, itemId })
  }, [user?.id])
  const itemRemoveHandlerRef = useRef(null)
  itemRemoveHandlerRef.current = (itemId) => {
    setItems((prev) => {
      skipUndoCaptureRef.current = true
      return prev.filter((item) => item.id !== itemId)
    })
  }
  const reorderHandlerRef = useRef(null)
  reorderHandlerRef.current = (itemId, direction, activeIds) => {
    setItems((prev) => {
      if (direction === 'over') {
        // Drag reorder in layer panel
        // itemId = group key or single item ID; activeIds = reference (over.id)
        const refIdx = prev.findIndex((item) => item.id === activeIds)
        if (refIdx < 0) return prev
        const groupMatch = prev.find((item) => item.groupId === itemId || item.parentGroupId === itemId)
        if (groupMatch) {
          // Moved a group — move all members to ref position
          const groupMemberIds = new Set(
            prev.filter((c) => c.groupId === itemId || c.parentGroupId === itemId).map((c) => c.id)
          )
          if (!groupMemberIds.size) return prev
          const rest = prev.filter((item) => !groupMemberIds.has(item.id))
          const refInRest = rest.findIndex((item) => item.id === activeIds)
          const insertAt = refInRest >= 0 ? refInRest : rest.length
          const block = prev.filter((c) => groupMemberIds.has(c.id))
          skipUndoCaptureRef.current = true
          return [...rest.slice(0, insertAt), ...block, ...rest.slice(insertAt)]
        }
        // Single item move
        const draggedIdx = prev.findIndex((item) => item.id === itemId)
        if (draggedIdx < 0) return prev
        const next = prev.filter((item) => item.id !== itemId)
        const insertIdx = refIdx > draggedIdx ? refIdx - 1 : refIdx
        next.splice(insertIdx, 0, prev[draggedIdx])
        skipUndoCaptureRef.current = true
        return next
      }
      if (activeIds) {
        // Multi-select block reorder (moveLayerBlock)
        const activeSet = new Set(activeIds)
        const block = prev.filter((item) => activeSet.has(item.id))
        if (!block.length) return prev
        const rest = prev.filter((item) => !activeSet.has(item.id))
        const firstIndex = prev.findIndex((item) => activeSet.has(item.id))
        const restBeforeBlock = prev.slice(0, firstIndex).filter((item) => !activeSet.has(item.id)).length
        let insertIndex = restBeforeBlock
        if (direction === 'front') insertIndex = 0
        if (direction === 'back') insertIndex = rest.length
        if (direction === 'forward') insertIndex = Math.max(0, restBeforeBlock - 1)
        if (direction === 'backward') insertIndex = Math.min(rest.length, restBeforeBlock + 1)
        if (insertIndex === restBeforeBlock) return prev
        skipUndoCaptureRef.current = true
        return [...rest.slice(0, insertIndex), ...block, ...rest.slice(insertIndex)]
      }
      if (!itemId) return prev
      const idx = prev.findIndex((item) => item.id === itemId)
      if (idx < 0) return prev
      const next = [...prev]
      if (direction === 'forward' && idx > 0) {
        ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      } else if (direction === 'backward' && idx < prev.length - 1) {
        ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      } else if (direction === 'front') {
        const item = prev[idx]
        skipUndoCaptureRef.current = true
        return [item, ...prev.slice(0, idx), ...prev.slice(idx + 1)]
      } else if (direction === 'back') {
        const item = prev[idx]
        skipUndoCaptureRef.current = true
        return [...prev.slice(0, idx), ...prev.slice(idx + 1), item]
      }
      skipUndoCaptureRef.current = true
      return next
    })
  }
  const broadcastLayerReorder = useCallback((itemId, direction, activeIds) => {
    broadcastRef.current?.('layer_reorder', { userId: user?.id, itemId, direction, activeIds })
  }, [user?.id])

  const workspaceUpdateHandlerRef = useRef(null)
  workspaceUpdateHandlerRef.current = (patch) => {
    if (patch.workspaceTitle !== undefined) {
      setWorkspaceTitle(patch.workspaceTitle)
    }
    if (patch.canvasSettings) {
      setCanvasSettings((prev) => ({ ...prev, ...patch.canvasSettings }))
    }
  }

  const broadcastWorkspaceUpdate = useCallback((patch) => {
    broadcastRef.current?.('workspace_update', { userId: user?.id, patch })
  }, [user?.id])

  const collaboratorsGuardRef = useRef([])
  const toastRef = useRef(null)

  const bezierStateHandlerRef = useRef(null)
  bezierStateHandlerRef.current = (data) => {
    const { anchors, editingItemId } = data
    if (anchors !== undefined) {
      setRemoteBezierDraws((prev) => {
        const next = { ...prev }
        if (anchors.length === 0) {
          delete next[data.userId]
        } else {
          next[data.userId] = { anchors, userId: data.userId }
        }
        return next
      })
    }
    if (editingItemId !== undefined) {
      if (editingItemId) {
        remoteBezierEditRef.current = { itemId: editingItemId, userId: data.userId }
      } else {
        remoteBezierEditRef.current = null
      }
    }
  }
  const [remoteBezierDraws, setRemoteBezierDraws] = useState({})
  const remoteBezierEditRef = useRef(null)

  const broadcastBezierState = useCallback(({ anchors, editingItemId }) => {
    broadcastRef.current?.('bezier_state', { userId: user?.id, anchors, editingItemId })
  }, [user?.id])

  const selectedIdsRef = useRef(selectedIds)
  const selectionBoxRef = useRef(null)
  const clipboardRef = useRef([])
  const itemsRef = useRef(initialItems)
  const targetCameraRef = useRef(camera)
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const localUndoRef = useRef([])
  const localRedoRef = useRef([])
  const isUndoingRef = useRef(false)
  const isLocalUndoingRef = useRef(false)
  const skipUndoCaptureRef = useRef(false)
  const prevItemsRef = useRef()
  const hasRestoredWorkspaceRef = useRef(!shouldLoadWorkspace)
  const lastSavedSnapshotHashRef = useRef(null)
  const autosaveTimerRef = useRef(null)
  const canvasMetadataSyncTimerRef = useRef(null)
  const lastSyncedCanvasMetadataHashRef = useRef(null)
  const isAutosavingRef = useRef(false)
  const isPersistingRef = useRef(false)
  const skipNextAutosaveRef = useRef(shouldLoadWorkspace)
  const shouldCenterAfterPanelCloseRef = useRef(false)

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId])
  const selectedItems = useMemo(() => selectedIds.map((id) => items.find((item) => item.id === id)).filter(Boolean), [items, selectedIds])
  const areAllLocked = useMemo(() => selectedIds.length > 0 && selectedItems.every((item) => item.locked), [selectedIds, selectedItems])
  const dominantPaletteImages = useMemo(() => {
    const allImageItems = items.filter(
      (item) => item.kind === 'image' && Array.isArray(item.dominantColors) && item.dominantColors.length > 0
    )
    const prioritySrc = selectedItem?.kind === 'image' ? selectedItem.id : null
    const sorted = prioritySrc
      ? [
          ...allImageItems.filter((item) => item.id === prioritySrc),
          ...allImageItems.filter((item) => item.id !== prioritySrc),
        ]
      : allImageItems
    return sorted.map((item) => ({ src: item.src, colors: item.dominantColors }))
  }, [items, selectedItem])

  const commitColorPickerChanges = useCallback((id) => {
    const pending = pendingColorPickerPatchRef.current
    if (!pending || Object.keys(pending).length === 0) return
    broadcastItemUpdate(id, pending)
    pendingColorPickerPatchRef.current = null
  }, [broadcastItemUpdate])

  const closeColorPicker = useCallback(() => {
    const id = selectedItem?.id
    if (id) commitColorPickerChanges(id)
    colorPickerActiveRef.current = false
    pendingColorPickerPatchRef.current = null
    setIsColorPickerOpen(false)
    setColorPickerTarget(null)
  }, [selectedItem, commitColorPickerChanges])

  const openColorPicker = useCallback((target) => {
    const prevId = selectedItem?.id
    if (prevId) commitColorPickerChanges(prevId)
    pendingColorPickerPatchRef.current = null
    colorPickerActiveRef.current = true
    setIsColorPickerOpen(true)
    setColorPickerTarget(target)
  }, [selectedItem, commitColorPickerChanges])

  const activeSelectionCount = selectedIds.length || (selectedId ? 1 : 0)
  const activeGroupId = useMemo(() => {
    if (selectedItems.length < 2) {
      return selectedItem?.parentGroupId || selectedItem?.groupId || null
    }
    const first = selectedItems[0]
    const commonGroupId = first?.groupId
    const commonParentId = first?.parentGroupId
    if (commonGroupId && selectedItems.every((item) => item.groupId === commonGroupId)) {
      return commonGroupId
    }
    if (commonParentId && selectedItems.every((item) => item.parentGroupId === commonParentId)) {
      return commonParentId
    }
    // Parent group detection: composite members (parentGroupId=X) + regular items (groupId=X)
    const possibleIds = new Set()
    selectedItems.forEach((i) => {
      if (i.parentGroupId) possibleIds.add(i.parentGroupId)
      if (i.groupId) possibleIds.add(i.groupId)
    })
    for (const pid of possibleIds) {
      if (selectedItems.every((i) => i.groupId === pid || i.parentGroupId === pid)) {
        return pid
      }
    }
    return null
  }, [selectedItem?.groupId, selectedItem?.parentGroupId, selectedItems])
  const activeCompositeOperator = useMemo(() => (
    items.find((item) => selectedIds.includes(item.id) && !item.isAdjustmentLayer) || selectedItem
  ), [items, selectedId, selectedIds, selectedItem])
  const activeCompositeMode = activeCompositeOperator?.compositeMode || null
  const canUseCompositeGroupMode = useMemo(() => (
    selectedItems.filter((item) => !item.isAdjustmentLayer && !['frame', 'freehand', 'connector'].includes(item.kind)).length > 1
  ), [selectedItem, selectedItems])
  const hasCompositeInSelection = useMemo(() => (
    selectedItems.some((item) => item.compositeMode === 'mask' || item.compositeMode === 'exclude')
  ), [selectedItems])
  const isSelectedCompositeGroup = useMemo(() => {
    const groupId = selectedItem?.groupId
    if (!groupId) return false
    return items.some((item) => item.groupId === groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude'))
  }, [items, selectedItem?.groupId])
  const layerEntries = useMemo(() => {
    const seenGroups = new Set()
    const parentGroupIds = new Set(items.filter((i) => i.parentGroupId).map((i) => i.parentGroupId))
    return items.flatMap((item) => {
      const key = item.parentGroupId || item.groupId
      if (!key) return [item]
      if (seenGroups.has(key)) return []
      seenGroups.add(key)
      const members = items.filter(
        (c) => c.groupId === key || c.parentGroupId === key
      )
      return [{
        id: key,
        kind: 'group',
        groupId: key,
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
  canvasSize = useMemo(() => ({ width: canvasSettings.width, height: canvasSettings.height }), [canvasSettings.width, canvasSettings.height])
  canvasBounds = useMemo(() => ({ x: 0, y: 0, width: canvasSettings.width, height: canvasSettings.height }), [canvasSettings.width, canvasSettings.height])
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

  const frontAdjIndex = useMemo(() => items.findIndex((item) => item.isAdjustmentLayer), [items])

  const belowItems = useMemo(() => {
    if (frontAdjIndex === -1) return items
    return items.filter((_, index) => index > frontAdjIndex)
  }, [items, frontAdjIndex])

  const aboveItems = useMemo(() => {
    if (frontAdjIndex === -1) return []
    return items.filter((_, index) => index < frontAdjIndex)
  }, [items, frontAdjIndex])

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
    const restoredItems = Array.isArray(snapshot.items) ? snapshot.items.map((item) => {
      if (item.src?.startsWith('blob:')) {
        console.warn(`[RESTORE] Item ${item.id} memiliki blob URL yang tidak valid setelah refresh:`, item.src)
      }
      if (item.groupId || item.compositeMode) {
        console.log(`[LOAD] Item ${item.id} memiliki composite fields:`, {
          groupId: item.groupId,
          compositeMode: item.compositeMode,
          maskSourceType: item.maskSourceType,
          kind: item.kind,
          shapeType: item.shapeType,
          src: item.src?.substring(0, 60),
          effectsKeys: item.effects ? Object.keys(item.effects).filter(k => item.effects[k]) : [],
        })
      }
      return {
        ...item,
        effects: item.effects || getDefaultEffects(),
      }
    }) : []
    const restoredAssetContextSignals = Array.isArray(snapshot.browseAssetContext) && snapshot.browseAssetContext.length > 0
      ? normalizeAssetContextSignals(snapshot.browseAssetContext)
      : restoredItems.filter((item) => item.kind === 'image').slice(0, 5).map((item) => {
        const rawFilename = item.src?.split('/').pop()?.split('?')[0]?.replace(/\.[^/.]+$/, '') || ''
        const isUuidFilename = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawFilename)
        const meaningfulFilename = isUuidFilename ? '' : rawFilename.replace(/_/g, ' ')
        const mediaId = item.mediaId || (isUuidFilename ? rawFilename : null)
        const fields = [
          item.title,
          ...(Array.isArray(item.tags) ? item.tags : []),
          meaningfulFilename,
        ].filter(Boolean)
        const normalizedFields = fields.map(normalizeSearchText).filter(Boolean)
        const compactFields = fields.map(compactSearchText).filter(Boolean)
        const tokens = normalizedFields.flatMap((f) => f.split(' ').filter((t) => t.length >= 3))
        return {
          key: `${mediaId || item.src || 'restored'}-${Date.now()}`,
          mediaId: mediaId || null,
          postId: null,
          boardId: null,
          sourceType: item.sourceType || null,
          normalizedFields,
          compactFields,
          tokens,
        }
      })
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

  const refreshSavedPosts = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedPosts([])
      return
    }
    setIsSavedPostsLoading(true)
    setSavedPostsError('')
    try {
      const payload = await getSavedPosts({ limit: 50 })
      setSavedPosts(payload.items || [])
    } catch (error) {
      setSavedPostsError(error.message || 'Gagal memuat saved posts')
    } finally {
      setIsSavedPostsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshDatabaseBoards()
  }, [refreshDatabaseBoards])

  useEffect(() => {
    refreshSavedPosts()
  }, [refreshSavedPosts])

  useEffect(() => {
    setAssetContextSignals([])
    setAssetSearchQuery('')
    setMixedBrowseAssets([])
    setBrowsePageInfo({ internalNextOffset: null, internalNextCursor: null, externalNextCursor: null })
    setPublicBrowseError('')
  }, [workspaceId])

  useEffect(() => {
    if (assetTab !== 'assets' || assetSubView !== 'browse') return undefined
    if (!hasRestoredWorkspaceRef.current) {
      setPublicBrowseError('')
      return undefined
    }
    let cancelled = false
    const query = assetSearchQuery.trim()
    setIsPublicBrowseLoading(true)
    setIsBrowseLoadMoreLoading(false)
    setMixedBrowseAssets([])
    lastMixedKeysRef.current = new Set()
    setBrowsePageInfo({ internalNextOffset: null, internalNextCursor: null, externalNextCursor: null })
    setPublicBrowseError('')
    const doFetch = () => {
      const fallbackInternal = () => query
        ? searchPublicPosts({ q: query, sort: 'relevance', limit: 36 })
        : getHomeFeed({ mode: 'for-you', limit: 36, seed: browseShuffleSeed })
      const externalQuery = getExternalBrowseQuery(query, assetContextSignals, browseShuffleSeed)
      const visualIds = !query ? assetContextSignals.map((s) => s.mediaId).filter((id) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)).join(',') : ''
      const internalRequest = visualIds
        ? getSimilarPostsByImage(visualIds, { limit: 36 }).then((r) => {
          if (r.items?.length) return { items: r.items, nextCursor: null }
          return fallbackInternal()
        }).catch(() => fallbackInternal())
        : fallbackInternal()
      const runExternalSearch = async (q, visualIds) => {
        try {
          const result = await searchExternalImages({ q, limit: 18, visualSimilarTo: visualIds, seed: browseShuffleSeed, context: 'browse_asset' })
          if (result.items?.length) return result
        } catch { void 0 }
        if (visualIds) {
          try { const r = await searchExternalImages({ q, limit: 18, seed: browseShuffleSeed, context: 'browse_asset' }); if (r.items?.length) return r } catch { void 0 }
        }
        if (q !== 'design inspiration') {
          try { const r = await searchExternalImages({ q: 'design inspiration', limit: 18, seed: browseShuffleSeed, context: 'browse_asset' }); if (r.items?.length) return r } catch { void 0 }
        }
        return { items: [] }
      }
      const externalRequest = runExternalSearch(externalQuery, visualIds)
      Promise.allSettled([internalRequest, externalRequest])
        .then(([internalResult, externalResult]) => {
          if (cancelled) return
          const newInternal = internalResult.status === 'fulfilled'
            ? (internalResult.value.items || []).flatMap(postToBrowseAssets) : []
          const newExternal = externalResult.status === 'fulfilled'
            ? (externalResult.value.items || []).map(externalImageToBrowseAsset) : []
          const mixed = computeMixedBrowseAssets([], newInternal, newExternal)
          setMixedBrowseAssets(mixed)
          lastMixedKeysRef.current = new Set(mixed.map((a) => a.mediaId || a.imageKey))
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
          if (!cancelled) {
            setIsPublicBrowseLoading(false)
            setIsBrowseRefreshing(false)
          }
        })
    }
    const timer = query ? window.setTimeout(doFetch, 220) : (doFetch(), null)
    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [assetContextSignals, assetSearchQuery, assetSubView, assetTab, browseRefreshKey, browseShuffleSeed])

  const hasMoreBrowseAssets = !!(browsePageInfo.internalNextOffset || browsePageInfo.internalNextCursor || browsePageInfo.externalNextCursor)

  const loadMoreBrowseAssets = useCallback(async () => {
    if (assetTab !== 'assets' || assetSubView !== 'browse' || isBrowseLoadMoreLoading || !hasMoreBrowseAssets) return
    const query = assetSearchQuery.trim()
    setIsBrowseLoadMoreLoading(true)
    setPublicBrowseError('')
    try {
      const externalQuery = getExternalBrowseQuery(query, assetContextSignals, browseShuffleSeed)
      const internalRequest = query
        ? browsePageInfo.internalNextOffset === null
          ? Promise.resolve({ items: [], nextOffset: null })
          : searchPublicPosts({ q: query, sort: 'relevance', limit: 24, offset: browsePageInfo.internalNextOffset })
        : browsePageInfo.internalNextCursor
          ? getHomeFeed({ mode: 'for-you', limit: 24, cursor: browsePageInfo.internalNextCursor })
          : Promise.resolve({ items: [], nextCursor: null })
      const externalRequest = browsePageInfo.externalNextCursor
        ? searchExternalImages({ q: externalQuery, limit: 12, cursor: browsePageInfo.externalNextCursor, context: 'browse_asset' })
        : Promise.resolve({ items: [], nextCursor: null })

      const [internalResult, externalResult] = await Promise.allSettled([internalRequest, externalRequest])
      const newInternal = internalResult.status === 'fulfilled'
        ? (internalResult.value.items || []).flatMap(postToBrowseAssets) : []
      const newExternal = externalResult.status === 'fulfilled'
        ? (externalResult.value.items || []).map(externalImageToBrowseAsset) : []
      setMixedBrowseAssets((current) => {
        const newMixed = computeMixedBrowseAssets(current, newInternal, newExternal)
        if (!newMixed.length) return current
        const updated = [...current, ...newMixed]
        lastMixedKeysRef.current = new Set(updated.map((a) => a.mediaId || a.imageKey))
        return updated
      })
      setBrowsePageInfo((current) => ({
        internalNextOffset: internalResult.status === 'fulfilled' ? (query ? internalResult.value?.nextOffset ?? null : null) : current.internalNextOffset,
        internalNextCursor: internalResult.status === 'fulfilled' ? (query ? null : internalResult.value?.nextCursor ?? null) : current.internalNextCursor,
        externalNextCursor: externalResult.status === 'fulfilled' ? (externalResult.value?.nextCursor ?? null) : current.externalNextCursor,
      }))
      const errors = [internalResult, externalResult]
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason?.message)
        .filter(Boolean)
      setPublicBrowseError(errors[0] || '')
    } finally {
      setIsBrowseLoadMoreLoading(false)
    }
  }, [assetContextSignals, assetSearchQuery, assetSubView, assetTab, browsePageInfo, hasMoreBrowseAssets, isBrowseLoadMoreLoading, browseShuffleSeed])

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
  const getSavedPostAssets = useCallback((post) => {
    const postMedia = post.media || []
    const entries = postMedia.length > 0 ? postMedia : (post.cover ? [post.cover] : [])
    if (entries.length === 0) return []
    return entries.map((entry, index) => toDatabaseImageAsset({
      url: entry.publicUrl || entry.url,
      width: entry.width,
      height: entry.height,
      mimeType: entry.mimeType,
      mediaId: entry.mediaId || `${post.id}-${index}`,
      title: entries.length > 1 ? `${post.title || 'Saved'} ${index + 1}` : post.title || 'Saved',
      tags: post.metadata?.tags || post.tags || [],
      description: post.caption || '',
    }, {
      boardName: 'Saved',
      postId: post.id,
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
      sourceType: asset.sourceType || null,
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
    ].slice(0, 5))
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

  const rankBrowseAssets = useCallback((assets) => {
    const query = assetSearchQuery.trim().toLowerCase()
    const seed = browseShuffleSeed
    const seedPerturb = (asset, baseScore) => {
      if (!seed) return baseScore
      const key = asset.mediaId || asset.imageKey || asset.title || ''
      const perturb = (hashStr(`${seed}-${key}`) % 97) * 0.0003
      return baseScore + perturb
    }
    if (!query) {
      if (!assetContextSignals.length) return assets
      return assets
        .map((asset, index) => ({
          asset,
          score: seedPerturb(asset, getAssetRelatedScore(asset, assetContextSignals) + Math.max(0, 1 - index * 0.01)),
        }))
        .sort((a, b) => b.score - a.score || (a.asset.title || '').localeCompare(b.asset.title || ''))
        .map(({ asset }) => asset)
    }
    return assets
      .map((asset) => ({ asset, score: seedPerturb(asset, getAssetSearchScore(asset, query)) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || (a.asset.title || '').localeCompare(b.asset.title || ''))
      .map(({ asset }) => asset)
  }, [assetContextSignals, assetSearchQuery, browseShuffleSeed])

  const computeMixedBrowseAssets = useCallback((existingMixed = [], newInternal = [], newExternal = []) => {
    const seenKeys = new Set(existingMixed.map((a) => a.mediaId || a.imageKey))
    const dedupe = (list) => list.filter((asset, idx, arr) => arr.findIndex((c) => (c.mediaId || c.imageKey) === (asset.mediaId || asset.imageKey)) === idx)
    const allUnique = dedupe([...newInternal, ...newExternal]).filter((a) => !seenKeys.has(a.mediaId || a.imageKey))
    if (!allUnique.length) return []
    return rankBrowseAssets(allUnique)
  }, [rankBrowseAssets])
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
      textAlign: isShapeText ? (editingTextItem.shapeTextAlign || 'center') : (editingTextItem.align || 'center'),
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

  const injectFonts = async (fonts) => {
    for (const font of fonts) {
      const family = font.family || font.name
      if (!family || !font.url) continue
      try {
        const face = new FontFace(family, `url(${font.url})`)
        const loaded = await face.load()
        document.fonts.add(loaded)
        clearFontCache(family)
        preloadFont(family).catch(() => {})
      } catch (err) {
        console.warn('[inject] skip:', family, err.message)
      }
    }
    // No _fontVersion setItems here — fontInjectVersion handles re-render.
  }

  const refreshCustomFonts = useCallback(() => {
    if (!isAuthenticated) return
    apiListFonts()
      .then(async (payload) => {
        const fonts = (payload.fonts || []).map((f) => ({ ...f, category: 'Import' }))
        setCustomFonts(fonts)
        await injectFonts(fonts)
        requestAnimationFrame(() => {
          const layer = stageRef.current?.findOne('Layer')
          if (layer) {
            layer.find('Text').forEach((node) => {
              node.clearCache()
              if (typeof node._clearTextCache === 'function') node._clearTextCache()
            })
            layer.batchDraw()
          }
          setFontInjectVersion((v) => v + 1)
        })
      })
      .catch(() => {})
  }, [isAuthenticated])

  useEffect(() => {
    refreshCustomFonts()
  }, [refreshCustomFonts])

  // Reset font display count and load favorites when picker opens
  useEffect(() => {
    if (isFontPickerOpen) {
      setFontDisplayCount(20)
      loadFavorites()
    }
  }, [isFontPickerOpen, loadFavorites])

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
    setLoadingPhase('loading')
    setWorkspaceError('')

    getWorkspace(workspaceId)
      .then(({ workspace }) => {
        if (cancelled) return
        setWorkspaceOwnerId(workspace.ownerId || null)
        restoreWorkspaceSnapshot(workspace)
        hasRestoredWorkspaceRef.current = true
        skipNextAutosaveRef.current = true

        if (cancelled) return
        if (searchParams.get('export') === '1') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]export=1&?/g, (m) => m.endsWith('&') ? '?' : '').replace(/[?&]$/, ''))
          setTimeout(() => setIsExportModalOpen(true), 300)
        }
        if (searchParams.get('share') === '1') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]share=1&?/g, (m) => m.endsWith('&') ? '?' : '').replace(/[?&]$/, ''))
        }
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
  }, [isAuthenticated, isAuthLoading, requireAuth, restoreWorkspaceSnapshot, searchParams, setIsExportModalOpen, shouldLoadWorkspace, workspaceId])

  useEffect(() => {
    if (!isWorkspaceLoading && shouldLoadWorkspace && loadingPhase === 'loading') {
      setLoadingPhase('analyzing')
      let alive = true

      const run = async () => {
        const start = Date.now()

        console.time('[PHASE 2/3] Signal prep')
        const q = assetSearchQuery.trim()
        const query = getExternalBrowseQuery(q, assetContextSignals, browseShuffleSeed)
        const visualIds = !q
          ? assetContextSignals
            .map((s) => s.mediaId)
            .filter((id) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
            .join(',')
          : ''
        console.timeEnd('[PHASE 2/3] Signal prep')

        console.time('[PHASE 2/3] CLIP warm (searchExternalImages API)')
        const clipWarm = searchExternalImages({
          q: query, limit: 1, visualSimilarTo: visualIds, context: 'browse_asset', seed: browseShuffleSeed,
        }).then(() => console.timeEnd('[PHASE 2/3] CLIP warm (searchExternalImages API)')).catch(() => {
          console.timeEnd('[PHASE 2/3] CLIP warm (searchExternalImages API)')
        })

        await clipWarm

        if (!alive) return

        const elapsed = Date.now() - start
        const minDisplay = 300
        if (elapsed < minDisplay) {
          await new Promise((r) => setTimeout(r, minDisplay - elapsed))
        }

        if (!alive) return
        setLoadingPhase('preparing')
        await new Promise((r) => setTimeout(r, 200))
        if (!alive) return
        setLoadingPhase('done')
      }

      run()

      return () => { alive = false }
    }
    // loadingPhase sengaja gak di-depend biar cleanup cuma jalan pas unmount,
    // bukan pas setLoadingPhase('analyzing') trigger re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkspaceLoading, shouldLoadWorkspace, assetSearchQuery, assetContextSignals, browseShuffleSeed])

  useEffect(() => {
    if (selectedItem?.kind !== 'text') return

    textEditorRef.current?.focus()
    textEditorRef.current?.select()
  }, [selectedItem?.id, selectedItem?.kind])

  useEffect(() => {
    if (!editingText) return

    const item = itemsRef.current.find((current) => current.id === editingText.id)
    requestAnimationFrame(() => {
      if (item?.kind === 'shape') {
        inlineTextEditorRef.current?.focus()
        inlineTextEditorRef.current?.select()
      } else {
        richTextEditorRef.current?.focus()
      }
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
      addRelightOverlayClones({ stage, items, exportLayer })

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
      addRelightOverlayClones({ stage, items, exportLayer })

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

  const deleteOldSrc = useCallback(async (oldSrc) => {
    if (!oldSrc || !oldSrc.includes('/storage/') && !oldSrc.includes('supabase.co')) return
    try {
      await deleteMediaByUrl(oldSrc)
    } catch {}
  }, [])

  const uploadPendingItems = useCallback(async () => {
    const pendingItems = itemsRef.current.filter((item) => item._pendingUpload)
    if (pendingItems.length === 0) return { updates: [], failed: [] }

    const updates = []
    const failed = []
    for (const item of pendingItems) {
      const blob = item._pendingUpload
      const file = new File([blob], `pending-${Date.now()}-${item.id}.png`, { type: 'image/png' })
      let lastError = null
      let success = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const uploaded = await uploadMediaFile({ file, addToUploads: false })
          const newUrl = uploaded?.media?.url
          if (newUrl) {
            await deleteOldSrc(item._oldSrc || item.src)
            URL.revokeObjectURL(item.src)
            updates.push({ id: item.id, src: newUrl })
            success = true
            break
          }
        } catch (err) {
          lastError = err
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1000 * attempt))
          }
        }
      }
      if (!success) {
        console.error(`Failed to upload pending item after 3 attempts:`, item.id, lastError)
        failed.push(item.id)
      }
    }
    return { updates, failed }
  }, [deleteOldSrc])

  const buildSnapshotWithSrc = useCallback((srcUpdates) => {
    const snapshot = buildWorkspaceSnapshot()
    const updateMap = new Map((srcUpdates || []).map((u) => [u.id, u.src]))
    const patchedItems = snapshot.items.map((item) => {
      const newSrc = updateMap.get(item.id)
      const next = newSrc ? { ...item, src: newSrc } : { ...item }
      if (newSrc) {
        delete next._pendingUpload
        delete next._oldSrc
      }
      return next
    })
    return {
      ...snapshot,
      items: patchedItems,
      layers: patchedItems.map((item, index) => ({
        id: item.id,
        index,
        kind: item.kind,
        locked: !!item.locked,
        visible: item.visible !== false,
      })),
      assetsUsed: patchedItems
        .filter((item) => item.src || item.frameImageSrc || item.frameImages?.some((image) => image?.src))
        .map((item) => ({
          id: item.id,
          kind: item.kind,
          src: item.src || item.frameImageSrc || null,
          frameImages: item.frameImages || null,
        })),
    }
  }, [buildWorkspaceSnapshot])

  const persistWorkspaceSnapshot = useCallback(async (saveType = 'autosave', options = {}) => {
    if (!workspaceId || !hasRestoredWorkspaceRef.current) return null
    if (isPersistingRef.current) return null
    isPersistingRef.current = true
    try {
      const { updates, failed } = await uploadPendingItems()
      if (failed.length > 0) {
        console.warn(`[PERSIST] ${failed.length} item(s) gagal diupload — simpan dibatalkan. Coba simpan lagi.`, failed)
        alert(`⚠️ ${failed.length} gambar gagal disimpan ke server. Coba simpan lagi.`)
        return null
      }
      if (updates.length > 0) {
        setItems((prev) => prev.map((item) => {
          const match = updates.find((u) => u.id === item.id)
          if (match) {
            const next = { ...item, src: match.src }
            delete next._pendingUpload
            return next
          }
          return item
        }))
      }
      const snapshot = buildSnapshotWithSrc(updates)
      const snapshotHash = getSnapshotHash(snapshot)
      if (snapshotHash === lastSavedSnapshotHashRef.current) return null

      const compositeItems = snapshot.items.filter((i) => i.groupId || i.compositeMode)
      if (compositeItems.length > 0) {
        console.log('[SAVE] Items dengan composite fields akan disimpan:', compositeItems.map((i) => ({
          id: i.id,
          groupId: i.groupId,
          compositeMode: i.compositeMode,
          maskSourceType: i.maskSourceType,
          src: i.src?.substring(0, 50),
        })))
      }

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
    } finally {
      isPersistingRef.current = false
    }
  }, [buildSnapshotWithSrc, canvasSettings, uploadPendingItems, uploadWorkspaceThumbnail, workspaceId, workspaceTitle])

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
    if (skipUndoCaptureRef.current) {
      skipUndoCaptureRef.current = false
      prevItemsRef.current = items
      return
    }
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
    if (wheelZoomFrameRef.current) {
      cancelAnimationFrame(wheelZoomFrameRef.current)
    }
    if (mousePanFrameRef.current) {
      cancelAnimationFrame(mousePanFrameRef.current)
    }
    if (touchPinchFrameRef.current) {
      cancelAnimationFrame(touchPinchFrameRef.current)
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

  // (native canvas mousemove — removed, handled by Canvas onMouseMove)

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
    if (hasCenteredCameraRef.current || isWorkspaceLoading || loadingPhase !== 'done' || (shouldLoadWorkspace && !hasRestoredWorkspaceRef.current)) return undefined

    const rect = viewportRef.current?.getBoundingClientRect()
    const actualViewport = {
      width: Math.max(1, Math.round(rect?.width || viewportSize.width || 1)),
      height: Math.max(1, Math.round(rect?.height || viewportSize.height || 1)),
    }
    if (!actualViewport.width || !actualViewport.height) return

    const centeredCamera = getCenteredCamera(actualViewport)
    hasCenteredCameraRef.current = true
    prevViewportWidthRef.current = actualViewport.width
    targetCameraRef.current = centeredCamera
    cameraRef.current = centeredCamera
    viewportSizeRef.current = actualViewport
    setViewportSize(actualViewport)
    setCamera(centeredCamera)
  }, [
    canvasSettings.height,
    canvasSettings.width,
    getCenteredCamera,
    isWorkspaceLoading,
    loadingPhase,
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

  if (warpStateRef.current) {
    transformerRef.current.nodes([])
    transformerRef.current.getLayer()?.batchDraw()
    return
  }

  const ids = Array.isArray(idOrIds) ? idOrIds : (idOrIds ? [idOrIds] : [])

  if (!ids.length) {
    transformerRef.current.nodes([])
    transformerRef.current.getLayer()?.batchDraw()
    return
  }

  // Collect composite group nodes + individual item nodes together
  const seenGroups = new Set()
  const nodes = []

  ids.forEach((id) => {
    const info = getCompositeInfoForItemId(id)
    if (info && !seenGroups.has(info.groupId)) {
      seenGroups.add(info.groupId)
      const groupNode = stageRef.current?.findOne(`#composite-${info.groupId}`)
      if (groupNode) nodes.push(groupNode)
    } else if (!info) {
      const itemNode = stageRef.current?.findOne(`[id="${id}"]`) || stageRef.current?.findOne(`#${id}`)
      const item = itemsRef.current.find((candidate) => candidate.id === id)
      if (itemNode && item?.kind !== 'connector') nodes.push(itemNode)
    }
  })

  transformerRef.current.nodes(nodes)
  transformerRef.current.forceUpdate?.()
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
    closeColorPicker()
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
    pasted.forEach((item) => broadcastItemAdd(item))
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
          closeColorPicker()
        } else if (isBlendModeOpen) {
          setIsBlendModeOpen(false)
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !isTypingTarget) {
        event.preventDefault()
        const allIds = itemsRef.current
          .filter((item) => item.visible !== false)
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
        if (brushUndoStackRef.current.length > 0) {
          undoActiveBrushLayer()
        } else {
          handleUndo()
        }
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
  }, [isFontPickerOpen, isColorPickerOpen, editingFrameId, finishFrameImageEdit, connectorDraft, connectorTool, handleCopy, handlePaste, handleManualSave, undoActiveBrushLayer, closeColorPicker])

  const openRightPanel = (panel = activePanel) => {
    setConnectorTool(null)
    setConnectorDraft(null)
    setActivePanel(panel)
    setMobileSheetState('half')
    requestRecenterAfterWorkspaceLayoutChange()
    setIsRightPanelOpen(true)
    if (panel !== 'tools') {
      setActiveToolCard(null)
      warpStateRef.current = null
      warpImageRef.current = null
    }
  }

  const requestRecenterAfterWorkspaceLayoutChange = () => {
    shouldCenterAfterPanelCloseRef.current = true
  }

  const restoreHiddenWarpItem = () => {
    if (warpedItemIdRef.current) {
      updateItem(warpedItemIdRef.current, { visible: true })
      warpedItemIdRef.current = null
    }
  }

  const closeRightPanelAndCenter = () => {
    restoreHiddenWarpItem()
    requestRecenterAfterWorkspaceLayoutChange()
    setMobileSheetState('collapsed')
    setIsRightPanelOpen(false)
    setActiveToolCard(null)
    warpStateRef.current = null
    warpImageRef.current = null
  }

  const deselectCanvas = () => {
    setConnectorTool(null)
    setConnectorDraft(null)
    setSelectedId(null)
    setSelectedIds([])
    setSelectionBox(null)
    setAlignmentGuides([])
    setRotationSnapGuide(null)
    setActivePanel(null)
    setIsGroupSelectMode(false)
    closeRightPanelAndCenter()
    setIsRenamingTitle(false)
    setEditingSliderKey(null)
    attachTransformer(null)
    warpStateRef.current = null
    warpImageRef.current = null
    setActiveToolCard(null)
  }

  const selectItem = (id, options = {}) => {
    if (warpStateRef.current && warpStateRef.current.itemId !== id) {
      restoreHiddenWarpItem()
      warpImageRef.current = null
      warpStateRef.current = null
    }
    setIsBlendModeOpen(false)
    const item = itemsRef.current.find((candidate) => candidate.id === id)
    const resolvedIds = item && !options.ignoreGroup
      ? (() => {
          const resolveKey = item.parentGroupId || item.groupId
          if (!resolveKey) return [id]
          return itemsRef.current
            .filter((c) => c.groupId === resolveKey || c.parentGroupId === resolveKey)
            .map((c) => c.id)
        })()
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
    setActivePanel('properties')
    setIsRightPanelOpen(true)
    if (window.innerWidth <= 860) {
      setMobileSheetState('half')
    }
  }

  const deleteObject = useCallback((id) => {
    if (!id) return

    const target = itemsRef.current.find((i) => i.id === id)
    if (target?.src?.startsWith('blob:')) URL.revokeObjectURL(target.src)

    setItems((current) => current.filter((item) => item.id !== id))
    if (target?.mediaId) {
      setAssetContextSignals((current) => current.filter((s) => s.mediaId !== target.mediaId))
    }
    broadcastItemRemove(id)
    if (selectedId === id) {
      setSelectedId(null)
      setSelectedIds([])
      setActivePanel(null)
      setIsGroupSelectMode(false)
      closeRightPanelAndCenter()
      attachTransformer(null)
    } else {
      setSelectedIds((current) => current.filter((currentId) => currentId !== id))
    }
  }, [attachTransformer, broadcastItemRemove, selectedId])

  const deleteSelectedObject = useCallback(() => {
    const idsToDelete = selectedIds.length ? selectedIds : [selectedId]
    const mediaIds = idsToDelete.map((id) => itemsRef.current.find((i) => i.id === id)?.mediaId).filter(Boolean)
    setItems((current) => current.filter((item) => !idsToDelete.includes(item.id)))
    if (mediaIds.length) {
      setAssetContextSignals((current) => current.filter((s) => !mediaIds.includes(s.mediaId)))
    }
    idsToDelete.forEach((id) => broadcastItemRemove(id))
    setSelectedId(null)
    setSelectedIds([])
    setActivePanel(null)
    setIsGroupSelectMode(false)
    closeRightPanelAndCenter()
    attachTransformer(null)
  }, [attachTransformer, broadcastItemRemove, selectedId, selectedIds])

  const handleGroupSelectionAction = useCallback(() => {
    const activeIds = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    if (!activeIds.length) return

    if (activeIds.length > 1) {
      // Resolve composite groups: treat FULL composite groups as 1 unit
      const compositeGroupIds = new Set()
      let rejectPartial = false
      activeIds.forEach((id) => {
        const info = getCompositeInfoForItemId(id)
        if (info && !compositeGroupIds.has(info.groupId)) {
          compositeGroupIds.add(info.groupId)
          if (!info.members.every((m) => activeIds.includes(m.id))) {
            rejectPartial = true
          }
        }
      })
      if (rejectPartial) {
        alert('Tidak bisa mengelompokkan sebagian dari composite group — pilih seluruh anggota composite group atau tidak sama sekali.')
        return
      }
      // Build set of composite member IDs (yang akan dapat parentGroupId)
      const compositeMemberIds = new Set()
      compositeGroupIds.forEach((gid) => compositeMemberIds.add(gid))
      // For each composite group, add its members to the set
      const compositeMemberLookup = new Set()
      activeIds.forEach((id) => {
        const info = getCompositeInfoForItemId(id)
        if (info) info.members.forEach((m) => compositeMemberLookup.add(m.id))
      })
      const groupId = activeGroupId || `group-${Date.now()}`
      let capturedGroupMembers = null
      setItems((current) => {
        const selectedSet = new Set(activeIds)
        const rest = current.filter((item) => !selectedSet.has(item.id))
        const firstSelectedIndex = current.findIndex((item) => selectedSet.has(item.id))
        const insertIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : 0
        const groupMembers = current
          .filter((item) => selectedSet.has(item.id))
          .map((item) => {
            if (compositeMemberLookup.has(item.id)) {
              return { ...item, parentGroupId: groupId }
            }
            return { ...item, groupId }
          })
        capturedGroupMembers = groupMembers
        return [
          ...rest.slice(0, insertIndex),
          ...groupMembers,
          ...rest.slice(insertIndex),
        ]
      })
      if (collaboratorsGuardRef.current.length > 1 && capturedGroupMembers) {
        capturedGroupMembers.forEach((member) => {
          broadcastItemUpdate(member.id, {
            groupId: member.groupId,
            ...(member.parentGroupId ? { parentGroupId: member.parentGroupId } : {}),
          })
        })
      }
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
    // Cari items dari parent group (regular items + composite members)
    const groupIds = itemsRef.current
      .filter((item) => item.groupId === groupId || item.parentGroupId === groupId)
      .map((item) => item.id)
    // Cari operator composite untuk bake compositeGroup* ke member positions
    const operatorItem = itemsRef.current.find((item) =>
      item.groupId === groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude'))
    const cgx = operatorItem?.compositeGroupX
    const cgy = operatorItem?.compositeGroupY
    const cgsx = operatorItem?.compositeGroupScaleX
    const cgsy = operatorItem?.compositeGroupScaleY
    const cgr = operatorItem?.compositeGroupRotation
    const hasCompositeTransform = (cgx || cgy || (cgsx && cgsx !== 1) || (cgsy && cgsy !== 1) || cgr)
    const membersToClear = itemsRef.current.filter((i) => i.groupId === groupId)
    const parentMembersToClear = itemsRef.current.filter((i) => i.parentGroupId === groupId)
    setItems((current) => current.map((item) => {
      if (item.groupId === groupId) {
        let next = { ...item }
        if (hasCompositeTransform) {
          // TODO(rotate): bake rotation when composite rotation is active
          // newX = cgx + (m.x*cos(cgr) - m.y*sin(cgr)) * cgsx
          next.x = (cgx || 0) + (item.x || 0) * (cgsx || 1)
          next.y = (cgy || 0) + (item.y || 0) * (cgsy || 1)
          if (cgsx && cgsx !== 1) { next.w = (item.w || 1) * cgsx; next.h = (item.h || 1) * cgsy }
          if (cgr) next.rotation = (item.rotation || 0) + cgr
        }
        return { ...next, groupId: null, compositeMode: null, compositeGroupX: undefined, compositeGroupY: undefined, compositeGroupScaleX: undefined, compositeGroupScaleY: undefined, compositeGroupRotation: undefined }
      }
      if (item.parentGroupId === groupId) {
        // Composite member di parent group — lepas parentGroup saja, composite tetap utuh
        return { ...item, parentGroupId: null }
      }
      return item
    }))
    if (collaboratorsGuardRef.current.length > 1) {
      membersToClear.forEach((item) => {
        broadcastItemUpdate(item.id, {
          groupId: null, compositeMode: null,
          compositeGroupX: null, compositeGroupY: null,
          compositeGroupScaleX: null, compositeGroupScaleY: null,
          compositeGroupRotation: null,
        })
      })
      parentMembersToClear.forEach((item) => {
        broadcastItemUpdate(item.id, { parentGroupId: null })
      })
    }
    setIsGroupSelectMode(false)
    setSelectedIds(groupIds)
    setSelectedId(groupIds[groupIds.length - 1] || null)
    requestAnimationFrame(() => attachTransformer(groupIds))
  }, [activeGroupId, attachTransformer])

  const syncInlineEditor = useCallback((items) => {
    if (!editingText || !richTextEditorRef.current || !selectedId) return
    const source = items || itemsRef.current
    const updatedItem = source.find(item => item.id === selectedId)
    if (!updatedItem || updatedItem.kind !== 'text') return
    const runs = getRuns(updatedItem)
    richTextEditorRef.current.setHtml(runsToHtml(runs, updatedItem.fontFamily, updatedItem.fill))
  }, [editingText, selectedId])

  const handleUndo = useCallback(() => {
    if (localUndoRef.current.length) {
      const entry = localUndoRef.current.pop()
      const currentItem = itemsRef.current.find((i) => i.id === entry.itemId)
      if (currentItem) {
        const redoPatch = {}
        for (const key of Object.keys(entry.prevPatch)) {
          if (key in currentItem) redoPatch[key] = currentItem[key]
        }
        if (Object.keys(redoPatch).length) {
          localRedoRef.current.push({ itemId: entry.itemId, prevPatch: redoPatch })
        }
      }
      isLocalUndoingRef.current = true
      updateItem(entry.itemId, entry.prevPatch)
      isLocalUndoingRef.current = false
      return
    }
    if (!undoStackRef.current.length) return
    isUndoingRef.current = true
    redoStackRef.current.push(JSON.parse(JSON.stringify(itemsRef.current)))
    const prev = undoStackRef.current.pop()
    if (prev) {
      setItems(prev)
      requestAnimationFrame(() => syncInlineEditor(prev))
    }
  }, [syncInlineEditor])

  const handleRedo = useCallback(() => {
    if (localRedoRef.current.length) {
      const entry = localRedoRef.current.pop()
      const currentItem = itemsRef.current.find((i) => i.id === entry.itemId)
      if (currentItem) {
        const prevForUndo = {}
        for (const key of Object.keys(entry.prevPatch)) {
          if (key in currentItem) prevForUndo[key] = currentItem[key]
        }
        if (Object.keys(prevForUndo).length) {
          localUndoRef.current.push({ itemId: entry.itemId, prevPatch: prevForUndo })
        }
      }
      isLocalUndoingRef.current = true
      updateItem(entry.itemId, entry.prevPatch)
      isLocalUndoingRef.current = false
      return
    }
    if (!redoStackRef.current.length) return
    isUndoingRef.current = true
    undoStackRef.current.push(JSON.parse(JSON.stringify(itemsRef.current)))
    const next = redoStackRef.current.pop()
    if (next) {
      setItems(next)
      requestAnimationFrame(() => syncInlineEditor(next))
    }
  }, [syncInlineEditor])

  const alignCanvasItems = useCallback((alignment) => {
    const ids = selectedIds.length ? selectedIds : (selectedId ? [selectedId] : [])
    if (!ids.length) return
    const compositeDeltas = new Map()
    const compositeGroups = new Map()
    ids.forEach((id) => {
      const item = itemsRef.current.find((c) => c.id === id)
      if (!item?.groupId) return
      if (compositeGroups.has(item.groupId)) return
      const members = itemsRef.current.filter((c) => c.groupId === item.groupId)
      const isComposite = members.some((m) => m.compositeMode === 'mask' || m.compositeMode === 'exclude')
      if (!isComposite) return
      compositeGroups.set(item.groupId, members)
      const groupBounds = getItemsVisualBounds(members)
      if (!groupBounds) return
      let dx = 0, dy = 0
      switch (alignment) {
        case 'left':   dx = canvasBounds.x - groupBounds.left; break
        case 'right':  dx = (canvasBounds.x + canvasBounds.width) - groupBounds.right; break
        case 'center': dx = (canvasBounds.x + canvasBounds.width / 2) - groupBounds.centerX; break
        case 'top':    dy = canvasBounds.y - groupBounds.top; break
        case 'bottom': dy = (canvasBounds.y + canvasBounds.height) - groupBounds.bottom; break
        case 'middle': dy = (canvasBounds.y + canvasBounds.height / 2) - groupBounds.centerY; break
      }
      members.forEach((m) => compositeDeltas.set(m.id, { dx, dy }))
    })
    const patches = []
    setItems((current) => current.map((item) => {
      if (!ids.includes(item.id)) return item
      let newX = item.x || 0, newY = item.y || 0
      const compositeDelta = compositeDeltas.get(item.id)
      if (compositeDelta) {
        newX += compositeDelta.dx
        newY += compositeDelta.dy
      } else {
        const bounds = getItemVisualBounds(item)
        switch (alignment) {
          case 'left':   newX = (item.x || 0) + canvasBounds.x - bounds.left; break
          case 'right':  newX = (item.x || 0) + (canvasBounds.x + canvasBounds.width) - bounds.right; break
          case 'center': newX = (item.x || 0) + (canvasBounds.x + canvasBounds.width / 2) - bounds.centerX; break
          case 'top':    newY = (item.y || 0) + canvasBounds.y - bounds.top; break
          case 'bottom': newY = (item.y || 0) + (canvasBounds.y + canvasBounds.height) - bounds.bottom; break
          case 'middle': newY = (item.y || 0) + (canvasBounds.y + canvasBounds.height / 2) - bounds.centerY; break
        }
      }
      patches.push({ id: item.id, x: newX, y: newY })
      return { ...item, x: newX, y: newY }
    }))
    patches.forEach(({ id, x, y }) => broadcastItemUpdate(id, { x, y }))
  }, [selectedId, selectedIds, canvasBounds, broadcastItemUpdate])

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
    pasted.forEach((item) => broadcastItemAdd(item))
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
    ids.forEach((id) => broadcastItemUpdate(id, { locked: nextLocked }))
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        attachTransformer(ids)
        updateToolbarPosition()
      })
    })
  }, [attachTransformer, broadcastItemUpdate, selectedId, selectedIds])

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

    broadcastLayerReorder(null, direction, activeIds)
  }, [activeGroupId, selectedId, selectedIds, broadcastLayerReorder])

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
    broadcastLayerReorder(id, 'forward')
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length, broadcastLayerReorder])

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
    broadcastLayerReorder(id, 'backward')
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length, broadcastLayerReorder])

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
    broadcastLayerReorder(id, 'front')
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length, broadcastLayerReorder])

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
    broadcastLayerReorder(id, 'back')
  }, [activeGroupId, moveLayerBlock, selectedId, selectedIds.length, broadcastLayerReorder])

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
    // Debounced broadcast — same timer as arrow-key moves
    if (moveBroadcastTimerRef.current) clearTimeout(moveBroadcastTimerRef.current)
    moveBroadcastTimerRef.current = setTimeout(() => {
      moveBroadcastTimerRef.current = null
      const movedItems = itemsRef.current.filter((item) => activeIds.includes(item.id) && !item.locked)
      for (const item of movedItems) {
        const patch = { x: item.x, y: item.y }
        if (item.compositeMode) {
          Object.assign(patch, { compositeGroupX: undefined, compositeGroupY: undefined, compositeGroupScaleX: undefined, compositeGroupScaleY: undefined, compositeGroupRotation: undefined })
        }
        broadcastItemUpdate(item.id, patch)
      }
    }, 200)
    requestAnimationFrame(() => {
      const layer = stageRef.current?.findOne('Layer')
      layer?.batchDraw()
    })
  }, [selectedId, selectedIds, canvasBounds, broadcastItemUpdate])

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

  const moveBroadcastTimerRef = useRef(null)

  useEffect(() => {
    const scheduleMoveBroadcast = (ids) => {
      if (moveBroadcastTimerRef.current) clearTimeout(moveBroadcastTimerRef.current)
      moveBroadcastTimerRef.current = setTimeout(() => {
        moveBroadcastTimerRef.current = null
        const movedItems = itemsRef.current.filter((item) => ids.includes(item.id) && !item.locked)
        for (const item of movedItems) {
          const patch = { x: item.x, y: item.y }
          if (item.compositeMode) {
            Object.assign(patch, { compositeGroupX: undefined, compositeGroupY: undefined, compositeGroupScaleX: undefined, compositeGroupScaleY: undefined, compositeGroupRotation: undefined })
          }
          broadcastItemUpdate(item.id, patch)
        }
      }, 200)
    }

    const handleSelectionKeyboard = (event) => {
      const target = event.target
      const isEditingText = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (isEditingText || editingFrameId || (!selectedId && !selectedIds.length) || event.ctrlKey || event.metaKey || event.altKey) return

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

      scheduleMoveBroadcast(activeIds)

      requestAnimationFrame(() => {
        const layer = stageRef.current?.findOne('Layer')
        layer?.batchDraw()
      })
    }

    window.addEventListener('keydown', handleSelectionKeyboard)

    return () => {
      window.removeEventListener('keydown', handleSelectionKeyboard)
      if (moveBroadcastTimerRef.current) clearTimeout(moveBroadcastTimerRef.current)
    }
  }, [deleteSelectedObject, editingFrameId, selectedId, selectedIds])

  const captureUndo = (id, patch) => {
    if (isLocalUndoingRef.current) return
    const item = itemsRef.current.find((i) => i.id === id)
    if (!item || item.groupId) return
    const prevPatch = {}
    for (const key of Object.keys(patch)) {
      if (key in item && key !== 'undefined') prevPatch[key] = item[key]
    }
    if (!Object.keys(prevPatch).length) return
    localUndoRef.current.push({ itemId: id, prevPatch })
    if (localUndoRef.current.length > 50) localUndoRef.current.shift()
    localRedoRef.current = []
  }

  const updateItem = (id, patch, skipBroadcast = false) => {
    if (patch.src) {
      const oldItem = itemsRef.current.find((i) => i.id === id)
      if (oldItem?.src?.startsWith('blob:') && oldItem.src !== patch.src) {
        URL.revokeObjectURL(oldItem.src)
      }
    }
    const currentItem = itemsRef.current.find((i) => i.id === id)
    if (patch.x !== undefined || patch.y !== undefined) {
      const compositeInfo = getCompositeInfoForItemId(id)
      if (compositeInfo) {
        console.log('[DragEndDebug]', {
          location: 'updateItem (final write)',
          groupId: compositeInfo.groupId,
          memberId: id,
          oldX: currentItem?.x,
          oldY: currentItem?.y,
          patchX: patch.x,
          patchY: patch.y,
          source: 'updateItem → onChange dari mana pun',
        })
      }
    }

    // Reactive maskSourceType: when effects change on composite operator, auto-update
    if ('effects' in patch && (currentItem?.compositeMode === 'mask' || currentItem?.compositeMode === 'exclude')) {
      const newEffects = patch.effects
      const hasEffects = newEffects && typeof newEffects === 'object' && Object.keys(newEffects).length > 0
      patch.maskSourceType = (hasEffects && currentItem?.kind === 'image') ? 'alpha' : undefined
    }

    // Capture for per-item undo (committed changes only, not slider ticks)
    if (!skipBroadcast) captureUndo(id, patch)

    // Accumulate pending color-picker patches for broadcast on picker close
    const isColorPickerPatch = colorPickerActiveRef.current && Object.keys(patch).some(k =>
      ['fill', 'stroke', 'gradientType', 'gradientStops', 'gradientAngle', 'shapeTextFill',
       'imageStrokeColor', 'imageStrokeEnabled', 'imageStrokeGradientType', 'imageStrokeGradientStops',
       'imageStrokeGradientAngle', 'imageStrokeWidth', 'strokeGradientType', 'strokeGradientStops',
       'strokeGradientAngle'].includes(k)
    )
    if (isColorPickerPatch) {
      pendingColorPickerPatchRef.current = { ...pendingColorPickerPatchRef.current, ...patch }
    }

    // Broadcast to collaborators (throttled at 100ms per itemId via broadcastItemUpdate)
    // Suppress broadcast only for continuous color-picker changes (skipBroadcast=true)
    // Discrete changes (preset clicks, solid color commit, type toggles) broadcast immediately
    const isColorPickerChange = isColorPickerPatch && skipBroadcast
    if (!skipBroadcast && !isColorPickerChange && Object.keys(patch).some((k) => BROADCAST_KEYS.has(k))) {
      broadcastItemUpdate(id, patch)
    }

    setItems((current) => current.map((item) => {
      if (item.id !== id) return item
      const next = { ...item, ...patch }
      if (patch.src && patch.src !== item.src) {
        clearDominantColorCache(item.src)
        delete next.dominantColors
      }
      return next
    }))

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
    const nextAnchors = [...bezierAnchors, snapped]
    setBezierAnchors(nextAnchors)
    broadcastBezierState({ anchors: nextAnchors })
  }

  const undoBezierAnchor = () => {
    const nextAnchors = bezierAnchors.slice(0, -1)
    setBezierAnchors(nextAnchors)
    broadcastBezierState({ anchors: nextAnchors })
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
    broadcastBezierState({ anchors: [] })
    broadcastItemAdd(newItem)
    setBezierAnchors([])
    setBezierMousePos(null)
    setBezierGuides([])
  }

  const cancelBezierPath = () => {
    broadcastBezierState({ anchors: [] })
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
        if (m) result.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) })
      }
    }
    return result
  }

  const startEditingBezier = (itemId) => {
    setEditingBezierId(itemId)
    broadcastBezierState({ editingItemId: itemId })
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
    const rotRad = ((item.rotation || 0) * Math.PI) / 180
    const cos = Math.cos(rotRad); const sin = Math.sin(rotRad)
    const newOriginX = item.x + minX * cos - minY * sin
    const newOriginY = item.y + minX * sin + minY * cos
    const rel = anchors.map((a) => ({ x: a.x - minX, y: a.y - minY }))
    let pathData = `M ${rel[0].x},${rel[0].y}`
    for (let i = 1; i < rel.length; i++) pathData += ` L ${rel[i].x},${rel[i].y}`
    pathData += ' Z'
    setItems((items) => items.map((item) => {
      if (item.id !== itemId) return item
      return { ...item, x: newOriginX, y: newOriginY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY), path: pathData }
    }))
    broadcastItemUpdate(itemId, { x: newOriginX, y: newOriginY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY), path: pathData })
    setBezierEditAnchors(rel)
  }

  const finishEditingBezier = () => {
    setEditingBezierId(null)
    broadcastBezierState({ editingItemId: null })
    setBezierEditAnchors(null)
    setSelectedBezierAnchorIdx(null)
    bezierPreviewPathRef.current = null
    bezierCpRef.current = null
    setStageCursor('default')
  }

  // Tool cursor management
  const handleItemCursor = useCallback((cursor) => {
    if (activePanel === 'bezier' || editingBezierId || activePanel === 'brush') {
      return
    }
    setStageCursor(cursor)
  }, [activePanel, editingBezierId])

  useEffect(() => {
    if (activePanel === 'bezier') {
      setStageCursor('crosshair')
    } else {
      setStageCursor('default')
    }
    if (activePanel !== 'bezier') {
      setBezierMousePos(null)
      setBezierGuides([])
    }
  }, [activePanel, editingBezierId])

  useEffect(() => {
    if (activePanel === 'brush') {
      const cursorCss = brushSettings.mode === 'erase'
        ? "url('/eraser-cursor.svg') 16 16, crosshair"
        : "url('/brush-cursor.svg') 16 16, crosshair"
      setStageCursor(cursorCss)
    } else {
      setStageCursor('default')
    }
  }, [activePanel, brushSettings.mode])

  // Window safety net — catch pointerup/touchend outside Stage
  useEffect(() => {
    const handleUp = () => { if (isDrawingRef.current) handleBrushEnd() }
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [])

  const getImageDimensions = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal membaca dimensi gambar')) }
    img.src = url
  })


  const initWarp = useCallback((mode, divX, divY) => {
    if (!selectedItem || selectedItem.kind !== 'image') return
    const item = selectedItem
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      warpImageRef.current = img
      const gridDiv = mode === 'perspective' ? PERSPECTIVE_SUBDIVISIONS : divX
      const srcGrid = createGrid(0, 0, item.w, item.h, gridDiv, gridDiv)
      const dstGrid = cloneGrid(srcGrid)
      const renderGrid = cloneGrid(srcGrid)
      const canvas = document.createElement('canvas')
      const paddedW = item.w + WARP_PADDING * 2
      const paddedH = item.h + WARP_PADDING * 2
      canvas.width = paddedW
      canvas.height = paddedH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, WARP_PADDING, WARP_PADDING, item.w, item.h)
      warpStateRef.current = { itemId: item.id, mode, divX, divY, srcGrid, dstGrid, renderGrid, originalSrc: item.src, itemW: item.w, itemH: item.h, itemX: item.x, itemY: item.y, previewCanvas: canvas }
      warpedItemIdRef.current = item.id
      updateItem(item.id, { visible: false })
      setWarpRenderTick((t) => t + 1)
    }
    img.src = item.src
  }, [selectedItem])

  const handleApplyWarp = useCallback(async (mode, divX, divY) => {
    const item = selectedItem
    if (!item || item.kind !== 'image') return
    if (warpStateRef.current) {
      const ws = warpStateRef.current
      const img = warpImageRef.current
      if (!img) return
      const { previewCanvas, dstGrid, srcGrid, renderGrid, itemX, itemY, itemW, itemH } = ws
      if (!previewCanvas) return

      const natW = img.naturalWidth
      const natH = img.naturalHeight
      const scaleX = natW / itemW
      const scaleY = natH / itemH

      let finalDstGrid, finalSrcGrid
      if (ws.mode === 'perspective') {
        finalDstGrid = buildSubdividedGrid(gridCorners(dstGrid), APPLY_SUBDIVISIONS, APPLY_SUBDIVISIONS)
        finalSrcGrid = buildSubdividedGrid(gridCorners(srcGrid), APPLY_SUBDIVISIONS, APPLY_SUBDIVISIONS)
      } else {
        finalDstGrid = subdivideMeshGrid(renderGrid, 2)
        finalSrcGrid = subdivideMeshGrid(srcGrid, 2)
      }

      const scaledDstGrid = finalDstGrid.map((row) =>
        row.map((p) => ({ ...p, x: p.x * scaleX, y: p.y * scaleY }))
      )

      const nativePW = Math.ceil(natW + WARP_PADDING * 2 * scaleX)
      const nativePH = Math.ceil(natH + WARP_PADDING * 2 * scaleY)
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = nativePW
      tempCanvas.height = nativePH
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.imageSmoothingEnabled = true
      tempCtx.imageSmoothingQuality = 'high'
      renderWarpedImage(tempCtx, img, finalSrcGrid, scaledDstGrid, {
        imgWidth: natW,
        imgHeight: natH,
        offsetX: WARP_PADDING * scaleX,
        offsetY: WARP_PADDING * scaleY,
      })

      const allPoints = scaledDstGrid.flat()
      const xs = allPoints.map((p) => p.x)
      const ys = allPoints.map((p) => p.y)
      const minNativeX = Math.min(...xs)
      const minNativeY = Math.min(...ys)
      const maxNativeX = Math.max(...xs)
      const maxNativeY = Math.max(...ys)
      const cropNativeW = maxNativeX - minNativeX
      const cropNativeH = maxNativeY - minNativeY

      const displayMinX = minNativeX / scaleX
      const displayMinY = minNativeY / scaleY
      const displayCropW = cropNativeW / scaleX
      const displayCropH = cropNativeH / scaleY

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.ceil(cropNativeW))
      canvas.height = Math.max(1, Math.ceil(cropNativeH))
      const ctx = canvas.getContext('2d')
      ctx.drawImage(tempCanvas, minNativeX + WARP_PADDING * scaleX, minNativeY + WARP_PADDING * scaleY, cropNativeW, cropNativeH, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return
      const localUrl = URL.createObjectURL(blob)

      const oldItem = itemsRef.current.find((i) => i.id === item.id)
      if (oldItem?.src?.startsWith('blob:')) URL.revokeObjectURL(oldItem.src)
      setItems((prev) => prev.map((i) =>
        i.id === item.id ? { ...i, src: localUrl, visible: true, x: itemX + displayMinX, y: itemY + displayMinY, w: Math.round(displayCropW), h: Math.round(displayCropH), _oldSrc: oldItem?.src, _pendingUpload: blob } : i
      ))
      broadcastItemUpdate(item.id, { src: localUrl, visible: true, x: itemX + displayMinX, y: itemY + displayMinY, w: Math.round(displayCropW), h: Math.round(displayCropH) })
      if (collaboratorsGuardRef.current.length > 1) {
        uploadForBroadcast(blob, 'warp').then((realUrl) => {
          if (realUrl) {
            URL.revokeObjectURL(localUrl)
            setItems((prev) => prev.map((i) =>
              i.id === item.id ? { ...i, src: realUrl, _pendingUpload: undefined } : i
            ))
            broadcastItemUpdate(item.id, { src: realUrl })
          }
        })
      }

      warpedItemIdRef.current = null
      warpStateRef.current = null
      warpImageRef.current = null
      setActiveToolCard(null)
      setWarpRenderTick((t) => t + 1)
    } else {
      initWarp(mode, divX, divY)
    }
  }, [selectedItem, initWarp])

  const handleWarpCancel = useCallback(() => {
    restoreHiddenWarpItem()
    warpStateRef.current = null
    warpImageRef.current = null
    setWarpRenderTick((t) => t + 1)
  }, [])

  const handleWarpReset = useCallback((divX, divY, mode) => {
    if (!warpStateRef.current) {
      if (selectedItem?.kind !== 'image') return
      const img = warpImageRef.current
      if (!img) return
      const gridDiv = mode === 'perspective' ? PERSPECTIVE_SUBDIVISIONS : divX
      const srcGrid = createGrid(0, 0, selectedItem.w, selectedItem.h, gridDiv, gridDiv)
      const dstGrid = cloneGrid(srcGrid)
      const renderGrid = cloneGrid(srcGrid)
      const canvas = document.createElement('canvas')
      const pW = selectedItem.w + WARP_PADDING * 2
      const pH = selectedItem.h + WARP_PADDING * 2
      canvas.width = pW
      canvas.height = pH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, WARP_PADDING, WARP_PADDING, selectedItem.w, selectedItem.h)
      warpStateRef.current = { itemId: selectedItem.id, mode, divX, divY, srcGrid, dstGrid, renderGrid, originalSrc: selectedItem.src, itemW: selectedItem.w, itemH: selectedItem.h, itemX: selectedItem.x, itemY: selectedItem.y, previewCanvas: canvas }
      setWarpRenderTick((t) => t + 1)
      return
    }
    const img = warpImageRef.current
    if (!img) return
    if (mode === 'perspective') {
      const item = selectedItem
      if (!item) return
      const srcGrid = createGrid(0, 0, item.w, item.h, PERSPECTIVE_SUBDIVISIONS, PERSPECTIVE_SUBDIVISIONS)
      const dstGrid = cloneGrid(srcGrid)
      const renderGrid = cloneGrid(srcGrid)
      const canvas = document.createElement('canvas')
      const pW = item.w + WARP_PADDING * 2
      const pH = item.h + WARP_PADDING * 2
      canvas.width = pW
      canvas.height = pH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, WARP_PADDING, WARP_PADDING, item.w, item.h)
      warpStateRef.current = { ...warpStateRef.current, mode, divX: 1, divY: 1, srcGrid, dstGrid, renderGrid, itemX: item.x, itemY: item.y, previewCanvas: canvas }
    } else {
      const item = selectedItem
      if (!item) return
      const srcGrid = createGrid(0, 0, item.w, item.h, divX, divY)
      const dstGrid = cloneGrid(srcGrid)
      const canvas = document.createElement('canvas')
      const pW = item.w + WARP_PADDING * 2
      const pH = item.h + WARP_PADDING * 2
      canvas.width = pW
      canvas.height = pH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, WARP_PADDING, WARP_PADDING, item.w, item.h)
      warpStateRef.current = { ...warpStateRef.current, mode, divX, divY, srcGrid, dstGrid, renderGrid: dstGrid, itemX: item.x, itemY: item.y, previewCanvas: canvas }
    }
    setWarpRenderTick((t) => t + 1)
  }, [selectedItem])

  const handleWarpDragEnd = useCallback(() => {
    setWarpRenderTick((t) => t + 1)
  }, [])

  const handleWarpDrag = useCallback((row, col, x, y) => {
    const ws = warpStateRef.current
    if (!ws || !ws.previewCanvas) return
    const img = warpImageRef.current
    if (!img) return
    ws.dstGrid[row][col].x = x
    ws.dstGrid[row][col].y = y
    const renderGrid = ws.mode === 'perspective'
      ? buildSubdividedGrid(gridCorners(ws.dstGrid), PERSPECTIVE_SUBDIVISIONS, PERSPECTIVE_SUBDIVISIONS)
      : ws.dstGrid
    ws.renderGrid = renderGrid
    const ctx = ws.previewCanvas.getContext('2d')
    ctx.clearRect(0, 0, ws.previewCanvas.width, ws.previewCanvas.height)
    renderWarpedImage(ctx, img, ws.srcGrid, renderGrid, {
      imgWidth: img.naturalWidth,
      imgHeight: img.naturalHeight,
      srcWidth: ws.itemW,
      srcHeight: ws.itemH,
      offsetX: WARP_PADDING,
      offsetY: WARP_PADDING,
    })
    const node = warpImageNodeRef.current
    if (node) {
      node.getLayer()?.batchDraw()
    }
  }, [])

  useEffect(() => {
    if (activeToolCard === 'meshWarp' && selectedItem?.kind === 'image') {
      if (!warpStateRef.current || warpStateRef.current.itemId !== selectedItem.id) {
        initWarp('perspective', 3, 3)
      }
    } else if (activeToolCard !== 'meshWarp' && warpStateRef.current) {
      restoreHiddenWarpItem()
      warpStateRef.current = null
      warpImageRef.current = null
      setWarpRenderTick((t) => t + 1)
    }
  }, [activeToolCard, selectedItem, initWarp])

  useEffect(() => {
    if (activeToolCard === 'relight') {
      if (selectedItem?.kind === 'image' && !selectedItem.relight) {
        const patch = {
          relight: {
            lightA: { offsetX: -selectedItem.w * 0.3, offsetY: -selectedItem.h * 0.3, color: '#ff6b35' },
            lightB: { offsetX: selectedItem.w * 0.3, offsetY: selectedItem.h * 0.3, color: '#4488ff' },
          },
        }
        updateItem(selectedItem.id, patch)
        requestAnimationFrame(() => {
          const layer = stageRef.current?.findOne('Layer')
          layer?.batchDraw()
        })
      }
      setRelightActive(true)
    } else {
      setRelightActive(false)
    }
  }, [activeToolCard, selectedItem])

  const activateRelight = () => {
    if (!selectedItem || selectedItem.kind !== 'image') return
    const patch = {
      relight: {
        lightA: { offsetX: -selectedItem.w * 0.3, offsetY: -selectedItem.h * 0.3, color: '#ff6b35', intensity: 1 },
        lightB: { offsetX: selectedItem.w * 0.3, offsetY: selectedItem.h * 0.3, color: '#4488ff', intensity: 1 },
        darken: 0,
      },
    }
    updateItem(selectedItem.id, patch)
    setRelightActive(true)
  }

  const updateRelightLight = (lightKey, patch) => {
    if (!selectedItem?.relight) return
    const next = { ...selectedItem.relight, [lightKey]: { ...selectedItem.relight[lightKey], ...patch } }
    updateItem(selectedItem.id, { relight: next })
  }

  const handleUpdateDarken = (value) => {
    if (!selectedItem?.relight) return
    updateItem(selectedItem.id, { relight: { ...selectedItem.relight, darken: value } })
  }

  const deactivateRelight = () => {
    if (selectedItem?.relight) {
      updateItem(selectedItem.id, { relight: null })
    }
    setRelightActive(false)
  }

  const handleApplyRelight = async () => {
    const item = selectedItem
    if (!item || !item.relight) return
    const relight = item.relight

    let img
    try {
      img = await new Promise((resolve, reject) => {
        const el = new Image()
        el.crossOrigin = 'anonymous'
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = item.src
      })
    } catch {
      return
    }

    const natW = img.naturalWidth
    const natH = img.naturalHeight
    const scaleX = natW / item.w
    const scaleY = natH / item.h
    const cx = natW / 2
    const cy = natH / 2
    const maxR = Math.max(natW, natH) * 0.7

    // Light overlay canvas (colored gradients at native resolution)
    const lCanvas = document.createElement('canvas')
    lCanvas.width = natW
    lCanvas.height = natH
    const lctx = lCanvas.getContext('2d')
    for (const key of ['lightA', 'lightB']) {
      const light = relight[key]
      const localX = cx + light.offsetX * scaleX
      const localY = cy + light.offsetY * scaleY
      const gradient = lctx.createRadialGradient(localX, localY, 0, localX, localY, maxR)
      gradient.addColorStop(0, light.color)
      gradient.addColorStop(0.5, light.color + '99')
      gradient.addColorStop(1, 'transparent')
      lctx.globalAlpha = light.intensity ?? 1
      lctx.fillStyle = gradient
      lctx.fillRect(0, 0, natW, natH)
    }
    lctx.globalCompositeOperation = 'destination-in'
    lctx.globalAlpha = 1
    lctx.drawImage(img, 0, 0, natW, natH)

    // Shadow mask canvas
    let sCanvas = null
    if (relight.darken > 0) {
      sCanvas = document.createElement('canvas')
      sCanvas.width = natW
      sCanvas.height = natH
      const sctx = sCanvas.getContext('2d')
      sctx.fillStyle = 'black'
      sctx.fillRect(0, 0, natW, natH)
      sctx.globalCompositeOperation = 'destination-out'
      for (const key of ['lightA', 'lightB']) {
        const light = relight[key]
        const localX = cx + light.offsetX * scaleX
        const localY = cy + light.offsetY * scaleY
        const gradient = sctx.createRadialGradient(localX, localY, 0, localX, localY, maxR)
        gradient.addColorStop(0, 'white')
        gradient.addColorStop(0.5, 'white')
        gradient.addColorStop(1, 'transparent')
        sctx.globalAlpha = light.intensity ?? 1
        sctx.fillStyle = gradient
        sctx.fillRect(0, 0, natW, natH)
      }
      sctx.globalCompositeOperation = 'destination-in'
      sctx.globalAlpha = 1
      sctx.drawImage(img, 0, 0, natW, natH)
    }

    // Final composite
    const canvas = document.createElement('canvas')
    canvas.width = natW
    canvas.height = natH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, natW, natH)
    if (sCanvas) {
      ctx.globalAlpha = relight.darken
      ctx.drawImage(sCanvas, 0, 0)
      ctx.globalAlpha = 1
    }
    ctx.globalCompositeOperation = 'overlay'
    ctx.drawImage(lCanvas, 0, 0)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const localUrl = URL.createObjectURL(blob)
    const oldSrc = itemsRef.current.find((i) => i.id === item.id)?.src

    updateItem(item.id, { src: localUrl, relight: null, _oldSrc: oldSrc, _pendingUpload: blob })

    if (collaboratorsGuardRef.current.length > 1) {
      uploadForBroadcast(blob, 'relight').then((realUrl) => {
        if (realUrl) {
          URL.revokeObjectURL(localUrl)
          setItems((prev) => prev.map((i) =>
            i.id === item.id ? { ...i, src: realUrl, _pendingUpload: undefined } : i
          ))
        }
      })
    }

    setRelightActive(false)
    setActiveToolCard(null)
  }

  const handleCancelRemoveBg = useCallback(() => {
    removeBgCancelRef.current = true
    setIsRemoveBgProcessing(false)
    setRemoveBgProgress(null)
  }, [])

  const processRemoveBg = async () => {
    if (!selectedItem || selectedItem.kind !== 'image') return
    setIsRemoveBgProcessing(true)
    removeBgCancelRef.current = false
    setRemoveBgProgress({ phase: 'loading model', current: 0, total: 0 })
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      if (removeBgCancelRef.current) throw CANCELED
      const imgRes = await fetch(selectedItem.src)
      if (removeBgCancelRef.current) throw CANCELED
      const imgBlob = await imgRes.blob()
      if (removeBgCancelRef.current) throw CANCELED
      setRemoveBgProgress({ phase: 'processing', current: 0, total: 1 })
      const resultBlob = await removeBackground(imgBlob, {
        progress: (key, current, total) => {
          if (removeBgCancelRef.current) return
          if (key === 'model') {
            setRemoveBgProgress({ phase: 'loading model', current, total })
          } else if (key === 'inference') {
            setRemoveBgProgress({ phase: 'processing', current, total })
          }
        },
        model: 'medium',
      })

      if (removeBgCancelRef.current) throw CANCELED
      const localUrl = URL.createObjectURL(resultBlob)
      if (removeBgCancelRef.current) throw CANCELED
      const newItem = { ...selectedItem, id: `image-${Date.now()}`, x: selectedItem.x + 30, y: selectedItem.y + 30, src: localUrl, _pendingUpload: resultBlob }
      setItems((items) => [newItem, ...items])
      if (collaboratorsGuardRef.current.length > 1) {
        uploadForBroadcast(resultBlob, 'removebg').then((realUrl) => {
          if (realUrl) {
            URL.revokeObjectURL(localUrl)
            setItems((prev) => prev.map((item) =>
              item.id === newItem.id ? { ...item, src: realUrl, _pendingUpload: undefined } : item
            ))
            broadcastItemAdd({ ...newItem, src: realUrl, _pendingUpload: undefined })
          }
        })
      }
    } catch (error) {
      if (error !== CANCELED) console.error('Remove background failed:', error)
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
      return item && !item.isAdjustmentLayer && !['frame', 'freehand', 'connector'].includes(item.kind)
    })

    if (compositableIds.length <= 1) return

    const groupId = activeGroupId || `group-${Date.now()}`
    const selectedSet = new Set(compositableIds)
    const nextMode = activeCompositeMode === mode ? null : mode

    let capturedGroupMembers = null

    setItems((current) => {
      const groupMembers = current
        .filter((item) => selectedSet.has(item.id))
        .map((item, index) => {
          const isOperator = index === 0 && nextMode !== null
          const hasEffects = isOperator && item.effects && Object.keys(item.effects).length > 0
          return {
            ...item,
            groupId,
            compositeMode: index === 0 ? nextMode : null,
            ...(isOperator ? { maskSourceType: (hasEffects && item.kind === 'image') ? 'alpha' : undefined } : {}),
          }
        })
      if (groupMembers.length < 2) return current

      capturedGroupMembers = groupMembers

      const rest = current.filter((item) => !selectedSet.has(item.id))
      const firstSelectedIndex = current.findIndex((item) => selectedSet.has(item.id))
      const insertIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : 0
      return [
        ...rest.slice(0, insertIndex),
        ...groupMembers,
        ...rest.slice(insertIndex),
      ]
    })

    console.log('[CompositeGroup] applyCompositeGroupMode', {
      mode,
      groupId,
      capturedGroupMembers: capturedGroupMembers?.map((item) => ({
        id: item.id,
        compositeMode: item.compositeMode,
        maskSourceType: item.maskSourceType,
        kind: item.kind,
        hasEffects: !!item.effects && Object.keys(item.effects).length > 0,
        effectsKeys: item.effects ? Object.keys(item.effects) : [],
      })),
    })

    if (collaboratorsGuardRef.current.length > 1 && capturedGroupMembers) {
      capturedGroupMembers.forEach((member) => {
        broadcastItemUpdate(member.id, {
          groupId: member.groupId,
          compositeMode: member.compositeMode,
          maskSourceType: member.maskSourceType,
        })
      })
    }

    setIsGroupSelectMode(false)
    setSelectedIds(compositableIds)
    setSelectedId(compositableIds[compositableIds.length - 1] || null)
    requestAnimationFrame(() => attachTransformer(compositableIds))
  }, [activeCompositeMode, activeGroupId, attachTransformer, selectedId, selectedIds])

  const resizeCanvas = (nextSize, ratio = canvasSettings.ratio) => {
    if (collaboratorsGuardRef.current.length > 1) {
      toastRef.current?.('Tidak bisa mengubah rasio canvas saat ada collaborator lain yang aktif.', { type: 'error', duration: 4000 })
      return
    }
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

  const updateCanvasBackground = (patch, skipBroadcast = false) => {
    setCanvasSettings((current) => {
      const next = { ...current, background: { ...current.background, ...patch } }
      if (!skipBroadcast && collaboratorsGuardRef.current?.length > 1) {
        broadcastWorkspaceUpdate({ canvasSettings: next })
      }
      return next
    })
  }

  const getItemVisualBounds = (item) => {
    const x = item.x || 0
    const y = item.y || 0
    const w = item.w || 1

    // For text items, read actual rendered height from Konva node
    // to avoid stale item.h race condition with multi-run text.
    let h = item.h || 1
    if (item.kind === 'text') {
      const node = stageRef.current?.findOne(`#${item.id}`)
      if (node) {
        const rect = node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true })
        if (rect.height > 0) h = rect.height
      }
    }

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

  const getCompositeSnapBounds = (entry, adjustedMembers) => {
    return getItemsVisualBounds(adjustedMembers)
  }

  // === Composite Group Interaction Utilities ===
  const getCompositeGroupInfo = (groupId) => {
    if (!groupId) return null
    const members = itemsRef.current.filter((item) => item.groupId === groupId)
    if (members.length < 2) return null
    const isComposite = members.some((item) => item.compositeMode === 'mask' || item.compositeMode === 'exclude')
    return isComposite ? { groupId, members } : null
  }

  const getCompositeInfoForItemId = (itemId) => {
    const item = itemsRef.current.find((c) => c.id === itemId)
    if (!item?.groupId) return null
    return getCompositeGroupInfo(item.groupId)
  }

  const getInteractionBounds = (itemId) => {
    const info = getCompositeInfoForItemId(itemId)
    if (info) return getItemsVisualBounds(info.members)
    const item = itemsRef.current.find((c) => c.id === itemId)
    return item ? getItemVisualBounds(item) : null
  }

  const getInteractionNode = (itemId) => {
    const info = getCompositeInfoForItemId(itemId)
    if (info) return stageRef.current?.findOne(`#composite-${info.groupId}`)
    return stageRef.current?.findOne(`#${itemId}`) || stageRef.current?.findOne(`[id="${itemId}"]`)
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

    broadcastLayerReorder(active.id, 'over', over.id)
  }

  const getNextItemId = (type) => {
    const existingIds = new Set(itemsRef.current.map((item) => item.id))
    let nextId = crypto.randomUUID()

    while (existingIds.has(nextId)) {
      nextId = crypto.randomUUID()
    }

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

    const xCandidates = guideCandidates.filter((guide) => guide.axis === 'x')
    const yCandidates = guideCandidates.filter((guide) => guide.axis === 'y')
    console.log('[SnapDebug] getSnappedDelta candidates:', {
      xCount: xCandidates.length, yCount: yCandidates.length,
      movingXPoints: movingXPoints.map(p => `${p.key}=${p.value}`),
      movingYPoints: movingYPoints.map(p => `${p.key}=${p.value}`),
      scale: cameraRef.current?.scale,
      tolerance: snapTolerance / Math.max(0.1, cameraRef.current?.scale || 1),
    })
    const bestX = xCandidates
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

    return { dx: snappedDx, dy: snappedDy, guides: uniqueGuides, snapped: !!(bestX || bestY), _baseBounds: baseBounds, _candidateCounts: { x: xCandidates.length, y: yCandidates.length } }
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

    const pendingBlob = asset.isPending && asset.source?.startsWith('blob:')
      ? await fetch(asset.source).then((r) => r.blob()).catch(() => null)
      : null
    const nextItem = asset.type === 'image'
      ? { ...base, kind: 'image', src: asset.source, radius: 0, aspectRatio: imageSize.aspectRatio, lockAspectRatio: true, mediaId: asset.mediaId || null, sourceType: asset.sourceType || null, title: asset.title || '', tags: asset.tags || [], ...(pendingBlob ? { _pendingUpload: pendingBlob, _oldSrc: null } : {}) }
      : asset.type === 'text'
        ? { ...base, kind: 'text', text: asset.text, fontSize: 72, fill: '#2b2830', isBold: true, isItalic: false, isUnderline: false, fontFamily: 'Inter, Arial', runs: [{ text: asset.text, bold: true, italic: false, underline: false }] }
        : { ...base, kind: 'note', text: asset.text, fill: '#f5d56b' }

    return nextItem
  }

  const addAssetToCanvas = async (asset, position) => {
    const nextItem = await createCanvasItemFromAsset(asset, position)
    if (asset.sourceType === 'external-image') {
      ensureExternalImage({
        id: asset.mediaId,
        provider: asset.externalProvider || 'openverse',
        externalId: asset.externalId || asset.mediaId,
        title: asset.title || '',
        description: asset.description || '',
        tags: asset.tags || [],
        url: asset.source,
        thumbnailUrl: asset.previewSource || asset.source,
        width: asset.w || null,
        height: asset.h || null,
        author: asset.author || null,
        license: asset.license || null,
        sourceUrl: asset.sourceUrl || null,
      }).catch(() => {})
    }
    registerAssetContext(asset)
    logCanvasDropInterest(asset)

    pendingSelectIdRef.current = nextItem.id
    justDroppedIdRef.current = nextItem.id
    // FIX: Prepend to array so new item appears at top layer (frontmost)
    setItems((current) => [nextItem, ...current])
    broadcastItemAdd(nextItem)

    if (nextItem.kind === 'image') {
      extractDominantColors(nextItem.src, 5).then((colors) => {
        if (colors.length > 0) {
          updateItem(nextItem.id, { dominantColors: colors })
        }
      })
    }
  }

  const addNote = () => {
    const id = getNextItemId('note')
    const position = getSafeSpawnPosition({ w: 170, h: 120 })

    pendingSelectIdRef.current = id
    justDroppedIdRef.current = id
    // FIX: Prepend to array so new note appears at top layer (frontmost)
    const noteItem = { id, kind: 'note', text: 'New research note', x: position.x, y: position.y, w: 170, h: 120, fill: '#f4c2d7', rotation: -2, effects: getDefaultEffects() }
    setItems((current) => [noteItem, ...current])
    broadcastItemAdd(noteItem)
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
    broadcastItemAdd(newShape)
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
    broadcastItemAdd(newFrame)
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
    let removedMediaId = null
    if (removeId) {
      const removedItem = itemsRef.current.find((i) => i.id === removeId)
      if (removedItem?.mediaId) removedMediaId = removedItem.mediaId
    }
    setItems((current) => {
      let next = current.map((item) => (item.id === frameId ? { ...item, ...patch } : item))
      if (removeId) next = next.filter((i) => i.id !== removeId)
      return next
    })
    broadcastItemUpdate(frameId, patch)
    if (removeId) broadcastItemRemove(removeId)
    if (removedMediaId) {
      setAssetContextSignals((current) => current.filter((s) => s.mediaId !== removedMediaId))
    }

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
    detachedImages.forEach((image) => broadcastItemAdd(image))
    broadcastItemUpdate(frame.id, patch)
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
    const id = getNextItemId('text')

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
      runs: [{ text, bold: isBold, italic: isItalic, underline: false }],
      effects: getDefaultEffects(),
    }

    // FIX: Prepend to array so new text appears at top layer (frontmost)
    setItems((current) => [newText, ...current])
    broadcastItemAdd(newText)

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
    broadcastItemAdd(newConnector)
    setConnectorDraft(null)
    setConnectorTool(null)
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
    if ((activePanel === 'brush' && brushSettings.mode !== 'erase') || activePanel === 'bezier') return
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

    // BAKE: compositeGroup* → member positions for selected unbaked composites
    // commitTransformerChanges leaves composites in unbaked state where member
    // positions are local. We need world-space for multi-drag position capture.
    const bakedGroupIds = new Set()
    itemsRef.current.forEach((item) => {
      if (!activeSelection.includes(item.id)) return
      if (!item.groupId || bakedGroupIds.has(item.groupId)) return
      const groupInfo = getCompositeGroupInfo(item.groupId)
      if (!groupInfo) return
      const operatorItem = groupInfo.members.find((m) => m.compositeMode === 'mask' || m.compositeMode === 'exclude')
      if (!operatorItem) return
      const cgx = operatorItem.compositeGroupX
      const cgy = operatorItem.compositeGroupY
      const cgsx = operatorItem.compositeGroupScaleX
      const cgsy = operatorItem.compositeGroupScaleY
      const cgr = operatorItem.compositeGroupRotation
      const hasBake = (cgx || cgy || (cgsx && cgsx !== 1) || (cgsy && cgsy !== 1) || cgr)
      if (!hasBake) return
      bakedGroupIds.add(item.groupId)

      const bakedMembers = groupInfo.members.map((member) => ({
        id: member.id,
        x: (cgx || 0) + (member.x || 0) * (cgsx || 1),
        y: (cgy || 0) + (member.y || 0) * (cgsy || 1),
        w: (cgsx && cgsx !== 1) ? (member.w || 1) * cgsx : member.w,
        h: (cgsy && cgsy !== 1) ? (member.h || 1) * cgsy : member.h,
        rotation: cgr ? (member.rotation || 0) + cgr : member.rotation,
      }))

      itemsRef.current = itemsRef.current.map((it) => {
        if (it.groupId !== item.groupId) return it
        if (it.compositeMode) {
          return { ...it, x: (cgx || 0) + (it.x || 0) * (cgsx || 1), y: (cgy || 0) + (it.y || 0) * (cgsy || 1), w: (cgsx && cgsx !== 1) ? (it.w || 1) * cgsx : it.w, h: (cgsy && cgsy !== 1) ? (it.h || 1) * cgsy : it.h, rotation: cgr ? (it.rotation || 0) + cgr : it.rotation, compositeGroupX: undefined, compositeGroupY: undefined, compositeGroupScaleX: undefined, compositeGroupScaleY: undefined, compositeGroupRotation: undefined }
        }
        const baked = bakedMembers.find((b) => b.id === it.id)
        return baked ? { ...it, x: baked.x, y: baked.y, w: baked.w ?? it.w, h: baked.h ?? it.h, rotation: baked.rotation ?? it.rotation } : it
      })

      const groupNode = stageRef.current?.findOne(`#composite-${item.groupId}`)
      if (groupNode) {
        groupNode.position({ x: 0, y: 0 })
        groupNode.scale({ x: 1, y: 1 })
        groupNode.rotation(0)
      }
      bakedMembers.forEach((member) => {
        const node = stageRef.current?.findOne(`#${member.id}`)
        if (node) {
          node.x(member.x)
          node.y(member.y)
          if (member.w !== undefined) node.width(member.w)
          if (member.h !== undefined) node.height(member.h)
          if (member.rotation !== undefined) node.rotation(member.rotation)
        }
      })
    })

    multiDragRef.current = {
      id,
      start: { x: event.target.x(), y: event.target.y() },
      startTime: Date.now(),
      moveCount: 0,
      snapWasActive: false,
      positions: (() => {
        const p = {}
        const memberGroupIds = new Set()
        itemsRef.current.forEach((item) => {
          if (!activeSelection.includes(item.id)) return
          p[item.id] = { x: item.x || 0, y: item.y || 0 }
          // Expand to include ALL composite members so multi-drag
          // updates their positions too (not just the operator)
          if (item.groupId && !memberGroupIds.has(item.groupId)) {
            const info = getCompositeGroupInfo(item.groupId)
            if (info) {
              memberGroupIds.add(item.groupId)
              info.members.forEach((m) => {
                if (!p[m.id]) p[m.id] = { x: m.x || 0, y: m.y || 0 }
              })
            }
          }
        })
        return p
      })(),
    }
    multiDragActiveRef.current = true
    requestAnimationFrame(() => {
      attachTransformer(activeSelection)
    })
    setStageCursor('move')
  }

  const handleObjectDragMove = (event, id) => {
    const dragSession = multiDragRef.current
    if (!dragSession || dragSession.id !== id) return

    dragSession.moveCount = (dragSession.moveCount || 0) + 1

    const movingIds = Object.keys(dragSession.positions)
    const movingItems = itemsRef.current.filter((item) => movingIds.includes(item.id))
    const baseBounds = getItemsVisualBounds(movingItems.map((item) => ({ ...item, ...dragSession.positions[item.id] })))
    const rawDx = event.target.x() - dragSession.start.x
    const rawDy = event.target.y() - dragSession.start.y
    const snapped = getSnappedDelta(movingIds, baseBounds, rawDx, rawDy)
    console.log('[SnapDebug] regular handleObjectDragMove:', {
      rawDx, rawDy, guideCount: snapped.guides?.length, snapped: snapped.snapped,
      movingIds, baseBounds, _candidateCounts: snapped._candidateCounts,
    })
    dragSession.snapWasActive = snapped.snapped

    if (movingIds.length === 1 && !snapped.snapped) {
      setAlignmentGuides(snapped.guides)
      return
    }

    const processedGroups = new Set()
    movingIds.forEach((movingId) => {
      const startPosition = dragSession.positions[movingId]
      const item = itemsRef.current.find((current) => current.id === movingId)
      if (!item || !startPosition) return

      const compositeInfo = getCompositeInfoForItemId(movingId)
      if (compositeInfo) {
        if (processedGroups.has(compositeInfo.groupId)) {
          console.log('[DRAG_END_DEBUG] MOVEMOVE - composite group already processed, skipping:', { groupId: compositeInfo.groupId, movingId })
          return
        }
        processedGroups.add(compositeInfo.groupId)
        const groupNode = getInteractionNode(movingId)
        if (groupNode) {
          groupNode.position({ x: snapped.dx, y: snapped.dy })
          console.log('[DRAG_END_DEBUG] MOVEMOVE - set group position:', { groupId: compositeInfo.groupId, snappedDx: snapped.dx, snappedDy: snapped.dy, rawDx, rawDy, movingId })
        } else {
          console.log('[DRAG_END_DEBUG] MOVEMOVE - groupNode not found for:', { groupId: compositeInfo.groupId, movingId })
        }
        return
      }

      const node = getInteractionNode(movingId)
      if (!node) return
      const nextPosition = getClampedCanvasPosition(item.w || 1, item.h || 1, {
        x: startPosition.x + snapped.dx,
        y: startPosition.y + snapped.dy,
      }, canvasBounds)
      node.position(nextPosition)
      broadcastItemUpdate(movingId, nextPosition)
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
    // Set skip BEFORE multiDragRef is cleared — handleGroupDragEnd fires synchronously
    // when multiDragRef becomes null (between this line and the next).
    // Must guard before the Group's dragend event can execute.
    const isDraggingCompositeSource = !!getCompositeInfoForItemId(id)
    skipGroupDragEndRef.current = !isDraggingCompositeSource
    multiDragRef.current = null
    setAlignmentGuides([])
    setRotationSnapGuide(null)
    setStageCursor(isSpaceDown ? 'grab' : 'default')

    if (dragSession && Object.keys(dragSession.positions).length > 1) {
      const movingIds = Object.keys(dragSession.positions)
      // DEBUG: log movingIds and check groupId of each
      const debugGroupInfo = movingIds.map((mid) => {
        const item = itemsRef.current.find((i) => i.id === mid)
        const compositeInfo = getCompositeInfoForItemId(mid)
        return { id: mid, groupId: item?.groupId, hasCompositeInfo: !!compositeInfo, compositeGroupId: compositeInfo?.groupId }
      })
      console.log('[DRAG_END_DEBUG] CHECK - movingIds group info:', debugGroupInfo)

      // Detect apakah drag source adalah composite group member
      // Jika ya, handleGroupDragEnd juga akan fire → skip composite members di sini
      // Jika tidak, handleGroupDragEnd tidak fire → kita handle semua items
      const isDraggingCompositeSource = !!getCompositeInfoForItemId(id)

      // Log drag metrics untuk debugging intermittent bug
      const dragSourceInfo = getCompositeInfoForItemId(id)
      const dragSourceOperator = dragSourceInfo ? itemsRef.current.find((i) => i.id === dragSourceInfo.operatorId) : null
      const compositeMovingIds = movingIds.filter((mid) => getCompositeInfoForItemId(mid))
      const externalMovingIds = movingIds.filter((mid) => !getCompositeInfoForItemId(mid))
      const anyCompositeHasParentGroup = compositeMovingIds.some((mid) => itemsRef.current.find((i) => i.id === mid)?.parentGroupId)
      const externalGroupIds = new Set(externalMovingIds.map((mid) => itemsRef.current.find((i) => i.id === mid)?.groupId).filter(Boolean))
      const movingParentGroupId = anyCompositeHasParentGroup && externalGroupIds.size === 1 ? [...externalGroupIds][0] : null
      const movingGroupType = compositeMovingIds.length === movingIds.length ? 'standalone'
        : movingParentGroupId ? 'parentGroup' : 'multiSelect'
      console.log('[DragEndMetrics]', {
        timestamp: Date.now(),
        dragSourceId: id,
        isDraggingCompositeSource,
        movingCount: movingIds.length,
        compositeMembersInSelection: compositeMovingIds.length,
        dragDurationMs: Date.now() - (dragSession.startTime || Date.now()),
        moveCount: dragSession.moveCount || 0,
        snapWasActive: dragSession.snapWasActive,
        zoomLevel: cameraRef.current?.scale || 1,
        mousePos: { x: event.evt?.clientX, y: event.evt?.clientY },
        rawDx: event.target.x() - (dragSession.start?.x || 0),
        rawDy: event.target.y() - (dragSession.start?.y || 0),
        hasMultipleCompositeGroups: [...new Set(compositeMovingIds.map((mid) => getCompositeInfoForItemId(mid)?.groupId).filter(Boolean))].length > 1,
        sourceKind: dragSourceOperator?.kind || item?.kind || 'unknown',
        compositeMode: dragSourceOperator?.compositeMode || 'none',
        groupType: movingGroupType,
        movingExternalCount: externalMovingIds.length,
      })

      if (isDraggingCompositeSource) {
        // Hanya update regular items — composite members di-handle oleh handleGroupDragEnd
        setItems((current) => current.map((currentItem) => {
          if (!movingIds.includes(currentItem.id)) return currentItem
          if (getCompositeInfoForItemId(currentItem.id)) {
            console.log('[DragEndDebug]', { location: 'handleObjectDragEnd.isDraggingComposite.skip', memberId: currentItem.id, reason: 'handleGroupDragEnd akan handle', oldX: currentItem.x, oldY: currentItem.y })
            return currentItem
          }
          const movedNode = getInteractionNode(currentItem.id)
          if (!movedNode) return currentItem
          const clamped = getClampedCanvasPosition(currentItem.w || 1, currentItem.h || 1, { x: movedNode.x(), y: movedNode.y() }, canvasBounds)
          return { ...currentItem, ...clamped }
        }))
        // Allow handleGroupDragEnd to fire (was blocked by multiDragActiveRef=true)
        // so it can finalize composite member positions
        multiDragActiveRef.current = false
      } else {
        // Baca group deltas SEKALIGUS sebelum setItems (hindari stale read setelah reset)
        pendingGroupDeltasRef.current = {}
        const processedGroupIds = new Set()
        movingIds.forEach((movingId) => {
          const info = getCompositeInfoForItemId(movingId)
          if (info && !processedGroupIds.has(info.groupId)) {
            processedGroupIds.add(info.groupId)
            const groupNode = getInteractionNode(movingId)
            if (groupNode) {
              const delta = { x: groupNode.x(), y: groupNode.y() }
              console.log('[DRAG_END_DEBUG] STEP 1 - group delta before reset:', { groupId: info.groupId, delta, infoGroupIdType: typeof info.groupId, infoGroupId: info.groupId })
              pendingGroupDeltasRef.current[info.groupId] = delta
              // DEBUG: print all entries and their composite info before inner forEach
              const posEntries = Object.entries(dragSession.positions)
              const infoGroupId = info.groupId
              console.log('[DRAG_END_DEBUG] INNER_FOREACH_PREP:', {
                infoGroupId,
                infoGroupIdType: typeof infoGroupId,
                posEntriesCount: posEntries.length,
                posEntriesKeys: posEntries.map(([k]) => k),
                posEntries: posEntries.map(([k, v]) => ({ mid: k, pos: v })),
                memberLookups: posEntries.map(([mid]) => {
                  const mi = getCompositeInfoForItemId(mid)
                  return { mid, hasMemberInfo: !!mi, memberGroupId: mi?.groupId, memberGroupIdType: typeof mi?.groupId, groupIdMatch: mi?.groupId === infoGroupId }
                }),
              })
              // Update member Konva nodes to final relative position BEFORE Group reset
              // (same pattern as handleGroupDragEnd Step A → Step C)
              posEntries.forEach(([mid, pos]) => {
                const memberInfo = getCompositeInfoForItemId(mid)
                const cond1 = !!memberInfo
                const cond2 = memberInfo?.groupId === infoGroupId
                console.log('[DRAG_END_DEBUG] INNER_FOREACH_CHECK:', { mid, hasMemberInfo: cond1, groupIdMatch: cond2, memberGroupId: memberInfo?.groupId, targetGroupId: infoGroupId })
                if (cond1 && cond2) {
                  const memberNode = stageRef.current?.findOne(`#${mid}`)
                  console.log('[DRAG_END_DEBUG] INNER_FOREACH_NODE:', { mid, nodeFound: !!memberNode })
                  if (memberNode) {
                    memberNode.position({ x: pos.x + delta.x, y: pos.y + delta.y })
                    console.log('[DRAG_END_DEBUG] STEP 2 - member pos after fix update:', { memberId: mid, x: memberNode.x(), y: memberNode.y(), groupId: info.groupId })
                  }
                }
              })
              groupNode.position({ x: 0, y: 0 })
              console.log('[DRAG_END_DEBUG] STEP 3 - group pos after reset:', { groupId: info.groupId, x: groupNode.x(), y: groupNode.y() })
            }
          }
        })

        // DEBUG: before setItems, log pendingGroupDeltas contents and confirm itemsRef state
        const preDeltaKeys = Object.keys(pendingGroupDeltasRef.current)
        const preDeltaVal = pendingGroupDeltasRef.current['group-1783868272110']
        const preItemsHas14 = itemsRef.current.some((i) => i.id === 'image-14')
        const preItemsHas11 = itemsRef.current.some((i) => i.id === 'image-11')
        console.log('[DRAG_END_DEBUG] PRE_SETITEMS:', { preDeltaKeys, preDeltaVal, preItemsHas14, preItemsHas11 })
        setItems((current) => current.map((currentItem) => {
          const cid = currentItem.id
          if (!movingIds.includes(cid)) return currentItem

          const compositeInfo = getCompositeInfoForItemId(cid)
          const hasComp = !!compositeInfo
          if (hasComp) {
            const delta = pendingGroupDeltasRef.current[compositeInfo.groupId]
            const startPos = dragSession.positions[cid]
            const deltaCheck = `${delta?.x ?? 'undef'},${delta?.y ?? 'undef'}`
            console.log('[DRAG_END_DEBUG] SETITEMS_CHECK:', { cid, hasComp, deltaCheck, startPosStr: `${startPos?.x ?? 'undef'},${startPos?.y ?? 'undef'}`, groupId: compositeInfo.groupId, cbType: typeof delta })
            if (!delta) return currentItem
            if (!startPos) return currentItem
            const newX = startPos.x + delta.x
            const newY = startPos.y + delta.y
            // Composite members skip clamping (sama seperti handleGroupDragEnd line 2698-2702)
            // supaya tidak ada jump antara visual preview (unclamped, Group position) dan final (clamped member position)
            const newPos = { x: newX, y: newY }
            console.log('[DragEndDebug]', {
              location: 'handleObjectDragEnd.multiSelect.noCompositeSource',
              groupId: compositeInfo.groupId,
              memberId: currentItem.id,
              oldX: currentItem.x,
              oldY: currentItem.y,
              startX: startPos.x,
              startY: startPos.y,
              deltaX: delta.x,
              deltaY: delta.y,
              newX: newPos.x,
              newY: newPos.y,
              source: 'startPos + groupNodePosition(dari dragMove, no clamp)',
            })
            const r = { ...currentItem, ...newPos }
            if (currentItem.compositeMode) {
              r.compositeGroupX = undefined; r.compositeGroupY = undefined
              r.compositeGroupScaleX = undefined; r.compositeGroupScaleY = undefined
              r.compositeGroupRotation = undefined
            }
            return r
          }

          const movedNode = getInteractionNode(cid)
          if (!movedNode) return currentItem
          const clamped = getClampedCanvasPosition(currentItem.w || 1, currentItem.h || 1, { x: movedNode.x(), y: movedNode.y() }, canvasBounds)
          return { ...currentItem, ...clamped }
        }))

        // Sync itemsRef.current dengan posisi final (supaya drag berikutnya mulai dari benar)
        itemsRef.current = itemsRef.current.map((item) => {
          if (!movingIds.includes(item.id)) return item
          const compositeInfo = getCompositeInfoForItemId(item.id)
          if (compositeInfo) {
            const delta = pendingGroupDeltasRef.current[compositeInfo.groupId]
            const startPos = dragSession.positions[item.id]
            if (!delta || !startPos) return item
            const result = { ...item, x: startPos.x + delta.x, y: startPos.y + delta.y }
            if (item.compositeMode) {
              result.compositeGroupX = undefined; result.compositeGroupY = undefined
              result.compositeGroupScaleX = undefined; result.compositeGroupScaleY = undefined
              result.compositeGroupRotation = undefined
            }
            return result
          }
          const movedNode = getInteractionNode(item.id)
          if (!movedNode) return item
          const clamped = getClampedCanvasPosition(item.w || 1, item.h || 1, { x: movedNode.x(), y: movedNode.y() }, canvasBounds)
          return { ...item, ...clamped }
        })

        // Broadcast final positions to collaborators
        movingIds.forEach((movingId) => {
          const compositeInfo = getCompositeInfoForItemId(movingId)
          if (compositeInfo) {
            const delta = pendingGroupDeltasRef.current[compositeInfo.groupId]
            const startPos = dragSession.positions[movingId]
            if (delta && startPos) {
              const patch = { x: startPos.x + delta.x, y: startPos.y + delta.y }
              const it = itemsRef.current.find((i) => i.id === movingId)
              if (it?.compositeMode) Object.assign(patch, { compositeGroupX: undefined, compositeGroupY: undefined, compositeGroupScaleX: undefined, compositeGroupScaleY: undefined, compositeGroupRotation: undefined })
              broadcastItemUpdate(movingId, patch)
            }
          } else {
            const movedNode = getInteractionNode(movingId)
            if (movedNode) {
              const it = itemsRef.current.find((i) => i.id === movingId)
              if (it) {
                const clamped = getClampedCanvasPosition(it.w || 1, it.h || 1, { x: movedNode.x(), y: movedNode.y() }, canvasBounds)
                broadcastItemUpdate(movingId, clamped)
              }
            }
          }
        })
      }

      // Clear di RAF — pastikan handleGroupDragEnd (event bubble) sudah sempat cek canary
      requestAnimationFrame(() => { skipGroupDragEndRef.current = false; pendingGroupDeltasRef.current = {}; multiDragActiveRef.current = false; attachTransformer(movingIds) })
      return
    }

    multiDragActiveRef.current = false

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
      const editor = richTextEditorRef.current
      if (editor) {
        const raw = editor.getRuns()
        const runs = stripListPrefix(raw)
        const text = runsToText(runs)
        const globalBold = runs.length > 0 && runs.every((r) => r.bold)
        const globalItalic = runs.length > 0 && runs.every((r) => r.italic)
        const globalUnderline = runs.length > 0 && runs.every((r) => r.underline)
        updateItem(editingText.id, { runs, text, isBold: globalBold, isItalic: globalItalic, isUnderline: globalUnderline })
      } else {
        updateItem(editingText.id, { text: editingText.value || '' })
      }
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

  useEffect(() => {
    items.forEach((item) => {
      if (item.kind === 'image' && item.src && !item.dominantColors) {
        extractDominantColors(item.src, 5).then((colors) => {
          if (colors.length > 0) {
            updateItem(item.id, { dominantColors: colors })
          }
        })
      }
    })
  }, [items.length])

  const editTextObject = (id) => {
    const item = itemsRef.current.find((current) => current.id === id)

    if (!item || !['text', 'shape'].includes(item.kind)) return

    selectItem(id)
    if (item.kind === 'shape') {
      setEditingText({ id, value: item.shapeText || '' })
    } else {
      setEditingText({ id })
    }
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

  const renderSavedPosts = () => {
    const allAssets = savedPosts.flatMap((post) => getSavedPostAssets(post))
    return (
      <div className="workspace-asset-grid">
        {allAssets.map((asset, index) => (
          <button
            type="button"
            key={`${asset.mediaId || asset.source}-${index}`}
            title={asset.title}
            draggable
            style={{ touchAction: 'none' }}
            onClick={() => addAssetToCanvas(asset)}
            onTouchStart={(e) => {
              touchDragAssetRef.current = asset
              touchDragMovedRef.current = false
              touchDragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            }}
            onTouchMove={(e) => {
              if (!touchDragAssetRef.current) return
              e.preventDefault()
              const start = touchDragStartPosRef.current
              if (start) {
                const dx = e.touches[0].clientX - start.x
                const dy = e.touches[0].clientY - start.y
                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) touchDragMovedRef.current = true
              }
            }}
            onDragStart={(event) => beginAssetDrag(event, asset)}
            onDragEnd={() => {
              dragAssetRef.current = null
              setDropTargetFrameId(null)
              setStageCursor('default')
            }}
          >
            <span className="workspace-asset-preview">
              <img src={asset.source} alt="" crossOrigin="anonymous" />
            </span>
            <strong title={asset.title}>{asset.title}</strong>
            <small>Saved</small>
          </button>
        ))}
      </div>
    )
  }

  const confirmAssetDelete = () => {
    if (!assetDeleteTarget?.mediaId) return
    const target = assetDeleteTarget
    setAssetDeleteTarget(null)
    removeUploadedAsset(target.mediaId)
  }

const beginPan = (event) => {
  // Cancel pending wheel zoom RAF — pan should take priority
  if (wheelZoomFrameRef.current) {
    cancelAnimationFrame(wheelZoomFrameRef.current)
    wheelZoomFrameRef.current = null
  }
  wheelZoomAccumRef.current = null
  if (wheelPanFrameRef.current) {
    cancelAnimationFrame(wheelPanFrameRef.current)
    wheelPanFrameRef.current = null
  }
  wheelPanDeltaRef.current = { x: 0, y: 0 }
  if (wheelPanClampTimerRef.current) {
    window.clearTimeout(wheelPanClampTimerRef.current)
    wheelPanClampTimerRef.current = null
  }

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
      handleBrushStart(event)
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
  // Tool handlers: brush
  if (activePanel === 'brush' && isDrawingRef.current) {
    handleBrushMove(e)
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

  // RAF-coalesced mouse drag pan — accumulate latest pointer, apply 1× per frame
  if (!mousePanAccumRef.current) {
    mousePanAccumRef.current = {
      baseCamera: { ...session.camera },
      basePointer: { x: session.pointer.x, y: session.pointer.y },
      currentPointer: { x: pointer.x, y: pointer.y },
      isTouchPan: session.isTouchPan,
    }
  } else {
    mousePanAccumRef.current.currentPointer = { x: pointer.x, y: pointer.y }
  }

  if (!mousePanFrameRef.current) {
    mousePanFrameRef.current = requestAnimationFrame(() => {
      mousePanFrameRef.current = null
      const accum = mousePanAccumRef.current
      mousePanAccumRef.current = null
      if (!accum) return

      const nextCamera = {
        ...accum.baseCamera,
        x: accum.baseCamera.x + accum.currentPointer.x - accum.basePointer.x,
        y: accum.baseCamera.y + accum.currentPointer.y - accum.basePointer.y,
      }
      const clamped = accum.isTouchPan ? clampCameraToCanvas(nextCamera) : nextCamera
      cameraRef.current = clamped
      targetCameraRef.current = clamped
      setCamera(clamped)
    })
  }
}

const handleStageMouseUp = (event) => {
  if (activePanel === 'brush' && isDrawingRef.current) {
    handleBrushEnd()
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
        .filter((item) => item.visible !== false)
        .filter((item) => {
          if (item.kind === 'connector') {
            const start = resolveConnectorEndpointPoint(item, 'from', itemsRef.current)
            const end = resolveConnectorEndpointPoint(item, 'to', itemsRef.current)
            if (!start || !end) return false
            const minX = Math.min(start.x, end.x)
            const minY = Math.min(start.y, end.y)
            const maxX = Math.max(start.x, end.x)
            const maxY = Math.max(start.y, end.y)
            const pad = (item.strokeWidth || 3) + 8
            return rectsIntersect(box, {
              x: minX - pad, y: minY - pad,
              width: maxX - minX + pad * 2,
              height: maxY - minY + pad * 2,
            })
          }
          return rectsIntersect(box, { x: item.x || 0, y: item.y || 0, width: item.w || 1, height: item.h || 1 })
        })
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

  // Cancel pending mouse pan RAF so final clamp is accurate
  if (mousePanFrameRef.current) {
    cancelAnimationFrame(mousePanFrameRef.current)
    mousePanFrameRef.current = null
  }
  mousePanAccumRef.current = null

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
  setRotationSnapGuide(null)
  setItems((current) => current.map((item) => {
    if (!ids.includes(item.id)) return item
    if (item.locked) return item
    if (item.kind === 'text' || item.kind === 'image') return item
    if (item.kind === 'shape' && item.shapeType === 'freehand') return item
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

  // Handle composite group transform: accumulate compositeGroup* on operator item
  nodes.forEach((node) => {
    const nid = node.id()
    if (!nid || !nid.startsWith('composite-')) return
    const groupId = nid.slice('composite-'.length)
    if (!groupId) return
    const operatorItem = itemsRef.current.find((item) =>
      item.groupId === groupId && (item.compositeMode === 'mask' || item.compositeMode === 'exclude'))
    if (!operatorItem) return
    updateItem(operatorItem.id, {
      compositeGroupX: node.x(),
      compositeGroupY: node.y(),
      compositeGroupScaleX: node.scaleX(),
      compositeGroupScaleY: node.scaleY(),
      compositeGroupRotation: node.rotation(),
    })
  })

  requestAnimationFrame(() => {
    attachTransformer(ids)
    requestAnimationFrame(updateToolbarPosition)
    commitTransformerChangesLock = false
  })
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
    // If a mouse/touch drag or pinch is active, skip wheel pan to avoid conflict
    if (panSessionRef.current || pinchSessionRef.current || touchStartPosRef.current) return

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



  // Zoom: ctrlKey (pinch) or plain mouse wheel — RAF-coalesced
  const zoomIntensity = event.evt.ctrlKey ? 1.035 : zoomSpeed
  const factor = event.evt.deltaY < 0 ? zoomIntensity : 1 / zoomIntensity

  // Accumulate scale factor across events within the same frame
  const accum = wheelZoomAccumRef.current
  if (accum) {
    accum.scaleFactor *= factor
  } else {
    // Snap point on first event so zoom-toward-cursor anchor stays consistent
    wheelZoomAccumRef.current = { scaleFactor: factor, point: { x: pointer.x, y: pointer.y } }
  }

  // RAF apply: only 1× per frame regardless of how many wheel events arrived
  if (!wheelZoomFrameRef.current) {
    wheelZoomFrameRef.current = requestAnimationFrame(() => {
      wheelZoomFrameRef.current = null
      const session = wheelZoomAccumRef.current
      wheelZoomAccumRef.current = null
      if (!session) return

      const currentScale = cameraRef.current.scale
      const nextScale = clamp(currentScale * session.scaleFactor, minZoom, maxZoom)
      zoomCameraAtPoint(nextScale, session.point)
    })
  }
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
  if (activePanel === 'brush') {
    handleBrushStart(event)
    return
  }
  const touches = event.evt.touches
  if (touches?.length === 2) {
    // Cancel any in-flight wheel pan/zoom/pinch to prevent conflict
    if (wheelPanFrameRef.current) {
      cancelAnimationFrame(wheelPanFrameRef.current)
      wheelPanFrameRef.current = null
    }
    wheelPanDeltaRef.current = { x: 0, y: 0 }
    if (wheelPanClampTimerRef.current) {
      window.clearTimeout(wheelPanClampTimerRef.current)
      wheelPanClampTimerRef.current = null
    }
    if (wheelZoomFrameRef.current) {
      cancelAnimationFrame(wheelZoomFrameRef.current)
      wheelZoomFrameRef.current = null
    }
    wheelZoomAccumRef.current = null
    if (touchPinchFrameRef.current) {
      cancelAnimationFrame(touchPinchFrameRef.current)
      touchPinchFrameRef.current = null
    }
    touchPinchAccumRef.current = null
    panSessionRef.current = null
    touchStartPosRef.current = null
    setIsPanning(false)
    const center = getTouchCenter(touches)
    pinchSessionRef.current = {
      distance: getTouchDistance(touches),
      center,
      camera: { ...cameraRef.current },
    }
  } else if (isEmptyCanvasTarget(event.target)) {
    touchStartPosRef.current = stageRef.current?.getPointerPosition()
    // 1 finger on empty canvas: no pan — tool mode only (brush/eraser/select)
  }
}

const handleStageTouchMove = (event) => {
  if (activePanel === 'brush' && isDrawingRef.current) {
    handleBrushMove(event)
    return
  }
  const touches = event.evt.touches
  const pinchSession = pinchSessionRef.current

  if (touches?.length === 2 && pinchSession) {
    const nextDistance = getTouchDistance(touches)
    const nextCenter = getTouchCenter(touches)

    // Accumulate for RAF batching (reuse proven pattern from wheel zoom)
    touchPinchAccumRef.current = {
      startCamera: pinchSession.camera,
      startCenter: pinchSession.center,
      startDistance: pinchSession.distance,
      nextDistance,
      nextCenter,
    }

    if (!touchPinchFrameRef.current) {
      touchPinchFrameRef.current = requestAnimationFrame(() => {
        touchPinchFrameRef.current = null
        const accum = touchPinchAccumRef.current
        touchPinchAccumRef.current = null
        if (!accum) return

        const { startCamera, startCenter, startDistance, nextDistance, nextCenter } = accum

        // Atomic pan + zoom: keep the start world-point under the current midpoint
        const scaleFactor = startDistance > 0 ? nextDistance / startDistance : 1
        const nextScale = clamp(startCamera.scale * scaleFactor, minZoom, maxZoom)

        const worldPoint = {
          x: (startCenter.x - startCamera.x) / startCamera.scale,
          y: (startCenter.y - startCamera.y) / startCamera.scale,
        }

        const nextCamera = {
          scale: nextScale,
          x: nextCenter.x - worldPoint.x * nextScale,
          y: nextCenter.y - worldPoint.y * nextScale,
        }

        const clamped = clampCameraToCanvas(nextCamera)
        cameraRef.current = clamped
        targetCameraRef.current = clamped
        setCamera(clamped)
      })
    }
    return
  }

  // 1 finger: no pan — tool mode only
}

const handleStageTouchEnd = (event) => {
  if (activePanel === 'brush' && isDrawingRef.current) {
    handleBrushEnd()
    return
  }

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

  if (isColorPickerOpen && ['text', 'shape', 'image'].includes(selectedItem?.kind) && colorPickerTarget) {
    const isImageStrokeTarget = selectedItem.kind === 'image' && colorPickerTarget === 'imageStroke'
    const isShapeTextTarget = colorPickerTarget === 'shapeText'
    const isFillTarget = colorPickerTarget === 'fill'
    const supportsGradient = !isShapeTextTarget && (isImageStrokeTarget || isFillTarget || selectedItem.kind === 'text' || (selectedItem.kind === 'shape' && colorPickerTarget === 'stroke'))
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
              closeColorPicker()
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
                        if (editingText && selectedItem.kind === 'text' && richTextEditorRef.current) {
                          richTextEditorRef.current.formatColor(event.target.value)
                        } else {
                          const color = event.target.value
                          const runs = getRuns(selectedItem)
                          const newRuns = runs.map(r => ({ ...r, fill: color }))
                          updateItem(selectedItem.id, { fill: color, runs: newRuns })
                        }
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

              {dominantPaletteImages.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label className="workspace-color-picker-field">Warna dari Gambar</label>
                  {dominantPaletteImages.map((image) => (
                    <div key={image.src} className="workspace-color-palette-row">
                      <div className="workspace-color-palette-thumb">
                        <img src={image.src} alt="" draggable={false} />
                      </div>
                      {image.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="workspace-color-palette-swatch"
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
                  ))}
                </div>
              )}

              <label className="workspace-color-picker-field" style={{ marginTop: 8 }}>Solid</label>

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
                        if (editingText && selectedItem.kind === 'text' && richTextEditorRef.current) {
                          richTextEditorRef.current.formatColor(color)
                        } else {
                          const runs = getRuns(selectedItem)
                          const newRuns = runs.map(r => ({ ...r, fill: color }))
                          updateItem(selectedItem.id, { fill: color, runs: newRuns })
                        }
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
                        const val = Number(event.target.value)
                        if (isFillTarget) {
                          updateItem(selectedItem.id, { gradientAngle: val }, true)
                        } else if (isImageStrokeTarget) {
                          updateItem(selectedItem.id, { imageStrokeGradientAngle: val }, true)
                        } else {
                          updateItem(selectedItem.id, { strokeGradientAngle: val }, true)
                        }
                      }}
                      onPointerUp={(event) => {
                        const val = Number(event.target.value)
                        if (isFillTarget) {
                          broadcastItemUpdate(selectedItem.id, { gradientAngle: val })
                        } else if (isImageStrokeTarget) {
                          broadcastItemUpdate(selectedItem.id, { imageStrokeGradientAngle: val })
                        } else {
                          broadcastItemUpdate(selectedItem.id, { strokeGradientAngle: val })
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
                            updateItem(selectedItem.id, { gradientStops: sortedStops }, true)
                          } else if (isImageStrokeTarget) {
                            updateItem(selectedItem.id, { imageStrokeGradientStops: sortedStops }, true)
                          } else {
                            updateItem(selectedItem.id, { strokeGradientStops: sortedStops }, true)
                          }
                        }}
                        onPointerUp={(event) => {
                          const stops = [...currentStops]
                          stops[index] = { ...stops[index], offset: Number(event.target.value) / 100 }
                          const sortedStops = stops.sort((a, b) => a.offset - b.offset)
                          if (isFillTarget) {
                            broadcastItemUpdate(selectedItem.id, { gradientStops: sortedStops })
                          } else if (isImageStrokeTarget) {
                            broadcastItemUpdate(selectedItem.id, { imageStrokeGradientStops: sortedStops })
                          } else {
                            broadcastItemUpdate(selectedItem.id, { strokeGradientStops: sortedStops })
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

  const allCategories = ['All', 'Import', 'Favorites', 'Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace']

  if (isFontPickerOpen && ['text', 'shape'].includes(selectedItem?.kind)) {
    const allFonts = apiFonts
      ? [...availableFonts, ...apiFonts.filter((f) => !availableFonts.some((a) => a.name.toLowerCase() === f.name.toLowerCase()))]
      : availableFonts
    const fonts = [...allFonts, ...customFonts.filter((f) => {
      const fam = f.family?.toLowerCase() || f.name?.toLowerCase()
      if (!fam) return true
      return !allFonts.some((a) => (a.family?.toLowerCase() || a.name?.toLowerCase()) === fam)
    })]
    const filteredFonts = fonts.filter((font) => {
      const matchesSearch = !fontSearchQuery || font.name.toLowerCase().includes(fontSearchQuery.toLowerCase())
      const isImport = font.category === 'Import' || font.category === 'import'
      const matchesCategory = !selectedFontCategory || selectedFontCategory === 'All'
        ? true
        : selectedFontCategory === 'Import'
          ? isImport
          : selectedFontCategory === 'Favorites'
            ? favoriteFonts.includes(font.family)
            : font.category === selectedFontCategory
      return matchesSearch && matchesCategory
    })

    return (
      <div ref={fontPickerRef} className="workspace-font-picker" style={{ width: '100%', boxSizing: 'border-box' }}>
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
            {selectedFontCategory === 'Import' && (
              <button
                type="button"
                className="workspace-font-refresh-btn"
                onClick={refreshCustomFonts}
                title="Refresh font list"
              >
                <RotateCw size={13} />
              </button>
            )}
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
          {selectedFontCategory === 'Favorites' && favoriteFonts.length === 0 && (
            <div className="workspace-font-empty-state">
              <StarIcon size={28} strokeWidth={1.5} fill="rgba(255,255,255,0.08)" color="rgba(255,255,255,0.2)" />
              <span>No favorite fonts yet</span>
            </div>
          )}
          {filteredFonts.slice(0, fontDisplayCount).map((font) => {
            const isImport = font.category === 'Import'
            const isFav = favoriteFonts.includes(font.family)
            return (
              <div
                key={`${font.family}${isImport && font.id ? `-${font.id}` : ''}`}
                className={`workspace-font-item-wrapper ${isImport && isUploadingFont ? 'opacity-50' : ''}`}
              >
                <button
                  type="button"
                  disabled={loadingFont === font.family}
                  className={`workspace-font-item ${selectedItem.fontFamily === font.family ? 'active' : ''}`}
                  onClick={async () => {
                    setLoadingFont(font.family)
                    try {
                      await preloadFont(font.family)
                      if (editingText && editingTextItem?.kind === 'text' && richTextEditorRef.current) {
                        richTextEditorRef.current.formatFont(font.family)
                      } else {
                        const runs = getRuns(selectedItem)
                        const newRuns = runs.map(r => ({ ...r, fontFamily: font.family }))
                        updateItem(selectedItem.id, { fontFamily: font.family, runs: newRuns })
                      }
                    } finally {
                      setLoadingFont(null)
                    }
                  }}
                >
                  <span className="workspace-font-preview" style={{ fontFamily: font.family }}>
                    {loadingFont === font.family ? 'Loading…' : font.name}
                  </span>
                  <small>{font.category}</small>
                  <span
                    className={`workspace-font-fav-btn ${isFav ? 'is-fav' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(font.family)
                    }}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <StarIcon size={13} fill={isFav ? 'currentColor' : 'none'} strokeWidth={isFav ? 2 : 1.5} />
                  </span>
                  {isImport && (
                    <span
                      className="workspace-font-delete-btn"
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await apiDeleteFont(font.id)
                          setCustomFonts((prev) => prev.filter((f) => f.id !== font.id))
                        } catch (err) {
                          console.error('Failed to delete font:', err)
                        }
                      }}
                      title="Delete font"
                    >
                      <Trash2 size={12} />
                    </span>
                  )}
                </button>
              </div>
            )
          })}
          {fontDisplayCount < filteredFonts.length && (
            <div ref={fontSentinelRef} style={{ height: 1 }} />
          )}
        </div>
        <input ref={importFontInputRef} type="file" accept=".ttf,.otf,.woff2,.woff" style={{ display: 'none' }} onChange={handleImportFont} />
        {selectedFontCategory === 'Import' && isUploadingFont && (
          <div className="workspace-font-import-progress">
            <div className="workspace-font-import-progress-track">
              <span style={{ width: `${fontUploadProgress}%` }} />
            </div>
            <span className="workspace-font-import-progress-label">Uploading font… {fontUploadProgress}%</span>
          </div>
        )}
        {selectedFontCategory === 'Import' && (
          <button
            type="button"
            className="workspace-font-import-fab"
            onClick={() => importFontInputRef.current?.click()}
            disabled={isUploadingFont}
            title="Import Font"
          >
            {isUploadingFont ? (
              <span style={{ fontSize: 11, fontWeight: 700 }}>{fontUploadProgress}%</span>
            ) : (
              <Plus size={20} />
            )}
          </button>
        )}
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
                    const groupMembers = itemsRef.current.filter((c) => c.groupId === id || c.parentGroupId === id)
                    setItems((current) => current.map((currentItem) => (
                      currentItem.groupId === id || currentItem.parentGroupId === id
                        ? { ...currentItem, visible: nextVisible }
                        : currentItem
                    )))
                    groupMembers.forEach((m) => broadcastItemUpdate(m.id, { visible: nextVisible }))
                    return
                  }
                  const targetItem = items.find(i => i.id === id)
                  updateItem(id, { visible: targetItem.visible === false })
                }}
                onToggleLock={(id) => {
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  if (entry?.kind === 'group') {
                    const nextLocked = !entry.locked
                    const groupMembers = itemsRef.current.filter((c) => c.groupId === id || c.parentGroupId === id)
                    setItems((current) => current.map((currentItem) => (
                      currentItem.groupId === id || currentItem.parentGroupId === id
                        ? { ...currentItem, locked: nextLocked }
                        : currentItem
                    )))
                    groupMembers.forEach((m) => broadcastItemUpdate(m.id, { locked: nextLocked }))
                    return
                  }
                  const targetItem = items.find(i => i.id === id)
                  updateItem(id, { locked: !targetItem.locked })
                }}
                onDelete={(id) => {
                  const entry = layerEntries.find((candidate) => candidate.id === id)
                  if (entry?.kind === 'group') {
                    const ids = entry.members.map((member) => member.id)
                    const mediaIds = ids.map((mid) => itemsRef.current.find((i) => i.id === mid)?.mediaId).filter(Boolean)
                    setItems((current) => current.filter((item) => !ids.includes(item.id)))
                    if (mediaIds.length) {
                      setAssetContextSignals((current) => current.filter((s) => !mediaIds.includes(s.mediaId)))
                    }
                    ids.forEach((mid) => broadcastItemRemove(mid))
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

  if (activePanel === 'tools') {
    if (activeToolCard === 'removeBg') {
      return (
        <ToolRemoveBgPanel
          selectedItem={selectedItem}
          isProcessing={isRemoveBgProcessing}
          progress={removeBgProgress}
          onProcess={processRemoveBg}
          onCancel={handleCancelRemoveBg}
          onBack={() => setActiveToolCard(null)}
        />
      )
    }
    if (activeToolCard === 'meshWarp') {
      return (
        <ToolWarpPanel
          selectedItem={selectedItem}
          warpState={warpStateRef.current}
          onApplyWarp={handleApplyWarp}
          onCancelWarp={handleWarpCancel}
          onResetWarp={handleWarpReset}
          onBack={() => { setActiveToolCard(null); handleWarpCancel() }}
        />
      )
    }
    if (activeToolCard === 'relight') {
      return (
        <ToolRelightPanel
          selectedItem={selectedItem}
          relightState={selectedItem?.relight || null}
          onActivate={activateRelight}
          onUpdateLight={updateRelightLight}
          onUpdateDarken={handleUpdateDarken}
          onDeactivate={deactivateRelight}
          onApply={handleApplyRelight}
          onBack={() => { setActiveToolCard(null); deactivateRelight() }}
        />
      )
    }
    return (
      <ToolsPanel
        onSelect={setActiveToolCard}
        selectedItem={selectedItem}
      />
    )
  }

  if (isFxPanelOpen) {
    const handleBack = () => setIsFxPanelOpen(false)
    if (!selectedItem) { handleBack(); return null }
    const fxOperatorId = compositeGroupMap.get(selectedItem.id)?.operatorId
    const fxTargetItem = fxOperatorId ? items.find(i => i.id === fxOperatorId) : selectedItem
    return (
      <FxPanel
        item={fxTargetItem || selectedItem}
        onBack={handleBack}
        onUpdate={updateItem}
      />
    )
  }

  if (destFxTargetId) {
    const destItem = items.find((i) => i.id === destFxTargetId)
    const handleBack = () => setDestFxTargetId(null)
    if (destItem) {
      return (
        <FxPanel
          item={destItem}
          onBack={handleBack}
          onUpdate={updateItem}
        />
      )
    }
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
          {(canUseCompositeGroupMode || hasCompositeInSelection) && (
            <div className="workspace-section-card">
              <div className="workspace-section-title">Composite Group</div>
              <div className="workspace-canvas-align-grid-modern workspace-composite-mode-grid">
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'mask' ? 'active' : ''}`}
                  disabled={hasCompositeInSelection}
                  title={hasCompositeInSelection ? 'Nested masking belum didukung — pisahkan composite group terlebih dahulu' : 'Layer paling atas menjadi mask untuk object terpilih di bawahnya'}
                  onClick={() => applyCompositeGroupMode('mask')}
                >
                  <Box size={18} />
                  <span>Masking</span>
                </button>
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'exclude' ? 'active' : ''}`}
                  disabled={hasCompositeInSelection}
                  title={hasCompositeInSelection ? 'Nested masking belum didukung — pisahkan composite group terlebih dahulu' : 'Layer paling atas melubangi object terpilih di bawahnya'}
                  onClick={() => applyCompositeGroupMode('exclude')}
                >
                  <MinusIcon size={18} />
                  <span>Exclude</span>
                </button>
              </div>
              {hasCompositeInSelection && compositeGroupMap.get(selectedItem?.id)?.operatorId && (() => {
                const entry = compositeGroupMap.get(selectedItem?.id)
                const operatorId = entry?.operatorId
                const dests = entry ? entry.members.filter((m) => m.id !== operatorId) : []
                const singleDest = dests.length === 1 ? dests[0] : null
                return (
                  <>
                    <button
                      type="button"
                      className="workspace-adjustment-card"
                      onClick={() => { setIsFxPanelOpen(true); setDestFxTargetId(null); setShowDestPicker(false) }}
                    >
                      <span className="workspace-adjustment-card-icon"><Sparkles size={16} /></span>
                      <span>
                        <strong>Effect Library</strong>
                        <small>Chroma key, spot color, mask alpha</small>
                      </span>
                      <ChevronRight size={16} className="workspace-adjustment-card-chevron" />
                    </button>
                    <button
                      type="button"
                      className="workspace-adjustment-card"
                      onClick={() => {
                        if (singleDest) {
                          setDestFxTargetId(singleDest.id)
                        } else {
                          setShowDestPicker((v) => !v)
                        }
                      }}
                    >
                      <span className="workspace-adjustment-card-icon"><Image size={16} /></span>
                      <span>
                        <strong>Effect untuk Gambar</strong>
                        <small>Risograph, duotone, color — untuk foto</small>
                      </span>
                      <ChevronRight size={16} className="workspace-adjustment-card-chevron" />
                    </button>
                    {showDestPicker && dests.length > 1 && (
                      <div className="workspace-dest-picker">
                        {dests.map((d, i) => (
                          <button
                            key={d.id}
                            type="button"
                            className="workspace-dest-picker-item"
                            onClick={() => { setDestFxTargetId(d.id); setShowDestPicker(false) }}
                          >
                            <Image size={14} />
                            <span>Foto {i + 1}</span>
                            <small>{d.title || d.kind}</small>
                          </button>
                        ))}
                      </div>
                    )}
                    {(() => {
                      const operatorItem = items.find((i) => i.id === operatorId)
                      if (!operatorItem) return null
                      return (
                        <>
                          <div className="workspace-section-card">
                            <div className="workspace-section-title">Opacity & Blend</div>
                            <label className="workspace-typography-field workspace-typography-field-full">
                              Opacity
                              <div className="workspace-opacity-control">
                                <input
                                  type="range"
                                  min="0" max="100"
                                  value={Math.round((operatorItem.compositeOpacity ?? 1) * 100)}
                                  onChange={(event) => updateItem(operatorItem.id, { compositeOpacity: Number(event.target.value) / 100 }, true)}
                                  onPointerUp={(event) => broadcastItemUpdate(operatorItem.id, { compositeOpacity: Number(event.target.value) / 100 })}
                                  className="workspace-opacity-slider"
                                />
                                <input
                                  type="number"
                                  min="0" max="100"
                                  value={Math.round((operatorItem.compositeOpacity ?? 1) * 100)}
                                  onChange={(event) => updateItem(operatorItem.id, { compositeOpacity: Number(event.target.value) / 100 }, true)}
                                  onBlur={(event) => broadcastItemUpdate(operatorItem.id, { compositeOpacity: Number(event.target.value) / 100 })}
                                  className="workspace-opacity-input"
                                />
                                <span className="workspace-opacity-unit">%</span>
                              </div>
                            </label>
                            <label className="workspace-typography-field workspace-typography-field-full">
                              Blend Mode
                              <div style={{ position: 'relative' }}>
                                <button type="button" className="workspace-font-picker-trigger"
                                  onClick={() => setIsBlendModeOpen(!isBlendModeOpen)}>
                                  {(BLEND_MODES.find((m) => m.value === (operatorItem.compositeBlendMode || 'source-over'))?.label) || 'Normal'}
                                </button>
                                {isBlendModeOpen && (
                                  <div className="workspace-blend-mode-dropdown">
                                    {BLEND_MODES.map((mode) => (
                                      <button key={mode.value} type="button"
                                        className={`workspace-blend-mode-item ${(operatorItem.compositeBlendMode === mode.value || (!operatorItem.compositeBlendMode && mode.value === 'source-over')) ? 'active' : ''}`}
                                        onClick={() => {
                                          updateItem(operatorItem.id, { compositeBlendMode: mode.value === 'source-over' ? undefined : mode.value })
                                          setIsBlendModeOpen(false)
                                        }}>
                                        {mode.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </label>
                          </div>
                          <div className="workspace-section-card">
                            <div className="workspace-section-title">Stroke</div>
                            <label className="workspace-shadow-toggle">
                              <input type="checkbox"
                                checked={!!operatorItem.compositeStrokeEnabled && (operatorItem.compositeStrokeWidth ?? 0) > 0}
                                onChange={(event) => {
                                  if (event.target.checked) {
                                    updateItem(operatorItem.id, { compositeStrokeEnabled: true, compositeStrokeColor: operatorItem.compositeStrokeColor || '#ffffff', compositeStrokeWidth: operatorItem.compositeStrokeWidth || 3 })
                                  } else {
                                    updateItem(operatorItem.id, { compositeStrokeEnabled: false, compositeStrokeWidth: 0 })
                                  }
                                }}
                              />
                              <span className="toggle-track" />
                              <span className="toggle-label">Enable Stroke</span>
                            </label>
                            {!!operatorItem.compositeStrokeEnabled && (operatorItem.compositeStrokeWidth ?? 0) > 0 && (
                              <div className="workspace-slider-list">
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>Color</span>
                                  <input type="color" className="workspace-shadow-color"
                                    value={operatorItem.compositeStrokeColor || '#ffffff'}
                                    onChange={(e) => updateItem(operatorItem.id, { compositeStrokeColor: e.target.value }, true)}
                                    onBlur={(e) => broadcastItemUpdate(operatorItem.id, { compositeStrokeColor: e.target.value })}
                                  />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>Width</span>
                                    <span style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right' }}>
                                      {operatorItem.compositeStrokeWidth ?? 3}px
                                    </span>
                                  </div>
                                  <input type="range" min="1" max="40"
                                    value={operatorItem.compositeStrokeWidth ?? 3}
                                    onChange={(event) => updateItem(operatorItem.id, { compositeStrokeEnabled: true, compositeStrokeWidth: Number(event.target.value) }, true)}
                                    onPointerUp={(event) => broadcastItemUpdate(operatorItem.id, { compositeStrokeEnabled: true, compositeStrokeWidth: Number(event.target.value) })}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                          <div className="workspace-section-card">
                            <div className="workspace-section-title">Drop Shadow</div>
                            <label className="workspace-shadow-toggle">
                              <input type="checkbox"
                                checked={!!operatorItem.compositeShadowEnabled}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateItem(operatorItem.id, { compositeShadowEnabled: true, compositeShadow: 15, compositeShadowOpacity: 0.35, compositeShadowOffsetX: 0, compositeShadowOffsetY: 4, compositeShadowColor: '#050505' })
                                  } else {
                                    updateItem(operatorItem.id, { compositeShadowEnabled: false })
                                  }
                                }}
                              />
                              <span className="toggle-track" />
                              <span className="toggle-label">Enable Shadow</span>
                            </label>
                            {operatorItem.compositeShadowEnabled && (
                              <div className="workspace-slider-list">
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>Color</span>
                                  <input type="color" className="workspace-shadow-color"
                                    value={operatorItem.compositeShadowColor || '#050505'}
                                    onChange={(e) => updateItem(operatorItem.id, { compositeShadowColor: e.target.value }, true)}
                                    onBlur={(e) => broadcastItemUpdate(operatorItem.id, { compositeShadowColor: e.target.value })}
                                  />
                                </label>
                                {[
                                  { key: 'compositeShadow', label: 'Blur', min: 0, max: 100, value: operatorItem.compositeShadow ?? 15, unit: '' },
                                  { key: 'compositeShadowOpacity', label: 'Opacity', min: 0, max: 100, value: Math.round((operatorItem.compositeShadowOpacity ?? 0.35) * 100), unit: '%' },
                                  { key: 'compositeShadowOffsetX', label: 'Offset X', min: -50, max: 50, value: operatorItem.compositeShadowOffsetX ?? 0, unit: '' },
                                  { key: 'compositeShadowOffsetY', label: 'Offset Y', min: -50, max: 50, value: operatorItem.compositeShadowOffsetY ?? 4, unit: '' },
                                ].map((ctrl) => (
                                  <label key={ctrl.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a09ca6' }}>{ctrl.label}</span>
                                      {editingSliderKey === ctrl.key ? (
                                        <input type="number" defaultValue={ctrl.value} min={ctrl.min} max={ctrl.max} autoFocus
                                          style={{ width: '52px', fontSize: '11px', textAlign: 'right', padding: '1px 4px', border: '1px solid #7c6df2', borderRadius: '4px', background: '#1a1721', color: '#c4bfd4', outline: 'none' }}
                                          onBlur={(e) => {
                                            const val = Math.max(ctrl.min, Math.min(ctrl.max, Number(e.target.value)))
                                            updateItem(operatorItem.id, { [ctrl.key]: ctrl.key === 'compositeShadowOpacity' ? val / 100 : val })
                                            setEditingSliderKey(null)
                                          }}
                                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingSliderKey(null) }}
                                        />
                                      ) : (
                                        <span style={{ fontSize: '11px', color: '#c4bfd4', minWidth: '36px', textAlign: 'right', cursor: 'text' }}
                                          onDoubleClick={() => setEditingSliderKey(ctrl.key)}>
                                          {ctrl.value}{ctrl.unit}
                                        </span>
                                      )}
                                    </div>
                                    <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.value}
                                      onChange={(e) => {
                                        const val = Number(e.target.value)
                                        updateItem(operatorItem.id, { [ctrl.key]: ctrl.key === 'compositeShadowOpacity' ? val / 100 : val }, true)
                                      }}
                                      onPointerUp={(e) => {
                                        const val = Number(e.target.value)
                                        broadcastItemUpdate(operatorItem.id, { [ctrl.key]: ctrl.key === 'compositeShadowOpacity' ? val / 100 : val })
                                      }}
                                    />
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </>
                )
              })()}
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

          {(canUseCompositeGroupMode || hasCompositeInSelection) && (
            <div className="workspace-section-card">
              <div className="workspace-section-title">{activeSelectionCount > 1 ? 'Composite Group' : 'Masking & Exclude'}</div>
              <div className="workspace-canvas-align-grid-modern workspace-composite-mode-grid">
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'mask' ? 'active' : ''}`}
                  disabled={hasCompositeInSelection}
                  title={hasCompositeInSelection ? 'Nested masking belum didukung — pisahkan composite group terlebih dahulu' : (activeSelectionCount > 1 ? 'Layer paling atas menjadi mask untuk object terpilih di bawahnya' : 'Layer ini menjadi mask untuk layer di bawahnya')}
                  onClick={() => applyCompositeGroupMode('mask')}
                >
                  <Box size={18} />
                  <span>Masking</span>
                </button>
                <button
                  type="button"
                  className={`workspace-align-btn-modern ${activeCompositeMode === 'exclude' ? 'active' : ''}`}
                  disabled={hasCompositeInSelection}
                  title={hasCompositeInSelection ? 'Nested masking belum didukung — pisahkan composite group terlebih dahulu' : (activeSelectionCount > 1 ? 'Layer paling atas melubangi object terpilih di bawahnya' : 'Layer ini melubangi layer di bawahnya')}
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
    const supportsShadow = ['image', 'text', 'shape', 'frame'].includes(selectedItem.kind) && !selectedItem.isAdjustmentLayer

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
                onChange={(event) => {
                  const patch = { [field]: Number(event.target.value) }
                  updateItem(selectedItem.id, patch)
                  broadcastItemUpdate(selectedItem.id, patch)
                }}
              />
            </label>
          ))}
          {selectedItem.kind === 'shape' && (selectedItem.shapeType === 'bezier-path' || selectedItem.shapeType === 'freehand')
            ? null
          : selectedItem.kind === 'image' ? (
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
                    let patch
                    if (selectedItem.lockAspectRatio && selectedItem.h > 0) {
                      const ratio = selectedItem.w / selectedItem.h
                      patch = { w: newW, h: Math.round(newW / ratio) }
                      updateItem(selectedItem.id, patch)
                    } else {
                      patch = { w: newW }
                      updateItem(selectedItem.id, patch)
                    }
                    broadcastItemUpdate(selectedItem.id, patch)
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
                    let patch
                    if (selectedItem.lockAspectRatio && selectedItem.w > 0) {
                      const ratio = selectedItem.w / selectedItem.h
                      patch = { h: newH, w: Math.round(newH * ratio) }
                      updateItem(selectedItem.id, patch)
                    } else {
                      patch = { h: newH }
                      updateItem(selectedItem.id, patch)
                    }
                    broadcastItemUpdate(selectedItem.id, patch)
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
                  onChange={(event) => {
                    const patch = { [field]: Number(event.target.value) }
                    updateItem(selectedItem.id, patch)
                    broadcastItemUpdate(selectedItem.id, patch)
                  }}
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
                onChange={(event) => {
                  const patch = { [field]: Number(event.target.value) }
                  updateItem(selectedItem.id, patch)
                  broadcastItemUpdate(selectedItem.id, patch)
                }}
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
              {ADJUSTMENT_PRESETS.map((preset) => (
                <button key={preset.label} type="button" onClick={() => updateItem(selectedItem.id, preset.values)}>
                  {preset.label}
                </button>
              ))}
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
        onChange={(event) => updateItem(selectedItem.id, { [control.key]: Number(event.target.value) }, true)}
        onPointerUp={(event) => updateItem(selectedItem.id, { [control.key]: Number(event.target.value) })}
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
                onChange={(event) => updateItem(selectedItem.id, { radius: Number(event.target.value) }, true)}
                onPointerUp={(event) => broadcastItemUpdate(selectedItem.id, { radius: Number(event.target.value) })}
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
                      openColorPicker('imageStroke')
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
                    }, true)}
                    onPointerUp={(event) => broadcastItemUpdate(selectedItem.id, {
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
        {selectedItem.kind === 'image' && (
          <div className="workspace-section-card">
            <div className="workspace-section-title">Opacity & Blend</div>
            <label className="workspace-typography-field workspace-typography-field-full">
              Opacity
              <div className="workspace-opacity-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((selectedItem.opacity ?? 1) * 100)}
                  onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 }, true)}
                  onPointerUp={(event) => broadcastItemUpdate(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
                  className="workspace-opacity-slider"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((selectedItem.opacity ?? 1) * 100)}
                  onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 }, true)}
                  onBlur={(event) => broadcastItemUpdate(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
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
                    onChange={(e) => updateItem(selectedItem.id, { shadowColor: e.target.value }, true)}
                    onBlur={(e) => broadcastItemUpdate(selectedItem.id, { shadowColor: e.target.value })}
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
                        updateItem(selectedItem.id, { [ctrl.key]: ctrl.key === 'shadowOpacity' ? val / 100 : val }, true)
                      }}
                      onPointerUp={(e) => {
                        const val = Number(e.target.value)
                        broadcastItemUpdate(selectedItem.id, { [ctrl.key]: ctrl.key === 'shadowOpacity' ? val / 100 : val })
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
                  saturation: 0, sharpen: 0, vignette: 0, blur: 0, hue: 0,
                  effects: getDefaultEffects(),
                  _preAdjustmentState: {
                    fill: selectedItem.fill,
                    stroke: selectedItem.stroke,
                    strokeWidth: selectedItem.strokeWidth,
                    effects: selectedItem.effects,
                  },
                })
              } else {
                const saved = selectedItem._preAdjustmentState || {}
                updateItem(selectedItem.id, {
                  isAdjustmentLayer: false,
                  effects: saved.effects ?? getDefaultEffects(),
                  exposure: 0, temperature: 0, highlights: 0, shadows: 0,
                  whites: 0, blacks: 0, brightness: 0, contrast: 0,
                  saturation: 0, sharpen: 0, vignette: 0, blur: 0, hue: 0,
                  fill: saved.fill ?? null,
                  stroke: saved.stroke ?? null,
                  strokeWidth: saved.strokeWidth ?? 0,
                  _preAdjustmentState: null,
                })
              }
            }}
          />
          <span className="toggle-track" />
          <span className="toggle-label">Jadikan Adjustment Layer</span>
        </label>

        {isShapeAdjustmentLayer ? (
          <AdjustmentSliders item={selectedItem} onChange={(id, patch) => updateItem(id, patch, true)} onCommit={(id, patch) => broadcastItemUpdate(id, patch)} onOpacityChange={(id, val) => updateItem(id, { opacity: val }, true)} onOpacityCommit={(id, val) => broadcastItemUpdate(id, { opacity: val })} />
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
                    openColorPicker('fill')
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
                      openColorPicker('stroke')
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
                  onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 }, true)}
                  onPointerUp={(event) => broadcastItemUpdate(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
                  className="workspace-opacity-slider"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((selectedItem.opacity ?? 1) * 100)}
                  onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 }, true)}
                  onBlur={(event) => broadcastItemUpdate(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
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
                  className="workspace-o-dropdown-btn"
                  style={{ minWidth: 140 }}
                  onClick={() => setIsBlendModeOpen((current) => !current)}
                >
                  {BLEND_MODES.find((m) => m.value === (selectedItem.blendMode || 'source-over'))?.label || 'Normal'}
                  <ChevronDown size={12} />
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
              {(function() {
                const runs = getRuns(selectedItem)
                const families = [...new Set(runs.map(r => r.fontFamily).filter(Boolean))]
                const fam = families.length === 1 ? families[0] : (families.length > 1 ? 'Mixed' : selectedItem.fontFamily)
                if (fam === 'Mixed') return 'Mixed'
                return (apiFonts || []).find((f) => f.family === fam)?.name || availableFonts.find((f) => f.family === fam)?.name || customFonts.find((f) => (f.family || f.name) === fam)?.name || fam || 'Inter'
              })()}
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
                openColorPicker('shapeText')
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

        {selectedItem.kind === 'text' && (
          <>
            <label className="workspace-text-editor">
              Text
              <textarea
                ref={textEditorRef}
                value={selectedItem.text}
                onChange={(event) => {
                  const val = event.target.value
                  const runs = getRuns(selectedItem)
                  if (runs.length === 1) {
                    runs[0].text = val
                    updateItem(selectedItem.id, { text: val, runs })
                  } else {
                    const merged = runs.length > 0 ? { ...runs[0], text: val } : { text: val, bold: selectedItem.isBold || false, italic: selectedItem.isItalic || false, underline: selectedItem.isUnderline || false }
                    updateItem(selectedItem.id, { text: val, runs: [merged] })
                  }
                }}
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
                  {(function() {
                    const runs = getRuns(selectedItem)
                    const families = [...new Set(runs.map(r => r.fontFamily).filter(Boolean))]
                    const fam = families.length === 1 ? families[0] : (families.length > 1 ? 'Mixed' : selectedItem.fontFamily)
                    if (fam === 'Mixed') return 'Mixed'
                    return (apiFonts || []).find((f) => f.family === fam)?.name || availableFonts.find((f) => f.family === fam)?.name || customFonts.find((f) => (f.family || f.name) === fam)?.name || fam || 'Inter'
                  })()}
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
                      openColorPicker('fill')
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
                      openColorPicker('stroke')
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
                    onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 }, true)}
                    onPointerUp={(event) => broadcastItemUpdate(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
                    className="workspace-opacity-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round((selectedItem.opacity ?? 1) * 100)}
                    onChange={(event) => updateItem(selectedItem.id, { opacity: Number(event.target.value) / 100 }, true)}
                    onBlur={(event) => broadcastItemUpdate(selectedItem.id, { opacity: Number(event.target.value) / 100 })}
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
                  onClick={() => {
                    if (editingText && richTextEditorRef.current) {
                      undoStackRef.current = [...undoStackRef.current.slice(-50), JSON.parse(JSON.stringify(itemsRef.current))]
                      redoStackRef.current = []
                      richTextEditorRef.current.formatBold()
                    } else {
                      const runs = getRuns(selectedItem)
                      const newRuns = runs.map(r => ({ ...r, bold: !selectedItem.isBold }))
                      updateItem(selectedItem.id, { isBold: !selectedItem.isBold, runs: newRuns })
                    }
                  }}
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.isItalic ? 'active' : ''}`}
                  onClick={() => {
                    if (editingText && richTextEditorRef.current) {
                      undoStackRef.current = [...undoStackRef.current.slice(-50), JSON.parse(JSON.stringify(itemsRef.current))]
                      redoStackRef.current = []
                      richTextEditorRef.current.formatItalic()
                    } else {
                      const runs = getRuns(selectedItem)
                      const newRuns = runs.map(r => ({ ...r, italic: !selectedItem.isItalic }))
                      updateItem(selectedItem.id, { isItalic: !selectedItem.isItalic, runs: newRuns })
                    }
                  }}
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.isUnderline ? 'active' : ''}`}
                  onClick={() => {
                    if (editingText && richTextEditorRef.current) {
                      undoStackRef.current = [...undoStackRef.current.slice(-50), JSON.parse(JSON.stringify(itemsRef.current))]
                      redoStackRef.current = []
                      richTextEditorRef.current.formatUnderline()
                    } else {
                      const runs = getRuns(selectedItem)
                      const newRuns = runs.map(r => ({ ...r, underline: !selectedItem.isUnderline }))
                      updateItem(selectedItem.id, { isUnderline: !selectedItem.isUnderline, runs: newRuns })
                    }
                  }}
                  title="Underline"
                >
                  <Underline size={16} />
                </button>
              </div>

              <div className="workspace-style-toolbar">
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'left' ? 'active' : ''}`}
                  onClick={() => {
                    if (editingText) {
                      richTextEditorRef.current?.formatAlign('left')
                    } else {
                      updateItem(selectedItem.id, { align: 'left' })
                    }
                  }}
                  title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'center' ? 'active' : ''}`}
                  onClick={() => {
                    if (editingText) {
                      richTextEditorRef.current?.formatAlign('center')
                    } else {
                      updateItem(selectedItem.id, { align: 'center' })
                    }
                  }}
                  title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'right' ? 'active' : ''}`}
                  onClick={() => {
                    if (editingText) {
                      richTextEditorRef.current?.formatAlign('right')
                    } else {
                      updateItem(selectedItem.id, { align: 'right' })
                    }
                  }}
                  title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  type="button"
                  className={`workspace-style-btn ${selectedItem.align === 'justify' ? 'active' : ''}`}
                  onClick={() => {
                    if (editingText) {
                      richTextEditorRef.current?.formatAlign('justify')
                    } else {
                      updateItem(selectedItem.id, { align: 'justify' })
                    }
                  }}
                  title="Justify"
                >
                  <AlignJustify size={16} />
                </button>
              </div>
            </div>
            <div className="workspace-style-toolbar" style={{ marginTop: '8px' }}>
              <button
                type="button"
                className={`workspace-style-btn ${selectedItem.runs?.some(r => r.listType === 'bullet') ? 'active' : ''}`}
                onClick={() => {
                  if (editingText) {
                    richTextEditorRef.current?.toggleListType('bullet')
                  } else {
                    const runs = getRuns(selectedItem)
                    const hasType = runs.some(r => r.listType === 'bullet')
                    const newRuns = runs.map(r => ({ ...r, listType: hasType ? null : 'bullet' }))
                    updateItem(selectedItem.id, { runs: newRuns, text: runsToText(newRuns) })
                  }
                }}
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className={`workspace-style-btn ${selectedItem.runs?.some(r => r.listType === 'numbered') ? 'active' : ''}`}
                onClick={() => {
                  if (editingText) {
                    richTextEditorRef.current?.toggleListType('numbered')
                  } else {
                    const runs = getRuns(selectedItem)
                    const hasType = runs.some(r => r.listType === 'numbered')
                    const newRuns = runs.map(r => ({ ...r, listType: hasType ? null : 'numbered' }))
                    updateItem(selectedItem.id, { runs: newRuns, text: runsToText(newRuns) })
                  }
                }}
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>
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
          <button type="button" className={assetTab === 'saved' ? 'active' : ''} onClick={() => { setAssetTab('saved'); setSelectedBoardId(null); setSelectedBoardItem(null) }}>Saved</button>
        </div>

        {assetTab === 'boards' && !selectedBoardId && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <div className="workspace-elements-title">Boards</div>
              {isAuthenticated && <button type="button" className="workspace-refresh-button" onClick={refreshDatabaseBoards} disabled={isBoardsLoading} aria-label="Refresh boards"><RotateCw size={15} /></button>}
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

        {assetTab === 'saved' && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <div className="workspace-elements-title">Saved</div>
              {isAuthenticated && <button type="button" className="workspace-refresh-button" onClick={refreshSavedPosts} disabled={isSavedPostsLoading} aria-label="Refresh saved posts"><RotateCw size={15} /></button>}
            </div>
            {!isAuthenticated && <div className="workspace-upload-hint">Login untuk melihat post tersimpan.</div>}
            {savedPostsError && <div className="workspace-upload-error"><span>{savedPostsError}</span></div>}
            {isSavedPostsLoading ? <div className="workspace-upload-empty">Memuat saved posts...</div> : savedPosts.length ? renderSavedPosts() : <div className="workspace-upload-empty">Belum ada saved post.</div>}
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
                <button type="button" className="workspace-refresh-button" onClick={refreshUploads} disabled={isUploadsLoading || isUploading || deletingMediaIds.size > 0} aria-label="Refresh uploads">
                  <RotateCw size={15} />
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
          </div>
        )}

        {assetTab === 'assets' && assetSubView === 'browse' && (
          <div className="workspace-asset-subview">
            <div className="workspace-elements-header">
              <button type="button" className="workspace-back-button" onClick={() => setAssetSubView(null)}><ArrowLeft size={16} /></button>
              <div className="workspace-elements-title">Browse Asset</div>
              <button type="button" className="workspace-refresh-button" onClick={() => { setIsBrowseRefreshing(true); setMixedBrowseAssets([]); lastMixedKeysRef.current = new Set(); setBrowsePageInfo({ internalNextOffset: null, internalNextCursor: null, externalNextCursor: null }); setBrowseRefreshKey((k) => k + 1); setBrowseShuffleSeed((s) => s + 1) }} disabled={isPublicBrowseLoading} aria-label="Refresh browse">
                <RotateCw size={15} className={isBrowseRefreshing ? 'spin' : ''} />
              </button>
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
            {renderAssetGrid(mixedBrowseAssets)}
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
                                  borderRadius: frame.defaultProps.cornerRadius ? '6px' : '2px',
                                  background: 'rgba(167, 139, 250, 0.08)',
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
                                  background: 'rgba(167, 139, 250, 0.08)',
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
                                  background: 'rgba(167, 139, 250, 0.08)',
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
                                  background: 'rgba(167, 139, 250, 0.08)',
                                  borderBottom: '10px solid rgba(167, 139, 250, 0.35)',
                                  position: 'relative',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-10px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '14px',
                                  height: '6px',
                                  borderRadius: '2px',
                                  background: 'rgba(167, 139, 250, 0.5)',
                                }} />
                              </div>
                            )}
                            {/* Film frames */}
                            {frame.frameType.startsWith('film') && (
                              <div
                                style={{
                                  width: frame.frameType === 'film-horizontal' ? '50px' : '35px',
                                  height: frame.frameType === 'film-horizontal' ? '30px' : '50px',
                                  border: '2px solid #a78bfa',
                                  background: 'rgba(167, 139, 250, 0.1)',
                                  position: 'relative',
                                  borderRadius: '2px',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  inset: '5px',
                                  border: '1px solid rgba(167, 139, 250, 0.4)',
                                  borderRadius: '1px',
                                }} />
                                {/* Sprocket holes */}
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <div key={i} style={{
                                    position: 'absolute',
                                    [frame.frameType === 'film-horizontal' ? 'top' : 'left']: '-1px',
                                    [frame.frameType === 'film-horizontal' ? 'left' : 'top']: `${6 + i * (frame.frameType === 'film-horizontal' ? 11 : 11)}px`,
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(167, 139, 250, 0.5)',
                                    background: 'rgba(167, 139, 250, 0.15)',
                                  }} />
                                ))}
                              </div>
                            )}
                            {frame.frameType === 'cinema' && (
                              <div
                                style={{
                                  width: '50px',
                                  height: '30px',
                                  background: 'rgba(167, 139, 250, 0.3)',
                                  position: 'relative',
                                  borderRadius: '2px',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  inset: '5px 4px',
                                  background: 'rgba(18, 18, 20, 0.9)',
                                  borderRadius: '1px',
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
                                  background: 'rgba(167, 139, 250, 0.08)',
                                  display: 'grid',
                                  gridTemplateColumns: frame.frameType === 'grid-3' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                                  gap: '2px',
                                  padding: '2px',
                                  borderRadius: '2px',
                                }}
                              >
                                {Array.from({ length: frame.frameType === 'grid-3' ? 3 : frame.frameType === 'grid-collage' ? 4 : 2 }).map((_, i) => (
                                  <div key={i} style={{
                                    border: '1px solid rgba(167, 139, 250, 0.4)',
                                    borderRadius: '1px',
                                    background: 'rgba(167, 139, 250, 0.05)',
                                  }} />
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
                                  borderRadius: frame.frameType === 'blob' ? '40% 60% 70% 30% / 40% 50% 60% 50%' :
                                    frame.frameType === 'wave' ? '50% 50% 30% 70% / 40% 30% 70% 60%' :
                                    '60% 40% 30% 70% / 50% 60% 40% 50%',
                                  background: 'rgba(167, 139, 250, 0.08)',
                                }}
                              />
                            )}
                            {/* Device frames */}
                            {frame.frameType === 'phone' && (
                              <div
                                style={{
                                  width: '24px',
                                  height: '48px',
                                  border: '3px solid #a78bfa',
                                  borderRadius: '6px',
                                  background: 'rgba(167, 139, 250, 0.05)',
                                  position: 'relative',
                                  boxShadow: '0 2px 8px rgba(167, 139, 250, 0.15)',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '10px',
                                  height: '3px',
                                  background: 'rgba(167, 139, 250, 0.5)',
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
                                  borderRadius: '5px',
                                  background: 'rgba(167, 139, 250, 0.05)',
                                  boxShadow: '0 2px 8px rgba(167, 139, 250, 0.15)',
                                }}
                              />
                            )}
                            {frame.frameType === 'browser' && (
                              <div
                                style={{
                                  width: '50px',
                                  height: '38px',
                                  border: '2px solid #a78bfa',
                                  borderRadius: '4px',
                                  background: 'rgba(167, 139, 250, 0.05)',
                                  position: 'relative',
                                  overflow: 'hidden',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '0',
                                  left: '0',
                                  right: '0',
                                  height: '8px',
                                  background: 'rgba(167, 139, 250, 0.25)',
                                }} />
                                {/* Dots */}
                                <div style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '4px',
                                  display: 'flex',
                                  gap: '2px',
                                }}>
                                  {['#ff6b6b', '#ffd93d', '#6bcb77'].map((c, i) => (
                                    <div key={i} style={{
                                      width: '3px',
                                      height: '3px',
                                      borderRadius: '50%',
                                      background: c,
                                      opacity: 0.6,
                                    }} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {frame.frameType === 'desktop' && (
                              <div
                                style={{
                                  width: '50px',
                                  height: '35px',
                                  border: '3px solid #a78bfa',
                                  borderRadius: '3px',
                                  background: 'rgba(167, 139, 250, 0.05)',
                                  position: 'relative',
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-8px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '22px',
                                  height: '5px',
                                  background: '#a78bfa',
                                  borderRadius: '0 0 3px 3px',
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
                          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {connector.id === 'straight' && (
                              <line x1="4" y1="18" x2="32" y2="18" stroke="#7c6df2" strokeWidth="2.5" strokeLinecap="round" />
                            )}
                            {connector.id === 'straight-arrow' && (
                              <>
                                <line x1="4" y1="18" x2="24" y2="18" stroke="#7c6df2" strokeWidth="2.5" strokeLinecap="round" />
                                <polygon points="24,12 32,18 24,24" fill="#7c6df2" />
                              </>
                            )}
                            {connector.id === 'elbow' && (
                              <polyline points="6,8 20,8 20,28" stroke="#7c6df2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                            {connector.id === 'elbow-arrow' && (
                              <>
                                <polyline points="6,8 20,8 20,24" stroke="#7c6df2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <polygon points="14,24 20,32 26,24" fill="#7c6df2" />
                              </>
                            )}
                            {connector.id === 'curve' && (
                              <path d="M4,24 C12,6 24,6 32,24" stroke="#7c6df2" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            )}
                            {connector.id === 'curve-arrow' && (
                              <>
                                <path d="M4,24 C12,6 24,6 28,18" stroke="#7c6df2" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                <polygon points="26,12 34,16 30,22" fill="#7c6df2" />
                              </>
                            )}
                          </svg>
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
            <div className="workspace-section-title">Project Name</div>
            <label className="workspace-typography-field workspace-typography-field-full">
              <input type="text" value={workspaceTitle} onChange={(event) => setWorkspaceTitle(event.target.value)} onBlur={(event) => broadcastWorkspaceUpdate({ workspaceTitle: event.target.value })} />
            </label>
          </div>
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
                <input type="color" value={canvasSettings.background.color}
                  onChange={(event) => updateCanvasBackground({ color: event.target.value }, true)}
                  onBlur={(event) => updateCanvasBackground({ color: event.target.value })} />
              </label>
            )}
            {canvasSettings.background.type === 'gradient' && (
              <div className="workspace-typography-grid">
                <label className="workspace-typography-field">
                  From
                  <input type="color" value={canvasSettings.background.from}
                    onChange={(event) => updateCanvasBackground({ from: event.target.value }, true)}
                    onBlur={(event) => updateCanvasBackground({ from: event.target.value })} />
                </label>
                <label className="workspace-typography-field">
                  To
                  <input type="color" value={canvasSettings.background.to}
                    onChange={(event) => updateCanvasBackground({ to: event.target.value }, true)}
                    onBlur={(event) => updateCanvasBackground({ to: event.target.value })} />
                </label>
                <label className="workspace-typography-field workspace-typography-field-full">
                  Angle
                  <input type="range" min="0" max="360" value={canvasSettings.background.angle}
                    onChange={(event) => updateCanvasBackground({ angle: Number(event.target.value) }, true)}
                    onBlur={(event) => updateCanvasBackground({ angle: Number(event.target.value) })} />
                </label>
              </div>
            )}
          </div>

          <div className="workspace-section-card">
            <div className="workspace-section-title">Grid</div>
            <label className="workspace-toggle-row">
              <input type="checkbox" checked={canvasSettings.showGrid} onChange={(event) => {
                const next = event.target.checked
                setCanvasSettings((current) => ({ ...current, showGrid: next }))
                broadcastWorkspaceUpdate({ canvasSettings: { showGrid: next } })
              }} />
              <span className="toggle-track" />
              Show Grid
            </label>
            <label className="workspace-toggle-row">
              <input type="checkbox" checked={canvasSettings.snapToGrid} onChange={(event) => {
                const next = event.target.checked
                setCanvasSettings((current) => ({ ...current, snapToGrid: next }))
                broadcastWorkspaceUpdate({ canvasSettings: { snapToGrid: next } })
              }} />
              <span className="toggle-track" />
              Snap to Grid
            </label>
            <div className="workspace-typography-grid">
              <label className="workspace-typography-field">
                Vertical
                <input type="number" min="0" max="64" value={canvasSettings.gridVertical} onChange={(event) => setCanvasSettings((current) => ({ ...current, gridVertical: Number(event.target.value) }))} onBlur={(event) => broadcastWorkspaceUpdate({ canvasSettings: { gridVertical: Number(event.target.value) } })} />
              </label>
              <label className="workspace-typography-field">
                Horizontal
                <input type="number" min="0" max="64" value={canvasSettings.gridHorizontal} onChange={(event) => setCanvasSettings((current) => ({ ...current, gridHorizontal: Number(event.target.value) }))} onBlur={(event) => broadcastWorkspaceUpdate({ canvasSettings: { gridHorizontal: Number(event.target.value) } })} />
              </label>
            </div>
          </div>

          <div className="workspace-section-card">
            <label className="workspace-toggle-row">
              <input type="checkbox" checked={canvasSettings.autosave} onChange={(event) => {
                if (collaboratorsGuardRef.current.length > 1) {
                  toastRef.current?.('Tidak bisa mengubah pengaturan auto-save saat ada collaborator lain yang aktif.', { type: 'error', duration: 4000 })
                  return
                }
                setCanvasSettings((current) => ({ ...current, autosave: event.target.checked }))
              }} />
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
            setStageCursor={setStageCursor}
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
            fontInjectVersion={fontInjectVersion}
            onSyncTransformer={() => {
              transformerRef.current?.forceUpdate?.()
              transformerRef.current?.getLayer()?.batchDraw()
              requestAnimationFrame(updateToolbarPosition)
            }}
            getItemsVisualBounds={getItemsVisualBounds}
            getCompositeSnapBounds={getCompositeSnapBounds}
            getSnappedDelta={getSnappedDelta}
            setAlignmentGuides={setAlignmentGuides}
            setRotationSnapGuide={setRotationSnapGuide}
            skipGroupDragEndRef={skipGroupDragEndRef}
            selectedIdsRef={selectedIdsRef}
            itemsRef={itemsRef}
            multiDragRef={multiDragRef}
            multiDragActiveRef={multiDragActiveRef}
            stageRef={stageRef}
            getInteractionNode={getInteractionNode}
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
          fontInjectVersion={fontInjectVersion}
        />
      )
    })
  }

  // Memoize rendered output to skip re-computation when only camera changes.
  // During panning/zoom, setCamera() triggers a full re-render of Workspace, but
  // item data (belowItems/aboveItems/selectedId/etc.) is stable — the memoized
  // output prevents ~50+ CanvasItem re-renders per frame.
  const renderedBelowCanvasContent = useMemo(() =>
    renderCanvasStackItems(belowItems),
    [belowItems, compositeGroupMap, items, selectedId, selectedIds,
      handleObjectSelect, updateItem, handleObjectDragStart, handleObjectDragMove,
      handleObjectDragEnd, editTextObject, editingText, handleItemCursor,
      setHoveredItemId, isSpaceDown, isPanning, activePanel, isShiftDown,
      dropTargetFrameId, dropTargetSlotIndex, editingFrameId, editingFrameSlot,
      handleFrameImageEdit, beginImageCrop, cropSession, canvasSize, fontInjectVersion,
      updateToolbarPosition, transformerRef],
  )
  const renderedAboveCanvasContent = useMemo(() =>
    renderCanvasStackItems(aboveItems),
    [aboveItems, compositeGroupMap, items, selectedId, selectedIds,
      handleObjectSelect, updateItem, handleObjectDragStart, handleObjectDragMove,
      handleObjectDragEnd, editTextObject, editingText, handleItemCursor,
      setHoveredItemId, isSpaceDown, isPanning, activePanel, isShiftDown,
      dropTargetFrameId, dropTargetSlotIndex, editingFrameId, editingFrameSlot,
      handleFrameImageEdit, beginImageCrop, cropSession, canvasSize, fontInjectVersion,
      updateToolbarPosition, transformerRef],
  )
  const renderedAdjustmentLayerItems = useMemo(() =>
    [...items].reverse().filter((item) => item.isAdjustmentLayer).map((item) => (
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
    )),
    [items, selectedId, selectedIds, handleObjectSelect, updateItem,
      handleObjectDragStart, handleObjectDragMove, handleObjectDragEnd,
      editTextObject, editingText, handleItemCursor, setHoveredItemId,
      isSpaceDown, isPanning, activePanel, isShiftDown, transformerRef,
      dropTargetFrameId, dropTargetSlotIndex, editingFrameId, editingFrameSlot,
      handleFrameImageEdit, beginImageCrop, cropSession],
  )

  if (isWorkspaceLoading || (shouldLoadWorkspace && isAuthLoading) || (shouldLoadWorkspace && loadingPhase !== 'done')) {
    const phaseInfo = isWorkspaceLoading
      ? { num: '1/3', text: 'Memuat workspace' }
      : loadingPhase === 'analyzing'
        ? { num: '2/3', text: 'Menyiapkan alat AI' }
        : { num: '3/3', text: 'Menyiapkan canvas' }
    return (
      <section className="workspace-page workspace-loading-state">
        <div className="workspace-loading-card"><span className="loading-phase-num">({phaseInfo.num})</span> {phaseInfo.text}<span className="loading-dots" /></div>
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
    <ToastProvider>
    <ToastRefCapture toastRef={toastRef} />
    <CollaborationProvider workspaceId={workspaceId} user={user} itemUpdateHandlerRef={itemUpdateHandlerRef} itemAddHandlerRef={itemAddHandlerRef} itemRemoveHandlerRef={itemRemoveHandlerRef} reorderHandlerRef={reorderHandlerRef} workspaceUpdateHandlerRef={workspaceUpdateHandlerRef} collaboratorsGuardRef={collaboratorsGuardRef} bezierStateHandlerRef={bezierStateHandlerRef}>
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
            if (id !== 'tools') {
              setSelectedId(null)
              setSelectedIds([])
              attachTransformer(null)
            }
            if (id === 'tools') {
              setActiveToolCard(null)
              handleWarpCancel()
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
            if (!isCanvasTool || id !== 'tools') {
              setSelectedId(null)
              setSelectedIds([])
              attachTransformer(null)
            }
            if (id === 'tools') {
              setActiveToolCard(null)
              handleWarpCancel()
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
      <CollaborationPresence workspaceOwnerId={workspaceOwnerId} />
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
      <button type="button" className="workspace-share" onClick={() => setIsShareModalOpen(true)}><Share2 size={15} /><span>Share</span></button>
      {false && <button type="button" className="workspace-publish" onClick={handlePublishWorkspace}><Upload size={15} /><span>Publish</span></button>}
      <button
        type="button"
        className="workspace-export"
        onClick={() => {
          if (editingText) finishTextEditing()
          setExportError('')
          setIsExportModalOpen(true)
        }}
      >
        <ArrowDownToLine size={15} /><span>Export</span>
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
                  if (remoteBezierEditRef.current?.itemId === id) {
                    toastRef.current?.('Path ini sedang diedit oleh pengguna lain.', { type: 'error', duration: 4000 })
                    return
                  }
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
                  if (remoteBezierEditRef.current?.itemId === id) {
                    toastRef.current?.('Path ini sedang diedit oleh pengguna lain.', { type: 'error', duration: 4000 })
                    return
                  }
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
          <Layer ref={layerRef}>
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
                <Line key={`workspace-grid-${index}`} points={points} stroke="#d8d2c7" strokeWidth={1.5} opacity={0.44} listening={false} />
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
                  {renderedBelowCanvasContent}
                </Group>
              </Group>

              <Group
                name="canvas-content-above"
                clipX={0}
                clipY={0}
                clipWidth={canvasSize.width}
                clipHeight={canvasSize.height}
              >
                {renderedAdjustmentLayerItems}
                <GlobalAdjustmentLayer
                  stageRef={stageRef}
                  items={items}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                />
                {renderedAboveCanvasContent}
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
                    strokeWidth={4}
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
                {rotationSnapGuide && (
                  <Line
                    points={[rotationSnapGuide.p1x, rotationSnapGuide.p1y, rotationSnapGuide.p2x, rotationSnapGuide.p2y]}
                    stroke="#ff4fd8"
                    strokeWidth={1.5}
                    opacity={0.7}
                    dash={[8, 6]}
                    listening={false}
                  />
                )}
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
                {/* Remote bezier drawing previews */}
                {Object.entries(remoteBezierDraws).map(([userId, draw]) => {
                  const color = getCursorColor(userId)
                  const d = draw.anchors.map((a, i) => `${i === 0 ? 'M' : 'L'} ${a.x},${a.y}`).join(' ') + ' Z'
                  return (
                    <>
                      <Path data={d} stroke={color.bg} strokeWidth={2} fill={color.bg + '30'} dash={[6, 4]} listening={false} />
                      {draw.anchors.map((a, i) => (
                        <Circle key={i} x={a.x} y={a.y} radius={4} fill={color.bg} stroke="#fff" strokeWidth={1} listening={false} />
                      ))}
                    </>
                  )
                })}
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
                  const editingBezierItem = items.find((i) => i.id === editingBezierId)
                  if (!editingBezierItem) return null
                  const anchors = bezierEditAnchors
                  const previewPathStr = anchors.length >= 2
                    ? anchors.map((a, i) => `${i === 0 ? 'M' : 'L'} ${a.x},${a.y}`).join(' ') + ' Z'
                    : ''
                  return (
                    <Group x={editingBezierItem.x} y={editingBezierItem.y} rotation={editingBezierItem.rotation}>
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
                                const target = itemsRef.current.find((it) => it.id === editingBezierId)
                                if (target) {
                                  const data = target.bezierData ? [...target.bezierData] : anchors.map(() => ({ cpOutX: 0, cpOutY: 0, cpInX: 0, cpInY: 0 }))
                                  data[si] = newCp
                                  broadcastItemUpdate(editingBezierId, { bezierData: data })
                                }
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
                                const target = itemsRef.current.find((it) => it.id === editingBezierId)
                                if (target) {
                                  const data = target.bezierData ? [...target.bezierData] : anchors.map(() => ({ cpOutX: 0, cpOutY: 0, cpInX: 0, cpInY: 0 }))
                                  data[si] = newCp
                                  broadcastItemUpdate(editingBezierId, { bezierData: data })
                                }
                              }}
                            />
                          </>
                        )
                      })()}
                    </Group>
                  )
                })()}
                {renderCropOverlay()}
                {!cropSession && !warpStateRef.current && activeToolCard !== 'meshWarp' && (
                             <Transformer
                ref={transformerRef}
                rotateEnabled={!areAllLocked}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                rotationSnapTolerance={6}
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
                  )
                }
                  onTransform={() => {
                    const nodes = transformerRef.current?.nodes?.()
                    const firstNode = nodes?.[0]
                    const nodeRect = firstNode?.getClientRect?.()
                    if (!nodeRect) return
                    // getClientRect() returns STAGE coordinates (viewport space with camera zoom/pan).
                    // Convert to WORLD coordinates (camera Group space) since guides render inside the camera Group.
                    const cam = cameraRef.current
                    const worldX = (nodeRect.x - cam.x) / cam.scale
                    const worldY = (nodeRect.y - cam.y) / cam.scale
                    const worldW = nodeRect.width / cam.scale
                    const worldH = nodeRect.height / cam.scale
                    const worldBox = {
                      left: worldX,
                      right: worldX + worldW,
                      top: worldY,
                      bottom: worldY + worldH,
                      centerX: worldX + worldW / 2,
                      centerY: worldY + worldH / 2,
                    }
                    const guides = []
                    const canvasCenterX = canvasBounds.x + canvasBounds.width / 2
                    const canvasCenterY = canvasBounds.y + canvasBounds.height / 2
                    if (Math.abs(worldBox.centerX - canvasCenterX) <= snapTolerance) guides.push({ axis: 'x', value: canvasCenterX, type: 'canvas-center' })
                    if (Math.abs(worldBox.centerY - canvasCenterY) <= snapTolerance) guides.push({ axis: 'y', value: canvasCenterY, type: 'canvas-center' })
                    setAlignmentGuides(guides)

                    if (nodes?.length === 1) {
                      const normalizedRot = ((firstNode.rotation() % 360) + 360) % 360
                      const snappedAngle = [0, 45, 90, 135, 180, 225, 270, 315].find((a) => Math.abs(normalizedRot - a) <= 3 || Math.abs(normalizedRot - (a + 360)) <= 3)
                      if (snappedAngle !== undefined) {
                        const angleRad = (snappedAngle * Math.PI) / 180
                        const len = Math.max(canvasBounds.width, canvasBounds.height)
                        const upX = Math.sin(angleRad)
                        const upY = -Math.cos(angleRad)
                        const originX = worldBox.centerX
                        const originY = worldBox.centerY
                        const guidePoints = {
                          centerX: originX,
                          centerY: originY,
                          angle: snappedAngle,
                          p1x: originX - upX * len,
                          p1y: originY - upY * len,
                          p2x: originX + upX * len,
                          p2y: originY + upY * len,
                        }
                        setRotationSnapGuide(guidePoints)
                      } else {
                        setRotationSnapGuide(null)
                      }
                    } else {
                      setRotationSnapGuide(null)
                    }

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
                    const newHeight = candidateBox.width / aspectRatio
                    if (activeAnchor?.includes('top')) {
                      return {
                        ...candidateBox,
                        height: newHeight,
                        y: candidateBox.y + candidateBox.height - newHeight,
                      }
                    }
                    return { ...candidateBox, height: newHeight }
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
              {warpStateRef.current && selectedItem && selectedItem.kind === 'image' && warpStateRef.current.itemId === selectedItem.id && (
                <Group x={warpStateRef.current.itemX - WARP_PADDING} y={warpStateRef.current.itemY - WARP_PADDING}>
                  {warpStateRef.current.previewCanvas && (
                    <KonvaImage
                      ref={warpImageNodeRef}
                      image={warpStateRef.current.previewCanvas}
                      width={warpStateRef.current.itemW + WARP_PADDING * 2}
                      height={warpStateRef.current.itemH + WARP_PADDING * 2}
                      listening={false}
                    />
                  )}
                  <Group x={WARP_PADDING} y={WARP_PADDING}>
                    <WarpHandles
                      grid={warpStateRef.current.dstGrid}
                      mode={warpStateRef.current.mode === 'perspective' ? 'perspective' : 'mesh'}
                      onDrag={handleWarpDrag}
                      onDragEnd={handleWarpDragEnd}
                    />
                  </Group>
                </Group>
              )}
{isRemoveBgProcessing && selectedItem?.kind === 'image' && (
  <RemoveBgOverlay item={selectedItem} />
)}
{items.filter((i) => i.relight).map((item) => (
  item.id === selectedItem?.id && relightActive ? (
    <RelightBalls
      key={`relight-${item.id}`}
      target={item}
      state={item.relight}
      onDragLight={(lightKey, offsetX, offsetY) => {
        const next = { ...item.relight, [lightKey]: { ...item.relight[lightKey], offsetX, offsetY } }
        updateItem(item.id, { relight: next })
      }}
    />
  ) : (
    <LightOverlay
      key={`relight-${item.id}`}
      target={item}
      state={item.relight}
    />
  )
))}
            <CollaborationSelectionIndicators items={items} />
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

        {editingText && inlineTextEditorStyle && editingTextItem?.kind === 'shape' && (
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
        {editingText && inlineTextEditorStyle && editingTextItem?.kind === 'text' && (
          <RichTextEditor
            ref={richTextEditorRef}
            item={editingTextItem}
            style={inlineTextEditorStyle}
            onCommit={(runs) => {
              if (!editingText) return
              const cleaned = stripListPrefix(runs)
              const text = runsToText(cleaned)
              const globalBold = cleaned.length > 0 && cleaned.every((r) => r.bold)
              const globalItalic = cleaned.length > 0 && cleaned.every((r) => r.italic)
              const globalUnderline = cleaned.length > 0 && cleaned.every((r) => r.underline)
              updateItem(editingText.id, { runs: cleaned, text, isBold: globalBold, isItalic: globalItalic, isUnderline: globalUnderline })
              setEditingText(null)
              requestAnimationFrame(() => attachTransformer(editingText.id))
            }}
            onCancel={() => {
              cancelTextEditing()
            }}
          />
        )}
        <ToastContainer />
        <CursorOverlay stageRef={stageRef} cameraRef={cameraRef} isPanning={isPanning} user={user} items={items} selectedIds={selectedIds} selectedId={selectedId} broadcastRef={broadcastRef} />
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
      {activePanel === 'assets' && assetSubView === 'uploads' && (
        <div className="workspace-upload-fab-wrap">
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
        {selectedItem?.kind === 'text' && (
          <>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
            <button
              className={`zoom-btn ${selectedItem.runs?.some(r => r.listType === 'bullet') ? 'active' : ''}`}
              onClick={() => {
                if (editingText) {
                  richTextEditorRef.current?.toggleListType('bullet')
                } else {
                  const runs = getRuns(selectedItem)
                  const hasType = runs.some(r => r.listType === 'bullet')
                  const newRuns = runs.map(r => ({ ...r, listType: hasType ? null : 'bullet' }))
                  updateItem(selectedItem.id, { runs: newRuns, text: runsToText(newRuns) })
                }
              }}
              title="Bullet List"
              type="button"
              style={{ width: 28, height: 28, fontSize: 14 }}
            >
              <List size={14} />
            </button>
            <button
              className={`zoom-btn ${selectedItem.runs?.some(r => r.listType === 'numbered') ? 'active' : ''}`}
              onClick={() => {
                if (editingText) {
                  richTextEditorRef.current?.toggleListType('numbered')
                } else {
                  const runs = getRuns(selectedItem)
                  const hasType = runs.some(r => r.listType === 'numbered')
                  const newRuns = runs.map(r => ({ ...r, listType: hasType ? null : 'numbered' }))
                  updateItem(selectedItem.id, { runs: newRuns, text: runsToText(newRuns) })
                }
              }}
              title="Numbered List"
              type="button"
              style={{ width: 28, height: 28, fontSize: 14 }}
            >
              <ListOrdered size={14} />
            </button>
          </>
        )}
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
                ...((canUseCompositeGroupMode || hasCompositeInSelection) ? [
                  { label: activeCompositeMode === 'mask' ? 'Matikan Masking' : activeSelectionCount > 1 ? `Masking (${activeSelectionCount})` : 'Masking', action: hasCompositeInSelection ? null : () => applyCompositeGroupMode('mask'), Icon: Box, disabled: hasCompositeInSelection },
                  { label: activeCompositeMode === 'exclude' ? 'Matikan Exclude' : activeSelectionCount > 1 ? `Exclude (${activeSelectionCount})` : 'Exclude', action: hasCompositeInSelection ? null : () => applyCompositeGroupMode('exclude'), Icon: MinusIcon, disabled: hasCompositeInSelection },
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
                  <div key={i} style={{ ...menuItemStyle, opacity: item.disabled ? 0.4 : 1, cursor: item.disabled ? 'not-allowed' : 'pointer' }} onClick={() => { if (!item.disabled) { item.action?.(); closeAllMenus() } }} title={item.disabled ? 'Nested masking belum didukung — pisahkan composite group terlebih dahulu' : undefined}>
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
          ...((canUseCompositeGroupMode || hasCompositeInSelection) ? [
            { label: activeCompositeMode === 'mask' ? 'Matikan Masking' : activeSelectionCount > 1 ? `Masking (${activeSelectionCount})` : 'Masking', shortcut: '', action: hasCompositeInSelection ? null : () => applyCompositeGroupMode('mask'), Icon: Box, disabled: hasCompositeInSelection },
            { label: activeCompositeMode === 'exclude' ? 'Matikan Exclude' : activeSelectionCount > 1 ? `Exclude (${activeSelectionCount})` : 'Exclude', shortcut: '', action: hasCompositeInSelection ? null : () => applyCompositeGroupMode('exclude'), Icon: MinusIcon, disabled: hasCompositeInSelection },
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
            <div key={i} style={{ ...menuItemStyle, opacity: item.disabled ? 0.4 : 1, cursor: item.disabled ? 'not-allowed' : 'pointer' }} onClick={() => { if (!item.disabled) { item.action?.(); closeAllMenus() } }} title={item.disabled ? 'Nested masking belum didukung — pisahkan composite group terlebih dahulu' : undefined}>
              {item.Icon && <item.Icon size={14} style={{ flexShrink: 0 }} />}
              <span>{item.label}</span>
              {item.shortcut && <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 11 }}>{item.shortcut}</span>}
            </div>
          )
        })}
      </div>
    )}

    {isShareModalOpen && (
      <ShareModal workspaceId={workspaceId} onClose={() => setIsShareModalOpen(false)} />
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
    </CollaborationProvider>
    </ToastProvider>
  )
}



function ToastRefCapture({ toastRef }) {
  const { addToast } = useToast()
  useEffect(() => { toastRef.current = addToast }, [addToast, toastRef])
  return null
}

function CursorOverlay({ stageRef, cameraRef, isPanning, user, items, selectedIds, selectedId, broadcastRef }) {
  useCursorBroadcast({ stageRef, cameraRef, isPanning, user })
  const { broadcast } = useCollaboration()
  useEffect(() => { broadcastRef.current = broadcast }, [broadcast, broadcastRef])
  const userIdRef = useRef(user?.id)
  userIdRef.current = user?.id
  useEffect(() => {
    const uid = userIdRef.current
    if (!uid) return
    const ids = selectedIds?.length > 0 ? selectedIds : (selectedId ? [selectedId] : [])
    broadcast('selection_change', {
      userId: uid,
      selectedIds: ids,
      displayName: user?.displayName || user?.username,
      username: user?.username,
    }, { throttle: 100 })
  }, [selectedIds, selectedId, broadcast, user])
  return (
    <>
      <CollaborationCursors cameraRef={cameraRef} />
      <CollaborationSelectionLabels cameraRef={cameraRef} items={items} />
    </>
  )
}

export default Workspace
