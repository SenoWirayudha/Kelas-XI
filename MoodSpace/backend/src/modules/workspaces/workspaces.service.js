import crypto from 'crypto'
import { AppError, forbidden, notFound } from '../../utils/errors.js'
import {
  buildPublicUrl,
  copyObject,
  deleteObject,
  getStorageBucket,
  uploadBuffer,
} from '../media/storage.service.js'
import { withTransaction } from '../../db/pool.js'
import {
  findMediaById,
  softDeleteMedia,
} from '../media/media.repository.js'
import {
  createMediaFromDataUrl,
  getOwnedReadyMedia,
} from '../media/media.service.js'
import { insertNotification } from '../notifications/notifications.repository.js'
import {
  createWorkspaceVersion,
  createWorkspaceWithVersion,
  findWorkspaceById,
  findWorkspaceByShareToken,
  getLatestVersion,
  listWorkspacesByOwner,
  setWorkspaceThumbnail,
  softDeleteWorkspace,
  updateWorkspaceMetadata,
  updateWorkspacePublishFlags,
} from './workspaces.repository.js'
import {
  deleteCollaborator,
  findCollaborator,
  findCollaboratorsByWorkspace,
  findCollaboratorWorkspaceIds,
  insertCollaborator as insertCollaboratorRepo,
  updateCollaboratorRole,
} from './workspaceCollaborators.repository.js'
import { buildInitialSnapshot, hashSnapshot } from './snapshot.service.js'

const assertWorkspaceAccess = async (workspace, userId, operation = 'read') => {
  if (!workspace) throw notFound('Workspace not found')
  if (workspace.ownerId === userId) return
  const collab = await findCollaborator(workspace.id, userId)
  if (!collab) throw forbidden('You do not have access to this workspace')
  if (operation === 'write' && collab.role !== 'edit') {
    throw forbidden('View-only collaborators cannot modify this workspace')
  }
  return collab
}

const serializeWorkspace = (workspace, version = null) => ({
  id: workspace.id,
  ownerId: workspace.ownerId,
  title: workspace.title,
  description: workspace.description,
  visibility: workspace.visibility,
  status: workspace.status,
  canvasWidth: workspace.canvasWidth,
  canvasHeight: workspace.canvasHeight,
  canvasRatio: workspace.canvasRatio,
  background: workspace.background || {},
  settings: workspace.settings || {},
  thumbnailMediaId: workspace.thumbnailMediaId,
  thumbnailUrl: workspace.thumbnailUrl || buildPublicUrl({
    bucket: workspace.thumbnailBucket,
    objectKey: workspace.thumbnailObjectKey,
    publicUrl: workspace.thumbnailPublicUrl,
  }),
  isPublished: workspace.isPublished,
  isTemplate: workspace.isTemplate,
  shareToken: workspace.shareToken,
  sourceTemplateId: workspace.sourceTemplateId,
  publishedAt: workspace.publishedAt,
  currentVersionId: workspace.currentVersionId,
  latestAutosaveVersionId: workspace.latestAutosaveVersionId,
  publishedVersionId: workspace.publishedVersionId,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
  latestVersion: version ? {
    id: version.id,
    versionNo: version.versionNo,
    saveType: version.saveType,
    snapshot: version.snapshot,
    snapshotHash: version.snapshotHash,
    createdAt: version.createdAt,
  } : null,
})

export const createWorkspace = async ({ userId, body }) => {
  const snapshot = buildInitialSnapshot(body)
  const snapshotHash = hashSnapshot(snapshot)
  const result = await createWorkspaceWithVersion({
    ownerId: userId,
    title: body.title,
    description: body.description,
    visibility: body.visibility,
    canvasWidth: body.canvasWidth,
    canvasHeight: body.canvasHeight,
    canvasRatio: body.canvasRatio,
    background: body.background,
    settings: body.settings,
    snapshot,
    snapshotHash,
  })

  const workspace = await findWorkspaceById(result.workspaceId)
  const version = await getLatestVersion(result.workspaceId)
  return serializeWorkspace(workspace, version)
}

export const listWorkspaces = async (userId) => {
  const [owned, collaboratorIds] = await Promise.all([
    listWorkspacesByOwner(userId),
    findCollaboratorWorkspaceIds(userId),
  ])
  const ownedIds = new Set(owned.map((w) => w.id))
  let workspaces = owned
  if (collaboratorIds.length > 0) {
    const shared = await Promise.all(
      collaboratorIds
        .filter((id) => !ownedIds.has(id))
        .map((id) => findWorkspaceById(id)),
    )
    workspaces = [...owned, ...shared.filter(Boolean)]
  }
  return workspaces.map((workspace) => serializeWorkspace(workspace))
}

export const getWorkspace = async ({ userId, workspaceId }) => {
  const workspace = await findWorkspaceById(workspaceId)
  const collab = await assertWorkspaceAccess(workspace, userId, 'read')
  const version = await getLatestVersion(workspaceId)
  const result = serializeWorkspace(workspace, version)
  result.role = workspace.ownerId === userId ? 'edit' : (collab?.role || 'view')
  return result
}

export const updateWorkspace = async ({ userId, workspaceId, patch }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertWorkspaceAccess(workspace, userId, 'write')
  const updated = await updateWorkspaceMetadata({ workspaceId, ownerId: userId, patch })
  return serializeWorkspace(updated, await getLatestVersion(workspaceId))
}

export const saveWorkspace = async ({ userId, workspaceId, body, saveType }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertWorkspaceAccess(workspace, userId, 'write')

  const snapshotHash = hashSnapshot(body.snapshot)
  const result = await createWorkspaceVersion({
    workspaceId,
    ownerId: userId,
    saveType,
    snapshot: body.snapshot,
    snapshotHash,
    workspacePatch: body,
  })

  if (!result) throw notFound('Workspace not found')

  return {
    skipped: result.skipped,
    version: result.version,
  }
}

export const setThumbnail = async ({ userId, workspaceId, mediaId, dataUrl }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertWorkspaceAccess(workspace, userId, 'write')

  const oldMediaId = workspace.thumbnailMediaId
  if (oldMediaId) {
    await softDeleteMedia({ mediaId: oldMediaId, ownerId: userId }).catch(() => {})
  }

  const media = mediaId
    ? await getOwnedReadyMedia({ userId, mediaId })
    : await createMediaFromDataUrl({
        userId,
      dataUrl,
      sourceType: 'workspace_thumbnail',
      title: `${workspace.title} thumbnail`,
      objectKey: `thumbnails/${workspaceId}.webp`,
      upsert: true,
    })

  const updated = await setWorkspaceThumbnail({
    workspaceId,
    ownerId: userId,
    mediaId: media.id,
  })
  if (!updated) throw notFound('Workspace not found')

  console.log('[workspace thumbnail saved]', {
    workspaceId,
    mediaId: media.id,
    thumbnailUrl: buildPublicUrl(media),
    updatedAt: updated.updatedAt,
  })

  return {
    media: {
      id: media.id,
      url: buildPublicUrl(media),
      mimeType: media.mimeType,
      width: media.width,
      height: media.height,
      sizeBytes: media.sizeBytes,
    },
    thumbnailUrl: buildPublicUrl(media),
    updatedAt: updated.updatedAt,
  }
}

export const deleteWorkspace = async ({ userId, workspaceId }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertWorkspaceAccess(workspace, userId, 'write')
  const deleted = await softDeleteWorkspace({ workspaceId, ownerId: userId })
  if (!deleted) throw notFound('Workspace not found')
}

// --- Publish & Template ---

const uploadThumbnailFromDataUrl = async ({ userId, workspaceId, dataUrl }) => {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(dataUrl || '')
  if (!match) {
    throw new AppError('Invalid thumbnail data URL', { status: 400, code: 'INVALID_DATA_URL' })
  }
  const mimeType = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
    throw new AppError('Thumbnail image is too large', { status: 400, code: 'IMAGE_TOO_LARGE' })
  }

  const objectKey = `thumbnails/${workspaceId}.webp`
  await uploadBuffer({ objectKey, mimeType, buffer, upsert: true })
  return buildPublicUrl({ objectKey })
}

export const publishWorkspace = async ({ userId, workspaceId, thumbnailDataUrl }) => {
  const workspace = await findWorkspaceById(workspaceId)
  if (!workspace) throw notFound('Workspace not found')
  if (workspace.ownerId !== userId) throw forbidden('Only the workspace owner can publish')

  let thumbnailUrl = null
  if (thumbnailDataUrl) {
    console.log('[publish] Generating thumbnail for workspace', workspaceId)
    thumbnailUrl = await uploadThumbnailFromDataUrl({ userId, workspaceId, dataUrl: thumbnailDataUrl })
    console.log('[publish] Thumbnail uploaded:', thumbnailUrl)
  }

  await updateWorkspacePublishFlags({
    workspaceId,
    ownerId: userId,
    flags: {
      isPublished: true,
      isTemplate: false,
      thumbnailUrl: thumbnailUrl || undefined,
      publishedAt: new Date().toISOString(),
    },
  })

  console.log('[publish] Workspace published', { workspaceId, thumbnailUrl })
  return { workspaceId, publishedAt: new Date().toISOString(), thumbnailUrl }
}

export const shareAsTemplate = async ({ userId, workspaceId }) => {
  const workspace = await findWorkspaceById(workspaceId)
  if (!workspace) throw notFound('Workspace not found')
  if (workspace.ownerId !== userId) throw forbidden('Only the workspace owner can share as template')

  await updateWorkspacePublishFlags({
    workspaceId,
    ownerId: userId,
    flags: {
      isPublished: false,
      isTemplate: true,
    },
  })

  const updated = await findWorkspaceById(workspaceId)
  console.log('[share-as-template] Workspace shared as template', { workspaceId, shareToken: updated.shareToken })
  return {
    workspaceId,
    shareToken: updated.shareToken,
    shareUrl: `/workspace/by-template/${updated.shareToken}`,
  }
}

export const publishAsTemplate = async ({ userId, workspaceId, thumbnailDataUrl }) => {
  const workspace = await findWorkspaceById(workspaceId)
  if (!workspace) throw notFound('Workspace not found')
  if (workspace.ownerId !== userId) throw forbidden('Only the workspace owner can publish as template')

  let thumbnailUrl = null
  if (thumbnailDataUrl) {
    console.log('[publish-as-template] Generating thumbnail for workspace', workspaceId)
    thumbnailUrl = await uploadThumbnailFromDataUrl({ userId, workspaceId, dataUrl: thumbnailDataUrl })
    console.log('[publish-as-template] Thumbnail uploaded:', thumbnailUrl)
  }

  await updateWorkspacePublishFlags({
    workspaceId,
    ownerId: userId,
    flags: {
      isPublished: true,
      isTemplate: true,
      thumbnailUrl: thumbnailUrl || undefined,
      publishedAt: new Date().toISOString(),
    },
  })

  const updated = await findWorkspaceById(workspaceId)
  console.log('[publish-as-template] Workspace published as template', {
    workspaceId,
    thumbnailUrl,
    shareToken: updated.shareToken,
  })
  return {
    workspaceId,
    publishedAt: new Date().toISOString(),
    thumbnailUrl,
    shareToken: updated.shareToken,
    shareUrl: `/workspace/by-template/${updated.shareToken}`,
  }
}

export const useAsTemplate = async ({ userId, workspaceId }) => {
  const sourceWorkspace = await findWorkspaceById(workspaceId)
  if (!sourceWorkspace) throw notFound('Workspace not found')
  if (!sourceWorkspace.isTemplate) throw forbidden('This workspace is not available as a template')

  console.log('[deep-copy] Starting deep copy of workspace', workspaceId, 'for user', userId)

  // --- Step 1: Read snapshot ---
  const latestVersion = await getLatestVersion(workspaceId)
  if (!latestVersion?.snapshot) throw notFound('Workspace has no snapshot to copy')
  const snapshot = latestVersion.snapshot
  console.log('[deep-copy] Snapshot loaded, version', latestVersion.versionNo)

  // --- Step 2: Collect media_ids from items + generate all UUIDs ---
  const items = snapshot.items || []
  const oldMediaIds = items
    .map((item) => item.mediaId)
    .filter(Boolean)
    .filter((id, i, arr) => arr.indexOf(id) === i) // unique

  console.log('[deep-copy] Found', oldMediaIds.length, 'unique media assets to copy')

  // Fetch all original media_assets rows
  const originalMedia = await Promise.all(
    oldMediaIds.map((id) => findMediaById(id)),
  )
  const validMedia = originalMedia.filter(Boolean)
  console.log('[deep-copy] Resolved', validMedia.length, 'media assets from DB')

  // Generate ALL UUIDs upfront
  const itemIdMap = new Map()  // oldItemId -> newItemId
  const mediaIdMap = new Map() // oldMediaId -> { newId, objectKey, ... }

  for (const item of items) {
    if (!itemIdMap.has(item.id)) {
      itemIdMap.set(item.id, crypto.randomUUID())
    }
  }

  for (const media of validMedia) {
    mediaIdMap.set(media.id, {
      newId: crypto.randomUUID(),
      objectKey: media.objectKey,
      bucket: media.bucket,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height,
      sizeBytes: media.sizeBytes,
      metadata: media.metadata || {},
      sourceType: media.sourceType,
      publicUrl: media.publicUrl,
    })
  }

  console.log('[deep-copy] Generated UUIDs:', {
    items: itemIdMap.size,
    media: mediaIdMap.size,
  })

  // --- Step 3: Patch snapshot ---
  const patchedSnapshot = JSON.parse(JSON.stringify(snapshot))
  const patchedItems = patchedSnapshot.items || []
  const patchedLayers = patchedSnapshot.layers || []

  for (const item of patchedItems) {
    item.id = itemIdMap.get(item.id) || item.id
    if (item.groupId && itemIdMap.has(item.groupId)) {
      item.groupId = itemIdMap.get(item.groupId)
    }
    if (item.mediaId && mediaIdMap.has(item.mediaId)) {
      const mapped = mediaIdMap.get(item.mediaId)
      item.mediaId = mapped.newId
    }
    // Patch mediaId inside frameImages if present
    if (item.frameImages && Array.isArray(item.frameImages)) {
      for (const fi of item.frameImages) {
        if (fi.mediaId && mediaIdMap.has(fi.mediaId)) {
          fi.mediaId = mediaIdMap.get(fi.mediaId).newId
        }
      }
    }
    if (item.frameImageSrc && Array.isArray(item.frameImageSrc)) {
      for (const fi of item.frameImageSrc) {
        if (fi.mediaId && mediaIdMap.has(fi.mediaId)) {
          fi.mediaId = mediaIdMap.get(fi.mediaId).newId
        }
      }
    }
  }

  for (const layer of patchedLayers) {
    if (layer.id && itemIdMap.has(layer.id)) {
      layer.id = itemIdMap.get(layer.id)
    }
  }

  // Patch assetsUsed if present
  if (patchedSnapshot.assetsUsed && Array.isArray(patchedSnapshot.assetsUsed)) {
    for (const au of patchedSnapshot.assetsUsed) {
      if (au.mediaId && mediaIdMap.has(au.mediaId)) {
        au.mediaId = mediaIdMap.get(au.mediaId).newId
      }
    }
  }

  console.log('[deep-copy] Snapshot patched with', itemIdMap.size, 'new item IDs')

  // --- Step 4: Copy storage files (server-side Supabase copy) ---
  const copiedKeys = [] // track for cleanup on failure

  for (const [oldId, mapped] of mediaIdMap) {
    if (!mapped.objectKey) {
      console.log('[deep-copy] Skipping media', oldId, '- no objectKey')
      continue
    }
    // Replace owner segment in object key: users/{oldOwner}/... -> users/{newOwner}/...
    const newObjectKey = mapped.objectKey.replace(
      /^users\/[^/]+\//,
      `users/${userId}/`,
    )
    mapped.newObjectKey = newObjectKey

    try {
      console.log('[deep-copy] Copying storage:', mapped.objectKey, '->', newObjectKey)
      await copyObject({ sourceKey: mapped.objectKey, destKey: newObjectKey })
      copiedKeys.push(newObjectKey)
      mapped.publicUrl = buildPublicUrl({ objectKey: newObjectKey })
      console.log('[deep-copy] Storage copy OK:', newObjectKey)
    } catch (error) {
      console.error('[deep-copy] Storage copy FAILED:', mapped.objectKey, error.message)
      // Cleanup any files already copied
      console.log('[deep-copy] Cleaning up', copiedKeys.length, 'already-copied files')
      await Promise.allSettled(
        copiedKeys.map((key) => deleteObject({ objectKey: key }).catch(() => {})),
      )
      throw new AppError(`Failed to copy media asset: ${error.message}`, {
        status: 502,
        code: 'STORAGE_COPY_FAILED',
      })
    }
  }

  console.log('[deep-copy] All storage copies successful, proceeding to DB transaction')

  // --- Step 5: Single DB transaction ---
  const storageProvider = 'supabase'
  const bucket = getStorageBucket()

  let newWorkspaceId
  try {
    const result = await withTransaction(async (client) => {
      // 5a. Insert media_assets rows
      for (const [oldId, mapped] of mediaIdMap) {
        if (!mapped.newObjectKey) continue
        await client.query(
          `insert into media_assets (id, owner_id, source_type, storage_provider, bucket, object_key, public_url, mime_type, width, height, size_bytes, upload_status, metadata)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ready', $12::jsonb)`,
          [
            mapped.newId,
            userId,
            mapped.sourceType || 'upload',
            storageProvider,
            mapped.bucket || bucket,
            mapped.newObjectKey,
            mapped.publicUrl,
            mapped.mimeType,
            mapped.width || null,
            mapped.height || null,
            mapped.sizeBytes || null,
            JSON.stringify(mapped.metadata || {}),
          ],
        )
        console.log('[deep-copy] Inserted media_assets:', mapped.newId)
      }

      // 5b. Insert uploaded_assets rows
      for (const [oldId, mapped] of mediaIdMap) {
        if (!mapped.newObjectKey) continue
        await client.query(
          `insert into uploaded_assets (user_id, media_id)
           values ($1, $2)
           on conflict (user_id, media_id) do nothing`,
          [userId, mapped.newId],
        )
        console.log('[deep-copy] Inserted uploaded_assets:', mapped.newId)
      }

      // 5c. Create workspace + version 1
      const workspaceResult = await client.query(
        `insert into workspaces (
           owner_id, title, description, visibility, status,
           canvas_width, canvas_height, canvas_ratio, background, settings,
           is_published, is_template, source_template_id
         )
         values ($1, $2, $3, $4, 'draft', $5, $6, $7, $8::jsonb, $9::jsonb, false, false, $10)
         returning id`,
        [
          userId,
          `${sourceWorkspace.title} (copy)`,
          sourceWorkspace.description || null,
          'private',
          sourceWorkspace.canvasWidth,
          sourceWorkspace.canvasHeight,
          sourceWorkspace.canvasRatio || null,
          JSON.stringify(sourceWorkspace.background || {}),
          JSON.stringify(sourceWorkspace.settings || {}),
          workspaceId, // source_template_id
        ],
      )
      newWorkspaceId = workspaceResult.rows[0].id
      console.log('[deep-copy] Created workspace:', newWorkspaceId)

      const snapshotHash = hashSnapshot(patchedSnapshot)

      const versionResult = await client.query(
        `insert into workspace_versions (workspace_id, version_no, save_type, snapshot, snapshot_hash, created_by)
         values ($1, 1, 'manual', $2::jsonb, $3, $4)
         returning id`,
        [newWorkspaceId, JSON.stringify(patchedSnapshot), snapshotHash, userId],
      )
      const versionId = versionResult.rows[0].id
      console.log('[deep-copy] Created version:', versionId)

      await client.query(
        `update workspaces
         set current_version_id = $2,
             updated_at = now()
         where id = $1`,
        [newWorkspaceId, versionId],
      )
    })

    console.log('[deep-copy] DB transaction committed successfully')
  } catch (error) {
    console.error('[deep-copy] DB transaction FAILED, cleaning up storage files')
    // Cleanup all storage files that were copied
    const keysToCleanup = [...mediaIdMap.values()]
      .filter((m) => m.newObjectKey)
      .map((m) => m.newObjectKey)
    await Promise.allSettled(
      keysToCleanup.map((key) => deleteObject({ objectKey: key }).catch(() => {})),
    )
    console.log('[deep-copy] Cleaned up', keysToCleanup.length, 'storage files')
    throw error
  }

  console.log('[deep-copy] Deep copy complete:', {
    sourceWorkspaceId: workspaceId,
    newWorkspaceId,
    userId,
    mediaCopied: [...mediaIdMap.values()].filter((m) => m.newObjectKey).length,
  })

  return { workspaceId: newWorkspaceId }
}

export const getWorkspaceByToken = async ({ token }) => {
  const workspace = await findWorkspaceByShareToken(token)
  if (!workspace) throw notFound('Template not found or share link is invalid')

  return {
    id: workspace.id,
    title: workspace.title,
    description: workspace.description,
    thumbnailUrl: workspace.thumbnailUrl || buildPublicUrl({
      bucket: workspace.thumbnailBucket,
      objectKey: workspace.thumbnailObjectKey,
      publicUrl: workspace.thumbnailPublicUrl,
    }),
    ownerId: workspace.ownerId,
    isTemplate: workspace.isTemplate,
  }
}

// --- Collaborator management ---

const assertOwner = async (workspace, userId) => {
  if (!workspace) throw notFound('Workspace not found')
  if (workspace.ownerId !== userId) throw forbidden('Only the workspace owner can manage collaborators')
}

export const listCollaborators = async ({ userId, workspaceId }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertOwner(workspace, userId)
  const collaborators = await findCollaboratorsByWorkspace(workspaceId)
  return collaborators.map((c) => ({
    userId: c.userId,
    role: c.role,
    invitedBy: c.invitedBy,
    invitedAt: c.invitedAt,
    updatedAt: c.updatedAt,
    user: {
      id: c.userId,
      email: c.email,
      username: c.username,
      displayName: c.displayName,
      profile: {
        avatarUrl: c.avatarUrl || null,
      },
    },
  }))
}

export const inviteCollaborator = async ({ userId, workspaceId, targetUserId, role }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertOwner(workspace, userId)

  const result = await insertCollaboratorRepo({
    workspaceId,
    userId: targetUserId,
    role,
    invitedBy: userId,
  })

  await insertNotification({
    userId: targetUserId,
    actorId: userId,
    type: 'workspace_invite',
    targetType: 'workspace',
    targetId: workspaceId,
    metadata: { workspaceTitle: workspace.title },
  })

  return {
    userId: result.user_id,
    role: result.role,
    invitedAt: result.invitedAt,
    updatedAt: result.updatedAt,
  }
}

export const changeCollaboratorRole = async ({ userId, workspaceId, targetUserId, role }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertOwner(workspace, userId)

  const result = await updateCollaboratorRole(workspaceId, targetUserId, role)
  if (!result) throw notFound('Collaborator not found')
  return {
    userId: result.user_id,
    role: result.role,
    updatedAt: result.updatedAt,
  }
}

export const removeCollaborator = async ({ userId, workspaceId, targetUserId }) => {
  const workspace = await findWorkspaceById(workspaceId)
  await assertOwner(workspace, userId)

  const result = await deleteCollaborator(workspaceId, targetUserId)
  if (!result) throw notFound('Collaborator not found')
}
