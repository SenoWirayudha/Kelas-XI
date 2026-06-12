import * as service from './profiles.service.js'

export const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await service.getPublicProfile({
      username: req.validated.params.username,
      viewerId: req.auth?.sub || null,
    })
    res.json({ profile })
  } catch (error) {
    next(error)
  }
}
