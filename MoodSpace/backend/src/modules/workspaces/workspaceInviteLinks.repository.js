import { query } from '../../db/pool.js'

const inviteLinkSelect = `
  select
    li.id,
    li.workspace_id as "workspaceId",
    li.token,
    li.role,
    li.created_by as "createdBy",
    li.created_at as "createdAt",
    li.expires_at as "expiresAt",
    li.revoked_at as "revokedAt",
    w.owner_id as "ownerId",
    w.title as "workspaceTitle"
  from workspace_invite_links li
  join workspaces w on w.id = li.workspace_id
`

export const insertInviteLink = async ({ workspaceId, token, role, createdBy, expiresAt }) => {
  const { rows } = await query(
    `insert into workspace_invite_links (workspace_id, token, role, created_by, expires_at)
     values ($1, $2, $3, $4, $5)
     on conflict (token) do nothing
     returning id, workspace_id as "workspaceId", token, role, created_at as "createdAt", expires_at as "expiresAt"`,
    [workspaceId, token, role, createdBy, expiresAt],
  )
  return rows[0] || null
}

export const findInviteLinkByToken = async (token) => {
  const { rows } = await query(
    `${inviteLinkSelect}
     where li.token = $1
       and li.deleted_at is null
     limit 1`,
    [token],
  )
  return rows[0] || null
}

export const findInviteLinksByWorkspace = async (workspaceId) => {
  const { rows } = await query(
    `${inviteLinkSelect}
     where li.workspace_id = $1
       and li.deleted_at is null
       and li.revoked_at is null
     order by li.created_at desc`,
    [workspaceId],
  )
  return rows
}

export const revokeInviteLink = async ({ workspaceId, linkId }) => {
  const { rows } = await query(
    `update workspace_invite_links
     set revoked_at = now()
     where id = $1 and workspace_id = $2 and revoked_at is null
     returning id`,
    [linkId, workspaceId],
  )
  return rows[0] || null
}

export const deleteInviteLink = async ({ workspaceId, linkId }) => {
  const { rows } = await query(
    `update workspace_invite_links
     set deleted_at = now()
     where id = $1 and workspace_id = $2
     returning id`,
    [linkId, workspaceId],
  )
  return rows[0] || null
}

export const findInviteLinkByWorkspace = async (workspaceId) => {
  const { rows } = await query(
    `${inviteLinkSelect}
     where li.workspace_id = $1
       and li.deleted_at is null
     order by li.created_at desc
     limit 1`,
    [workspaceId],
  )
  return rows[0] || null
}