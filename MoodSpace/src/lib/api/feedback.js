import { apiRequest } from './client'

export const sendFeedback = async (body) =>
  apiRequest('/feedback', { method: 'POST', body, auth: false })
