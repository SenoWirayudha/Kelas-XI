import { useEffect, useRef } from 'react'
import { Image as KonvaImage, Shape } from 'react-konva'

const isolateChannel = (data, ch, nw, nh) => {
  const buf = new Uint8ClampedArray(data.length)
  for (let i = 0; i < data.length; i += 4) {
    buf[i]   = ch === 0 ? data[i]   : 0
    buf[i+1] = ch === 1 ? data[i+1] : 0
    buf[i+2] = ch === 2 ? data[i+2] : 0
    buf[i+3] = data[i+3]
  }
  return new ImageData(buf, nw, nh)
}

const dataToCanvas = (imgData) => {
  const c = document.createElement('canvas')
  c.width = imgData.width; c.height = imgData.height
  c.getContext('2d').putImageData(imgData, 0, 0)
  return c
}

export default function RgbSplitImage({ image, rgbSplit, imageRef, x = 0, y = 0, width, height, ...rest }) {
  const rgbLayersRef = useRef(null)
  const channelCacheRef = useRef(null)

  useEffect(() => {
    if (!rgbSplit || !image || !image.complete || !image.naturalWidth) {
      rgbLayersRef.current = null
      return
    }

    const nw = image.naturalWidth
    const nh = image.naturalHeight

    if (!channelCacheRef.current || channelCacheRef.current.src !== image.src) {
      const srcCanvas = document.createElement('canvas')
      srcCanvas.width = nw; srcCanvas.height = nh
      const srcCtx = srcCanvas.getContext('2d')
      if (!srcCtx) return
      srcCtx.drawImage(image, 0, 0, nw, nh)
      const d = srcCtx.getImageData(0, 0, nw, nh).data

      channelCacheRef.current = {
        src: image.src,
        r: dataToCanvas(isolateChannel(d, 0, nw, nh)),
        g: dataToCanvas(isolateChannel(d, 1, nw, nh)),
        b: dataToCanvas(isolateChannel(d, 2, nw, nh)),
      }
    }

    const pixelOffset = (rgbSplit.offset ?? 0.01) * Math.max(nw, nh)
    const angleRad = (rgbSplit.angle ?? 0) * Math.PI / 180
    const dxSrc = Math.cos(angleRad) * pixelOffset
    const dySrc = Math.sin(angleRad) * pixelOffset
    const scX = width / nw
    const scY = height / nh
    const dxDisp = dxSrc * scX
    const dyDisp = dySrc * scY

    const { r, g, b } = channelCacheRef.current
    const m = rgbSplit.mode ?? 'g'
    let center, left, right
    if (m === 'g') { center = g; left = b; right = r }
    else if (m === 'r') { center = r; left = b; right = g }
    else { center = b; left = g; right = r }

    rgbLayersRef.current = { center, left, right, dxDisp, dyDisp }
  }, [image, rgbSplit?.offset, rgbSplit?.angle, rgbSplit?.mode, width, height])

  if (!rgbSplit || !rgbLayersRef.current) {
    return <KonvaImage ref={imageRef} image={image} x={x} y={y} width={width} height={height} {...rest} />
  }

  const ref = rgbLayersRef.current
  return (
    <>
      <KonvaImage ref={imageRef} image={ref.center} x={x} y={y} width={width} height={height} {...rest} />
      <Shape
        sceneFunc={(ctx) => {
          ctx.save()
          ctx.globalCompositeOperation = 'screen'
          ctx.drawImage(ref.left, x - ref.dxDisp, y - ref.dyDisp, width, height)
          ctx.drawImage(ref.right, x + ref.dxDisp, y + ref.dyDisp, width, height)
          ctx.restore()
        }}
        listening={false}
        perfectDrawEnabled={false}
      />
    </>
  )
}
