import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { query } from '../src/db/pool.js'
import { matchOcrEntity } from '../src/shared/ocr.service.js'
import { matchKnownEntity } from '../src/shared/entityMatch.service.js'
import { getImageEmbedding, averageEmbeddings } from '../src/modules/externalImages/clip.service.js'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const backfillOcrEntityMatch = async () => {
  console.log('Querying posts needing OCR/entity backfill...')
  const { rows: posts } = await query(
    `select p.id, p.title, p.embedding, p.metadata
     from posts p
     where (p.metadata->>'ocrText' is null or p.metadata->'matchedEntity' is null)
       and p.status = 'published'
       and p.embedding is not null
     order by p.published_at desc`
  )
  console.log(`Found ${posts.length} posts for backfill. Processing 1/sec...\n`)

  let ocrCount = 0
  let entityCount = 0
  let errorCount = 0

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const existingEntity = post.metadata?.matchedEntity
    const existingOcr = post.metadata?.ocrText
    console.log(`[${i + 1}/${posts.length}] "${post.title || 'untitled'}" (id=${post.id.slice(0, 8)}...)`)

    if (existingOcr) {
      console.log(`  OCR already exists, skipping`)
    } else {
      const { rows: urls } = await query(
        `select m.public_url
         from post_media pm
         join media_assets m on m.id = pm.media_id
         where pm.post_id = $1 and m.public_url is not null
         union
         select m.public_url
         from posts p2
         join media_assets m on m.id = p2.cover_media_id
         where p2.id = $1 and m.public_url is not null
         limit 1`,
        [post.id],
      )
      const imageUrl = urls[0]?.public_url
      if (!imageUrl) {
        console.log(`  No image URL, skipping OCR`)
        await sleep(1000)
        continue
      }

      const ocrResult = await matchOcrEntity(imageUrl)
      if (ocrResult.text) ocrCount++
      if (ocrResult.text) console.log(`  OCR text: "${ocrResult.text.slice(0, 80)}..."`)
      if (ocrResult.entity) console.log(`  OCR entity: ${ocrResult.entity.title} (score=${ocrResult.entity.score.toFixed(3)})`)

      // Compute visual image embedding & match for dual-path comparison
      let visEntity = null
      if (!existingEntity) {
        if (post.embedding) {
          // Use stored embedding directly
          const emb = Array.isArray(post.embedding) ? post.embedding : Object.values(post.embedding)
          if (Array.isArray(emb) && emb.length > 0) {
            visEntity = await matchKnownEntity(emb)
            if (visEntity) console.log(`  Visual entity: ${visEntity.title} (score=${visEntity.score.toFixed(3)})`)
          }
        } else {
          const imgEmb = imageUrl ? await getImageEmbedding(imageUrl).catch(() => null) : null
          if (imgEmb) visEntity = await matchKnownEntity(imgEmb)
        }
      }

      // Pick best entity
      let bestEntity = existingEntity || null
      const ocrEntity = ocrResult.entity
      if (!existingEntity) {
        if (visEntity && ocrEntity) {
          bestEntity = visEntity.score >= ocrEntity.score ? visEntity : ocrEntity
        } else {
          bestEntity = visEntity || ocrEntity || null
        }
      } else if (ocrEntity && ocrEntity.score > existingEntity.score) {
        console.log(`  OCR entity (${ocrEntity.score.toFixed(3)}) beats existing (${existingEntity.score.toFixed(3)}), upgrading`)
        bestEntity = ocrEntity
      }

      if (bestEntity && !existingEntity) entityCount++

      // Update DB
      const tagsJson = 'null'
      const entityJson = bestEntity ? JSON.stringify(bestEntity) : 'null'
      const ocrJson = ocrResult.text ? JSON.stringify(ocrResult.text) : 'null'
      await query(
        `update posts
         set metadata = jsonb_set(
           jsonb_set(
             coalesce(metadata, '{}'::jsonb),
             '{matchedEntity}', $2::jsonb
           ),
           '{ocrText}', $3::jsonb
         ),
         updated_at = now()
         where id = $1`,
        [post.id, entityJson, ocrJson],
      )
      console.log(`  Updated: entity=${bestEntity?.title || 'null'}, ocr=${ocrResult.text ? 'yes' : 'no'}`)
    }

    await sleep(1000)
  }

  console.log(`\n=== Backfill Complete ===`)
  console.log(`Total processed: ${posts.length}`)
  console.log(`OCR successful:  ${ocrCount}`)
  console.log(`New entities:    ${entityCount}`)
  console.log(`Errors:          ${errorCount}`)

  process.exit(0)
}

backfillOcrEntityMatch().catch((e) => {
  console.error('Backfill failed:', e)
  process.exit(1)
})
