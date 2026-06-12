import { rectsIntersect } from '../utils/mathUtils'

export const getItemsInSelectionBox = (items, box) => (
  items
    .filter((item) => item.visible !== false && item.kind !== 'connector')
    .filter((item) => rectsIntersect(box, {
      x: item.x || 0,
      y: item.y || 0,
      width: item.w || 1,
      height: item.h || 1,
    }))
)
