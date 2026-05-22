// Mock data for assets in Moodspace application

export const mockAssets = [
  // Board 1: Cinematic Lighting
  {
    id: 'asset-1',
    boardId: 'board-1',
    title: 'Neon Car in Rain',
    imageUrl: 'project-art-lumina',
    category: ['Cyberpunk', 'Photography', 'Neon'],
    likes: 342,
    saves: 128,
    views: 8500,
    author: 'Elena Vance',
    authorAvatar: 'avatar-1',
    description: 'Volumetric lighting through neon signs reflecting on wet asphalt. Shot with cinematic color grading and atmospheric fog.',
    tags: ['neon', 'car', 'rain', 'cyberpunk', 'volumetric'],
    relatedAssets: ['asset-2', 'asset-5', 'asset-8'],
    aspectRatio: 1.5
  },
  {
    id: 'asset-2',
    boardId: 'board-1',
    title: 'Volumetric Light Beam',
    imageUrl: 'art-1',
    category: ['Abstract', 'Lighting'],
    likes: 289,
    saves: 95,
    views: 6200,
    author: 'Marcus Chen',
    authorAvatar: 'avatar-2',
    description: 'Single beam of light cutting through darkness with volumetric fog effect.',
    tags: ['volumetric', 'light', 'beam', 'fog', 'dramatic'],
    relatedAssets: ['asset-1', 'asset-3', 'asset-7'],
    aspectRatio: 0.75
  },
  {
    id: 'asset-3',
    boardId: 'board-1',
    title: 'Purple Smoke Abstract',
    imageUrl: 'art-3',
    category: ['Abstract', 'Color'],
    likes: 412,
    saves: 156,
    views: 9800,
    author: 'Sofia Rodriguez',
    authorAvatar: 'avatar-3',
    description: 'Ethereal purple smoke patterns with gradient transitions and soft lighting.',
    tags: ['purple', 'smoke', 'abstract', 'gradient', 'ethereal'],
    relatedAssets: ['asset-2', 'asset-6', 'asset-9'],
    aspectRatio: 1.2
  },
  {
    id: 'asset-4',
    boardId: 'board-1',
    title: 'Cyberpunk Street',
    imageUrl: 'project-art-nexus',
    category: ['Cyberpunk', 'Urban', 'Architecture'],
    likes: 567,
    saves: 234,
    views: 14200,
    author: 'Kai Nakamura',
    authorAvatar: 'avatar-4',
    description: 'Neon-lit alleyway with holographic advertisements and rain-soaked streets.',
    tags: ['cyberpunk', 'street', 'neon', 'urban', 'night'],
    relatedAssets: ['asset-1', 'asset-5', 'asset-10'],
    aspectRatio: 1.33
  },
  {
    id: 'asset-5',
    boardId: 'board-1',
    title: 'Silhouette Portrait',
    imageUrl: 'project-art-noir',
    category: ['Portrait', 'Neo-Noir'],
    likes: 445,
    saves: 178,
    views: 11500,
    author: 'Isabella Martinez',
    authorAvatar: 'avatar-5',
    description: 'Dramatic silhouette with neon ring light creating cinematic mood.',
    tags: ['portrait', 'silhouette', 'neon', 'dramatic', 'noir'],
    relatedAssets: ['asset-1', 'asset-4', 'asset-11'],
    aspectRatio: 0.8
  },
  {
    id: 'asset-6',
    boardId: 'board-1',
    title: 'Abstract Mountains',
    imageUrl: 'art-6',
    category: ['Abstract', 'Landscape'],
    likes: 321,
    saves: 142,
    views: 7800,
    author: 'Liam O\'Connor',
    authorAvatar: 'avatar-6',
    description: 'Geometric mountain forms with cyan and teal color palette.',
    tags: ['abstract', 'mountains', 'geometric', 'cyan', 'landscape'],
    relatedAssets: ['asset-3', 'asset-7', 'asset-12'],
    aspectRatio: 1.6
  },
  
  // Board 2: Cyberpunk Aesthetics
  {
    id: 'asset-7',
    boardId: 'board-2',
    title: 'Futuristic Architecture',
    imageUrl: 'project-art-concrete',
    category: ['Architecture', 'Futuristic'],
    likes: 398,
    saves: 167,
    views: 10200,
    author: 'Yuki Tanaka',
    authorAvatar: 'avatar-7',
    description: 'Brutalist concrete structures with neon accent lighting.',
    tags: ['architecture', 'concrete', 'brutalist', 'neon', 'futuristic'],
    relatedAssets: ['asset-4', 'asset-8', 'asset-13'],
    aspectRatio: 1.4
  },
  {
    id: 'asset-8',
    boardId: 'board-2',
    title: 'Chromatic Explosion',
    imageUrl: 'project-art-chromatic',
    category: ['Abstract', 'Color'],
    likes: 523,
    saves: 201,
    views: 13800,
    author: 'Aria Patel',
    authorAvatar: 'avatar-8',
    description: 'Vibrant color explosion with radial gradients and light rays.',
    tags: ['chromatic', 'color', 'explosion', 'vibrant', 'abstract'],
    relatedAssets: ['asset-3', 'asset-9', 'asset-14'],
    aspectRatio: 1.1
  },
  {
    id: 'asset-9',
    boardId: 'board-2',
    title: 'Neon Grid',
    imageUrl: 'art-5',
    category: ['Abstract', 'Geometric'],
    likes: 276,
    saves: 98,
    views: 7100,
    author: 'Diego Silva',
    authorAvatar: 'avatar-9',
    description: 'Repeating grid pattern with purple neon lines on dark background.',
    tags: ['grid', 'neon', 'geometric', 'pattern', 'purple'],
    relatedAssets: ['asset-7', 'asset-10', 'asset-15'],
    aspectRatio: 1.0
  },
  {
    id: 'asset-10',
    boardId: 'board-2',
    title: 'Urban Night Scene',
    imageUrl: 'art-2',
    category: ['Urban', 'Photography'],
    likes: 467,
    saves: 189,
    views: 12400,
    author: 'Nina Kowalski',
    authorAvatar: 'avatar-10',
    description: 'City street at night with atmospheric lighting and fog.',
    tags: ['urban', 'night', 'city', 'fog', 'atmospheric'],
    relatedAssets: ['asset-4', 'asset-11', 'asset-16'],
    aspectRatio: 1.25
  },
  
  // Board 3: Abstract Minimalism
  {
    id: 'asset-11',
    boardId: 'board-3',
    title: 'Orbital Void',
    imageUrl: 'project-art-orbital',
    category: ['Abstract', 'Space'],
    likes: 389,
    saves: 145,
    views: 9500,
    author: 'Zara Ahmed',
    authorAvatar: 'avatar-11',
    description: 'Circular void with orbital rings and cosmic color palette.',
    tags: ['orbital', 'void', 'space', 'abstract', 'cosmic'],
    relatedAssets: ['asset-6', 'asset-12', 'asset-17'],
    aspectRatio: 1.0
  },
  {
    id: 'asset-12',
    boardId: 'board-3',
    title: 'Minimalist Gradient',
    imageUrl: 'art-4',
    category: ['Minimalism', 'Abstract'],
    likes: 234,
    saves: 87,
    views: 5800,
    author: 'Oliver Berg',
    authorAvatar: 'avatar-12',
    description: 'Subtle gradient transitions with clean geometric forms.',
    tags: ['minimalism', 'gradient', 'clean', 'geometric', 'subtle'],
    relatedAssets: ['asset-11', 'asset-13', 'asset-18'],
    aspectRatio: 1.5
  },
  
  // Additional assets for variety
  {
    id: 'asset-13',
    boardId: 'board-1',
    title: 'Dramatic Shadows',
    imageUrl: 'art-1',
    category: ['Lighting', 'Drama'],
    likes: 312,
    saves: 119,
    views: 8100,
    author: 'Emma Wilson',
    authorAvatar: 'avatar-13',
    description: 'High contrast shadows creating dramatic composition.',
    tags: ['shadows', 'dramatic', 'contrast', 'lighting', 'composition'],
    relatedAssets: ['asset-2', 'asset-5', 'asset-14'],
    aspectRatio: 0.9
  },
  {
    id: 'asset-14',
    boardId: 'board-2',
    title: 'Holographic Interface',
    imageUrl: 'project-art-nexus',
    category: ['UI', 'Futuristic'],
    likes: 445,
    saves: 167,
    views: 11200,
    author: 'Alex Kim',
    authorAvatar: 'avatar-14',
    description: 'Futuristic holographic user interface with cyan accents.',
    tags: ['holographic', 'ui', 'interface', 'futuristic', 'cyan'],
    relatedAssets: ['asset-7', 'asset-8', 'asset-15'],
    aspectRatio: 1.6
  },
  {
    id: 'asset-15',
    boardId: 'board-3',
    title: 'Geometric Patterns',
    imageUrl: 'art-5',
    category: ['Geometric', 'Pattern'],
    likes: 298,
    saves: 112,
    views: 7600,
    author: 'Mia Thompson',
    authorAvatar: 'avatar-15',
    description: 'Repeating geometric patterns with minimalist aesthetic.',
    tags: ['geometric', 'pattern', 'minimalist', 'repeating', 'clean'],
    relatedAssets: ['asset-9', 'asset-12', 'asset-16'],
    aspectRatio: 1.0
  },
  {
    id: 'asset-16',
    boardId: 'board-1',
    title: 'Moody Atmosphere',
    imageUrl: 'art-3',
    category: ['Atmospheric', 'Mood'],
    likes: 378,
    saves: 134,
    views: 9300,
    author: 'Lucas Brown',
    authorAvatar: 'avatar-16',
    description: 'Atmospheric composition with moody color grading.',
    tags: ['moody', 'atmospheric', 'color', 'grading', 'composition'],
    relatedAssets: ['asset-3', 'asset-13', 'asset-17'],
    aspectRatio: 1.2
  },
  {
    id: 'asset-17',
    boardId: 'board-3',
    title: 'Cosmic Nebula',
    imageUrl: 'art-6',
    category: ['Space', 'Abstract'],
    likes: 456,
    saves: 178,
    views: 11800,
    author: 'Sophia Lee',
    authorAvatar: 'avatar-17',
    description: 'Abstract nebula with cyan and purple color palette.',
    tags: ['cosmic', 'nebula', 'space', 'abstract', 'purple'],
    relatedAssets: ['asset-11', 'asset-18', 'asset-6'],
    aspectRatio: 1.4
  },
  {
    id: 'asset-18',
    boardId: 'board-2',
    title: 'Neon Reflections',
    imageUrl: 'project-art-lumina',
    category: ['Neon', 'Reflections'],
    likes: 512,
    saves: 198,
    views: 13500,
    author: 'Ryan Garcia',
    authorAvatar: 'avatar-18',
    description: 'Neon lights reflecting on wet surfaces with bokeh effect.',
    tags: ['neon', 'reflections', 'wet', 'bokeh', 'lights'],
    relatedAssets: ['asset-1', 'asset-4', 'asset-14'],
    aspectRatio: 1.5
  }
]

/**
 * Get assets by board ID
 * @param {string} boardId - Board ID
 * @returns {Array} Array of assets for the board
 */
export function getAssetsByBoardId(boardId) {
  if (!boardId || typeof boardId !== 'string') {
    return []
  }
  
  return mockAssets.filter(asset => asset.boardId === boardId)
}

/**
 * Get asset by ID
 * @param {string} assetId - Asset ID
 * @returns {Object|null} Asset object or null if not found
 */
export function getAssetById(assetId) {
  if (!assetId || typeof assetId !== 'string') {
    return null
  }
  
  const asset = mockAssets.find(a => a.id === assetId)
  return asset || null
}

/**
 * Get related assets by asset ID
 * @param {string} assetId - Asset ID
 * @returns {Array} Array of related assets (max 6)
 */
export function getRelatedAssets(assetId) {
  if (!assetId || typeof assetId !== 'string') {
    return []
  }
  
  const asset = getAssetById(assetId)
  if (!asset || !asset.relatedAssets) {
    return []
  }
  
  // Get related assets by IDs
  const related = asset.relatedAssets
    .map(id => getAssetById(id))
    .filter(a => a !== null)
    .slice(0, 6) // Max 6 related assets
  
  return related
}

/**
 * Get all assets
 * @returns {Array} Array of all assets
 */
export function getAllAssets() {
  return mockAssets
}
