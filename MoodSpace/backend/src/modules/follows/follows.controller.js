import * as followService from './follows.service.js'

export const follow = async (req, res, next) => {
  try {
    const result = await followService.follow({
      followerId: req.auth.sub,
      followingId: req.params.userId,
    })
    return res.status(201).json(result)
  } catch (error) {
    return next(error)
  }
}

export const unfollow = async (req, res, next) => {
  try {
    const result = await followService.unfollow({
      followerId: req.auth.sub,
      followingId: req.params.userId,
    })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const status = async (req, res, next) => {
  try {
    const result = await followService.getFollowStatus({
      followerId: req.auth.sub,
      followingId: req.params.userId,
    })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const followers = async (req, res, next) => {
  try {
    const result = await followService.getFollowers({
      userId: req.params.userId,
      viewerId: req.auth.sub,
    })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const following = async (req, res, next) => {
  try {
    const result = await followService.getFollowing({
      userId: req.params.userId,
      viewerId: req.auth.sub,
    })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}
