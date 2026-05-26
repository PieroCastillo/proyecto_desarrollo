<script setup lang="ts">
import { ref } from "vue"

const props = defineProps<{
  isLogged: boolean
  userName?: string
  currentView?: string
}>()

const emit = defineEmits(["login", "logout", "navigate"])

const username = ref("")
const password = ref("")
const menuOpen = ref(false)

function onLoginClick() {
  if (username.value && password.value) {
    emit("login", { username: username.value, password: password.value })
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
        <input v-model="username" type="text" placeholder="Usuario" class="nav-input" @keyup.enter="onLoginClick" />
        <input v-model="password" type="password" placeholder="••••••" class="nav-input" @keyup.enter="onLoginClick" />
        <button class="btn-primary" @click="onLoginClick">Entrar</button>
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
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 12px rgba(0,0,0,0.06);
}

.nav-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
}

.logo {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  cursor: pointer;
  color: #1a1a1a;
  user-select: none;
}

.logo span {
  color: #e91e63;
}

.login-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-input {
  padding: 6px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
  background: #fafafa;
}

.nav-input:focus {
  border-color: #e91e63;
  background: #fff;
}

.btn-primary {
  background: #e91e63;
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #c2185b;
}

.nav-logged {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  background: none;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.nav-link:hover {
  background: #fce4ec;
  color: #e91e63;
}

.nav-link.active {
  background: #fce4ec;
  color: #e91e63;
  font-weight: 600;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 20px;
  border-left: 1px solid #f0f0f0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
}

.btn-logout {
  background: none;
  border: 1px solid #e8e8e8;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  border-color: #e91e63;
  color: #e91e63;
}
</style>