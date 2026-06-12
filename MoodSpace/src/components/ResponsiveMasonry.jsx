import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const gap = 18

const getResponsiveColumnCount = (width) => {
  if (!width) return 2
  if (width < 320) return 1

  let columns = 2
  if (width >= 768) columns = 3
  if (width >= 1024) columns = 4
  if (width >= 1440) columns = 5
  if (width >= 1920) columns = 6
  return columns
}

function MeasuredMasonryItem({ itemKey, onMeasure, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      onMeasure(itemKey, entry.contentRect.height)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [itemKey, onMeasure])

  return <div ref={ref} className="responsive-masonry-item">{children}</div>
}

function ResponsiveMasonry({
  items,
  getKey = (item) => item.id,
  estimateHeight = () => 280,
  renderItem,
  className = '',
}) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [measuredHeights, setMeasuredHeights] = useState({})

  useEffect(() => {
    if (!containerRef.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const columnCount = getResponsiveColumnCount(containerWidth)
  const columnWidth = columnCount > 0
    ? Math.max(0, (containerWidth - gap * (columnCount - 1)) / columnCount)
    : containerWidth

  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => ({ height: 0, items: [] }))
    items.forEach((item, index) => {
      const key = getKey(item)
      const shortest = nextColumns.reduce((best, column, columnIndex) => (
        column.height < nextColumns[best].height ? columnIndex : best
      ), 0)
      const itemHeight = measuredHeights[key] || estimateHeight(item, columnWidth, index)
      nextColumns[shortest].items.push({ item, index, key })
      nextColumns[shortest].height += itemHeight + gap
    })
    return nextColumns
  }, [columnCount, columnWidth, estimateHeight, getKey, items, measuredHeights])

  const handleMeasure = useCallback((key, height) => {
    setMeasuredHeights((current) => (
      Math.abs((current[key] || 0) - height) < 1 ? current : { ...current, [key]: height }
    ))
  }, [])

  return (
    <div ref={containerRef} className={`responsive-masonry ${className}`}>
      {columns.map((column, columnIndex) => (
        <div className="responsive-masonry-column" key={columnIndex}>
          {column.items.map(({ item, index, key }) => (
            <MeasuredMasonryItem itemKey={key} onMeasure={handleMeasure} key={key}>
              {renderItem(item, index)}
            </MeasuredMasonryItem>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ResponsiveMasonry
