import * as service from './boards.service.js'

export const listBoards = async (req, res, next) => {
  try {
    res.json({ boards: await service.listBoards(req.auth.sub) })
  } catch (error) {
    next(error)
  }
}

export const getBoard = async (req, res, next) => {
  try {
    res.json({ board: await service.getBoard({ userId: req.auth.sub, boardId: req.validated.params.id }) })
  } catch (error) {
    next(error)
  }
}

export const createBoard = async (req, res, next) => {
  try {
    const board = await service.createBoard({ userId: req.auth.sub, body: req.validated.body })
    res.status(201).json({ board })
  } catch (error) {
    next(error)
  }
}

export const addBoardItem = async (req, res, next) => {
  try {
    res.status(201).json(await service.addBoardItem({
      userId: req.auth.sub,
      boardId: req.validated.params.id,
      body: req.validated.body,
    }))
  } catch (error) {
    next(error)
  }
}

export const removeBoardItem = async (req, res, next) => {
  try {
    await service.removeBoardItem({
      userId: req.auth.sub,
      boardId: req.validated.params.id,
      itemId: req.validated.params.itemId,
    })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const deleteBoard = async (req, res, next) => {
  try {
    await service.deleteBoard({ userId: req.auth.sub, boardId: req.validated.params.id })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
