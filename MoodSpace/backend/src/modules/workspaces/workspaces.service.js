import { AppError, forbidden, notFound } from '../../utils/errors.js'
import {
  buildPublicUrl,
  getStorageBucket,
  uploadBuffer,
} from '../media/storage.service.js'
import { softDeleteMedia } from '../media/media.repository.js'
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
  // Full implementation in Task 3 — for now return new workspace placeholder
  throw new AppError('Deep copy not yet implemented — Task 3', { status: 501, code: 'NOT_IMPLEMENTED' })
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
