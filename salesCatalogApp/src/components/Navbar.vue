<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue"

const props = defineProps<{
  isLogged: boolean
  userName?: string
  currentView?: string
  role?: string
}>()

const emit = defineEmits(["login", "register", "logout", "navigate"])

const username = ref("")
const password = ref("")
const menuOpen = ref(false)
const isRegistering = ref(false)

const indicatorStyle = ref({
  left: '0px',
  width: '0px',
  opacity: 0
})

const tabsContainer = ref<HTMLElement | null>(null)

function updateIndicator() {
  nextTick(() => {
    if (!tabsContainer.value) return
    const activeTab = tabsContainer.value.querySelector('.nav-link.active') as HTMLElement
    if (activeTab) {
      indicatorStyle.value = {
        left: `${activeTab.offsetLeft}px`,
        width: `${activeTab.offsetWidth}px`,
        opacity: 1
      }
    } else {
      indicatorStyle.value.opacity = 0
    }
  })
}

watch(() => props.currentView, updateIndicator, { immediate: true })
watch(() => props.isLogged, () => {
  setTimeout(updateIndicator, 100)
})

onMounted(() => {
  window.addEventListener('resize', updateIndicator)
})

function onSubmit() {
  if (username.value && password.value) {
    if (isRegistering.value) {
      emit("register", { username: username.value, password: password.value })
    } else {
      emit("login", { username: username.value, password: password.value })
    }
    username.value = ""
    password.value = ""
  }
}
</script>

<template>
  <nav class="navbar">
    <div class="container nav-wrapper">
      <div class="logo" @click="emit('navigate', 'home')">
        CATÁLOGO<span>PERÚ</span>
      </div>

      <div v-if="!isLogged" class="login-form">
        <input v-model="username" type="text" placeholder="Usuario" class="nav-input" @keyup.enter="onSubmit" />
        <input v-model="password" type="password" placeholder="••••••" class="nav-input" @keyup.enter="onSubmit" />
        <button class="btn-primary" @click="onSubmit">{{ isRegistering ? 'Crear cuenta' : 'Entrar' }}</button>
        <button class="btn-toggle" @click="isRegistering = !isRegistering">
          {{ isRegistering ? 'Tengo cuenta' : 'Crear cuenta' }}
        </button>
      </div>

      <div v-else class="nav-logged">
        <nav ref="tabsContainer" class="nav-links">
          <div class="nav-indicator" :style="indicatorStyle"></div>
          
          <template v-if="role === 'consultant'">
            <button :class="['nav-link', { active: currentView === 'home' }]" @click="emit('navigate', 'home')">Inicio</button>
            <button :class="['nav-link', { active: currentView === 'clients' }]" @click="emit('navigate', 'clients')">Clientes</button>
            <button :class="['nav-link', { active: currentView === 'expert' }]" @click="emit('navigate', 'expert')">Sistema Experto</button>
          </template>

          <template v-else-if="role === 'hr'">
            <button :class="['nav-link', { active: currentView === 'consultants' }]" @click="emit('navigate', 'consultants')">Consultores</button>
            <button :class="['nav-link', { active: currentView === 'trainings' }]" @click="emit('navigate', 'trainings')">Capacitaciones</button>
          </template>

          <template v-else-if="role === 'dispatch'">
            <button :class="['nav-link', { active: currentView === 'products' }]" @click="emit('navigate', 'products')">Productos/Almacén</button>
            <button :class="['nav-link', { active: currentView === 'returns' }]" @click="emit('navigate', 'returns')">Devoluciones</button>
            <button :class="['nav-link', { active: currentView === 'delivery_routes' }]" @click="emit('navigate', 'delivery_routes')">Rutas de Reparto</button>
          </template>
        </nav>
        <div class="nav-user">
          <span class="user-name">{{ userName }}</span>
          <button class="btn-logout" @click="emit('logout')">Salir</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.nav-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
}

.logo {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
  color: var(--primary);
  user-select: none;
}

.logo span {
  color: var(--accent);
}

.login-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-input {
  padding: 8px 16px;
  border: none;
  border-radius: 980px;
  font-size: 0.85rem;
  outline: none;
  background: rgba(0, 0, 0, 0.04);
  transition: background 0.2s;
  color: var(--primary);
}

.nav-input:focus {
  background: rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 980px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background 0.2s, transform 0.1s;
}

.btn-primary:hover {
  background: #000;
}
.btn-primary:active {
  transform: scale(0.96);
}

.btn-toggle {
  background: none;
  border: none;
  font-size: 0.85rem;
  color: var(--accent);
  cursor: pointer;
  padding: 8px 12px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-toggle:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.nav-logged {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-links {
  display: flex;
  gap: 8px;
  position: relative;
}

.nav-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 980px;
  background: rgba(0, 0, 0, 0.06);
  transition: all 0.38s cubic-bezier(0.25, 1, 0.5, 1);
  z-index: 0;
  pointer-events: none;
}

.nav-link {
  position: relative;
  z-index: 1;
  background: none;
  border: none;
  padding: 8px 16px;
  border-radius: 980px;
  font-size: 0.85rem;
  color: var(--secondary);
  cursor: pointer;
  transition: color 0.25s ease;
  font-weight: 500;
}

.nav-link:hover {
  color: var(--primary);
}

.nav-link.active {
  color: var(--primary);
  background: none;
  font-weight: 500;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
}

.btn-logout {
  background: rgba(0,0,0,0.04);
  border: none;
  padding: 8px 16px;
  border-radius: 980px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(0,0,0,0.08);
}
</style>