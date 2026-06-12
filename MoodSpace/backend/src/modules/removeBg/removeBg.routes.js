import { Router } from 'express'

export const removeBgRouter = Router()

removeBgRouter.post('/remove-bg', async (req, res) => {
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const imgBuffer = Buffer.concat(chunks)

    if (imgBuffer.length === 0) return res.status(400).send('Empty image data')

    // Convert buffer ke base64 data URL
    const contentType = req.headers['content-type'] || 'image/png'
    const base64 = imgBuffer.toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    // Kirim ke Gradio Space API
const hfRes = await fetch(
  'https://gokaygokay-inspyrenet-rembg.hf.space/gradio_api/call/image',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{ path: dataUrl }, 'Transparent'] }),
  }
)

const { event_id } = await hfRes.json()
console.log('event_id:', event_id)

const resultRes = await fetch(
  `https://not-lain-background-removal.hf.space/gradio_api/call/image/${event_id}`
)

const text = await resultRes.text()
console.log('=== RAW RESPONSE START ===')
console.log(text)
console.log('=== RAW RESPONSE END ===')

return res.status(200).send('check terminal') // stop dulu di sini

    // Ambil gambar hasilnya
    const imgRes = await fetch(outputUrl)
    const imgData = await imgRes.arrayBuffer()

    res.set('Content-Type', 'image/png')
    res.send(Buffer.from(imgData))

  } catch (error) {
    console.error('Remove background proxy error:', error)
    res.status(500).send(error.message)
  }
})