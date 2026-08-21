import express from 'express'

const app = express()
const port = Number(process.env.PORT || 8080)

app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'breaktime-bakers-api',
  })
})

app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})
