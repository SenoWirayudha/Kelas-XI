import { Router } from 'express'
import { authRequired } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  sendCodeSchema,
  updateProfileSchema,
} from './auth.validation.js'
import * as controller from './auth.controller.js'

export const authRouter = Router()

authRouter.post('/register', validate(registerSchema), controller.register)
authRouter.post('/login', validate(loginSchema), controller.login)
authRouter.post('/refresh', validate(refreshSchema), controller.refresh)
authRouter.post('/logout', controller.logout)
authRouter.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword)
authRouter.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword)
authRouter.get('/me', authRequired, controller.me)
authRouter.get('/me/profile', authRequired, controller.me)
authRouter.patch('/me/profile', authRequired, validate(updateProfileSchema), controller.updateProfile)
authRouter.post('/me/send-code', authRequired, validate(sendCodeSchema), controller.sendVerificationCode)
authRouter.patch('/me/password', authRequired, validate(changePasswordSchema), controller.changePassword)
