import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import {
  createWorkspaceSchema,
  saveWorkspaceSchema,
  thumbnailSchema,
  updateWorkspaceSchema,
  workspaceIdParamSchema,
} from './workspaces.validation.js'
import * as controller from './workspaces.controller.js'

export const workspacesRouter = Router()

workspacesRouter.use(authRequired)
workspacesRouter.post('/', validate(createWorkspaceSchema), controller.createWorkspace)
workspacesRouter.get('/', controller.listWorkspaces)
workspacesRouter.get('/:id', validate(workspaceIdParamSchema), controller.getWorkspace)
workspacesRouter.patch('/:id', validate(updateWorkspaceSchema), controller.updateWorkspace)
workspacesRouter.post('/:id/save', validate(saveWorkspaceSchema), controller.saveWorkspace)
workspacesRouter.post('/:id/autosave', validate(saveWorkspaceSchema), controller.autosaveWorkspace)
workspacesRouter.post('/:id/thumbnail', validate(thumbnailSchema), controller.setThumbnail)
workspacesRouter.delete('/:id', validate(workspaceIdParamSchema), controller.deleteWorkspace)
