import { createHash } from 'crypto'

const sortValue = (value) => {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortValue(value[key])
        return acc
      }, {})
  }
  return value
}

export const stableStringify = (value) => JSON.stringify(sortValue(value))

export const hashSnapshot = (snapshot) => (
  createHash('sha256').update(stableStringify(snapshot)).digest('hex')
)

export const buildInitialSnapshot = ({ canvasWidth, canvasHeight, canvasRatio, background = {}, settings = {}, snapshot = {} }) => ({
  schemaVersion: 1,
  canvas: {
    width: canvasWidth,
    height: canvasHeight,
    ratio: canvasRatio || null,
  },
  background,
  settings,
  items: [],
  layers: [],
  assetsUsed: [],
  ...snapshot,
})
