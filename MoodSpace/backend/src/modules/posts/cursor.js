export const encodeCursor = (post) => Buffer.from(JSON.stringify({
  publishedAt: post.publishedAt,
  id: post.id,
  score: post.score,
})).toString('base64url')

export const decodeCursor = (cursor) => {
  if (!cursor) return null
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (!parsed.publishedAt || !parsed.id) return null
    return parsed
  } catch {
    return null
  }
}
