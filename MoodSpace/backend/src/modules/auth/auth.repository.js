import { query } from '../../db/pool.js'

const userSelect = `
  select
    u.id,
    u.email,
    u.username,
    u.display_name as "displayName",
    u.role,
    u.status,
    u.email_verified_at as "emailVerifiedAt",
    u.last_login_at as "lastLoginAt",
    u.created_at as "createdAt",
    p.bio,
    p.website_url as "websiteUrl",
    p.location,
    p.social_links as "socialLinks",
    p.profile_metadata as "profileMetadata",
    p.avatar_media_id as "avatarMediaId",
    p.banner_media_id as "bannerMediaId",
    ma.public_url as "avatarUrl",
    mb.public_url as "bannerUrl"
  from users u
  left join user_profiles p on p.user_id = u.id
  left join media_assets ma on ma.id = p.avatar_media_id and ma.deleted_at is null
  left join media_assets mb on mb.id = p.banner_media_id and mb.deleted_at is null
`

export const findUserByEmailOrUsername = async (identifier) => {
  const { rows } = await query(
    `${userSelect}
     where lower(u.email) = lower($1) or lower(u.username) = lower($1)
     limit 1`,
    [identifier],
  )
  return rows[0] || null
}

export const findUserById = async (id) => {
  const { rows } = await query(
    `${userSelect}
     where u.id = $1
     limit 1`,
    [id],
  )
  return rows[0] || null
}

export const findUserByUsername = async (username) => {
  const { rows } = await query(
    `${userSelect}
     where lower(u.username) = lower($1)
     limit 1`,
    [username],
  )
  return rows[0] || null
}

export const searchUsersByEmail = async (searchTerm, excludeUserId) => {
  const { rows } = await query(
    `select
       u.id,
       u.email,
       u.username,
       u.display_name as "displayName",
       ma.public_url as "avatarUrl"
     from users u
     left join user_profiles up on up.user_id = u.id
     left join media_assets ma on ma.id = up.avatar_media_id and ma.deleted_at is null
     where u.email_verified_at is not null
       and u.id != $2
       and (lower(u.email) like lower($1) or lower(u.username) like lower($1))
     order by
       case
         when lower(u.email) = lower($1) then 0
         when lower(u.username) = lower($1) then 1
         else 2
       end,
       u.created_at desc
     limit 10`,
    [`%${searchTerm}%`, excludeUserId],
  )
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    username: r.username,
    displayName: r.displayName,
    profile: {
      avatarUrl: r.avatarUrl || null,
    },
  }))
}

export const findPasswordAuthByUserId = async (userId) => {
  const { rows } = await query(
    `select
       ua.user_id as "userId",
       ua.password_hash as "passwordHash",
       ua.locked_until as "lockedUntil",
       u.email,
       u.username
     from user_auth ua
     join users u on u.id = ua.user_id
     where ua.user_id = $1`,
    [userId],
  )
  return rows[0] || null
}

export const updatePassword = async (userId, passwordHash) => {
  const { rows } = await query(
    'update user_auth set password_hash = $2 where user_id = $1 returning user_id as "userId"',
    [userId, passwordHash],
  )
  return rows[0] || null
}

export const createUserWithPassword = async (client, { email, username, displayName, passwordHash }) => {
  const userResult = await client.query(
    `insert into users (email, username, display_name, email_verified_at)
     values ($1, $2, $3, now())
     returning id, email, username, display_name as "displayName", role, status, created_at as "createdAt"`,
    [email, username, displayName || username],
  )
  const user = userResult.rows[0]

  await client.query(
    'insert into user_auth (user_id, password_hash) values ($1, $2)',
    [user.id, passwordHash],
  )

  await client.query(
    'insert into user_profiles (user_id) values ($1)',
    [user.id],
  )

  return user
}

export const recordSuccessfulLogin = async (userId) => {
  await query(
    `update users set last_login_at = now(), updated_at = now() where id = $1`,
    [userId],
  )
}

export const createSession = async ({ userId, refreshTokenHash, expiresAt, deviceName, ipAddress, userAgent }) => {
  const { rows } = await query(
    `insert into auth_sessions (user_id, refresh_token_hash, expires_at, device_name, ip_address, user_agent)
     values ($1, $2, $3, $4, $5, $6)
     returning id, user_id as "userId", expires_at as "expiresAt", created_at as "createdAt"`,
    [userId, refreshTokenHash, expiresAt, deviceName || null, ipAddress || null, userAgent || null],
  )
  return rows[0]
}

export const findActiveSessionByRefreshHash = async (refreshTokenHash) => {
  const { rows } = await query(
    `select
       id,
       user_id as "userId",
       expires_at as "expiresAt",
       revoked_at as "revokedAt"
     from auth_sessions
     where refresh_token_hash = $1
       and revoked_at is null
       and expires_at > now()
     limit 1`,
    [refreshTokenHash],
  )
  return rows[0] || null
}

export const rotateSessionRefreshToken = async ({ sessionId, refreshTokenHash, expiresAt }) => {
  const { rows } = await query(
    `update auth_sessions
     set refresh_token_hash = $2,
         expires_at = $3,
         last_used_at = now()
     where id = $1
       and revoked_at is null
     returning id, user_id as "userId", expires_at as "expiresAt"`,
    [sessionId, refreshTokenHash, expiresAt],
  )
  return rows[0] || null
}

export const revokeSessionByRefreshHash = async (refreshTokenHash) => {
  await query(
    `update auth_sessions
     set revoked_at = now()
     where refresh_token_hash = $1
       and revoked_at is null`,
    [refreshTokenHash],
  )
}

export const updateProfile = async (userId, patch) => {
  const userFields = []
  const userValues = [userId]
  if (patch.displayName !== undefined) {
    userValues.push(patch.displayName)
    userFields.push(`display_name = $${userValues.length}`)
  }
  if (patch.username !== undefined) {
    userValues.push(patch.username)
    userFields.push(`username = $${userValues.length}`)
  }

  if (userFields.length) {
    await query(
      `update users
       set ${userFields.join(', ')}, updated_at = now()
       where id = $1`,
      userValues,
    )
  }

  const profileFields = []
  const values = [userId]
  const fieldMap = {
    bio: 'bio',
    websiteUrl: 'website_url',
    location: 'location',
    avatarMediaId: 'avatar_media_id',
    bannerMediaId: 'banner_media_id',
    socialLinks: 'social_links',
  }

  for (const [inputKey, column] of Object.entries(fieldMap)) {
    if (patch[inputKey] !== undefined) {
      values.push(inputKey === 'socialLinks' ? JSON.stringify(patch[inputKey]) : patch[inputKey])
      profileFields.push(`${column} = $${values.length}`)
    }
  }

  if (patch.profileMetadata !== undefined) {
    values.push(JSON.stringify(patch.profileMetadata))
    profileFields.push(`profile_metadata = profile_metadata || $${values.length}::jsonb`)
  }

  if (profileFields.length) {
    await query(
      `update user_profiles
       set ${profileFields.join(', ')}, updated_at = now()
       where user_id = $1`,
      values,
    )
  }

  return findUserById(userId)
}

export const createPasswordReset = async ({ userId, purpose, tokenHash, expiresAt }) => {
  const { rows } = await query(
    `insert into password_resets (user_id, purpose, token_hash, expires_at)
     values ($1, $2, $3, $4)
     returning id`,
    [userId, purpose, tokenHash, expiresAt],
  )
  return rows[0] || null
}

export const findValidResetToken = async ({ tokenHash, purpose }) => {
  const { rows } = await query(
    `select
       id,
       user_id as "userId",
       purpose,
       expires_at as "expiresAt",
       attempts,
       used
     from password_resets
     where token_hash = $1
       and purpose = $2
       and used = false
       and expires_at > now()
     limit 1`,
    [tokenHash, purpose],
  )
  return rows[0] || null
}

export const incrementAttempt = async (id) => {
  const { rows } = await query(
    `update password_resets
     set attempts = attempts + 1
     where id = $1
     returning attempts`,
    [id],
  )
  return rows[0] || null
}

export const markTokenUsed = async (id) => {
  await query(
    `update password_resets set used = true where id = $1`,
    [id],
  )
}

export const invalidateUserTokens = async ({ userId, purpose }) => {
  await query(
    `update password_resets
     set used = true
     where user_id = $1
       and purpose = $2
       and used = false`,
    [userId, purpose],
  )
}

export const countRecentResetRequests = async ({ userId, purpose }) => {
  const { rows } = await query(
    `select count(*) as count
     from password_resets
     where user_id = $1
       and purpose = $2
       and created_at > now() - interval '1 hour'`,
    [userId, purpose],
  )
  return parseInt(rows[0]?.count || '0', 10)
}
