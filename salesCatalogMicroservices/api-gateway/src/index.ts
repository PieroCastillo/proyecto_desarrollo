import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Permitir peticiones desde el frontend (Vue)
app.use('/api/*', cors())

const AUTH_URL = process.env.AUTH_URL || 'http://auth-service:3001'
const CATALOG_URL = process.env.CATALOG_URL || 'http://catalog-service:3002'
const ORDERS_URL = process.env.ORDERS_URL || 'http://orders-service:3003'

// Función auxiliar para el proxy (Evita el error 'TypeError: immutable' al modificar headers CORS)
async function proxyRequest(c: Context, targetUrl: string) {
  const url = new URL(c.req.url)
  const reqUrl = `${targetUrl}${url.pathname}${url.search}`
  
  const response = await fetch(reqUrl, {
    method: c.req.method,
    headers: c.req.header(),
    body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.blob() : undefined
  })
  
  // Clonar la respuesta para que Hono pueda inyectarle los headers CORS sin chocar
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
