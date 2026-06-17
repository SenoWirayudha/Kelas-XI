import { verifyAccessToken } from '../config/jwt.js'
import { query } from '../db/pool.js'
import { unauthorized, forbidden } from '../utils/errors.js'

const getBearerToken = (req) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length)
}

export const authRequired = async (req, res, next) => {
  const token = getBearerToken(req)
  if (!token) return next(unauthorized())

  try {
    req.auth = verifyAccessToken(token)

    const { rows } = await query('select status from users where id = $1', [req.auth.sub])
    if (!rows.length) return next(unauthorized('User not found'))
    if (rows[0].status === 'banned') return next(forbidden('Akun anda terkena banned'))

    return next()
  } catch (error) {
    if (error.status) return next(error)
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
