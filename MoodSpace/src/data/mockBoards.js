// Mock data for boards in Moodspace application

export const mockBoards = [
  {
    id: 'board-1',
    name: 'Cinematic Lighting',
    description: 'A curated study of dramatic high-contrast lighting, volumetric shadows, and moody color palettes for neo-noir digital environments.',
    category: ['Neo-Noir', 'Chiaroscuro', 'Volumetric', 'Concept-Art'],
    lastUpdated: '2024-01-15T10:30:00Z',
    assetCount: 24,
    coverImages: [
      'project-art-lumina',
      'project-art-chromatic',
      'project-art-noir',
      'project-art-orbital'
    ]
  },
  {
    id: 'board-2',
    name: 'Cyberpunk Aesthetics',
    description: 'Neon-lit cityscapes, futuristic architecture, and dystopian urban environments with vibrant color grading.',
    category: ['Cyberpunk', 'Urban', 'Neon', 'Architecture'],
    lastUpdated: '2024-01-14T15:20:00Z',
    assetCount: 18,
    coverImages: [
      'project-art-nexus',
      'project-art-concrete',
      'art-1',
      'art-6'
    ]
  },
  {
    id: 'board-3',
    name: 'Abstract Minimalism',
    description: 'Clean geometric forms, negative space, and subtle gradients exploring the essence of modern design.',
    category: ['Minimalism', 'Abstract', 'Geometric', 'Modern'],
    lastUpdated: '2024-01-13T09:45:00Z',
    assetCount: 32,
    coverImages: [
      'art-2',
      'art-5',
      'project-art-orbital',
      'art-3'
    ]
  },
  {
    id: 'board-4',
    name: 'Organic Textures',
    description: 'Natural patterns, fluid dynamics, and biomorphic forms inspired by nature and organic growth.',
    category: ['Organic', 'Nature', 'Textures', 'Biomorphic'],
    lastUpdated: '2024-01-12T14:10:00Z',
    assetCount: 15,
    coverImages: [
      'art-4',
      'art-1',
      'project-art-lumina',
      'art-6'
    ]
  }
]

/**
 * Get board by ID
 * @param {string} id - Board ID
 * @returns {Object|null} Board object or null if not found
 */
export function getBoardById(id) {
  if (!id || typeof id !== 'string') {
    return null
  }
  
  const board = mockBoards.find(b => b.id === id)
  return board || null
}

/**
 * Get all boards
 * @returns {Array} Array of all boards
 */
export function getAllBoards() {
  return mockBoards
}
