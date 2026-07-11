import { query } from '../../db/pool.js'

const collaboratorSelect = `
  select
    wc.workspace_id as "workspaceId",
    wc.user_id as "userId",
    wc.role,
    wc.invited_by as "invitedBy",
    wc.invited_at as "invitedAt",
    wc.updated_at as "updatedAt",
    u.id as "userId",
    u.email,
    u.username,
    u.display_name as "displayName",
    ma.public_url as "avatarUrl"
  from workspace_collaborators wc
  join users u on u.id = wc.user_id
  left join user_profiles up on up.user_id = u.id
  left join media_assets ma on ma.id = up.avatar_media_id and ma.deleted_at is null
`

export const findCollaborator = async (workspaceId, userId) => {
  const { rows } = await query(
    `${collaboratorSelect}
     where wc.workspace_id = $1 and wc.user_id = $2
     limit 1`,
    [workspaceId, userId],
  )
  return rows[0] || null
}

export const findCollaboratorsByWorkspace = async (workspaceId) => {
  const { rows } = await query(
    `${collaboratorSelect}
     where wc.workspace_id = $1
     order by wc.invited_at asc`,
    [workspaceId],
  )
  return rows
}

export const insertCollaborator = async ({ workspaceId, userId, role, invitedBy }) => {
  const { rows } = await query(
    `insert into workspace_collaborators (workspace_id, user_id, role, invited_by)
     values ($1, $2, $3, $4)
     returning workspace_id, user_id, role, invited_at as "invitedAt", updated_at as "updatedAt"`,
    [workspaceId, userId, role, invitedBy],
  )
  return rows[0]
}

export const updateCollaboratorRole = async (workspaceId, userId, role) => {
  const { rows } = await query(
    `update workspace_collaborators
     set role = $3, updated_at = now()
     where workspace_id = $1 and user_id = $2
     returning workspace_id, user_id, role, updated_at as "updatedAt"`,
    [workspaceId, userId, role],
  )
  return rows[0] || null
}

export const deleteCollaborator = async (workspaceId, userId) => {
  const { rows } = await query(
    `delete from workspace_collaborators
     where workspace_id = $1 and user_id = $2
     returning user_id`,
    [workspaceId, userId],
  )
  return rows[0] || null
}

export const findCollaboratorWorkspaceIds = async (userId) => {
  const { rows } = await query(
    `select workspace_id as "workspaceId"
     from workspace_collaborators
     where user_id = $1`,
    [userId],
  )
  return rows.map((r) => r.workspaceId)
}
