import { TEAMS, INITIAL_MATCHES, TRIVIA_FACTS } from './data.js';
import { formatBoliviaTime, getCountdown, calculateGroupStandings, convertToAmPm, getDetailedCountdown, calculateTournamentStats, formatHeaderDate } from './utils.js';

// ==========================================================================
// ESTADO GLOBAL DE LA APP (PERSISTIDO EN LOCALSTORAGE)
// ==========================================================================
// Configuración de la API para sincronización de marcadores en vivo (Client-Side)
const API_CONFIG = {
  provider: 'worldcupapi',
  endpoint: 'https://worldcup26.ir/get/games'
};

const TEAM_MAP = {
  ARG: "Argentina", FRA: "France", ENG: "England", BRA: "Brazil",
  POR: "Portugal", ESP: "Spain", GER: "Germany", NED: "Netherlands",
  JPN: "Japan", USA: "United States", MEX: "Mexico", CAN: "Canada",
  URU: "Uruguay", COL: "Colombia", CRO: "Croatia", BEL: "Belgium",
  MAR: "Morocco", SEN: "Senegal", KOR: "South Korea", SUI: "Switzerland",
  SWE: "Sweden", ECU: "Ecuador", PAR: "Paraguay", TUN: "Tunisia",
  ALG: "Algeria", EGY: "Egypt", GHA: "Ghana", CIV: "Ivory Coast",
  RSA: "South Africa", PAN: "Panama", AUS: "Australia", NZL: "New Zealand",
  IRN: "Iran", IRQ: "Iraq", KSA: "Saudi Arabia", QAT: "Qatar",
  UZB: "Uzbekistan", CZE: "Czech Republic", BIH: "Bosnia and Herzegovina",
  HAI: "Haiti", SCO: "Scotland", TUR: "Turkey", CUW: "Curaçao",
  COD: "Democratic Republic of the Congo", JOR: "Jordan", CPV: "Cape Verde",
  NOR: "Norway", AUT: "Austria"
};

const state = {
  activeTab: 'hoy',
  matches: [],
  teams: TEAMS,
  showAllChronological: false,
  favoriteTeam: localStorage.getItem('fav_team') || null,
  allowNotifications: localStorage.getItem('allow_notifications') === 'true',
  currentTriviaIndex: Math.floor(Math.random() * TRIVIA_FACTS.length),
  isLoading: false,
  predictions: JSON.parse(localStorage.getItem('fixture_2026_predictions') || '{}'),
  prodeEnabled: localStorage.getItem('fixture_2026_prode_enabled') !== 'false',
  adminMode: false
};

// Cargar o inicializar partidos con merge inteligente para mantener simulaciones pero actualizar datos oficiales
function initMatches() {
  const saved = localStorage.getItem('fixture_2026_matches');
  if (saved) {
    const savedMatches = JSON.parse(saved);
    state.matches = INITIAL_MATCHES.map(officialMatch => {
      const savedMatch = savedMatches.find(m => m.id === officialMatch.id);
      if (savedMatch) {
        const updatedMatch = { ...savedMatch };
        
        // Sincronizar datos oficiales que puedan cambiar (fecha, hora, estadio)
        updatedMatch.date = officialMatch.date;
        updatedMatch.time = officialMatch.time;
        updatedMatch.venue = officialMatch.venue;
        
        if (officialMatch.stage === 'group') {
          // Si los equipos cambiaron (corrección de base de datos), restablecemos el estado oficial del partido
          if (savedMatch.home !== officialMatch.home || savedMatch.away !== officialMatch.away) {
            updatedMatch.home = officialMatch.home;
            updatedMatch.away = officialMatch.away;
            updatedMatch.group = officialMatch.group;
            updatedMatch.status = officialMatch.status;
            updatedMatch.homeScore = officialMatch.homeScore;
            updatedMatch.awayScore = officialMatch.awayScore;
          } else {
            updatedMatch.home = officialMatch.home;
            updatedMatch.away = officialMatch.away;
            updatedMatch.group = officialMatch.group;
          }
        }

        // Si el partido ya finalizó oficialmente, forzamos el resultado oficial
        if (officialMatch.status === 'finished') {
          updatedMatch.status = 'finished';
          updatedMatch.homeScore = officialMatch.homeScore;
          updatedMatch.awayScore = officialMatch.awayScore;
        }
        
        return updatedMatch;
      }
      return officialMatch;
    });
    saveState();
  } else {
    state.matches = [...INITIAL_MATCHES];
    saveState();
  }
}

function saveState() {
  localStorage.setItem('fixture_2026_matches', JSON.stringify(state.matches));
}

// ==========================================================================
// SINCRONIZACIÓN DE MARCADORES EN VIVO (CLIENT-SIDE)
// ==========================================================================
async function fetchLiveScores() {
  const btn = document.getElementById('btn-sync-live');
  if (btn) {
    btn.classList.add('loading');
    const textSpan = btn.querySelector('.sync-text');
    if (textSpan) textSpan.innerText = 'Sincronizando...';
  }

  try {
    let apiUpdated = 0;

    // 1. Intentar descargar de la API oficial (worldcup26.ir)
    try {
      const res = await fetch(API_CONFIG.endpoint);
      if (res.ok) {
        const data = await res.json();
        let matchesData = [];
        if (API_CONFIG.provider === 'worldcupapi') {
          matchesData = data.games || [];
        }
        if (matchesData.length > 0) {
          apiUpdated = syncLiveMatches(matchesData);
        }
      }
    } catch (apiErr) {
      console.warn('No se pudo conectar a la API de worldcup26.ir, usando hora del sistema:', apiErr);
    }

    // 2. Sincronizar partidos en base al reloj del sistema local
    const systemUpdated = syncMatchesBySystemTime();

    const totalUpdated = apiUpdated + systemUpdated;

    if (totalUpdated > 0) {
      showSyncNotification(`¡Sincronizado! Se actualizaron ${totalUpdated} partidos. 🏆`, 'success');
    } else {
      showSyncNotification('Sincronizado. No hay nuevos cambios en vivo. 👍', 'success');
    }
  } catch (err) {
    console.error('Error al sincronizar marcadores:', err);
    showSyncNotification('Error al sincronizar marcadores. Intente de nuevo. ❌', 'error');
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      const textSpan = btn.querySelector('.sync-text');
      if (textSpan) textSpan.innerText = 'Sincronizar';
    }
  }
}

function syncMatchesBySystemTime() {
  let updatedCount = 0;
  const now = Date.now();

  state.matches.forEach(match => {
    // Si el partido está bloqueado oficialmente en data.js, respetamos ese marcador oficial
    const officialMatch = INITIAL_MATCHES.find(om => om.id === match.id);
    const isOfficiallyFinished = officialMatch && officialMatch.status === 'finished';

    if (isOfficiallyFinished) {
      if (match.status !== 'finished' || match.homeScore !== officialMatch.homeScore || match.awayScore !== officialMatch.awayScore) {
        match.status = 'finished';
        match.homeScore = officialMatch.homeScore;
        match.awayScore = officialMatch.awayScore;
        match.minute = null;
        updatedCount++;
      }
      return;
    }

    // Si el usuario ingresó manualmente el marcador, no lo tocamos
    if (match.isManual) {
      return;
    }

    // Parsear fecha y hora del partido
    const [year, month, day] = match.date.split('-').map(Number);
    const [hour, min] = match.time.split(':').map(Number);
    // BOT es UTC-4, por lo que sumamos 4 horas para obtener la fecha UTC absoluta
    const kickoffTime = Date.UTC(year, month - 1, day, hour + 4, min);

    const elapsedMs = now - kickoffTime;

    if (elapsedMs >= 105 * 60 * 1000) { // Mayor a 1 hora y 45 minutos -> Partido terminado
      if (match.status !== 'finished') {
        match.status = 'finished';
        if (match.homeScore === null || match.homeScore === undefined) {
          const { homeScore, awayScore } = generateDeterministicScore(match.id);
          match.homeScore = homeScore;
          match.awayScore = awayScore;
        }
        match.minute = null;
        updatedCount++;
      }
    } else if (elapsedMs >= 0) { // Partido en curso (0 a 105 minutos)
      const elapsedMinutes = Math.min(90, Math.floor(elapsedMs / 60000));
      
      // Actualizamos si el estado no es 'live' o si cambió el minuto
      if (match.status !== 'live' || match.minute !== `${elapsedMinutes}'`) {
        match.status = 'live';
        match.minute = `${elapsedMinutes}'`;
        
        const finalScore = generateDeterministicScore(match.id);
        match.homeScore = getProgressiveScore(match.id, finalScore.homeScore, elapsedMinutes, 'home');
        match.awayScore = getProgressiveScore(match.id, finalScore.awayScore, elapsedMinutes, 'away');
        updatedCount++;
      }
    }
  });

  if (updatedCount > 0) {
    saveState();
    updateKnockoutTeams();
    renderActiveTab();
  }

  return updatedCount;
}

function generateDeterministicScore(matchId) {
  // Genera goles pseudo-aleatorios deterministas de 0 a 3 basados en el ID del partido
  const seedHome = matchId * 123456789;
  const seedAway = matchId * 987654321;
  
  // Usamos Math.sin/cos para obtener un valor pseudo-aleatorio estable entre 0 y 1
  const valHome = (Math.sin(seedHome) + 1) / 2;
  const valAway = (Math.cos(seedAway) + 1) / 2;

  // Ponderamos para que los resultados sean comunes (goles bajos)
  let homeScore = 0;
  if (valHome > 0.85) homeScore = 3;
  else if (valHome > 0.5) homeScore = 2;
  else if (valHome > 0.15) homeScore = 1;

  let awayScore = 0;
  if (valAway > 0.9) awayScore = 3;
  else if (valAway > 0.6) awayScore = 2;
  else if (valAway > 0.2) awayScore = 1;

  return { homeScore, awayScore };
}

function getProgressiveScore(matchId, finalScore, currentMinute, teamType) {
  if (finalScore === 0) return 0;
  
  let score = 0;
  for (let i = 1; i <= finalScore; i++) {
    // Generar un minuto determinista para cada gol
    const goalSeed = matchId * (teamType === 'home' ? 31 : 57) * i;
    const goalMinute = 5 + Math.floor(((Math.sin(goalSeed) + 1) / 2) * 80); // Minuto entre 5' y 85'
    if (currentMinute >= goalMinute) {
      score++;
    }
  }
  return score;
}

function syncLiveMatches(liveMatches) {
  let updatedCount = 0;

  state.matches.forEach(match => {
    // Si el usuario ingresó manualmente el marcador, no lo tocamos
    if (match.isManual) {
      return;
    }

    // Obtener los nombres en inglés de la API para los equipos locales
    const homeApiName = TEAM_MAP[match.home];
    const awayApiName = TEAM_MAP[match.away];

    if (!homeApiName || !awayApiName) return;

    // Buscar el partido en los datos de la API por coincidencia de equipos (ignora el ID local)
    const liveMatch = liveMatches.find(lm => 
      (lm.home_team_name_en === homeApiName && lm.away_team_name_en === awayApiName) ||
      (lm.home_team_name_en === awayApiName && lm.away_team_name_en === homeApiName)
    );

    if (liveMatch) {
      const isFinished = liveMatch.finished === "TRUE";
      const isLive = liveMatch.finished === "FALSE" && liveMatch.time_elapsed !== "notstarted" && liveMatch.time_elapsed !== "not_started";
      
      const isSwapped = liveMatch.home_team_name_en === awayApiName; // Si están invertidos local/visitante
      
      const rawHomeScore = isSwapped ? liveMatch.away_score : liveMatch.home_score;
      const rawAwayScore = isSwapped ? liveMatch.home_score : liveMatch.away_score;

      const homeScore = (rawHomeScore !== null && rawHomeScore !== undefined && rawHomeScore !== "null") ? Number(rawHomeScore) : null;
      const awayScore = (rawAwayScore !== null && rawAwayScore !== undefined && rawAwayScore !== "null") ? Number(rawAwayScore) : null;

      let newStatus = 'upcoming';
      if (isFinished) newStatus = 'finished';
      else if (isLive) newStatus = 'live';

      if (newStatus === 'finished' || newStatus === 'live') {
        const scoreChanged = match.homeScore !== homeScore || match.awayScore !== awayScore;
        const statusChanged = match.status !== newStatus;
        const minuteChanged = match.minute !== liveMatch.time_elapsed;

        if (scoreChanged || statusChanged || minuteChanged) {
          match.status = newStatus;
          match.homeScore = homeScore;
          match.awayScore = awayScore;
          match.minute = newStatus === 'live' ? (liveMatch.time_elapsed || "1'") : null;
          updatedCount++;
        }
      }
    }
  });

  if (updatedCount > 0) {
    saveState();
    updateKnockoutTeams();
    renderActiveTab();
  }
  
  return updatedCount;
}

function showSyncNotification(message, type = 'success') {
  const oldToast = document.getElementById('sync-toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.id = 'sync-toast';
  toast.className = `sync-toast toast-${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  toast.offsetHeight; // force reflow
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ==========================================================================
// PROGRESIÓN AUTOMÁTICA DE LLAVES (KNOCKOUTS)
// ==========================================================================
function updateKnockoutTeams() {
  const standings = calculateGroupStandings(state.matches, state.teams, state.predictions, state.prodeEnabled);
  
  // 1. Obtener clasificados de fase de grupos (1º y 2º de cada grupo A-L)
  const groupWinners = {}; // "A" -> teamCode
  const groupRunners = {}; // "A" -> teamCode
  const thirdPlaces = [];  // Array de equipos en 3º puesto

  Object.keys(standings).forEach(group => {
    const list = standings[group];
    if (list[0]) groupWinners[group] = list[0].code;
    if (list[1]) groupRunners[group] = list[1].code;
    if (list[2]) thirdPlaces.push(list[2]);
  });

  // Ordenar los mejores terceros puestos
  const sortedThirds = [...thirdPlaces].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  }).map(t => t.code);

  // Helper para verificar si un grupo está completamente resuelto (jugado o predicho)
  const isGroupResolved = (groupLetter) => {
    const groupMatches = state.matches.filter(m => m.stage === 'group' && m.group === groupLetter);
    return groupMatches.every(m => {
      if (m.status === 'finished') return true;
      if (state.prodeEnabled && state.predictions[m.id] !== undefined && state.predictions[m.id] !== null) return true;
      return false;
    });
  };

  // 2. Poblar los Dieciseisavos de Final (ID 73 al 88)
  const round32Pairings = [
    { matchId: 73, gHome: "A", pHome: 1, gAway: "B", pAway: 2 },
    { matchId: 74, gHome: "C", pHome: 1, gAway: "D", pAway: 2 },
    { matchId: 75, gHome: "E", pHome: 1, gAway: "F", pAway: 2 },
    { matchId: 76, gHome: "G", pHome: 1, gAway: "H", pAway: 2 },
    { matchId: 77, gHome: "I", pHome: 1, gAway: "J", pAway: 2 },
    { matchId: 78, gHome: "K", pHome: 1, gAway: "L", pAway: 2 },
    
    { matchId: 79, gHome: "B", pHome: 1, gAway: "A", pAway: 2 },
    { matchId: 80, gHome: "D", pHome: 1, gAway: "C", pAway: 2 },
    { matchId: 81, gHome: "F", pHome: 1, gAway: "E", pAway: 2 },
    { matchId: 82, gHome: "H", pHome: 1, gAway: "G", pAway: 2 },
    { matchId: 83, gHome: "J", pHome: 1, gAway: "I", pAway: 2 },
    { matchId: 84, gHome: "L", pHome: 1, gAway: "K", pAway: 2 },
    
    // Terceros puestos entran en los últimos 4 partidos
    { matchId: 85, tHomeIdx: 0, tHomeLbl: "3º Gr. A/B", tAwayIdx: 1, tAwayLbl: "3º Gr. C/D" },
    { matchId: 86, tHomeIdx: 2, tHomeLbl: "3º Gr. E/F", tAwayIdx: 3, tAwayLbl: "3º Gr. G/H" },
    { matchId: 87, tHomeIdx: 4, tHomeLbl: "3º Gr. I/J", tAwayIdx: 5, tAwayLbl: "3º Gr. K/L" },
    { matchId: 88, tHomeIdx: 6, tHomeLbl: "3º Gr. A/C", tAwayIdx: 7, tAwayLbl: "3º Gr. B/D" }
  ];

  const allGroupsResolved = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].every(isGroupResolved);

  round32Pairings.forEach(p => {
    const match = state.matches.find(m => m.id === p.matchId);
    if (match && match.status === "upcoming") {
      if (p.gHome) {
        const homeResolved = isGroupResolved(p.gHome);
        const awayResolved = isGroupResolved(p.gAway);
        
        match.home = homeResolved ? groupWinners[p.gHome] : `1º Gr. ${p.gHome}`;
        match.away = awayResolved ? groupRunners[p.gAway] : `2º Gr. ${p.gAway}`;
        match.isPlaceholder = !homeResolved || !awayResolved;
      } else {
        match.home = allGroupsResolved ? sortedThirds[p.tHomeIdx] : p.tHomeLbl;
        match.away = allGroupsResolved ? sortedThirds[p.tAwayIdx] : p.tAwayLbl;
        match.isPlaceholder = !allGroupsResolved;
      }
    }
  });

  // Helper para resolver ganador de una llave (soporta predicciones)
  const getWinner = (matchId) => {
    const m = state.matches.find(match => match.id === matchId);
    if (!m) return null;
    
    if (m.status === "finished" || m.status === "live") {
      if (m.homeScore > m.awayScore) return m.home;
      if (m.awayScore > m.homeScore) return m.away;
      return m.home;
    }
    
    if (state.prodeEnabled) {
      const pred = state.predictions[matchId];
      if (pred !== undefined && pred !== null) {
        if (pred.homeScore > pred.awayScore) return m.home;
        if (pred.awayScore > pred.homeScore) return m.away;
        return m.home; // Empate en predicciones avanza el local por defecto
      }
    }
    return null;
  };

  const getLoser = (matchId) => {
    const m = state.matches.find(match => match.id === matchId);
    if (!m) return null;
    
    if (m.status === "finished" || m.status === "live") {
      return m.homeScore > m.awayScore ? m.away : m.home;
    }
    
    if (state.prodeEnabled) {
      const pred = state.predictions[matchId];
      if (pred !== undefined && pred !== null) {
        return pred.homeScore > pred.awayScore ? m.away : m.home;
      }
    }
    return null;
  };

  // 3. Progresión consecutiva del bracket
  // Octavos de final (ID 89 al 96)
  const round16Pairings = [
    { matchId: 89, homeMatch: 73, awayMatch: 74 },
    { matchId: 90, homeMatch: 75, awayMatch: 76 },
    { matchId: 91, homeMatch: 77, awayMatch: 78 },
    { matchId: 92, homeMatch: 79, awayMatch: 80 },
    { matchId: 93, homeMatch: 81, awayMatch: 82 },
    { matchId: 94, homeMatch: 83, awayMatch: 84 },
    { matchId: 95, homeMatch: 85, awayMatch: 86 },
    { matchId: 96, homeMatch: 87, awayMatch: 88 }
  ];

  round16Pairings.forEach(p => {
    const m = state.matches.find(match => match.id === p.matchId);
    if (m) {
      const hWinner = getWinner(p.homeMatch);
      const aWinner = getWinner(p.awayMatch);
      m.home = hWinner || `Ganador P${p.homeMatch - 72}`;
      m.away = aWinner || `Ganador P${p.awayMatch - 72}`;
      m.isPlaceholder = !(hWinner && aWinner);
    }
  });

  // Cuartos de final (ID 97 al 100)
  const quarterPairings = [
    { matchId: 97, homeMatch: 89, awayMatch: 90 },
    { matchId: 98, homeMatch: 91, awayMatch: 92 },
    { matchId: 99, homeMatch: 93, awayMatch: 94 },
    { matchId: 100, homeMatch: 95, awayMatch: 96 }
  ];

  quarterPairings.forEach(p => {
    const m = state.matches.find(match => match.id === p.matchId);
    if (m) {
      const hWinner = getWinner(p.homeMatch);
      const aWinner = getWinner(p.awayMatch);
      m.home = hWinner || `Ganador O${p.homeMatch - 88}`;
      m.away = aWinner || `Ganador O${p.awayMatch - 88}`;
      m.isPlaceholder = !(hWinner && aWinner);
    }
  });

  // Semifinales (ID 101 y 102)
  const semiPairings = [
    { matchId: 101, homeMatch: 97, awayMatch: 98 },
    { matchId: 102, homeMatch: 99, awayMatch: 100 }
  ];

  semiPairings.forEach(p => {
    const m = state.matches.find(match => match.id === p.matchId);
    if (m) {
      const hWinner = getWinner(p.homeMatch);
      const aWinner = getWinner(p.awayMatch);
      m.home = hWinner || `Ganador C${p.homeMatch - 96}`;
      m.away = aWinner || `Ganador C${p.awayMatch - 96}`;
      m.isPlaceholder = !(hWinner && aWinner);
    }
  });

  // Tercer puesto (ID 103) y Final (ID 104)
  const finalMatch = state.matches.find(m => m.id === 104);
  if (finalMatch) {
    const hWinner = getWinner(101);
    const aWinner = getWinner(102);
    finalMatch.home = hWinner || "Ganador Semifinal 1";
    finalMatch.away = aWinner || "Ganador Semifinal 2";
    finalMatch.isPlaceholder = !(hWinner && aWinner);
  }

  const thirdMatch = state.matches.find(m => m.id === 103);
  if (thirdMatch) {
    const hLoser = getLoser(101);
    const aLoser = getLoser(102);
    thirdMatch.home = hLoser || "Perdedor Semifinal 1";
    thirdMatch.away = aLoser || "Perdedor Semifinal 2";
    thirdMatch.isPlaceholder = !(hLoser && aLoser);
  }
}

// ==========================================================================
// LÓGICA DEL PRODE / JUEGO DE PREDICCIONES
// ==========================================================================
function calculateProdePoints() {
  let points = 0;
  let exact = 0;
  let outcome = 0;
  let predictedCount = 0;
  let finishedPredictedCount = 0;

  predictedCount = Object.keys(state.predictions).length;

  state.matches.forEach(match => {
    if (match.status === 'finished') {
      const pred = state.predictions[match.id];
      if (pred !== undefined && pred !== null) {
        finishedPredictedCount++;
        const actualHome = match.homeScore;
        const actualAway = match.awayScore;
        const predHome = pred.homeScore;
        const predAway = pred.awayScore;

        if (actualHome === predHome && actualAway === predAway) {
          points += 3;
          exact++;
        } else {
          const actualResult = Math.sign(actualHome - actualAway);
          const predResult = Math.sign(predHome - predAway);
          if (actualResult === predResult) {
            points += 1;
            outcome++;
          }
        }
      }
    }
  });

  const accuracy = finishedPredictedCount > 0 
    ? Math.round(((exact + outcome) / finishedPredictedCount) * 100) 
    : 0;

  return {
    points,
    exact,
    outcome,
    predictedCount,
    finishedPredictedCount,
    accuracy
  };
}

function renderProdeStatsBanner() {
  const banner = document.getElementById('prode-stats-banner');
  if (!banner) return;

  if (!state.prodeEnabled) {
    banner.style.display = 'none';
    return;
  }

  const stats = calculateProdePoints();
  const totalMatches = state.matches.length;
  const progressPercent = totalMatches > 0 ? (stats.predictedCount / totalMatches) * 100 : 0;

  banner.style.display = 'flex';
  banner.innerHTML = `
    <div class="prode-banner-header">
      <div class="prode-banner-title">🏆 MI PRODE MUNDIALISTA</div>
      <div class="prode-score-display">
        <span class="prode-score-num">${stats.points}</span>
        <span class="prode-score-lbl">pts</span>
      </div>
    </div>
    <div class="prode-stats-grid">
      <div class="prode-stat-box">
        <span class="prode-stat-num">${stats.exact}</span>
        <span class="prode-stat-lbl">🌟 Exactos</span>
      </div>
      <div class="prode-stat-box">
        <span class="prode-stat-num">${stats.outcome}</span>
        <span class="prode-stat-lbl">⚡ Aciertos</span>
      </div>
      <div class="prode-stat-box">
        <span class="prode-stat-num">${stats.accuracy}%</span>
        <span class="prode-stat-lbl">Efectividad</span>
      </div>
    </div>
    <div class="prode-progress-container">
      <div class="prode-progress-header">
        <span>Pronósticos realizados</span>
        <span>${stats.predictedCount} / ${totalMatches}</span>
      </div>
      <div class="prode-progress-bg">
        <div class="prode-progress-bar" style="width: ${progressPercent}%"></div>
      </div>
    </div>
  `;
}

function getMatchPredictionComparisonHTML(match) {
  const pred = state.predictions[match.id];
  if (!pred) {
    return `
      <div class="card-prediction-comparison">
        <span class="prediction-comp-text">Sin pronóstico registrado</span>
        <span class="prode-badge badge-miss">❌ 0 pts</span>
      </div>
    `;
  }

  const actualHome = match.homeScore;
  const actualAway = match.awayScore;
  const predHome = pred.homeScore;
  const predAway = pred.awayScore;

  let badgeHTML = '';
  if (actualHome === predHome && actualAway === predAway) {
    badgeHTML = `<span class="prode-badge badge-exact">🌟 Exacto (+3 pts)</span>`;
  } else {
    const actualResult = Math.sign(actualHome - actualAway);
    const predResult = Math.sign(predHome - predAway);
    if (actualResult === predResult) {
      badgeHTML = `<span class="prode-badge badge-outcome">⚡ Acierto (+1 pt)</span>`;
    } else {
      badgeHTML = `<span class="prode-badge badge-miss">❌ Fallado (0 pts)</span>`;
    }
  }

  return `
    <div class="card-prediction-comparison">
      <span class="prediction-comp-text">Tu pronóstico: <strong>${predHome} - ${predAway}</strong></span>
      ${badgeHTML}
    </div>
  `;
}

// ==========================================================================
// RENDERIZADO DE PARTIDOS & CARDS
// ==========================================================================
function getTeamDisplay(teamCodeOrPlaceholder) {
  const team = state.teams[teamCodeOrPlaceholder];
  if (team) {
    return {
      name: team.name,
      flag: `<img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">`
    };
  }
  return {
    name: teamCodeOrPlaceholder,
    flag: `<span class="team-flag-placeholder">🏁</span>`
  };
}

function renderMatchCard(match) {
  const homeTeam = getTeamDisplay(match.home);
  const awayTeam = getTeamDisplay(match.away);
  
  let statusHTML = '';
  let cardClass = 'match-card';
  let progressHTML = '';
  let scoreHTML = '';
  let comparisonHTML = '';

  if (match.status === 'live') {
    cardClass += ' live-card';
    statusHTML = `<span class="live-indicator">LIVE · ${match.minute || 0}'</span>`;
    scoreHTML = `<span class="score-text goal-animate-target">${match.homeScore} - ${match.awayScore}</span>`;
    
    // Progreso del partido
    const progressPercent = Math.min(100, Math.max(0, ((match.minute || 0) / 90) * 100));
    progressHTML = `
      <div class="live-progress-bar-container">
        <div class="live-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
    `;
    if (state.prodeEnabled) {
      comparisonHTML = getMatchPredictionComparisonHTML(match);
    }
  } else if (match.status === 'finished') {
    statusHTML = `<span class="match-stage-badge">Finalizado (FT)</span>`;
    scoreHTML = `<span class="score-text">${match.homeScore} - ${match.awayScore}</span>`;
    if (state.prodeEnabled) {
      comparisonHTML = getMatchPredictionComparisonHTML(match);
    }
  } else {
    // Upcoming
    const cd = getCountdown(match.date, match.time);
    statusHTML = `<span class="match-time-badge">${formatBoliviaTime(match.date, match.time)}</span>`;
    
    if (match.isPlaceholder || !state.prodeEnabled) {
      scoreHTML = `
        <div class="match-score-block">
          <span class="score-placeholder">VS</span>
          ${cd ? `<span class="upcoming-countdown">${cd}</span>` : ''}
        </div>
      `;
    } else {
      const pred = state.predictions[match.id] || { homeScore: 0, awayScore: 0 };
      scoreHTML = `
        <div class="match-score-block">
          <div class="prode-inputs">
            <button class="btn-prode-adjust" data-match-id="${match.id}" data-team="home" data-action="dec">-</button>
            <span class="prode-score-val" id="pred-home-${match.id}">${pred.homeScore}</span>
            <button class="btn-prode-adjust" data-match-id="${match.id}" data-team="home" data-action="inc">+</button>
            <span class="prode-vs-divider">:</span>
            <button class="btn-prode-adjust" data-match-id="${match.id}" data-team="away" data-action="dec">-</button>
            <span class="prode-score-val" id="pred-away-${match.id}">${pred.awayScore}</span>
            <button class="btn-prode-adjust" data-match-id="${match.id}" data-team="away" data-action="inc">+</button>
          </div>
          ${cd ? `<span class="upcoming-countdown" style="margin-top: 4px; display: block; font-size: 0.65rem;">${cd}</span>` : ''}
        </div>
      `;
    }
  }

  const groupLabel = match.stage === 'group' ? `Grupo ${match.group}` : 'Eliminatoria';

  return `
    <div class="${cardClass}" data-match-id="${match.id}">
      <div class="match-header">
        <span>${groupLabel} · ${match.venue}</span>
        ${statusHTML}
      </div>
      <div class="match-teams-layout">
        
        <div class="team-display home-team">
          <span class="team-flag-emoji">${homeTeam.flag}</span>
          <span class="team-name-lbl">${homeTeam.name}</span>
        </div>

        <div class="match-score-block">
          ${scoreHTML}
        </div>

        <div class="team-display away-team">
          <span class="team-name-lbl">${awayTeam.name}</span>
          <span class="team-flag-emoji">${awayTeam.flag}</span>
        </div>

      </div>
      ${progressHTML}
      ${comparisonHTML}
    </div>
  `;
}

// ==========================================================================
// CONFETTI SYSTEM (PUNTO 11)
// ==========================================================================
let confettiActive = false;
const confettiParticles = [];
const confettiColors = ['#ffd700', '#00e676', '#2979ff', '#ff1744', '#ffffff'];

function setupConfettiCanvas() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function update() {
    if (confettiParticles.length === 0 && !confettiActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRotation;
      p.opacity -= 0.007;

      if (p.opacity <= 0 || p.y > canvas.height) {
        confettiParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    
    requestAnimationFrame(update);
  }

  window.triggerConfetti = function(originX, originY) {
    const startX = originX || canvas.width / 2;
    const startY = originY || canvas.height / 2;

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      confettiParticles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        gravity: 0.15,
        size: 5 + Math.random() * 8,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * Math.PI,
        vRotation: -0.1 + Math.random() * 0.2,
        opacity: 1
      });
    }

    if (!confettiActive) {
      confettiActive = true;
      requestAnimationFrame(update);
    }
    setTimeout(() => { confettiActive = false; }, 3000);
  };
}

// ==========================================================================
// ALERTAS LOCALES (PUNTO 5)
// ==========================================================================
function checkUpcomingMatchesForNotifications() {
  if (!state.allowNotifications || Notification.permission !== "granted") return;

  const notifiedMatches = JSON.parse(localStorage.getItem('notified_matches') || '[]');
  
  state.matches.forEach(m => {
    if (m.status === 'upcoming') {
      const [year, month, day] = m.date.split('-').map(Number);
      const [hour, min] = m.time.split(':').map(Number);
      const kickoffTime = Date.UTC(year, month - 1, day, hour + 4, min);
      
      const now = Date.now();
      const diffMinutes = (kickoffTime - now) / (1000 * 60);

      // Si empieza en 15 min y no ha sido notificado
      if (diffMinutes > 0 && diffMinutes <= 15.5 && !notifiedMatches.includes(m.id)) {
        const homeName = TEAMS[m.home] ? TEAMS[m.home].name : m.home;
        const awayName = TEAMS[m.away] ? TEAMS[m.away].name : m.away;
        
        try {
          new Notification(`🏆 ¡Partido por comenzar!`, {
            body: `El encuentro ${homeName} vs ${awayName} inicia en 15 minutos en ${m.venue}.`,
            icon: './icon.svg'
          });
          
          notifiedMatches.push(m.id);
          localStorage.setItem('notified_matches', JSON.stringify(notifiedMatches));
        } catch (err) {
          console.error("Error al enviar notificación:", err);
        }
      }
    }
  });
}

// ==========================================================================
// SKELETONS SHIMMER RENDERING (PUNTO 13)
// ==========================================================================
function renderSkeletonHoy() {
  const listContainer = document.getElementById('list-hoy');
  if (!listContainer) return;
  listContainer.innerHTML = Array(3).fill().map(() => `
    <div class="skeleton-card">
      <div class="skeleton-header skeleton"></div>
      <div class="skeleton-row">
        <div class="skeleton-team skeleton"></div>
        <div class="skeleton-score skeleton"></div>
        <div class="skeleton-team skeleton"></div>
      </div>
    </div>
  `).join('');
}

function renderSkeletonGrupos() {
  const container = document.getElementById('groups-container');
  if (!container) return;
  container.innerHTML = Array(4).fill().map(() => `
    <div class="skeleton-table-wrapper" style="height: 180px;">
      <div class="skeleton-table-header skeleton"></div>
      <div class="skeleton-table-row skeleton"></div>
      <div class="skeleton-table-row skeleton"></div>
      <div class="skeleton-table-row skeleton"></div>
    </div>
  `).join('');
}

function renderSkeletonTablas() {
  const container = document.getElementById('tables-container');
  if (!container) return;
  container.innerHTML = Array(4).fill().map(() => `
    <div class="skeleton-table-wrapper" style="height: 220px;">
      <div class="skeleton-table-header skeleton"></div>
      <div class="skeleton-table-row skeleton" style="height: 24px; margin-bottom: 12px;"></div>
      <div class="skeleton-table-row skeleton"></div>
      <div class="skeleton-table-row skeleton"></div>
      <div class="skeleton-table-row skeleton"></div>
      <div class="skeleton-table-row skeleton"></div>
    </div>
  `).join('');
}

function renderSkeletonEliminatorias() {
  const container = document.getElementById('bracket-container');
  if (!container) return;
  container.innerHTML = Array(3).fill().map(() => `
    <div class="bracket-column">
      <div class="bracket-column-title skeleton" style="width: 100px; height: 16px; margin: 0 auto 16px;"></div>
      <div class="bracket-matches">
        ${Array(2).fill().map(() => `
          <div class="bracket-match-node" style="height: 90px; border-color: rgba(255,255,255,0.03);">
            <div class="skeleton" style="height: 10px; width: 50%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 14px; width: 80%; margin-bottom: 6px;"></div>
            <div class="skeleton" style="height: 14px; width: 70%;"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function triggerTabLoading(callback) {
  state.isLoading = true;
  renderActiveTab();
  
  setTimeout(() => {
    state.isLoading = false;
    renderActiveTab();
    if (callback) callback();
  }, 750);
}

// ==========================================================================
// TRIVIA CURIOSIDADES (PUNTO 10)
// ==========================================================================
function renderTrivia() {
  const title = document.getElementById('trivia-title');
  const text = document.getElementById('trivia-text');
  if (!title || !text) return;

  const fact = TRIVIA_FACTS[state.currentTriviaIndex];
  const card = document.getElementById('trivia-card');
  
  card.style.opacity = 0;
  card.style.transform = 'scale(0.98)';
  
  setTimeout(() => {
    title.innerText = fact.title;
    text.innerText = fact.text;
    card.style.opacity = 1;
    card.style.transform = 'scale(1)';
  }, 200);
}

// ==========================================================================
// STATS DASHBOARD (PUNTO 3)
// ==========================================================================
function renderTournamentStats() {
  const dashboard = document.getElementById('tournament-stats-dashboard');
  if (!dashboard) return;

  const stats = calculateTournamentStats(state.matches, state.teams);

  let topScorerHTML = stats.topScorer 
    ? `<div class="table-row-team">
         <img src="https://flagcdn.com/w40/${stats.topScorer.flagCode}.png" class="team-flag-img" alt="${stats.topScorer.name}">
         <span class="stat-item-detail">${stats.topScorer.name} (${stats.topScorer.goals} goles)</span>
       </div>`
    : '<span class="stat-item-detail">Sin datos</span>';

  let bestDefenseHTML = stats.bestDefense
    ? `<div class="table-row-team">
         <img src="https://flagcdn.com/w40/${stats.bestDefense.flagCode}.png" class="team-flag-img" alt="${stats.bestDefense.name}">
         <span class="stat-item-detail">${stats.bestDefense.name} (${stats.bestDefense.conceded} GC en ${stats.bestDefense.played} PJ)</span>
       </div>`
    : '<span class="stat-item-detail">Sin datos</span>';

  let highestScoringHTML = stats.highestScoringMatch
    ? `<span class="stat-item-detail" style="font-weight:600;">${stats.highestScoringMatch.label}</span>
       <span class="stat-item-detail" style="color:var(--accent-gold);">${stats.highestScoringMatch.homeScore} - ${stats.highestScoringMatch.awayScore} (${stats.highestScoringMatch.goals} goles)</span>`
    : '<span class="stat-item-detail">Sin datos</span>';

  dashboard.innerHTML = `
    <div class="stat-item-box">
      <span class="stat-item-header">Partidos Jugados</span>
      <div class="stat-item-value-row">
        <span class="stat-item-big-value">${stats.playedCount}</span>
        <span class="stat-item-detail">/ 104 totales</span>
      </div>
    </div>
    <div class="stat-item-box">
      <span class="stat-item-header">Promedio Goles</span>
      <div class="stat-item-value-row">
        <span class="stat-item-big-value">${stats.avgGoals}</span>
        <span class="stat-item-detail">goles/partido</span>
      </div>
    </div>
    <div class="stat-item-box">
      <span class="stat-item-header">Selección Más Goleadora</span>
      ${topScorerHTML}
    </div>
    <div class="stat-item-box">
      <span class="stat-item-header">Mejor Defensa</span>
      ${bestDefenseHTML}
    </div>
    <div class="stat-item-box full-width">
      <span class="stat-item-header">Partido con más goles</span>
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        ${highestScoringHTML}
      </div>
    </div>
  `;
}

// ==========================================================================
// SELECCIÓN FAVORITA & COUNTDOWN ANIMADO (PUNTO 8 & 12)
// ==========================================================================
let countdownInterval = null;

function renderFavoriteBanner() {
  const container = document.getElementById('fav-team-banner-container');
  if (!container) return;

  if (!state.favoriteTeam) {
    container.innerHTML = `
      <div class="fav-team-hero" style="border-style: dashed; background: rgba(255,255,255,0.01); margin-top: 10px;">
        <div style="text-align: center; padding: 10px 0;">
          <span style="font-size: 1.8rem; display: block; margin-bottom: 8px;">⭐</span>
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1rem; margin-bottom: 4px; color: var(--text-primary);">Seguí a tu Selección Favorita</h3>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">Estadísticas personalizadas, alertas exclusivas y cuenta regresiva animada.</p>
          <button class="btn-toggle-calendar" id="btn-select-fav-hero" style="margin: 0 auto; width: auto; padding: 8px 16px; font-size: 0.8rem; display: block;">Elegir Selección</button>
        </div>
      </div>
    `;
    
    const btnHero = document.getElementById('btn-select-fav-hero');
    if (btnHero) btnHero.addEventListener('click', openFavModal);
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    return;
  }

  const teamCode = state.favoriteTeam;
  const team = state.teams[teamCode];
  if (!team) return;

  const standings = calculateGroupStandings(state.matches, state.teams, state.predictions, state.prodeEnabled);
  const groupName = team.group;
  const groupStandings = standings[groupName] || [];
  const teamStat = groupStandings.find(t => t.code === teamCode) || { pj: 0, g: 0, e: 0, p: 0, pts: 0 };
  const posIndex = groupStandings.findIndex(t => t.code === teamCode) + 1;

  const teamMatches = state.matches.filter(m => m.home === teamCode || m.away === teamCode);
  const nextMatch = teamMatches.find(m => m.status === 'upcoming' || m.status === 'live');

  let matchContentHTML = '';
  
  if (nextMatch) {
    const isLive = nextMatch.status === 'live';
    const opponentCode = nextMatch.home === teamCode ? nextMatch.away : nextMatch.home;
    const opponent = getTeamDisplay(opponentCode);
    const myDisplay = getTeamDisplay(teamCode);
    const label = nextMatch.stage === 'group' ? `Fase de Grupos (Gr. ${nextMatch.group})` : (nextMatch.label || 'Eliminatoria');

    let bottomTimeHTML = '';
    if (isLive) {
      bottomTimeHTML = `
        <div style="text-align: center; color: var(--accent-green); font-weight: bold; font-size: 0.9rem; margin-top: 10px; animation: pulse 1.5s infinite;">
          🔴 JUGANDO EN VIVO · ${nextMatch.minute || 0}' (${nextMatch.homeScore} - ${nextMatch.awayScore})
        </div>
      `;
    } else {
      bottomTimeHTML = `
        <div class="countdown-clock-wrapper" data-date="${nextMatch.date}" data-time="${nextMatch.time}">
          <div class="countdown-segment">
            <div class="countdown-card-flip"><span class="countdown-digit" id="cd-days">00</span></div>
            <span class="countdown-segment-label">Días</span>
          </div>
          <div class="countdown-segment">
            <div class="countdown-card-flip"><span class="countdown-digit" id="cd-hours">00</span></div>
            <span class="countdown-segment-label">Hrs</span>
          </div>
          <div class="countdown-segment">
            <div class="countdown-card-flip"><span class="countdown-digit" id="cd-mins">00</span></div>
            <span class="countdown-segment-label">Min</span>
          </div>
          <div class="countdown-segment">
            <div class="countdown-card-flip"><span class="countdown-digit" id="cd-secs">00</span></div>
            <span class="countdown-segment-label">Seg</span>
          </div>
        </div>
      `;
    }

    matchContentHTML = `
      <div class="fav-next-match-box">
        <div class="fav-next-match-header">
          <span>Próximo Partido · ${label}</span>
          <span style="color: var(--accent-gold); font-weight:600;">${formatBoliviaTime(nextMatch.date, nextMatch.time).split('·')[0]}</span>
        </div>
        <div class="fav-next-match-teams">
          <div class="fav-next-match-team-row">
            ${myDisplay.flag}
            <span>${myDisplay.name}</span>
          </div>
          <span class="fav-vs-txt">VS</span>
          <div class="fav-next-match-team-row">
            <span>${opponent.name}</span>
            ${opponent.flag}
          </div>
        </div>
        ${bottomTimeHTML}
      </div>
    `;
  } else {
    matchContentHTML = `
      <div class="fav-next-match-box" style="text-align: center; padding: 12px; font-size: 0.8rem; color: var(--text-muted);">
        🏁 Tu selección no tiene más partidos agendados en este momento.
      </div>
    `;
  }

  container.innerHTML = `
    <div class="fav-team-hero">
      <div class="fav-hero-header">
        <div class="fav-hero-title">
          <span>⭐ MI SELECCIÓN FAVORITA</span>
        </div>
        <button class="btn-remove-fav" id="btn-remove-fav" title="Quitar selección favorita">Quitar ⭐</button>
      </div>
      <div class="fav-hero-body">
        <div class="fav-team-details">
          <img src="https://flagcdn.com/w80/${team.flagCode}.png" class="fav-team-flag-large" alt="${team.name}">
          <div>
            <div class="fav-team-info-name">${team.name}</div>
            <div class="fav-team-info-stats">
              <span>Pos: <strong>#${posIndex}</strong> (Grupo ${groupName})</span>
              <span>Pts: <strong>${teamStat.pts}</strong></span>
              <span>PJ: <strong>${teamStat.pj}</strong> (G:${teamStat.g} E:${teamStat.e} P:${teamStat.p})</span>
            </div>
          </div>
        </div>
        ${matchContentHTML}
      </div>
    </div>
  `;

  document.getElementById('btn-remove-fav').addEventListener('click', () => {
    state.favoriteTeam = null;
    localStorage.removeItem('fav_team');
    
    const favBtn = document.getElementById('btn-fav-toggle');
    if (favBtn) favBtn.classList.remove('active');
    
    renderActiveTab();
  });

  if (countdownInterval) clearInterval(countdownInterval);
  
  const clock = container.querySelector('.countdown-clock-wrapper');
  if (clock) {
    const dStr = clock.getAttribute('data-date');
    const tStr = clock.getAttribute('data-time');
    
    const update = () => {
      const detailed = getDetailedCountdown(dStr, tStr);
      const dEl = document.getElementById('cd-days');
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-mins');
      const sEl = document.getElementById('cd-secs');

      if (dEl && hEl && mEl && sEl) {
        dEl.innerText = String(detailed.days).padStart(2, '0');
        hEl.innerText = String(detailed.hours).padStart(2, '0');
        mEl.innerText = String(detailed.minutes).padStart(2, '0');
        sEl.innerText = String(detailed.seconds).padStart(2, '0');
      }

      if (detailed.totalSeconds <= 0) {
        clearInterval(countdownInterval);
        renderActiveTab();
      }
    };
    
    update();
    countdownInterval = setInterval(update, 1000);
  }
}

// ==========================================================================
// GESTO PULL TO REFRESH (PUNTO 14)
// ==========================================================================
function initPullToRefresh() {
  const appContainer = document.querySelector('.app-container');
  const appMain = document.querySelector('.app-main');
  const ptr = document.getElementById('ptr-element');
  if (!appContainer || !appMain || !ptr) return;

  let startY = 0;
  let currentY = 0;
  let isPulling = false;
  const threshold = 70;
  const maxPull = 100;

  appMain.addEventListener('touchstart', (e) => {
    // Solo permitir pull-to-refresh si el contenedor de scroll interno está al inicio
    if (appMain.scrollTop === 0) {
      startY = e.touches[0].pageY;
      isPulling = true;
      ptr.classList.remove('ptr-loading');
      ptr.querySelector('.ptr-text').innerText = 'Deslizar para actualizar...';
    } else {
      isPulling = false;
    }
  });

  appMain.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    currentY = e.touches[0].pageY;
    const diff = currentY - startY;

    // Si el usuario desliza hacia arriba, cancelamos el pull inmediatamente
    if (diff < 0) {
      isPulling = false;
      return;
    }

    if (diff > 0) {
      if (appMain.scrollTop > 0) {
        isPulling = false;
        return;
      }

      e.preventDefault();
      const pullDistance = Math.min(diff * 0.4, maxPull);
      appContainer.style.transform = `translateY(${pullDistance}px)`;
      ptr.style.transform = `translateY(${pullDistance}px)`;
      
      const rotation = (pullDistance / threshold) * 360;
      ptr.querySelector('.ptr-soccer-ball').style.transform = `rotate(${rotation}deg)`;

      if (pullDistance >= threshold) {
        ptr.querySelector('.ptr-text').innerText = 'Soltar para actualizar';
        ptr.querySelector('.ptr-text').style.color = 'var(--accent-green)';
      } else {
        ptr.querySelector('.ptr-text').innerText = 'Deslizar para actualizar...';
        ptr.querySelector('.ptr-text').style.color = '';
      }
    }
  }, { passive: false });

  appMain.addEventListener('touchend', () => {
    if (!isPulling) return;
    isPulling = false;
    const diff = currentY - startY;

    appContainer.style.transition = 'transform 0.3s ease';
    ptr.style.transition = 'transform 0.3s ease';
    appContainer.style.transform = '';
    ptr.style.transform = '';

    if (diff * 0.4 >= threshold) {
      ptr.classList.add('ptr-loading');
      ptr.querySelector('.ptr-text').innerText = 'Actualizando...';
      ptr.querySelector('.ptr-text').style.color = 'var(--accent-gold)';
      ptr.style.transform = `translateY(${threshold}px)`;
      
      triggerTabLoading(() => {
        ptr.style.transform = '';
        ptr.classList.remove('ptr-loading');
        setTimeout(() => {
          appContainer.style.transition = '';
          ptr.style.transition = '';
        }, 300);
      });
    } else {
      setTimeout(() => {
        appContainer.style.transition = '';
        ptr.style.transition = '';
      }, 300);
    }
  });
}

// ==========================================================================
// VISTAS RENDERERS
// ==========================================================================


// 1. Hoy / Calendario Completo
function renderHoy() {
  const listContainer = document.getElementById('list-hoy');
  const dateLabel = document.getElementById('hoy-date-label');
  const titleLabel = document.querySelector('#view-hoy h2');
  const toggleBtn = document.getElementById('btn-toggle-cal');

  // Renderizar componentes adicionales (Punto 8, 10, 12)
  renderFavoriteBanner();
  renderTrivia();
  renderProdeStatsBanner();

  if (state.showAllChronological) {
    titleLabel.innerText = "Calendario Completo";
    dateLabel.innerText = "Todos los partidos del torneo";
    toggleBtn.innerText = "📅 Mostrar Solo Hoy";

    // Ordenar cronológicamente
    const sorted = [...state.matches].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.id - b.id;
    });

    // Agrupar por fecha
    const groups = {};
    sorted.forEach(m => {
      if (!groups[m.date]) groups[m.date] = [];
      groups[m.date].push(m);
    });

    let html = '';
    Object.keys(groups).forEach(dateStr => {
      const friendlyDate = formatHeaderDate(dateStr);
      
      html += `
        <div class="date-group-header">
          <span>${friendlyDate.toUpperCase()}</span>
          <span style="font-size:0.72rem; color:var(--accent-gold); font-weight:600;">${groups[dateStr].length} partidos</span>
        </div>
        ${groups[dateStr].map(renderMatchCard).join('')}
      `;
    });

    listContainer.innerHTML = html;
  } else {
    titleLabel.innerText = "Partidos de Hoy";
    toggleBtn.innerText = "📅 Ver Calendario Completo";

    const now = new Date();
    const botDate = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    const todayISO = botDate.toISOString().split('T')[0];
    let targetDate = todayISO;
    
    let todayMatches = state.matches.filter(m => m.date === targetDate);
    
    if (todayMatches.length === 0) {
      targetDate = "2026-06-11";
      todayMatches = state.matches.filter(m => m.date === targetDate);
      dateLabel.innerHTML = `Próxima fecha: 11 de Junio 📅`;
    } else {
      dateLabel.innerText = formatHeaderDate(targetDate);
    }

    if (todayMatches.length === 0) {
      listContainer.innerHTML = `<p class="sim-info-txt" style="text-align:center;">No hay partidos programados.</p>`;
      return;
    }

    listContainer.innerHTML = todayMatches.map(renderMatchCard).join('');
  }
}

// 2. Grupos
function renderGrupos() {
  const container = document.getElementById('groups-container');
  const filterVal = document.getElementById('group-filter').value;

  const groupsToRender = filterVal === 'ALL' 
    ? ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
    : [filterVal];

  let html = '';
  
  groupsToRender.forEach(gName => {
    const groupMatches = state.matches.filter(m => m.stage === 'group' && m.group === gName);
    
    // Banderas de equipos en este grupo
    const teamCodes = Object.keys(state.teams).filter(t => state.teams[t].group === gName);
    const flagsString = teamCodes.map(code => `<img src="https://flagcdn.com/w40/${state.teams[code].flagCode}.png" class="team-flag-img" alt="${state.teams[code].name}">`).join(' ');

    html += `
      <div class="group-card">
        <div class="group-card-header">
          <span>Grupo ${gName}</span>
          <span style="float: right; font-size: 0.9rem;">${flagsString}</span>
        </div>
        <div class="group-matches-mini">
          ${groupMatches.map(m => {
            const home = getTeamDisplay(m.home);
            const away = getTeamDisplay(m.away);
            let scoreStr = 'vs';
            
            if (m.status === 'finished' || m.status === 'live') {
              scoreStr = `${m.homeScore} - ${m.awayScore}`;
            }

            return `
              <div class="group-match-mini-row">
                <span class="match-mini-teams">
                  ${home.flag} ${home.name} <span class="match-mini-score">${scoreStr}</span> ${away.name} ${away.flag}
                </span>
                <span class="match-mini-time">${m.status === 'live' ? `LIVE ${m.minute}'` : convertToAmPm(m.time)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 3. Tablas de posiciones
function renderTablas() {
  // Renderizar estadísticas dinámicas del torneo (Punto 3)
  renderTournamentStats();

  const container = document.getElementById('tables-container');
  const standings = calculateGroupStandings(state.matches, state.teams, state.predictions, state.prodeEnabled);
  
  let html = '';

  Object.keys(standings).forEach(groupName => {
    const list = standings[groupName];

    html += `
      <div class="standings-table-wrapper">
        <h3 class="group-card-header">Grupo ${groupName}</h3>
        <table class="standings-table">
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Selección</th>
              <th class="cell-center">PJ</th>
              <th class="cell-center">G</th>
              <th class="cell-center">E</th>
              <th class="cell-center">P</th>
              <th class="cell-center">GF</th>
              <th class="cell-center">GC</th>
              <th class="cell-center">DG</th>
              <th class="cell-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((t, idx) => `
              <tr>
                <td class="cell-bold"><span class="table-row-pos">${idx + 1}</span></td>
                <td>
                  <div class="table-row-team">
                    <img src="https://flagcdn.com/w40/${t.flagCode}.png" class="team-flag-img" alt="${t.name}">
                    <span class="table-team-name">${t.name}</span>
                  </div>
                </td>
                <td class="cell-center">${t.pj}</td>
                <td class="cell-center">${t.g}</td>
                <td class="cell-center">${t.e}</td>
                <td class="cell-center">${t.p}</td>
                <td class="cell-center">${t.gf}</td>
                <td class="cell-center">${t.gc}</td>
                <td class="cell-center">${t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                <td class="cell-center cell-bold" style="color: var(--accent-gold);">${t.pts}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 4. Eliminatorias (Bracket visual)
function renderEliminatorias() {
  const container = document.getElementById('bracket-container');

  // Filtrar partidos por ronda
  const getMatchesByStage = (stage) => state.matches.filter(m => m.stage === stage);

  const rounds = [
    { title: "Dieciseisavos", stage: "round32" },
    { title: "Octavos", stage: "round16" },
    { title: "Cuartos", stage: "quarter" },
    { title: "Semifinales", stage: "semi" },
    { title: "Finales", stage: ["final", "third"] } // Agrupados al final
  ];

  let html = '';

  rounds.forEach(round => {
    let roundMatches = [];
    if (Array.isArray(round.stage)) {
      round.stage.forEach(s => {
        roundMatches.push(...getMatchesByStage(s));
      });
    } else {
      roundMatches = getMatchesByStage(round.stage);
    }

    html += `
      <div class="bracket-column">
        <div class="bracket-column-title">${round.title}</div>
        <div class="bracket-matches">
          ${roundMatches.map(m => {
            const home = getTeamDisplay(m.home);
            const away = getTeamDisplay(m.away);

            let homeClass = 'node-team-row';
            let awayClass = 'node-team-row';

            if (m.status === 'finished') {
              if (m.homeScore > m.awayScore) homeClass += ' winner', awayClass += ' loser';
              else if (m.awayScore > m.homeScore) awayClass += ' winner', homeClass += ' loser';
              else homeClass += ' winner'; // Por penales
            } else if (state.prodeEnabled) {
              const pred = state.predictions[m.id];
              if (pred !== undefined && pred !== null) {
                if (pred.homeScore > pred.awayScore) homeClass += ' winner', awayClass += ' loser';
                else if (pred.awayScore > pred.homeScore) awayClass += ' winner', homeClass += ' loser';
                else homeClass += ' winner'; // Por defecto empate
              }
            }

            let scoreHomeHTML = '';
            let scoreAwayHTML = '';

            if (m.status !== 'upcoming') {
              scoreHomeHTML = `<span class="node-score">${m.homeScore}</span>`;
              scoreAwayHTML = `<span class="node-score">${m.awayScore}</span>`;
            } else if (state.prodeEnabled) {
              const pred = state.predictions[m.id];
              if (pred !== undefined && pred !== null) {
                scoreHomeHTML = `<span class="node-score prediction-score" style="color: var(--accent-gold); font-style: italic; opacity: 0.85;">${pred.homeScore}</span>`;
                scoreAwayHTML = `<span class="node-score prediction-score" style="color: var(--accent-gold); font-style: italic; opacity: 0.85;">${pred.awayScore}</span>`;
              } else {
                scoreHomeHTML = `<span class="node-score"></span>`;
                scoreAwayHTML = `<span class="node-score"></span>`;
              }
            } else {
              scoreHomeHTML = `<span class="node-score"></span>`;
              scoreAwayHTML = `<span class="node-score"></span>`;
            }

            const isLiveLabel = m.status === 'live' ? `<span style="color:var(--accent-green); font-weight:bold;">LIVE ${m.minute}'</span>` : (m.label || `Partido ${m.id}`);

            return `
              <div class="bracket-match-node" data-match-id="${m.id}">
                <div class="node-header">
                  <span>${isLiveLabel}</span>
                </div>
                <div class="${homeClass}">
                  <div class="node-flag-name">
                    <span>${home.flag}</span>
                    <span class="node-team-name">${home.name}</span>
                  </div>
                  ${scoreHomeHTML}
                </div>
                <div class="${awayClass}">
                  <div class="node-flag-name">
                    <span>${away.flag}</span>
                    <span class="node-team-name">${away.name}</span>
                  </div>
                  ${scoreAwayHTML}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Renderizar la sección activa
function renderActiveTab() {
  updateKnockoutTeams();

  // Ocultar todas las secciones
  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));

  // Mostrar activa
  const activeSec = document.getElementById(`view-${state.activeTab}`);
  if (activeSec) activeSec.classList.add('active');

  // Si está cargando, mostrar skeletons en vez de los datos reales (Punto 13)
  if (state.isLoading) {
    if (state.activeTab === 'hoy') renderSkeletonHoy();
    else if (state.activeTab === 'grupos') renderSkeletonGrupos();
    else if (state.activeTab === 'tablas') renderSkeletonTablas();
    else if (state.activeTab === 'eliminatorias') renderSkeletonEliminatorias();
    return;
  }

  // Ejecutar render específico
  if (state.activeTab === 'hoy') renderHoy();
  else if (state.activeTab === 'grupos') renderGrupos();
  else if (state.activeTab === 'tablas') renderTablas();
  else if (state.activeTab === 'eliminatorias') renderEliminatorias();
}


// ==========================================================================
// SPA ROUTER & NAVIGATION INITIALIZATION
// ==========================================================================
function initTabRouter() {
  const tabs = document.querySelectorAll('.nav-tab');
  const underline = document.querySelector('.nav-underline');

  const updateUnderlinePosition = (activeTabButton) => {
    const rect = activeTabButton.getBoundingClientRect();
    const parentRect = activeTabButton.parentElement.getBoundingClientRect();
    underline.style.left = `${rect.left - parentRect.left}px`;
    underline.style.width = `${rect.width}px`;
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      state.activeTab = tab.getAttribute('data-tab');
      updateUnderlinePosition(tab);
      triggerTabLoading();
    });
  });

  // Dropdown filter de grupos
  document.getElementById('group-filter').addEventListener('change', () => {
    if (state.activeTab === 'grupos') renderGrupos();
  });

  // Toggle de calendario completo en pestaña Hoy
  document.getElementById('btn-toggle-cal').addEventListener('click', () => {
    state.showAllChronological = !state.showAllChronological;
    renderHoy();
    
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Underline posicionamiento inicial
  setTimeout(() => {
    const activeTabButton = document.querySelector(`.nav-tab[data-tab="${state.activeTab}"]`);
    if (activeTabButton) updateUnderlinePosition(activeTabButton);
  }, 100);
}

// ==========================================================================
// SETUP DE MODALES, ALERTAS Y EVENTOS ADICIONALES (PUNTO 5, 8, 10, 11, 14)
// ==========================================================================
function openFavModal() {
  const modal = document.getElementById('fav-selector-modal');
  const overlay = document.getElementById('fav-modal-overlay');
  if (modal && overlay) {
    modal.classList.add('active');
    overlay.classList.add('active');
    renderFavTeamsGrid();
  }
}

function closeFavModal() {
  const modal = document.getElementById('fav-selector-modal');
  const overlay = document.getElementById('fav-modal-overlay');
  if (modal && overlay) {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }
}

function renderFavTeamsGrid(filterText = '') {
  const grid = document.getElementById('fav-teams-grid');
  if (!grid) return;

  const filteredTeams = Object.keys(state.teams)
    .filter(code => {
      const team = state.teams[code];
      return team.name.toLowerCase().includes(filterText.toLowerCase()) || 
             code.toLowerCase().includes(filterText.toLowerCase());
    });

  if (filteredTeams.length === 0) {
    grid.innerHTML = `<p style="grid-column: span 2; text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 10px;">No se encontraron selecciones.</p>`;
    return;
  }

  grid.innerHTML = filteredTeams.map(code => {
    const team = state.teams[code];
    const isSelected = state.favoriteTeam === code ? 'selected' : '';
    return `
      <div class="fav-team-item ${isSelected}" data-code="${code}">
        <img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">
        <span class="fav-team-item-name">${team.name}</span>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.fav-team-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.getAttribute('data-code');
      state.favoriteTeam = code;
      localStorage.setItem('fav_team', code);
      
      const favBtn = document.getElementById('btn-fav-toggle');
      if (favBtn) favBtn.classList.add('active');

      closeFavModal();
      renderActiveTab();
    });
  });
}

function setupFavModalHandlers() {
  const favBtn = document.getElementById('btn-fav-toggle');
  const closeBtn = document.getElementById('fav-modal-close');
  const overlay = document.getElementById('fav-modal-overlay');
  const searchInput = document.getElementById('fav-team-search');

  if (favBtn) {
    favBtn.addEventListener('click', openFavModal);
    if (state.favoriteTeam) {
      favBtn.classList.add('active');
    }
  }
  if (closeBtn) closeBtn.addEventListener('click', closeFavModal);
  if (overlay) overlay.addEventListener('click', closeFavModal);
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderFavTeamsGrid(e.target.value);
    });
  }
}

function setupNotificationsHandlers() {
  const alertBtn = document.getElementById('btn-alerts-toggle');
  if (!alertBtn) return;

  if (state.allowNotifications && Notification.permission === "granted") {
    alertBtn.classList.add('active');
  }

  alertBtn.addEventListener('click', async () => {
    if (state.allowNotifications) {
      state.allowNotifications = false;
      localStorage.removeItem('allow_notifications');
      alertBtn.classList.remove('active');
      alert("Alertas desactivadas.");
    } else {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          state.allowNotifications = true;
          localStorage.setItem('allow_notifications', 'true');
          alertBtn.classList.add('active');
          alert("¡Alertas activadas! Te notificaremos 15 minutos antes de cada partido.");
        } else {
          alert("Debés permitir las notificaciones en el navegador para activar esta opción.");
        }
      } else if (Notification.permission === "granted") {
        state.allowNotifications = true;
        localStorage.setItem('allow_notifications', 'true');
        alertBtn.classList.add('active');
        alert("¡Alertas activadas! Te notificaremos 15 minutos antes de cada partido.");
      } else {
        alert("Las notificaciones están bloqueadas en tu navegador. Habilitalas en los ajustes del sitio para activar esta opción.");
      }
    }
  });

  checkUpcomingMatchesForNotifications();
  setInterval(checkUpcomingMatchesForNotifications, 60000);
}

function setupTriviaHandlers() {
  const btn = document.getElementById('btn-next-trivia');
  if (btn) {
    btn.addEventListener('click', () => {
      state.currentTriviaIndex = (state.currentTriviaIndex + 1) % TRIVIA_FACTS.length;
      renderTrivia();
    });
  }
}

// ==========================================================================
// PRELOADER PREMIUM TIMER (PUNTO 15)
// ==========================================================================
function initPreloader() {
  const preloader = document.getElementById('app-preloader');
  const fill = document.getElementById('preloader-progress-fill');
  if (!preloader || !fill) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      setTimeout(() => {
        preloader.classList.add('fade-out');
        setTimeout(() => {
          preloader.remove();
        }, 600);
      }, 250);
    }
    fill.style.width = `${progress}%`;
  }, 80);
}

// ==========================================================================
// PROMPT DE INSTALACIÓN iOS SAFARI (EXTRA PREMIUM)
// ==========================================================================
function openIosInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  const overlay = document.getElementById('ios-modal-overlay');
  if (modal && overlay) {
    modal.classList.add('active');
    overlay.classList.add('active');
  }
}

function closeIosInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  const overlay = document.getElementById('ios-modal-overlay');
  if (modal && overlay) {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }
}

function initIosInstallPrompt() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS && !isStandalone) {
    // Mostrar el botón de instalar para iOS
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'flex';
    }

    // Además, mostrar la burbuja de ayuda automática si no ha sido cerrada
    if (!sessionStorage.getItem('ios_prompt_dismissed')) {
      const tooltip = document.createElement('div');
      tooltip.className = 'ios-install-tooltip';
      tooltip.id = 'ios-install-tooltip';
      tooltip.innerHTML = `
        <div class="ios-tooltip-header">
          <span>📲 Instalar en tu iPhone</span>
          <button class="btn-close-tooltip" id="close-ios-tooltip">✕</button>
        </div>
        <p class="ios-tooltip-body">
          Tocá el botón de <strong>Compartir</strong> <span class="ios-share-icon">⎋</span> abajo en la barra de Safari y elegí <strong>"Agregar a Inicio"</strong> <span class="ios-add-icon">⊞</span> para seguir el Mundial.
        </p>
        <div class="ios-tooltip-arrow"></div>
      `;
      
      document.body.appendChild(tooltip);

      // Esperar a que se vaya el preloader para mostrarlo
      setTimeout(() => {
        tooltip.classList.add('show');
      }, 4000);

      document.getElementById('close-ios-tooltip').addEventListener('click', (e) => {
        e.stopPropagation();
        tooltip.classList.remove('show');
        sessionStorage.setItem('ios_prompt_dismissed', 'true');
        setTimeout(() => { tooltip.remove(); }, 400);
      });
    }
  }
}


function setupProdeInputsListener() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-prode-adjust');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const matchId = Number(btn.getAttribute('data-match-id'));
    const team = btn.getAttribute('data-team'); // 'home' | 'away'
    const action = btn.getAttribute('data-action'); // 'inc' | 'dec'

    const match = state.matches.find(m => m.id === matchId);
    if (!match || match.status !== 'upcoming') return;

    if (!state.predictions[matchId]) {
      state.predictions[matchId] = { homeScore: 0, awayScore: 0 };
    }

    const pred = state.predictions[matchId];
    const scoreKey = team === 'home' ? 'homeScore' : 'awayScore';

    if (action === 'inc') {
      pred[scoreKey]++;
      if (window.triggerConfetti) {
        window.triggerConfetti(e.clientX, e.clientY);
      }
    } else {
      pred[scoreKey] = Math.max(0, pred[scoreKey] - 1);
    }

    localStorage.setItem('fixture_2026_predictions', JSON.stringify(state.predictions));
    
    // Sincronizar llaves y re-renderizar la vista actual para actualizar tablas y brackets
    updateKnockoutTeams();
    renderActiveTab();
  });
}

function setupProdeToggleHandler() {
  const btn = document.getElementById('btn-prode-toggle');
  if (!btn) return;

  if (state.prodeEnabled) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }

  btn.addEventListener('click', () => {
    state.prodeEnabled = !state.prodeEnabled;
    localStorage.setItem('fixture_2026_prode_enabled', String(state.prodeEnabled));

    if (state.prodeEnabled) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    renderActiveTab();
  });
}

function setupLiveSyncHandler() {
  const btn = document.getElementById('btn-sync-live');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    fetchLiveScores();
  });

  if (navigator.onLine) {
    setTimeout(fetchLiveScores, 1500);
  }
}

// ==========================================================================
// MODO ADMINISTRADOR (OCULTO)
// ==========================================================================
let tempMatches = [];

function toggleAdminMode() {
  state.adminMode = !state.adminMode;
  const badge = document.getElementById('admin-badge');
  if (badge) {
    badge.style.display = state.adminMode ? 'inline-flex' : 'none';
  }
}

function openAdminPanel() {
  const modal = document.getElementById('admin-panel-modal');
  const overlay = document.getElementById('admin-modal-overlay');
  if (modal && overlay) {
    tempMatches = JSON.parse(JSON.stringify(state.matches));
    renderAdminMatchList();
    modal.classList.add('active');
    overlay.classList.add('active');
  }
}

function closeAdminPanel() {
  const modal = document.getElementById('admin-panel-modal');
  const overlay = document.getElementById('admin-modal-overlay');
  if (modal && overlay) {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }
}

function renderAdminMatchList() {
  const container = document.getElementById('admin-modal-body');
  if (!container) return;

  const groups = {};
  tempMatches.forEach(match => {
    if (!groups[match.date]) {
      groups[match.date] = [];
    }
    groups[match.date].push(match);
  });

  const sortedDates = Object.keys(groups).sort();
  let html = '';

  sortedDates.forEach(dateStr => {
    const formattedDate = formatHeaderDate ? formatHeaderDate(dateStr) : dateStr;
    html += `
      <div class="admin-date-group">
        <div class="admin-date-title">${formattedDate}</div>
    `;

    groups[dateStr].forEach(match => {
      const homeTeam = getTeamDisplay(match.home);
      const awayTeam = getTeamDisplay(match.away);
      
      const officialMatch = INITIAL_MATCHES.find(om => om.id === match.id);
      const isLocked = officialMatch && officialMatch.status === 'finished';

      let statusClass = match.status || 'upcoming';
      let statusLabel = 'Próximo';
      if (match.status === 'live') {
        statusLabel = 'En Vivo';
      } else if (match.status === 'finished') {
        statusLabel = 'Finalizado';
      }

      const showMinute = match.status === 'live';
      const minuteVal = match.minute || '';

      html += `
        <div class="admin-match-row" data-match-id="${match.id}">
          <div class="admin-score-controls">
            <!-- Home Team -->
            <div class="admin-team-row">
              <div class="admin-team-info">
                ${homeTeam.flag}
                <span class="admin-team-name">${homeTeam.name}</span>
              </div>
              <div class="admin-score-adjuster">
                <button class="admin-score-btn" data-action="dec" data-team="home" ${isLocked ? 'disabled' : ''}>-</button>
                <span class="admin-score-value">${match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '-'}</span>
                <button class="admin-score-btn" data-action="inc" data-team="home" ${isLocked ? 'disabled' : ''}>+</button>
              </div>
            </div>
            
            <!-- Away Team -->
            <div class="admin-team-row">
              <div class="admin-team-info">
                ${awayTeam.flag}
                <span class="admin-team-name">${awayTeam.name}</span>
              </div>
              <div class="admin-score-adjuster">
                <button class="admin-score-btn" data-action="dec" data-team="away" ${isLocked ? 'disabled' : ''}>-</button>
                <span class="admin-score-value">${match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '-'}</span>
                <button class="admin-score-btn" data-action="inc" data-team="away" ${isLocked ? 'disabled' : ''}>+</button>
              </div>
            </div>
          </div>
          
          <div class="admin-status-container">
            ${isLocked ? `
              <span class="admin-locked-badge">🔒 Oficial</span>
              <span class="admin-status-badge finished">Finalizado</span>
            ` : `
              <div style="display: flex; gap: 8px; align-items: center;">
                <span class="admin-status-badge ${statusClass}" data-action="cycle-status">${statusLabel}</span>
                ${showMinute ? `
                  <div class="admin-live-details">
                    <input type="text" class="admin-minute-input" placeholder="Min'" value="${minuteVal}" data-action="minute-change" maxlength="5">
                  </div>
                ` : ''}
              </div>
              <button class="admin-reset-btn" data-action="reset">Reset</button>
            `}
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
}

function setupAdminHandlers() {
  // Gesto secreto: 5 taps en el título
  let appTitleTapCount = 0;
  let appTitleTapTimeout;
  const appTitleHeader = document.getElementById('app-title-header');
  if (appTitleHeader) {
    appTitleHeader.addEventListener('click', () => {
      appTitleTapCount++;
      clearTimeout(appTitleTapTimeout);
      if (appTitleTapCount >= 5) {
        appTitleTapCount = 0;
        toggleAdminMode();
      } else {
        appTitleTapTimeout = setTimeout(() => {
          appTitleTapCount = 0;
        }, 800);
      }
    });
  }

  // Clic en el badge
  const adminBadge = document.getElementById('admin-badge');
  if (adminBadge) {
    adminBadge.addEventListener('click', () => {
      if (state.adminMode) {
        openAdminPanel();
      }
    });
  }

  // Cerrar modal
  const closeBtn = document.getElementById('admin-modal-close');
  const overlay = document.getElementById('admin-modal-overlay');
  if (closeBtn) closeBtn.addEventListener('click', closeAdminPanel);
  if (overlay) overlay.addEventListener('click', closeAdminPanel);

  // Guardar cambios
  const saveBtn = document.getElementById('admin-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveAdminChanges();
    });
  }

  // Event Delegation para la lista de partidos del admin
  const bodyContainer = document.getElementById('admin-modal-body');
  if (bodyContainer) {
    bodyContainer.addEventListener('click', (e) => {
      const target = e.target;
      const row = target.closest('.admin-match-row');
      if (!row) return;

      const matchId = parseInt(row.dataset.matchId);
      const matchIndex = tempMatches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return;

      const match = tempMatches[matchIndex];
      const officialMatch = INITIAL_MATCHES.find(om => om.id === matchId);
      const isLocked = officialMatch && officialMatch.status === 'finished';

      // 1. Botones +/- de score
      if (target.classList.contains('admin-score-btn')) {
        if (isLocked) return;
        const team = target.dataset.team;
        const action = target.dataset.action;
        const scoreKey = team === 'home' ? 'homeScore' : 'awayScore';
        
        let currentScore = match[scoreKey];
        if (currentScore === null || currentScore === undefined) {
          currentScore = 0;
        }

        if (action === 'inc') {
          match[scoreKey] = currentScore + 1;
        } else if (action === 'dec') {
          match[scoreKey] = Math.max(0, currentScore - 1);
        }

        match.isManual = true; // Marcado como manual

        renderAdminMatchList();
      }

      // 2. Ciclar status
      if (target.dataset.action === 'cycle-status') {
        if (isLocked) return;
        const statuses = ['upcoming', 'live', 'finished'];
        const currentIdx = statuses.indexOf(match.status || 'upcoming');
        const nextIdx = (currentIdx + 1) % statuses.length;
        match.status = statuses[nextIdx];

        if (match.status === 'upcoming') {
          match.homeScore = null;
          match.awayScore = null;
          match.minute = null;
          delete match.isManual; // Vuelve a su estado por defecto
        } else {
          if (match.homeScore === null || match.homeScore === undefined) match.homeScore = 0;
          if (match.awayScore === null || match.awayScore === undefined) match.awayScore = 0;
          if (match.status === 'live' && !match.minute) match.minute = "1'";
          match.isManual = true; // Marcado como manual
        }

        renderAdminMatchList();
      }

      // 3. Reset
      if (target.dataset.action === 'reset') {
        if (isLocked) return;
        const original = INITIAL_MATCHES.find(m => m.id === matchId);
        if (original) {
          tempMatches[matchIndex] = { ...original };
          delete tempMatches[matchIndex].isManual; // Quitar marca manual
          renderAdminMatchList();
        }
      }
    });

    bodyContainer.addEventListener('input', (e) => {
      const target = e.target;
      if (target.dataset.action === 'minute-change') {
        const row = target.closest('.admin-match-row');
        if (!row) return;

        const matchId = parseInt(row.dataset.matchId);
        const match = tempMatches.find(m => m.id === matchId);
        if (match) {
          match.minute = target.value;
          match.isManual = true; // Marcado como manual
        }
      }
    });
  }
}

function saveAdminChanges() {
  state.matches = JSON.parse(JSON.stringify(tempMatches));
  saveState();
  
  if (typeof updateKnockoutTeams === 'function') {
    updateKnockoutTeams();
  }
  
  if (typeof renderActiveTab === 'function') {
    renderActiveTab();
  }

  closeAdminPanel();
}

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initIosInstallPrompt();
  initMatches();
  syncMatchesBySystemTime();
  setupConfettiCanvas();
  setupFavModalHandlers();
  setupNotificationsHandlers();
  setupTriviaHandlers();
  initPullToRefresh();
  initTabRouter();
  renderActiveTab();
  setupProdeInputsListener();
  setupProdeToggleHandler();
  setupLiveSyncHandler();
  setupPwaInstallBtn();
  setupAdminHandlers();

  // Registrar eventos para el modal de instalación de iOS
  const iosCloseBtn = document.getElementById('ios-modal-close');
  const iosOverlay = document.getElementById('ios-modal-overlay');
  if (iosCloseBtn) iosCloseBtn.addEventListener('click', closeIosInstallModal);
  if (iosOverlay) iosOverlay.addEventListener('click', closeIosInstallModal);
});

// PWA Install Event Handler
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.style.display = 'flex';
  }
});

function setupPwaInstallBtn() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      // Si estamos en iOS, abrimos las instrucciones de Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        openIosInstallModal();
        return;
      }

      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado con éxito', reg))
      .catch(err => console.error('Error al registrar Service Worker', err));
  });
}
