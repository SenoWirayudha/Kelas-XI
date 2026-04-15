import { useEffect, useRef, useState } from 'react'
import IndonesiaSidoarjoMap from '../assets/Indonesia_Sidoarjo_Regency_location_map.svg?react'
import MapModal from './MapModal'
import './Map.css'

const SIDOARJO_KOTA_REGION = 'region-29'
const BUDURAN_REGION = 'region-8'
const PORONG_REGION = 'region-20'
const JABON_REGION = 'region-17'
const SEDATI_REGION = 'region-25'
const WARU_REGION = 'region-42'
const GEDANGAN_REGION = 'region-16'
const TAMAN_REGION = 'region-34'
const SUKODONO_REGION = 'region-33'
const KRIAN_REGION = 'region-19'
const BALONGBENDO_REGION = 'region-7'
const TARIK_REGION = 'region-40'
const PRAMBON_REGION = 'region-24'
const KREMBUNG_REGION = 'region-18'
const TANGGULANGIN_REGION = 'region-35'
const CANDI_REGION = 'region-11'
const TULANGAN_REGION = 'region-41'
const WONOAYU_REGION = 'region-45'
const NON_CLICKABLE_REGION_NAMES = new Set(['region-2', 'region-3'])
const JAYANDARU_IMAGE_URL = '/Jayandaru.png'
const MPU_IMAGE_URL = '/MPU.png'
const LUMPUR_LAPINDO_IMAGE_URL = '/Lumpur Lapindo.png'
const LUSI_IMAGE_URL = '/Lusi.png'
const TLOCOR_IMAGE_URL = '/Tlocor.png'
const REGION_DISPLAY_LABELS = {
  'region-29': 'Sidoarjo',
  'region-8': 'Buduran',
  'region-25': 'Sedati',
  'region-42': 'Waru',
  'region-16': 'Gedangan',
  'region-34': 'Taman',
  'region-33': 'Sukodono',
  'region-19': 'Krian',
  'region-7': 'Balongbendo',
  'region-40': 'Tarik',
  'region-24': 'Prambon',
  'region-18': 'Krembung',
  'region-20': 'Porong',
  'region-17': 'Jabon',
  'region-35': 'Tanggulangin',
  'region-11': 'Candi',
  'region-41': 'Tulangan',
  'region-45': 'Wonoayu',
}

const REGION_LABEL_OFFSETS = {
  'region-29': { dx: 0, dy: -40 },
  'region-8': { dx: 0, dy: -32 },
  'region-17': {dx: 0, dy: 18 },
  'region-25': { dx: 0, dy: 0 },
  'region-42': { dx: 0, dy: 0 },
  'region-16': { dx: 0, dy: 0 },
  'region-34': { dx: 0, dy: 0 },
  'region-33': { dx: 0, dy: 0 },
  'region-19': { dx: 0, dy: 0 },
  'region-7': { dx: 0, dy: 0 },
  'region-40': { dx: 0, dy: 0 },
  'region-24': { dx: 0, dy: 0 },
  'region-18': { dx: 0, dy: 0 },
  'region-20': { dx: 0, dy: 0 },
  'region-35': { dx: 0, dy: 0 },
  'region-11': { dx: 0, dy: 0 },
  'region-41': { dx: 0, dy: 0 },
  'region-45': { dx: 0, dy: 0 },
}

const REGION_MARKERS = {
  'region-29': [
    { imageUrl: JAYANDARU_IMAGE_URL, imageSize: 62, dx: 0, dy: -42 },
  ],
  'region-8': [
    { imageUrl: MPU_IMAGE_URL, imageSize: 70, dx: 0, dy: -32 },
  ],
  'region-20': [
    { imageUrl: LUMPUR_LAPINDO_IMAGE_URL, imageSize: 74, dx: 0, dy: -18 },
  ],
  'region-17': [
    { imageUrl: LUSI_IMAGE_URL, imageSize: 90, dx: 0, dy: 8 },
  ],
  'region-25': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-42': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-16': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-34': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-33': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-19': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-7': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-40': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-24': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-18': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-35': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-11': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-41': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
  'region-45': [
    { imageUrl: '', imageSize: 50, dx: 0, dy: -25 },
  ],
}

function Map() {
  const [selectedRegion, setSelectedRegion] = useState('')
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
  const [activeModalRegionName, setActiveModalRegionName] = useState('Sidoarjo')
  const mapContainerRef = useRef(null)

  useEffect(() => {
    if (!mapContainerRef.current) {
      return
    }

    const svgElement = mapContainerRef.current.querySelector('svg')
    if (svgElement) {
      svgElement.setAttribute('viewBox', '150 235 750 690')
    }

    const paths = Array.from(mapContainerRef.current.querySelectorAll('svg path'))
    const cleanups = []

    if (paths.length === 0) {
      console.warn('[Map] No <path> elements found in SVG.')
      return
    }

    const detectedRegions = paths.map((path, index) => {
      const existingId = path.id?.trim()
      const regionName = existingId || `region-${index + 1}`

      if (!existingId) {
        path.id = regionName
      }

      path.dataset.regionName = regionName
      path.dataset.regionIndex = String(index)
      path.classList.add('map-region')
      path.setAttribute('tabindex', '0')

      let centerX = 0
      let centerY = 0
      let boxWidth = 0
      let boxHeight = 0

      try {
        const bbox = path.getBBox()
        centerX = bbox.x + bbox.width / 2
        centerY = bbox.y + bbox.height / 2
        boxWidth = bbox.width
        boxHeight = bbox.height
      } catch {
        centerX = 0
        centerY = 0
        boxWidth = 0
        boxHeight = 0
      }

      return {
        index,
        name: regionName,
        fill: (path.getAttribute('fill') || '').toLowerCase(),
        parentGroup: path.closest('g')?.id || '',
        centerX,
        centerY,
        boxWidth,
        boxHeight,
      }
    })

    const clickableRegionSet = new Set(
      detectedRegions
        .filter((region) => {
          const groupLower = region.parentGroup.toLowerCase()
          const isDistrictArea =
            groupLower.includes('kecamatan') &&
            region.fill !== 'none' &&
            region.fill !== ''
          const isExcluded = NON_CLICKABLE_REGION_NAMES.has(region.name)

          return isDistrictArea && !isExcluded
        })
        .map((region) => region.name),
    )

    console.log(`[Map] Detected ${detectedRegions.length} paths.`)
    console.table(
      detectedRegions.map((region) => ({
        index: region.index,
        region: region.name,
        group: region.parentGroup,
        fill: region.fill,
      })),
    )

    detectedRegions.forEach((r) => {
  if (r.name === 'region-29' || r.name === 'region-8' || r.name === 'region-20') {
    console.log(`[Map] ${r.name} center: (${r.centerX.toFixed(1)}, ${r.centerY.toFixed(1)}) | size: ${r.boxWidth.toFixed(1)}x${r.boxHeight.toFixed(1)}`)
  }
})

    console.log('[Map] Non-clickable regions include:', ['region-2', 'region-3'])
    console.table(
      detectedRegions.map((region) => ({
        index: region.index,
        region: region.name,
        clickable: clickableRegionSet.has(region.name),
      })),
    )

    let regionLabelLayer = null

    if (svgElement) {
      const ns = 'http://www.w3.org/2000/svg'
      regionLabelLayer = document.createElementNS(ns, 'g')
      regionLabelLayer.setAttribute('class', 'map-region-label-layer')
      regionLabelLayer.setAttribute('pointer-events', 'none')

      detectedRegions.forEach((region) => {
        if (NON_CLICKABLE_REGION_NAMES.has(region.name)) {
          return
        }

        const labelText = REGION_DISPLAY_LABELS[region.name]
        if (!labelText) {
          return
        }

        const labelOffset = REGION_LABEL_OFFSETS[region.name] || {
          dx: 0,
          dy: 0,
        }

        if (region.boxWidth < 16 || region.boxHeight < 12) {
          return
        }

        const label = document.createElementNS(ns, 'text')
        label.setAttribute('x', String(region.centerX + labelOffset.dx))
        label.setAttribute('y', String(region.centerY + labelOffset.dy))
        label.setAttribute('text-anchor', 'middle')
        label.setAttribute('dominant-baseline', 'middle')
        label.setAttribute('class', 'map-region-name')
        label.textContent = labelText

        if (region.boxWidth < 42 || region.boxHeight < 24) {
          label.classList.add('map-region-name--small')
        }

        regionLabelLayer.appendChild(label)
      })

    }

    paths.forEach((path) => {
      const regionName = path.dataset.regionName || ''
      const regionIndex = path.dataset.regionIndex || ''
      const isClickable = clickableRegionSet.has(regionName)

      if (NON_CLICKABLE_REGION_NAMES.has(regionName)) {
        path.classList.add('map-region-removed')
        path.style.pointerEvents = 'none'
        path.removeAttribute('tabindex')
        return
      }

      if (!isClickable) {
        path.classList.add('map-region-disabled')
        path.style.pointerEvents = 'none'
        path.removeAttribute('tabindex')
        return
      }

      path.style.pointerEvents = 'auto'
      path.classList.remove('map-region-disabled')
      path.setAttribute('tabindex', '0')

      const selectRegion = () => {
        console.log(`[Map] clicked region: ${regionName} (index: ${regionIndex})`)
        setSelectedRegion(regionName)

        const regionNameMap = {
          [SIDOARJO_KOTA_REGION]: 'Sidoarjo',
          [BUDURAN_REGION]: 'Buduran',
          [PORONG_REGION]: 'Porong',
          [JABON_REGION]: 'Jabon',
          [SEDATI_REGION]: 'Sedati',
          [WARU_REGION]: 'Waru',
          [GEDANGAN_REGION]: 'Gedangan',
          [TAMAN_REGION]: 'Taman',
          [SUKODONO_REGION]: 'Sukodono',
          [KRIAN_REGION]: 'Krian',
          [BALONGBENDO_REGION]: 'Balongbendo',
          [TARIK_REGION]: 'Tarik',
          [PRAMBON_REGION]: 'Prambon',
          [KREMBUNG_REGION]: 'Krembung',
          [TANGGULANGIN_REGION]: 'Tanggulangin',
          [CANDI_REGION]: 'Candi',
          [TULANGAN_REGION]: 'Tulangan',
          [WONOAYU_REGION]: 'Wonoayu',
        }

        const modalRegionName = regionNameMap[regionName]
        if (modalRegionName) {
          setActiveModalRegionName(modalRegionName)
          setIsRegionModalOpen(true)
        }
      }
      const selectWithKeyboard = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          selectRegion()
        }
      }

      path.addEventListener('click', selectRegion)
      path.addEventListener('keydown', selectWithKeyboard)

      cleanups.push(() => {
        path.removeEventListener('click', selectRegion)
        path.removeEventListener('keydown', selectWithKeyboard)
      })
    })

    // Add floating marker images for configured regions.
    if (svgElement) {
      const placeRegionMarker = ({
        targetRegion,
        imageUrl,
        anchorXOffset = 0,
        anchorYOffset = 0,
        imageSize = 48,
      }) => {
        const targetPath = paths.find(
          (path) => path.dataset.regionName === targetRegion,
        )

        if (!targetPath) {
          return
        }

        try {
          const bbox = targetPath.getBBox()
          const centerX = bbox.x + bbox.width / 2
          const centerY = bbox.y + bbox.height / 2
          const anchorX = Math.round(centerX + anchorXOffset)
          const anchorY = Math.round(centerY + anchorYOffset)
          const ns = 'http://www.w3.org/2000/svg'

          const markerAnchorGroup = document.createElementNS(ns, 'g')
          markerAnchorGroup.setAttribute('class', 'map-marker-anchor')
          markerAnchorGroup.setAttribute('pointer-events', 'none')
          markerAnchorGroup.setAttribute(
            'transform',
            `translate(${anchorX}, ${anchorY})`,
          )

          const markerFloatGroup = document.createElementNS(ns, 'g')
          markerFloatGroup.setAttribute('class', 'map-marker-float')

          const markerImage = document.createElementNS(ns, 'image')
          markerImage.setAttribute('href', imageUrl)
          markerImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', imageUrl)
          const half = imageSize / 2
          markerImage.setAttribute('x', String(-half))
          markerImage.setAttribute('y', String(-half))
          markerImage.setAttribute('width', String(imageSize))
          markerImage.setAttribute('height', String(imageSize))
          markerImage.setAttribute('preserveAspectRatio', 'xMidYMid meet')
          markerImage.setAttribute('image-rendering', 'optimizeQuality')

          markerFloatGroup.appendChild(markerImage)

          console.info(`[Map] Marker ${targetRegion} uses image:`, imageUrl)

          markerAnchorGroup.appendChild(markerFloatGroup)
          svgElement.appendChild(markerAnchorGroup)

          cleanups.push(() => {
            markerAnchorGroup.remove()
          })
        } catch {
          console.warn(`[Map] Failed to place marker on ${targetRegion}.`)
        }
      }

      Object.entries(REGION_MARKERS).forEach(([regionName, markerList]) => {
        markerList.forEach((marker) => {
          placeRegionMarker({
            targetRegion: regionName,
            imageUrl: marker.imageUrl,
            anchorXOffset: marker.dx || 0,
            anchorYOffset: marker.dy || 0,
            imageSize: marker.imageSize || 48,
          })
        })
      })

      if (regionLabelLayer) {
        // Append labels after markers so text stays above images.
        svgElement.appendChild(regionLabelLayer)
        cleanups.push(() => {
          regionLabelLayer.remove()
        })
      }
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current) {
      return
    }

    const paths = mapContainerRef.current.querySelectorAll('svg path')

    paths.forEach((path) => {
  const isSelected = path.dataset.regionName === selectedRegion
  path.classList.toggle('is-selected', isSelected)

  // Reset fill inline supaya CSS bisa override
  if (isSelected) {
    path.style.fill = ''  // hapus inline fill biar CSS class yang kontrol
  }

  const isSidoarjoRegion = path.dataset.regionName === SIDOARJO_KOTA_REGION
  path.classList.toggle('is-sidoarjo-kota', isSidoarjoRegion)
})
  }, [selectedRegion])

  return (
    <section className="map-shell">
      <div className="map-svg-wrapper" ref={mapContainerRef} aria-label="Peta interaktif Sidoarjo">
        <IndonesiaSidoarjoMap className="indo-map-svg" />
      </div>

      <MapModal
        open={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        regionName={activeModalRegionName}
      />
    </section>
  )
}



export default Map
