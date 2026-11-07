import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const BASE_URL = env.CLIENT_ORIGIN.split(',')[0].trim()

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: env.EMAIL_FROM,
    pass: env.BREVO_API_KEY,
  },
})

const PASSWORD_CHANGE_TEMPLATE = (username, ip) => ({
  subject: 'Password MoodSpace Anda Telah Diubah',
  html: `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="padding:32px 32px 0">
        <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a2e">Password Diubah</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.5">
          Hai ${username}, password akun MoodSpace Anda baru saja diubah.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.5">
          Jika Anda melakukan perubahan ini, abaikan email ini. Jika bukan Anda yang mengubah, segera hubungi kami.
        </p>
        ${ip ? `<p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.5">
          Perubahan dilakukan dari alamat IP: <strong>${ip}</strong>
        </p>` : ''}
        <div style="height:1px;background:#eee;margin:0 0 24px"></div>
        <p style="margin:0 0 32px;font-size:13px;color:#999">
          &copy; ${new Date().getFullYear()} MoodSpace
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`,
})

export const sendPasswordChangeEmail = async ({ to, username, ip }) => {
  if (!env.BREVO_API_KEY) return
  const { subject, html } = PASSWORD_CHANGE_TEMPLATE(username, ip)
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html })
  } catch (err) {
    console.error('[EMAIL] sendPasswordChangeEmail failed:', err)
  }
}

const PASSWORD_RESET_TEMPLATE = ({ username, token }) => ({
  subject: 'Reset Password MoodSpace',
  html: `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="padding:32px 32px 0">
        <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a2e">Reset Password</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.5">
          Hai ${username}, kami menerima permintaan reset password untuk akun MoodSpace Anda.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.5">
          Klik tombol di bawah untuk mereset password Anda. Link ini berlaku selama 60 menit.
        </p>
        <table cellpadding="0" cellspacing="0"><tr><td style="background:#1a1a2e;border-radius:8px;padding:12px 24px">
          <a href="${BASE_URL}/reset-password?token=${token}" target="_blank"
             style="color:#fff;text-decoration:none;font-size:15px;font-weight:600;display:block">
            Reset Password
          </a>
        </td></tr></table>
        <p style="margin:24px 0 0;font-size:13px;color:#999">
          Atau salin link berikut: ${BASE_URL}/reset-password?token=${token}
        </p>
        <div style="height:1px;background:#eee;margin:24px 0"></div>
        <p style="margin:0 0 32px;font-size:13px;color:#999">
          Jika Anda tidak meminta reset password, abaikan email ini.
          &copy; ${new Date().getFullYear()} MoodSpace
        </p>
      </td></tr></table>
    </table>
  </td></tr></table>
</body>
</html>`,
})

export const sendPasswordResetEmail = async ({ to, username, token }) => {
  if (!env.BREVO_API_KEY) {
    console.warn('[EMAIL] BREVO_API_KEY not set — cannot send password reset email to', to)
    return
  }
  const { subject, html } = PASSWORD_RESET_TEMPLATE({ username, token })
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html })
  } catch (err) {
    console.error('[EMAIL] sendPasswordResetEmail failed:', err.message, { to, type: 'password_reset' })
  }
}

const VERIFICATION_CODE_TEMPLATE = ({ username, code }) => ({
  subject: 'Kode Verifikasi MoodSpace',
  html: `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="480" cellpadding="0" cellspacing="0" style="margin:40px auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="padding:32px 32px 0">
      <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a2e">Kode Verifikasi</h1>
      <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.5">
        Hai ${username}, gunakan kode berikut untuk mengubah password MoodSpace Anda.
      </p>
      <div style="margin:24px 0;padding:20px;background:#f8f8f8;border-radius:8px;text-align:center;font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a2e">
        ${code}
      </div>
      <p style="margin:0 0 24px;font-size:13px;color:#999">
        Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.
      </p>
      <div style="height:1px;background:#eee;margin:0 0 24px"></div>
      <p style="margin:0 0 32px;font-size:13px;color:#999">
        &copy; ${new Date().getFullYear()} MoodSpace
      </p>
    </td></tr>
  </table>
</body>
</html>`,
})

export const sendVerificationCodeEmail = async ({ to, code }) => {
  if (!env.BREVO_API_KEY) return
  const { subject, html } = VERIFICATION_CODE_TEMPLATE({ username: to.split('@')[0], code })
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html })
  } catch (err) {
    console.error('[EMAIL] sendVerificationCodeEmail failed:', err)
  }
}

const escapeHtml = (str) =>
  String(str || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const FEEDBACK_CATEGORY_LABELS = {
  bug: 'Masalah Teknis',
  saran_fitur: 'Saran Fitur',
  pertanyaan: 'Pertanyaan',
  lainnya: 'Lainnya',
}

const FEEDBACK_TEMPLATE = ({ category, message, contactEmail, pageUrl, userAgent, fromUser }) => ({
  subject: `[MoodSpace] ${FEEDBACK_CATEGORY_LABELS[category] || category} dari ${fromUser?.username || contactEmail}`,
  html: `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="padding:32px 32px 0">
        <h1 style="margin:0 0 6px;font-size:20px;color:#1a1a2e">Feedback Baru — ${escapeHtml(FEEDBACK_CATEGORY_LABELS[category] || category)}</h1>
        <p style="margin:0 0 4px;font-size:13px;color:#888">Dari <strong style="color:#1a1a2e">${escapeHtml(fromUser?.username || 'Anonim')}</strong> &lt;${escapeHtml(contactEmail)}&gt;${fromUser?.id ? ` · ID: ${escapeHtml(fromUser.id)}` : ''}</p>
        ${pageUrl ? `<p style="margin:0 0 16px;font-size:13px;color:#888">Halaman: <a href="${escapeHtml(pageUrl)}" style="color:#1a1a2e;word-break:break-all">${escapeHtml(pageUrl)}</a></p>` : ''}
        <div style="margin:16px 0;padding:16px;background:#f8f8f8;border-radius:8px;border-left:4px solid #1a1a2e">
          <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.6;white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</p>
        </div>
        ${userAgent ? `<p style="margin:0 0 8px;font-size:12px;color:#999">User-Agent: ${escapeHtml(userAgent)}</p>` : ''}
        <p style="margin:0 0 4px;font-size:12px;color:#999">Balas langsung ke ${escapeHtml(contactEmail)} via Reply di email ini.</p>
        <div style="height:1px;background:#eee;margin:20px 0"></div>
        <p style="margin:0 0 24px;font-size:13px;color:#999">&copy; ${new Date().getFullYear()} MoodSpace · Feedback System</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`,
})

export const sendFeedbackEmail = async ({ category, message, contactEmail, pageUrl, userAgent, fromUser }) => {
  if (!env.BREVO_API_KEY) throw new Error('BREVO_API_KEY not configured')
  if (!env.FEEDBACK_TO) throw new Error('FEEDBACK_TO not configured')
  const { subject, html } = FEEDBACK_TEMPLATE({ category, message, contactEmail, pageUrl, userAgent, fromUser })
  const to = env.FEEDBACK_TO.split(',').map((s) => s.trim()).filter(Boolean).join(',')
  await transporter.sendMail({ from: env.EMAIL_FROM, to, replyTo: contactEmail, subject, html })
}
