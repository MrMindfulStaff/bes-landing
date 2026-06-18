// Founder Ascension — keep in sync with the `levels` table (migration 0023).
export const LEVELS = [
  { level: 1, name: "Newcomer", minXp: 0 },
  { level: 2, name: "Hustler", minXp: 75 },
  { level: 3, name: "Builder", minXp: 200 },
  { level: 4, name: "Operator", minXp: 450 },
  { level: 5, name: "Strategist", minXp: 900 },
  { level: 6, name: "Closer", minXp: 1700 },
  { level: 7, name: "Boss", minXp: 3000 },
  { level: 8, name: "Mogul", minXp: 5500 },
  { level: 9, name: "Legacy", minXp: 10000 },
] as const;

export function levelName(level: number): string {
  return (LEVELS.find((l) => l.level === level) ?? LEVELS[0]).name;
}

type Level = { level: number; name: string; minXp: number };

export function levelProgress(xp: number) {
  let cur: Level = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) cur = l;
  const next = LEVELS.find((l) => l.level === cur.level + 1);
  if (!next) {
    return { level: cur.level, name: cur.name, max: true, have: 0, need: 0, pct: 100, toNext: 0, nextName: "" };
  }
  const have = xp - cur.minXp;
  const need = next.minXp - cur.minXp;
  return {
    level: cur.level,
    name: cur.name,
    nextName: next.name,
    max: false,
    have,
    need,
    pct: Math.min(100, Math.round((have / need) * 100)),
    toNext: next.minXp - xp,
  };
}
