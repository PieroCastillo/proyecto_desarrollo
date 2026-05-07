<script setup lang="ts">
import { ref } from "vue"

defineProps<{
  isLogged: boolean
}>()

const emit = defineEmits(["login"])

const user = ref("")
const pass = ref("")

function submitLogin() {
  if (user.value.trim() !== "" && pass.value.length >= 4) {
    emit("login", user.value)
  } else {
    alert("Ingrese usuario y contraseña (mínimo 4 caracteres)")
  }
}
</script>

<template>
  <nav class="main-nav">
    <div class="container nav-flex">
      <div class="logo">CATÁLOGO<span>PERÚ</span></div>

      <div v-if="!isLogged" class="auth-box">
        <input v-model="user" placeholder="Usuario" type="text" />
        <input v-model="pass" type="password" placeholder="Contraseña" @keyup.enter="submitLogin" />
        <button @click="submitLogin" class="btn-login">Entrar</button>
      </div>
    </div>
  </nav>
</template>