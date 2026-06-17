import * as service from './externalImages.service.js'

export const search = async (req, res, next) => {
  try {
    const result = await service.searchExternalImages({
      ...req.validated.query,
      viewerId: req.auth?.sub || null,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const ensure = async (req, res, next) => {
  try {
    const image = await service.ensureExternalImage(req.validated.body)
    res.status(201).json({ image })
  } catch (error) {
    next(error)
  }
}

export const get = async (req, res, next) => {
  try {
    const image = await service.getExternalImage({
      id: decodeURIComponent(req.validated.params.id),
      userId: req.auth?.sub || null,
    })
    res.json({ image })
  } catch (error) {
    next(error)
  }
}

export const save = async (req, res, next) => {
  try {
    res.status(201).json(await service.save({
      userId: req.auth.sub,
      image: req.validated.body.image,
    }))
  } catch (error) {
    next(error)
  }
}

export const unsave = async (req, res, next) => {
  try {
    res.json(await service.unsave({
      userId: req.auth.sub,
      id: decodeURIComponent(req.validated.params.id),
    }))
  } catch (error) {
    next(error)
  }
}

export const saved = async (req, res, next) => {
  try {
    res.json(await service.saved({
      userId: req.auth.sub,
      limit: req.validated.query.limit,
    }))
  } catch (error) {
    next(error)
  }
}

export const visualSearch = async (req, res, next) => {
  try {
    const result = await service.visualSearch({
      imageUrl: req.validated.query.imageUrl,
      limit: req.validated.query.limit,
      viewerId: req.auth?.sub || null,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}
