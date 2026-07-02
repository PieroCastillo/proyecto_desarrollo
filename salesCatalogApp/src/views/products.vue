<script setup lang="ts">
import { ref, onMounted, computed, inject } from "vue"
import { API_URL } from "@/config/api"

const showNotification = inject<(msg: string, type?: string) => void>("showNotification")
const MAX_PRODUCT_VALUE = 1000000

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
const imageMode = ref<"url" | "preset">("url")
const updatingStock = ref<Record<string, boolean>>({})

const form = ref({ name: "", category: "", price: "", stock: "", imagen: "" })
const saving = ref(false)

const presetImages = [
  { label: "Base liquida", value: "/images/products/base_liquida.png" },
  { label: "Bloqueador", value: "/images/products/bloqueador.png" },
  { label: "Labial mate", value: "/images/products/labial_mate.png" },
  { label: "Perfume Deep Blue", value: "/images/products/perfume_deepblue.png" },
  { label: "Set de brochas", value: "/images/products/set_de_brochas.png" },
  { label: "Vela lavanda", value: "/images/products/vela_aromatica_lavanda.png" },
]

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
  } catch {
    showNotification?.("No se pudieron cargar los productos.", "error")
  } finally {
    loading.value = false
  }
}

async function createProduct() {
  if (!form.value.name || !form.value.category || form.value.price === "" || form.value.stock === "") {
    showNotification?.("Todos los campos obligatorios deben estar completos.", "warning")
    return
  }

  const priceVal = Number(form.value.price)
  const stockVal = Number(form.value.stock)

  if (!Number.isFinite(priceVal) || !Number.isFinite(stockVal) || priceVal < 0 || stockVal < 0 || !Number.isInteger(stockVal)) {
    showNotification?.("El precio y el stock deben ser mayores o iguales a 0. El stock debe ser entero.", "error")
    return
  }

  if (priceVal > MAX_PRODUCT_VALUE || stockVal > MAX_PRODUCT_VALUE) {
    showNotification?.("Valores de precio o stock excesivamente grandes (limite 1,000,000).", "error")
    return
  }

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
        name: form.value.name.trim(),
        category: form.value.category.trim(),
        price: priceVal,
        stock: stockVal,
        imagen: form.value.imagen.trim() || undefined,
      }),
    })
    if (res.ok) {
      showForm.value = false
      form.value = { name: "", category: "", price: "", stock: "", imagen: "" }
      imageMode.value = "url"
      showNotification?.("Producto creado con exito.", "success")
      await fetchProducts()
    } else {
      const data = await res.json().catch(() => ({}))
      showNotification?.(data.error?.message || "Error al crear el producto. Revisa los datos.", "error")
    }
  } catch {
    showNotification?.("Error de red al crear el producto.", "error")
  } finally {
    saving.value = false
  }
}

async function adjustStock(id: string, delta: number) {
  if (!Number.isInteger(delta) || delta === 0 || updatingStock.value[id]) return

  const prod = products.value.find(p => p._id === id)
  if (prod && prod.stock + delta < 0) {
    showNotification?.("No se puede reducir el stock por debajo de 0.", "warning")
    return
  }
  if (prod && prod.stock + delta > MAX_PRODUCT_VALUE) {
    showNotification?.("No se puede superar el limite de 1,000,000 unidades.", "warning")
    return
  }

  const token = localStorage.getItem("token")
  updatingStock.value = { ...updatingStock.value, [id]: true }
  try {
    const res = await fetch(`${API_URL}/products/${id}/stock`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ delta }),
    })

    if (res.ok) {
      const data = await res.json()
      products.value = products.value.map(p => p._id === id ? { ...p, stock: Math.max(0, data.stock ?? p.stock) } : p)
      showNotification?.("Stock actualizado con exito.", "success")
      await fetchProducts()
    } else {
      const data = await res.json().catch(() => ({}))
      showNotification?.(data.error?.message || "Error al actualizar el stock en el servidor.", "error")
    }
  } catch {
    showNotification?.("Error de red al actualizar stock.", "error")
  } finally {
    const { [id]: _done, ...rest } = updatingStock.value
    updatingStock.value = rest
  }
}

const categories = computed(() => [...new Set(products.value.map(p => p.category))])

function stockClass(stock: number) {
  if (stock <= 0) return "stock-empty"
  if (stock <= 5) return "stock-low"
  return "stock-ok"
}

function stockLabel(stock: number) {
  return Math.max(0, Math.min(MAX_PRODUCT_VALUE, stock))
}
</script>

<template>
  <main class="section">
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
            <label>Categoria</label>
            <input v-model="form.category" placeholder="Ej: Fragancias" />
          </div>
          <div class="field">
            <label>Precio (S/)</label>
            <input v-model="form.price" type="number" min="0" :max="MAX_PRODUCT_VALUE" step="0.01" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Stock</label>
            <input v-model="form.stock" type="number" min="0" :max="MAX_PRODUCT_VALUE" step="1" placeholder="0" />
          </div>
          <div class="field image-field">
            <label>Imagen (opcional)</label>
            <div class="segmented">
              <button type="button" :class="{ active: imageMode === 'url' }" @click="imageMode = 'url'; form.imagen = ''">URL</button>
              <button type="button" :class="{ active: imageMode === 'preset' }" @click="imageMode = 'preset'; form.imagen = presetImages[0]?.value ?? ''">Galeria</button>
            </div>
            <input v-if="imageMode === 'url'" v-model="form.imagen" placeholder="https://ejemplo.com/imagen.jpg" />
            <select v-else v-model="form.imagen" class="image-select">
              <option v-for="img in presetImages" :key="img.value" :value="img.value">{{ img.label }}</option>
            </select>
            <div v-if="form.imagen" class="image-preview">
              <img :src="form.imagen" alt="Vista previa del producto" />
            </div>
          </div>
        </div>
        <button class="btn-save" :disabled="saving" @click="createProduct">
          {{ saving ? "Guardando..." : "Guardar producto" }}
        </button>
      </div>

      <div class="filters">
        <select v-model="filterCategory" class="filter-select" @change="fetchProducts">
          <option value="">Todas las categorias</option>
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
            <span :class="['stock-badge', stockClass(p.stock)]">{{ stockLabel(p.stock) }}</span>
          </div>

          <div v-if="p.imagen" class="prod-image-container">
            <img :src="p.imagen" :alt="p.name" class="prod-image" />
          </div>

          <h4 class="prod-name">{{ p.name }}</h4>
          <p class="prod-price">S/ {{ p.price.toFixed(2) }}</p>
          <div class="stock-controls">
            <button class="ctrl-btn" :disabled="p.stock <= 0 || updatingStock[p._id]" @click="adjustStock(p._id, -1)">-</button>
            <span class="ctrl-label">Stock</span>
            <button class="ctrl-btn" :disabled="p.stock >= MAX_PRODUCT_VALUE || updatingStock[p._id]" @click="adjustStock(p._id, 1)">+</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
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

.image-field {
  grid-column: 1 / -1;
}

.segmented {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 10px;
  background: var(--light);
  border-radius: 10px;
}

.segmented button {
  border: 0;
  border-radius: 8px;
  padding: 7px 12px;
  background: transparent;
  color: var(--secondary);
  font-weight: 700;
  cursor: pointer;
}

.segmented button.active {
  background: var(--white);
  color: var(--primary);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.image-select {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--white);
  color: var(--primary);
}

.image-preview {
  width: 140px;
  height: 110px;
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fbfbfd;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
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
}

.prod-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.category-tag {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary);
}

.stock-badge {
  min-width: 36px;
  text-align: center;
  white-space: nowrap;
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
  display: grid;
  grid-template-columns: 32px 1fr 32px;
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
  transition: background 0.2s;
  color: var(--primary);
}

.ctrl-btn:hover:not(:disabled) {
  background: var(--border);
}

.ctrl-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: var(--light);
}

.ctrl-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--secondary);
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
