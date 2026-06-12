import { verifyAccessToken } from '../config/jwt.js'
import { unauthorized } from '../utils/errors.js'

const getBearerToken = (req) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length)
}

export const authRequired = (req, res, next) => {
  const token = getBearerToken(req)
  if (!token) return next(unauthorized())

  try {
    req.auth = verifyAccessToken(token)
    return next()
  } catch {
    return next(unauthorized('Invalid or expired access token'))
  }
}

export const optionalAuth = (req, res, next) => {
  const token = getBearerToken(req)
  if (!token) return next()

  try {
    req.auth = verifyAccessToken(token)
  } catch {
    req.auth = null
  }

  return next()
}
