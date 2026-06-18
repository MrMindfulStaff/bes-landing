"use client";

import { useState, useTransition } from "react";
import { saveLevels, type LevelInput } from "@/lib/admin";

export default function LevelEditor({ initial }: { initial: LevelInput[] }) {
  const [rows, setRows] = useState<LevelInput[]>(
    initial.length ? initial : [{ level: 1, name: "Newcomer", min_xp: 0 }],
  );
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function update(i: number, patch: Partial<LevelInput>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function add() {
    const nextLevel = rows.length ? Math.max(...rows.map((r) => r.level)) + 1 : 1;
    const lastXp = rows.length ? Math.max(...rows.map((r) => r.min_xp)) : 0;
    setRows((r) => [...r, { level: nextLevel, name: "", min_xp: lastXp + 1000 }]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-dark-card border border-dark-border overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_8rem_3rem] gap-3 px-4 py-2 text-xs text-gray-500 border-b border-dark-border">
          <span>Lvl</span>
          <span>Name</span>
          <span>Min XP</span>
          <span />
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[3rem_1fr_8rem_3rem] gap-3 px-4 py-2 items-center border-b border-dark-border last:border-0"
          >
            <input
              type="number"
              value={row.level}
              onChange={(e) => update(i, { level: Number(e.target.value) })}
              className="w-full rounded bg-dark border border-dark-border px-2 py-1.5 text-white focus:border-gold focus:outline-none"
            />
            <input
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Level name"
              className="w-full rounded bg-dark border border-dark-border px-2 py-1.5 text-white focus:border-gold focus:outline-none"
            />
            <input
              type="number"
              value={row.min_xp}
              onChange={(e) => update(i, { min_xp: Number(e.target.value) })}
              className="w-full rounded bg-dark border border-dark-border px-2 py-1.5 text-white focus:border-gold focus:outline-none"
            />
            <button
              onClick={() => remove(i)}
              className="text-gray-500 hover:text-red-400 text-lg"
              title="Remove level"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={add}
          className="rounded-lg border border-dark-border px-4 py-2 text-gray-300 hover:border-gold"
        >
          + Add level
        </button>
        <button
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await saveLevels(rows);
              if (r?.error) setMsg({ ok: false, text: r.error });
              else setMsg({ ok: true, text: "Saved. Member levels recalculated." });
            })
          }
          disabled={pending}
          className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save XP structure"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-gold" : "text-red-400"}`}>{msg.text}</span>
        )}
      </div>
      <p className="text-xs text-gray-500">
        The first level must start at 0 XP. Saving re-derives every member&apos;s level from the
        new thresholds.
      </p>
    </div>
  );
}
