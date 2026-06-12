import * as service from './reports.service.js'

export const createReport = async (req, res, next) => {
  try {
    const report = await service.createReport({
      postId: req.validated.body.postId,
      reporterId: req.auth.sub,
      reason: req.validated.body.reason,
      detail: req.validated.body.detail,
    })
    res.status(201).json({ report })
  } catch (error) {
    next(error)
  }
}
