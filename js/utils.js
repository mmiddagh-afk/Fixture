// Convierte un formato de hora de 24h (HH:MM) a AM/PM (H:MM AM/PM)
export function convertToAmPm(timeStr) {
  const [hourStr, minStr] = timeStr.split(':');
  let hour = Number(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // Si es 0, representar como 12
  return `${hour}:${minStr} ${ampm}`;
}

// Formatea fecha y hora en hora Bolivia (UTC-4) de forma inmune a la zona horaria del cliente.
export function formatBoliviaTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);

  // Usamos Date.UTC para evitar desfases locales del navegador del cliente
  const botDate = new Date(Date.UTC(year, month - 1, day, hour, min));

  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const dayName = days[botDate.getUTCDay()];
  const monthName = months[botDate.getUTCMonth()];
  const dayNum = botDate.getUTCDate();

  const formattedTime = convertToAmPm(timeStr);

  return `${dayName} ${dayNum} de ${monthName} · ${formattedTime}`;
}

// Calcula el countdown dinámico hasta un partido
export function getCountdown(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);

  // BOT es UTC-4. Para obtener la hora UTC absoluta sumamos 4 horas
  const kickoffTime = Date.UTC(year, month - 1, day, hour + 4, min);
  const now = Date.now();
  const diff = kickoffTime - now;

  if (diff <= 0) return null;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `En ${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `En ${hours}h ${minutes % 60}m`;
  } else {
    return `En ${minutes}m`;
  }
}

// Calcula las posiciones dinámicas por grupo (incluyendo partidos finalizados y en vivo)
export function calculateGroupStandings(matches, teams) {
  const standings = {};

  // Inicializar grupos con sus equipos vacíos
  Object.keys(teams).forEach(teamCode => {
    const team = teams[teamCode];
    const group = team.group;

    if (!standings[group]) {
      standings[group] = {};
    }

    standings[group][teamCode] = {
      code: teamCode,
      name: team.name,
      flagCode: team.flagCode,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      gd: 0,
      pts: 0
    };
  });

  matches.forEach(match => {
    // Solo consideramos fase de grupos y partidos jugados o en vivo
    if (match.stage === "group" && (match.status === "finished" || match.status === "live")) {
      const group = match.group;
      const home = match.home;
      const away = match.away;
      
      const homeScore = match.homeScore ?? 0;
      const awayScore = match.awayScore ?? 0;

      const homeTeam = standings[group][home];
      const awayTeam = standings[group][away];

      if (homeTeam && awayTeam) {
        homeTeam.pj += 1;
        awayTeam.pj += 1;

        homeTeam.gf += homeScore;
        homeTeam.gc += awayScore;
        awayTeam.gf += awayScore;
        awayTeam.gc += homeScore;

        if (homeScore > awayScore) {
          homeTeam.g += 1;
          homeTeam.pts += 3;
          awayTeam.p += 1;
        } else if (homeScore < awayScore) {
          awayTeam.g += 1;
          awayTeam.pts += 3;
          homeTeam.p += 1;
        } else {
          homeTeam.e += 1;
          homeTeam.pts += 1;
          awayTeam.e += 1;
          awayTeam.pts += 1;
        }

        homeTeam.gd = homeTeam.gf - homeTeam.gc;
        awayTeam.gd = awayTeam.gf - awayTeam.gc;
      }
    }
  });

  // Ordenar standings por grupo
  const sortedStandings = {};
  Object.keys(standings).forEach(group => {
    sortedStandings[group] = Object.values(standings[group]).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts; // 1. Puntos
      if (b.gd !== a.gd) return b.gd - a.gd;     // 2. Diferencia de gol
      if (b.gf !== a.gf) return b.gf - a.gf;     // 3. Goles a favor
      return a.name.localeCompare(b.name);       // 4. Nombre alfabético
    });
  });

  return sortedStandings;
}

// Devuelve desglose detallado para el reloj animado por componentes (Punto 12)
export function getDetailedCountdown(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);

  // BOT es UTC-4. Para obtener la hora UTC absoluta sumamos 4 horas
  const kickoffTime = Date.UTC(year, month - 1, day, hour + 4, min);
  const now = Date.now();
  const diff = kickoffTime - now;

  if (diff <= 0) {
    return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { totalSeconds, days, hours, minutes, seconds };
}

// Calcula estadísticas rápidas globales del torneo (Punto 3)
export function calculateTournamentStats(matches, teams) {
  let playedCount = 0;
  let totalGoals = 0;
  
  const teamGoalsScored = {}; // code -> goals
  const teamGoalsConceded = {}; // code -> goals
  const teamMatchesPlayed = {}; // code -> matches

  // Inicializar para todos los equipos
  Object.keys(teams).forEach(code => {
    teamGoalsScored[code] = 0;
    teamGoalsConceded[code] = 0;
    teamMatchesPlayed[code] = 0;
  });

  let highestScoringMatch = { goals: 0, label: '', homeScore: 0, awayScore: 0 };

  matches.forEach(m => {
    if (m.status === 'finished' || m.status === 'live') {
      playedCount++;
      const hScore = m.homeScore ?? 0;
      const aScore = m.awayScore ?? 0;
      const matchGoals = hScore + aScore;
      totalGoals += matchGoals;

      // Actualizar goles si los equipos no son placeholders
      if (teams[m.home]) {
        teamGoalsScored[m.home] += hScore;
        teamGoalsConceded[m.home] += aScore;
        teamMatchesPlayed[m.home] += 1;
      }
      if (teams[m.away]) {
        teamGoalsScored[m.away] += aScore;
        teamGoalsConceded[m.away] += hScore;
        teamMatchesPlayed[m.away] += 1;
      }

      // Buscar partido con más goles
      if (matchGoals > highestScoringMatch.goals) {
        const hName = teams[m.home] ? teams[m.home].name : m.home;
        const aName = teams[m.away] ? teams[m.away].name : m.away;
        highestScoringMatch = {
          goals: matchGoals,
          label: `${hName} vs ${aName}`,
          homeScore: hScore,
          awayScore: aScore
        };
      }
    }
  });

  // Encontrar el equipo más goleador
  let topScorerTeam = null;
  let maxGoals = -1;
  Object.keys(teamGoalsScored).forEach(code => {
    if (teamGoalsScored[code] > maxGoals) {
      maxGoals = teamGoalsScored[code];
      topScorerTeam = code;
    }
  });

  // Encontrar la mejor defensa (valla menos vencida) de los que jugaron al menos 1 partido
  let bestDefenseTeam = null;
  let minGoalsConceded = 9999;
  Object.keys(teamGoalsConceded).forEach(code => {
    if (teamMatchesPlayed[code] > 0 && teamGoalsConceded[code] < minGoalsConceded) {
      minGoalsConceded = teamGoalsConceded[code];
      bestDefenseTeam = code;
    }
  });

  const avgGoals = playedCount > 0 ? (totalGoals / playedCount).toFixed(2) : '0.00';

  return {
    playedCount,
    totalGoals,
    avgGoals,
    topScorer: topScorerTeam && maxGoals > 0 ? {
      code: topScorerTeam,
      name: teams[topScorerTeam].name,
      flagCode: teams[topScorerTeam].flagCode,
      goals: maxGoals
    } : null,
    bestDefense: bestDefenseTeam ? {
      code: bestDefenseTeam,
      name: teams[bestDefenseTeam].name,
      flagCode: teams[bestDefenseTeam].flagCode,
      conceded: minGoalsConceded,
      played: teamMatchesPlayed[bestDefenseTeam]
    } : null,
    highestScoringMatch: highestScoringMatch.goals > 0 ? highestScoringMatch : null
  };
}

