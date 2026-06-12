import { Router } from 'express'
import { authRequired, optionalAuth } from '../../middleware/authRequired.js'
import { validate } from '../../middleware/validate.js'
import {
  searchHistoryListSchema,
  searchHistoryRecordSchema,
  searchQuerySchema,
  searchSuggestionsSchema,
} from './search.validation.js'
import * as controller from './search.controller.js'

export const searchRouter = Router()
export const searchSuggestionsRouter = Router()

searchRouter.get('/suggestions', optionalAuth, validate(searchSuggestionsSchema), controller.suggestions)
searchRouter.get('/history', authRequired, validate(searchHistoryListSchema), controller.history)
searchRouter.post('/history', authRequired, validate(searchHistoryRecordSchema), controller.recordHistory)
searchRouter.delete('/history', authRequired, controller.clearHistory)
searchRouter.get('/', optionalAuth, validate(searchQuerySchema), controller.search)

searchSuggestionsRouter.get('/', optionalAuth, validate(searchSuggestionsSchema), controller.suggestions)
