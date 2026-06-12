import * as service from './comments.service.js'

export const listComments = async (req, res, next) => {
  try {
    const result = await service.listComments({
      postId: req.validated.params.postId,
      cursor: req.validated.query.cursor,
      limit: req.validated.query.limit,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const createComment = async (req, res, next) => {
  try {
    const comment = await service.createComment({
      postId: req.validated.params.postId,
      userId: req.auth.sub,
      content: req.validated.body.content,
    })
    res.status(201).json({ comment })
  } catch (error) {
    next(error)
  }
}

export const deleteComment = async (req, res, next) => {
  try {
    await service.deleteComment({
      commentId: req.validated.params.commentId,
      userId: req.auth.sub,
    })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
