<script setup lang="ts">
import { ref, onMounted } from "vue"

interface Producto {
  id: number
  nombre: string
  precio: number
}

defineProps<{
  userName: string
}>()

const emit = defineEmits(["logout"])

// Estado reactivo para los productos traídos desde el Backend
const productosPrivados = ref<Producto[]>([])
const saldo = ref(1250.40)

// Aquí conectarás con los endpoints de salesCatalogAppAPI más adelante
async function cargarProductosDesdeBackend() {
  try {
    // Ejemplo de cómo conectarías con tu backend en el puerto correspondiente:
    // const response = await fetch('http://localhost:3000/api/productos')
    // productosPrivados.value = await response.json()
    
    // Por ahora, simulamos datos de fallback si falla la conexión
    productosPrivados.value = [
      { id: 1, nombre: "Fragancia Premium Éxito", precio: 120.00 },
      { id: 2, nombre: "Joyería Collar Cristal", precio: 85.50 },
      { id: 3, nombre: "Set de Cremas Hidratantes", precio: 64.90 }
    ]
  } catch (error) {
    console.error("Error al conectar con la API de Backend:", error)
  }
}

function addToCart(nombre: string) {
  // Aquí harás un POST a tu salesCatalogAppAPI para guardar el carrito
  alert(`Éxito: Se añadió ${nombre} al pedido en el sistema`)
}

onMounted(() => {
  cargarProductosDesdeBackend()
})
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      <header class="user-header">
        <h2>Bienvenida, <span>{{ userName }}</span></h2>

        <div class="balance-card">
          <p>Mi Saldo Disponible</p>
          <span class="amount">S/ {{ saldo.toFixed(2) }}</span>
        </div>

        <button class="btn-outline" @click="emit('logout')">
          Cerrar Sesión
        </button>
      </header>

      <h3>Realizar Pedido</h3>

      <div class="product-grid">
        <div v-for="p in productosPrivados" :key="p.id" class="card-prod">
          <div style="font-size:3rem">📦</div>
          <h4>{{ p.nombre }}</h4>
          <p style="color:var(--accent); font-weight:bold">
            S/ {{ p.precio.toFixed(2) }}
          </p>
          <button class="btn-add" @click="addToCart(p.nombre)">
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  </main>
</template>