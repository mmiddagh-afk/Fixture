# 🔍 Análisis: Por qué no se actualizan los partidos pasados

## Diagnóstico

Hay **3 problemas distintos** que se combinan para que los datos de partidos pasados no se actualicen. Te los explico de más grave a menos grave.

---

## Problema 1 (CRÍTICO): La API NO devuelve resultados

> [!CAUTION]
> La API configurada (`thestatsapi.com/world-cup/data/fixtures.json`) **NO contiene** campos de `status`, `homeScore`, `awayScore`, ni `minute`. Es un JSON estático con solo datos de fixture (fecha, hora, equipos, estadio).

**Evidencia:** Revisé la respuesta real del endpoint. Los objetos de la API lucen así:

```json
{
  "matchNumber": 1,
  "date": "2026-06-11",
  "kickoffUtc": "2026-06-11T19:00:00Z",
  "stage": "group-stage",
  "group": "A",
  "homeTeam": "Mexico",
  "awayTeam": "South Africa",
  "stadium": "Estadio Azteca",
  "hostCity": "mexico-city"
}
```

No hay **ningún campo** de:
- `status` (live/finished)
- `homeScore` / `awayScore`
- `minute`

Esto significa que `syncLiveMatches()` en `app.js:122-151` **NUNCA va a actualizar nada** porque la condición en línea 128 evalúa `liveMatch.status === 'live' || liveMatch.status === 'finished'`, y `liveMatch.status` es **siempre `undefined`**.

---

## Problema 2 (GRAVE): Los IDs no coinciden entre data.js y la API

Incluso si la API devolviera scores, el matching fallaría por desincronización de IDs:

| data.js (local) | API (`matchNumber`) | Partido |
|---|---|---|
| `id: 5` | `matchNumber: 8` | QAT vs SUI |
| `id: 6` | `matchNumber: 7` | BRA vs MAR |
| `id: 7` | `matchNumber: 5` | HAI vs SCO |
| `id: 8` | `matchNumber: 6` | AUS vs TUR |
| `id: 9` | `matchNumber: 10` | GER vs CUW |
| `id: 10` | `matchNumber: 11` | NED vs JPN |
| `id: 12` | `matchNumber: 9` | CIV vs ECU |

El matching en `app.js:126` usa:
```js
const liveMatch = liveMatches.find(lm => (lm.id === match.id) || (lm.matchNumber === match.id));
```

Al comparar `matchNumber` con `id`, muchos partidos se emparejan con el partido EQUIVOCADO, lo que produciría datos corruptos.

---

## Problema 3 (MODERADO): No hay polling automático

En `app.js:1818-1830`, la sincronización se dispara:
1. **Una sola vez** al cargar la página (con `setTimeout(fetchLiveScores, 1500)`)
2. **Manualmente** al presionar el botón "Sincronizar"

No hay **ningún `setInterval`** para polling periódico. Así que incluso con una API funcional, la app nunca actualizaría sola — solo cuando el usuario refresca la página o pulsa sync.

---

## Problema 4 (MENOR): El único source of truth es el hardcode en data.js

Los únicos partidos con resultado son los que tienen `"finished"` hardcodeado directamente en `data.js:99-112`:

```js
m(1, "group", "A", "2026-06-11", "15:00", "MEX", "RSA", "...", "finished", 2, 0),
m(2, "group", "A", "2026-06-11", "22:00", "KOR", "CZE", "...", "finished", 2, 1),
// ... solo hasta el partido 8
```

Partidos del 9 en adelante **no tienen resultado** porque nadie los actualizó manualmente en el código fuente. El merge de `initMatches()` en `app.js:57-62` SÍ funciona correctamente para forzar datos oficiales... pero solo cuando el desarrollador actualiza `data.js` a mano.

---

## Resumen del flujo actual (roto)

```
App se carga
  ├── initMatches: merge localStorage + data.js
  │     ├── IDs 1-8 (finished en data.js) → Se muestran con score ✅
  │     └── IDs 9+  (upcoming en data.js) → Se muestran como upcoming ❌
  │
  └── fetchLiveScores → API
        └── ¿API devuelve status/score? → NO, jamás → syncLiveMatches no actualiza nada ❌
```

---

## Solución elegida: Panel Admin (localStorage)

Se eligió la opción de un **Panel Admin dentro de la app** que permite actualizar scores directamente desde la UI, sin tocar código. Los datos se persisten en localStorage y el merge existente de `initMatches` los preserva.

---

# 🛠️ Plan de Implementación: Panel Admin

## Objetivo
Agregar un modo administrador oculto dentro de la app que permita actualizar scores y status de partidos sin tocar código. Los datos se persisten en localStorage y el merge existente de `initMatches` los preserva.

## Diseño UX

### Activación (gesto secreto)
- **5 taps rápidos en el título "MUNDIAL 2026"** del header activan el modo admin
- Al activarse, aparece un badge dorado `🔑 ADMIN` junto al título
- Un segundo ciclo de 5 taps desactiva el modo

### Panel Admin
- Modal fullscreen (reusa el patrón CSS de `.fav-selector-modal`)
- Se abre al tocar el badge `🔑 ADMIN`
- Lista todos los partidos agrupados por fecha, ordenados cronológicamente
- Cada partido muestra:
  - Banderas + nombres de equipos
  - Controles **+/-** para score local y visitante (reutiliza patrón de `btn-score-adjust`)
  - Toggle de 3 estados: `upcoming` → `live` → `finished` (tap para ciclar)
  - Campo de minuto (solo visible cuando `live`)
- Botón "Guardar y Cerrar" persiste todos los cambios a `state.matches` + `saveState()`
- Botón "Reset Partido" para devolver un partido a su estado original de `data.js`

### Flujo de datos
```
Admin edita score → state.matches actualizado → saveState() → localStorage
                                                                    ↓
Próximo load → initMatches() → merge desde savedMatch → score preservado ✅
(porque officialMatch.status !== 'finished', no se sobreescribe)
```

> [!IMPORTANT]
> Si después actualizás manualmente `data.js` marcando un partido como `finished` con score, ese dato OFICIAL tendrá prioridad sobre el admin (líneas 57-62 de app.js). Esto es correcto y deseable — el admin es para datos provisorios, `data.js` es la verdad oficial.

---

## Cambios Propuestos

### UI Layer

#### [MODIFY] index.html
- Agregar el modal admin después de los otros modales (línea ~270)
- Estructura: header con título + close, body con lista scrolleable de partidos, footer con "Guardar y Cerrar"

---

### Styling

#### [MODIFY] css/styles.css
- Agregar estilos del panel admin al final del archivo (antes del media query de desktop)
- Clases nuevas: `.admin-badge`, `.admin-match-row`, `.admin-score-controls`, `.admin-status-toggle`
- Reutilizar tokens existentes (`--bg-card`, `--glass-border`, `--accent-gold`, etc.)

---

### Logic

#### [MODIFY] js/app.js
- **Estado admin**: `state.adminMode = false`
- **Gesto secreto**: listener en `.app-title` que cuenta taps (reset si pasan >800ms entre taps)
- **Render admin panel**: función `renderAdminMatchList()` que genera la lista de partidos editables
- **Handlers**: `adjustAdminScore()`, `cycleAdminStatus()`, `saveAdminChanges()`, `resetAdminMatch()`
- **Integración**: al guardar, llama `updateKnockoutTeams()` + `renderActiveTab()` para refrescar todo

---

## Plan de Verificación

### Verificación Manual
1. Abrir la app → confirmar que no hay indicios del modo admin
2. Tap 5x en "MUNDIAL 2026" → confirmar que aparece badge `🔑 ADMIN`
3. Tocar badge → confirmar que se abre el panel con todos los partidos
4. Editar score de un partido upcoming → guardar → confirmar que se refleja en "Hoy" y en "Tablas"
5. Cerrar la app y volver a abrirla → confirmar que los scores editados persisten
6. Confirmar que los partidos oficiales (1-8, ya `finished` en data.js) NO se pueden editar desde admin (lock visual)
