import * as service from './search.service.js'

export const search = async (req, res, next) => {
  try {
    const result = await service.search({
      viewerId: req.auth?.sub || null,
      query: req.validated.query,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const suggestions = async (req, res, next) => {
  try {
    const result = await service.suggestions({
      query: req.validated.query,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const history = async (req, res, next) => {
  try {
    const result = await service.history({
      userId: req.auth.sub,
      query: req.validated.query,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const recordHistory = async (req, res, next) => {
  try {
    const result = await service.recordHistory({
      userId: req.auth.sub,
      body: req.validated.body,
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const clearHistory = async (req, res, next) => {
  try {
    const result = await service.clearHistory({
      userId: req.auth.sub,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}
