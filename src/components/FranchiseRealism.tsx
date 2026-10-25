"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  Legend,
} from "recharts";
import {
  Building2,
  Trophy,
  Gauge,
  Compass,
  Users,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import {
  LeagueAverageBlock,
  PlayerComparison,
  TeamComparison,
} from "@/types/stats";
import {
  formatDelta,
  getDeltaColorClass,
  getSimilarityBadgeColor,
} from "@/lib/formatters";

interface FranchiseRealismProps {
  teams: TeamComparison[];
  players: PlayerComparison[];
  leagueAverages: {
    anba: LeagueAverageBlock;
    nba: LeagueAverageBlock;
  };
  onInspectPlayer: (id: string) => void;
}

export default function FranchiseRealism({
  teams,
  players,
  leagueAverages,
  onInspectPlayer,
}: FranchiseRealismProps) {
  const [selectedTeamAbbr, setSelectedTeamAbbr] = useState<string>(
    teams[0]?.abbr || "MIL"
  );
  const [confFilter, setConfFilter] = useState<"ALL" | "East" | "West">("ALL");

  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.abbr === selectedTeamAbbr) || teams[0];
  }, [teams, selectedTeamAbbr]);

  const teamRoster = useMemo(() => {
    if (!selectedTeam) return [];
    return players
      .filter((p) => p.anbaTeam === selectedTeam.abbr)
      .sort((a, b) => b.anba.mp - a.anba.mp);
  }, [players, selectedTeam]);

  const filteredTeams = useMemo(() => {
    if (confFilter === "ALL") return teams;
    return teams.filter((t) => t.conference === confFilter);
  }, [teams, confFilter]);

  if (!selectedTeam) return null;

  const macroCards = [
    {
      label: "Anotación Media (PTS)",
      anba: leagueAverages.anba.pts,
      nba: leagueAverages.nba.pts,
      unit: " pts",
      note: "Ritmo ofensivo por partido",
    },
    {
      label: "Volumen Triple (3PA)",
      anba: leagueAverages.anba.fg3a,
      nba: leagueAverages.nba.fg3a,
      unit: " 3PA",
      note: `Tasa 3PAr: ${leagueAverages.anba.fg3aRate}% vs ${leagueAverages.nba.fg3aRate}%`,
    },
    {
      label: "Tiros Libres (FTA)",
      anba: leagueAverages.anba.fta,
      nba: leagueAverages.nba.fta,
      unit: " FTA",
      note: "Faltas de tiro concedidas en motor",
    },
    {
      label: "Rebotes Totales (REB)",
      anba: leagueAverages.anba.trb,
      nba: leagueAverages.nba.trb,
      unit: " reb",
      note: `DRB: ${leagueAverages.anba.drb} (ANBA) vs ${leagueAverages.nba.drb} (NBA)`,
    },
    {
      label: "Asistencias (AST)",
      anba: leagueAverages.anba.ast,
      nba: leagueAverages.nba.ast,
      unit: " ast",
      note: "Circulación de balón por partido",
    },
    {
      label: "Pérdidas (TOV)",
      anba: leagueAverages.anba.tov,
      nba: leagueAverages.nba.tov,
      unit: " per",
      note: "Cuidado de balón en simulador",
    },
  ];

  const teamComparisonChartData = [
    {
      metric: "PTS",
      ANBA: selectedTeam.anba.pts,
      NBA: selectedTeam.nba.pts,
      MediaANBA: leagueAverages.anba.pts,
    },
    {
      metric: "REB",
      ANBA: selectedTeam.anba.trb,
      NBA: selectedTeam.nba.trb,
      MediaANBA: leagueAverages.anba.trb,
    },
    {
      metric: "AST",
      ANBA: selectedTeam.anba.ast,
      NBA: selectedTeam.nba.ast,
      MediaANBA: leagueAverages.anba.ast,
    },
    {
      metric: "3PA",
      ANBA: selectedTeam.anba.fg3a,
      NBA: selectedTeam.nba.fg3a,
      MediaANBA: leagueAverages.anba.fg3a,
    },
    {
      metric: "FTA",
      ANBA: selectedTeam.anba.fta,
      NBA: selectedTeam.nba.fta,
      MediaANBA: leagueAverages.anba.fta,
    },
    {
      metric: "TS%",
      ANBA: selectedTeam.anba.tsPct,
      NBA: selectedTeam.nba.tsPct,
      MediaANBA: leagueAverages.anba.tsPct,
    },
  ];

  const paceSpaceData = useMemo(() => {
    return teams.map((t) => ({
      abbr: t.abbr,
      name: t.name,
      fg3aRate: t.anba.fg3aRate,
      tsPct: t.anba.tsPct,
      pts: t.anba.pts,
      wPct: t.anba.wPct,
      color: t.color,
    }));
  }, [teams]);

  return (
    <div className="space-y-6">
      {/* League-Wide Simulator vs Reality Macro Benchmark */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-500" />
              Radiografía Macro: Media de Equipos ANBA vs. Media NBA Real
            </h3>
            <p className="text-xs text-zinc-500">
              Diferencias estructurales del entorno competitivo de ANBA frente a los promedios oficiales de la NBA.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Promedio de las 30 Franquicias
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {macroCards.map((c) => {
            const diff = c.anba - c.nba;
            return (
              <div
                key={c.label}
                className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3"
              >
                <div className="text-[11px] font-medium text-zinc-500">
                  {c.label}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {c.anba.toFixed(1)}
                  </span>
                  <span className="text-xs text-orange-500 font-semibold">
                    NBA: {c.nba.toFixed(1)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${getDeltaColorClass(
                      diff
                    )}`}
                  >
                    {formatDelta(diff, 1)}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-400 truncate">
                  {c.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Franchise Selector & Team Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Team Spotlight & Bar Comparison */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-white text-sm shadow-sm"
                  style={{ backgroundColor: selectedTeam.color }}
                >
                  {selectedTeam.abbr}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedTeam.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Récord ANBA: {selectedTeam.anba.w}-{selectedTeam.anba.l} (
                    {selectedTeam.anba.wPct}%) · Dif:{" "}
                    {selectedTeam.anba.plusMinus > 0
                      ? `+${selectedTeam.anba.plusMinus}`
                      : selectedTeam.anba.plusMinus}{" "}
                    · NBA Win%: {selectedTeam.nba.wPct}%
                  </p>
                </div>
              </div>

              <select
                value={selectedTeam.abbr}
                onChange={(e) => setSelectedTeamAbbr(e.target.value)}
                aria-label="Seleccionar franquicia ANBA"
                className="text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-800 dark:text-zinc-200"
              >
                {teams.map((t) => (
                  <option key={t.abbr} value={t.abbr}>
                    {t.abbr} — {t.name} ({t.anba.w}-{t.anba.l})
                  </option>
                ))}
              </select>
            </div>

            {/* Exclusive ANBA Team Style Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                  Puntos en la Zona
                </div>
                <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedTeam.anba.paintPts} pts/p
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                  Contraataque
                </div>
                <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedTeam.anba.fastbreakPts} pts/p
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                  Puntos Banquillo
                </div>
                <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {selectedTeam.anba.benchPts} pts/p
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                  Fidelidad Plantilla
                </div>
                <div className="font-mono text-base font-bold text-cyan-500 mt-0.5">
                  {selectedTeam.rosterSimilarity}%
                </div>
              </div>
            </div>

            {/* Grouped Bar Chart: Team ANBA vs Team NBA vs League Average */}
            <div className="h-60 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={teamComparisonChartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
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
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar
                    name={`${selectedTeam.abbr} (ANBA)`}
                    dataKey="ANBA"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    name={`${selectedTeam.abbr} (NBA Real)`}
                    dataKey="NBA"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    name="Media ANBA"
                    dataKey="MediaANBA"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Pace & Space Map of 30 ANBA Franchises */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-500" />
              Mapa «Pace & Space» de Mánagers ANBA
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Eje X: Volumen de Triple (`3PAr%`) · Eje Y: Eficiencia (`TS%`). Haz clic en una franquicia para seleccionarla.
            </p>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, bottom: 20, left: -10 }}>
                <XAxis
                  type="number"
                  dataKey="fg3aRate"
                  name="Tasa de Triples (3PAr%)"
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#3f3f46" }}
                  label={{
                    value: "Frecuencia de Triple 3PAr (%)",
                    position: "bottom",
                    offset: 4,
                    fill: "#71717a",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="tsPct"
                  name="Eficiencia TS%"
                  domain={["dataMin - 1.5", "dataMax + 1.5"]}
                  tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#3f3f46" }}
                />
                <ZAxis type="number" dataKey="wPct" range={[55, 160]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const t = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 shadow-xl">
                        <div className="font-bold">
                          {t.abbr} — {t.name}
                        </div>
                        <div className="font-mono mt-1 space-y-0.5">
                          <div className="text-emerald-400">
                            Victorias ANBA: {t.wPct}%
                          </div>
                          <div>Volumen Triple (3PAr): {t.fg3aRate}%</div>
                          <div>True Shooting (TS%): {t.tsPct}%</div>
                          <div>Puntos/p: {t.pts}</div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={paceSpaceData}
                  onClick={(d: any) => {
                    if (d && d.abbr) setSelectedTeamAbbr(d.abbr);
                  }}
                  className="cursor-pointer"
                >
                  {paceSpaceData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.abbr === selectedTeam.abbr ? "#10b981" : "#06b6d4"
                      }
                      stroke={
                        entry.abbr === selectedTeam.abbr ? "#ffffff" : "none"
                      }
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Selected Franchise Roster Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Plantilla en ANBA de {selectedTeam.name} ({teamRoster.length} jugadores registrados)
            </h3>
            <p className="text-xs text-zinc-500">
              Rendimiento de cada jugador en {selectedTeam.abbr} (ANBA) comparado con su rendimiento real en la NBA.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-2.5 px-4">Jugador</th>
                <th className="py-2.5 px-2">Pos</th>
                <th className="py-2.5 px-2">Equipo NBA</th>
                <th className="py-2.5 px-3 text-right">MIN (A / N)</th>
                <th className="py-2.5 px-3 text-right">PTS (A / N)</th>
                <th className="py-2.5 px-3 text-right">REB (A / N)</th>
                <th className="py-2.5 px-3 text-right">AST (A / N)</th>
                <th className="py-2.5 px-3 text-right">TS% (A / N)</th>
                <th className="py-2.5 px-3 text-right">Δ GmSc</th>
                <th className="py-2.5 px-4 text-right">Fidelidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 text-xs font-mono tabular-nums">
              {teamRoster.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onInspectPlayer(p.id)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                >
                  <td className="py-2.5 px-4 font-sans font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {p.name}
                    <ExternalLink className="w-3 h-3 text-zinc-400 opacity-60" />
                  </td>
                  <td className="py-2.5 px-2 text-zinc-500">{p.pos}</td>
                  <td className="py-2.5 px-2 text-orange-500 font-semibold">
                    {p.nbaTeam}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.anba.mp.toFixed(1)}
                    </span>{" "}
                    / <span className="text-zinc-500">{p.nba.mp.toFixed(1)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.anba.pts.toFixed(1)}
                    </span>{" "}
                    / <span className="text-zinc-500">{p.nba.pts.toFixed(1)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.anba.trb.toFixed(1)}
                    </span>{" "}
                    / <span className="text-zinc-500">{p.nba.trb.toFixed(1)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.anba.ast.toFixed(1)}
                    </span>{" "}
                    / <span className="text-zinc-500">{p.nba.ast.toFixed(1)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.anba.tsPct.toFixed(1)}%
                    </span>{" "}
                    / <span className="text-zinc-500">{p.nba.tsPct.toFixed(1)}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded border font-semibold ${getDeltaColorClass(
                        p.deltas.gameScore
                      )}`}
                    >
                      {formatDelta(p.deltas.gameScore, 2)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded border font-semibold ${getSimilarityBadgeColor(
                        p.similarityScore
                      )}`}
                    >
                      {p.similarityScore.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All 30 Franchises Comparison Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-500" />
              Clasificación Comparativa de las 30 Franquicias (ANBA vs NBA)
            </h3>
          </div>
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-0.5">
            {(["ALL", "East", "West"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setConfFilter(c)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  confFilter === c
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                {c === "ALL" ? "Toda la Liga" : c === "East" ? "Este" : "Oeste"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Franquicia</th>
                <th className="py-3 px-2 text-right">Récord ANBA</th>
                <th className="py-3 px-3 text-right">PTS (ANBA / NBA)</th>
                <th className="py-3 px-3 text-right">FG% (ANBA / NBA)</th>
                <th className="py-3 px-3 text-right">3P% (ANBA / NBA)</th>
                <th className="py-3 px-3 text-right">3PAr% (A / N)</th>
                <th className="py-3 px-3 text-right">REB (A / N)</th>
                <th className="py-3 px-3 text-right">AST (A / N)</th>
                <th className="py-3 px-3 text-right">Zona / Banq</th>
                <th className="py-3 px-4 text-right">Fidelidad Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 text-xs font-mono tabular-nums">
              {filteredTeams.map((t, i) => (
                <tr
                  key={t.abbr}
                  onClick={() => setSelectedTeamAbbr(t.abbr)}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition ${
                    t.abbr === selectedTeam.abbr ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <td className="py-2.5 px-4 font-sans">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-zinc-400 w-4">
                        {i + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {t.name}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {t.abbr}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-zinc-900 dark:text-zinc-100">
                    {t.anba.w}-{t.anba.l} ({t.anba.wPct}%)
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {t.anba.pts}
                    </span>{" "}
                    / <span className="text-orange-500">{t.nba.pts}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {t.anba.fgPct}%
                    </span>{" "}
                    / <span className="text-zinc-500">{t.nba.fgPct}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {t.anba.fg3Pct}%
                    </span>{" "}
                    / <span className="text-zinc-500">{t.nba.fg3Pct}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                      {t.anba.fg3aRate}%
                    </span>{" "}
                    / <span className="text-zinc-500">{t.nba.fg3aRate}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {t.anba.trb} / <span className="text-zinc-500">{t.nba.trb}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {t.anba.ast} / <span className="text-zinc-500">{t.nba.ast}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-500">
                    {t.anba.paintPts} / {t.anba.benchPts}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded border font-semibold ${getSimilarityBadgeColor(
                        t.rosterSimilarity
                      )}`}
                    >
                      {t.rosterSimilarity.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
