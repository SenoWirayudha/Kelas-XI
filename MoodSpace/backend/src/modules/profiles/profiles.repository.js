import { query } from '../../db/pool.js'

export const findPublicProfile = async ({ username, viewerId = null }) => {
  const { rows } = await query(
    `select
       u.id,
       u.username,
       coalesce(u.display_name, u.username) as "displayName",
       p.bio,
       p.website_url as "websiteUrl",
       p.location,
       p.social_links as "socialLinks",
       p.profile_metadata as "profileMetadata",
       avatar.public_url as "avatarUrl",
       banner.public_url as "bannerUrl",
       (select count(*)::int from follows where following_id = u.id) as "followerCount",
       (select count(*)::int from follows where follower_id = u.id) as "followingCount",
       (select count(*)::int from boards where owner_id = u.id) as "boardCount",
       (select count(*)::int from posts where author_id = u.id and status = 'published') as "postCount",
       exists (
         select 1 from follows
         where follower_id = $2 and following_id = u.id
       ) as "isFollowing"
     from users u
     left join user_profiles p on p.user_id = u.id
     left join media_assets avatar on avatar.id = p.avatar_media_id and avatar.deleted_at is null
     left join media_assets banner on banner.id = p.banner_media_id and banner.deleted_at is null
     where lower(u.username) = lower($1)
       and u.status = 'active'
     limit 1`,
    [username, viewerId],
  )
  return rows[0] || null
}
