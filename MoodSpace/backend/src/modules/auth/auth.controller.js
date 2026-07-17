import { env } from '../../config/env.js'
import * as authService from './auth.service.js'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.COOKIE_SECURE,
  path: '/api/auth',
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
}

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions)
}

const clearRefreshCookie = (res) => {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    ...cookieOptions,
    maxAge: undefined,
  })
}

const authResponse = (res, result, status = 200) => {
  setRefreshCookie(res, result.refreshToken)
  return res.status(status).json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    session: result.session,
  })
}

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.validated.body, req)
    return authResponse(res, result, 201)
  } catch (error) {
    return next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.validated.body, req)
    return authResponse(res, result)
  } catch (error) {
    return next(error)
  }
}

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.validated.body.refreshToken || req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME]
    const result = await authService.refresh(refreshToken)
    return authResponse(res, result)
  } catch (error) {
    return next(error)
  }
}

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME]
    await authService.logout(refreshToken)
    clearRefreshCookie(res)
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
}

export const me = async (req, res, next) => {
  try {
    const user = await authService.me(req.auth.sub)
    return res.json({ user })
  } catch (error) {
    return next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.patchProfile(req.auth.sub, req.validated.body)
    return res.json({ user })
  } catch (error) {
    return next(error)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(
      req.auth.sub,
      req.validated.body.currentPassword,
      req.validated.body.newPassword,
      req.validated.body.verificationCode,
      req.ip,
    )
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword({ email: req.validated.body.email })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword({
      token: req.validated.body.token,
      newPassword: req.validated.body.newPassword,
    })
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}

export const sendVerificationCode = async (req, res, next) => {
  try {
    const result = await authService.sendVerificationCode(req.auth.sub)
    return res.json(result)
  } catch (error) {
    return next(error)
  }
}
