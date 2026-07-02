<script setup lang="ts">
import { ref, onMounted, computed, inject } from "vue"
import { API_URL } from "@/config/api"

const props = defineProps<{ role: string }>()
const showNotification = inject<(msg: string, type?: string) => void>("showNotification")

interface Training {
  _id: string
  title: string
  description: string
  videoUrl: string
  instructor: string
  category: string
  points: number
  completed: boolean
}

const trainings = ref<Training[]>([])
const loading = ref(true)
const processingId = ref<string | null>(null)

const courseParticipants = ref<Record<string, { username: string, role: string }[]>>({})
const loadingParticipants = ref<string | null>(null)

interface Consultant { _id: string, name: string }
const consultantsList = ref<Consultant[]>([])
const selectedConsultants = ref<Record<string, string>>({})

async function loadParticipants(id: string) {
  loadingParticipants.value = id
  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/trainings/${id}/participants`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      courseParticipants.value[id] = data.participants
    }
  } catch (error) {
    console.error("Error cargando participantes", error)
  } finally {
    loadingParticipants.value = null
  }
}

onMounted(async () => {
  try {
    const token = localStorage.getItem("token")
    if (!token) return

    const res = await fetch(`${API_URL}/trainings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      const data = await res.json()
      trainings.value = data.items ?? []
    }

    const resCons = await fetch(`${API_URL}/consultants?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (resCons.ok) {
      const dataCons = await resCons.json()
      consultantsList.value = dataCons.items ?? []
    }
  } catch (error) {
    console.error("Error cargando capacitaciones", error)
  } finally {
    loading.value = false
  }
})

// Marca el curso como completado (Participar)
async function markCompleted(id: string, targetConsultantId?: string) {
  if (props.role === 'hr' && !targetConsultantId) {
    showNotification?.("Selecciona una consultora primero.", "warning")
    return
  }

  processingId.value = id
  try {
    const token = localStorage.getItem("token")
    const bodyObj = targetConsultantId ? { consultantId: targetConsultantId } : {}

    const res = await fetch(`${API_URL}/trainings/${id}/participate`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyObj)
    })
    
    if (res.ok) {
      if (props.role !== 'hr') {
        const course = trainings.value.find(t => t._id === id)
        if (course) course.completed = true
        showNotification?.("Asistencia registrada. Has sumado puntos a tu perfil.", "success")
      } else {
        showNotification?.("Asistencia de consultora registrada con exito.", "success")
        loadParticipants(id)
      }
    } else {
      const data = await res.json()
      showNotification?.(data.message || "Esa consultora ya estaba registrada o ocurrio un error.", "warning")
    }
  } catch (error) {
    showNotification?.("Error de conexion al registrar la asistencia.", "error")
  } finally {
    processingId.value = null
  }
}

// Estadísticas para mostrar en la cabecera
const totalCompleted = computed(() => trainings.value.filter(t => t.completed).length)
const totalPoints = computed(() => trainings.value.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0))
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      
      <!-- Encabezado estilo Dashboard Premium -->
      <div class="academy-header">
        <div class="header-content">
          <h1 class="academy-title">Academia de Consultoras</h1>
          <p class="academy-sub">Capacítate, acumula puntos y sube de nivel en tus ventas.</p>
        </div>
        <div class="academy-stats">
          <div class="stat-box">
            <span class="stat-value">{{ totalCompleted }} / {{ trainings.length }}</span>
            <span class="stat-label">Cursos Completados</span>
          </div>
          <div class="stat-box highlight">
            <span class="stat-value">{{ totalPoints }}</span>
            <span class="stat-label">Puntos Acumulados</span>
          </div>
        </div>
      </div>

      <!-- Pantalla de Carga -->
      <div v-if="loading" class="grid-courses">
        <div v-for="i in 3" :key="i" class="skeleton-course" />
      </div>

      <!-- Cuadrícula de Cursos Interactivos -->
      <div v-else class="grid-courses">
        <div 
          v-for="course in trainings" 
          :key="course._id" 
          :class="['course-card', { 'is-completed': course.completed }]"
        >
          <!-- Efecto visual decorativo de la tarjeta -->
          <div class="course-thumbnail">
            <span class="category-badge">{{ course.category }}</span>
            <span v-if="course.completed" class="completed-badge">✅ Completado</span>
          </div>

          <div class="course-body">
            <h3 class="course-title">{{ course.title }}</h3>
            <p class="course-desc">{{ course.description }}</p>
            
            <div class="course-footer">
              <div class="instructor">
                <span class="instructor-icon">👤</span>
                <span class="instructor-name">{{ course.instructor }}</span>
              </div>
              <div class="points">+{{ course.points }} pts</div>
            </div>

            <!-- Botón de Acción para Consultoras -->
            <template v-if="role !== 'hr'">
              <button 
                v-if="!course.completed" 
                class="btn-participate" 
                :disabled="processingId === course._id"
                @click="markCompleted(course._id)"
              >
                {{ processingId === course._id ? 'Registrando...' : 'Registrar Asistencia' }}
              </button>
              <button v-else class="btn-participate success" disabled>
                Asistencia Registrada
              </button>
            </template>

            <!-- Acciones para RR.HH. -->
            <template v-else>
              <div class="hr-register-box">
                <select v-model="selectedConsultants[course._id]" class="select-consultant">
                  <option disabled value="" selected>Seleccionar consultora...</option>
                  <option v-for="c in consultantsList" :key="c._id" :value="c._id">
                    {{ c.name }}
                  </option>
                </select>
                <button 
                  class="btn-participate hr-btn-register"
                  :disabled="processingId === course._id"
                  @click="markCompleted(course._id, selectedConsultants[course._id])"
                >
                  Registrar Asistencia
                </button>
              </div>

              <button 
                v-if="!courseParticipants[course._id]"
                class="btn-participate hr-btn" 
                @click="loadParticipants(course._id)"
              >
                {{ loadingParticipants === course._id ? 'Cargando...' : 'Ver Asistentes' }}
              </button>
              <div v-else class="participants-list">
                <h4>Consultoras que asistieron:</h4>
                <ul v-if="(courseParticipants[course._id] ?? []).length > 0">
                  <li v-for="p in (courseParticipants[course._id] ?? [])" :key="p.username">
                    👤 {{ p.username }}
                  </li>
                </ul>
                <p v-else class="no-participants">Nadie ha asistido aún.</p>
              </div>
            </template>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
/* ACADEMY HEADER */
.academy-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 24px;
  padding: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  margin-bottom: 48px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}

.academy-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.academy-sub {
  font-size: 1.1rem;
  color: #94a3b8;
  margin: 0;
}

.academy-stats {
  display: flex;
  gap: 24px;
}

.stat-box {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 20px 32px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
}

.stat-box.highlight {
  background: rgba(233, 30, 99, 0.15);
  border-color: rgba(233, 30, 99, 0.3);
}

.stat-box.highlight .stat-value {
  color: #ff4081;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  font-weight: 600;
}

/* COURSE GRID */
.grid-courses {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}

.course-card {
  background: var(--white);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s;
  border: 1px solid rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.08);
}

.course-card.is-completed {
  opacity: 0.85;
}

.course-thumbnail {
  height: 180px;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  position: relative;
}

.category-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 980px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.completed-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #22c55e;
  color: white;
  padding: 6px 12px;
  border-radius: 980px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3);
}

.course-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.course-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 12px;
  line-height: 1.3;
}

.course-desc {
  font-size: 0.95rem;
  color: var(--secondary);
  margin: 0 0 24px;
  line-height: 1.5;
  flex-grow: 1;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  margin-bottom: 20px;
}

.instructor {
  display: flex;
  align-items: center;
  gap: 8px;
}

.instructor-icon {
  font-size: 1.2rem;
}

.instructor-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
}

.points {
  font-size: 0.9rem;
  font-weight: 800;
  color: #e91e63;
  background: rgba(233, 30, 99, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

.btn-participate {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-participate:hover:not(:disabled) {
  background: #0077ed;
  transform: translateY(-2px);
}

.btn-participate.success {
  background: #22c55e;
  cursor: default;
}

.btn-participate.success:hover {
  transform: none;
}

.btn-participate.hr-btn {
  background: var(--secondary);
}

.btn-participate.hr-btn:hover {
  background: var(--primary);
}

.hr-register-box {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0,0,0,0.02);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.select-consultant {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
  outline: none;
  background: white;
}

.btn-participate.hr-btn-register {
  padding: 10px;
  font-size: 0.85rem;
  background: #10b981;
}

.btn-participate.hr-btn-register:hover {
  background: #059669;
}

.participants-list {
  margin-top: 12px;
  background: rgba(0,0,0,0.02);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.participants-list h4 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: var(--secondary);
}

.participants-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
}

.participants-list li {
  padding: 4px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.participants-list li:last-child {
  border-bottom: none;
}

.no-participants {
  margin: 0;
  font-size: 0.85rem;
  color: #ff3b30;
  font-style: italic;
}

/* SKELETONS */
.skeleton-course {
  height: 400px;
  border-radius: 20px;
  background: linear-gradient(90deg, #f5f5f7 25%, #eaeaea 50%, #f5f5f7 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@media (max-width: 800px) {
  .academy-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 32px;
    padding: 32px;
  }
}
</style>
