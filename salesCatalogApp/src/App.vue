<script setup lang="ts">
import { ref } from "vue"
import Navbar from "./components/Navbar.vue"
import PublicView from "./views/PublicView.vue"
import HomeView from "./views/HomeView.vue"

const isLogged = ref(false)
const displayUserName = ref("Consultora")
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
      displayUserName.value = data.user.username
      localStorage.setItem('token', data.token) 
    } else {
      alert("Usuario o contraseña incorrectos en el sistema")
    }
  } catch (error) {
    console.error("Error: ¿Está prendido el backend en el puerto 3000?", error)
  }
}

function handleLogout() {
  isLogged.value = false
  displayUserName.value = "Consultora"
  localStorage.removeItem('token')
}
</script>

<template>
  <Navbar :isLogged="isLogged" @login="handleLogin" @logout="handleLogout" />

  <PublicView v-if="!isLogged" />
  <HomeView v-else :userName="displayUserName" @logout="handleLogout" />
</template>

<style>
@import "./assets/style.css";
</style>