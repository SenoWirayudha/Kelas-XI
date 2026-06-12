import jwt from 'jsonwebtoken'
import { env } from './env.js'

export const signAccessToken = (user) => jwt.sign(
  {
    sub: user.id,
    username: user.username,
    role: user.role,
  },
  env.JWT_ACCESS_SECRET,
  { expiresIn: env.ACCESS_TOKEN_TTL },
)

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET)
