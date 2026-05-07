import { Hono } from 'hono'
import auth from './routes/auth'
import clients from './routes/clients'
import consultants from './routes/consultants'
import products from './routes/products'

const app = new Hono()

app.route('/api', auth)
app.route('/api', clients)
app.route('/api', consultants)
app.route('/api', products)

export default app