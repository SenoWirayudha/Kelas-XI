import { calculateCoverFit, getFrameImageCropBounds } from '../../utils/frameUtils'

export const useFrameCrop = ({ image, slot, fit = 'cover', crop, zoom = 1 }) => {
  if (!image || !slot) return { fit: null, bounds: null }

  return {
    fit: calculateCoverFit({
      imageWidth: image.width,
      imageHeight: image.height,
      slot,
      fit,
      crop,
      zoom,
    }),
    bounds: getFrameImageCropBounds({
      imageWidth: image.width,
      imageHeight: image.height,
      slot,
      fit,
      zoom,
    }),
  }
}
