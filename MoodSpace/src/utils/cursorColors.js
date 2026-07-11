const PALETTE = [
  { bg: '#5fd0de', text: '#0c1a1e' },
  { bg: '#f4b6d2', text: '#1e0c14' },
  { bg: '#f4d37c', text: '#1e180c' },
  { bg: '#a06af6', text: '#0e081c' },
  { bg: '#6fcf97', text: '#0a1c10' },
  { bg: '#f2994a', text: '#1e1006' },
  { bg: '#eb5757', text: '#1e0a0a' },
  { bg: '#bb6bd9', text: '#160a1e' },
]

const hashUserId = (id) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const getCursorColor = (userId) => {
  const idx = hashUserId(userId) % PALETTE.length
  return PALETTE[idx]
}
