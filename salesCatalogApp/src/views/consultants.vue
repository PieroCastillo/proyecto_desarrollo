<script setup lang="ts">
import { ref, onMounted, watch } from "vue"

const API_URL = "http://localhost:3000/api"

interface Consultant {
  _id: string
  name: string
  dni: string
  phone: string
  zone: string
}

const consultants = ref<Consultant[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const search = ref("")
const showForm = ref(false)
const editTarget = ref<Consultant | null>(null)

const form = ref({ name: "", dni: "", phone: "", zone: "" })
const saving = ref(false)

const activeTab = ref("directory")

interface Ranking {
  id: string
  name: string
  zone: string
  totalSales: number
  level: string
  nextLevel: string
  nextLevelGoal: number
  progress: number
  missingForNext: number
}
const rankings = ref<Ranking[]>([])
const loadingRanking = ref(true)

async function fetchRanking() {
  loadingRanking.value = true
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/consultants/performance/ranking`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      rankings.value = data.ranking ?? []
    }
  } catch (err) {
    console.error("Error al cargar ranking", err)
  } finally {
    loadingRanking.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'performance' && rankings.value.length === 0) {
    fetchRanking()
  }
})

let searchTimeout: ReturnType<typeof setTimeout>

onMounted(fetchConsultants)
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchConsultants() }, 350)
})
watch(page, fetchConsultants)

async function fetchConsultants() {
  loading.value = true
  try {
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }
    const params = new URLSearchParams({ page: String(page.value), limit: "10" })
    if (search.value) params.set("search", search.value)
    const res = await fetch(`${API_URL}/consultants?${params}`, { headers })
    const data = await res.json()
    consultants.value = data.items ?? []
    total.value = data.total ?? 0
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editTarget.value = null
  form.value = { name: "", dni: "", phone: "", zone: "" }
  showForm.value = true
}

function openEdit(c: Consultant) {
  editTarget.value = c
  form.value = { name: c.name, dni: c.dni, phone: c.phone, zone: c.zone }
  showForm.value = true
}

async function saveConsultant() {
  if (!form.value.name || !form.value.dni || !form.value.phone || !form.value.zone) return
  saving.value = true
  try {
    const token = localStorage.getItem("token")
    const url = editTarget.value
      ? `${API_URL}/consultants/${editTarget.value._id}`
      : `${API_URL}/consultants`
    const method = editTarget.value ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form.value),
    })
    if (res.ok) {
      showForm.value = false
      await fetchConsultants()
    }
  } finally {
    saving.value = false
  }
}

async function deleteConsultant(id: string) {
  if (!confirm("¿Eliminar este consultor?")) return
  const token = localStorage.getItem("token")
  await fetch(`${API_URL}/consultants/${id}`, { 
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
  await fetchConsultants()
}

const totalPages = () => Math.ceil(total.value / 10)
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Consultores</h1>
          <p class="page-sub">Directorio y Efectividad</p>
        </div>
        <button v-if="activeTab === 'directory'" class="btn-add" @click="openCreate">+ Nuevo consultor</button>
      </div>

      <div class="tabs-container">
        <button :class="['tab-btn', { active: activeTab === 'directory' }]" @click="activeTab = 'directory'">Directorio</button>
        <button :class="['tab-btn', { active: activeTab === 'performance' }]" @click="activeTab = 'performance'">Ascensos y Efectividad</button>
      </div>

      <div v-if="activeTab === 'directory'">
        <div class="toolbar">
          <input v-model="search" class="search-input" placeholder="Buscar por nombre…" />
        </div>

      <div v-if="showForm" class="form-card">
        <h3 class="form-title">{{ editTarget ? "Editar consultor" : "Nuevo consultor" }}</h3>
        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <input v-model="form.name" placeholder="Nombre completo" />
          </div>
          <div class="field">
            <label>DNI</label>
            <input v-model="form.dni" placeholder="12345678" />
          </div>
          <div class="field">
            <label>Teléfono</label>
            <input v-model="form.phone" placeholder="999 000 000" />
          </div>
          <div class="field">
            <label>Zona</label>
            <input v-model="form.zone" placeholder="Lima Norte" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-cancel" @click="showForm = false">Cancelar</button>
          <button class="btn-save" :disabled="saving" @click="saveConsultant">
            {{ saving ? "Guardando…" : "Guardar" }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="skeletons">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="consultants.length === 0" class="empty-state">
        No se encontraron consultores.
      </div>

      <div v-else class="table-card">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Zona</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in consultants" :key="c._id">
              <td class="td-name">{{ c.name }}</td>
              <td class="td-mono">{{ c.dni }}</td>
              <td>{{ c.phone }}</td>
              <td><span class="zone-tag">{{ c.zone }}</span></td>
              <td class="td-actions">
                <button class="action-btn" @click="openEdit(c)">Editar</button>
                <button class="action-btn danger" @click="deleteConsultant(c._id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

        <div v-if="totalPages() > 1" class="pagination">
          <button :disabled="page === 1" class="page-btn" @click="page--">←</button>
          <span class="page-info">{{ page }} / {{ totalPages() }}</span>
          <button :disabled="page >= totalPages()" class="page-btn" @click="page++">→</button>
        </div>
      </div>

      <!-- Dashboard de Rendimiento (HU3) -->
      <div v-else-if="activeTab === 'performance'">
        <div v-if="loadingRanking" class="skeletons">
          <div v-for="i in 3" :key="i" class="skeleton-row" />
        </div>
        <div v-else class="ranking-grid">
          <div v-for="r in rankings" :key="r.id" class="ranking-card">
            <div class="ranking-header">
              <h3 class="r-name">{{ r.name }}</h3>
              <span :class="['r-badge', r.level.toLowerCase().replace('á', 'a').replace('é', 'e')]">{{ r.level }}</span>
            </div>
            <p class="r-zone">Zona: {{ r.zone }}</p>
            <div class="r-sales-info">
              <span class="r-total">Ventas Totales: S/ {{ r.totalSales.toFixed(2) }}</span>
            </div>
            
            <div class="r-progress-container" v-if="r.level !== 'Diamante'">
              <div class="r-progress-labels">
                <span>Meta para {{ r.nextLevel }}</span>
                <span>Faltan S/ {{ r.missingForNext.toFixed(2) }}</span>
              </div>
              <div class="r-progress-track">
                <div class="r-progress-bar" :style="{ width: r.progress + '%' }"></div>
              </div>
            </div>
            <div class="r-progress-container success" v-else>
              <p class="max-level-text">¡Ha alcanzado el nivel máximo de la compañía!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.page-sub {
  color: #aaa;
  font-size: 0.875rem;
  margin: 4px 0 0;
}

.btn-add {
  background: #e91e63;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover { background: #c2185b; }

.tabs-container {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}

.tab-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn:hover { color: var(--primary); }

.tab-btn.active {
  color: var(--accent);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -9px; left: 0;
  width: 100%; height: 3px;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
}

<style scoped>
.toolbar {
  margin-bottom: 32px;
}

.search-input {
  padding: 12px 20px;
  border: 1px solid var(--border);
  border-radius: 980px;
  font-size: 0.95rem;
  outline: none;
  width: 320px;
  background: var(--white);
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--primary);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.form-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary);
  margin: 0 0 24px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn-cancel {
  background: var(--light);
  border: none;
  padding: 12px 24px;
  border-radius: 980px;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--primary);
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: var(--border);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 16px 24px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
}

.table td {
  padding: 18px 24px;
  font-size: 0.95rem;
  color: var(--primary);
  border-bottom: 1px solid var(--light);
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover td {
  background: rgba(0,0,0,0.02);
}

.td-name {
  font-weight: 600;
}

.td-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9rem !important;
  color: var(--secondary) !important;
}

.zone-tag {
  background: var(--light);
  padding: 4px 12px;
  border-radius: 980px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary);
}

.td-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: var(--light);
  border: none;
  padding: 6px 14px;
  border-radius: 980px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.action-btn:hover {
  background: var(--accent);
  color: white;
}

.action-btn.danger:hover {
  background: #ff3b30;
  color: white;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 32px;
}

.page-btn {
  background: var(--white);
  border: 1px solid var(--border);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--primary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  background: var(--light);
}

.page-info {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--secondary);
}

.skeletons { display: flex; flex-direction: column; gap: 12px; }

.skeleton-row {
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f5f5f7 25%, #eaeaea 50%, #f5f5f7 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}

.empty-state {
  text-align: center;
  color: var(--secondary);
  padding: 80px 20px;
  font-size: 1.1rem;
}

/* Ranking Dashboard */
.ranking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 12px;
}

.ranking-card {
  background: var(--white);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.02);
  transition: transform 0.2s;
}

.ranking-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 40px rgba(0,0,0,0.08);
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.r-name {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary);
  line-height: 1.2;
}

.r-badge {
  padding: 4px 12px;
  border-radius: 980px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.r-badge.bronce { background: #ffebd2; color: #a5682a; }
.r-badge.plata { background: #f1f5f9; color: #64748b; }
.r-badge.oro { background: #fef08a; color: #854d0e; }
.r-badge.diamante { background: #e0f2fe; color: #0284c7; }

.r-zone { margin: 0 0 16px; color: var(--secondary); font-size: 0.9rem; }

.r-sales-info {
  margin-bottom: 24px;
  background: rgba(0,0,0,0.02);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}

.r-total {
  font-weight: 800;
  font-size: 1.3rem;
  color: #e91e63;
}

.r-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 8px;
}

.r-progress-track {
  height: 12px;
  background: var(--light);
  border-radius: 99px;
  overflow: hidden;
}

.r-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 99px;
  transition: width 1s cubic-bezier(0.25, 1, 0.5, 1);
}

.max-level-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #10b981;
  text-align: center;
  background: rgba(16, 185, 129, 0.1);
  padding: 12px;
  border-radius: 12px;
  margin: 0;
}
</style>