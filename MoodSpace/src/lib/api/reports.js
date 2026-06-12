import { apiRequest } from './client'

export const createReport = async (body) => apiRequest('/reports', { method: 'POST', body })
