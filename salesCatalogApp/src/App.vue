<script setup lang="ts">
import { ref, provide } from "vue"
import Navbar from "./components/Navbar.vue"
import PublicView from "./views/PublicView.vue"
import HomeView from "./views/HomeView.vue"
import ProductsView from "./views/products.vue"
import ClientsView from "./views/clients.vue"
import ConsultantsView from "./views/consultants.vue"
import ExpertSystemView from "./views/ExpertSystem.vue"
import TrainingManagerView from "./views/TrainingManager.vue"
import ReturnsManagerView from "./views/ReturnsManager.vue"
import RoutePlannerView from "./views/RoutePlanner.vue"
import MyOrdersView from "./views/MyOrders.vue"
import StatisticsView from "./views/Statistics.vue"

const isLogged = ref(false) // Estado booleano de sesión iniciada
const displayUserName = ref("Consultora") // Nombre de usuario para mostrar
const userId = ref("") // ID del usuario logueado en MongoDB
const API_URL = import.meta.env.REMOTE_API_URL || "http://localhost:3000/api" // Ruta base de la API del servidor

const currentView = ref("home") // Rastreador de la pestaña de navegación activa
const currentRole = ref("consultant")

// Sistema de Notificaciones Toast
interface Notification {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const notifications = ref<Notification[]>([])
let nextNotificationId = 0

function showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  const id = nextNotificationId++
  notifications.value.push({ id, message, type })
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 4000)
}

provide('showNotification', showNotification)

// Función para cambiar de rol al instante desde el simulador flotante
function selectRole(role: string, defaultView: string) {
  currentRole.value = role
  currentView.value = defaultView
}

// Procesa el inicio de sesión
async function handleLogin(credentials: any) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    
    if (response.ok) {
      const data = await response.json()
      isLogged.value = true
      currentView.value = "home"
      currentRole.value = "consultant" 
      displayUserName.value = data.data.user.username
      userId.value = data.data.user.id
      localStorage.setItem('token', data.data.accessToken)
      showNotification(`¡Bienvenida de nuevo, ${data.data.user.username}!`, "success")
    } else {
      showNotification("Usuario o contraseña incorrectos en el sistema", "error")
    }
  } catch (error) {
    console.error("Error: ¿Está prendido el backend en el puerto 3000?", error)
    showNotification("Error de conexión con el servidor", "error")
  }
}

// Procesa el registro de nuevos usuarios
async function handleRegister(credentials: any) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    
    const data = await response.json()
    if (response.ok) {
      isLogged.value = true
      currentView.value = "home"
      currentRole.value = "consultant" 
      displayUserName.value = data.data.user.username
      userId.value = data.data.user.id
      localStorage.setItem('token', data.data.accessToken)
      showNotification("¡Cuenta creada y sesión iniciada con éxito!", "success")
    } else {
      if (data.error?.code === "USERNAME_TAKEN") {
        showNotification("El usuario ya existe en el sistema. Elige otro nombre.", "warning")
      } else {
        showNotification(data.error?.message || "Error al registrar el usuario (mínimo 4 caracteres).", "error")
      }
    }
  } catch (error) {
    console.error("Error al registrarse:", error)
    showNotification("Error de conexión al registrarse", "error")
  }
}

// Cierra sesión del usuario
function handleLogout() {
  isLogged.value = false
  currentView.value = "home"
  currentRole.value = "consultant"
  displayUserName.value = "Consultora"
  userId.value = ""
  localStorage.removeItem('token')
  showNotification("Sesión cerrada correctamente", "info")
}
</script>

<template>
  <!-- Barra de Navegación Dinámica -->
  <Navbar 
    :isLogged="isLogged" 
    :userName="displayUserName"
    :currentView="currentView"
    :role="currentRole"
    @login="handleLogin" 
    @register="handleRegister" 
    @logout="handleLogout" 
    @navigate="(view: string) => currentView = view"
  />

  <!-- Vista pública si no ha iniciado sesión -->
  <PublicView v-if="!isLogged" />

  <!-- Vistas privadas condicionales basadas en la pestaña activa -->
  <div v-else>
    <HomeView v-if="currentView === 'home'" :userName="displayUserName" :userId="userId" @logout="handleLogout" />
    <ProductsView v-else-if="currentView === 'products'" />
    <ClientsView v-else-if="currentView === 'clients'" />
    <ConsultantsView v-else-if="currentView === 'consultants'" />
    
    <!-- Renderizado de las 4 nuevas vistas del Proyecto -->
    <ExpertSystemView v-else-if="currentView === 'expert'" />
    <MyOrdersView v-else-if="currentView === 'my_orders'" :userId="userId" />
    <TrainingManagerView v-else-if="currentView === 'trainings'" :role="currentRole" />
    <ReturnsManagerView v-else-if="currentView === 'returns'" />
    <RoutePlannerView v-else-if="currentView === 'delivery_routes'" />
    <StatisticsView v-else-if="currentView === 'statistics'" />
  </div>

  
  <div v-if="isLogged" class="role-simulator">
    <div class="simulator-header">
      <span class="simulator-title">Simulador de Roles</span>
    </div>
    <p class="simulator-desc">Alterna al instante de rol para probar cada módulo del proyecto:</p>
    <div class="simulator-buttons">
      <button 
        :class="['sim-btn', { active: currentRole === 'consultant' }]" 
        @click="selectRole('consultant', 'home')"
      >
        Consultora
      </button>
      <button 
        :class="['sim-btn', { active: currentRole === 'hr' }]" 
        @click="selectRole('hr', 'consultants')"
      >
        Jefe/Personal RR.HH
      </button>
      <button 
        :class="['sim-btn', { active: currentRole === 'dispatch' }]" 
        @click="selectRole('dispatch', 'products')"
      >
        Despacho / Almacén
      </button>
    </div>
  </div>

  <!-- Contenedor de Notificaciones Toast -->
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="n in notifications" 
        :key="n.id" 
        :class="['toast', n.type]"
        @click="notifications = notifications.filter(item => item.id !== n.id)"
      >
        <div class="toast-icon">
          <template v-if="n.type === 'success'">🟢</template>
          <template v-else-if="n.type === 'error'">🔴</template>
          <template v-else-if="n.type === 'warning'">🟡</template>
          <template v-else>🔵</template>
        </div>
        <div class="toast-message">{{ n.message }}</div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
@import "./assets/style.css";

/* ESTILOS EXCLUSIVOS PARA LA SIMULACIÓN DE ROLES */
.role-simulator {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  padding: 12px 16px;
  width: 220px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.role-simulator:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.95);
}

.simulator-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}



.simulator-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary);
}

.simulator-desc {
  font-size: 0.7rem;
  color: var(--secondary);
  margin: 0 0 8px;
  line-height: 1.25;
}

.simulator-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sim-btn {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
  color: var(--primary);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sim-btn:hover {
  background: rgba(0, 71, 227, 0.05);
  color: var(--accent);
  border-color: rgba(0, 71, 227, 0.15);
}

.sim-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
</style>