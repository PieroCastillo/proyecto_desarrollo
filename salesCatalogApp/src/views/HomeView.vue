<script setup lang="ts">
import { ref, onMounted, inject } from "vue"
import { API_URL } from "@/config/api"

interface Product {
  _id: string
  name: string
  price: number
  stock: number
  category: string
  imagen?: string
}

const props = defineProps<{
  userName: string
  userId: string
}>()

const emit = defineEmits(["logout"])

const showNotification = inject<(msg: string, type?: string) => void>('showNotification')
const products = ref<Product[]>([])
const loading = ref(true)
const saldo = ref(1250.40)

interface Client {
  _id: string
  name: string
}
const clients = ref<Client[]>([])
const selectedClient = ref<string>("")

onMounted(async () => {
  try {
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }

    // Fetch clients for order creation
    const clientsRes = await fetch(`${API_URL}/clients`, { headers })
    if (clientsRes.ok) {
      const clientsData = await clientsRes.json()
      clients.value = clientsData.items ?? []
    }

    // Fetch products
    const res = await fetch(`${API_URL}/products?stock=available`, { headers })
    const data = await res.json()
    products.value = data.items ?? []
  } finally {
    loading.value = false
  }
})

async function addToCart(id: string, name: string) {
  if (!selectedClient.value) {
    showNotification?.("Espera. Debes seleccionar a que cliente le estas vendiendo antes de anadir un producto.", "warning")
    return
  }

  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        clientId: selectedClient.value,
        consultantId: props.userId,
        items: [{ productId: id, quantity: 1 }]
      }),
    })
    if (res.ok) {
      products.value = products.value
        .map(p => p._id === id ? { ...p, stock: Math.max(0, p.stock - 1) } : p)
        .filter(p => p.stock > 0)
      showNotification?.(`${name} anadido al pedido`, "success")
    } else {
      showNotification?.("Error de validacion al crear el pedido", "error")
    }
  } catch {
    showNotification?.("Error al procesar el pedido", "error")
  }
}
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      <div class="balance-card">
        <div class="balance-left">
          <p class="balance-label">Saldo disponible</p>
          <span class="balance-amount">S/ {{ saldo.toFixed(2) }}</span>
        </div>
        <div class="balance-right">
          <p class="welcome">Bienvenida, <strong>{{ userName }}</strong></p>
          <button class="btn-logout" @click="emit('logout')">Cerrar sesion</button>
        </div>
      </div>

      <div class="catalog-header">
        <h2 class="section-title">Catalogo de Productos</h2>
        <div class="client-selector">
          <label>A quien le vendemos hoy?</label>
          <select v-model="selectedClient" class="nav-input select-client">
            <option value="">-- Selecciona un Cliente --</option>
            <option v-for="c in clients" :key="c._id" :value="c._id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="product-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card" />
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
        No hay productos disponibles en este momento.
      </div>

      <div v-else class="product-grid">
        <div v-for="p in products" :key="p._id" class="product-card">
          <!-- Mostrar imagen si existe, sino placeholder -->
          <div v-if="p.imagen" class="prod-image-container">
            <img :src="p.imagen" :alt="p.name" class="prod-image" />
          </div>
          <div v-else class="product-image-placeholder">
            <span class="img-icon">🛍️</span>
          </div>
          <span class="category-tag">{{ p.category }}</span>
          <h4 class="prod-name">{{ p.name }}</h4>
          <p class="prod-price">S/ {{ p.price.toFixed(2) }}</p>
          <button class="btn-add" @click="addToCart(p._id, p.name)">Comprar / Anadir a orden</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.balance-card {
  background: var(--white);
  border-radius: 24px;
  padding: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  margin-bottom: 60px;
}

.balance-label {
  font-size: 0.9rem;
  color: var(--secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px;
}

.balance-amount {
  font-size: 4rem;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.04em;
  line-height: 1;
}

.balance-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.welcome {
  font-size: 1.1rem;
  color: var(--secondary);
  margin: 0;
}

.welcome strong {
  color: var(--primary);
}

.btn-logout {
  background: rgba(0,0,0,0.04);
  border: none;
  padding: 10px 20px;
  border-radius: 980px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(0,0,0,0.08);
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--primary);
  margin: 0;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.client-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-selector label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--secondary);
}

.select-client {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.1);
  background-color: var(--white);
  min-width: 200px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.product-card {
  background: var(--white);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 44px rgba(0,0,0,0.06);
}

.product-image-placeholder {
  background: var(--light);
  height: 160px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border: 1px solid rgba(0,0,0,0.03);
}

.prod-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 160px;
  background: #fbfbfd;
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 12px;
}

.prod-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.img-icon {
  font-size: 3rem;
  opacity: 0.8;
}

.category-tag {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary);
}

.prod-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  margin: 0;
  line-height: 1.3;
}

.prod-price {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.btn-add {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 980px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 16px;
  transition: background 0.2s, transform 0.1s;
}

.btn-add:hover {
  background: #000;
}
.btn-add:active {
  transform: scale(0.96);
}

.skeleton-card {
  height: 220px;
  border-radius: 20px;
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

@media (max-width: 600px) {
  .balance-card {
    flex-direction: column;
    gap: 32px;
    padding: 32px 24px;
    align-items: flex-start;
  }
  .balance-right {
    align-items: flex-start;
    width: 100%;
  }
  .balance-amount {
    font-size: 3rem;
  }
}
</style>

