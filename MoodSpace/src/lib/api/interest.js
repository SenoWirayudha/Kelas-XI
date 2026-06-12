import { apiRequest } from './client'

export const recordInterestEvent = async (body) => (
  apiRequest('/interest/events', { method: 'POST', body })
)
