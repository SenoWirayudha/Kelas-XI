import { getPaletteSync } from 'colorthief'

const cache = new Map()

export function extractDominantColors(imageSrc, count = 5) {
  if (cache.has(imageSrc)) return Promise.resolve(cache.get(imageSrc))

  return new Promise((resolve) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const palette = getPaletteSync(img, { colorCount: count })
        const hexColors = palette.map((c) => c.hex())
        cache.set(imageSrc, hexColors)
        resolve(hexColors)
      } catch {
        resolve([])
      }
    }
    img.onerror = () => resolve([])
    img.src = imageSrc
  })
}

export function clearDominantColorCache(src) {
  cache.delete(src)
}
