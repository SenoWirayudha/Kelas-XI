import * as repo from './admin.repository.js'
import * as notificationRepo from '../notifications/notifications.repository.js'
import { notFound } from '../../utils/errors.js'

export const getStats = async () => {
  const [
    totalUsers, totalPosts, totalReports, unresolvedReports,
    totalComments, totalMedia, newUsersToday, postsPublishedToday,
    registrationTrend, postTrend,
  ] = await Promise.all([
    repo.countUsers(),
    repo.countPosts(),
    repo.countReports(),
    repo.countReports(false),
    repo.countComments(),
    repo.countMedia(),
    repo.countNewUsersToday(),
    repo.getPostsPublishedTodayCount(),
    repo.getRegistrationTrend(30),
    repo.getPostTrend(30),
  ])

  return {
    totalUsers,
    totalPosts,
    totalReports,
    unresolvedReports,
    totalComments,
    totalMedia,
    newUsersToday,
    postsPublishedToday,
    registrationTrend,
    postTrend,
  }
}

export const listUsers = async ({ search, role, status, page, pageSize }) => {
  const limit = Math.min(pageSize || 20, 100)
  const offset = ((page || 1) - 1) * limit

  const [users, total] = await Promise.all([
    repo.listAllUsers({ search, role, status, limit, offset }),
    repo.countAllUsers({ search, role, status }),
  ])

  return { users, total, page: page || 1, pageSize: limit }
}

export const patchUser = async (userId, patch) => {
  const user = await repo.updateUser(userId, patch)
  if (!user) throw notFound('User not found')
  return user
}

export const listPosts = async ({ search, status, page, pageSize }) => {
  const limit = Math.min(pageSize || 20, 100)
  const offset = ((page || 1) - 1) * limit

  const [posts, total] = await Promise.all([
    repo.listAllPosts({ search, status, limit, offset }),
    repo.countAllPosts({ search, status }),
  ])

  return { posts, total, page: page || 1, pageSize: limit }
}

export const deletePost = async (postId) => {
  const post = await repo.banPostById(postId)
  if (!post) throw notFound('Post not found')
  return post
}

export const listReports = async ({ resolved, page, pageSize }) => {
  const limit = Math.min(pageSize || 20, 100)
  const offset = ((page || 1) - 1) * limit

  const [reports, total] = await Promise.all([
    repo.listAllReports({ resolved, limit, offset }),
    repo.countAllReports(resolved),
  ])

  return { reports, total, page: page || 1, pageSize: limit }
}

export const resolveReport = async (reportId, adminId, resolution) => {
  const reportDetail = await repo.findReportById(reportId)
  if (!reportDetail) throw notFound('Report not found')

  if (resolution === 'post_deleted') {
    if (reportDetail.postId) await repo.banPostById(reportDetail.postId)
    if (reportDetail.authorId) {
      await notificationRepo.insertNotification({
        userId: reportDetail.authorId,
        actorId: adminId,
        type: 'post_deleted',
        targetType: 'post',
        targetId: reportDetail.postId,
        metadata: { postTitle: reportDetail.postTitle || 'Untitled', reason: reportDetail.reason },
      })
    }
    return { message: 'Post banned, report stays visible' }
  }

  const report = await repo.resolveReport(reportId, adminId, resolution)
  if (!report) throw notFound('Report not found')

  if (resolution === 'warned' && reportDetail.authorId) {
    await notificationRepo.insertNotification({
      userId: reportDetail.authorId,
      actorId: adminId,
      type: 'report_warning',
      targetType: 'post',
      targetId: reportDetail.postId,
      metadata: { postTitle: reportDetail.postTitle || 'Untitled', reason: reportDetail.reason },
    })
  }

  return report
}

export const listComments = async ({ search, page, pageSize }) => {
  const limit = Math.min(pageSize || 20, 100)
  const offset = ((page || 1) - 1) * limit

  const [comments, total] = await Promise.all([
    repo.listAllComments({ search, limit, offset }),
    repo.countAllComments({ search }),
  ])

  return { comments, total, page: page || 1, pageSize: limit }
}

export const deleteComment = async (commentId) => {
  const comment = await repo.deleteCommentById(commentId)
  if (!comment) throw notFound('Comment not found')
  return comment
}

export const listMedia = async ({ page, pageSize }) => {
  const limit = Math.min(pageSize || 20, 100)
  const offset = ((page || 1) - 1) * limit

  const [media, total, totalSize] = await Promise.all([
    repo.listAllMedia({ limit, offset }),
    repo.countAllMedia(),
    repo.sumAllMediaSize(),
  ])

  return { media, total, totalSize, page: page || 1, pageSize: limit }
}

export const deleteMedia = async (mediaId) => {
  const asset = await repo.deleteMediaById(mediaId)
  if (!asset) throw notFound('Media not found')
  return asset
}

export const makeAdmin = async (identifier) => {
  const user = await repo.setUserRoleAsAdmin(identifier)
  if (!user) throw notFound('Active user not found with that email or username')
  return user
}
