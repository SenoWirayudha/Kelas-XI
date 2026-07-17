import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { mediaRouter } from './modules/media/media.routes.js'
import { workspacesRouter } from './modules/workspaces/workspaces.routes.js'
import { feedRouter, postsRouter, userPostsRouter } from './modules/posts/posts.routes.js'
import { boardsRouter } from './modules/boards/boards.routes.js'
import { commentsRouter } from './modules/comments/comments.routes.js'
import { profilesRouter } from './modules/profiles/profiles.routes.js'
import { reportsRouter } from './modules/reports/reports.routes.js'
import { searchRouter, searchSuggestionsRouter } from './modules/search/search.routes.js'
import { followsRouter } from './modules/follows/follows.routes.js'
import { notificationsRouter } from './modules/notifications/notifications.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { externalImagesRouter } from './modules/externalImages/externalImages.routes.js'
import { interestRouter } from './modules/interest/interest.routes.js'
import { removeBgRouter } from './modules/removeBg/removeBg.routes.js'
import { fontsRouter } from './modules/fonts/fonts.routes.js'

export const createApp = () => {
  const app = express()

  app.use(cors({
    origin: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  }))
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.use((req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ error: { message: 'Server timeout', code: 'TIMEOUT' } })
      }
    }, 45_000)
    res.on('finish', () => clearTimeout(timer))
    next()
  })

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/media', mediaRouter)
  app.use('/api/workspaces', workspacesRouter)
  app.use('/api/boards', boardsRouter)
  app.use('/api/posts', postsRouter)
  app.use('/api/posts', commentsRouter)
  app.use('/api/feed', feedRouter)
  app.use('/api/users', userPostsRouter)
  app.use('/api/users', profilesRouter)
  app.use('/api/reports', reportsRouter)
  app.use('/api/follows', followsRouter)
  app.use('/api/search-suggestions', searchSuggestionsRouter)
  app.use('/api/search', searchRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/external-images', externalImagesRouter)
  app.use('/api/interest', interestRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api', removeBgRouter)
  app.use('/api/fonts', fontsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
