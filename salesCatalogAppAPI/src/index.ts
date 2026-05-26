import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import clients from './routes/clients'
import consultants from './routes/consultants'
import products from './routes/products'
import orders from './routes/orders'
import dashboard from './routes/dashboard'
import deliveryRoutes from './routes/routes'

const app = new Hono()

app.use('/api/*', cors())

app.route('/api', auth)
app.route('/api', clients)
app.route('/api', consultants)
app.route('/api', products)
app.route('/api', orders)
app.route('/api', dashboard)
app.route('/api', deliveryRoutes)

export default app