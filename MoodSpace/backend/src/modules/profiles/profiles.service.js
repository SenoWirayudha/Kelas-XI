import { notFound } from '../../utils/errors.js'
import { findPublicProfile } from './profiles.repository.js'

export const getPublicProfile = async ({ username, viewerId }) => {
  const profile = await findPublicProfile({ username, viewerId })
  if (!profile) throw notFound('Profile not found')
  return {
    ...profile,
    bio: profile.bio || '',
    socialLinks: profile.socialLinks || {},
    metadata: profile.profileMetadata || {},
  }
}
