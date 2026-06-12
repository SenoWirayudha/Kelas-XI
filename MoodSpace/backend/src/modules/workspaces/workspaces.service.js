import { forbidden, notFound } from '../../utils/errors.js'
import {
  buildPublicUrl,
} from '../media/storage.service.js'
import { softDeleteMedia } from '../media/media.repository.js'
import {
  createMediaFromDataUrl,
  getOwnedReadyMedia,
} from '../media/media.service.js'
import {
  createWorkspaceVersion,
  createWorkspaceWithVersion,
  findWorkspaceById,
  getLatestVersion,
  listWorkspacesByOwner,
  setWorkspaceThumbnail,
  softDeleteWorkspace,
  updateWorkspaceMetadata,
} from './workspaces.repository.js'
import { buildInitialSnapshot, hashSnapshot } from './snapshot.service.js'

const assertOwner = (workspace, userId) => {
  if (!workspace) throw notFound('Workspace not found')
  if (workspace.ownerId !== userId) throw forbidden('You do not own this workspace')
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
  thumbnailUrl: buildPublicUrl({
    bucket: workspace.thumbnailBucket,
    objectKey: workspace.thumbnailObjectKey,
    publicUrl: workspace.thumbnailPublicUrl,
  }),
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
  const workspaces = await listWorkspacesByOwner(userId)
  return workspaces.map((workspace) => serializeWorkspace(workspace))
}

export const getWorkspace = async ({ userId, workspaceId }) => {
  const workspace = await findWorkspaceById(workspaceId)
  assertOwner(workspace, userId)
  const version = await getLatestVersion(workspaceId)
  return serializeWorkspace(workspace, version)
}

export const updateWorkspace = async ({ userId, workspaceId, patch }) => {
  const workspace = await findWorkspaceById(workspaceId)
  assertOwner(workspace, userId)
  const updated = await updateWorkspaceMetadata({ workspaceId, ownerId: userId, patch })
  return serializeWorkspace(updated, await getLatestVersion(workspaceId))
}

export const saveWorkspace = async ({ userId, workspaceId, body, saveType }) => {
  const workspace = await findWorkspaceById(workspaceId)
  assertOwner(workspace, userId)

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
  assertOwner(workspace, userId)

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
  assertOwner(workspace, userId)
  const deleted = await softDeleteWorkspace({ workspaceId, ownerId: userId })
  if (!deleted) throw notFound('Workspace not found')
}
