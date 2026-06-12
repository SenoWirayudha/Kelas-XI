export const externalImageToPost = (image) => ({
  id: image.id,
  isExternalImage: true,
  externalProvider: image.provider,
  externalImage: image,
  sourceUrl: image.sourceUrl,
  title: image.title || 'Open image',
  caption: image.description || '',
  status: 'external',
  tags: image.tags || [],
  cover: {
    mediaId: image.id,
    url: image.thumbnailUrl || image.url,
    width: image.width,
    height: image.height,
  },
  media: [{
    mediaId: image.id,
    url: image.url,
    width: image.width,
    height: image.height,
  }],
  author: {
    id: image.provider,
    username: image.provider === 'wikimedia' ? 'Wikimedia Commons' : image.provider === 'tmdb' ? 'TMDB' : image.provider,
    displayName: image.author || image.provider,
    avatarUrl: null,
  },
  isSaved: !!image.isSaved,
  likeCount: 0,
  saveCount: 0,
  viewCount: 0,
  uniqueViewCount: 0,
})

const removeEmptyValues = (value) => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''),
)

export const postToExternalImagePayload = (post) => removeEmptyValues(post.externalImage || {
  id: post.id,
  provider: post.externalProvider || 'external',
  externalId: String(post.id).split(':').slice(1).join(':') || post.id,
  title: post.title,
  description: post.caption || '',
  tags: post.tags || [],
  url: post.media?.[0]?.url || post.cover?.url,
  thumbnailUrl: post.cover?.url,
  width: post.media?.[0]?.width || post.cover?.width,
  height: post.media?.[0]?.height || post.cover?.height,
  sourceUrl: post.sourceUrl,
})
