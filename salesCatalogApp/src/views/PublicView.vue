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
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1a24 100%);
  padding: 80px 0;
  color: white;
}

.promo-badge {
  display: inline-block;
  background: #e91e63;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 5px 14px;
  border-radius: 20px;
  margin-bottom: 20px;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 16px;
}

.hero h1 em {
  color: #e91e63;
  font-style: normal;
}

.hero p {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.65);
  max-width: 480px;
  margin: 0;
}

.events-section {
  padding: 60px 20px;
}

.section-heading {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.event-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  border-left: 3px solid #e91e63;
}

.event-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.event-card h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px;
}

.event-card p {
  font-size: 0.85rem;
  color: #aaa;
  margin: 0;
}

.testimonials {
  background: #fafafa;
  padding: 60px 20px;
}

.comment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.comment {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  font-size: 0.9rem;
  color: #444;
  line-height: 1.6;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment cite {
  font-size: 0.82rem;
  font-weight: 600;
  color: #e91e63;
  font-style: normal;
}

.footer {
  background: #1a1a1a;
  color: rgba(255,255,255,0.75);
  padding: 48px 0 0;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 32px;
  padding-bottom: 40px;
}

.footer-brand {
  font-size: 1.2rem;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
}

.footer-brand span {
  color: #e91e63;
}

.footer-tagline {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

.footer-heading {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.4);
  margin: 0 0 12px;
}

.footer p {
  font-size: 0.875rem;
  margin: 6px 0;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.social-pill {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  text-decoration: none;
  transition: background 0.2s;
}

.social-pill:hover {
  background: #e91e63;
  color: white;
}

.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 20px;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.25);
  text-align: center;
}
</style>