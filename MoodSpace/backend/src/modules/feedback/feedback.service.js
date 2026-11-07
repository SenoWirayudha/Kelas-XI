import { env } from '../../config/env.js'
import { AppError } from '../../utils/errors.js'
import { sendFeedbackEmail } from '../../shared/email.service.js'

const feedbackBuckets = new Map()

const checkRateLimit = ({ key }) => {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  const max = env.FEEDBACK_RATE_LIMIT_MAX
  const entry = feedbackBuckets.get(key)
  if (!entry || now - entry.start > windowMs) {
    feedbackBuckets.set(key, { start: now, count: 1 })
    return
  }
  if (entry.count >= max) {
    const retrySec = Math.ceil((entry.start + windowMs - now) / 1000)
    throw new AppError(`Terlalu banyak feedback. Coba lagi dalam ${retrySec} detik`, { status: 429, code: 'FEEDBACK_RATE_LIMITED' })
  }
  entry.count += 1
}

export const createFeedback = async ({ category, message, contactEmail, pageUrl, user, ip, userAgent }) => {
  if (!env.BREVO_API_KEY) {
    throw new AppError('Email service belum dikonfigurasi (BREVO_API_KEY)', { status: 503, code: 'EMAIL_NOT_CONFIGURED' })
  }
  if (!env.FEEDBACK_TO) {
    throw new AppError('Feedback recipient belum dikonfigurasi (FEEDBACK_TO)', { status: 503, code: 'FEEDBACK_NOT_CONFIGURED' })
  }

  const emailKey = `email:${contactEmail.toLowerCase()}`
  checkRateLimit({ key: emailKey })
  if (user?.id) checkRateLimit({ key: `user:${user.id}` })
  else if (ip) checkRateLimit({ key: `ip:${ip}` })

  const fromUser = user ? { id: user.id, username: user.username || null, email: user.email || contactEmail } : { id: null, username: null, email: contactEmail }

  try {
    await sendFeedbackEmail({ category, message, contactEmail, pageUrl, userAgent, fromUser })
  } catch (err) {
    if (err.status) throw err
    console.error('[FEEDBACK] send failed:', err.message)
    throw new AppError('Gagal mengirim feedback. Coba lagi nanti', { status: 502, code: 'FEEDBACK_SEND_FAILED' })
  }

  return { ok: true }
}
