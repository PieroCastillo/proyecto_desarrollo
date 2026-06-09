<script setup lang="ts">
import { ref, computed, watch } from "vue"

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(["close", "login", "register"])

const isRegistering = ref(false)
const username = ref("")
const password = ref("")

// Reset form when opened
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    username.value = ""
    password.value = ""
    isRegistering.value = false
  }
})

// Reglas de validación en tiempo real
const usernameError = computed(() => {
  if (!username.value) return ""
  if (username.value.includes(" ")) return "El usuario no puede contener espacios."
  if (username.value.length < 4) return "El usuario debe tener al menos 4 caracteres."
  return ""
})

const passwordError = computed(() => {
  if (!password.value) return ""
  if (password.value.length < 6) return "La contraseña debe tener al menos 6 caracteres."
  if (password.value.includes(" ")) return "La contraseña no puede contener espacios."
  return ""
})

const isFormValid = computed(() => {
  return username.value.length > 0 && 
         password.value.length > 0 && 
         !usernameError.value && 
         !passwordError.value
})

function onSubmit() {
  if (!isFormValid.value) return
  
  const credentials = { 
    username: username.value.trim(), 
    password: password.value 
  }

  if (isRegistering.value) {
    emit("register", credentials)
  } else {
    emit("login", credentials)
  }
}

function closeOverlay() {
  emit("close")
}
</script>

<template>
  <div :class="['login-overlay', { 'is-open': isOpen }]">
    <div class="login-container">
      <button class="btn-close" @click="closeOverlay">✕</button>
      
      <div class="login-header">
        <h2>{{ isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión' }}</h2>
        <p v-if="!isRegistering">Ingresa tus credenciales para acceder al sistema.</p>
        <p v-else>Únete a nuestra red de consultoras y empieza a vender.</p>
      </div>

      <div class="login-body">
        <div class="input-group">
          <label>Usuario</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Ej. piero"
            :class="['form-input', { 'has-error': usernameError }]"
            @keyup.enter="onSubmit"
          />
          <span v-if="usernameError" class="error-msg">{{ usernameError }}</span>
        </div>

        <div class="input-group">
          <label>Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••"
            :class="['form-input', { 'has-error': passwordError }]"
            @keyup.enter="onSubmit"
          />
          <span v-if="passwordError" class="error-msg">{{ passwordError }}</span>
        </div>

        <button 
          class="btn-submit" 
          :disabled="!isFormValid"
          @click="onSubmit"
        >
          {{ isRegistering ? 'Registrarse' : 'Ingresar' }}
        </button>

        <div class="login-footer">
          <p v-if="!isRegistering">
            ¿No tienes cuenta? <a href="#" @click.prevent="isRegistering = true">Regístrate</a>
          </p>
          <p v-else>
            ¿Ya tienes cuenta? <a href="#" @click.prevent="isRegistering = false">Inicia Sesión</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Overlay tipo "cortina" que baja */
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease;
}

.login-overlay.is-open {
  transform: translateY(0);
  opacity: 1;
}

.login-container {
  background: white;
  width: 100%;
  max-width: 440px;
  padding: 48px;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  position: relative;
  border: 1px solid rgba(0,0,0,0.05);
}

.btn-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-close:hover {
  background: rgba(0,0,0,0.05);
  color: var(--primary);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 8px;
}

.login-header p {
  color: var(--secondary);
  font-size: 0.95rem;
  margin: 0;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0,0,0,0.05);
}

.form-input.has-error {
  border-color: #ff4757;
  background-color: #fffafb;
}

.form-input.has-error:focus {
  box-shadow: 0 0 0 4px rgba(255, 71, 87, 0.15);
}

.error-msg {
  display: block;
  color: #ff4757;
  font-size: 0.8rem;
  margin-top: 6px;
  font-weight: 500;
}

.btn-submit {
  width: 100%;
  background: var(--primary);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.2s, transform 0.1s, opacity 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #000;
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-submit:disabled {
  background: var(--secondary);
  opacity: 0.5;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer p {
  font-size: 0.9rem;
  color: var(--secondary);
}

.login-footer a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>
