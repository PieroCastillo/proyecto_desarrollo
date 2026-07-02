import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwtMiddleware } from './middleware/auth'
import { serve } from '@hono/node-server'

import orders from './routes/orders'
import dashboard from './routes/dashboard'
import routes from './routes/routes'
import trainings from './routes/trainings'

const app = new Hono()

app.use('/api/*', cors())
app.use('/api/*', jwtMiddleware)

app.route('/api', orders)
app.route('/api', dashboard)
app.route('/api', routes)
app.route('/api', trainings)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log("Servicio " + "orders-service" + " corriendo en el puerto " + port);

serve({
  fetch: app.fetch,
  port: port
})
