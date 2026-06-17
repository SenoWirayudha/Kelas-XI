import { useCallback, useMemo } from 'react'
import ResponsiveMasonry from './ResponsiveMasonry'

const MASONRY_HEIGHTS = [220, 280, 190, 310, 250, 200, 240, 270, 210]

export function createSkeletonItems(count = 6) {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => ({
    _isSkeleton: true,
    _height: MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length],
    id: `__skel__${now}_${i}_${Math.random().toString(36).slice(2, 6)}`,
  }))
}

export function Skeleton({ width, height, borderRadius, className = '', style, ...props }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '8px',
        ...style,
      }}
      {...props}
    />
  )
}

Skeleton.Card = function SkeletonCard({ height }) {
  return (
    <div className="skeleton-card">
      <Skeleton className="skeleton-card-image" height={height || 200} />
      <div className="skeleton-card-body">
        <Skeleton width="75%" height={14} borderRadius={6} />
        <Skeleton width="50%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <Skeleton width={24} height={24} borderRadius="50%" />
          <Skeleton width="40%" height={11} borderRadius={6} />
        </div>
      </div>
    </div>
  )
}

Skeleton.Comment = function SkeletonComment() {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 0' }}>
      <Skeleton width={28} height={28} borderRadius="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="30%" height={12} borderRadius={6} />
        <Skeleton width="100%" height={11} borderRadius={6} style={{ marginTop: 6 }} />
        <Skeleton width="60%" height={11} borderRadius={6} style={{ marginTop: 4 }} />
      </div>
    </div>
  )
}

Skeleton.Detail = function SkeletonDetail() {
  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        <div className="post-detail-image-section">
          <Skeleton
            width="100%"
            height={400}
            borderRadius={14}
            style={{ maxWidth: '100%' }}
          />
        </div>
        <div className="post-detail-info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Skeleton width={40} height={40} borderRadius="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="50%" height={14} borderRadius={6} />
              <Skeleton width="30%" height={12} borderRadius={6} style={{ marginTop: 4 }} />
            </div>
          </div>
          <Skeleton width="70%" height={22} borderRadius={6} />
          <Skeleton width="100%" height={13} borderRadius={6} style={{ marginTop: 14 }} />
          <Skeleton width="100%" height={13} borderRadius={6} style={{ marginTop: 6 }} />
          <Skeleton width="55%" height={13} borderRadius={6} style={{ marginTop: 6 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width={50 + i * 12} height={28} borderRadius={999} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width={36} height={36} borderRadius={10} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

Skeleton.Masonry = function SkeletonMasonry({ count = 6 }) {
  const heights = useMemo(() => MASONRY_HEIGHTS, [])
  const dummyItems = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      height: heights[i % heights.length],
    })),
    [count, heights],
  )
  const estimateHeight = useCallback((item) => item.height, [])
  return (
    <ResponsiveMasonry
      items={dummyItems}
      getKey={(item) => `skel-${item.id}`}
      estimateHeight={estimateHeight}
      renderItem={(item) => <Skeleton.Card height={item.height} />}
    />
  )
}

export default Skeleton
