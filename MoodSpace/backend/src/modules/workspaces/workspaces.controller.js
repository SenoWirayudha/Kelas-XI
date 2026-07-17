import * as service from './workspaces.service.js'
import { searchUsersByEmail } from '../auth/auth.repository.js'

export const createWorkspace = async (req, res, next) => {
  try {
    const workspace = await service.createWorkspace({
      userId: req.auth.sub,
      body: req.validated.body,
    })
    res.status(201).json({ workspace })
  } catch (error) {
    next(error)
  }
}

export const listWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await service.listWorkspaces(req.auth.sub)
    res.json({ workspaces })
  } catch (error) {
    next(error)
  }
}

export const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await service.getWorkspace({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
    })
    res.json({ workspace })
  } catch (error) {
    next(error)
  }
}

export const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await service.updateWorkspace({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      patch: req.validated.body,
    })
    res.json({ workspace })
  } catch (error) {
    next(error)
  }
}

export const saveWorkspace = async (req, res, next) => {
  try {
    const result = await service.saveWorkspace({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      body: req.validated.body,
      saveType: 'manual',
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const autosaveWorkspace = async (req, res, next) => {
  try {
    const result = await service.saveWorkspace({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      body: req.validated.body,
      saveType: 'autosave',
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const setThumbnail = async (req, res, next) => {
  try {
    const result = await service.setThumbnail({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      ...req.validated.body,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const deleteWorkspace = async (req, res, next) => {
  try {
    await service.deleteWorkspace({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
    })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// --- Collaborator handlers ---

export const listCollaborators = async (req, res, next) => {
  try {
    const collaborators = await service.listCollaborators({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
    })
    res.json({ collaborators })
  } catch (error) {
    next(error)
  }
}

export const inviteCollaborator = async (req, res, next) => {
  try {
    const result = await service.inviteCollaborator({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      targetUserId: req.validated.body.userId,
      role: req.validated.body.role,
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const changeCollaboratorRole = async (req, res, next) => {
  try {
    const result = await service.changeCollaboratorRole({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      targetUserId: req.validated.params.userId,
      role: req.validated.body.role,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const removeCollaborator = async (req, res, next) => {
  try {
    await service.removeCollaborator({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      targetUserId: req.validated.params.userId,
    })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// --- Publish & Template handlers ---

export const publishWorkspace = async (req, res, next) => {
  try {
    const result = await service.publishWorkspace({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      thumbnailDataUrl: req.validated.body.thumbnailDataUrl,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const shareAsTemplate = async (req, res, next) => {
  try {
    const result = await service.shareAsTemplate({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const publishAsTemplate = async (req, res, next) => {
  try {
    const result = await service.publishAsTemplate({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
      thumbnailDataUrl: req.validated.body.thumbnailDataUrl,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const useAsTemplate = async (req, res, next) => {
  try {
    const result = await service.useAsTemplate({
      userId: req.auth.sub,
      workspaceId: req.validated.params.id,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getWorkspaceByToken = async (req, res, next) => {
  try {
    const result = await service.getWorkspaceByToken({
      token: req.validated.params.token,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

// --- User search handler ---

export const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q || q.length < 1) {
      return res.json({ users: [] })
    }
    const users = await searchUsersByEmail(q, req.auth.sub)
    res.json({ users })
  } catch (error) {
    next(error)
  }
}
