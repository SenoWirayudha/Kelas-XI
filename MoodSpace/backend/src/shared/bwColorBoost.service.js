// Re-export dari styleBoost.service.js untuk backward compatibility
export {
  enrichForClipRerank,
  detectBwQuery,
  applySaturationBoost,
  applyStyleBoost,
  applyColorBoost,
  applyStyleSimilarityBoost,
  detectStyle,
  detectColors,
  computeStyleMetrics,
  BW_RERANK_WORDS,
  BW_SAT_KEYWORDS,
  SATURATION_BOOST_MAX,
  STYLES,
  applyEngagementTiebreak,
} from './styleBoost.service.js'
