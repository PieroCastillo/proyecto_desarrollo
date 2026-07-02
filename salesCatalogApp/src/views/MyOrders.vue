<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { API_URL } from "@/config/api"

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface Order {
  _id: string
  clientId: string
  consultantId: string
  items: OrderItem[]
  total: number
  status: string
  createdAt: string
}

const props = defineProps<{
  userId: string
}>()

const orders = ref<Order[]>([])
const clientsMap = ref<Record<string, string>>({})
const loading = ref(true)

onMounted(async () => {
  try {
    const token = localStorage.getItem("token")
    if (!token || !props.userId) return

    // Cargar historial de pedidos
    const ordersPromise = fetch(`${API_URL}/orders?consultantId=${props.userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Cargar lista de clientes para obtener sus nombres
    const clientsPromise = fetch(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const [resOrders, resClients] = await Promise.all([ordersPromise, clientsPromise])
    
    if (resClients.ok) {
      const clientsData = await resClients.json()
      if (clientsData.items) {
        clientsData.items.forEach((c: any) => {
          clientsMap.value[c._id] = c.name
        })
      }
    }

    if (resOrders.ok) {
      const data = await resOrders.json()
      orders.value = data.items || []
    }
  } catch (error) {
    console.error("Error al cargar historial de ventas:", error)
  } finally {
    loading.value = false
  }
})

// Cálculos estadísticos
const totalSales = computed(() => {
  return orders.value.reduce((sum, order) => sum + order.total, 0)
})

const totalOrders = computed(() => orders.value.length)

// Formateador de fecha
function formatDate(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { 
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'pending': 'Pendiente',
    'paid': 'Pagado',
    'shipped': 'En Camino',
    'delivered': 'Entregado'
  }
  return labels[status] || status
}
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      <h2 class="section-title">Historial de Ventas</h2>
      <p class="section-subtitle">Control estadístico y seguimiento de pedidos realizados por la consultora.</p>

      <!-- Panel de Estadísticas (Dashboard) -->
      <div class="stats-grid">
        <div class="stat-card highlight">
          <p class="stat-label">Ingresos Totales (S/)</p>
          <span class="stat-value">S/ {{ totalSales.toFixed(2) }}</span>
          <div class="stat-icon">💰</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total de Pedidos</p>
          <span class="stat-value">{{ totalOrders }}</span>
          <div class="stat-icon">📦</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">Comisión Estimada (25%)</p>
          <span class="stat-value text-accent">S/ {{ (totalSales * 0.25).toFixed(2) }}</span>
          <div class="stat-icon">📈</div>
        </div>
      </div>

      <!-- Tabla de Pedidos -->
      <div class="table-container">
        <div v-if="loading" class="loading-state">
          Cargando tu historial de ventas...
        </div>
        <div v-else-if="orders.length === 0" class="empty-state">
          Aún no tienes pedidos registrados. ¡Empieza a vender en el Sistema Experto!
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha y Hora</th>
              <th>Cliente</th>
              <th>Productos (Cant.)</th>
              <th>Estado</th>
              <th class="text-right">Monto Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order._id">
              <td class="id-cell">#{{ order._id.slice(-6).toUpperCase() }}</td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td class="client-name">{{ clientsMap[order.clientId] || 'Cliente Desconocido' }}</td>
              <td>
                <div class="items-list">
                  <span v-for="(item, i) in order.items" :key="i" class="item-tag">
                    {{ item.quantity }}x {{ item.name }}
                  </span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', order.status]">{{ getStatusLabel(order.status) }}</span>
              </td>
              <td class="text-right fw-bold">S/ {{ order.total.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<style scoped>
.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.section-subtitle {
  color: var(--secondary);
  font-size: 1.1rem;
  margin-bottom: 32px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--white);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.02);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.highlight {
  background: linear-gradient(135deg, var(--primary), #1a1a1a);
  color: white;
}

.stat-card.highlight .stat-label {
  color: rgba(255,255,255,0.8);
}

.stat-card.highlight .stat-value {
  color: white;
}

.stat-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}

.text-accent {
  color: #0088ff;
}

.stat-icon {
  position: absolute;
  right: 20px;
  bottom: 10px;
  font-size: 4rem;
  opacity: 0.1;
  pointer-events: none;
}

/* Table container */
.table-container {
  background: var(--white);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.03);
  overflow-x: auto;
  padding: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.data-table td {
  padding: 20px;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  color: var(--primary);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.id-cell {
  font-family: monospace;
  font-weight: 600;
  color: var(--secondary) !important;
}

.client-name {
  font-weight: 600;
  color: var(--primary);
}

.items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-tag {
  background: rgba(0,0,0,0.04);
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 500;
}

.text-right {
  text-align: right;
}

.fw-bold {
  font-weight: 700;
  font-size: 1.1rem;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}
.status-badge.paid {
  background: #d4edda;
  color: #155724;
}
.status-badge.shipped {
  background: #cce5ff;
  color: #004085;
}
.status-badge.delivered {
  background: #e2e3e5;
  color: #383d41;
}

.empty-state, .loading-state {
  padding: 80px 20px;
  text-align: center;
  color: var(--secondary);
  font-size: 1.1rem;
}
</style>
