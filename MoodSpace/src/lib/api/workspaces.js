import { apiRequest } from './client'

export const createWorkspace = async ({
  title,
  canvasWidth,
  canvasHeight,
  canvasRatio,
  background,
  settings,
  snapshot,
}) => (
  apiRequest('/workspaces', {
    method: 'POST',
    body: {
      title,
      canvasWidth,
      canvasHeight,
      canvasRatio,
      background,
      settings,
      snapshot,
    },
  })
)

export const getWorkspace = async (workspaceId) => (
  apiRequest(`/workspaces/${workspaceId}`)
)

export const listWorkspaces = async () => (
  apiRequest('/workspaces')
)

export const updateWorkspace = async (workspaceId, body) => (
  apiRequest(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body,
  })
)

export const saveWorkspace = async (workspaceId, body, options = {}) => (
  apiRequest(`/workspaces/${workspaceId}/save`, {
    method: 'POST',
    body,
    keepalive: options.keepalive,
  })
)

export const autosaveWorkspace = async (workspaceId, body, options = {}) => (
  apiRequest(`/workspaces/${workspaceId}/autosave`, {
    method: 'POST',
    body,
    keepalive: options.keepalive,
  })
)

export const setWorkspaceThumbnail = async (workspaceId, body) => (
  apiRequest(`/workspaces/${workspaceId}/thumbnail`, {
    method: 'POST',
    body,
  })
)

export const deleteWorkspace = async (workspaceId) => (
  apiRequest(`/workspaces/${workspaceId}`, {
    method: 'DELETE',
  })
)

// --- Collaborator API ---

export const listCollaborators = async (workspaceId) => (
  apiRequest(`/workspaces/${workspaceId}/collaborators`)
)

export const inviteCollaborator = async (workspaceId, userId, role) => (
  apiRequest(`/workspaces/${workspaceId}/collaborators`, {
    method: 'POST',
    body: { userId, role },
  })
)

export const updateCollaboratorRole = async (workspaceId, userId, role) => (
  apiRequest(`/workspaces/${workspaceId}/collaborators/${userId}`, {
    method: 'PATCH',
    body: { role },
  })
)

export const removeCollaborator = async (workspaceId, userId) => (
  apiRequest(`/workspaces/${workspaceId}/collaborators/${userId}`, {
    method: 'DELETE',
  })
)

// --- User search for invite ---

export const searchUsers = async (query) => (
  apiRequest(`/workspaces/search-users?q=${encodeURIComponent(query)}`)
)
