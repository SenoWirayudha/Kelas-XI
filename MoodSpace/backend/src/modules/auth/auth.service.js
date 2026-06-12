import argon2 from 'argon2'
import { withTransaction } from '../../db/pool.js'
import { signAccessToken } from '../../config/jwt.js'
import { env } from '../../config/env.js'
import { addDays, createRandomToken, hashToken } from '../../utils/crypto.js'
import { AppError, conflict, unauthorized } from '../../utils/errors.js'
import { deleteMedia, getOwnedReadyMedia } from '../media/media.service.js'
import {
  createSession,
  createUserWithPassword,
  findActiveSessionByRefreshHash,
  findPasswordAuthByUserId,
  findUserByEmailOrUsername,
  findUserById,
  findUserByUsername,
  recordSuccessfulLogin,
  revokeSessionByRefreshHash,
  rotateSessionRefreshToken,
  updatePassword,
  updateProfile,
} from './auth.repository.js'

const publicUser = (user) => {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    profile: {
      bio: user.bio ?? null,
      websiteUrl: user.websiteUrl ?? null,
      location: user.location ?? null,
      socialLinks: user.socialLinks ?? {},
      metadata: user.profileMetadata ?? {},
      avatarMediaId: user.avatarMediaId ?? null,
      bannerMediaId: user.bannerMediaId ?? null,
      avatarUrl: user.avatarUrl ?? null,
      bannerUrl: user.bannerUrl ?? null,
    },
    createdAt: user.createdAt,
  }
}

const createRefreshSession = async ({ userId, req }) => {
  const refreshToken = createRandomToken()
  const refreshTokenHash = hashToken(refreshToken)
  const expiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS)

  const session = await createSession({
    userId,
    refreshTokenHash,
    expiresAt,
    deviceName: null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })

  return { refreshToken, session }
}

const issueTokens = async ({ user, req }) => {
  const accessToken = signAccessToken(user)
  const { refreshToken, session } = await createRefreshSession({ userId: user.id, req })

  return {
    accessToken,
    refreshToken,
    session,
  }
}

export const register = async ({ email, username, password, displayName }, req) => {
  const existing = await findUserByEmailOrUsername(email)
  if (existing) throw conflict('Email is already registered')

  const existingUsername = await findUserByEmailOrUsername(username)
  if (existingUsername) throw conflict('Username is already taken')

  const passwordHash = await argon2.hash(password)

  const user = await withTransaction((client) => (
    createUserWithPassword(client, {
      email,
      username,
      displayName,
      passwordHash,
    })
  ))

  const tokens = await issueTokens({ user, req })

  return {
    user: publicUser(user),
    ...tokens,
  }
}

export const login = async ({ identifier, password }, req) => {
  const user = await findUserByEmailOrUsername(identifier)
  if (!user || user.status !== 'active') throw unauthorized('Invalid credentials')

  const auth = await findPasswordAuthByUserId(user.id)
  if (!auth) throw unauthorized('Invalid credentials')

  if (auth.lockedUntil && new Date(auth.lockedUntil) > new Date()) {
    throw new AppError('Account is temporarily locked', {
      status: 423,
      code: 'ACCOUNT_LOCKED',
    })
  }

  const valid = await argon2.verify(auth.passwordHash, password)
  if (!valid) throw unauthorized('Invalid credentials')

  await recordSuccessfulLogin(user.id)
  const tokens = await issueTokens({ user, req })

  return {
    user: publicUser(user),
    ...tokens,
  }
}

export const refresh = async (refreshToken) => {
  if (!refreshToken) throw unauthorized('Refresh token is required')

  const currentHash = hashToken(refreshToken)
  const session = await findActiveSessionByRefreshHash(currentHash)
  if (!session) throw unauthorized('Invalid or expired refresh token')

  const user = await findUserById(session.userId)
  if (!user || user.status !== 'active') throw unauthorized('Invalid session')

  const nextRefreshToken = createRandomToken()
  const nextRefreshTokenHash = hashToken(nextRefreshToken)
  const expiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS)

  const rotated = await rotateSessionRefreshToken({
    sessionId: session.id,
    refreshTokenHash: nextRefreshTokenHash,
    expiresAt,
  })
  if (!rotated) throw unauthorized('Invalid session')

  return {
    user: publicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: nextRefreshToken,
    session: rotated,
  }
}

export const logout = async (refreshToken) => {
  if (!refreshToken) return
  await revokeSessionByRefreshHash(hashToken(refreshToken))
}

export const me = async (userId) => {
  const user = await findUserById(userId)
  if (!user) throw unauthorized('User no longer exists')
  return publicUser(user)
}

export const patchProfile = async (userId, patch) => {
  if (patch.username) {
    const existing = await findUserByUsername(patch.username)
    if (existing && existing.id !== userId) throw conflict('Username is already taken')
  }

  const currentAvatarMediaId = patch.avatarMediaId !== undefined ? (await findUserById(userId))?.avatarMediaId : undefined
  const currentBannerMediaId = patch.bannerMediaId !== undefined ? (await findUserById(userId))?.bannerMediaId : undefined

  if (patch.avatarMediaId) await getOwnedReadyMedia({ userId, mediaId: patch.avatarMediaId })
  if (patch.bannerMediaId) await getOwnedReadyMedia({ userId, mediaId: patch.bannerMediaId })

  if (patch.avatarMediaId !== undefined && currentAvatarMediaId) {
    await deleteMedia({ userId, mediaId: currentAvatarMediaId }).catch(() => {})
  }
  if (patch.bannerMediaId !== undefined && currentBannerMediaId) {
    await deleteMedia({ userId, mediaId: currentBannerMediaId }).catch(() => {})
  }

  const user = await updateProfile(userId, patch)
  return publicUser(user)
}

export const changePassword = async (userId, currentPassword, newPassword) => {
  const auth = await findPasswordAuthByUserId(userId)
  if (!auth) throw unauthorized('Password not set for this account')

  const valid = await argon2.verify(auth.passwordHash, currentPassword)
  if (!valid) throw unauthorized('Current password is incorrect')

  const newHash = await argon2.hash(newPassword)
  const result = await updatePassword(userId, newHash)
  if (!result) throw new AppError('Failed to update password', 500)
  return { ok: true }
}
