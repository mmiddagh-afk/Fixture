import { TEAMS, INITIAL_MATCHES, TRIVIA_FACTS } from './data.js';
import { formatBoliviaTime, getCountdown, calculateGroupStandings, convertToAmPm, getDetailedCountdown, calculateTournamentStats, formatHeaderDate } from './utils.js';

// ==========================================================================
// ESTADO GLOBAL DE LA APP (PERSISTIDO EN LOCALSTORAGE)
// ==========================================================================
const state = {
  activeTab: 'hoy',
  matches: [],
  teams: TEAMS,
  showAllChronological: false,
  favoriteTeam: localStorage.getItem('fav_team') || null,
  allowNotifications: localStorage.getItem('allow_notifications') === 'true',
  currentTriviaIndex: Math.floor(Math.random() * TRIVIA_FACTS.length),
  isLoading: false
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
// PROGRESIÓN AUTOMÁTICA DE LLAVES (KNOCKOUTS)
// ==========================================================================
function updateKnockoutTeams() {
  const standings = calculateGroupStandings(state.matches, state.teams);
  
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

  // 2. Poblar los Dieciseisavos de Final (ID 73 al 88)
  // Mapeo estándar simplificado para el Mundial de 48
  const round32Pairings = [
    { matchId: 73, home: groupWinners["A"], away: groupRunners["B"] },
    { matchId: 74, home: groupWinners["C"], away: groupRunners["D"] },
    { matchId: 75, home: groupWinners["E"], away: groupRunners["F"] },
    { matchId: 76, home: groupWinners["G"], away: groupRunners["H"] },
    { matchId: 77, home: groupWinners["I"], away: groupRunners["J"] },
    { matchId: 78, home: groupWinners["K"], away: groupRunners["L"] },
    
    { matchId: 79, home: groupWinners["B"], away: groupRunners["A"] },
    { matchId: 80, home: groupWinners["D"], away: groupRunners["C"] },
    { matchId: 81, home: groupWinners["F"], away: groupRunners["E"] },
    { matchId: 82, home: groupWinners["H"], away: groupRunners["G"] },
    { matchId: 83, home: groupWinners["J"], away: groupRunners["I"] },
    { matchId: 84, home: groupWinners["L"], away: groupRunners["K"] },
    
    // Terceros puestos entran en los últimos 4 partidos
    { matchId: 85, home: sortedThirds[0] || "3º Grupo A/B", away: sortedThirds[1] || "3º Grupo C/D" },
    { matchId: 86, home: sortedThirds[2] || "3º Grupo E/F", away: sortedThirds[3] || "3º Grupo G/H" },
    { matchId: 87, home: sortedThirds[4] || "3º Grupo I/J", away: sortedThirds[5] || "3º Grupo K/L" },
    { matchId: 88, home: sortedThirds[6] || "3º Grupo A/C", away: sortedThirds[7] || "3º Grupo B/D" }
  ];

  round32Pairings.forEach(p => {
    const match = state.matches.find(m => m.id === p.matchId);
    if (match && match.status === "upcoming") {
      match.home = p.home;
      match.away = p.away;
      match.isPlaceholder = false;
    }
  });

  // Helper para resolver ganador de una llave
  const getWinner = (matchId) => {
    const m = state.matches.find(match => match.id === matchId);
    if (!m || m.status !== "finished") return null;
    if (m.homeScore > m.awayScore) return m.home;
    if (m.awayScore > m.homeScore) return m.away;
    // Si hay empate en eliminatoria, el home gana por defecto en simulación (penales)
    return m.home;
  };

  const getLoser = (matchId) => {
    const m = state.matches.find(match => match.id === matchId);
    if (!m || m.status !== "finished") return null;
    return m.homeScore > m.awayScore ? m.away : m.home;
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
  } else if (match.status === 'finished') {
    statusHTML = `<span class="match-stage-badge">Finalizado (FT)</span>`;
    scoreHTML = `<span class="score-text">${match.homeScore} - ${match.awayScore}</span>`;
  } else {
    // Upcoming
    const cd = getCountdown(match.date, match.time);
    statusHTML = `<span class="match-time-badge">${formatBoliviaTime(match.date, match.time)}</span>`;
    
    scoreHTML = `
      <div class="match-score-block">
        <span class="score-placeholder">VS</span>
        ${cd ? `<span class="upcoming-countdown">${cd}</span>` : ''}
      </div>
    `;
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
          ${match.status !== 'upcoming' ? scoreHTML : scoreHTML}
        </div>

      </div>
      ${progressHTML}
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

  const standings = calculateGroupStandings(state.matches, state.teams);
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

    const todayISO = new Date().toISOString().split('T')[0];
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
  const standings = calculateGroupStandings(state.matches, state.teams);
  
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
            }

            const scoreHome = m.status !== 'upcoming' ? m.homeScore : '';
            const scoreAway = m.status !== 'upcoming' ? m.awayScore : '';

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
                  <span class="node-score">${scoreHome}</span>
                </div>
                <div class="${awayClass}">
                  <div class="node-flag-name">
                    <span>${away.flag}</span>
                    <span class="node-team-name">${away.name}</span>
                  </div>
                  <span class="node-score">${scoreAway}</span>
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
// SIMULADOR DE PARTIDOS & EVENT HANDLERS
// ==========================================================================
let simSelectedMatchId = 1;

function initSimulator() {
  const select = document.getElementById('sim-match-select');
  
  // Llenar dropdown con los 104 partidos
  select.innerHTML = state.matches.map(m => {
    const h = getTeamDisplay(m.home);
    const a = getTeamDisplay(m.away);
    const label = m.stage === 'group' ? `Gr.${m.group}` : (m.label || `M${m.id}`);
    return `<option value="${m.id}">[${label}] ${h.name} vs ${a.name}</option>`;
  }).join('');

  // Sincronizar campos al cambiar de partido
  select.addEventListener('change', (e) => {
    simSelectedMatchId = Number(e.target.value);
    syncSimulatorFields();
  });

  // Ajustar scores
  document.querySelectorAll('.btn-score-adjust').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const match = state.matches.find(m => m.id === simSelectedMatchId);
      if (!match) return;

      const team = btn.getAttribute('data-team'); // 'home' | 'away'
      const action = btn.getAttribute('data-action'); // 'inc' | 'dec'

      if (match.status === 'upcoming') {
        // Al tocar puntaje pasamos automáticamente a "live" para mejorar UX
        match.status = 'live';
        match.minute = 1;
        match.homeScore = 0;
        match.awayScore = 0;
      }

      const scoreKey = team === 'home' ? 'homeScore' : 'awayScore';
      
      if (action === 'inc') {
        match[scoreKey] = (match[scoreKey] ?? 0) + 1;
        if (window.triggerConfetti) {
          window.triggerConfetti(e.clientX, e.clientY);
        }
      } else {
        match[scoreKey] = Math.max(0, (match[scoreKey] ?? 0) - 1);
      }

      saveState();
      syncSimulatorFields();
      renderActiveTab();
      triggerGoalAnimation();
    });
  });

  // Estado del partido
  const statusSelect = document.getElementById('sim-status-select');
  statusSelect.addEventListener('change', (e) => {
    const match = state.matches.find(m => m.id === simSelectedMatchId);
    if (!match) return;

    match.status = e.target.value;
    
    if (match.status === 'upcoming') {
      match.homeScore = null;
      match.awayScore = null;
      match.minute = null;
    } else {
      if (match.homeScore === null) match.homeScore = 0;
      if (match.awayScore === null) match.awayScore = 0;
      if (match.status === 'live' && !match.minute) match.minute = 1;
    }

    saveState();
    syncSimulatorFields();
    renderActiveTab();
  });

  // Minuto
  document.getElementById('sim-min-inc').addEventListener('click', () => {
    const match = state.matches.find(m => m.id === simSelectedMatchId);
    if (match && match.status === 'live') {
      match.minute = Math.min(90, (match.minute || 0) + 5);
      if (match.minute === 90) {
        match.status = 'finished';
      }
      saveState();
      syncSimulatorFields();
      renderActiveTab();
    }
  });

  document.getElementById('sim-min-dec').addEventListener('click', () => {
    const match = state.matches.find(m => m.id === simSelectedMatchId);
    if (match && match.status === 'live') {
      match.minute = Math.max(1, (match.minute || 0) - 5);
      saveState();
      syncSimulatorFields();
      renderActiveTab();
    }
  });

  // Restablecer Mundial
  document.getElementById('sim-reset').addEventListener('click', () => {
    if (confirm('¿Estás seguro de reiniciar todos los resultados del Mundial a cero?')) {
      state.matches = [...INITIAL_MATCHES];
      saveState();
      
      // Actualizar select de nuevo
      select.value = 1;
      simSelectedMatchId = 1;

      syncSimulatorFields();
      renderActiveTab();
      alert('Mundial restablecido con éxito.');
    }
  });

  syncSimulatorFields();
}

function syncSimulatorFields() {
  const match = state.matches.find(m => m.id === simSelectedMatchId);
  if (!match) return;

  const home = getTeamDisplay(match.home);
  const away = getTeamDisplay(match.away);

  // Flags y nombres
  document.getElementById('sim-home-flag').innerHTML = home.flag;
  document.getElementById('sim-home-name').innerText = home.name;
  document.getElementById('sim-away-flag').innerHTML = away.flag;
  document.getElementById('sim-away-name').innerText = away.name;

  // Scores
  document.getElementById('sim-home-score').innerText = match.homeScore ?? 0;
  document.getElementById('sim-away-score').innerText = match.awayScore ?? 0;

  // Status
  document.getElementById('sim-status-select').value = match.status;

  // Minutos wrapper visibility
  const minWrapper = document.getElementById('sim-minute-wrapper');
  if (match.status === 'live') {
    minWrapper.style.display = 'block';
    document.getElementById('sim-minute-val').innerText = `${match.minute || 1}'`;
  } else {
    minWrapper.style.display = 'none';
  }
}

// Animación de gol
function triggerGoalAnimation() {
  const scoreTargets = document.querySelectorAll('.goal-animate-target');
  scoreTargets.forEach(el => {
    el.classList.add('goal-flash');
    setTimeout(() => el.classList.remove('goal-flash'), 1000);
  });
}

// Drawer Toggle Controls
function setupDrawerEventHandlers() {
  const trigger = document.getElementById('sim-trigger');
  const drawer = document.getElementById('sim-drawer');
  const overlay = document.getElementById('sim-overlay');
  const closeBtn = document.getElementById('sim-close');

  const openDrawer = () => {
    drawer.classList.add('active');
    overlay.classList.add('active');
    // Actualizar nombres de equipos del dropdown por si cambiaron los clasificados
    const select = document.getElementById('sim-match-select');
    const currVal = select.value;
    select.innerHTML = state.matches.map(m => {
      const h = getTeamDisplay(m.home);
      const a = getTeamDisplay(m.away);
      const label = m.stage === 'group' ? `Gr.${m.group}` : (m.label || `M${m.id}`);
      return `<option value="${m.id}">[${label}] ${h.name} vs ${a.name}</option>`;
    }).join('');
    select.value = currVal;
  };

  const closeDrawer = () => {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  };

  trigger.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
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

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initIosInstallPrompt();
  initMatches();
  initSimulator();
  setupDrawerEventHandlers();
  setupConfettiCanvas();
  setupFavModalHandlers();
  setupNotificationsHandlers();
  setupTriviaHandlers();
  initPullToRefresh();
  initTabRouter();
  renderActiveTab();

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

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado con éxito', reg))
      .catch(err => console.error('Error al registrar Service Worker', err));
  });
}
