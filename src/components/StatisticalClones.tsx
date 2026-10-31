"use client";

import React, { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Dna,
  Search,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { PlayerComparison } from "@/types/stats";

interface StatisticalClonesProps {
  players: PlayerComparison[];
  selectedPlayerId: string;
  onSelectPlayer: (id: string) => void;
  onOpenIn1v1: (id: string) => void;
}

export default function StatisticalClones({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onOpenIn1v1,
}: StatisticalClonesProps) {
  const [mode, setMode] = useState<"anbaToNba" | "nbaToAnba">("anbaToNba");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCloneIndex, setActiveCloneIndex] = useState(0);

  const targetPlayer = useMemo(() => {
    return players.find((p) => p.id === selectedPlayerId) || players[0];
  }, [players, selectedPlayerId]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.anbaTeam.toLowerCase().includes(q) ||
          p.nbaTeam.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [players, searchQuery]);

  if (!targetPlayer) return null;

  const cloneList =
    mode === "anbaToNba"
      ? targetPlayer.clones.nbaRealClones
      : targetPlayer.clones.anbaVirtualClones;

  const activeCloneSummary = cloneList[activeCloneIndex] || cloneList[0];
  const activeCloneFull = useMemo(() => {
    if (!activeCloneSummary) return null;
    return players.find((p) => p.id === activeCloneSummary.id) || null;
  }, [players, activeCloneSummary]);

  const radarComparisonData = useMemo(() => {
    if (!activeCloneFull) return [];
    const baseRadar =
      mode === "anbaToNba" ? targetPlayer.radar.anba : targetPlayer.radar.nba;
    const cloneRadar =
      mode === "anbaToNba"
        ? activeCloneFull.radar.nba
        : activeCloneFull.radar.anba;

    return [
      {
        subject: "Anotación",
        Base: baseRadar.scoring,
        Clon: cloneRadar.scoring,
      },
      {
        subject: "Eficiencia TS%",
        Base: baseRadar.efficiency,
        Clon: cloneRadar.efficiency,
      },
      {
        subject: "Creación",
        Base: baseRadar.playmaking,
        Clon: cloneRadar.playmaking,
      },
      {
        subject: "Rebote",
        Base: baseRadar.rebounding,
        Clon: cloneRadar.rebounding,
      },
      {
        subject: "Defensa",
        Base: baseRadar.defense,
        Clon: cloneRadar.defense,
      },
      {
        subject: "Exterior 3P",
        Base: baseRadar.perimeter,
        Clon: cloneRadar.perimeter,
      },
    ];
  }, [targetPlayer, activeCloneFull, mode]);

  const baseStats =
    mode === "anbaToNba" ? targetPlayer.anba : targetPlayer.nba;
  const cloneStats = activeCloneFull
    ? mode === "anbaToNba"
      ? activeCloneFull.nba
      : activeCloneFull.anba
    : null;

  return (
    <div className="space-y-6">
      {/* Mode Switcher & Search Header */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Dna className="w-4 h-4 text-cyan-500" />
              Motor de Clones Estadísticos (Distancia Euclídea Z-Score Ponderada)
            </h2>
            <p className="text-xs text-zinc-500">
              Cruza los vectores estadísticos (Per-36, TS%, Dieta de Tiro y GameScore) de todos los jugadores para detectar gemelos estadísticos entre ANBA y la NBA real.
            </p>
          </div>

          {/* Bidirectional Mode Switch */}
          <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-1">
            <button
              onClick={() => {
                setMode("anbaToNba");
                setActiveCloneIndex(0);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
                mode === "anbaToNba"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              ¿Como quién juega en ANBA? (ANBA → NBA)
            </button>
            <button
              onClick={() => {
                setMode("nbaToAnba");
                setActiveCloneIndex(0);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
                mode === "nbaToAnba"
                  ? "bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Buscar Molde NBA en ANBA (NBA → ANBA)
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative max-w-xl">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Seleccionar otro jugador para analizar sus clones (ej. Anthony Davis, Jamal Murray, Caruso...)"
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl z-30 divide-y divide-zinc-100 dark:divide-zinc-900">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPlayer(p.id);
                    setSearchQuery("");
                    setActiveCloneIndex(0);
                  }}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {p.name} ({p.anbaTeam})
                  </span>
                  <span className="font-mono text-zinc-500">
                    ANBA: {p.anba.pts} PTS · NBA: {p.nba.pts} PTS
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Top 5 Clones Selector + Side-by-Side Clone Mirror */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Target Player + Top 5 Clones List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Base Player Card */}
          <div className="rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                {mode === "anbaToNba"
                  ? `Versión ANBA (${targetPlayer.anbaTeam})`
                  : `Molde NBA Real (${targetPlayer.nbaTeam})`}
              </span>
              <button
                onClick={() => onOpenIn1v1(targetPlayer.id)}
                className="text-xs text-zinc-400 hover:text-emerald-500 inline-flex items-center gap-1"
              >
                Abrir en 1v1 <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              {targetPlayer.name}
            </h3>
            <p className="text-xs text-zinc-500">
              {targetPlayer.posEs} · {baseStats.mp} MIN/p · GameScore:{" "}
              <strong className="font-mono">{baseStats.gameScore}</strong>
            </p>

            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 font-mono text-center">
              <div>
                <div className="text-[10px] text-zinc-400">PTS</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {baseStats.pts}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400">REB</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {baseStats.trb}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400">AST</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {baseStats.ast}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400">TS%</div>
                <div className="text-sm font-bold text-emerald-500">
                  {baseStats.tsPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Clones Cards */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              {mode === "anbaToNba"
                ? `Los 5 Clones de la NBA Real para ${targetPlayer.name} (ANBA)`
                : `Los 5 Jugadores ANBA que replican a ${targetPlayer.name} (NBA)`}
            </h4>

            <div className="space-y-2">
              {cloneList.map((cl, idx) => {
                const active = idx === activeCloneIndex;
                return (
                  <button
                    key={cl.id}
                    onClick={() => setActiveCloneIndex(idx)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      active
                        ? "border-cyan-500 bg-cyan-500/10 shadow-sm"
                        : "border-zinc-200/70 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          {cl.name}
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {mode === "anbaToNba"
                              ? `NBA: ${cl.nbaTeam}`
                              : `ANBA: ${cl.anbaTeam}`}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          {cl.pts} PTS · {cl.trb} REB · {cl.ast} AST · {cl.tsPct}% TS
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                        {cl.similarity}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Detailed Mirror Comparison between Target & Selected Clone */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm flex flex-col justify-between">
          {activeCloneFull && cloneStats ? (
            <>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-cyan-500 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Comparativa Espejo ({activeCloneSummary.similarity}% Coincidencia Estadística)
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {targetPlayer.name}{" "}
                      <span className="text-emerald-500 font-mono text-sm">
                        ({mode === "anbaToNba" ? "ANBA" : "NBA"})
                      </span>{" "}
                      ≈ {activeCloneFull.name}{" "}
                      <span className="text-cyan-500 font-mono text-sm">
                        ({mode === "anbaToNba" ? "NBA Real" : `ANBA - ${activeCloneFull.anbaTeam}`})
                      </span>
                    </h3>
                  </div>

                  <button
                    onClick={() => onOpenIn1v1(activeCloneFull.id)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition inline-flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                    Inspeccionar a {activeCloneFull.name}
                  </button>
                </div>

                {/* Radar Overlay */}
                <div className="h-64 w-full my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      data={radarComparisonData}
                    >
                      <PolarGrid stroke="#52525b" strokeOpacity={0.35} />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name={`${targetPlayer.name} (${
                          mode === "anbaToNba" ? "ANBA" : "NBA"
                        })`}
                        dataKey="Base"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="#10b981"
                        fillOpacity={0.28}
                      />
                      <Radar
                        name={`${activeCloneFull.name} (${
                          mode === "anbaToNba" ? "NBA" : "ANBA"
                        })`}
                        dataKey="Clon"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fill="#06b6d4"
                        fillOpacity={0.28}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#f4f4f5",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Side by Side Metric Comparison Table */}
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                        <th className="py-2.5 px-4 text-left font-sans">Métrica</th>
                        <th className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                          {targetPlayer.name} ({mode === "anbaToNba" ? "ANBA" : "NBA"})
                        </th>
                        <th className="py-2.5 px-4 text-right text-cyan-600 dark:text-cyan-400">
                          {activeCloneFull.name} ({mode === "anbaToNba" ? "NBA" : "ANBA"})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                      {[
                        { label: "Minutos por Partido (MIN)", a: baseStats.mp, b: cloneStats.mp },
                        { label: "Puntos por Partido (PTS)", a: baseStats.pts, b: cloneStats.pts },
                        { label: "Puntos por 36 Min (PTS/36)", a: baseStats.pts36, b: cloneStats.pts36 },
                        { label: "Rebotes por 36 Min (REB/36)", a: baseStats.trb36, b: cloneStats.trb36 },
                        { label: "Asistencias por 36 Min (AST/36)", a: baseStats.ast36, b: cloneStats.ast36 },
                        { label: "True Shooting (TS%)", a: `${baseStats.tsPct}%`, b: `${cloneStats.tsPct}%` },
                        { label: "Uso Ofensivo (USG%)", a: `${baseStats.usgPct}%`, b: `${cloneStats.usgPct}%` },
                        { label: "Eficiencia Hollinger (PER)", a: baseStats.per, b: cloneStats.per },
                        { label: "Win Shares / 48m (WS/48)", a: baseStats.ws48.toFixed(3), b: cloneStats.ws48.toFixed(3) },
                        { label: "Frecuencia de Triple (3PAr)", a: baseStats.threePar.toFixed(3), b: cloneStats.threePar.toFixed(3) },
                        { label: "GameScore (Hollinger)", a: baseStats.gameScore, b: cloneStats.gameScore },
                      ].map((r) => (
                        <tr key={r.label}>
                          <td className="py-2 px-4 font-sans text-zinc-700 dark:text-zinc-300 font-medium">
                            {r.label}
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {r.a}
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-cyan-600 dark:text-cyan-400">
                            {r.b}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
