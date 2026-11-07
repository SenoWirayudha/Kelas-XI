import * as service from './feedback.service.js'

export const createFeedback = async (req, res, next) => {
  try {
    const { category, message, contactEmail, pageUrl } = req.validated.body
    const user = req.auth ? { id: req.auth.sub, username: req.auth.username || null, email: req.auth.email || null } : null
    const ip = req.ip
    const userAgent = req.get('user-agent') || null
    const result = await service.createFeedback({ category, message, contactEmail, pageUrl, user, ip, userAgent })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}
