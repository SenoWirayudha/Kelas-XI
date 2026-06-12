import * as repo from './follows.repository.js'
import { insertNotification } from '../notifications/notifications.repository.js'
import { badRequest, conflict, notFound } from '../../utils/errors.js'

export const getFollowStatus = async ({ followerId, followingId }) => {
  const isFollowing = await repo.findFollow({ followerId, followingId })
  return { isFollowing }
}

export const follow = async ({ followerId, followingId }) => {
  if (followerId === followingId) throw badRequest('Cannot follow yourself')

  const existing = await repo.findFollow({ followerId, followingId })
  if (existing) throw conflict('Already following this user')

  const result = await repo.insertFollow({ followerId, followingId })
  if (!result) throw notFound('User not found')

  await insertNotification({
    userId: followingId,
    actorId: followerId,
    type: 'follow',
    targetType: 'user',
    targetId: followerId,
    metadata: {},
  })

  return result
}

export const unfollow = async ({ followerId, followingId }) => {
  if (followerId === followingId) throw badRequest('Cannot unfollow yourself')

  const result = await repo.deleteFollow({ followerId, followingId })
  if (!result) throw notFound('Not following this user')
  return result
}

export const getFollowers = async ({ userId, viewerId }) => {
  const items = await repo.findFollowers({ userId, viewerId })
  return { items, total: items.length }
}

export const getFollowing = async ({ userId, viewerId }) => {
  const items = await repo.findFollowing({ userId, viewerId })
  return { items, total: items.length }
}
