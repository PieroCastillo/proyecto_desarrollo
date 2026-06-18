<script setup lang="ts">
import { ref, onMounted } from "vue"

const API_URL = import.meta.env.REMOTE_API_URL || "http://localhost:3000/api"

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
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }
    const res = await fetch(`${API_URL}/clients`, { headers })
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
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/clients`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
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
.client-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s;
}

.client-row:last-child {
  border-bottom: none;
}

.client-row:hover {
  background: rgba(0,0,0,0.02);
}

.client-avatar {
  width: 48px;
  height: 48px;
  background: var(--light);
  color: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-name {
  font-weight: 600;
  color: var(--primary);
  font-size: 1.1rem;
}

.client-meta {
  font-size: 0.9rem;
  color: var(--secondary);
}

.skeletons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  height: 80px;
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
</style>