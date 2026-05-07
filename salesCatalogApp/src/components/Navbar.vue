<script setup lang="ts">
import { ref } from "vue"

const props = defineProps<{
  isLogged: boolean
}>()

const emit = defineEmits(["login", "logout"])

const username = ref("")
const password = ref("")

function onLoginClick() {
  if (username.value && password.value) {
    emit("login", { 
      username: username.value, 
      password: password.value 
    })
  }
}
</script>

<template>
  <nav class="navbar">
    <div class="container nav-wrapper">
      <div class="logo">CATÁLOGO<span>PERÚ</span></div>
      
      <div v-if="!isLogged" class="login-row">
        <div class="login-form">
          <input v-model="username" type="text" placeholder="Usuario" class="nav-input" />
          <input v-model="password" type="password" placeholder="••••••" class="nav-input" />
          <button class="btn-primary" @click="onLoginClick">Entrar</button>
        </div>
      </div>
      
      </div>
  </nav>
</template>

<style scoped>
.nav-wrapper {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
}

.logo {
  font-size: 1.4rem;
  line-height: 1; 
}

.login-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px; 
  padding-right: 5px;
}

.login-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-input {
  padding: 4px 8px; 
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
}

.btn-primary {
  background-color: #e91e63;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.85rem;
}

.btn-primary:hover {
  background-color: #d81b60;
}
</style>