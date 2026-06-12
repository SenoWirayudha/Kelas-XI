import * as adminService from './admin.service.js'

export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats()
    return res.json(stats)
  } catch (error) {
    return next(error)
  }
}

export const listUsers = async (req, res, next) => {
  try {
    const { search, role, status, page, pageSize } = req.query
    const result = await adminService.listUsers({ search, role, status, page: Number(page), pageSize: Number(pageSize) })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const patchUser = async (req, res, next) => {
  try {
    const user = await adminService.patchUser(req.params.id, req.body)
    return res.json(user)
  } catch (error) {
    return next(error)
  }
}

export const listPosts = async (req, res, next) => {
  try {
    const { search, status, page, pageSize } = req.query
    const result = await adminService.listPosts({ search, status, page: Number(page), pageSize: Number(pageSize) })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const deletePost = async (req, res, next) => {
  try {
    await adminService.deletePost(req.params.id)
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
}

export const listReports = async (req, res, next) => {
  try {
    const { resolved, page, pageSize } = req.query
    const result = await adminService.listReports({ resolved: resolved === 'true', page: Number(page), pageSize: Number(pageSize) })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const resolveReport = async (req, res, next) => {
  try {
    const report = await adminService.resolveReport(req.params.id, req.auth.sub, req.body.resolution)
    return res.json(report)
  } catch (error) {
    return next(error)
  }
}

export const listComments = async (req, res, next) => {
  try {
    const { search, page, pageSize } = req.query
    const result = await adminService.listComments({ search, page: Number(page), pageSize: Number(pageSize) })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const deleteComment = async (req, res, next) => {
  try {
    await adminService.deleteComment(req.params.id)
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
}

export const listMedia = async (req, res, next) => {
  try {
    const { page, pageSize } = req.query
    const result = await adminService.listMedia({ page: Number(page), pageSize: Number(pageSize) })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const deleteMedia = async (req, res, next) => {
  try {
    await adminService.deleteMedia(req.params.id)
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
}

export const makeAdmin = async (req, res, next) => {
  try {
    const user = await adminService.makeAdmin(req.body.identifier)
    return res.json({ message: 'User promoted to admin', user })
  } catch (error) {
    return next(error)
  }
}
