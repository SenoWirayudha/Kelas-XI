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

  lines: [
    {
      id: 'line-horizontal',
      label: 'Horizontal Line',
      shapeType: 'line',
      defaultProps: {
        points: [0, 0, 150, 0],
        stroke: '#a78bfa',
        strokeWidth: 3,
      },
    },
    {
      id: 'line-vertical',
      label: 'Vertical Line',
      shapeType: 'line',
      defaultProps: {
        points: [0, 0, 0, 150],
        stroke: '#a78bfa',
        strokeWidth: 3,
      },
    },
    {
      id: 'line-diagonal',
      label: 'Diagonal Line',
      shapeType: 'line',
      defaultProps: {
        points: [0, 0, 150, 150],
        stroke: '#a78bfa',
        strokeWidth: 3,
      },
    },
  ],

  arrows: [
    {
      id: 'arrow-right',
      label: 'Arrow Right',
      shapeType: 'arrow',
      defaultProps: {
        points: [0, 0, 150, 0],
        pointerLength: 20,
        pointerWidth: 20,
        fill: '#a78bfa',
        stroke: '#a78bfa',
        strokeWidth: 3,
      },
    },
    {
      id: 'arrow-left',
      label: 'Arrow Left',
      shapeType: 'arrow',
      defaultProps: {
        points: [150, 0, 0, 0],
        pointerLength: 20,
        pointerWidth: 20,
        fill: '#a78bfa',
        stroke: '#a78bfa',
        strokeWidth: 3,
      },
    },
    {
      id: 'arrow-up',
      label: 'Arrow Up',
      shapeType: 'arrow',
      defaultProps: {
        points: [0, 150, 0, 0],
        pointerLength: 20,
        pointerWidth: 20,
        fill: '#a78bfa',
        stroke: '#a78bfa',
        strokeWidth: 3,
      },
    },
    {
      id: 'arrow-down',
      label: 'Arrow Down',
      shapeType: 'arrow',
      defaultProps: {
        points: [0, 0, 0, 150],
        pointerLength: 20,
        pointerWidth: 20,
        fill: '#a78bfa',
        stroke: '#a78bfa',
        strokeWidth: 3,
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
        fill: '#a78bfa',
      },
    },
  ],
}

// Category metadata
export const SHAPE_CATEGORIES = [
  { id: 'basic', label: 'Basic Shapes', icon: 'Box' },
  { id: 'lines', label: 'Lines', icon: 'Minus' },
  { id: 'arrows', label: 'Arrows', icon: 'ArrowRight' },
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
