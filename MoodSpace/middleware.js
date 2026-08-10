// Vercel Routing Middleware — server-side Open Graph for /post/:id
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

function resolveApiBase() {
  const raw = process.env.VITE_API_URL || process.env.VITE_API_BASE_URL
  if (raw && /^https?:\/\//.test(raw)) {
    return raw.replace(/\/+$/, '')
  }
  return FALLBACK_API
}

function buildPostOgs(request, post) {
  const postId = post.id
  const url = `${CANONICAL_ORIGIN}/post/${postId}`
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

export const config = {
  matcher: ['/post/:id'],
}

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = BOT_RE.test(userAgent)

  if (!isBot) {
    // Defer back to the SPA (rewrite to /index.html).
    return new Response(null, { headers: { 'x-middleware-next': '1' } })
  }

  const url = new URL(request.url)
  const postId = decodeURIComponent(url.pathname.replace(/^\/post\//, '').replace(/\/+$/, ''))
  if (!postId) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } })
  }

  const apiBase = resolveApiBase()

  try {
    const timeout = AbortSignal.timeout(5000)
    const res = await fetch(`${apiBase}/posts/${postId}`, {
      headers: { accept: 'application/json' },
      signal: timeout,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.log(
        `[OG] posts/${postId} -> ${res.status} ${body.slice(0, 200)}`,
      )
      // Not found / private: let the SPA decide (it can show the 404 page).
      return new Response(null, { headers: { 'x-middleware-next': '1' } })
    }

    const json = await res.json()
    const post = json?.post
    if (!post) {
      return new Response(null, { headers: { 'x-middleware-next': '1' } })
    }

    const html = buildPostOgs(request, post)
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    })
  } catch (error) {
    console.log(`[OG] fetch posts/${postId} failed: ${error?.message || error}`)
    return new Response(null, { headers: { 'x-middleware-next': '1' } })
  }
}