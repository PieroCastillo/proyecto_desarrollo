<script setup lang="ts">
import { ref, onMounted, inject } from "vue"

interface TopConsultant {
  id: string
  name: string
  totalSales: number
}

interface DashboardData {
  monthlySales: number
  pendingOrders: number
  lowStockProducts: number
  topConsultants: TopConsultant[]
}

const showNotification = inject<(msg: string, type?: string) => void>('showNotification')
const API_URL = import.meta.env.REMOTE_API_URL || "http://localhost:3000/api"

const stats = ref<DashboardData | null>(null)
const loading = ref(true)

async function fetchStats() {
  loading.value = true
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      const data = await res.json()
      stats.value = data
    } else {
      showNotification?.("No se pudieron cargar las estadísticas del servidor.", "error")
    }
  } catch (err) {
    console.error(err)
    showNotification?.("Error de conexión al cargar las estadísticas.", "error")
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
          <h1 class="page-title">Estadísticas del Negocio</h1>
          <p class="page-sub">Panel de rendimiento general e indicadores clave</p>
        </div>
        <button class="btn-refresh" @click="fetchStats" :disabled="loading">
          {{ loading ? 'Actualizando...' : '🔄 Actualizar' }}
        </button>
      </div>

      <div v-if="loading" class="stats-loading">
        <div class="shimmer-card" v-for="i in 3" :key="i"></div>
      </div>

      <div v-else-if="stats" class="stats-content">
        <!-- Tarjetas de Métricas -->
        <div class="metrics-grid">
          <div class="metric-card sales">
            <div class="metric-info">
              <span class="metric-label">Ventas Totales</span>
              <span class="metric-value">S/ {{ stats.monthlySales.toFixed(2) }}</span>
            </div>
            <div class="metric-icon-bg">💰</div>
          </div>

          <div class="metric-card pending">
            <div class="metric-info">
              <span class="metric-label">Pedidos Pendientes</span>
              <span class="metric-value">{{ stats.pendingOrders }}</span>
            </div>
            <div class="metric-icon-bg">📦</div>
          </div>

          <div class="metric-card stock">
            <div class="metric-info">
              <span class="metric-label">Productos Bajo Stock (<= 5)</span>
              <span class="metric-value" :class="{ 'warning-text': stats.lowStockProducts > 0 }">
                {{ stats.lowStockProducts }}
              </span>
            </div>
            <div class="metric-icon-bg">⚠️</div>
          </div>
        </div>

        <!-- Sección de Consultoras Líderes -->
        <div class="leaderboard-section">
          <div class="leaderboard-card">
            <h3 class="card-title">Consultoras Estrella</h3>
            <p class="card-subtitle">Top 5 consultoras con mayor volumen de ventas registradas</p>

            <div v-if="stats.topConsultants.length === 0" class="empty-leaderboard">
              Aún no hay ventas registradas por consultores.
            </div>

            <div v-else class="leaderboard-list">
              <div 
                v-for="(c, idx) in stats.topConsultants" 
                :key="c.id" 
                class="leaderboard-row"
              >
                <div class="rank-badge" :class="'rank-' + (idx + 1)">
                  {{ idx + 1 }}
                </div>
                <div class="consultant-detail">
                  <div class="consultant-header">
                    <span class="consultant-name">{{ c.name }}</span>
                    <span class="consultant-sales">S/ {{ c.totalSales.toFixed(2) }}</span>
                  </div>
                  <div class="progress-track">
                    <div 
                      class="progress-bar" 
                      :style="{ width: (c.totalSales / (stats.topConsultants[0].totalSales || 1) * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        No se pudieron obtener estadísticas. Por favor intenta de nuevo.
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
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.shimmer-card {
  height: 140px;
  background: linear-gradient(90deg, #f5f5f7 25%, #eaeaea 50%, #f5f5f7 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 24px;
}

@keyframes shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.metric-card {
  background: var(--white);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary);
}

.metric-value {
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.02em;
}

.warning-text {
  color: #ff9500;
}

.metric-icon-bg {
  font-size: 4rem;
  opacity: 0.08;
  position: absolute;
  right: 16px;
  bottom: 0px;
  pointer-events: none;
  user-select: none;
}

.leaderboard-section {
  max-width: 720px;
  margin: 0 auto;
}

.leaderboard-card {
  background: var(--white);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
}

.card-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 6px;
}

.card-subtitle {
  font-size: 0.95rem;
  color: var(--secondary);
  margin: 0 0 32px;
}

.empty-leaderboard {
  text-align: center;
  color: var(--secondary);
  padding: 40px 0;
  font-style: italic;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--primary);
  flex-shrink: 0;
}

.rank-1 { background: #fef08a; color: #854d0e; }
.rank-2 { background: #f1f5f9; color: #475569; }
.rank-3 { background: #ffebd2; color: #a5682a; }

.consultant-detail {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.consultant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.consultant-name {
  font-weight: 600;
  color: var(--primary);
}

.consultant-sales {
  font-weight: 700;
  color: var(--accent);
}

.progress-track {
  height: 8px;
  background: var(--light);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #8b5cf6);
  border-radius: 99px;
  transition: width 1s ease;
}

.empty-state {
  text-align: center;
  color: var(--secondary);
  padding: 60px 0;
}
</style>
