<script setup lang="ts">
import { ref, onMounted, computed } from "vue"

const API_URL = "http://localhost:3000/api"

interface Product {
  _id: string
  name: string
  category: string
  price: number
  stock: number
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
    const params = new URLSearchParams()
    if (filterCategory.value) params.set("category", filterCategory.value)
    if (filterStock.value) params.set("stock", filterStock.value)
    const res = await fetch(`${API_URL}/products?${params}`)
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
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  await fetch(`${API_URL}/products/${id}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
  padding: 10px 22px;
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

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 14px;
  border: 1.5px solid #ebebeb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  border-color: #e91e63;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 24px rgba(0,0,0,0.09);
}

.prod-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-tag {
  font-size: 0.75rem;
  color: #888;
  background: #f5f5f5;
  padding: 3px 10px;
  border-radius: 20px;
}

.stock-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.stock-ok { background: #e8f5e9; color: #27ae60; }
.stock-low { background: #fff3e0; color: #f57c00; }
.stock-empty { background: #fce4ec; color: #e91e63; }

.prod-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
}

.prod-price {
  font-size: 1.15rem;
  font-weight: 700;
  color: #27ae60;
  margin: 0;
}

.stock-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  border-top: 1px solid #f5f5f5;
  padding-top: 12px;
}

.ctrl-btn {
  width: 28px;
  height: 28px;
  border: 1.5px solid #ebebeb;
  border-radius: 6px;
  background: none;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  color: #555;
}

.ctrl-btn:hover {
  border-color: #e91e63;
  color: #e91e63;
}

.ctrl-label {
  font-size: 0.78rem;
  color: #aaa;
  flex: 1;
  text-align: center;
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
</style>