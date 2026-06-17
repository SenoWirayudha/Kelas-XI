import * as service from './reports.service.js'

export const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, postId, reason, detail } = req.validated.body
    const report = await service.createReport({
      targetType: targetType || (postId ? 'post' : undefined),
      targetId: targetId || postId,
      reporterId: req.auth.sub,
      reason,
      detail,
    })
    res.status(201).json({ report })
  } catch (error) {
    console.error('[REPORT ERROR]', error.constructor?.name, error.message, error.stack?.split('\n')[0])
    next(error)
  }
}
