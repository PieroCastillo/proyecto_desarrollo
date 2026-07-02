import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import clients from './routes/clients'
import consultants from './routes/consultants'
import products from './routes/products'
import orders from './routes/orders'
import dashboard from './routes/dashboard'
import deliveryRoutes from './routes/routes'
import trainings from './routes/trainings'
import { db, connectDB } from './db'

import { jwtMiddleware } from './middleware/auth'

const app = new Hono()

app.use('/api/*', cors())

app.use('*', async (c, next) => {
  try {
    await connectDB()
    await next()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo conectar a la base de datos'

    if (c.req.path === '/' || c.req.path === '/api') {
      return c.html(renderStatusPage({
        ok: false,
        startedAt: new Date(),
        checks: [{ name: 'MongoDB', ok: false, detail: message }],
      }), 503)
    }

    return c.json({ ok: false, error: { code: 'DB_UNAVAILABLE', message } }, 503)
  }
})

function renderStatusPage(input: {
  ok: boolean
  startedAt: Date
  checks: { name: string; ok: boolean; detail: string }[]
}) {
  const { ok, startedAt, checks } = input

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sales Catalog API Status</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f5f5f7; color: #1d1d1f; }
    main { max-width: 880px; margin: 0 auto; padding: 56px 20px; }
    .panel { background: #fff; border: 1px solid #e5e5ea; border-radius: 18px; padding: 28px; box-shadow: 0 18px 50px rgba(0,0,0,.06); }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 24px; }
    h1 { font-size: clamp(1.8rem, 5vw, 3rem); line-height: 1; margin: 0 0 8px; letter-spacing: 0; }
    p { color: #6e6e73; margin: 0; }
    .badge { border-radius: 999px; padding: 8px 14px; font-weight: 800; font-size: .85rem; white-space: nowrap; }
    .ok { background: #e8f5e9; color: #1f7a3a; }
    .fail { background: #ffebee; color: #b42318; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 18px; }
    .check { border: 1px solid #ededf0; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .name { font-weight: 750; }
    .detail { color: #6e6e73; font-size: .9rem; margin-top: 4px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex: 0 0 auto; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; color: #6e6e73; font-size: .92rem; }
    button { margin-top: 22px; border: 0; border-radius: 10px; background: #0071e3; color: white; padding: 10px 14px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <div class="top">
        <div>
          <h1>Backend operativo</h1>
          <p>Estado de carga de API, base de datos y colecciones principales.</p>
        </div>
        <span class="badge ${ok ? 'ok' : 'fail'}">${ok ? 'OK' : 'REVISION'}</span>
      </div>
      <div class="grid" id="checks">
        ${checks.map((check) => `<article class="check"><div><div class="name">${check.name}</div><div class="detail">${check.detail}</div></div><span class="dot ${check.ok ? 'ok' : 'fail'}"></span></article>`).join('')}
      </div>
      <div class="meta">
        <span>API: /api</span>
        <span>Generado: <time id="generated">${startedAt.toISOString()}</time></span>
        <span id="latency"></span>
      </div>
      <button id="refresh" type="button">Actualizar</button>
    </section>
  </main>
  <script>
    const generated = new Date(document.getElementById('generated').dateTime || document.getElementById('generated').textContent);
    document.getElementById('latency').textContent = 'Render local: ' + Math.max(0, Date.now() - generated.getTime()) + ' ms';
    document.getElementById('refresh').addEventListener('click', () => location.reload());
  </script>
</body>
</html>`
}

async function statusHandler(c: Context) {
  const startedAt = new Date()
  const checks: { name: string; ok: boolean; detail: string }[] = []
  let dbOk = false

  try {
    await db.command({ ping: 1 })
    dbOk = true
    checks.push({ name: 'MongoDB', ok: true, detail: 'Conexion activa' })
  } catch (error) {
    checks.push({ name: 'MongoDB', ok: false, detail: error instanceof Error ? error.message : 'Error desconocido' })
  }

  const collections = ['users', 'clients', 'consultants', 'products', 'orders', 'trainings']
  if (dbOk) {
    for (const collection of collections) {
      try {
        const count = await db.collection(collection).countDocuments()
        checks.push({ name: collection, ok: true, detail: `${count} documentos` })
      } catch {
        checks.push({ name: collection, ok: false, detail: 'No se pudo leer' })
      }
    }
  }

  const ok = checks.every((check) => check.ok)
  const html = renderStatusPage({ ok, startedAt, checks })

  return c.html(html, ok ? 200 : 503)
}

app.get('/', statusHandler)
app.get('/api', statusHandler)

app.use('/api/*', jwtMiddleware)

app.route('/api', auth)
app.route('/api', clients)
app.route('/api', consultants)
app.route('/api', products)
app.route('/api', orders)
app.route('/api', dashboard)
app.route('/api', deliveryRoutes)
app.route('/api', trainings)

export default app
