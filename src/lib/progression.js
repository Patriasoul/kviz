export const QUIZ_PROGRESSION = {
  croatian: {
    label: "Hrvatski kviz",
    badges: [
      [1, "Početnik Hrvatske", "🇭🇷"], [10, "Poznavatelj", "📜"], [20, "Istraživač Hrvatske", "🦅"],
      [30, "Čuvar baštine", "🏛️"], [40, "Poznavatelj Domovine", "🇭🇷"], [50, "Čuvar Domovine", "🦁"],
      [60, "Učitelj baštine", "📚"], [70, "Čuvar znanja", "🦅"], [80, "Patria znalac", "👑"], [90, "PatriaSoul legenda", "🏆"],
    ],
  },
  city: {
    label: "Brani svoj grad",
    badges: [
      [1, "Prvi stražar", "🏰"], [10, "Branitelj", "⚔️"], [20, "Čuvar grada", "🛡️"], [30, "Ratnik grada", "⚔️"],
      [40, "Vitez grada", "🏰"], [50, "Čuvar tvrđave", "🛡️"], [60, "Veliki branitelj", "⚔️"], [70, "Legenda grada", "🏰"],
      [80, "Patria branitelj", "🛡️"], [90, "PatriaSoul legenda", "🏆"],
    ],
  },
  daily: {
    label: "Dnevni kviz",
    badges: [
      [1, "Prvi korak", "☀️"], [10, "Ustrajni", "🔥"], [20, "Redoviti", "⭐"], [30, "Nepokolebljivi", "🔥"],
      [40, "Majstor kontinuiteta", "⭐"], [50, "Dnevni prvak", "🏆"], [60, "Legenda dana", "☀️"], [70, "Neprekidni niz", "🔥"],
      [80, "Patria vjernik", "⭐"], [90, "PatriaSoul legenda", "🏆"],
    ],
  },
};

export const ACHIEVEMENTS = {
  croatian: [
    ["croatian_first_10", "Prvih 10", "10 točnih odgovora"],
    ["croatian_perfect", "Bez pogreške", "100% rezultat"],
    ["croatian_100_quizzes", "Učenik baštine", "100 odigranih kvizova"],
    ["croatian_90_50", "Poznavatelj Domovine", "50 rezultata od 90% ili više"],
    ["croatian_perfect_10", "Majstor Hrvatske", "10 rezultata sa 100%"],
  ],
  city: [
    ["city_first", "Prvi grad", "Prvi završeni grad"],
    ["city_3", "Tri grada", "3 završena grada"],
    ["city_10", "Deset gradova", "10 završenih gradova"],
    ["city_25", "Čuvar hrvatskih gradova", "25 završenih gradova"],
    ["city_all", "Branitelj Hrvatske", "Svi dostupni gradovi"],
  ],
  daily: [
    ["daily_first", "Prvi dan", "Prvi dnevni kviz"],
    ["daily_7", "7 dana", "Niz od 7 dana"],
    ["daily_30", "30 dana", "Niz od 30 dana"],
    ["daily_100", "100 dana", "Niz od 100 dana"],
    ["daily_365", "365 dana", "Godina kontinuiteta"],
  ],
  patria: [
    ["patria_guardian", "PATRIA SOUL — ČUVAR NASLJEĐA", "Level 50 u sva tri kviza"],
  ],
};

export const XP_RULES = {
  completed: 50,
  correct: 10,
  score80: 25,
  score90: 50,
  perfect: 100,
  daily7: 100,
  daily30: 500,
};

export function calculateQuizXp({ score, total, quizType }) {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  let xp = XP_RULES.completed + score * XP_RULES.correct;
  if (percentage === 100) xp += XP_RULES.perfect;
  else if (percentage >= 90) xp += XP_RULES.score90;
  else if (percentage >= 80) xp += XP_RULES.score80;
  if (quizType === "daily") xp += 25;
  return xp;
}

export function getLevelFromXp(xp = 0) {
  return Math.max(1, Math.floor(Number(xp) / 100) + 1);
}

export function getBadgeForLevel(quizType, level) {
  const badges = QUIZ_PROGRESSION[quizType]?.badges ?? [];
  return [...badges].reverse().find(([requiredLevel]) => level >= requiredLevel) ?? badges[0];
}
