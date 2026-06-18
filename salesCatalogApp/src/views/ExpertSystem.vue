<script setup lang="ts">
import { ref, onMounted, watch, computed, inject } from "vue"

const showNotification = inject<(msg: string, type?: string) => void>('showNotification')

// Definición de las interfaces de datos para asegurar el tipado de TypeScript
interface Client {
  _id: string
  name: string
  phone: string
  address: string
}

interface Product {
  _id: string
  name: string
  category: string
  price: number
  stock: number
  imagen?: string // <--- Propiedad opcional para la ruta de la imagen
}

const API_URL = import.meta.env.REMOTE_API_URL || "http://localhost:3000/api" // Endpoint base de la API del servidor

// Estados reactivos para la carga de datos desde el backend
const clients = ref<Client[]>([]) // Listado de clientes reales cargados de la base de datos
const products = ref<Product[]>([]) // Listado de productos reales para el motor de recomendación
const loading = ref(true) // Controla el estado visual de carga

// Estados reactivos para almacenar las respuestas del cuestionario
const selectedClient = ref("") // ID del cliente seleccionado para la consultoría
const tipoPiel = ref("") // 'seca' | 'grasa' | 'mixta' | 'sensible'
const categoriaInteres = ref("") // 'facial' | 'maquillaje' | 'fragancias' | 'cuidado_personal'
const preocupacion = ref("") // 'hidratacion' | 'antiedad' | 'control_grasa' | 'diario'
const ocasion = ref("") // 'diario' (Uso Diario) | 'noche' (Noche) | 'eventos' (Eventos)

// Estados reactivos para la demanda y renovación
const quantity = ref(1) // Cantidad de unidades a pedir
const renewalDays = ref(30) // Tiempo de renovación sugerido en días

// Estado para almacenar el producto recomendado por el Sistema Experto
const recommendedProduct = ref<Product | null>(null)
const savingOrder = ref(false) // Control de carga al registrar el pedido final

// Carga inicial de datos de clientes y productos desde el servidor MongoDB
onMounted(async () => {
  try {
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }

    // 1. Obtener la lista de clientes registrados
    const clientsRes = await fetch(`${API_URL}/clients`, { headers })
    if (clientsRes.ok) {
      const data = await clientsRes.json()
      clients.value = data.items ?? []
    }

    // 2. Obtener la lista de todos los productos disponibles
    const productsRes = await fetch(`${API_URL}/products`, { headers })
    if (productsRes.ok) {
      const data = await productsRes.json()
      products.value = data.items ?? []
    }
  } catch (error) {
    console.error("Error al inicializar el sistema experto:", error)
  } finally {
    loading.value = false
  }
})


// Limpian la recomendación activa si la consultora cambia de parecer,
watch([tipoPiel, categoriaInteres, preocupacion, ocasion], () => {
  recommendedProduct.value = null
})


// Si la consultora cambia de categoría (ej: de Facial a Fragancias),
// limpiamos la preocupación/enfoque anterior ya que las opciones cambian por completo.
watch(categoriaInteres, () => {
  preocupacion.value = ""
})

// PROPIEDAD COMPUTADA (enfoquesDisponibles):
// Genera de forma inteligente y dinámica la lista de enfoques o efectos deseados 
// dependiendo de la categoría de producto seleccionada, evitando inconsistencias lógicas.
const enfoquesDisponibles = computed(() => {
  if (categoriaInteres.value === "facial") {
    return [
      { value: "hidratacion", label: "Hidratación Profunda y Brillo" },
      { value: "antiedad", label: "Antiedad (Líneas de Expresión y Arrugas)" },
      { value: "control_grasa", label: "Control de Brillo y Poros" },
      { value: "sensibilidad", label: "Calmar Enrojecimiento / Sensibilidad" }
    ]
  } else if (categoriaInteres.value === "maquillaje") {
    return [
      { value: "cobertura", label: "Alta Cobertura (Ocultar Imperfecciones)" },
      { value: "natural", label: "Acabado Natural y Luminoso" },
      { value: "larga_duracion", label: "Larga Duración (A prueba de agua)" },
      { value: "mate", label: "Efecto Mate (Cero Brillo)" }
    ]
  } else if (categoriaInteres.value === "fragancias") {
    return [
      { value: "dulce", label: "Dulce y Cálido (Vainilla / Caramelo)" },
      { value: "fresco", label: "Fresco y Cítrico (Limón / Hojas Verdes)" },
      { value: "floral", label: "Floral Elegante (Rosas / Jazmín)" },
      { value: "maderoso", label: "Maderoso y Sensual (Sándalo / Ámbar)" }
    ]
  } else if (categoriaInteres.value === "cuidado_personal") {
    return [
      { value: "hidratacion_corporal", label: "Hidratación Corporal Intensa" },
      { value: "proteccion_solar", label: "Protección Solar Activa" },
      { value: "cabello", label: "Cuidado Capilar y Fuerza" },
      { value: "relajacion", label: "Relajación y Baño (Aromaterapia)" }
    ]
  }
  return []
})

const isProcessing = ref(false) // Controla el estado visual de carga y razonamiento del motor experto

// Función que emula la consulta de reglas lógicas en el Sistema Experto
async function procesarRecomendacion() {
  if (!selectedClient.value) {
    showNotification?.("Por favor, selecciona un Cliente bajo consultoría primero.", "warning")
    return
  }
  if (!tipoPiel.value || !categoriaInteres.value || !preocupacion.value || !ocasion.value) {
    showNotification?.("Por favor, responde todas las características antes de obtener la recomendación.", "warning")
    return
  }

  isProcessing.value = true
  
  // Agregamos una pausa simulada de 900ms para emular el procesamiento de las reglas
  await new Promise(resolve => setTimeout(resolve, 900))
  
  evaluarRecomendacion()
  isProcessing.value = false
}

// MOTOR DE INFERENCIA (Sistema Experto basado en Reglas de Producción)
// Analiza las características ingresadas y selecciona el producto adecuado del catálogo.
function evaluarRecomendacion() {
  // Si no se han completado las preguntas clave, no se emite recomendación todavía.
  if (!categoriaInteres.value || !tipoPiel.value || !preocupacion.value) {
    recommendedProduct.value = null
    return
  }

  let match: Product | null = null
  const productsList = products.value

  // REGLAS PARA TRATAMIENTO FACIAL (SKINCARE)
  if (categoriaInteres.value === "facial") {
    if (preocupacion.value === "antiedad") {
      // Priorizamos la Crema Regeneradora Noche para arrugas/antiedad
      match = productsList.find(p => p.name.toLowerCase().includes("crema") || p.name.toLowerCase().includes("noche")) || null
    } 
    else if (preocupacion.value === "hidratacion") {
      // Priorizamos el Kit Facial Pro o Sérum Ácido Hialurónico
      match = productsList.find(p => p.name.toLowerCase().includes("hialurónico") || p.name.toLowerCase().includes("kit")) || null
    }
    else if (preocupacion.value === "control_grasa") {
      // Priorizamos el Sérum Niacinamida Sebo-Regulador o Mascarilla de Arcilla
      match = productsList.find(p => p.name.toLowerCase().includes("niacinamida") || p.name.toLowerCase().includes("arcilla")) || null
    }
    else if (preocupacion.value === "sensibilidad") {
      // Priorizamos la Crema Piel Sensible y Reactiva o Tónico de Aloe
      match = productsList.find(p => p.name.toLowerCase().includes("sensible") || p.name.toLowerCase().includes("aloe")) || null
    }

    // Fallback de Categoría Facial: cualquier producto que sea de tratamiento/facial en stock
    if (!match) {
      match = productsList.find(p => p.category.toLowerCase().includes("facial") || p.category.toLowerCase().includes("tratamiento")) || null
    }
  }

  // REGLAS PARA MAQUILLAJE Y BISUTERÍA FINA
  else if (categoriaInteres.value === "maquillaje") {
    // Si la ocasión es un Evento Especial
    if (ocasion.value === "eventos") {
      // Para un gran evento, priorizamos la bisutería fina (Collar de Perlas o Reloj Elegance)
      match = productsList.find(p => p.name.toLowerCase().includes("collar") || p.name.toLowerCase().includes("reloj")) || null
    } 
    // Si busca ocultar imperfecciones (Alta Cobertura)
    else if (preocupacion.value === "cobertura") {
      match = productsList.find(p => p.name.toLowerCase().includes("base") || p.name.toLowerCase().includes("cobertura")) || null
    }
    // Si busca cero brillo (Efecto Mate)
    else if (preocupacion.value === "mate") {
      match = productsList.find(p => p.name.toLowerCase().includes("polvo") || p.name.toLowerCase().includes("mate")) || null
    }
    // Si busca larga duración a prueba de agua
    else if (preocupacion.value === "larga_duracion") {
      match = productsList.find(p => p.name.toLowerCase().includes("delineador") || p.name.toLowerCase().includes("waterproof") || p.name.toLowerCase().includes("pestañas")) || null
    }
    // Si busca un acabado natural y luminoso
    else if (preocupacion.value === "natural") {
      match = productsList.find(p => p.name.toLowerCase().includes("iluminador") || p.name.toLowerCase().includes("corrector")) || null
    }
    
    // Fallback de Categoría Maquillaje: Si nada coincide, entrega el Set de Brochas básico
    if (!match) {
      match = productsList.find(p => p.name.toLowerCase().includes("set") || p.name.toLowerCase().includes("brochas") || p.category.toLowerCase().includes("maquillaje")) || null
    }
  }

  // REGLAS PARA FRAGANCIAS Y VELAS
  else if (categoriaInteres.value === "fragancias") {
    if (preocupacion.value === "maderoso" || preocupacion.value === "floral" || ocasion.value === "noche") {
      // Perfume Deep Blue (premium y nocturno)
      match = productsList.find(p => p.name.toLowerCase().includes("deep") || p.name.toLowerCase().includes("blue") || p.name.toLowerCase().includes("perfume")) || null
    } else if (preocupacion.value === "fresco" || preocupacion.value === "dulce" || ocasion.value === "diario") {
      // Vela Aromática de Lavanda para la armonía del día
      match = productsList.find(p => p.name.toLowerCase().includes("vela") || p.name.toLowerCase().includes("lavanda")) || null
    }
    // Fallback de Categoría Fragancias
    if (!match) {
      match = productsList.find(p => p.category.toLowerCase().includes("fragancia") || p.category.toLowerCase().includes("vela")) || null
    }
  }

  // REGLAS PARA CUIDADO PERSONAL
  else if (categoriaInteres.value === "cuidado_personal") {
    match = productsList.find(p => p.category.toLowerCase().includes("personal") || p.category.toLowerCase().includes("cuidado")) || null
  }

  // FALLBACK ABSOLUTO: Si la base de datos está vacía o no coincide nada, devuelve el primer producto del catálogo
  if (!match && productsList.length > 0) {
    match = productsList[0]
  }

  recommendedProduct.value = match

  // INFERENCIA DEL TIEMPO DE RENOVACIÓN DE LA DEMANDA
  if (match) {
    const cat = match.category.toLowerCase()
    if (cat.includes("facial") || cat.includes("tratamiento")) {
      renewalDays.value = 30 // 30 días para cuidado facial
    } else if (cat.includes("fragancia") || cat.includes("perfume") || cat.includes("vela")) {
      renewalDays.value = 60 // 60 días para fragancias o velas
    } else if (cat.includes("maquillaje") || cat.includes("brochas") || cat.includes("reloj")) {
      renewalDays.value = 90 // 90 días para maquillaje y accesorios
    } else {
      renewalDays.value = 45 // Por defecto
    }
  }
}

// Envía el pedido recomendado directamente a la API para registrar la venta
async function registrarPedidoRecomendado() {
  if (!selectedClient.value) {
    showNotification?.("Por favor, selecciona un cliente para registrar el pedido.", "warning")
    return
  }
  if (!recommendedProduct.value) {
    showNotification?.("No hay ningún producto recomendado activo.", "warning")
    return
  }

  const qty = Number(quantity.value)
  if (qty <= 0 || !Number.isInteger(qty)) {
    showNotification?.("La cantidad debe ser un número entero mayor a 0.", "error")
    return
  }
  if (qty > 1000) {
    showNotification?.("La cantidad máxima permitida es 1000 unidades.", "warning")
    return
  }

  savingOrder.value = true
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      showNotification?.("Error: No se encontró una sesión activa. Por favor, inicia sesión.", "error")
      return
    }
    
    // Obtiene el payload del usuario logueado para extraer su ID de consultora
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const meData = await meRes.json()
    
    if (!meRes.ok || !meData.data) {
      showNotification?.(`Error de autenticación (${meRes.status}): Tu sesión es inválida o ha expirado. Vuelve a iniciar sesión.`, "error")
      return
    }
    
    const consultantId = meData.data.id

    // Realiza el POST a la API de pedidos
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        clientId: selectedClient.value,
        consultantId: consultantId,
        items: [{ productId: recommendedProduct.value._id, quantity: qty }]
      })
    })

    if (res.ok) {
      showNotification?.(`¡Pedido registrado con éxito!\nProducto: ${recommendedProduct.value.name}\nCantidad: ${qty} und.`, "success")
      
      // Limpia el formulario
      selectedClient.value = ""
      tipoPiel.value = ""
      categoriaInteres.value = ""
      preocupacion.value = ""
      ocasion.value = ""
      recommendedProduct.value = null
    } else {
      const errData = await res.json().catch(() => ({}))
      console.error("Error del backend en /orders:", errData)
      showNotification?.(`Error al registrar el pedido: ${errData.error?.message || 'Verifica el stock o los datos.'}`, "error")
    }
  } catch (error) {
    console.error("Excepción en registrarPedidoRecomendado:", error)
    showNotification?.("Error de conexión con el servidor backend.", "error")
  } finally {
    savingOrder.value = false
  }
}
</script>

<template>
  <main class="section fade-in">
    <div class="container">
      
      <!-- Encabezado de la página -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Sistema Experto</h1>
          <p class="page-sub">Ingresa las características de tu cliente para elegir los cosméticos ideales</p>
        </div>
      </div>

      <!-- Pantalla de carga si la API está respondiendo -->
      <div v-if="loading" class="form-card text-center">
        <p>Cargando catálogo e información de clientes...</p>
      </div>

      <!-- Cuerpo principal del Sistema Experto -->
      <div v-else class="expert-grid">
        
        <!-- Bloque Izquierdo: Cuestionario del Cliente -->
        <div class="form-card">
          <h3 class="form-title">Características del Cliente</h3>
          
          <div class="form-vertical">
            <!-- 1. Selección de Cliente Real de la base de datos -->
            <div class="field">
              <label>Cliente bajo consultoría</label>
              <select v-model="selectedClient" class="expert-select">
                <option value="">-- Selecciona un Cliente --</option>
                <option v-for="c in clients" :key="c._id" :value="c._id">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <!-- 2. Tipo de Piel del Cliente -->
            <div class="field">
              <label>Tipo de piel</label>
              <select v-model="tipoPiel" class="expert-select">
                <option value="">-- Selecciona --</option>
                <option value="seca">Seca / Deshidratada</option>
                <option value="grasa"> Grasa </option>
                <option value="mixta">Mixta </option>
                <option value="sensible">Sensible / Reactiva</option>
              </select>
            </div>

            <!-- 3. Categoría de Interés -->
            <div class="field">
              <label>Categoría de producto preferida</label>
              <select v-model="categoriaInteres" class="expert-select">
                <option value="">-- Selecciona --</option>
                <option value="facial">Tratamiento Facial</option>
                <option value="maquillaje">Maquillaje</option>
                <option value="fragancias">Fragancias y Velas</option>
                <option value="cuidado_personal">Cuidado Personal</option>
              </select>
            </div>

            <!-- 4. Enfoque o Efecto Deseado (Se renderiza dinámicamente según la Categoría seleccionada) -->
            <div class="field" v-if="categoriaInteres">
              <label>Enfoque o efecto deseado</label>
              <select v-model="preocupacion" class="expert-select">
                <option value="">-- Selecciona --</option>
                <option v-for="op in enfoquesDisponibles" :key="op.value" :value="op.value">
                  {{ op.label }}
                </option>
              </select>
            </div>

            <!-- 5. Ocasión (Con las opciones exactas solicitadas por el usuario) -->
            <div class="field">
              <label>Ocasión de uso</label>
              <select v-model="ocasion" class="expert-select">
                <option value="">-- Selecciona --</option>
                <option value="diario">Uso Diario</option>
                <option value="noche">Noche</option>
                <option value="eventos">Eventos</option>
              </select>
            </div>

            <!-- Botón interactivo para procesar las reglas de inferencia del Sistema Experto -->
            <button 
              class="btn-process-expert" 
              :disabled="isProcessing" 
              @click="procesarRecomendacion"
            >
              {{ isProcessing ? 'Consultando Sistema Experto...' : 'Obtener Recomendación' }}
            </button>
          </div>
        </div>

        <!-- Bloque Derecho: Resultados de Inferencia y Demanda -->
        <div class="result-card">
          <h3 class="form-title">Recomendación del Motor Experto</h3>
          
          <!-- Si no hay producto recomendado por falta de datos en el cuestionario -->
          <div v-if="!recommendedProduct" class="no-recommendation">
            <span class="info-icon"></span>
            <p>Llene todas las caracteristicas ,enfoque u ocacion de sus productos deseados </p>
          </div>

          <!-- Si el Sistema Experto ha seleccionado el producto ideal -->
          <div v-else class="recommendation-content">
            <div class="badge-recommended">PRODUCTO SELECCIONADO</div>
            
            <div class="product-info-box">
              <span class="prod-cat">{{ recommendedProduct.category }}</span>
              <h4 class="prod-title">{{ recommendedProduct.name }}</h4>
              
              <!-- NUEVO: Mostrar imagen si existe -->
              <div class="product-image-container" v-if="recommendedProduct.imagen">
                <img :src="recommendedProduct.imagen" :alt="recommendedProduct.name" class="product-img" />
              </div>

              <p class="prod-cost">Precio de Catálogo: <strong>S/ {{ recommendedProduct.price.toFixed(2) }}</strong></p>
              <p class="prod-stock">Stock disponible en Almacén: <span>{{ recommendedProduct.stock }} und.</span></p>
            </div>

            <hr class="divider" />

            <!-- Parámetros de Demanda y Renovación -->
            <h4 class="sub-title">Control de Demanda y Ciclo de Vida</h4>
            
            <div class="demand-fields">
              <div class="field">
                <label>Cantidad pedida</label>
                <input v-model.number="quantity" type="number" min="1" class="expert-input" />
              </div>
              <div class="field">
                <label>Tiempo de renovación (días)</label>
                <input v-model.number="renewalDays" type="number" min="1" class="expert-input" />
                <span class="input-helper">Sugerido para su categoría de consumo</span>
              </div>
            </div>

            <button 
              class="btn-order-expert" 
              :disabled="savingOrder || recommendedProduct.stock < quantity" 
              @click="registrarPedidoRecomendado"
            >
              {{ savingOrder ? 'Registrando Pedido…' : 'Registrar Pedido de Venta' }}
            </button>
            <p v-if="recommendedProduct.stock < quantity" class="error-stock-label">
              ⚠️ La cantidad pedida supera el stock físico de almacén.
            </p>
          </div>
        </div>

      </div>
    </div>
  </main>
</template>

<style scoped>
/* ESTILOS ESPECÍFICOS Y MODERNOS PARA EL MÓDULO DEL SISTEMA EXPERTO */
.expert-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

/* Botón de procesamiento del Sistema Experto */
.btn-process-expert {
  background: var(--accent);
  color: var(--white);
  border: 1px solid var(--accent);
  padding: 14px 20px;
  border-radius: 980px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease, transform 0.1s;
  margin-top: 16px;
  text-align: center;
}

.btn-process-expert:hover:not(:disabled) {
  background: #0077ed;
  border-color: #0077ed;
}

.btn-process-expert:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-process-expert:disabled {
  background: var(--light);
  color: var(--secondary);
  border-color: var(--border);
  cursor: not-allowed;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 24px;
}

.form-vertical {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.expert-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background-color: var(--white);
  font-size: 0.95rem;
  outline: none;
  color: var(--primary);
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
}

.expert-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.result-card {
  background: var(--white);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.02);
  min-height: 400px;
}

.no-recommendation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--secondary);
  padding: 60px 20px;
  gap: 16px;
}

.info-icon {
  font-size: 2.5rem;
}

.no-recommendation p {
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 320px;
  margin: 0;
}

.recommendation-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.badge-recommended {
  display: inline-block;
  align-self: flex-start;
  background: #e8f5e9;
  color: #27ae60;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 980px;
  letter-spacing: 0.05em;
}

.product-info-box {
  background: var(--light);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border);
}

.prod-cat {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--secondary);
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 6px;
}

.prod-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 12px;
  line-height: 1.25;
}

/* Estilos para la imagen del producto */
.product-image-container {
  display: flex;
  justify-content: center;
  margin: 16px 0;
  padding: 12px;
  background: var(--white);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.product-img {
  max-width: 100%;
  height: auto;
  max-height: 180px;
  object-fit: contain;
  border-radius: 8px;
}

.prod-cost {
  font-size: 1.1rem;
  color: var(--primary);
  margin: 0 0 6px;
}

.prod-cost strong {
  font-size: 1.3rem;
  color: var(--accent);
}

.prod-stock {
  font-size: 0.9rem;
  color: var(--secondary);
  margin: 0;
}

.prod-stock span {
  font-weight: 600;
  color: var(--primary);
}

.divider {
  border: 0;
  height: 1px;
  background: var(--border);
  margin: 8px 0;
}

.sub-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 8px;
}

.demand-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.expert-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  background-color: var(--white);
  outline: none;
  color: var(--primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.expert-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
}

.input-helper {
  font-size: 0.7rem;
  color: var(--secondary);
  margin-top: 4px;
  display: block;
}

.btn-order-expert {
  background: var(--accent);
  color: var(--white);
  border: none;
  padding: 14px;
  border-radius: 980px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s, transform 0.1s;
  margin-top: 8px;
}

.btn-order-expert:hover:not(:disabled) {
  background: #0077ed;
}

.btn-order-expert:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-order-expert:disabled {
  background: var(--border);
  color: var(--secondary);
  cursor: not-allowed;
}

.error-stock-label {
  color: #ff3b30;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.text-center {
  text-align: center;
}

@media (max-width: 800px) {
  .expert-grid {
    grid-template-columns: 1fr;
  }
}
</style>
