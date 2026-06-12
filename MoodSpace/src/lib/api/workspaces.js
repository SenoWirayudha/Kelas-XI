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
