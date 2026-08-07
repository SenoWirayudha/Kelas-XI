import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import {
  byTokenSchema,
  changeRoleSchema,
  collaboratorIdParamSchema,
  createInviteLinkSchema,
  createWorkspaceSchema,
  importByTokenSchema,
  inviteCollaboratorSchema,
  inviteLinkIdParamSchema,
  inviteTokenParamSchema,
  joinInviteSchema,
  saveWorkspaceSchema,
  shareAsTemplateSchema,
  thumbnailSchema,
  updateWorkspaceSchema,
  useAsTemplateSchema,
  workspaceIdParamSchema,
} from './workspaces.validation.js'
import * as controller from './workspaces.controller.js'

export const workspacesRouter = Router()

// Public route — registered before authRequired middleware
workspacesRouter.get('/by-token/:token', validate(byTokenSchema), controller.getWorkspaceByToken)
workspacesRouter.get('/invite/:token', validate(inviteTokenParamSchema), controller.getWorkspaceInviteInfo)

workspacesRouter.use(authRequired)
workspacesRouter.post('/', validate(createWorkspaceSchema), controller.createWorkspace)
workspacesRouter.get('/', controller.listWorkspaces)
workspacesRouter.get('/search-users', controller.searchUsers)
workspacesRouter.get('/:id', validate(workspaceIdParamSchema), controller.getWorkspace)
workspacesRouter.patch('/:id', validate(updateWorkspaceSchema), controller.updateWorkspace)
workspacesRouter.post('/:id/save', validate(saveWorkspaceSchema), controller.saveWorkspace)
workspacesRouter.post('/:id/autosave', validate(saveWorkspaceSchema), controller.autosaveWorkspace)
workspacesRouter.post('/:id/thumbnail', validate(thumbnailSchema), controller.setThumbnail)
workspacesRouter.delete('/:id', validate(workspaceIdParamSchema), controller.deleteWorkspace)

// Publish & Template routes
workspacesRouter.post('/:id/share-as-template', validate(shareAsTemplateSchema), controller.shareAsTemplate)
workspacesRouter.post('/:id/use-as-template', validate(useAsTemplateSchema), controller.useAsTemplate)
workspacesRouter.post('/import-by-token', validate(importByTokenSchema), controller.importByToken)

// Collaborator routes
workspacesRouter.get('/:id/collaborators', validate(workspaceIdParamSchema), controller.listCollaborators)
workspacesRouter.post('/:id/collaborators', validate(inviteCollaboratorSchema), controller.inviteCollaborator)
workspacesRouter.patch('/:id/collaborators/:userId', validate(changeRoleSchema), controller.changeCollaboratorRole)
workspacesRouter.delete('/:id/collaborators/:userId', validate(collaboratorIdParamSchema), controller.removeCollaborator)

// Invite link routes
workspacesRouter.get('/:id/invite-links', validate(workspaceIdParamSchema), controller.listWorkspaceInviteLinks)
workspacesRouter.post('/:id/invite-links', validate(createInviteLinkSchema), controller.createWorkspaceInviteLink)
workspacesRouter.delete('/:id/invite-links/:linkId', validate(inviteLinkIdParamSchema), controller.revokeWorkspaceInviteLink)
workspacesRouter.post('/join-invite', validate(joinInviteSchema), controller.joinWorkspaceByInvite)
