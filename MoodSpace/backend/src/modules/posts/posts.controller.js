import * as service from './posts.service.js'

export const publishWorkspace = async (req, res, next) => {
  try {
    const post = await service.publishWorkspace({
      userId: req.auth.sub,
      body: req.validated.body,
    })
    res.status(201).json({ post })
  } catch (error) {
    next(error)
  }
}

export const createMediaPost = async (req, res, next) => {
  try {
    const post = await service.createMediaPost({
      userId: req.auth.sub,
      body: req.validated.body,
    })
    res.status(201).json({ post })
  } catch (error) {
    next(error)
  }
}

export const createMediaDraft = async (req, res, next) => {
  try {
    const post = await service.saveMediaDraft({
      userId: req.auth.sub,
      body: req.validated.body,
    })
    res.status(201).json({ post })
  } catch (error) {
    next(error)
  }
}

export const updateMediaDraft = async (req, res, next) => {
  try {
    const post = await service.saveMediaDraft({
      userId: req.auth.sub,
      postId: req.validated.params.id,
      body: req.validated.body,
    })
    res.json({ post })
  } catch (error) {
    next(error)
  }
}

export const publishMediaDraft = async (req, res, next) => {
  try {
    const post = await service.publishMediaDraft({
      userId: req.auth.sub,
      postId: req.validated.params.id,
    })
    res.json({ post })
  } catch (error) {
    next(error)
  }
}

export const savePost = async (req, res, next) => {
  try {
    const result = await service.save({
      userId: req.auth.sub,
      postId: req.validated.params.id,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const unsavePost = async (req, res, next) => {
  try {
    const result = await service.unsave({
      userId: req.auth.sub,
      postId: req.validated.params.id,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const likePost = async (req, res, next) => {
  try {
    const result = await service.like({
      userId: req.auth.sub,
      postId: req.validated.params.id,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const unlikePost = async (req, res, next) => {
  try {
    const result = await service.unlike({
      userId: req.auth.sub,
      postId: req.validated.params.id,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getPost = async (req, res, next) => {
  try {
    const post = await service.getPost({
      viewerId: req.auth?.sub || null,
      postId: req.validated.params.id,
    })
    res.json({ post })
  } catch (error) {
    next(error)
  }
}

export const homeFeed = async (req, res, next) => {
  try {
    const result = await service.homeFeed({
      viewerId: req.auth?.sub || null,
      query: req.validated.query,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const userPosts = async (req, res, next) => {
  try {
    const result = await service.userPosts({
      viewerId: req.auth?.sub || null,
      username: req.validated.params.username,
      query: req.validated.query,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const savedPosts = async (req, res, next) => {
  try {
    const result = await service.savedPosts({
      viewerId: req.auth.sub,
      query: req.validated.query,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const recommendedPosts = async (req, res, next) => {
  try {
    const result = await service.recommendedPosts({
      viewerId: req.auth?.sub || null,
      postId: req.validated.params.id,
      query: req.validated.query,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const updatePost = async (req, res, next) => {
  try {
    const post = await service.updatePost({
      userId: req.auth.sub,
      postId: req.validated.params.id,
      body: req.validated.body,
    })
    res.json({ post })
  } catch (error) {
    next(error)
  }
}

export const similarPostsByImage = async (req, res, next) => {
  try {
    const result = await service.similarPostsByImage({
      viewerId: req.auth?.sub || null,
      imageId: req.validated.params.imageId,
      limit: req.validated.query.limit,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const deletePost = async (req, res, next) => {
  try {
    await service.deletePost({
      userId: req.auth.sub,
      postId: req.validated.params.id,
    })
    res.json({ deleted: true })
  } catch (error) {
    next(error)
  }
}
