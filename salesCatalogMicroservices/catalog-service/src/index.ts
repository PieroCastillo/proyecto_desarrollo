import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwtMiddleware } from './middleware/auth'
import { serve } from '@hono/node-server'

import products from './routes/products'
import status from './routes/status'

const app = new Hono()

app.use('/api/*', cors())
app.route('/api', status)
app.use('/api/*', jwtMiddleware)

app.route('/api', products)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log("Servicio " + "catalog-service" + " corriendo en el puerto " + port);

serve({
  fetch: app.fetch,
  port: port
})
