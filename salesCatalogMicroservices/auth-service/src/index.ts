import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwtMiddleware } from './middleware/auth'
import { serve } from '@hono/node-server'

import auth from './routes/auth'
import clients from './routes/clients'
import consultants from './routes/consultants'

const app = new Hono()

app.use('/api/*', cors())
app.use('/api/*', jwtMiddleware)

app.route('/api', auth)
app.route('/api', clients)
app.route('/api', consultants)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log("Servicio " + "auth-service" + " corriendo en el puerto " + port);

serve({
  fetch: app.fetch,
  port: port
})
