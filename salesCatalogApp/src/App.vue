<script setup lang="ts">
import { ref } from "vue"
import Navbar from "./components/Navbar.vue"
import PublicView from "./views/PublicView.vue"
import HomeView from "./views/HomeView.vue"
import ProductsView from "./views/products.vue"
import ClientsView from "./views/clients.vue"
import ConsultantsView from "./views/consultants.vue"

const isLogged = ref(false)
const displayUserName = ref("Consultora")
const userId = ref("")
const currentView = ref("home")
const API_URL = "http://localhost:3000/api"

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
      displayUserName.value = data.data.user.username
      userId.value = data.data.user.id
      localStorage.setItem('token', data.data.accessToken) 
    } else {
      alert("Usuario o contraseña incorrectos en el sistema")
    }
  } catch (error) {
    console.error("Error: ¿Está prendido el backend en el puerto 3000?", error)
  }
}

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
      displayUserName.value = data.data.user.username
      userId.value = data.data.user.id
      localStorage.setItem('token', data.data.accessToken)
      alert("¡Cuenta creada y sesión iniciada con éxito!")
    } else {
      if (data.error?.code === "USERNAME_TAKEN") {
        alert("El usuario ya existe en el sistema. Elige otro nombre.")
      } else {
        alert(data.error?.message || "Error al registrar el usuario (mínimo 4 caracteres).")
      }
    }
  } catch (error) {
    console.error("Error al registrarse:", error)
  }
}

function handleLogout() {
  isLogged.value = false
  displayUserName.value = "Consultora"
  userId.value = ""
  currentView.value = "home"
  localStorage.removeItem('token')
}
</script>

<template>
  <Navbar :isLogged="isLogged" :currentView="currentView" @login="handleLogin" @register="handleRegister" @logout="handleLogout" @navigate="(view) => currentView = view" />

  <PublicView v-if="!isLogged" />
  <div v-else class="container">
    <transition name="fade-slide" mode="out-in">
      <HomeView v-if="currentView === 'home'" :userName="displayUserName" :userId="userId" @logout="handleLogout" />
      <ProductsView v-else-if="currentView === 'products'" />
      <ClientsView v-else-if="currentView === 'clients'" />
      <ConsultantsView v-else-if="currentView === 'consultants'" />
    </transition>
  </div>
</template>

<style>
@import "./assets/style.css";
</style>