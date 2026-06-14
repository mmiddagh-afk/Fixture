# Rediseño UI Desktop — FIFA World Cup 2026 Fixture

## Guía de Implementación Completa y Autocontenida

> **Objetivo**: Transformar la versión desktop (≥1024px) de una app de fixture del Mundial 2026 de un diseño mobile-estirado a una experiencia desktop nativa con sidebar, grids multi-columna y efectos premium.

> **Regla de oro**: NO se modifica la lógica JavaScript. NO se modifica el diseño mobile (<1024px). Solo se cambian estilos CSS para desktop y se hacen ajustes HTML mínimos.

---

## 1. Contexto del Proyecto

### Stack Tecnológico
- HTML5 + Vanilla JS (ES Modules) + Vanilla CSS
- PWA con Service Worker y manifest.json
- Google Fonts: `Inter` (body) y `Outfit` (display/headings)
- Sin frameworks CSS ni bundlers

### Archivos Relevantes
- `index.html` — Estructura completa de la SPA
- `css/styles.css` — Todos los estilos (2439 líneas, ~51KB)
- `js/app.js` — Lógica de la aplicación (NO TOCAR)
- `js/data.js` — Datos de partidos y equipos (NO TOCAR)
- `js/utils.js` — Utilidades (NO TOCAR)

### Paleta de Colores Existente (Design Tokens en `:root`)
```css
--hue-bg: 226;              /* Azul oscuro base */
--hue-accent: 47;           /* FIFA Gold */
--bg-dark-1: hsl(226, 35%, 5%);     /* #0a0e1a */
--bg-dark-2: hsl(226, 32%, 10%);    /* #111831 */
--bg-card: hsla(0, 0%, 100%, 0.03);
--bg-card-hover: hsla(0, 0%, 100%, 0.06);
--accent-gold: hsl(47, 90%, 53%);   /* #f5c518 */
--accent-gold-glow: hsla(47, 90%, 53%, 0.35);
--accent-green: hsl(145, 90%, 45%); /* Live matches */
--accent-red: hsl(0, 85%, 60%);
--text-primary: hsl(0, 0%, 100%);
--text-secondary: hsla(0, 0%, 100%, 0.7);
--text-muted: hsla(0, 0%, 100%, 0.45);
--glass-border: hsla(0, 0%, 100%, 0.08);
--border-radius-sm: 8px;
--border-radius-md: 16px;
--border-radius-lg: 24px;
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 2. Estructura HTML Actual (Simplificada)

```html
<body>
  <!-- Preloader (se oculta al cargar) -->
  <div class="app-preloader" id="app-preloader">...</div>

  <!-- Canvas confetti -->
  <canvas id="confetti-canvas">...</canvas>

  <!-- Pull to Refresh (solo mobile) -->
  <div class="ptr-element" id="ptr-element">...</div>

  <!-- Ambient glow blobs -->
  <div class="glow-bg-1"></div>
  <div class="glow-bg-2"></div>

  <!-- ============ MAIN APP CONTAINER ============ -->
  <div class="app-container">

    <!-- HEADER -->
    <header class="app-header">
      <div class="header-top">
        <span class="host-badge">🇨🇦 🇲🇽 🇺🇸 CAN · MEX · USA 2026</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-install" id="pwa-install-btn">📲 Instalar</button>
          <button class="btn-alerts-toggle" id="btn-alerts-toggle">🔔 Alertas</button>
          <button class="btn-fav-toggle" id="btn-fav-toggle">⭐ Favorito</button>
          <button class="btn-sync-live" id="btn-sync-live">
            <span class="sync-icon">🔴</span>
            <span class="sync-text">Sincronizar</span>
          </button>
        </div>
      </div>
      <h1 class="app-title">MUNDIAL 2026</h1>
      <p class="app-subtitle">Fixture & Resultados en Tiempo Real</p>
    </header>

    <!-- NAVIGATION (actualmente bottom tabs en mobile, top tabs en ≥768px) -->
    <nav class="app-nav">
      <button class="nav-tab active" data-tab="hoy">
        <span class="tab-icon">📅</span>
        <span class="tab-label">Hoy</span>
      </button>
      <button class="nav-tab" data-tab="grupos">
        <span class="tab-icon">🏆</span>
        <span class="tab-label">Grupos</span>
      </button>
      <button class="nav-tab" data-tab="eliminatorias">
        <span class="tab-icon">⚡</span>
        <span class="tab-label">Llaves</span>
      </button>
      <button class="nav-tab" data-tab="tablas">
        <span class="tab-icon">📊</span>
        <span class="tab-label">Tablas</span>
      </button>
      <div class="nav-underline"></div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="app-main">

      <!-- VIEW: HOY -->
      <section id="view-hoy" class="view-section active">
        <div class="prode-stats-banner" id="prode-stats-banner">...</div>
        <div id="fav-team-banner-container">...</div>  <!-- Widget selección favorita -->
        <div class="section-header">
          <h2>Partidos de Hoy</h2>
          <span class="current-date-lbl" id="hoy-date-label">...</span>
        </div>
        <div class="matches-list" id="list-hoy">...</div>  <!-- Match cards -->
        <div class="trivia-container-wrapper" id="trivia-container-wrapper">
          <div class="trivia-card" id="trivia-card">...</div>
        </div>
        <button class="btn-toggle-calendar" id="btn-toggle-cal">📅 Ver Calendario Completo</button>
      </section>

      <!-- VIEW: GRUPOS -->
      <section id="view-grupos" class="view-section">
        <div class="section-header">
          <h2>Fase de Grupos</h2>
          <div class="filter-wrapper">
            <select id="group-filter" class="group-dropdown">...</select>
          </div>
        </div>
        <div class="groups-grid" id="groups-container">...</div>
      </section>

      <!-- VIEW: ELIMINATORIAS -->
      <section id="view-eliminatorias" class="view-section">
        <div class="section-header">
          <h2>Fase Eliminatoria</h2>
        </div>
        <div class="bracket-outer">
          <div class="bracket-container" id="bracket-container">...</div>
        </div>
      </section>

      <!-- VIEW: TABLAS -->
      <section id="view-tablas" class="view-section">
        <div class="tournament-stats-dashboard" id="tournament-stats-dashboard">...</div>
        <div class="section-header">
          <h2>Tablas de Posiciones</h2>
        </div>
        <div class="tables-container" id="tables-container">...</div>
      </section>

    </main>

    <!-- FOOTER -->
    <footer class="app-footer">
      <p>Copa Mundial de la FIFA 2026™ Fixture Tracker</p>
      <p class="footer-note">Bolivia Local Time zone (UTC-4)</p>
    </footer>

  </div>

  <!-- FLOATING PRODE BUTTON (posición absoluta) -->
  <button class="btn-simulator-trigger" id="btn-prode-toggle">
    <span class="pulse-ring"></span>
    <span class="sim-icon">🏆</span>
    <span class="sim-text">Prode</span>
  </button>

  <!-- MODALES (posición fixed, z-index alto) -->
  <div class="fav-selector-modal" id="fav-selector-modal">...</div>
  <div class="modal-overlay" id="fav-modal-overlay"></div>
  <div class="fav-selector-modal" id="ios-install-modal">...</div>
  <div class="modal-overlay" id="ios-modal-overlay"></div>
</body>
```

**Orden de renderizado actual con CSS `order`:**
- `.app-header` → order implícito (1)
- `.app-nav` → `order: 3` (bottom tab bar en mobile)
- `.app-main` → `order: 2` (contenido principal)
- `.app-footer` → order implícito (4)

---

## 3. Diseño Desktop Objetivo

### Layout General (≥1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (full-width, horizontal bar con branding + actions)     │
├───────────┬─────────────────────────────────────────────────────┤
│           │                                                     │
│  SIDEBAR  │              MAIN CONTENT                           │
│  (260px)  │         (flexible, multi-column)                    │
│           │                                                     │
│  ┌─────┐  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Nav │  │  │ Match    │ │ Match    │ │ Match    │           │
│  │Tabs │  │  │ Card 1   │ │ Card 2   │ │ Card 3   │           │
│  │     │  │  └──────────┘ └──────────┘ └──────────┘           │
│  ├─────┤  │                                                     │
│  │ Fav │  │  ┌──────────┐ ┌──────────┐                         │
│  │Team │  │  │ Match    │ │ Match    │                         │
│  │     │  │  │ Card 4   │ │ Card 5   │                         │
│  ├─────┤  │  └──────────┘ └──────────┘                         │
│  │Triv │  │                                                     │
│  │ia   │  │                                                     │
│  ├─────┤  │                                                     │
│  │Prode│  │                                                     │
│  └─────┘  │                                                     │
│           │                                                     │
├───────────┴─────────────────────────────────────────────────────┤
│  FOOTER (full-width)                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Cambios en HTML (`index.html`)

> **Los cambios en HTML son mínimos**. La estrategia principal es usar CSS Grid Areas para reubicar elementos existentes del DOM.

### Cambio 1: Agregar wrapper de sidebar al `<div class="app-container">`

Envolver la navegación en un wrapper de sidebar que solo será visible en desktop:

**ANTES (líneas 50-90 del index.html):**
```html
  <!-- SPA Container -->
  <div class="app-container">
    
    <!-- Premium Header -->
    <header class="app-header">
      ...
    </header>

    <!-- Navigation Bar -->
    <nav class="app-nav">
      ...
    </nav>

    <!-- Main Views Container -->
    <main class="app-main">
      ...
    </main>
    
    <!-- Premium Footer -->
    <footer class="app-footer">
      ...
    </footer>

  </div>
```

**DESPUÉS:**
```html
  <!-- SPA Container -->
  <div class="app-container">
    
    <!-- Premium Header -->
    <header class="app-header">
      ...
    </header>

    <!-- Desktop Sidebar (visible solo ≥1024px via CSS) -->
    <aside class="desktop-sidebar">
      
      <!-- Navigation Bar (se mueve visualmente al sidebar en desktop) -->
      <nav class="app-nav">
        ...
      </nav>

      <!-- Desktop Sidebar Widgets (contenido extra solo visible en desktop) -->
      <div class="sidebar-widgets">
        <div class="sidebar-widget sidebar-tournament-info">
          <div class="sidebar-widget-title">🏆 Torneo</div>
          <div class="sidebar-info-row">
            <span class="sidebar-info-label">Equipos</span>
            <span class="sidebar-info-value">48</span>
          </div>
          <div class="sidebar-info-row">
            <span class="sidebar-info-label">Partidos</span>
            <span class="sidebar-info-value">104</span>
          </div>
          <div class="sidebar-info-row">
            <span class="sidebar-info-label">Sedes</span>
            <span class="sidebar-info-value">16</span>
          </div>
          <div class="sidebar-info-row">
            <span class="sidebar-info-label">Países</span>
            <span class="sidebar-info-value">3</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Views Container -->
    <main class="app-main">
      ...
    </main>
    
    <!-- Premium Footer -->
    <footer class="app-footer">
      ...
    </footer>

  </div>
```

> **IMPORTANTE**: La `<nav class="app-nav">` se MUEVE DENTRO del `<aside class="desktop-sidebar">`. En mobile, el sidebar completo tiene `display: none` y la nav se renderizará con su propio estilo mobile. Ver sección CSS para cómo esto se logra sin romper mobile.

### Cambio 2: Re-estructurar la vista Hoy para desktop grid

En la sección `#view-hoy`, **mover** el `#fav-team-banner-container` y el `#trivia-container-wrapper` al sidebar. Para lograr esto SIN duplicar HTML, la solución es:

**Opción elegida**: Usar CSS Grid Areas en desktop para reubicar los hijos de `#view-hoy`. Los elementos `#fav-team-banner-container` y `#trivia-container-wrapper` se quedan dentro de `#view-hoy` en el HTML, pero en desktop se reubican visualmente. Como están dentro del `<main>`, no pueden moverse al sidebar con CSS puro.

**ALTERNATIVA IMPLEMENTABLE**: Dejar `#fav-team-banner-container` y `#trivia-container-wrapper` dentro de `#view-hoy` pero en desktop cambiarles el layout. El sidebar solo muestra la nav y el widget estático de info del torneo. El fav banner y trivia se muestran como panel derecho del main content.

**Layout desktop de view-hoy (dentro del main):**
```
┌──────────────────────────────────────────────────────────┐
│              PRODE STATS BANNER (full width)              │
├──────────────────────────────────────┬───────────────────┤
│  SECTION HEADER "Partidos de Hoy"    │                   │
├──────────────────────────────────────┤  FAV TEAM BANNER  │
│                                      │  (sticky sidebar) │
│  MATCHES LIST (grid 2-col)           │                   │
│  ┌────────────┐ ┌────────────┐      ├───────────────────┤
│  │ Match 1    │ │ Match 2    │      │                   │
│  └────────────┘ └────────────┘      │  TRIVIA CARD      │
│  ┌────────────┐ ┌────────────┐      │                   │
│  │ Match 3    │ │ Match 4    │      │                   │
│  └────────────┘ └────────────┘      │                   │
│                                      │                   │
├──────────────────────────────────────┴───────────────────┤
│  BTN TOGGLE CALENDAR (full width)                        │
└──────────────────────────────────────────────────────────┘
```

Este layout YA EXISTE parcialmente en el CSS actual (líneas 2362-2407). Lo vamos a mejorar y ajustar.

---

## 5. Cambios en CSS (`css/styles.css`)

### IMPORTANTE: Metodología de cambios

Todos los cambios van DENTRO de media queries `@media (min-width: 1024px)`. El bloque actual (líneas 2349-2433) se REEMPLAZA completamente con el nuevo código. También se agrega un bloque nuevo para estilos del sidebar y widgets que no existían.

Además, se agregan estilos base (fuera de media query) para los nuevos elementos HTML del sidebar, con `display: none` por defecto.

---

### BLOQUE A: Estilos base para el sidebar (AGREGAR al final del archivo, ANTES de los media queries)

```css
/* ==========================================================================
   DESKTOP SIDEBAR — Base Styles (hidden by default)
   ========================================================================== */
.desktop-sidebar {
  display: none; /* Solo visible en desktop ≥1024px */
}

.sidebar-widgets {
  display: none;
}

.sidebar-widget {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  padding: 16px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.sidebar-widget-title {
  font-family: 'Outfit', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-gold);
  margin-bottom: 12px;
  letter-spacing: 0.05em;
}

.sidebar-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.sidebar-info-row:last-child {
  border-bottom: none;
}

.sidebar-info-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.sidebar-info-value {
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}
```

---

### BLOQUE B: Animación de ambient glows (AGREGAR después del bloque A)

```css
/* ==========================================================================
   DESKTOP AMBIENT GLOW ANIMATIONS
   ========================================================================== */
@keyframes floatGlow1 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(3%, 5%) scale(1.05);
  }
  50% {
    transform: translate(-2%, 3%) scale(0.97);
  }
  75% {
    transform: translate(4%, -2%) scale(1.03);
  }
}

@keyframes floatGlow2 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-4%, -3%) scale(1.04);
  }
  66% {
    transform: translate(3%, 4%) scale(0.96);
  }
}
```

---

### BLOQUE C: Custom Scrollbar (AGREGAR después del bloque B)

```css
/* ==========================================================================
   CUSTOM SCROLLBAR (Desktop)
   ========================================================================== */
@media (min-width: 1024px) {
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: hsla(47, 90%, 53%, 0.2);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: hsla(47, 90%, 53%, 0.35);
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: hsla(47, 90%, 53%, 0.2) transparent;
  }
}
```

---

### BLOQUE D: REESCRITURA COMPLETA del media query `@media (min-width: 768px)`

**REEMPLAZAR** el bloque existente de `@media (min-width: 768px)` (líneas 1125-1150 Y 2283-2347) con:

```css
/* ==========================================================================
   RESPONSIVE: TABLET (768px - 1023px)
   ========================================================================== */
@media (min-width: 768px) and (max-width: 1023px) {
  body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: radial-gradient(circle at top, #0f162e 0%, #05070f 100%) !important;
  }

  .app-container {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    height: 100dvh;
    border: none;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    position: relative;
  }

  .app-container::before {
    display: none;
  }

  /* Nav arriba en tablet */
  .app-nav {
    order: 2;
    border-top: none;
    border-bottom: 1px solid var(--glass-border);
    padding: 8px 16px;
    background: rgba(10, 14, 26, 0.85);
    justify-content: center;
    gap: 16px;
  }

  .app-main {
    order: 3;
    padding-bottom: 32px;
  }

  .nav-tab {
    flex: none;
    flex-direction: row;
    gap: 8px;
    padding: 8px 20px;
    font-size: 0.88rem;
    border-radius: var(--border-radius-md);
  }

  .nav-tab .tab-icon {
    font-size: 1.1rem;
    margin-bottom: 0;
  }

  .nav-underline {
    top: 6px;
    bottom: 6px;
    border-radius: var(--border-radius-sm);
  }

  .groups-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .tables-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .tournament-stats-dashboard {
    grid-template-columns: repeat(4, 1fr);
  }

  .stat-item-box.full-width {
    grid-column: span 4;
  }

  .btn-simulator-trigger {
    bottom: 24px;
  }
}
```

> **NOTA**: El primer bloque `@media (min-width: 768px)` en líneas 1125-1150 (que hace body flex, app-container fullscreen, etc.) se convierte en `@media (min-width: 768px) and (max-width: 1023px)` para que NO afecte desktop.

---

### BLOQUE E: REESCRITURA COMPLETA del media query `@media (min-width: 1024px)`

**REEMPLAZAR** el bloque existente (líneas 1152-1161 Y 2349-2433) con este bloque completo:

```css
/* ==========================================================================
   RESPONSIVE: DESKTOP (≥1024px) — REDISEÑO COMPLETO
   ========================================================================== */
@media (min-width: 1024px) {

  /* --- BODY & BACKGROUND --- */
  body {
    background: #05070f !important;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .glow-bg-1 {
    width: 50vw;
    height: 50vw;
    top: -15%;
    left: -10%;
    animation: floatGlow1 20s ease-in-out infinite;
    opacity: 0.7;
  }

  .glow-bg-2 {
    width: 60vw;
    height: 60vw;
    bottom: -10%;
    right: -15%;
    animation: floatGlow2 25s ease-in-out infinite;
    opacity: 0.6;
  }

  /* --- APP CONTAINER: Full Viewport Grid --- */
  .app-container {
    max-width: 100%;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    border: none;
    border-radius: 0;
    box-shadow: none;
    display: grid;
    grid-template-columns: 260px 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "header  header"
      "sidebar main"
      "footer  footer";
    overflow: hidden;
  }

  /* --- HEADER --- */
  .app-header {
    grid-area: header;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    text-align: left;
    border-bottom: 1px solid var(--glass-border);
    background: rgba(10, 14, 26, 0.8);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    z-index: 20;
    flex-shrink: 0;
    gap: 24px;
    position: relative;
  }

  /* Línea decorativa dorada inferior del header */
  .app-header::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--accent-gold-glow) 20%,
      var(--accent-gold) 50%,
      var(--accent-gold-glow) 80%,
      transparent 100%
    );
    opacity: 0.5;
  }

  .header-top {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 0;
    flex: 1;
  }

  .host-badge {
    font-size: 0.75rem;
    white-space: nowrap;
    padding: 5px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 215, 0, 0.15);
  }

  .app-title {
    font-size: 1.6rem;
    letter-spacing: 2px;
    white-space: nowrap;
    margin-bottom: 0;
    filter: drop-shadow(0 0 20px rgba(245, 197, 24, 0.15));
  }

  .app-subtitle {
    font-size: 0.82rem;
    white-space: nowrap;
    margin-bottom: 0;
  }

  /* Header buttons - estilo mejorado para desktop */
  .btn-alerts-toggle,
  .btn-fav-toggle,
  .btn-sync-live {
    padding: 6px 14px;
    font-size: 0.78rem;
    border-radius: 10px;
    gap: 6px;
    transition: var(--transition-smooth);
  }

  .btn-alerts-toggle:hover,
  .btn-fav-toggle:hover,
  .btn-sync-live:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  /* --- DESKTOP SIDEBAR --- */
  .desktop-sidebar {
    grid-area: sidebar;
    display: flex;
    flex-direction: column;
    background: rgba(8, 11, 22, 0.9);
    border-right: 1px solid var(--glass-border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 15;
    padding: 0;
    position: relative;
  }

  /* Decoración derecha del sidebar */
  .desktop-sidebar::after {
    content: '';
    position: absolute;
    top: 0;
    right: -1px;
    bottom: 0;
    width: 1px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(255, 215, 0, 0.15) 30%,
      rgba(255, 215, 0, 0.08) 70%,
      transparent 100%
    );
  }

  /* SIDEBAR NAV: Vertical tabs */
  .desktop-sidebar .app-nav {
    order: unset;
    display: flex;
    flex-direction: column;
    padding: 20px 16px;
    background: transparent;
    border-top: none;
    border-bottom: 1px solid var(--glass-border);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    gap: 4px;
    position: relative;
  }

  .desktop-sidebar .nav-tab {
    flex: none;
    flex-direction: row;
    justify-content: flex-start;
    padding: 12px 16px;
    font-size: 0.88rem;
    font-weight: 500;
    border-radius: 12px;
    gap: 12px;
    color: var(--text-secondary);
    transition: var(--transition-smooth);
    position: relative;
  }

  .desktop-sidebar .nav-tab .tab-icon {
    font-size: 1.15rem;
    margin-bottom: 0;
    width: 24px;
    text-align: center;
  }

  .desktop-sidebar .nav-tab .tab-label {
    font-size: 0.88rem;
  }

  .desktop-sidebar .nav-tab:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  .desktop-sidebar .nav-tab.active {
    background: rgba(255, 215, 0, 0.08);
    color: var(--text-primary);
    font-weight: 600;
    border: 1px solid rgba(255, 215, 0, 0.15);
  }

  /* Ocultar la pill underline animada en el sidebar vertical */
  .desktop-sidebar .nav-underline {
    display: none;
  }

  /* SIDEBAR WIDGETS */
  .sidebar-widgets {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 16px;
    flex: 1;
  }

  .sidebar-tournament-info {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.04) 0%, rgba(10, 14, 26, 0.6) 100%);
    border-color: rgba(255, 215, 0, 0.1);
  }

  /* --- MAIN CONTENT --- */
  .app-main {
    grid-area: main;
    order: unset;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 28px 32px 40px;
    position: relative;
  }

  /* --- SECTION HEADERS (Desktop) --- */
  .section-header {
    margin-bottom: 24px;
  }

  .section-header h2 {
    font-size: 1.6rem;
  }

  .current-date-lbl {
    font-size: 0.88rem;
  }

  /* --- VIEW: HOY — Desktop Grid Layout --- */
  #view-hoy.active {
    display: grid;
    grid-template-columns: 1fr 320px;
    grid-template-areas:
      "prode    prode"
      "header   sidebar"
      "matches  sidebar"
      "calendar sidebar";
    gap: 20px 28px;
    align-items: start;
  }

  #prode-stats-banner {
    grid-area: prode;
  }

  #view-hoy > .section-header {
    grid-area: header;
    margin: 0;
  }

  #list-hoy {
    grid-area: matches;
    margin: 0;
    display: grid !important;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  /* En modo calendario (muchos partidos), forzar 2 columnas */
  #list-hoy .date-group-header {
    grid-column: span 2;
  }

  #fav-team-banner-container {
    grid-area: sidebar;
    position: sticky;
    top: 0;
    z-index: 5;
  }

  /* Trivia: ocultar en main, solo queda si no hay sidebar para eso */
  #trivia-container-wrapper {
    grid-area: unset;
    display: none; /* La trivia se mueve conceptualmente al sidebar widget */
  }

  #btn-toggle-cal {
    grid-area: calendar;
    margin: 0;
  }

  /* --- MATCH CARDS — Desktop Enhancements --- */
  .match-card {
    padding: 20px;
    border-radius: var(--border-radius-md);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .match-card:hover {
    transform: translateY(-3px) scale(1.01);
    border-color: rgba(255, 215, 0, 0.2);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 215, 0, 0.1);
    background: var(--bg-card-hover);
  }

  .match-card.live-card:hover {
    border-color: var(--accent-green);
    box-shadow: 0 8px 24px var(--accent-green-glow), 0 0 0 1px var(--accent-green);
  }

  .match-header {
    font-size: 0.78rem;
    margin-bottom: 14px;
  }

  .team-name-lbl {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .score-text {
    font-size: 1.9rem;
    letter-spacing: 5px;
  }

  .team-flag-img {
    width: 28px;
    height: 19px;
  }

  /* --- VIEW: GRUPOS — 3 Columns Grid --- */
  .groups-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .group-card {
    padding: 20px;
    transition: all 0.3s ease;
  }

  .group-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 215, 0, 0.15);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .group-card-header {
    font-size: 1.2rem;
  }

  .group-match-mini-row {
    font-size: 0.85rem;
    padding: 4px 0;
  }

  /* --- VIEW: TABLAS — 3 Columns Grid --- */
  .tables-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .standings-table-wrapper {
    padding: 18px 14px;
    transition: all 0.3s ease;
  }

  .standings-table-wrapper:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }

  .standings-table {
    font-size: 0.85rem;
  }

  .standings-table th {
    font-size: 0.78rem;
  }

  /* --- VIEW: ELIMINATORIAS — Centered Bracket --- */
  .bracket-outer {
    overflow-x: auto;
    display: flex;
    justify-content: center;
    padding-bottom: 20px;
  }

  .bracket-container {
    min-width: auto;
    width: 100%;
    max-width: 1100px;
    gap: 20px;
    justify-content: center;
    padding: 20px 0;
  }

  .bracket-column {
    justify-content: space-around;
  }

  .bracket-column-title {
    font-size: 0.85rem;
    padding: 6px 8px;
  }

  .bracket-match-node {
    width: 200px;
    padding: 12px;
    font-size: 0.82rem;
    margin: 8px 0;
    transition: all 0.3s ease;
  }

  .bracket-match-node:hover {
    border-color: rgba(255, 215, 0, 0.25);
    transform: scale(1.03);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .node-team-name {
    max-width: 130px;
  }

  /* --- TOURNAMENT STATS DASHBOARD --- */
  .tournament-stats-dashboard {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  .stat-item-box {
    padding: 16px;
    transition: all 0.3s ease;
  }

  .stat-item-box:hover {
    border-color: rgba(255, 255, 255, 0.12);
    background: var(--bg-card-hover);
    transform: translateY(-2px);
  }

  .stat-item-box.full-width {
    grid-column: span 4;
  }

  .stat-item-big-value {
    font-size: 1.6rem;
  }

  /* --- PRODE STATS BANNER (Desktop) --- */
  .prode-stats-banner {
    padding: 20px 24px;
    border-radius: var(--border-radius-lg);
  }

  .prode-stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  /* --- FAVORITE TEAM BANNER (Desktop Sidebar-Right Panel) --- */
  .fav-team-hero {
    padding: 24px;
    border-radius: var(--border-radius-lg);
  }

  .fav-team-info-name {
    font-size: 1.4rem;
  }

  .countdown-clock-wrapper {
    gap: 16px;
  }

  .countdown-card-flip {
    width: 52px;
    padding: 10px 8px;
  }

  .countdown-digit {
    font-size: 1.4rem;
  }

  /* --- FLOATING PRODE BUTTON (Desktop) --- */
  .btn-simulator-trigger {
    bottom: 28px;
    right: 32px;
    padding: 14px 28px;
    font-size: 0.9rem;
    border-radius: 16px;
  }

  .btn-simulator-trigger:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  /* --- FOOTER (Desktop) --- */
  .app-footer {
    grid-area: footer;
    padding: 20px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    margin-top: 0;
    border-top: 1px solid var(--glass-border);
    background: rgba(8, 11, 22, 0.6);
  }

  .app-footer p {
    margin-bottom: 0;
  }

  /* --- GROUP DROPDOWN (Desktop) --- */
  .group-dropdown {
    padding: 8px 16px;
    font-size: 0.85rem;
    border-radius: 10px;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .group-dropdown:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: var(--bg-card-hover);
  }

  /* --- TRIVIA CARD (Desktop Enhancement, when visible) --- */
  .trivia-card {
    padding: 20px;
  }

  .trivia-title {
    font-size: 1rem;
  }

  .trivia-text {
    font-size: 0.85rem;
  }

  /* --- CALENDAR TOGGLE BUTTON (Desktop) --- */
  .btn-toggle-calendar {
    padding: 16px;
    font-size: 0.95rem;
    border-radius: var(--border-radius-lg);
  }

  .btn-toggle-calendar:hover {
    background: rgba(255, 215, 0, 0.06);
    border-color: rgba(255, 215, 0, 0.2);
    color: var(--accent-gold);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(245, 197, 24, 0.1);
  }

  /* --- MODAL (Desktop sizing) --- */
  .fav-selector-modal {
    max-width: 520px;
    max-height: 70vh;
  }

  .fav-teams-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  /* --- PULL TO REFRESH: Hidden on desktop --- */
  .ptr-element {
    display: none !important;
  }
}
```

---

### BLOQUE F: Ultra-wide support (AGREGAR después del bloque E)

```css
/* ==========================================================================
   RESPONSIVE: ULTRA-WIDE (≥1600px)
   ========================================================================== */
@media (min-width: 1600px) {

  .app-container {
    grid-template-columns: 280px 1fr;
  }

  .app-main {
    padding: 32px 48px 40px;
  }

  #list-hoy {
    grid-template-columns: repeat(3, 1fr) !important;
  }

  #list-hoy .date-group-header {
    grid-column: span 3;
  }

  .groups-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .tables-container {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  #view-hoy.active {
    grid-template-columns: 1fr 360px;
  }

  .bracket-container {
    max-width: 1300px;
  }

  .bracket-match-node {
    width: 220px;
    font-size: 0.85rem;
  }
}
```

---

## 6. Corrección del bug CSS existente

En el archivo actual, líneas 762-764, hay un error de CSS que deja una regla `pointer-events: none;` suelta fuera del selector:

```css
/* ACTUAL (bug) — líneas 760-764 */
.btn-simulator-trigger.active .pulse-ring {
  display: block;
}
  pointer-events: none;  /* ← ESTO ESTÁ SUELTO, FUERA DEL SELECTOR */
}
```

**CORRECCIÓN:**
```css
.btn-simulator-trigger.active .pulse-ring {
  display: block;
  pointer-events: none;
}
```

---

## 7. Manejo del JS — Ajuste necesario para el nav underline

> **IMPORTANTE**: El JavaScript actual (`app.js`) calcula dinámicamente la posición del `.nav-underline` basándose en tabs horizontales. En desktop, el sidebar tiene tabs verticales y el underline se oculta con `display: none`. **No se necesita cambio en JS** porque el underline simplemente no se muestra.

Sin embargo, el JS posiciona el floating prode button con `position: absolute` relativo al `.app-container`. En el nuevo layout grid, el botón se queda fuera del viewport visible. La solución CSS es:

```css
/* Ya incluido en BLOQUE E: */
.btn-simulator-trigger {
  position: fixed;  /* Cambiar de absolute a fixed en desktop */
  bottom: 28px;
  right: 32px;
}
```

> **NOTA**: Verificar que el JS del botón Prode no setea `position: absolute` inline. Si lo hace, agregar `!important` al CSS.

---

## 8. Resumen de Cambios por Archivo

### `index.html`
| Cambio | Descripción |
|--------|-------------|
| Envolver `<nav>` en `<aside class="desktop-sidebar">` | Nuevo wrapper para sidebar desktop |
| Agregar `<div class="sidebar-widgets">` | Widget estático de info del torneo |
| Mover `<nav class="app-nav">` dentro del `<aside>` | Reubicación del nav |

### `css/styles.css`
| Cambio | Descripción |
|--------|-------------|
| AGREGAR estilos base sidebar | `.desktop-sidebar`, `.sidebar-widgets`, etc. (display:none por defecto) |
| AGREGAR animaciones glows | `@keyframes floatGlow1`, `floatGlow2` |
| AGREGAR custom scrollbar | Media query ≥1024px para scrollbar dorada |
| MODIFICAR `@media (min-width: 768px)` | Convertir a `(min-width: 768px) and (max-width: 1023px)` |
| REESCRIBIR `@media (min-width: 1024px)` | Layout grid completo, sidebar, tipografía, hover effects, grids multi-col |
| AGREGAR ultra-wide `@media (min-width: 1600px)` | 4-col grids, sidebar más ancho |
| CORREGIR bug línea 763 | `pointer-events: none` suelto |

### `js/app.js` — NO SE MODIFICA

### `js/data.js` — NO SE MODIFICA

### `js/utils.js` — NO SE MODIFICA

---

## 9. Checklist de Verificación Post-Implementación

### Resoluciones a probar
- [ ] **320px** (iPhone SE) — sin cambios, layout mobile intacto
- [ ] **375px** (iPhone) — sin cambios
- [ ] **768px** (iPad) — tablet layout con nav arriba, 2-col grids
- [ ] **1024px** (laptop) — NUEVO: sidebar visible, 3-col grids
- [ ] **1280px** (desktop) — NUEVO: sidebar + grids bien proporcionados
- [ ] **1440px** (HD desktop) — NUEVO: todo espaciado, legible
- [ ] **1920px** (Full HD) — NUEVO: ultra-wide con 4 cols

### Funcionalidad a verificar
- [ ] Tabs de navegación cambian vista correctamente
- [ ] El underline pill se oculta en desktop (no hay errores JS)
- [ ] Match cards renderizan bien en grid multi-columna
- [ ] Prode buttons (+/-) funcionan en los match cards
- [ ] Live match glow y progress bar se ven bien
- [ ] Equipo favorito banner funciona (seleccionar, mostrar countdown)
- [ ] Trivia rotativa funciona
- [ ] Stats dashboard muestra datos correctos
- [ ] Bracket de eliminatorias es navegable
- [ ] Pull to Refresh está oculto en desktop
- [ ] Modales se centran correctamente
- [ ] Floating Prode button es clickable y no se pierde
- [ ] Preloader funciona correctamente
- [ ] Confetti canvas se mantiene full-screen
- [ ] Sincronización de marcadores funciona
- [ ] PWA install button funciona si aplica
- [ ] Scrollbar custom dorada aparece en desktop

### Visual a verificar
- [ ] Ambient glow blobs se mueven suavemente
- [ ] Hover effects en match cards son fluidos
- [ ] Sidebar tiene glassmorphism y línea dorada decorativa
- [ ] Header tiene línea dorada gradiente inferior
- [ ] Footer se alinea horizontal en desktop
- [ ] Tipografía es más grande y legible en desktop
- [ ] No hay overflow horizontal en ninguna vista
- [ ] No hay contenido cortado o superpuesto

---

## 10. Notas de Implementación Críticas

> [!CAUTION]
> **NO mover el `<nav class="app-nav">` fuera del markup flow sin verificar que el JS sigue encontrándolo.** El JS hace `document.querySelectorAll('.nav-tab')` y `document.querySelector('.nav-underline')`. Mover el nav dentro de `<aside>` es seguro porque estas queries no dependen del padre.

> [!WARNING]
> **Los estilos del media query 768px deben limitarse a `max-width: 1023px`**. Si dejás `@media (min-width: 768px)` sin tope, las reglas de tablet pisarán las de desktop por especificidad (cascada CSS).

> [!IMPORTANT]
> **El `.app-container` actualmente tiene `display: flex; flex-direction: column;`** en su estilo base. En desktop, se sobrescribe a `display: grid`. Verificar que no hay conflicto con `order` properties que usaba el flex layout.

> [!TIP]
> **El `.btn-simulator-trigger` debe cambiar de `position: absolute` a `position: fixed`** en desktop porque al cambiar el container a grid, la referencia absoluta se pierde. El fixed lo anclará al viewport.
