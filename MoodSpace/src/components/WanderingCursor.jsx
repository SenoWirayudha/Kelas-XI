import { useCallback, useEffect, useRef } from 'react'

const PAUSE_MIN = 1500
const PAUSE_MAX = 2000
const MOVE_TIME = 2200

function getCardCenters(hero) {
  const heroRect = hero.getBoundingClientRect()
  const cards = hero.querySelectorAll('.landing-hero-card')
  const centers = []
  cards.forEach((c) => {
    const r = c.getBoundingClientRect()
    centers.push({
      x: r.left + r.width / 2 - heroRect.left,
      y: r.top + r.height / 2 - heroRect.top,
    })
  })
  return centers
}

function revealSelection(cardIndex, hero) {
  const cards = hero.querySelectorAll('.landing-hero-card')
  const card = cards[cardIndex]
  if (!card) return
  card.classList.add('landing-hero-card--cursor-active')
  const avatar = card.querySelector('.landing-hero-card-avatar')
  const handles = card.querySelectorAll('.landing-hero-handle')
  const toolbar = card.querySelector('.landing-hero-card-toolbar')

  avatar.style.transition = 'none'
  avatar.style.opacity = '0'
  avatar.style.scale = '0'
  avatar.style.transition = 'opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
  requestAnimationFrame(() => {
    avatar.style.transitionDelay = '0ms'
    avatar.style.opacity = '1'
    avatar.style.scale = '1'
  })

  handles.forEach((h, i) => {
    h.style.transition = 'none'
    h.style.opacity = '0'
    h.style.scale = '0'
    h.style.transition = 'opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
    requestAnimationFrame(() => {
      h.style.transitionDelay = `${i * 35}ms`
      h.style.opacity = '1'
      h.style.scale = '1'
    })
  })
  if (toolbar) {
    toolbar.style.transition = 'none'
    toolbar.style.opacity = '0'
    toolbar.style.transform = ''
    toolbar.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'
    requestAnimationFrame(() => {
      toolbar.style.transitionDelay = `${handles.length * 35 + 120}ms`
      toolbar.style.opacity = '1'
      toolbar.style.transform = 'translateX(-50%) translateY(0)'
    })
  }
}

function hideSelection(cardIndex, hero) {
  const cards = hero.querySelectorAll('.landing-hero-card')
  const card = cards[cardIndex]
  if (!card) return
  card.classList.remove('landing-hero-card--cursor-active')
  const avatar = card.querySelector('.landing-hero-card-avatar')
  const handles = card.querySelectorAll('.landing-hero-handle')
  const toolbar = card.querySelector('.landing-hero-card-toolbar')

  avatar.style.transition = 'opacity 0.15s ease-out, scale 0.15s ease-out'
  avatar.style.transitionDelay = '0ms'
  avatar.style.opacity = '0'
  avatar.style.scale = '0'

  handles.forEach((h) => {
    h.style.transition = 'opacity 0.15s ease-out, scale 0.15s ease-out'
    h.style.transitionDelay = '0ms'
    h.style.opacity = '0'
    h.style.scale = '0'
  })
  if (toolbar) {
    toolbar.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out'
    toolbar.style.transitionDelay = '0ms'
    toolbar.style.opacity = '0'
    toolbar.style.transform = 'translateX(-50%) translateY(6px)'
  }
}

function bounceCursor(el) {
  if (!el) return
  el.classList.remove('landing-hero-wandering-cursor-inner--bounce')
  void el.offsetWidth
  el.classList.add('landing-hero-wandering-cursor-inner--bounce')
}

function WanderingCursor({ heroRef }) {
  const posRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const elRef = useRef(null)
  const innerRef = useRef(null)
  const phaseRef = useRef('init')
  const phaseStartRef = useRef(0)
  const originRef = useRef({ x: 0, y: 0 })
  const pauseTimerRef = useRef(null)
  const cardIndexRef = useRef(0)

  const scheduleNext = useCallback(() => {
    const hero = heroRef.current
    if (!hero) return
    const centers = getCardCenters(hero)
    if (centers.length < 2) return

    const prev = cardIndexRef.current
    hideSelection(prev, hero)
    let next
    do {
      next = Math.floor(Math.random() * centers.length)
    } while (next === prev && centers.length > 1)
    cardIndexRef.current = next

    const t = centers[next]
    targetRef.current = t
    originRef.current = { ...posRef.current }
    phaseRef.current = 'moving'
    phaseStartRef.current = performance.now()
  }, [heroRef])

    const onArrive = useCallback((idx) => {
    const hero = heroRef.current
    if (!hero) return
    bounceCursor(innerRef.current)
    setTimeout(() => revealSelection(idx, hero), 50)
  }, [heroRef])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const centers = getCardCenters(hero)
    if (centers.length > 0) {
      const init = centers[0]
      cardIndexRef.current = 0
      posRef.current = { ...init }
      targetRef.current = { ...init }
      if (elRef.current) {
        elRef.current.style.transform = `translate(${init.x}px, ${init.y}px)`
      }
    }

    let raf
    const tick = (now) => {
      const elapsed = now - phaseStartRef.current

      if (phaseRef.current === 'init' && centers.length > 1) {
        phaseRef.current = 'moving'
        phaseStartRef.current = now
        originRef.current = { ...posRef.current }
        scheduleNext()
      } else if (phaseRef.current === 'moving') {
        const t = Math.min(elapsed / MOVE_TIME, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        posRef.current.x = originRef.current.x + (targetRef.current.x - originRef.current.x) * ease
        posRef.current.y = originRef.current.y + (targetRef.current.y - originRef.current.y) * ease
        if (t >= 1) {
          posRef.current = { ...targetRef.current }
          onArrive(cardIndexRef.current)
          phaseRef.current = 'pausing'
          phaseStartRef.current = now
          const pause = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN)
          pauseTimerRef.current = setTimeout(() => {
            const c = getCardCenters(hero)
            if (c.length > 0) {
              originRef.current = { ...posRef.current }
              scheduleNext()
            }
          }, pause)
        }
      }

      if (elRef.current) {
        elRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`
      }
      raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      const c = getCardCenters(hero)
      if (c.length > 0) {
        cardIndexRef.current = 0
        const clamped = { ...c[0] }
        posRef.current = clamped
        targetRef.current = { ...clamped }
        originRef.current = { ...clamped }
      }
    }

    window.addEventListener('resize', onResize)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(pauseTimerRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [heroRef, scheduleNext, onArrive])

  return (
    <div ref={elRef} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 10 }}>
      <div className="landing-hero-wandering-cursor-inner" ref={innerRef}>
        <span className="landing-hero-cursor-arrow">➤</span>
        <span className="workspace-remote-cursor-label" style={{ background: '#f4b6d2', color: '#1e0c14' }}>Rian</span>
      </div>
    </div>
  )
}

export default WanderingCursor
