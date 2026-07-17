const fs = require('fs');
const path = 'D:/Kelas-XI/MoodSpace/backend/src/modules/auth/auth.service.js';
let content = fs.readFileSync(path, 'utf8');
const start = content.indexOf('export const forgotPassword = async ({ email }) => {');
const end = content.indexOf('const authServiceHasPassword', start);
const clean = `export const forgotPassword = async ({ email }) => {
  const genericMsg = 'Kalau email terdaftar, kami kirim link reset password'

  const user = await findUserByEmailOrUsername(email)
  if (!user || !user.email) return { message: genericMsg }
  const hasPassword = await authServiceHasPassword(user.id)
  if (!hasPassword) return { message: genericMsg }

  const recent = await countRecentResetRequests({ userId: user.id, purpose: 'reset' })
  if (recent >= 5) return { message: genericMsg }

  await invalidateUserTokens({ userId: user.id, purpose: 'reset' })

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await createPasswordReset({ userId: user.id, purpose: 'reset', tokenHash, expiresAt })

  if (env.RESEND_API_KEY) {
    sendPasswordResetEmail({ to: user.email, username: user.username || 'pengguna', token: rawToken }).catch(() => {})
  }

  return { message: genericMsg }
}

const authServiceHasPassword`
content = content.slice(0, start) + clean + content.slice(end);
fs.writeFileSync(path, content, 'utf8');
console.log('DONE');
