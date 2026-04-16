<script setup lang="ts">
import { ref } from "vue"
import { productosPrivados } from "./data/products"

const user = ref("")
const pass = ref("")
const isLogged = ref(false)
const displayUserName = ref("Consultora")

function handleLogin() {
  if (user.value.trim() !== "" && pass.value.length >= 4) {
    isLogged.value = true
    displayUserName.value = user.value
  } else {
    alert("Ingrese usuario y contraseña (mínimo 4 caracteres)")
  }
}

function handleLogout() {
  location.reload()
}

function addToCart(nombre: string) {
  alert(`Éxito: Se añadió ${nombre} al pedido`)
}
</script>

<template>
  <nav class="main-nav">
    <div class="container nav-flex">
      <div class="logo">CATÁLOGO<span>PERÚ</span></div>

      <div v-if="!isLogged" class="auth-box">
        <input v-model="user" placeholder="Usuario" />

        <input
          v-model="pass"
          type="password"
          placeholder="Contraseña"
        />

        <button @click="handleLogin" class="btn-login">
          Entrar
        </button>
      </div>
    </div>
  </nav>

  <!-- PUBLIC VIEW -->

  <main v-if="!isLogged" class="fade-in">
    <section class="hero">
      <div class="container">
        <div class="promo-badge">
          OFERTA DE LA SEMANA
        </div>

        <h1>
          Campaña de Verano - 40% OFF
        </h1>

        <p>
          Descubre los nuevos ingresos en joyería y fragancias.
        </p>
      </div>
    </section>

    <section class="events-section container">
      <h2>Próximos Eventos</h2>

      <div class="event-card">
        <i class="fas fa-calendar-alt"></i>

        <div>
          <h4>
            Capacitación Regional - Lima
          </h4>

          <p>
            15 de Mayo | Hotel Sheraton | 4:00 PM
          </p>
        </div>
      </div>
    </section>

    <section class="testimonials">
      <div class="container">
        <h3>
          Lo que dicen nuestras consultoras
        </h3>

        <div class="comment-grid">
          <div class="comment">
            "Logré mi independencia económica en solo 6 meses. ¡Increíble!"
            - <strong>María R.</strong>
          </div>

          <div class="comment">
            "Los productos tienen una calidad superior y el envío a provincia es rápido."
            - <strong>Juan P.</strong>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer-grid">
        <div class="contact-info">
          <h4>Contáctanos</h4>

          <p>
            <i class="fas fa-phone"></i>
            +51 999 888 777
          </p>

          <p>
            <i class="fas fa-envelope"></i>
            ayuda@catalogoperu.com
          </p>
        </div>

        <div class="social-links">
          <h4>Síguenos</h4>

          <div class="icons">
            <a href="#"><i class="fab fa-facebook"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
            <a href="#"><i class="fab fa-tiktok"></i></a>
            <a href="#"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>
      </div>
    </footer>
  </main>

  <!-- PRIVATE VIEW -->

  <main v-else class="section fade-in">
    <div class="container">
      <header class="user-header">
        <h2>
          Bienvenida,
          <span>
            {{ displayUserName }}
          </span>
        </h2>

        <div class="balance-card">
          <p>Mi Saldo Disponible</p>

          <span class="amount">
            S/ 1,250.40
          </span>
        </div>

        <button
          class="btn-outline"
          @click="handleLogout"
        >
          Cerrar Sesión
        </button>
      </header>

      <h3>Realizar Pedido</h3>

      <div class="product-grid">
        <div
          v-for="p in productosPrivados"
          :key="p.id"
          class="card-prod"
        >
          <div style="font-size:3rem">
            📦
          </div>

          <h4>
            {{ p.nombre }}
          </h4>

          <p
            style="color:var(--accent);
            font-weight:bold"
          >
            S/ {{ p.precio.toFixed(2) }}
          </p>

          <button
            class="btn-add"
            @click="addToCart(p.nombre)"
          >
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
@import "./assets/style.css";
</style>