<script setup lang="ts">
import { ref } from "vue"

const props = defineProps<{
  isLogged: boolean
  userName?: string
  currentView?: string
}>()

const emit = defineEmits(["login", "register", "logout", "navigate"])

const username = ref("")
const password = ref("")
const menuOpen = ref(false)
const isRegistering = ref(false)

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
        <nav class="nav-links">
          <button :class="['nav-link', { active: currentView === 'home' }]" @click="emit('navigate', 'home')">Inicio</button>
          <button :class="['nav-link', { active: currentView === 'products' }]" @click="emit('navigate', 'products')">Productos</button>
          <button :class="['nav-link', { active: currentView === 'clients' }]" @click="emit('navigate', 'clients')">Clientes</button>
          <button :class="['nav-link', { active: currentView === 'consultants' }]" @click="emit('navigate', 'consultants')">Consultores</button>
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
}

.nav-link {
  background: none;
  border: none;
  padding: 8px 16px;
  border-radius: 980px;
  font-size: 0.85rem;
  color: var(--secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  color: var(--primary);
}

.nav-link.active {
  background: var(--primary);
  color: white;
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