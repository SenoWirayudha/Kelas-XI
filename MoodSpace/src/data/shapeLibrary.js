// Centralized Shape Library Registry
// Scalable architecture for shape assets

export const SHAPE_LIBRARY = {
  basic: [
    {
      id: 'rectangle',
      label: 'Rectangle',
      shapeType: 'rect',
      defaultProps: {
        width: 150,
        height: 100,
        fill: '#a78bfa',
        cornerRadius: 0,
      },
    },
    {
      id: 'rounded-rectangle',
      label: 'Rounded Rectangle',
      shapeType: 'rect',
      defaultProps: {
        width: 150,
        height: 100,
        fill: '#a78bfa',
        cornerRadius: 16,
      },
    },
    {
      id: 'circle',
      label: 'Circle',
      shapeType: 'circle',
      defaultProps: {
        radius: 60,
        fill: '#a78bfa',
      },
    },
    {
      id: 'ellipse',
      label: 'Ellipse',
      shapeType: 'ellipse',
      defaultProps: {
        radiusX: 80,
        radiusY: 50,
        fill: '#a78bfa',
      },
    },
    {
      id: 'triangle',
      label: 'Triangle',
      shapeType: 'polygon',
      defaultProps: {
        sides: 3,
        radius: 60,
        fill: '#a78bfa',
      },
    },
    {
      id: 'square',
      label: 'Square',
      shapeType: 'rect',
      defaultProps: {
        width: 120,
        height: 120,
        fill: '#a78bfa',
        cornerRadius: 0,
      },
    },
  ],

  arrows: [
    {
      id: 'arrow-left',
      label: 'Arrow Left',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 160,
        height: 72,
        arrowVariant: 'left',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-right',
      label: 'Arrow Right',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 160,
        height: 72,
        arrowVariant: 'right',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-up',
      label: 'Arrow Up',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 72,
        height: 160,
        arrowVariant: 'up',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-down',
      label: 'Arrow Down',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 72,
        height: 160,
        arrowVariant: 'down',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-bidirectional-horizontal',
      label: 'Horizontal Double Arrow',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 180,
        height: 72,
        arrowVariant: 'double-horizontal',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-bidirectional-vertical',
      label: 'Vertical Double Arrow',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 72,
        height: 180,
        arrowVariant: 'double-vertical',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-chevron',
      label: 'Chevron Arrow',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 150,
        height: 92,
        arrowVariant: 'chevron',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-block',
      label: 'Block Arrow',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 170,
        height: 92,
        arrowVariant: 'block',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
    {
      id: 'arrow-tapered',
      label: 'Tapered Arrow',
      shapeType: 'arrow-shape',
      defaultProps: {
        width: 170,
        height: 82,
        arrowVariant: 'tapered',
        fill: '#a78bfa',
        stroke: '#3f3a46',
        strokeWidth: 0,
        fillEnabled: true,
        strokeEnabled: false,
      },
    },
  ],

  polygons: [
    {
      id: 'pentagon',
      label: 'Pentagon',
      shapeType: 'polygon',
      defaultProps: {
        sides: 5,
        radius: 60,
        fill: '#a78bfa',
      },
    },
    {
      id: 'hexagon',
      label: 'Hexagon',
      shapeType: 'polygon',
      defaultProps: {
        sides: 6,
        radius: 60,
        fill: '#a78bfa',
      },
    },
    {
      id: 'octagon',
      label: 'Octagon',
      shapeType: 'polygon',
      defaultProps: {
        sides: 8,
        radius: 60,
        fill: '#a78bfa',
      },
    },
    {
      id: 'diamond',
      label: 'Diamond',
      shapeType: 'polygon',
      defaultProps: {
        sides: 4,
        radius: 60,
        fill: '#a78bfa',
        rotation: 45,
      },
    },
  ],

  stars: [
    {
      id: 'star-4',
      label: '4-Point Star',
      shapeType: 'star',
      defaultProps: {
        numPoints: 4,
        innerRadius: 30,
        outerRadius: 60,
        starInnerRatio: 0.25,
        fill: '#a78bfa',
      },
    },
    {
      id: 'star-5',
      label: '5-Point Star',
      shapeType: 'star',
      defaultProps: {
        numPoints: 5,
        innerRadius: 30,
        outerRadius: 60,
        starInnerRatio: 0.25,
        fill: '#a78bfa',
      },
    },
    {
      id: 'star-6',
      label: '6-Point Star',
      shapeType: 'star',
      defaultProps: {
        numPoints: 6,
        innerRadius: 30,
        outerRadius: 60,
        starInnerRatio: 0.25,
        fill: '#a78bfa',
      },
    },
    {
      id: 'star-8',
      label: '8-Point Star',
      shapeType: 'star',
      defaultProps: {
        numPoints: 8,
        innerRadius: 30,
        outerRadius: 60,
        starInnerRatio: 0.25,
        fill: '#a78bfa',
      },
    },
  ],
}

// Category metadata
export const SHAPE_CATEGORIES = [
  { id: 'basic', label: 'Basic Shapes', icon: 'Box' },
  { id: 'arrows', label: 'Arrow Shapes', icon: 'ArrowRight' },
  { id: 'polygons', label: 'Polygons', icon: 'Hexagon' },
  { id: 'stars', label: 'Stars', icon: 'Star' },
]

// Get all shapes from a category
export const getShapesByCategory = (categoryId) => {
  return SHAPE_LIBRARY[categoryId] || []
}

// Get all categories
export const getAllCategories = () => {
  return SHAPE_CATEGORIES
}

// Get shape by ID
export const getShapeById = (shapeId) => {
  for (const category of Object.values(SHAPE_LIBRARY)) {
    const shape = category.find(s => s.id === shapeId)
    if (shape) return shape
  }
  return null
}
