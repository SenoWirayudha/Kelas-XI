export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details = null } = {}) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const notFound = (message = 'Resource not found') => (
  new AppError(message, { status: 404, code: 'NOT_FOUND' })
)

export const unauthorized = (message = 'Authentication required') => (
  new AppError(message, { status: 401, code: 'UNAUTHORIZED' })
)

export const forbidden = (message = 'Forbidden') => (
  new AppError(message, { status: 403, code: 'FORBIDDEN' })
)

export const badRequest = (message = 'Bad request') => (
  new AppError(message, { status: 400, code: 'BAD_REQUEST' })
)

export const conflict = (message = 'Conflict') => (
  new AppError(message, { status: 409, code: 'CONFLICT' })
)
