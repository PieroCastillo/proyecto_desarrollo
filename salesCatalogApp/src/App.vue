<script setup lang="ts">
import { ref } from "vue"
import Navbar from "./components/Navbar.vue"
import PublicView from "./views/PublicView.vue"
import HomeView from "./views/HomeView.vue"

const isLogged = ref(false)
const displayUserName = ref("Consultora")

function handleLogin(username: string) {
  // Cuando crees los endpoints en salesCatalogAppAPI, aquí harás el POST /api/login
  isLogged.value = true
  displayUserName.value = username
}

function handleLogout() {
  isLogged.value = false
  displayUserName.value = "Consultora"
  // Opcional si usas tokens: localStorage.removeItem('token')
}
</script>

<template>
  <Navbar :isLogged="isLogged" @login="handleLogin" />

  <PublicView v-if="!isLogged" />
  <HomeView v-else :userName="displayUserName" @logout="handleLogout" />
</template>

<style>
@import "./assets/style.css";
</style>