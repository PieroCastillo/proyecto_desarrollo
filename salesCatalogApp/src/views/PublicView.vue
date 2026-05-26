<script setup lang="ts">
// Vista pública / landing
</script>

<template>
  <main class="fade-in">
    <section class="hero">
      <div class="container">
        <span class="promo-badge">OFERTA DE LA SEMANA</span>
        <h1>Campaña de Verano<br /><em>40% OFF</em></h1>
        <p>Descubre los nuevos ingresos en joyería y fragancias exclusivas.</p>
      </div>
    </section>

    <section class="events-section container">
      <h2 class="section-heading">Próximos Eventos</h2>
      <div class="event-card">
        <div class="event-icon">📅</div>
        <div>
          <h4>Capacitación Regional – Lima</h4>
          <p>15 de Mayo · Hotel Sheraton · 4:00 PM</p>
        </div>
      </div>
      <div class="event-card">
        <div class="event-icon">🎁</div>
        <div>
          <h4>Lanzamiento Colección Invierno</h4>
          <p>1 de Junio · Online · 7:00 PM</p>
        </div>
      </div>
    </section>

    <section class="testimonials">
      <div class="container">
        <h2 class="section-heading">Lo que dicen nuestras consultoras</h2>
        <div class="comment-grid">
          <blockquote class="comment">
            "Logré mi independencia económica en solo 6 meses. ¡Increíble!"
            <cite>— María R.</cite>
          </blockquote>
          <blockquote class="comment">
            "Los productos tienen una calidad superior y el envío a provincia es rápido."
            <cite>— Juan P.</cite>
          </blockquote>
          <blockquote class="comment">
            "El equipo siempre me apoya. Siento que soy parte de algo grande."
            <cite>— Carla V.</cite>
          </blockquote>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <div class="footer-brand">CATÁLOGO<span>PERÚ</span></div>
          <p class="footer-tagline">Belleza, confianza y oportunidad.</p>
        </div>
        <div>
          <h4 class="footer-heading">Contáctanos</h4>
          <p>📞 +51 999 888 777</p>
          <p>✉️ ayuda@catalogoperu.com</p>
        </div>
        <div>
          <h4 class="footer-heading">Síguenos</h4>
          <div class="social-links">
            <a href="#" class="social-pill">Facebook</a>
            <a href="#" class="social-pill">Instagram</a>
            <a href="#" class="social-pill">TikTok</a>
            <a href="#" class="social-pill">WhatsApp</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom container">
        © {{ new Date().getFullYear() }} CatálogoPerú. Todos los derechos reservados.
      </div>
    </footer>
  </main>
</template>

<style scoped>
.hero {
  background: var(--primary);
  padding: 160px 0 140px;
  color: var(--white);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.promo-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  color: #ff9f00;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 6px 16px;
  border-radius: 980px;
  margin-bottom: 24px;
}

.hero h1 {
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 0 0 24px;
}

.hero h1 em {
  color: #ff9f00;
  font-style: normal;
}

.hero p {
  font-size: 1.3rem;
  color: var(--secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.4;
}

.section-heading {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--primary);
  margin-bottom: 40px;
  text-align: center;
}

.event-icon {
  font-size: 2rem;
  flex-shrink: 0;
  background: var(--light);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.event-card h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary);
  margin: 0 0 8px;
}

.event-card p {
  font-size: 0.95rem;
  color: var(--secondary);
  margin: 0;
}

.testimonials {
  background: var(--light);
}

.comment cite {
  display: block;
  margin-top: 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--secondary);
  font-style: normal;
}

.footer-brand {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.footer-brand span {
  color: var(--accent);
}

.footer-tagline {
  font-size: 0.9rem;
  color: var(--secondary);
  margin: 0;
}

.footer-heading {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary);
  margin: 0 0 16px;
}

.footer p {
  font-size: 0.9rem;
  color: var(--secondary);
  margin: 8px 0;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-pill {
  color: var(--accent);
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.2s;
  display: inline-block;
}

.social-pill:hover {
  color: var(--primary);
  text-decoration: underline;
}

.footer-bottom {
  border-top: 1px solid var(--border);
  padding: 24px 20px;
  font-size: 0.85rem;
  color: var(--secondary);
  text-align: center;
  margin-top: 40px;
}
</style>