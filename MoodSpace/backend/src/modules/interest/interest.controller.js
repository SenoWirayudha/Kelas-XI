import { recordInterestEvent } from './interest.service.js'

export const recordEvent = async (req, res, next) => {
  try {
    await recordInterestEvent({
      userId: req.auth.sub,
      eventType: req.validated.body.eventType,
      tags: req.validated.body.tags,
      query: req.validated.body.query,
      projectId: req.validated.body.projectId,
      weight: req.validated.body.weight,
    })
    res.status(201).json({ recorded: true })
  } catch (error) {
    next(error)
  }
}
