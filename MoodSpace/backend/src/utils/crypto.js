import crypto from 'crypto'

export const createRandomToken = (bytes = 48) => crypto.randomBytes(bytes).toString('base64url')

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
