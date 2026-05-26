<script setup lang="ts">
import { ref, onMounted } from "vue"

interface Product {
  _id: string
  name: string
  price: number
  stock: number
  category: string
}

const props = defineProps<{
  userName: string
}>()

const emit = defineEmits(["logout"])

const API_URL = "http://localhost:3000/api"
const products = ref<Product[]>([])
const loading = ref(true)
const saldo = ref(1250.40)

onMounted(async () => {
  try {
    const res = await fetch(`${API_URL}/products?stock=available`)
    const data = await res.json()
    products.value = data.items ?? []
  } finally {
    loading.value = false
  }
})

async function addToCart(id: string, name: string) {
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ productId: id, quantity: 1 }] }),
    })
    if (res.ok) alert(`✓ ${name} añadido al pedido`)
  } catch {
    alert("Error al procesar el pedido")
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
          <button class="btn-logout" @click="emit('logout')">Cerrar sesión</button>
        </div>
      </div>

      <h2 class="section-title">Realizar pedido</h2>

      <div v-if="loading" class="product-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card" />
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
        No hay productos disponibles en este momento.
      </div>

      <div v-else class="product-grid">
        <div v-for="p in products" :key="p._id" class="product-card">
          <span class="category-tag">{{ p.category }}</span>
          <h4 class="prod-name">{{ p.name }}</h4>
          <p class="prod-price">S/ {{ p.price.toFixed(2) }}</p>
          <button class="btn-add" @click="addToCart(p._id, p.name)">Añadir al pedido</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.balance-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  margin-bottom: 40px;
}

.balance-label {
  font-size: 0.85rem;
  color: #aaa;
  margin: 0 0 6px;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: 800;
  color: #27ae60;
  line-height: 1;
}

.balance-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.welcome {
  font-size: 0.9rem;
  color: #555;
  margin: 0;
}

.welcome strong {
  color: #e91e63;
}

.btn-logout {
  background: none;
  border: 1.5px solid #ebebeb;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  border-color: #e91e63;
  color: #e91e63;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid #f0f0f0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 24px rgba(0,0,0,0.09);
}

.category-tag {
  font-size: 0.75rem;
  color: #888;
  background: #f5f5f5;
  padding: 3px 10px;
  border-radius: 20px;
  align-self: flex-start;
}

.prod-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
}

.prod-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #27ae60;
  margin: 0;
}

.btn-add {
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: auto;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #e91e63;
}

.skeleton-card {
  height: 180px;
  border-radius: 12px;
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

@media (max-width: 600px) {
  .balance-card {
    flex-direction: column;
    gap: 20px;
    padding: 24px;
  }
  .balance-right {
    align-items: flex-start;
    width: 100%;
  }
  .btn-logout {
    width: 100%;
  }
}
</style>