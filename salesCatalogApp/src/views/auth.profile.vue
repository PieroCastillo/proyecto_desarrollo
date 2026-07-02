<script setup lang="ts">
import { ref, onMounted } from "vue"
import { API_URL } from "@/config/api"

interface UserProfile {
  id: string
  username: string
  role: string
}

const profile = ref<UserProfile | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.ok) profile.value = data.data
  } finally {
    loading.value = false
  }
})

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  consultant: "Consultor",
  user: "Usuario",
}
</script>

<template>
  <main class="section fade-in">
    <div class="container" style="max-width: 520px; padding-top: 48px;">

      <div v-if="loading" class="skeleton-card" />

      <div v-else-if="profile" class="profile-card">
        <div class="avatar">{{ profile.username[0]?.toUpperCase() ?? "?" }}</div>
        <h2 class="username">{{ profile.username }}</h2>
        <span class="role-badge">{{ roleLabel[profile.role] ?? profile.role }}</span>

        <div class="info-row">
          <span class="info-label">ID</span>
          <span class="info-val mono">{{ profile.id }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Rol</span>
          <span class="info-val">{{ roleLabel[profile.role] ?? profile.role }}</span>
        </div>
      </div>

      <div v-else class="empty-state">No se pudo cargar el perfil.</div>
    </div>
  </main>
</template>

<style scoped>
.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 30px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 72px;
  height: 72px;
  background: #fce4ec;
  color: #e91e63;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
}

.username {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.role-badge {
  background: #fce4ec;
  color: #e91e63;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-val {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.mono {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #888;
}

.skeleton-card {
  height: 280px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f5f5f5 25%, #ebebeb 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}

.empty-state {
  text-align: center;
  color: #aaa;
  padding: 60px 0;
}
</style>
