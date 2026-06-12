import { Router } from 'express'
import { authRequired, optionalAuth } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import {
  feedQuerySchema,
  createMediaPostSchema,
  mediaPostDraftParamSchema,
  mediaPostDraftSchema,
  postIdParamSchema,
  publishWorkspaceSchema,
  recommendedPostsSchema,
  savedPostsSchema,
  updatePostSchema,
  usernamePostsSchema,
} from './posts.validation.js'
import * as controller from './posts.controller.js'

export const postsRouter = Router()
export const feedRouter = Router()
export const userPostsRouter = Router()

postsRouter.post('/publish-workspace', authRequired, validate(publishWorkspaceSchema), controller.publishWorkspace)
postsRouter.post('/drafts', authRequired, validate(mediaPostDraftSchema), controller.createMediaDraft)
postsRouter.post('/', authRequired, validate(createMediaPostSchema), controller.createMediaPost)
postsRouter.get('/saved', authRequired, validate(savedPostsSchema), controller.savedPosts)
postsRouter.get('/:id/recommended', optionalAuth, validate(recommendedPostsSchema), controller.recommendedPosts)
postsRouter.get('/:id', optionalAuth, validate(postIdParamSchema), controller.getPost)
postsRouter.put('/:id/draft', authRequired, validate(mediaPostDraftParamSchema), controller.updateMediaDraft)
postsRouter.post('/:id/publish', authRequired, validate(postIdParamSchema), controller.publishMediaDraft)
postsRouter.post('/:id/like', authRequired, validate(postIdParamSchema), controller.likePost)
postsRouter.post('/:id/save', authRequired, validate(postIdParamSchema), controller.savePost)
postsRouter.put('/:id', authRequired, validate(updatePostSchema), controller.updatePost)
postsRouter.delete('/:id', authRequired, validate(postIdParamSchema), controller.deletePost)
postsRouter.delete('/:id/like', authRequired, validate(postIdParamSchema), controller.unlikePost)
postsRouter.delete('/:id/save', authRequired, validate(postIdParamSchema), controller.unsavePost)

feedRouter.get('/', optionalAuth, validate(feedQuerySchema), controller.homeFeed)

userPostsRouter.get('/:username/posts', optionalAuth, validate(usernamePostsSchema), controller.userPosts)
