# Rediseño UI Desktop — FIFA World Cup 2026 Fixture

Transformar la versión desktop (≥1024px) de una app mobile-first que actualmente se ve como un "teléfono grande centrado" en una experiencia desktop PROPIA: moderna, creativa y organizada.

> [!IMPORTANT]
> Todos los cambios aplican **exclusivamente al breakpoint `min-width: 1024px`**. La versión mobile queda intacta. No se toca lógica JS ni datos.

---

## Estado Actual vs. Propuesta

### Problemas del diseño desktop actual
1. **Layout mobile estirado**: `max-width: 1200px` con `height: 90vh` — todo el contenido está en una columna angosta centrada, desperdiciando espacio horizontal
2. **Header comprimido**: Los botones de acción (Alertas, Favorito, Sincronizar) están amontonados en una fila tiny
3. **Navegación genérica**: Tabs centrados simples sin jerarquía visual
4. **Vista "Hoy" con grid básico**: El grid `1.7fr 1.3fr` es un buen inicio pero los cards de partidos siguen siendo compactos como en mobile
5. **Footer genérico**: Sin aprovechamiento del espacio para info del torneo
6. **Bracket de eliminatorias**: Solo se ajusta el overflow pero no se rediseña para desktop

---

## Propuesta de Rediseño Desktop

### 1. Layout General — Full-Width con Sidebar

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (full-width, horizontal bar con branding + nav)  │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│ SIDEBAR  │              MAIN CONTENT AREA                │
│ (240px)  │         (fluid, multi-column grids)           │
│          │                                               │
│ • Nav    │  Depende del tab activo:                      │
│ • Fav    │  - Hoy: Grid 2-3 columnas de match cards     │
│ • Stats  │  - Grupos: Grid 3-4 cols de group cards      │
│ • Trivia │  - Llaves: Bracket horizontal completo       │
│          │  - Tablas: Grid 3-4 cols de standings         │
│          │                                               │
├──────────┴───────────────────────────────────────────────┤
│  FOOTER (full-width, minimal)                            │
└──────────────────────────────────────────────────────────┘
```

### 2. Header Redesign (Desktop)

- **Layout horizontal expandido**: Logo/título a la izquierda, badge de países al centro, botones de acción a la derecha
- **Glassmorphism mejorado**: Border bottom con gradiente dorado sutil, blur más intenso
- **Título más grande**: `2.2rem` con text-shadow glow sutil
- **Micro-animación**: El badge de países hosts tiene un shimmer sutil

### 3. Sidebar Vertical (Desktop Only, 240px)

**Concepto**: Panel lateral izquierdo con glassmorphism que contiene:
- **Navegación vertical** con iconos grandes + labels, indicador activo con pill animado
- **Widget de selección favorita** sticky (countdown, próximo partido)
- **Stats rápidas del torneo** (partidos jugados, goles promedio)
- **Card de trivia** rotativo
- **Botón de Prode** integrado

> [!NOTE]
> El sidebar se crea **solo con CSS**. Los elementos HTML ya existen en el DOM — los reposicionamos con `order`, `position`, y grid areas en el breakpoint desktop. La nav tabs, el fav-team-banner, la trivia card y el prode toggle ya están en el markup.

### 4. Main Content — Multi-Column Grids

#### Vista "Hoy"
- **Match cards en grid de 2 columnas** (en vez de lista vertical)
- Cards más anchos con más espacio para venue/hora
- Prode stats banner ocupa full-width arriba
- Botón "Ver Calendario" se transforma en link sutil

#### Vista "Grupos"
- **Grid de 4 columnas** (actualmente 3) para 12 grupos
- Group cards con más padding y hover effects mejorados
- Mini-match rows con tipografía más legible

#### Vista "Tablas"
- **Grid de 4 columnas** para 12 tablas de posiciones
- Tablas con rows más espaciados
- Highlight del equipo favorito en las tablas

#### Vista "Eliminatorias"
- **Bracket centrado sin scroll** horizontal
- Match nodes más grandes (220px vs 180px actual)
- Líneas conectoras entre rondas con SVG o borders
- La Final se destaca con un glow dorado especial

### 5. Efectos Visuales Premium Desktop

- **Ambient glow blobs**: Más grandes y con animación lenta de movimiento (float animation)
- **Card hover**: `scale(1.02)` + borde que transiciona a dorado + shadow elevation
- **Active tab**: Glow underline con box-shadow animado
- **Scrollbar custom**: Thin, dorada, con border-radius
- **Tooltip en botones del header**: Hover muestra label descriptivo

### 6. Tipografía Desktop

- Títulos principales: `2rem+` (actualmente están en tamaños mobile)
- Body text: `0.9rem` (actualmente `0.8rem`)
- Match card headers: `0.82rem` → `0.88rem`
- Score text: `1.6rem` → `2rem`

---

## Archivos Afectados

### [MODIFY] [styles.css](file:///e:/Webs%20Uber/Fixture/css/styles.css)

Cambios concentrados en los media queries `@media (min-width: 1024px)` (y ajustes al `768px` que sea necesario):

1. **Eliminar** el contenedor `max-width: 1200px` + `height: 90vh` que simula un teléfono
2. **Nuevo layout general**: `display: grid; grid-template: "header header" auto "sidebar main" 1fr "footer footer" auto / 260px 1fr`
3. **Sidebar desktop**: Mover la nav al sidebar, convertir tabs en botones verticales
4. **Match cards grid**: 2 columnas en Hoy, 4 en Grupos/Tablas
5. **Bracket mejorado**: Nodes más grandes, mejor spacing
6. **Tipografía escalada**: Tamaños mayores para desktop
7. **Hover effects mejorados**: Más pronunciados para mouse
8. **Ambient glows animados**: Float animation en desktop
9. **Custom scrollbar** global dorada
10. **Prode button**: Integrado al sidebar en vez de floating

### [MODIFY] [index.html](file:///e:/Webs%20Uber/Fixture/index.html)

Cambios mínimos y no destructivos:
- Agregar un `<div class="desktop-sidebar">` wrapper (visible solo en desktop via CSS)
- Posiblemente mover/duplicar visualmente el nav y widgets al sidebar (con CSS `display: contents` + grid areas)

> [!WARNING]
> La estructura HTML tiene que mantener la funcionalidad mobile 100% intacta. El sidebar se logra principalmente con CSS grid areas reasignando los mismos elementos del DOM a posiciones diferentes en desktop.

---

## Open Questions

> [!IMPORTANT]
> **¿Querés sidebar siempre visible o colapsable?**  
> Mi propuesta es sidebar siempre visible en desktop (≥1024px). Si preferís que sea colapsable con un toggle, implica agregar JS para el toggle. Recomiendo siempre visible para desktop.

> [!IMPORTANT]
> **¿El banner del equipo favorito va en el sidebar o en el main content?**
> Mi propuesta es moverlo al sidebar para desktop (sticky), y que el main content tenga solo los partidos. Alternativa: dejarlo arriba del main content como está ahora.

> [!IMPORTANT]
> **¿Querés que la Trivia quede en el sidebar o siga en el main?**  
> Recomiendo sidebar: queda como contenido complementario siempre visible, no interrumpe el flujo de partidos.

---

## Verification Plan

### Manual Verification
- Abrir en Chrome DevTools a resoluciones: 1024px, 1280px, 1440px, 1920px
- Verificar que mobile (≤767px) y tablet (768-1023px) NO cambian
- Verificar que todas las tabs funcionan correctamente en el nuevo layout
- Verificar hover effects, animations y transitions
- Verificar que el sidebar scroll y los match cards se ven bien en todas las vistas
