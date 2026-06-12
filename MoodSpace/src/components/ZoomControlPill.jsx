import PropTypes from 'prop-types'

function ZoomControlPill({ 
  currentZoom, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom, 
  minZoom, 
  maxZoom,
  children 
}) {
  const zoomPercentage = Math.round(currentZoom * 100)
  const canZoomOut = currentZoom > minZoom
  const canZoomIn = currentZoom < maxZoom

  return (
    <div className="zoom-control-pill">
      {children}
      {children && <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />}
      <button
        className="zoom-btn"
        disabled={!canZoomOut}
        onClick={onZoomOut}
        aria-label="Zoom out"
        type="button"
      >
        −
      </button>
      <span
        className="zoom-percentage"
        onClick={onResetZoom}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onResetZoom()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Current zoom: ${zoomPercentage}%. Click to reset to 75%`}
      >
        {zoomPercentage}%
      </span>
      <button
        className="zoom-btn"
        disabled={!canZoomIn}
        onClick={onZoomIn}
        aria-label="Zoom in"
        type="button"
      >
        +
      </button>
    </div>
  )
}

ZoomControlPill.propTypes = {
  currentZoom: PropTypes.number.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onResetZoom: PropTypes.func.isRequired,
  minZoom: PropTypes.number.isRequired,
  maxZoom: PropTypes.number.isRequired,
  children: PropTypes.node,
}

export default ZoomControlPill
