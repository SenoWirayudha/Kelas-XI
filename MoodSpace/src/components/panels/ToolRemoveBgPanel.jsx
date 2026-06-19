import { ArrowLeft } from 'lucide-react'

export default function ToolRemoveBgPanel({
  selectedItem,
  onProcess,
  isProcessing,
  progress,
  onBack,
  onCancel,
}) {
  const canProcess = selectedItem?.kind === 'image' && !isProcessing

  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        {onBack && (
          <button type="button" className="workspace-back-button" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
        )}
        <span className="panel-title">Remove Background</span>
      </div>

      <div className="panel-section">
        <p className="panel-hint">
          Removes the background from an image using AI, then uploads the result to the server.
        </p>
      </div>

      {!selectedItem && (
        <div className="panel-section">
          <p className="panel-hint" style={{ color: '#f87171' }}>
            Select an image first.
          </p>
        </div>
      )}

      {selectedItem && selectedItem.kind !== 'image' && (
        <div className="panel-section">
          <p className="panel-hint" style={{ color: '#f87171' }}>
            This tool only works on images.
          </p>
        </div>
      )}

      <div className="panel-section">
        <p className="panel-hint">
          A duplicate with offset will be created.
        </p>
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className="panel-btn panel-btn-primary"
          disabled={!canProcess}
          onClick={onProcess}
        >
          {isProcessing ? 'Processing...' : 'Remove Background'}
        </button>
      </div>

      {isProcessing && (
        <div className="panel-section">
          {progress ? (
            <>
              <div className="panel-progress-bar">
                <div className="panel-progress-fill" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }} />
              </div>
              <p className="panel-hint">
                {progress.phase === 'loading model' && 'Loading AI model (~40MB)...'}
                {progress.phase === 'processing' && `Removing background... ${progress.current}/${progress.total}`}
                {progress.phase === 'uploading' && `Uploading result... ${progress.current}%`}
              </p>
            </>
          ) : (
            <>
              <div className="panel-progress-bar">
                <div className="panel-progress-fill indeterminate" />
              </div>
              <p className="panel-hint">Starting...</p>
            </>
          )}
          <button
            type="button"
            className="panel-btn panel-btn-ghost"
            style={{ marginTop: 8 }}
            onClick={onCancel}
          >
            Batalkan
          </button>
        </div>
      )}
    </div>
  )
}
