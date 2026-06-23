import * as fontsService from './fonts.service.js'

export const uploadFont = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Font file is required' } })
    }
    const result = await fontsService.uploadFontFile({
      userId: req.auth.sub,
      fileBuffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      name: req.body?.name || '',
    })
    res.status(201).json({ font: result })
  } catch (error) {
    next(error)
  }
}

export const listFonts = async (req, res, next) => {
  try {
    const fonts = await fontsService.listUserFonts(req.auth.sub)
    res.json({ fonts })
  } catch (error) {
    next(error)
  }
}

export const deleteFont = async (req, res, next) => {
  try {
    const result = await fontsService.deleteFont({
      fontId: req.validated.params.id,
      userId: req.auth.sub,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const listFavorites = async (req, res, next) => {
  try {
    const families = await fontsService.listFavorites(req.auth.sub)
    res.json({ favorites: families })
  } catch (error) {
    next(error)
  }
}

export const addFavorite = async (req, res, next) => {
  try {
    const result = await fontsService.addFavorite({
      userId: req.auth.sub,
      fontFamily: req.validated.body.fontFamily,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const removeFavorite = async (req, res, next) => {
  try {
    const result = await fontsService.removeFavorite({
      userId: req.auth.sub,
      fontFamily: req.validated.params.fontFamily,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}
