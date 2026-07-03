import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

const AUTH_URL = process.env.AUTH_URL || 'http://auth-service:3001'
const CATALOG_URL = process.env.CATALOG_URL || 'http://catalog-service:3002'
const ORDERS_URL = process.env.ORDERS_URL || 'http://orders-service:3003'

type ServiceStatus = {
  service: string
  ok: boolean
  checks: { name: string; ok: boolean; detail: string }[]
}

function renderStatusPage(statuses: ServiceStatus[], startedAt: Date) {
  const ok = statuses.every((status) => status.ok)
  const rows = statuses.flatMap((status) =>
    status.checks.map((check) => ({ service: status.service, ...check }))
  )

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sales Catalog API Gateway Status</title>
  <style>
    body { margin: 0; background: #f5f5f7; color: #1d1d1f; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 920px; margin: 0 auto; padding: 56px 20px; }
    .panel { background: #fff; border: 1px solid #e5e5ea; border-radius: 18px; padding: 28px; box-shadow: 0 18px 50px rgba(0,0,0,.06); }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 24px; }
    h1 { font-size: clamp(1.8rem, 5vw, 3rem); line-height: 1; margin: 0 0 8px; letter-spacing: 0; }
    p { color: #6e6e73; margin: 0; }
    .badge { border-radius: 999px; padding: 8px 14px; font-weight: 800; font-size: .85rem; white-space: nowrap; }
    .ok { background: #e8f5e9; color: #1f7a3a; }
    .fail { background: #ffebee; color: #b42318; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 18px; }
    .check { border: 1px solid #ededf0; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .service { color: #6e6e73; font-size: .82rem; margin-bottom: 3px; }
    .name { font-weight: 750; }
    .detail { color: #6e6e73; font-size: .9rem; margin-top: 4px; overflow-wrap: anywhere; }
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
          <h1>Backend distribuido</h1>
          <p>Estado del API Gateway, microservicios y conexion a MongoDB.</p>
        </div>
        <span class="badge ${ok ? 'ok' : 'fail'}">${ok ? 'OK' : 'REVISION'}</span>
      </div>
      <div class="grid">
        ${rows.map((check) => `<article class="check"><div><div class="service">${check.service}</div><div class="name">${check.name}</div><div class="detail">${check.detail}</div></div><span class="dot ${check.ok ? 'ok' : 'fail'}"></span></article>`).join('')}
      </div>
      <div class="meta">
        <span>Gateway: /api</span>
        <span>Generado: ${startedAt.toISOString()}</span>
      </div>
      <button type="button" onclick="location.reload()">Actualizar</button>
    </section>
  </main>
</body>
</html>`
}

async function getServiceStatus(service: string, targetUrl: string): Promise<ServiceStatus> {
  try {
    const response = await fetch(`${targetUrl}/api/status`)
    const data = await response.json() as ServiceStatus
    return { service, ok: response.ok && data.ok, checks: data.checks ?? [] }
  } catch (error) {
    return {
      service,
      ok: false,
      checks: [{ name: 'Servicio', ok: false, detail: error instanceof Error ? error.message : 'No disponible' }],
    }
  }
}

async function collectStatuses() {
  return Promise.all([
    getServiceStatus('auth-service', AUTH_URL),
    getServiceStatus('catalog-service', CATALOG_URL),
    getServiceStatus('orders-service', ORDERS_URL),
  ])
}

app.get('/', async (c) => {
  const startedAt = new Date()
  const statuses = await collectStatuses()
  const ok = statuses.every((status) => status.ok)
  return c.html(renderStatusPage(statuses, startedAt), ok ? 200 : 503)
})

app.get('/api', async (c) => {
  const startedAt = new Date()
  const statuses = await collectStatuses()
  const ok = statuses.every((status) => status.ok)
  return c.html(renderStatusPage(statuses, startedAt), ok ? 200 : 503)
})

app.get('/api/status', async (c) => {
  const statuses = await collectStatuses()
  return c.json({ ok: statuses.every((status) => status.ok), services: statuses })
})

async function proxyRequest(c: Context, targetUrl: string) {
  const url = new URL(c.req.url)
  const reqUrl = `${targetUrl}${url.pathname}${url.search}`

  const response = await fetch(reqUrl, {
    method: c.req.method,
    headers: c.req.header(),
    body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.blob() : undefined
  })

  return new Response(response.body, response)
}

app.all('/api/auth', (c) => proxyRequest(c, AUTH_URL))
app.all('/api/auth/*', (c) => proxyRequest(c, AUTH_URL))
app.all('/api/clients', (c) => proxyRequest(c, AUTH_URL))
app.all('/api/clients/*', (c) => proxyRequest(c, AUTH_URL))
app.all('/api/consultants', (c) => proxyRequest(c, AUTH_URL))
app.all('/api/consultants/*', (c) => proxyRequest(c, AUTH_URL))

app.all('/api/products', (c) => proxyRequest(c, CATALOG_URL))
app.all('/api/products/*', (c) => proxyRequest(c, CATALOG_URL))

app.all('/api/orders', (c) => proxyRequest(c, ORDERS_URL))
app.all('/api/orders/*', (c) => proxyRequest(c, ORDERS_URL))
app.all('/api/dashboard', (c) => proxyRequest(c, ORDERS_URL))
app.all('/api/dashboard/*', (c) => proxyRequest(c, ORDERS_URL))
app.all('/api/routes', (c) => proxyRequest(c, ORDERS_URL))
app.all('/api/routes/*', (c) => proxyRequest(c, ORDERS_URL))
app.all('/api/trainings', (c) => proxyRequest(c, ORDERS_URL))
app.all('/api/trainings/*', (c) => proxyRequest(c, ORDERS_URL))

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080
console.log(`API Gateway corriendo en el puerto ${port}`)

serve({
  fetch: app.fetch,
  port
})
