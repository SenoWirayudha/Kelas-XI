// Vercel Routing Middleware — server-side Open Graph for shareable routes.
// Runs on Vercel Edge before the SPA is served. Only bots get a lightweight
// OG-prerendered HTML; real users pass through to the app (x-middleware-next).

const FALLBACK_API = 'https://moodspace-1f37.onbelmo.uk/api'

const BOT_RE = /(facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot|Discordbot|Pinterest|Pinterestbot|redditbot|Reddit|Googlebot|bingbot|YandexBot|MetaInspector|Viber|Line|Discord|Telegram|SkypeUriPreview|Mastodon|Snapchat|Kakaotalk|qq|Baiduspider|DuckDuckBot|Sogou|Exabot|Yeti|facebook|crawler|spider|preview|botlink|curl|node-fetch|postman)/i

const SITE_NAME = 'MoodSpace'
const CANONICAL_ORIGIN = 'https://moodspace-app.vercel.app'
const FALLBACK_IMAGE = `${CANONICAL_ORIGIN}/logo.png`

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const PASSTHROUGH = () => new Response(null, { headers: { 'x-middleware-next': '1' } })

function resolveApiBase() {
  const raw = process.env.VITE_API_URL || process.env.VITE_API_BASE_URL
  if (raw && /^https?:\/\//.test(raw)) {
    return raw.replace(/\/+$/, '')
  }
  return FALLBACK_API
}

function buildOgsHtml({ url, title, description, image, imageW, imageH, imageMime }) {
  const tags = []
  if (description) tags.push(`<meta name="description" content="${escapeHtml(description)}" />`)
  tags.push(`<link rel="canonical" href="${url}" />`)
  tags.push(`<meta property="og:type" content="article" />`)
  tags.push(`<meta property="og:site_name" content="${SITE_NAME}" />`)
  tags.push(`<meta property="og:title" content="${escapeHtml(title)}" />`)
  if (description) tags.push(`<meta property="og:description" content="${escapeHtml(description)}" />`)
  tags.push(`<meta property="og:url" content="${url}" />`)
  tags.push(`<meta property="og:image" content="${image}" />`)
  if (imageMime) tags.push(`<meta property="og:image:type" content="${imageMime}" />`)
  if (imageW) tags.push(`<meta property="og:image:width" content="${imageW}" />`)
  if (imageH) tags.push(`<meta property="og:image:height" content="${imageH}" />`)
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`)
  tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}" />`)
  if (description) tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}" />`)
  tags.push(`<meta name="twitter:image" content="${image}" />`)

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow" />
    <title>${escapeHtml(title)}</title>
    ${tags.join('\n    ')}
  </head>
  <body></body>
</html>`
}

// --- Resolvers. Each returns an OG HTML string for bots, or null to pass through.

const buildPostOgs = (post) => {
  const url = `${CANONICAL_ORIGIN}/post/${post.id}`
  const author = post.author || {}
  const creator = author.displayName || author.username || ''
  const title = creator ? `${post.title ?? 'Karya'} · by ${creator}` : (post.title ?? 'Karya')
  const description = post.caption || `Lihat karya ini di ${SITE_NAME}.`
  const media = Array.isArray(post.media) ? post.media : []
  const firstImage = media.find((m) => m && m.url && /^https?:/.test(m.url))?.url
  const image = (post.cover?.url && /^https?:/.test(post.cover.url) && post.cover.url) || firstImage || FALLBACK_IMAGE
  const imageW = post.cover?.width || media.find((m) => m && m.width)?.width
  const imageH = post.cover?.height || media.find((m) => m && m.height)?.height
  const imageMime = post.cover?.mimeType || media.find((m) => m && m.mimeType)?.mimeType

  return buildOgsHtml({ url, title, description, image, imageW, imageH, imageMime })
}

const buildTemplateOgs = (workspace) => {
  const url = `${CANONICAL_ORIGIN}/template/${workspace.shareToken || ''}`
  const title = workspace.title ? `${workspace.title} · Template ${SITE_NAME}` : `Template di ${SITE_NAME}`
  const description = workspace.description || `Pakai template desain ini di ${SITE_NAME}.`
  const image = (workspace.thumbnailUrl && /^https?:/.test(workspace.thumbnailUrl) && workspace.thumbnailUrl) || FALLBACK_IMAGE

  return buildOgsHtml({ url, title, description, image })
}

const buildBoardOgs = (board) => {
  const url = `${CANONICAL_ORIGIN}/boards/${board.id}`
  const title = board.name || `Board di ${SITE_NAME}`
  const description = board.description || (board.itemCount ? `${board.itemCount} item di board ${board.name || 'ini'}.` : `Koleksi board di ${SITE_NAME}.`)
  const covers = Array.isArray(board.coverImages) ? board.coverImages : []
  const firstImage = covers.find((u) => u && /^https?:/.test(u)) || FALLBACK_IMAGE

  return buildOgsHtml({ url, title, description, image: firstImage })
}

const buildInviteOgs = (info) => {
  const url = `${CANONICAL_ORIGIN}/workspace/invite/${info.token}`
  const owner = info.owner || {}
  const creator = owner.displayName || owner.username || ''
  const title = info.workspaceTitle ? `${info.workspaceTitle} · Undangan ${SITE_NAME}` : `Undangan kolaborasi di ${SITE_NAME}`
  const description = `Kamu diundang menjadi kolaborator${
    info.role ? ` (${info.role === 'edit' ? 'Edit' : 'View'})` : ''
  }${creator ? ` oleh ${creator}` : ''} di ${SITE_NAME}.`
  const image = (info.thumbnailUrl && /^https?:/.test(info.thumbnailUrl) && info.thumbnailUrl)
    || (owner.avatarUrl && /^https?:/.test(owner.avatarUrl) && owner.avatarUrl)
    || FALLBACK_IMAGE

  return buildOgsHtml({ url, title, description, image })
}

const buildProfileOgs = (profile) => {
  const url = `${CANONICAL_ORIGIN}/user/${profile.username}`
  const name = profile.displayName || profile.username || 'Pengguna'
  const title = `${name}${profile.username ? ` (@${profile.username})` : ''} · ${SITE_NAME}`
  const countParts = []
  if (profile.postCount != null) countParts.push(`${profile.postCount} post`)
  if (profile.boardCount != null) countParts.push(`${profile.boardCount} board`)
  const countText = countParts.length ? ` — ${countParts.join(', ')}.` : '.'
  const description = profile.bio || `Profil ${name} di ${SITE_NAME}${countText}`
  const image = (profile.bannerUrl && /^https?:/.test(profile.bannerUrl) && profile.bannerUrl)
    || (profile.avatarUrl && /^https?:/.test(profile.avatarUrl) && profile.avatarUrl)
    || FALLBACK_IMAGE

  return buildOgsHtml({ url, title, description, image })
}

// --- Route table. `matcher` controls which paths invoke the middleware ---

export const config = {
  matcher: [
    '/post/:id',
    '/template/:token',
    '/boards/:id',
    '/workspace/invite/:token',
    '/user/:username',
  ],
}

function findRoute(pathname) {
  const clean = pathname.split('?')[0]
  const segments = clean.split('/').filter(Boolean)

  if (segments[0] === 'post' && segments.length === 2) {
    return { kind: 'post', pathApi: `/posts/${segments[1]}` }
  }
  if (segments[0] === 'template' && segments.length === 2) {
    // by-token endpoint accepts the share token in { token }
    return { kind: 'template', pathApi: `/workspaces/by-token/${segments[1]}`, token: segments[1] }
  }
  if (segments[0] === 'boards' && segments.length === 2) {
    return { kind: 'board', pathApi: `/boards/public/${segments[1]}` }
  }
  if (segments[0] === 'workspace' && segments[1] === 'invite' && segments.length === 3) {
    return { kind: 'invite', pathApi: `/workspaces/invite/${segments[2]}`, token: segments[2] }
  }
  if (segments[0] === 'user' && segments.length === 2) {
    return { kind: 'user', pathApi: `/users/${segments[1]}/profile` }
  }
  return null
}

async function fetchJson(path) {
  const apiBase = resolveApiBase()
  const timeout = AbortSignal.timeout(5000)
  const res = await fetch(`${apiBase}${path}`, {
    headers: { accept: 'application/json' },
    signal: timeout,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.log(`[OG] ${path} -> ${res.status} ${body.slice(0, 200)}`)
    return null
  }
  return res.json()
}

async function resolve(kind, data, token) {
  switch (kind) {
    case 'post':
      if (data?.post) return buildPostOgs(data.post)
      return null
    case 'template': {
      if (data?.shareToken || (data && (data.id || data.title || data.thumbnailUrl))) {
        // by-token response shape: { id, title, description, thumbnailUrl, isTemplate }.
        const workspace = { ...data, shareToken: token }
        return buildTemplateOgs(workspace)
      }
      return null
    }
    case 'board':
      if (data && (data.id || data.name)) return buildBoardOgs(data)
      return null
    case 'invite':
      if (data && (data.workspaceId || data.workspaceTitle || data.thumbnailUrl)) return buildInviteOgs({ ...data, token })
      return null
    case 'user':
      if (data?.profile) return buildProfileOgs(data.profile)
      return null
    default:
      return null
  }
}

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = BOT_RE.test(userAgent)

  if (!isBot) {
    return PASSTHROUGH()
  }

  const url = new URL(request.url)
  const route = findRoute(url.pathname)
  if (!route) {
    return PASSTHROUGH()
  }

  try {
    const data = await fetchJson(route.pathApi)
    if (!data) return PASSTHROUGH()

    const html = await resolve(route.kind, data, route.token)
    if (!html) return PASSTHROUGH()

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    })
  } catch (error) {
    console.log(`[OG] fetch ${route.pathApi} failed: ${error?.message || error}`)
    return PASSTHROUGH()
  }
}