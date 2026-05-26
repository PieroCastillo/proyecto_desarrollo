<script setup lang="ts">
import { ref } from "vue"

const emit = defineEmits(["login"])

const username = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

async function handleLogin() {
  if (!username.value.trim() || !password.value) return
  loading.value = true
  error.value = ""
  try {
    await new Promise(r => setTimeout(r, 300))
    emit("login", { username: username.value.trim(), password: password.value })
  } catch {
    error.value = "Credenciales inválidas"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page fade-in">
    <div class="login-card">
      <div class="brand">
        CATÁLOGO<span>PERÚ</span>
      </div>
      <p class="subtitle">Accede a tu cuenta</p>

      <div class="field">
        <label>Usuario</label>
        <input
          v-model="username"
          type="text"
          placeholder="tu_usuario"
          @keyup.enter="handleLogin"
          autocomplete="username"
        />
      </div>

      <div class="field">
        <label>Contraseña</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          @keyup.enter="handleLogin"
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button class="btn-login" :disabled="loading" @click="handleLogin">
        <span v-if="loading">Ingresando…</span>
        <span v-else>Ingresar</span>
      </button>
    </div>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 40px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.brand {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #1a1a1a;
  text-align: center;
}

.brand span {
  color: #e91e63;
}

.subtitle {
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  margin-top: -10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field input {
  padding: 10px 14px;
  border: 1.5px solid #ebebeb;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  background: #fafafa;
}

.field input:focus {
  border-color: #e91e63;
  background: #fff;
}

.error-msg {
  color: #e91e63;
  font-size: 0.85rem;
  text-align: center;
  margin: -8px 0;
}

.btn-login {
  background: #e91e63;
  color: white;
  border: none;
  padding: 13px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  margin-top: 4px;
}

.btn-login:hover:not(:disabled) {
  background: #c2185b;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>