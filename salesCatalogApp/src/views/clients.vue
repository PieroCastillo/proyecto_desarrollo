<script setup lang="ts">
import { ref, onMounted } from "vue"

const API_URL = "http://localhost:3000/api"

interface Client {
  _id: string
  name: string
  phone: string
  address: string
}

const clients = ref<Client[]>([])
const loading = ref(true)
const showForm = ref(false)

const form = ref({ name: "", phone: "", address: "" })
const saving = ref(false)

onMounted(fetchClients)

async function fetchClients() {
  loading.value = true
  try {
    const res = await fetch(`${API_URL}/clients`)
    const data = await res.json()
    clients.value = data.items ?? []
  } finally {
    loading.value = false
  }
}

async function createClient() {
  if (!form.value.name || !form.value.phone || !form.value.address) return
  saving.value = true
  try {
    const res = await fetch(`${API_URL}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.value),
    })
    if (res.ok) {
      form.value = { name: "", phone: "", address: "" }
      showForm.value = false
      await fetchClients()
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Clientes</h1>
          <p class="page-sub">{{ clients.length }} registrados</p>
        </div>
        <button class="btn-add" @click="showForm = !showForm">
          {{ showForm ? "Cancelar" : "+ Nuevo cliente" }}
        </button>
      </div>

      <div v-if="showForm" class="form-card">
        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <input v-model="form.name" placeholder="Nombre completo" />
          </div>
          <div class="field">
            <label>Teléfono</label>
            <input v-model="form.phone" placeholder="999 000 000" />
          </div>
          <div class="field full">
            <label>Dirección</label>
            <input v-model="form.address" placeholder="Av. ..." />
          </div>
        </div>
        <button class="btn-save" :disabled="saving" @click="createClient">
          {{ saving ? "Guardando…" : "Guardar cliente" }}
        </button>
      </div>

      <div v-if="loading" class="skeletons">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="clients.length === 0" class="empty-state">
        No hay clientes registrados aún.
      </div>

      <div v-else class="client-list">
        <div v-for="c in clients" :key="c._id" class="client-row">
          <div class="client-avatar">{{ c.name[0].toUpperCase() }}</div>
          <div class="client-info">
            <span class="client-name">{{ c.name }}</span>
            <span class="client-meta">{{ c.phone }} · {{ c.address }}</span>
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
  margin-bottom: 28px;
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
  white-space: nowrap;
}

.btn-add:hover {
  background: #c2185b;
}

.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.full {
  grid-column: 1 / -1;
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

.btn-save {
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 11px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  align-self: flex-start;
  transition: opacity 0.2s;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.client-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.05);
  overflow: hidden;
}

.client-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
}

.client-row:last-child {
  border-bottom: none;
}

.client-row:hover {
  background: #fafafa;
}

.client-avatar {
  width: 40px;
  height: 40px;
  background: #fce4ec;
  color: #e91e63;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.client-name {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.95rem;
}

.client-meta {
  font-size: 0.82rem;
  color: #aaa;
}

.skeletons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-row {
  height: 68px;
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