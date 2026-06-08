<script setup lang="ts">
import { ref, onMounted, computed } from "vue"

const API_URL = "http://localhost:3000/api"

interface Product {
  _id: string
  name: string
  category: string
  price: number
  stock: number
  imagen?: string
}

const products = ref<Product[]>([])
const loading = ref(true)
const showForm = ref(false)
const filterCategory = ref("")
const filterStock = ref("")

const form = ref({ name: "", category: "", price: "", stock: "" })
const saving = ref(false)

onMounted(fetchProducts)

async function fetchProducts() {
  loading.value = true
  try {
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }
    const params = new URLSearchParams()
    if (filterCategory.value) params.set("category", filterCategory.value)
    if (filterStock.value) params.set("stock", filterStock.value)
    const res = await fetch(`${API_URL}/products?${params}`, { headers })
    const data = await res.json()
    products.value = data.items ?? []
  } finally {
    loading.value = false
  }
}

async function createProduct() {
  if (!form.value.name || !form.value.category || !form.value.price || !form.value.stock) return
  saving.value = true
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: form.value.name,
        category: form.value.category,
        price: Number(form.value.price),
        stock: Number(form.value.stock),
      }),
    })
    if (res.ok) {
      showForm.value = false
      form.value = { name: "", category: "", price: "", stock: "" }
      await fetchProducts()
    }
  } finally {
    saving.value = false
  }
}

async function adjustStock(id: string, delta: number) {
  const token = localStorage.getItem("token")
  await fetch(`${API_URL}/products/${id}/stock`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ delta }),
  })
  await fetchProducts()
}

const categories = computed(() => [...new Set(products.value.map(p => p.category))])

function stockClass(stock: number) {
  if (stock === 0) return "stock-empty"
  if (stock <= 5) return "stock-low"
  return "stock-ok"
}
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Productos</h1>
          <p class="page-sub">{{ products.length }} productos</p>
        </div>
        <button class="btn-add" @click="showForm = !showForm">
          {{ showForm ? "Cancelar" : "+ Nuevo producto" }}
        </button>
      </div>

      <div v-if="showForm" class="form-card">
        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <input v-model="form.name" placeholder="Nombre del producto" />
          </div>
          <div class="field">
            <label>Categoría</label>
            <input v-model="form.category" placeholder="Ej: Fragancias" />
          </div>
          <div class="field">
            <label>Precio (S/)</label>
            <input v-model="form.price" type="number" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Stock</label>
            <input v-model="form.stock" type="number" placeholder="0" />
          </div>
        </div>
        <button class="btn-save" :disabled="saving" @click="createProduct">
          {{ saving ? "Guardando…" : "Guardar producto" }}
        </button>
      </div>

      <div class="filters">
        <select v-model="filterCategory" class="filter-select" @change="fetchProducts">
          <option value="">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select v-model="filterStock" class="filter-select" @change="fetchProducts">
          <option value="">Todo el stock</option>
          <option value="available">Disponible</option>
          <option value="empty">Sin stock</option>
        </select>
      </div>

      <div v-if="loading" class="product-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card" />
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
        No hay productos con ese filtro.
      </div>

      <div v-else class="product-grid">
        <div v-for="p in products" :key="p._id" class="product-card">
          <div class="prod-top">
            <span class="category-tag">{{ p.category }}</span>
            <span :class="['stock-badge', stockClass(p.stock)]">{{ p.stock }}</span>
          </div>
          
          <div v-if="p.imagen" class="prod-image-container">
            <img :src="p.imagen" :alt="p.name" class="prod-image" />
          </div>

          <h4 class="prod-name">{{ p.name }}</h4>
          <p class="prod-price">S/ {{ p.price.toFixed(2) }}</p>
          <div class="stock-controls">
            <button class="ctrl-btn" @click="adjustStock(p._id, -1)">−</button>
            <span class="ctrl-label">Stock</span>
            <button class="ctrl-btn" @click="adjustStock(p._id, 1)">+</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Scoped overrides for generic section styles */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.filter-select {
  padding: 12px 20px;
  border: 1px solid var(--border);
  border-radius: 980px;
  font-size: 0.95rem;
  outline: none;
  background: var(--white);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--primary);
  font-weight: 500;
  appearance: none;
}

.filter-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.product-card {
  background: var(--white);
  border-radius: 20px;
  padding: 24px;
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

.prod-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-tag {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary);
}

.stock-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 980px;
}

.stock-ok { background: #e8f5e9; color: #27ae60; }
.stock-low { background: #fff3e0; color: #f57c00; }
.stock-empty { background: #fce4ec; color: #e91e63; }

.prod-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  margin: 0;
  line-height: 1.3;
}

.prod-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 140px;
  background: #fbfbfd;
  border-radius: 12px;
  padding: 8px;
  margin: 4px 0;
}

.prod-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.prod-price {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.stock-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.ctrl-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--light);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--primary);
}

.ctrl-btn:hover {
  background: var(--border);
}

.ctrl-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--secondary);
  flex: 1;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
</style>