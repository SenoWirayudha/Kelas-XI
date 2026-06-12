import * as service from './workspaces.service.js'

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
