import { apiRequest } from './client'

export const listBoards = async () => apiRequest('/boards')

export const getBoard = async (boardId) => apiRequest(`/boards/${boardId}`)

export const createBoard = async (body) => (
  apiRequest('/boards', { method: 'POST', body })
)

export const addBoardItem = async (boardId, body) => (
  apiRequest(`/boards/${boardId}/items`, { method: 'POST', body })
)

export const removeBoardItem = async (boardId, itemId) => (
  apiRequest(`/boards/${boardId}/items/${itemId}`, { method: 'DELETE' })
)

export const deleteBoard = async (boardId) => (
  apiRequest(`/boards/${boardId}`, { method: 'DELETE' })
)
