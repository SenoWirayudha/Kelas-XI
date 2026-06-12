import { AppError } from '../utils/errors.js'

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  })

  if (!result.success) {
    return next(new AppError('Invalid request payload', {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: result.error.flatten(),
    }))
  }

  req.validated = result.data
  return next()
}
