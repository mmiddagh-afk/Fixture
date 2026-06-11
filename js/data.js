// Selecciones participantes del Mundial 2026 (48 equipos)
export const TEAMS = {
  // Grupo A
  MEX: { name: "México", flagCode: "mx", group: "A" },
  RSA: { name: "Sudáfrica", flagCode: "za", group: "A" },
  KOR: { name: "Corea del Sur", flagCode: "kr", group: "A" },
  CZE: { name: "Chequia", flagCode: "cz", group: "A" },
  // Grupo B
  CAN: { name: "Canadá", flagCode: "ca", group: "B" },
  BIH: { name: "Bosnia & Herz.", flagCode: "ba", group: "B" },
  QAT: { name: "Qatar", flagCode: "qa", group: "B" },
  SUI: { name: "Suiza", flagCode: "ch", group: "B" },
  // Grupo C
  BRA: { name: "Brasil", flagCode: "br", group: "C" },
  HAI: { name: "Haití", flagCode: "ht", group: "C" },
  MAR: { name: "Marruecos", flagCode: "ma", group: "C" },
  SCO: { name: "Escocia", flagCode: "gb-sct", group: "C" },
  // Grupo D
  USA: { name: "EE. UU.", flagCode: "us", group: "D" },
  PAR: { name: "Paraguay", flagCode: "py", group: "D" },
  AUS: { name: "Australia", flagCode: "au", group: "D" },
  TUR: { name: "Turquía", flagCode: "tr", group: "D" },
  // Grupo E
  GER: { name: "Alemania", flagCode: "de", group: "E" },
  CUW: { name: "Curazao", flagCode: "cw", group: "E" },
  CIV: { name: "Cote d'Ivoire", flagCode: "ci", group: "E" },
  ECU: { name: "Ecuador", flagCode: "ec", group: "E" },
  // Grupo F
  NED: { name: "Países Bajos", flagCode: "nl", group: "F" },
  JPN: { name: "Japón", flagCode: "jp", group: "F" },
  SWE: { name: "Suecia", flagCode: "se", group: "F" },
  TUN: { name: "Túnez", flagCode: "tn", group: "F" },
  // Grupo G
  BEL: { name: "Bélgica", flagCode: "be", group: "G" },
  EGY: { name: "Egipto", flagCode: "eg", group: "G" },
  IRN: { name: "Irán", flagCode: "ir", group: "G" },
  NZL: { name: "Nueva Zelanda", flagCode: "nz", group: "G" },
  // Grupo H
  ESP: { name: "España", flagCode: "es", group: "H" },
  URU: { name: "Uruguay", flagCode: "uy", group: "H" },
  KSA: { name: "Arabia Saudita", flagCode: "sa", group: "H" },
  CPV: { name: "Cabo Verde", flagCode: "cv", group: "H" },
  // Grupo I
  FRA: { name: "Francia", flagCode: "fr", group: "I" },
  IRQ: { name: "Irak", flagCode: "iq", group: "I" },
  NOR: { name: "Noruega", flagCode: "no", group: "I" },
  SEN: { name: "Senegal", flagCode: "sn", group: "I" },
  // Grupo J
  ARG: { name: "Argentina", flagCode: "ar", group: "J" },
  ALG: { name: "Argelia", flagCode: "dz", group: "J" },
  AUT: { name: "Austria", flagCode: "at", group: "J" },
  JOR: { name: "Jordania", flagCode: "jo", group: "J" },
  // Grupo K
  POR: { name: "Portugal", flagCode: "pt", group: "K" },
  COL: { name: "Colombia", flagCode: "co", group: "K" },
  COD: { name: "RD Congo", flagCode: "cd", group: "K" },
  UZB: { name: "Uzbekistán", flagCode: "uz", group: "K" },
  // Grupo L
  ENG: { name: "Inglaterra", flagCode: "gb-eng", group: "L" },
  CRO: { name: "Croacia", flagCode: "hr", group: "L" },
  GHA: { name: "Ghana", flagCode: "gh", group: "L" },
  PAN: { name: "Panamá", flagCode: "pa", group: "L" }
};

// Sedes de los partidos
const VENUES = [
  "Estadio Azteca, CDMX 🇲🇽",
  "MetLife Stadium, NY/NJ 🇺🇸",
  "BC Place, Vancouver 🇨🇦",
  "SoFi Stadium, Los Ángeles 🇺🇸",
  "Mercedes-Benz Stadium, Atlanta 🇺🇸",
  "Hard Rock Stadium, Miami 🇺🇸",
  "Gillette Stadium, Boston 🇺🇸",
  "AT&T Stadium, Dallas 🇺🇸",
  "Arrowhead Stadium, Kansas City 🇺🇸",
  "NRG Stadium, Houston 🇺🇸",
  "Levi's Stadium, San Francisco 🇺🇸",
  "Lumen Field, Seattle 🇺🇸",
  "Lincoln Financial Field, Filadelfia 🇺🇸",
  "Subaru Park, Filadelfia 🇺🇸",
  "Estadio BBVA, Monterrey 🇲🇽",
  "Estadio Akron, Guadalajara 🇲🇽",
  "BMO Field, Toronto 🇨🇦"
];

// Mapeo de grupos
const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// Función helper para generar los partidos de la fase de grupos programáticamente
function generateGroupMatches() {
  const matches = [];
  let matchId = 1;

  // Fecha de inicio: 11 de Junio, 2026. 
  // Distribución simple de 4 partidos por día para cubrir los 72 partidos en 18 días (del 11 al 28 de junio).
  let currentDate = new Date("2026-06-11T00:00:00-04:00"); // Hora Bolivia inicial

  // Mapeamos los equipos por grupo
  const groupTeams = {};
  GROUPS.forEach(g => {
    groupTeams[g] = Object.keys(TEAMS).filter(t => TEAMS[t].group === g);
  });

  // Los 6 partidos por grupo
  // Emparejamientos estándar en torneos de 4:
  // Jornada 1: 0 vs 1, 2 vs 3
  // Jornada 2: 0 vs 2, 3 vs 1
  // Jornada 3: 3 vs 0, 1 vs 2
  const pairings = [
    { h: 0, a: 1 }, { h: 2, a: 3 },
    { h: 0, a: 2 }, { h: 3, a: 1 },
    { h: 3, a: 0 }, { h: 1, a: 2 }
  ];

  // Generamos por jornadas para mezclar los partidos y que no se juegue todo el Grupo A el primer día
  for (let round = 0; round < 3; round++) {
    for (let gIndex = 0; gIndex < GROUPS.length; gIndex++) {
      const g = GROUPS[gIndex];
      const teams = groupTeams[g];

      // Dos partidos por grupo en cada jornada (round)
      const p1 = pairings[round * 2];
      const p2 = pairings[round * 2 + 1];

      [p1, p2].forEach((p, idx) => {
        const home = teams[p.h];
        const away = teams[p.a];

        // Calcular fecha y hora Bolivia (BOT)
        // Escalamos los partidos del día: 12:00, 15:00, 18:00, 21:00 BOT
        const matchDayOffset = Math.floor((matchId - 1) / 4);
        const matchTimeIndex = (matchId - 1) % 4;
        const times = ["12:00", "15:00", "18:00", "21:00"];

        const matchDate = new Date(currentDate.getTime() + matchDayOffset * 24 * 60 * 60 * 1000);
        const dateString = matchDate.toISOString().split("T")[0];

        matches.push({
          id: matchId++,
          stage: "group",
          group: g,
          date: dateString,
          time: times[matchTimeIndex],
          home: home,
          away: away,
          venue: VENUES[matchId % VENUES.length],
          status: "upcoming", // "upcoming" | "live" | "finished"
          homeScore: null,
          awayScore: null,
          minute: null,
          events: []
        });
      });
    }
  }

  return matches;
}

// Generación de partidos de Eliminatorias (Llaves vacías al inicio)
function generateKnockoutMatches() {
  const matches = [];
  let matchId = 73; // Del 73 al 104

  // Rondas del mundial 2026:
  // Dieciseisavos de Final (Round of 32): 16 partidos (ID 73-88) - Junio 29 a Julio 3
  let date = new Date("2026-06-29T00:00:00-04:00");
  for (let i = 0; i < 16; i++) {
    const dayOffset = Math.floor(i / 4);
    const times = ["14:00", "17:00", "17:00", "20:00"];
    const matchDate = new Date(date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++,
      stage: "round32",
      label: `Dieciseisavos (P${i + 1})`,
      date: matchDate.toISOString().split("T")[0],
      time: times[i % 4],
      home: `1º Gr. ${GROUPS[i % 12] || 'A'}`, // Marcador de posición
      away: `2º Gr. ${GROUPS[(i + 1) % 12] || 'B'}`,
      venue: VENUES[(matchId) % VENUES.length],
      status: "upcoming",
      homeScore: null,
      awayScore: null,
      minute: null,
      isPlaceholder: true // Indica que son marcadores de posición
    });
  }

  // Octavos de Final (Round of 16): 8 partidos (ID 89-96) - Julio 4 a Julio 7
  date = new Date("2026-07-04T00:00:00-04:00");
  for (let i = 0; i < 8; i++) {
    const dayOffset = Math.floor(i / 2);
    const times = ["15:00", "19:00"];
    const matchDate = new Date(date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++,
      stage: "round16",
      label: `Octavos (O${i + 1})`,
      date: matchDate.toISOString().split("T")[0],
      time: times[i % 2],
      home: `Ganador P${i * 2 + 1}`,
      away: `Ganador P${i * 2 + 2}`,
      venue: VENUES[(matchId) % VENUES.length],
      status: "upcoming",
      homeScore: null,
      awayScore: null,
      minute: null,
      isPlaceholder: true
    });
  }

  // Cuartos de Final (Quarterfinals): 4 partidos (ID 97-100) - Julio 9 a Julio 11
  date = new Date("2026-07-09T00:00:00-04:00");
  for (let i = 0; i < 4; i++) {
    const dayOffset = Math.floor(i / 2);
    const times = ["15:00", "19:00"];
    const matchDate = new Date(date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    matches.push({
      id: matchId++,
      stage: "quarter",
      label: `Cuartos (C${i + 1})`,
      date: matchDate.toISOString().split("T")[0],
      time: times[i % 2],
      home: `Ganador O${i * 2 + 1}`,
      away: `Ganador O${i * 2 + 2}`,
      venue: VENUES[(matchId) % VENUES.length],
      status: "upcoming",
      homeScore: null,
      awayScore: null,
      minute: null,
      isPlaceholder: true
    });
  }

  // Semifinales (Semifinals): 2 partidos (ID 101-102) - Julio 14 y 15
  matches.push({
    id: matchId++,
    stage: "semi",
    label: "Semifinal 1",
    date: "2026-07-14",
    time: "19:00",
    home: "Ganador C1",
    away: "Ganador C2",
    venue: "AT&T Stadium, Dallas 🇺🇸",
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    isPlaceholder: true
  });
  matches.push({
    id: matchId++,
    stage: "semi",
    label: "Semifinal 2",
    date: "2026-07-15",
    time: "19:00",
    home: "Ganador C3",
    away: "Ganador C4",
    venue: "Mercedes-Benz Stadium, Atlanta 🇺🇸",
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    isPlaceholder: true
  });

  // Tercer Puesto: 1 partido (ID 103) - Julio 18
  matches.push({
    id: matchId++,
    stage: "third",
    label: "Tercer Puesto",
    date: "2026-07-18",
    time: "15:00",
    home: "Perdedor S1",
    away: "Perdedor S2",
    venue: "Hard Rock Stadium, Miami 🇺🇸",
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    isPlaceholder: true
  });

  // Gran Final: 1 partido (ID 104) - Julio 19
  matches.push({
    id: matchId++,
    stage: "final",
    label: "Gran Final",
    date: "2026-07-19",
    time: "18:00",
    home: "Ganador S1",
    away: "Ganador S2",
    venue: "MetLife Stadium, NY/NJ 🇺🇸",
    status: "upcoming",
    homeScore: null,
    awayScore: null,
    minute: null,
    isPlaceholder: true
  });

  return matches;
}

// Consolidamos la base de datos de partidos iniciales
export const INITIAL_MATCHES = [
  ...generateGroupMatches(),
  ...generateKnockoutMatches()
];

// Curiosidades y trivia histórica de los mundiales (Punto 10)
export const TRIVIA_FACTS = [
  {
    title: "El Primer Campeón",
    text: "Uruguay fue el primer campeón del mundo en 1930, derrotando a Argentina 4-2 en la final disputada en Montevideo."
  },
  {
    title: "La Mayor Goleada",
    text: "El partido con más goles en la historia fue el triunfo de Austria sobre Suiza por 7-5 en el Mundial de Suiza 1954."
  },
  {
    title: "El Rey Pelé",
    text: "Pelé es el único jugador en la historia que ha ganado tres Copas del Mundo como futbolista (1958, 1962 y 1970)."
  },
  {
    title: "El Goleador Histórico",
    text: "El alemán Miroslav Klose es el máximo goleador en la historia de los mundiales con 16 goles anotados en 4 ediciones."
  },
  {
    title: "El Gol Más Rápido",
    text: "Hakan Şükür de Turquía anotó el gol más rápido en la historia a los 11 segundos de juego contra Corea del Sur en 2002."
  },
  {
    title: "El Mundial con Más Sedes",
    text: "El Mundial de 2026 es el primero en la historia en contar con 48 selecciones participantes y 3 países co-organizadores."
  },
  {
    title: "El Partido de los Penales",
    text: "Las tandas de penales se introdujeron en España 1982. El primer partido definido por esta vía fue Alemania Federal vs Francia."
  },
  {
    title: "El Trofeo Actual",
    text: "El trofeo de la Copa del Mundo no se entrega permanentemente a ningún país; el campeón recibe una réplica chapada en oro."
  },
  {
    title: "La Mayor Sorpresa",
    text: "En Brasil 1950, Uruguay protagonizó el 'Maracanazo' al vencer 2-1 al local Brasil en el partido decisivo ante 200,000 personas."
  },
  {
    title: "Maradona en México 86",
    text: "Diego Maradona anotó el 'Gol del Siglo' y la 'Mano de Dios' en el mismo partido de cuartos de final contra Inglaterra en 1986."
  }
];

