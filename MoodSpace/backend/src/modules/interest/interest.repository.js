import { query } from '../../db/pool.js'

export const insertInterestEvent = async ({ userId, eventType, tags = [], query: searchQuery = null, projectId = null, weight = 1 }) => {
  const { rows } = await query(
    `insert into user_interest_events (user_id, event_type, tags, query, project_id, weight)
     values ($1, $2, $3::text[], $4, $5, $6)
     returning id`,
    [userId, eventType, tags, searchQuery || null, projectId || null, weight],
  )
  return rows[0] || null
}

export const getTopRecentInterestTags = async ({ userId, limit = 24 }) => {
  if (!userId) return []
  const { rows } = await query(
    `select
       tag,
       sum(
         weight * exp(
           -extract(epoch from (now() - created_at)) /
           extract(epoch from (
             case event_type
               when 'open_post'       then interval '6 hours'
               when 'search'          then interval '3 days'
               when 'save_post'       then interval '7 days'
               when 'add_to_board'    then interval '7 days'
               when 'drop_to_canvas'  then interval '7 days'
               else                        interval '7 days'
             end
           ))
         )
       )::float as score
     from user_interest_events
     cross join lateral unnest(tags) as event_tag(tag)
     where user_id = $1
       and created_at >= now() - interval '7 days'
       and tag is not null
       and trim(tag) <> ''
     group by tag
     order by score desc, tag asc
     limit $2`,
    [userId, limit],
  )
  return rows
}

export const getTopRecentInterestTagsWithScores = async ({ userId, limit = 24 }) => {
  if (!userId) return []
  const { rows } = await query(
    `select
       tag,
       sum(
         weight * exp(
           -extract(epoch from (now() - created_at)) /
           extract(epoch from (
             case event_type
               when 'open_post'       then interval '6 hours'
               when 'search'          then interval '3 days'
               when 'save_post'       then interval '7 days'
               when 'add_to_board'    then interval '7 days'
               when 'drop_to_canvas'  then interval '7 days'
               else                        interval '7 days'
             end
           ))
         )
       )::float as score
     from user_interest_events
     cross join lateral unnest(tags) as event_tag(tag)
     where user_id = $1
       and created_at >= now() - interval '7 days'
       and tag is not null
       and trim(tag) <> ''
     group by tag
     order by score desc, tag asc
     limit $2`,
    [userId, limit],
  )
  return rows
}

export const getTopRecentInterestQueries = async ({ userId, limit = 12 }) => {
  if (!userId) return []
  const { rows } = await query(
    `select
       query,
       sum(
         weight * exp(
           -extract(epoch from (now() - created_at)) /
           extract(epoch from (
             case event_type
               when 'open_post'       then interval '6 hours'
               when 'search'          then interval '3 days'
               when 'save_post'       then interval '7 days'
               when 'add_to_board'    then interval '7 days'
               when 'drop_to_canvas'  then interval '7 days'
               else                        interval '7 days'
             end
           ))
         )
       )::float as score,
       count(*)::int as "eventCount",
       array_agg(distinct event_type) as "eventTypes",
       max(created_at) as "lastSeenAt"
     from user_interest_events
     where user_id = $1
       and created_at >= now() - interval '7 days'
       and query is not null
       and trim(query) <> ''
     group by query
     order by score desc, "lastSeenAt" desc
     limit $2`,
    [userId, limit],
  )
  return rows
}
