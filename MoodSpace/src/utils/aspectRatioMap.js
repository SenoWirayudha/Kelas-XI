/**
 * Aspect Ratio Mapping Utility
 * 
 * Maps CSS class names to their corresponding aspect ratios.
 * These values are based on the actual image dimensions and should match
 * the aspectRatio property in mockAssets.js where applicable.
 * 
 * Aspect Ratio = width / height
 * - Values < 1 = Portrait (taller than wide)
 * - Values = 1 = Square
 * - Values > 1 = Landscape (wider than tall)
 */

export const aspectRatioMap = {
  // Home page gallery items
  'art-1': 0.75,      // Portrait - Volumetric Light Beam
  'art-2': 1.25,      // Landscape - Urban Night Scene
  'art-3': 1.2,       // Landscape - Purple Smoke Abstract / Moody Atmosphere
  'art-4': 1.5,       // Landscape - Minimalist Gradient
  'art-5': 1.0,       // Square - Neon Grid / Geometric Patterns
  'art-6': 1.6,       // Landscape - Abstract Mountains / Cosmic Nebula
  
  // Projects page items
  'project-art-lumina': 1.5,      // Landscape - Neon Car in Rain / Neon Reflections
  'project-art-concrete': 1.4,    // Landscape - Futuristic Architecture
  'project-art-chromatic': 1.1,   // Landscape - Chromatic Explosion
  'project-art-noir': 0.8,        // Portrait - Silhouette Portrait
  'project-art-nexus': 1.6,       // Landscape - Cyberpunk Street / Holographic Interface
  'project-art-orbital': 1.0,     // Square - Orbital Void
}

/**
 * Get aspect ratio for a given CSS class name
 * @param {string} className - The CSS class name (e.g., 'art-1', 'project-art-lumina')
 * @param {number} defaultRatio - Default aspect ratio if class not found (default: 1.0)
 * @returns {number} The aspect ratio for the class
 */
export function getAspectRatio(className, defaultRatio = 1.0) {
  return aspectRatioMap[className] || defaultRatio
}
