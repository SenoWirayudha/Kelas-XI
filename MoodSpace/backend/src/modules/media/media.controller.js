import * as mediaService from './media.service.js'
import { formatBytesMB } from '../../utils/format.js'
import { AppError } from '../../utils/errors.js'

export const signUpload = async (req, res, next) => {
  try {
    const result = await mediaService.signUpload({
      userId: req.auth.sub,
      ...req.validated.body,
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const completeUpload = async (req, res, next) => {
  try {
    const result = await mediaService.completeUpload({
      userId: req.auth.sub,
      ...req.validated.body,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('File image wajib dikirim sebagai multipart FormData field "file"', {
        status: 400,
        code: 'UPLOAD_FILE_REQUIRED',
      })
    }

    console.log('[media upload] parsed upload payload', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      sizeBytes: req.file.size,
      sizeMB: formatBytesMB(req.file.size),
      mimeType: req.file.mimetype,
      width: req.body?.width,
      height: req.body?.height,
      sourceType: req.body?.sourceType,
      addToUploads: req.body?.addToUploads,
    })

    const result = await mediaService.uploadImageFile({
      userId: req.auth.sub,
      fileBuffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      width: req.body?.width ? Number(req.body.width) : undefined,
      height: req.body?.height ? Number(req.body.height) : undefined,
      title: req.file.originalname || 'Uploaded image',
      visibility: 'private',
      sourceType: req.body?.sourceType || 'upload',
      addToUploads: req.body?.addToUploads === undefined ? req.body?.sourceType === undefined || req.body?.sourceType === 'upload' : req.body.addToUploads === 'true',
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const listUploads = async (req, res, next) => {
  try {
    const assets = await mediaService.listUserUploads(req.auth.sub)
    res.json({ assets })
  } catch (error) {
    next(error)
  }
}

export const deleteMedia = async (req, res, next) => {
  try {
    await mediaService.deleteMedia({
      userId: req.auth.sub,
      mediaId: req.validated.params.id,
    })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
