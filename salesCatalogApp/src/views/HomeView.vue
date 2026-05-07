<script setup lang="ts">
import { ref, onMounted } from "vue"

interface Producto {
  id: string
  name: string
  price: number
}

const props = defineProps<{ 
  userName: string 
}>()

const emit = defineEmits(["logout"])

const productosPrivados = ref<Producto[]>([])
const saldo = ref(1250.40)
const API_URL = "http://localhost:3000/api"

async function cargarProductosDesdeBackend() {
  try {
    const response = await fetch(`${API_URL}/products`)
    if (response.ok) {
      const data = await response.json()
      productosPrivados.value = data.items 
    }
  } catch (error) {
    console.error("Error al conectar con el Backend:", error)
  }
}

async function addToCart(id: string, nombre: string) {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, quantity: 1 })
    })
    if (response.ok) alert(`Éxito: Se añadió ${nombre} al pedido`)
  } catch (error) {
    console.error("Error al crear pedido:", error)
  }
}

onMounted(() => {
  cargarProductosDesdeBackend()
})
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      <header class="user-header">
        <h2 class="welcome-text">Bienvenida, <span>{{ userName }}</span></h2>

        <div class="balance-card">
          
          <div class="side-space"></div>

          <div class="balance-main">
            <p class="balance-label">Mi Saldo Disponible</p>
            <span class="amount">S/ {{ saldo.toFixed(2) }}</span>
          </div>
          
          <div class="side-space right-align">
            <button class="btn-pink-logout" @click="emit('logout')">
              Cerrar Sesión
            </button>
          </div>
          
        </div>
      </header>

      <div class="order-section">
        <h3>Realizar Pedido</h3>
        
        <div class="product-grid">
          <div v-for="p in productosPrivados" :key="p.id" class="card-prod">
            <div class="prod-info">
              <h4>{{ p.name }}</h4>
              <p class="price">S/ {{ p.price.toFixed(2) }}</p>
            </div>
            <button class="btn-add" @click="addToCart(p.id, p.name)">
              Añadir al pedido
            </button>
          </div>
        </div>

        <div v-if="productosPrivados.length === 0" class="empty-msg">
          Cargando productos desde el servidor...
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.user-header {
  margin-bottom: 40px;
}

.welcome-text {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
}

.welcome-text span {
  color: #e91e63;
  font-weight: bold;
}

.balance-card {
  background: #ffffff;
  padding: 30px 40px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 140px;
}

.side-space {
  flex: 1;
}

.right-align {
  display: flex;
  justify-content: flex-end;
}

.balance-main {
  flex: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.balance-label {
  color: #666;
  font-size: 1.1rem;
  margin: 0 0 5px 0;
}

.amount {
  color: #27ae60;
  font-size: 3rem;
  font-weight: bold;
  line-height: 1;
}

.btn-pink-logout {
  background-color: #e91e63;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.3s ease;
}

.btn-pink-logout:hover {
  background-color: #d81b60;
}


.order-section h3 {
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.card-prod {
  background: white;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.price {
  color: #27ae60;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 10px 0;
}

.btn-add {
  background: #333;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-add:hover {
  background: #e91e63;
}

.empty-msg {
  text-align: center;
  padding: 40px;
  color: #999;
}

@media (max-width: 800px) {
  .balance-card {
    flex-direction: column;
    padding: 30px;
    gap: 20px;
  }
  .side-space {
    flex: none;
    width: 100%;
    justify-content: center;
  }
  .btn-pink-logout {
    width: 100%;
  }
}
</style>