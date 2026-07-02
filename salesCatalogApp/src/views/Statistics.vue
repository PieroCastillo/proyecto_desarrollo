<script setup lang="ts">
import { ref, onMounted, inject, computed } from "vue"

interface TopConsultant {
  id: string
  name: string
  totalSales: number
  orders: number
}

interface StatusBreakdown {
  status: string
  count: number
  total: number
}

interface CategoryBreakdown {
  category: string
  count: number
  stock: number
}

interface RecentOrder {
  id: string
  total: number
  status: string
  createdAt: string
  items: number
}

interface DashboardData {
  generatedAt: string
  monthlySales: number
  monthlyOrders: number
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  pendingOrders: number
  lowStockProducts: number
  outOfStockProducts: number
  totalProducts: number
  totalStock: number
  averagePrice: number
  clientsCount: number
  consultantsCount: number
  salesByStatus: StatusBreakdown[]
  productsByCategory: CategoryBreakdown[]
  topConsultants: TopConsultant[]
  recentOrders: RecentOrder[]
}

const showNotification = inject<(msg: string, type?: string) => void>("showNotification")
const API_URL = import.meta.env.REMOTE_API_URL || "http://localhost:3000/api"

const stats = ref<DashboardData | null>(null)
const loading = ref(true)

const maxCategoryStock = computed(() => Math.max(...(stats.value?.productsByCategory.map(c => c.stock) ?? [1]), 1))

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`
}

async function fetchStats() {
  loading.value = true
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.ok) {
      stats.value = await res.json()
    } else {
      showNotification?.("No se pudieron cargar las estadisticas del servidor.", "error")
    }
  } catch (err) {
    console.error(err)
    showNotification?.("Error de conexion al cargar las estadisticas.", "error")
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <main class="section">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard de estadisticas</h1>
          <p class="page-sub">Ventas, inventario y actividad operativa</p>
        </div>
        <button class="btn-refresh" :disabled="loading" @click="fetchStats">
          {{ loading ? "Actualizando..." : "Actualizar" }}
        </button>
      </div>

      <div v-if="loading" class="stats-loading">
        <div v-for="i in 6" :key="i" class="shimmer-card"></div>
      </div>

      <div v-else-if="stats" class="stats-content">
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Ventas del mes</span>
            <strong class="metric-value">{{ money(stats.monthlySales) }}</strong>
            <span class="metric-note">{{ stats.monthlyOrders }} pedidos este mes</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Ventas totales</span>
            <strong class="metric-value">{{ money(stats.totalSales) }}</strong>
            <span class="metric-note">{{ stats.totalOrders }} pedidos registrados</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Ticket promedio</span>
            <strong class="metric-value">{{ money(stats.averageOrderValue) }}</strong>
            <span class="metric-note">{{ stats.pendingOrders }} pedidos pendientes</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Inventario</span>
            <strong class="metric-value">{{ stats.totalStock }}</strong>
            <span class="metric-note">{{ stats.totalProducts }} productos, {{ stats.lowStockProducts }} bajos, {{ stats.outOfStockProducts }} agotados</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Clientes</span>
            <strong class="metric-value">{{ stats.clientsCount }}</strong>
            <span class="metric-note">Base comercial activa</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Consultores</span>
            <strong class="metric-value">{{ stats.consultantsCount }}</strong>
            <span class="metric-note">Equipo disponible</span>
          </div>
        </div>

        <div class="dashboard-grid">
          <section class="panel">
            <h3>Ventas por estado</h3>
            <div v-if="stats.salesByStatus.length === 0" class="empty-state">Sin pedidos registrados.</div>
            <div v-else class="status-list">
              <div v-for="item in stats.salesByStatus" :key="item.status" class="status-row">
                <span class="status-name">{{ item.status }}</span>
                <span>{{ item.count }} pedidos</span>
                <strong>{{ money(item.total) }}</strong>
              </div>
            </div>
          </section>

          <section class="panel">
            <h3>Stock por categoria</h3>
            <div v-if="stats.productsByCategory.length === 0" class="empty-state">Sin productos registrados.</div>
            <div v-else class="category-list">
              <div v-for="item in stats.productsByCategory" :key="item.category" class="category-row">
                <div class="category-head">
                  <span>{{ item.category }}</span>
                  <strong>{{ item.stock }} und.</strong>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: `${Math.max(4, (item.stock / maxCategoryStock) * 100)}%` }"></div>
                </div>
                <small>{{ item.count }} productos</small>
              </div>
            </div>
          </section>

          <section class="panel">
            <h3>Consultoras lideres</h3>
            <div v-if="stats.topConsultants.length === 0" class="empty-state">Aun no hay ventas por consultor.</div>
            <div v-else class="leaderboard-list">
              <div v-for="(c, idx) in stats.topConsultants" :key="c.id" class="leaderboard-row">
                <span class="rank-badge">{{ idx + 1 }}</span>
                <div>
                  <strong>{{ c.name }}</strong>
                  <small>{{ c.orders }} pedidos</small>
                </div>
                <span>{{ money(c.totalSales) }}</span>
              </div>
            </div>
          </section>

          <section class="panel">
            <h3>Pedidos recientes</h3>
            <div v-if="stats.recentOrders.length === 0" class="empty-state">Sin actividad reciente.</div>
            <div v-else class="orders-list">
              <div v-for="order in stats.recentOrders" :key="order.id" class="order-row">
                <div>
                  <strong>{{ money(order.total) }}</strong>
                  <small>{{ order.items }} items - {{ new Date(order.createdAt).toLocaleDateString() }}</small>
                </div>
                <span class="order-status">{{ order.status }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div v-else class="empty-state">
        No se pudieron obtener estadisticas. Por favor intenta de nuevo.
      </div>
    </div>
  </main>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.btn-refresh {
  background: var(--white);
  border: 1px solid var(--border);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--primary);
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-loading,
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.shimmer-card {
  height: 138px;
  background: linear-gradient(90deg, #f5f5f7 25%, #eaeaea 50%, #f5f5f7 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 16px;
}

@keyframes shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}

.metrics-grid {
  margin-bottom: 24px;
}

.metric-card,
.panel {
  background: var(--white);
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}

.metric-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 112px;
}

.metric-label {
  color: var(--secondary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.metric-value {
  color: var(--primary);
  font-size: clamp(1.7rem, 4vw, 2.3rem);
  line-height: 1.05;
  letter-spacing: 0;
}

.metric-note,
small {
  color: var(--secondary);
  font-size: 0.86rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.panel {
  padding: 24px;
}

.panel h3 {
  margin: 0 0 18px;
  font-size: 1.08rem;
  color: var(--primary);
}

.status-list,
.category-list,
.leaderboard-list,
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-row,
.leaderboard-row,
.order-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
}

.status-name,
.order-status {
  text-transform: capitalize;
  font-weight: 700;
}

.category-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.category-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
}

.bar-track {
  height: 9px;
  background: var(--light);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #0071e3;
  border-radius: 999px;
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.leaderboard-row {
  grid-template-columns: 32px 1fr auto;
}

.leaderboard-row div,
.order-row div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-status {
  background: var(--light);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.78rem;
}

.empty-state {
  text-align: center;
  color: var(--secondary);
  padding: 36px 12px;
}

@media (max-width: 640px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
