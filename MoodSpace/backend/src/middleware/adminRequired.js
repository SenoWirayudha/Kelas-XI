import { authRequired } from './authRequired.js'
import { forbidden } from '../utils/errors.js'

export const adminRequired = (req, res, next) => {
  authRequired(req, res, (err) => {
    if (err) return next(err)
    if (req.auth?.role !== 'admin') return next(forbidden('Admin access required'))
    return next()
  })
}
