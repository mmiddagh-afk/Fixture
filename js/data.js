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

// ============================================================================
// FIXTURE REAL - FIFA WORLD CUP 2026
// Horarios en hora Bolivia (BOT / UTC-4 = EDT en Junio)
// Datos oficiales de FIFA - actualizado manualmente
// ============================================================================

// Función helper para crear un partido
function m(id, stage, group, date, time, home, away, venue, status = "upcoming", homeScore = null, awayScore = null) {
  return {
    id, stage, group, date, time, home, away, venue,
    status, homeScore, awayScore, minute: null, events: [],
    ...(stage !== "group" ? { label: "", isPlaceholder: true } : {})
  };
}

// Función helper para partido de eliminatoria
function ko(id, stage, label, date, time, venue) {
  return {
    id, stage, label, date, time,
    home: label.includes("Final") ? `Ganador S${id === 104 ? '1' : ''}` : `TBD`,
    away: `TBD`,
    venue, status: "upcoming",
    homeScore: null, awayScore: null,
    minute: null, isPlaceholder: true
  };
}

function generateGroupMatches() {
  return [
    // ======================================================================
    // JORNADA 1 (11-17 Jun) — Datos verificados de fuentes oficiales
    // ======================================================================

    // === 11 de Junio ===
    m(1,  "group", "A", "2026-06-11", "15:00", "MEX", "RSA", "Estadio México City 🇲🇽", "finished", 2, 0),
    m(2,  "group", "A", "2026-06-11", "22:00", "KOR", "CZE", "Estadio Guadalajara 🇲🇽", "finished", 2, 1),

    // === 12 de Junio ===
    m(3,  "group", "B", "2026-06-12", "15:00", "CAN", "BIH", "Toronto Stadium 🇨🇦", "finished", 1, 1),
    m(4,  "group", "D", "2026-06-12", "21:00", "USA", "PAR", "SoFi Stadium, Los Ángeles 🇺🇸", "finished", 4, 1),

    // === 13 de Junio ===
    m(5,  "group", "B", "2026-06-13", "15:00", "QAT", "SUI", "San Francisco Stadium 🇺🇸"),
    m(6,  "group", "C", "2026-06-13", "18:00", "BRA", "MAR", "MetLife Stadium, NY/NJ 🇺🇸"),
    m(7,  "group", "C", "2026-06-13", "21:00", "HAI", "SCO", "Gillette Stadium, Boston 🇺🇸"),

    // === 14 de Junio ===
    m(8,  "group", "D", "2026-06-14", "00:00", "AUS", "TUR", "BC Place, Vancouver 🇨🇦"),
    m(9,  "group", "E", "2026-06-14", "13:00", "GER", "CUW", "NRG Stadium, Houston 🇺🇸"),
    m(10, "group", "F", "2026-06-14", "16:00", "NED", "JPN", "AT&T Stadium, Dallas 🇺🇸"),
    m(11, "group", "F", "2026-06-14", "22:00", "SWE", "TUN", "Estadio BBVA, Monterrey 🇲🇽"),
    m(12, "group", "E", "2026-06-14", "20:00", "CIV", "ECU", "Lincoln Financial Field, Filadelfia 🇺🇸"),

    // === 15 de Junio ===
    m(13, "group", "H", "2026-06-15", "12:00", "ESP", "CPV", "Mercedes-Benz Stadium, Atlanta 🇺🇸"),
    m(14, "group", "G", "2026-06-15", "15:00", "BEL", "EGY", "Lumen Field, Seattle 🇺🇸"),
    m(15, "group", "H", "2026-06-15", "18:00", "KSA", "URU", "Hard Rock Stadium, Miami 🇺🇸"),
    m(16, "group", "G", "2026-06-15", "21:00", "IRN", "NZL", "SoFi Stadium, Los Ángeles 🇺🇸"),

    // === 16 de Junio ===
    m(17, "group", "I", "2026-06-16", "15:00", "FRA", "SEN", "MetLife Stadium, NY/NJ 🇺🇸"),
    m(18, "group", "I", "2026-06-16", "18:00", "IRQ", "NOR", "Gillette Stadium, Boston 🇺🇸"),
    m(19, "group", "J", "2026-06-16", "21:00", "ARG", "ALG", "Arrowhead Stadium, Kansas City 🇺🇸"),

    // === 17 de Junio ===
    m(20, "group", "J", "2026-06-17", "00:00", "AUT", "JOR", "Levi's Stadium, San Francisco 🇺🇸"),
    m(21, "group", "K", "2026-06-17", "13:00", "POR", "COD", "NRG Stadium, Houston 🇺🇸"),
    m(22, "group", "D", "2026-06-17", "15:00", "USA", "AUS", "Lumen Field, Seattle 🇺🇸"),
    m(23, "group", "L", "2026-06-17", "16:00", "ENG", "CRO", "BMO Field, Toronto 🇨🇦"),
    m(24, "group", "L", "2026-06-17", "19:00", "GHA", "PAN", "AT&T Stadium, Dallas 🇺🇸"),
    m(25, "group", "K", "2026-06-17", "22:00", "UZB", "COL", "Estadio Azteca, CDMX 🇲🇽"),

    // ======================================================================
    // JORNADA 2 (18-23 Jun) — Datos verificados de fuentes oficiales
    // ======================================================================

    // === 18 de Junio ===
    m(26, "group", "A", "2026-06-18", "12:00", "CZE", "RSA", "Mercedes-Benz Stadium, Atlanta 🇺🇸"),
    m(27, "group", "B", "2026-06-18", "15:00", "SUI", "BIH", "SoFi Stadium, Los Ángeles 🇺🇸"),
    m(28, "group", "B", "2026-06-18", "18:00", "CAN", "QAT", "BC Place, Vancouver 🇨🇦"),
    m(29, "group", "A", "2026-06-18", "21:00", "MEX", "KOR", "Estadio Guadalajara 🇲🇽"),

    // === 19 de Junio ===
    m(31, "group", "C", "2026-06-19", "18:00", "SCO", "MAR", "Gillette Stadium, Boston 🇺🇸"),
    m(32, "group", "C", "2026-06-19", "21:00", "BRA", "HAI", "Lincoln Financial Field, Filadelfia 🇺🇸"),

    // === 20 de Junio ===
    m(33, "group", "D", "2026-06-20", "00:00", "TUR", "PAR", "Levi's Stadium, San Francisco 🇺🇸"),
    m(34, "group", "F", "2026-06-20", "13:00", "NED", "SWE", "NRG Stadium, Houston 🇺🇸"),
    m(35, "group", "E", "2026-06-20", "16:00", "GER", "CIV", "BMO Field, Toronto 🇨🇦"),
    m(36, "group", "E", "2026-06-20", "20:00", "ECU", "CUW", "Arrowhead Stadium, Kansas City 🇺🇸"),

    // === 21 de Junio ===
    m(37, "group", "F", "2026-06-21", "00:00", "TUN", "JPN", "Estadio BBVA, Monterrey 🇲🇽"),
    m(38, "group", "H", "2026-06-21", "12:00", "ESP", "KSA", "Mercedes-Benz Stadium, Atlanta 🇺🇸"),
    m(39, "group", "G", "2026-06-21", "15:00", "BEL", "IRN", "SoFi Stadium, Los Ángeles 🇺🇸"),
    m(40, "group", "H", "2026-06-21", "18:00", "URU", "CPV", "Hard Rock Stadium, Miami 🇺🇸"),
    m(41, "group", "G", "2026-06-21", "21:00", "NZL", "EGY", "BC Place, Vancouver 🇨🇦"),

    // === 22 de Junio ===
    m(42, "group", "J", "2026-06-22", "13:00", "ARG", "AUT", "AT&T Stadium, Dallas 🇺🇸"),
    m(43, "group", "I", "2026-06-22", "17:00", "FRA", "IRQ", "Lincoln Financial Field, Filadelfia 🇺🇸"),
    m(44, "group", "I", "2026-06-22", "20:00", "NOR", "SEN", "MetLife Stadium, NY/NJ 🇺🇸"),
    m(45, "group", "J", "2026-06-22", "23:00", "JOR", "ALG", "Levi's Stadium, San Francisco 🇺🇸"),

    // === 23 de Junio ===
    m(46, "group", "K", "2026-06-23", "13:00", "POR", "UZB", "NRG Stadium, Houston 🇺🇸"),
    m(47, "group", "L", "2026-06-23", "16:00", "ENG", "GHA", "Gillette Stadium, Boston 🇺🇸"),
    m(48, "group", "L", "2026-06-23", "19:00", "PAN", "CRO", "BMO Field, Toronto 🇨🇦"),

    m(49, "group", "K", "2026-06-23", "21:00", "COL", "COD", "Estadio Guadalajara 🇲🇽"),

    // ======================================================================
    // JORNADA 3 (24-27 Jun) — Última jornada, partidos simultáneos por grupo
    // ======================================================================

    // === 24 de Junio ===
    m(50, "group", "B", "2026-06-24", "15:00", "SUI", "CAN", "BC Place, Vancouver 🇨🇦"),
    m(51, "group", "B", "2026-06-24", "15:00", "BIH", "QAT", "Lumen Field, Seattle 🇺🇸"),
    m(52, "group", "C", "2026-06-24", "18:00", "SCO", "BRA", "Hard Rock Stadium, Miami 🇺🇸"),
    m(53, "group", "C", "2026-06-24", "18:00", "MAR", "HAI", "Mercedes-Benz Stadium, Atlanta 🇺🇸"),
    m(54, "group", "A", "2026-06-24", "21:00", "CZE", "MEX", "Estadio Azteca, CDMX 🇲🇽"),
    m(55, "group", "A", "2026-06-24", "21:00", "RSA", "KOR", "Estadio BBVA, Monterrey 🇲🇽"),

    // === 25 de Junio ===
    m(56, "group", "E", "2026-06-25", "16:00", "ECU", "GER", "MetLife Stadium, NY/NJ 🇺🇸"),
    m(57, "group", "E", "2026-06-25", "16:00", "CUW", "CIV", "Lincoln Financial Field, Filadelfia 🇺🇸"),
    m(58, "group", "F", "2026-06-25", "19:00", "JPN", "SWE", "AT&T Stadium, Dallas 🇺🇸"),
    m(59, "group", "F", "2026-06-25", "19:00", "TUN", "NED", "Arrowhead Stadium, Kansas City 🇺🇸"),
    m(60, "group", "D", "2026-06-25", "22:00", "TUR", "USA", "SoFi Stadium, Los Ángeles 🇺🇸"),
    m(61, "group", "D", "2026-06-25", "22:00", "PAR", "AUS", "Levi's Stadium, San Francisco 🇺🇸"),

    // === 26 de Junio ===
    m(62, "group", "I", "2026-06-26", "15:00", "NOR", "FRA", "Gillette Stadium, Boston 🇺🇸"),
    m(63, "group", "I", "2026-06-26", "15:00", "SEN", "IRQ", "BMO Field, Toronto 🇨🇦"),
    m(64, "group", "H", "2026-06-26", "20:00", "CPV", "KSA", "NRG Stadium, Houston 🇺🇸"),
    m(65, "group", "H", "2026-06-26", "20:00", "URU", "ESP", "Estadio Guadalajara 🇲🇽"),
    m(66, "group", "G", "2026-06-26", "23:00", "EGY", "IRN", "Lumen Field, Seattle 🇺🇸"),
    m(67, "group", "G", "2026-06-26", "23:00", "NZL", "BEL", "BC Place, Vancouver 🇨🇦"),

    // === 27 de Junio ===
    m(68, "group", "L", "2026-06-27", "17:00", "PAN", "ENG", "MetLife Stadium, NY/NJ 🇺🇸"),
    m(69, "group", "L", "2026-06-27", "17:00", "CRO", "GHA", "Lincoln Financial Field, Filadelfia 🇺🇸"),
    m(70, "group", "K", "2026-06-27", "19:30", "COL", "POR", "Hard Rock Stadium, Miami 🇺🇸"),
    m(71, "group", "K", "2026-06-27", "19:30", "COD", "UZB", "Mercedes-Benz Stadium, Atlanta 🇺🇸"),
    m(72, "group", "J", "2026-06-27", "22:00", "ALG", "AUT", "BMO Field, Toronto 🇨🇦"),
    m(30, "group", "J", "2026-06-27", "22:00", "JOR", "ARG", "AT&T Stadium, Dallas 🇺🇸"),
  ];
}

// ============================================================================
// ELIMINATORIAS — Brackets vacíos con fechas reales de FIFA
// ============================================================================
function generateKnockoutMatches() {
  const matches = [];
  let matchId = 73;

  // Dieciseisavos de Final (Round of 32): 16 partidos (ID 73-88) — Jun 28 a Jul 3
  const r32Dates = [
    "2026-06-28", "2026-06-28", "2026-06-28", "2026-06-28",
    "2026-06-29", "2026-06-29", "2026-06-29", "2026-06-29",
    "2026-06-30", "2026-06-30", "2026-06-30", "2026-06-30",
    "2026-07-01", "2026-07-01", "2026-07-01", "2026-07-01"
  ];
  const r32Times = [
    "13:00", "16:00", "19:00", "22:00",
    "13:00", "16:00", "19:00", "22:00",
    "13:00", "16:00", "19:00", "22:00",
    "13:00", "16:00", "19:00", "22:00"
  ];
  const VENUES = [
    "MetLife Stadium, NY/NJ 🇺🇸",
    "SoFi Stadium, Los Ángeles 🇺🇸",
    "AT&T Stadium, Dallas 🇺🇸",
    "Hard Rock Stadium, Miami 🇺🇸",
    "Mercedes-Benz Stadium, Atlanta 🇺🇸",
    "NRG Stadium, Houston 🇺🇸",
    "Lumen Field, Seattle 🇺🇸",
    "BC Place, Vancouver 🇨🇦",
    "Arrowhead Stadium, Kansas City 🇺🇸",
    "Levi's Stadium, San Francisco 🇺🇸",
    "Lincoln Financial Field, Filadelfia 🇺🇸",
    "Gillette Stadium, Boston 🇺🇸",
    "BMO Field, Toronto 🇨🇦",
    "Estadio Azteca, CDMX 🇲🇽",
    "Estadio Guadalajara 🇲🇽",
    "Estadio BBVA, Monterrey 🇲🇽"
  ];

  const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  for (let i = 0; i < 16; i++) {
    matches.push({
      id: matchId++,
      stage: "round32",
      label: `Dieciseisavos (P${i + 1})`,
      date: r32Dates[i],
      time: r32Times[i],
      home: `1º Gr. ${GROUPS[i % 12] || 'A'}`,
      away: `2º Gr. ${GROUPS[(i + 1) % 12] || 'B'}`,
      venue: VENUES[i % VENUES.length],
      status: "upcoming",
      homeScore: null,
      awayScore: null,
      minute: null,
      isPlaceholder: true
    });
  }

  // Octavos de Final (Round of 16): 8 partidos (ID 89-96) — Jul 4-7
  const r16Dates = [
    "2026-07-04", "2026-07-04", "2026-07-05", "2026-07-05",
    "2026-07-06", "2026-07-06", "2026-07-07", "2026-07-07"
  ];
  const r16Times = ["15:00", "19:00", "15:00", "19:00", "15:00", "19:00", "15:00", "19:00"];

  for (let i = 0; i < 8; i++) {
    matches.push({
      id: matchId++,
      stage: "round16",
      label: `Octavos (O${i + 1})`,
      date: r16Dates[i],
      time: r16Times[i],
      home: `Ganador P${i * 2 + 1}`,
      away: `Ganador P${i * 2 + 2}`,
      venue: VENUES[(i + 4) % VENUES.length],
      status: "upcoming",
      homeScore: null,
      awayScore: null,
      minute: null,
      isPlaceholder: true
    });
  }

  // Cuartos de Final: 4 partidos (ID 97-100) — Jul 9-11
  const qfDates = ["2026-07-09", "2026-07-09", "2026-07-10", "2026-07-11"];
  const qfTimes = ["15:00", "19:00", "19:00", "19:00"];
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: matchId++,
      stage: "quarter",
      label: `Cuartos (C${i + 1})`,
      date: qfDates[i],
      time: qfTimes[i],
      home: `Ganador O${i * 2 + 1}`,
      away: `Ganador O${i * 2 + 2}`,
      venue: VENUES[(i + 2) % VENUES.length],
      status: "upcoming",
      homeScore: null,
      awayScore: null,
      minute: null,
      isPlaceholder: true
    });
  }

  // Semifinales: 2 partidos (ID 101-102) — Jul 14 y 15
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

  // Tercer Puesto: 1 partido (ID 103) — Jul 18
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

  // Gran Final: 1 partido (ID 104) — Jul 19
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
