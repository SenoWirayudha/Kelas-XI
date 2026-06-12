import { AppError } from '../utils/errors.js'
import { formatBytesMB } from '../utils/format.js'

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
    status: 404,
    code: 'ROUTE_NOT_FOUND',
  }))
}

export const errorHandler = (error, req, res, _next) => {
  void _next
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        code: 'IMAGE_TOO_LARGE',
        message: `Ukuran gambar melebihi limit ${formatBytesMB(20 * 1024 * 1024)}`,
        details: {
          limitBytes: 20 * 1024 * 1024,
          limitMB: formatBytesMB(20 * 1024 * 1024),
        },
      },
    })
  }

  const isAppError = error instanceof AppError
  const status = isAppError ? error.status : 500
  const code = isAppError ? error.code : 'INTERNAL_ERROR'
  const message = isAppError ? error.message : 'Internal server error'

  if (!isAppError) {
    console.error(error)
  }

  res.status(status).json({
    error: {
      code,
      message,
      details: isAppError ? error.details : null,
    },
  })
}
