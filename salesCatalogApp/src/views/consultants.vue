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
    const params = new URLSearchParams({ page: String(page.value), limit: "10" })
    if (search.value) params.set("search", search.value)
    const res = await fetch(`${API_URL}/consultants?${params}`)
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
    const url = editTarget.value
      ? `${API_URL}/consultants/${editTarget.value._id}`
      : `${API_URL}/consultants`
    const method = editTarget.value ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
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
  await fetch(`${API_URL}/consultants/${id}`, { method: "DELETE" })
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
          <p class="page-sub">{{ total }} en total</p>
        </div>
        <button class="btn-add" @click="openCreate">+ Nuevo consultor</button>
      </div>

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

.toolbar {
  margin-bottom: 20px;
}

.search-input {
  padding: 10px 16px;
  border: 1.5px solid #ebebeb;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  width: 280px;
  background: #fff;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #e91e63;
}

.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.06);
}

.form-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field input {
  padding: 10px 14px;
  border: 1.5px solid #ebebeb;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  background: #fafafa;
}

.field input:focus {
  border-color: #e91e63;
  background: #fff;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.btn-save {
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: none;
  border: 1.5px solid #ebebeb;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #888;
  cursor: pointer;
  transition: border-color 0.2s;
}

.btn-cancel:hover {
  border-color: #ccc;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.05);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f5f5f5;
}

.table td {
  padding: 14px 20px;
  font-size: 0.9rem;
  color: #333;
  border-bottom: 1px solid #f9f9f9;
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover td {
  background: #fafafa;
}

.td-name {
  font-weight: 600;
  color: #1a1a1a !important;
}

.td-mono {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem !important;
  color: #888 !important;
}

.zone-tag {
  background: #f0f0f0;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #555;
}

.td-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: 1px solid #e8e8e8;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  border-color: #e91e63;
  color: #e91e63;
}

.action-btn.danger:hover {
  border-color: #f44336;
  color: #f44336;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  background: #fff;
  border: 1.5px solid #ebebeb;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  border-color: #e91e63;
  color: #e91e63;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #888;
}

.skeletons { display: flex; flex-direction: column; gap: 8px; }

.skeleton-row {
  height: 56px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f5f5f5 25%, #ebebeb 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}

.empty-state {
  text-align: center;
  color: #bbb;
  padding: 60px 20px;
}
</style>