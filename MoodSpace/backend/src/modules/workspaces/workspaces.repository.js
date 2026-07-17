import { query, withTransaction } from '../../db/pool.js'

const workspaceSelect = `
  select
    w.id,
    w.owner_id as "ownerId",
    w.title,
    w.description,
    w.visibility,
    w.status,
    w.canvas_width as "canvasWidth",
    w.canvas_height as "canvasHeight",
    w.canvas_ratio as "canvasRatio",
    w.background,
    w.settings,
    w.thumbnail_media_id as "thumbnailMediaId",
    tm.bucket as "thumbnailBucket",
    tm.object_key as "thumbnailObjectKey",
    tm.public_url as "thumbnailPublicUrl",
    w.is_published as "isPublished",
    w.is_template as "isTemplate",
    w.thumbnail_url as "thumbnailUrl",
    w.share_token as "shareToken",
    w.source_template_id as "sourceTemplateId",
    w.current_version_id as "currentVersionId",
    w.latest_autosave_version_id as "latestAutosaveVersionId",
    w.published_version_id as "publishedVersionId",
    w.created_at as "createdAt",
    w.updated_at as "updatedAt",
    w.published_at as "publishedAt"
  from workspaces w
  left join media_assets tm on tm.id = w.thumbnail_media_id and tm.deleted_at is null
`

export const createWorkspaceWithVersion = async ({
  ownerId,
  title,
  description,
  visibility,
  canvasWidth,
  canvasHeight,
  canvasRatio,
  background,
  settings,
  snapshot,
  snapshotHash,
}) => withTransaction(async (client) => {
  const workspaceResult = await client.query(
    `insert into workspaces (
       owner_id, title, description, visibility, canvas_width, canvas_height,
       canvas_ratio, background, settings
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
     returning id, updated_at as "updatedAt"`,
    [
      ownerId,
      title,
      description || null,
      visibility || 'private',
      canvasWidth,
      canvasHeight,
      canvasRatio || null,
      JSON.stringify(background || {}),
      JSON.stringify(settings || {}),
    ],
  )
  const workspaceId = workspaceResult.rows[0].id

  const versionResult = await client.query(
    `insert into workspace_versions (workspace_id, version_no, save_type, snapshot, snapshot_hash, created_by)
     values ($1, 1, 'manual', $2::jsonb, $3, $4)
     returning id, version_no as "versionNo", save_type as "saveType", created_at as "createdAt"`,
    [workspaceId, JSON.stringify(snapshot), snapshotHash, ownerId],
  )
  const version = versionResult.rows[0]

  await client.query(
    `update workspaces
     set current_version_id = $2,
         updated_at = now()
     where id = $1`,
    [workspaceId, version.id],
  )

  await client.query(
    `insert into workspace_activity (workspace_id, user_id, activity_type, version_id)
     values ($1, $2, 'created', $3)`,
    [workspaceId, ownerId, version.id],
  )

  return { workspaceId, version }
})

export const findWorkspaceById = async (workspaceId) => {
  const { rows } = await query(
    `${workspaceSelect}
     where w.id = $1 and w.deleted_at is null
     limit 1`,
    [workspaceId],
  )
  return rows[0] || null
}

export const listWorkspacesByOwner = async (ownerId) => {
  const { rows } = await query(
    `${workspaceSelect}
     where w.owner_id = $1 and w.deleted_at is null
     order by w.updated_at desc`,
    [ownerId],
  )
  return rows
}

export const updateWorkspaceMetadata = async ({ workspaceId, ownerId, patch }) => {
  const fields = []
  const values = [workspaceId, ownerId]
  const scalarMap = {
    title: 'title',
    description: 'description',
    visibility: 'visibility',
    canvasWidth: 'canvas_width',
    canvasHeight: 'canvas_height',
    canvasRatio: 'canvas_ratio',
    background: 'background',
    settings: 'settings',
  }

  for (const [inputKey, column] of Object.entries(scalarMap)) {
    if (patch[inputKey] !== undefined) {
      values.push(['background', 'settings'].includes(inputKey) ? JSON.stringify(patch[inputKey]) : patch[inputKey])
      fields.push(`${column} = $${values.length}${['background', 'settings'].includes(inputKey) ? '::jsonb' : ''}`)
    }
  }

  if (!fields.length) return findWorkspaceById(workspaceId)

  const { rows } = await query(
    `update workspaces
     set ${fields.join(', ')}, updated_at = now()
     where id = $1
       and owner_id = $2
       and deleted_at is null
     returning id`,
    values,
  )
  if (!rows[0]) return null
  return findWorkspaceById(workspaceId)
}

export const getLatestVersion = async (workspaceId) => {
  const { rows } = await query(
    `select
       id,
       workspace_id as "workspaceId",
       version_no as "versionNo",
       save_type as "saveType",
       snapshot,
       snapshot_hash as "snapshotHash",
       created_at as "createdAt"
     from workspace_versions
     where workspace_id = $1
     order by version_no desc
     limit 1`,
    [workspaceId],
  )
  return rows[0] || null
}

export const createWorkspaceVersion = async ({
  workspaceId,
  ownerId,
  saveType,
  snapshot,
  snapshotHash,
  workspacePatch = {},
}) => withTransaction(async (client) => {
  const workspaceCheck = await client.query(
    `select id from workspaces
     where id = $1 and owner_id = $2 and deleted_at is null
     for update`,
    [workspaceId, ownerId],
  )
  if (!workspaceCheck.rows[0]) return null

  const latestResult = await client.query(
    `select
       id,
       version_no as "versionNo",
       save_type as "saveType",
       snapshot_hash as "snapshotHash",
       created_at as "createdAt"
     from workspace_versions
     where workspace_id = $1
     order by version_no desc
     limit 1`,
    [workspaceId],
  )
  const latest = latestResult.rows[0]

  if (saveType === 'autosave' && latest?.snapshotHash && latest.snapshotHash === snapshotHash) {
    return { skipped: true, version: latest }
  }

  const nextVersionNo = (latest?.versionNo || 0) + 1
  const versionResult = await client.query(
    `insert into workspace_versions (workspace_id, version_no, save_type, snapshot, snapshot_hash, created_by)
     values ($1, $2, $3, $4::jsonb, $5, $6)
     returning id, version_no as "versionNo", save_type as "saveType", snapshot_hash as "snapshotHash", created_at as "createdAt"`,
    [workspaceId, nextVersionNo, saveType, JSON.stringify(snapshot), snapshotHash, ownerId],
  )
  const version = versionResult.rows[0]

  const metadataFields = []
  const values = [workspaceId, version.id]

  if (saveType === 'manual') metadataFields.push('current_version_id = $2')
  if (saveType === 'autosave') metadataFields.push('latest_autosave_version_id = $2')

  const patchMap = {
    title: 'title',
    canvasWidth: 'canvas_width',
    canvasHeight: 'canvas_height',
    canvasRatio: 'canvas_ratio',
    background: 'background',
    settings: 'settings',
  }
  for (const [inputKey, column] of Object.entries(patchMap)) {
    if (workspacePatch[inputKey] !== undefined) {
      values.push(['background', 'settings'].includes(inputKey) ? JSON.stringify(workspacePatch[inputKey]) : workspacePatch[inputKey])
      metadataFields.push(`${column} = $${values.length}${['background', 'settings'].includes(inputKey) ? '::jsonb' : ''}`)
    }
  }

  metadataFields.push('updated_at = now()')

  await client.query(
    `update workspaces
     set ${metadataFields.join(', ')}
     where id = $1`,
    values,
  )

  await client.query(
    `insert into workspace_activity (workspace_id, user_id, activity_type, version_id)
     values ($1, $2, $3, $4)`,
    [workspaceId, ownerId, saveType === 'autosave' ? 'autosaved' : 'saved', version.id],
  )

  return { skipped: false, version }
})

export const setWorkspaceThumbnail = async ({ workspaceId, ownerId, mediaId }) => {
  const { rows } = await query(
    `update workspaces
     set thumbnail_media_id = $3,
         updated_at = now()
     where id = $1
       and owner_id = $2
       and deleted_at is null
     returning id`,
    [workspaceId, ownerId, mediaId],
  )
  return rows[0] || null
}

export const softDeleteWorkspace = async ({ workspaceId, ownerId }) => {
  const { rows } = await query(
    `update workspaces
     set deleted_at = now(),
         status = 'deleted',
         updated_at = now()
     where id = $1
       and owner_id = $2
       and deleted_at is null
     returning id`,
    [workspaceId, ownerId],
  )
  return rows[0] || null
}

export const updateWorkspacePublishFlags = async ({ workspaceId, ownerId, flags }) => {
  const fields = []
  const values = [workspaceId, ownerId]
  const colMap = {
    isPublished: 'is_published',
    isTemplate: 'is_template',
    thumbnailUrl: 'thumbnail_url',
    sourceTemplateId: 'source_template_id',
    publishedAt: 'published_at',
  }

  for (const [inputKey, column] of Object.entries(colMap)) {
    if (flags[inputKey] !== undefined) {
      values.push(flags[inputKey])
      fields.push(`${column} = $${values.length}`)
    }
  }

  if (!fields.length) return null

  fields.push('updated_at = now()')

  const { rows } = await query(
    `update workspaces
     set ${fields.join(', ')}
     where id = $1
       and owner_id = $2
       and deleted_at is null
     returning id`,
    values,
  )
  return rows[0] || null
}

export const findWorkspaceByShareToken = async (token) => {
  const { rows } = await query(
    `${workspaceSelect}
     where w.share_token = $1
       and w.is_template = true
       and w.deleted_at is null
     limit 1`,
    [token],
  )
  return rows[0] || null
}
