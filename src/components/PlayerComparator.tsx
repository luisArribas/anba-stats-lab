"use client";

import React, { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Search,
  Sparkles,
  Activity,
  Target,
  Crosshair,
  Users,
  ChevronRight,
  Percent,
} from "lucide-react";
import { PlayerComparison, TeamComparison } from "@/types/stats";
import {
  diagnosePlayer,
  formatDelta,
  getDeltaColorClass,
  getSimilarityBadgeColor,
} from "@/lib/formatters";

interface PlayerComparatorProps {
  players: PlayerComparison[];
  teams: TeamComparison[];
  selectedPlayerId: string;
  onSelectPlayer: (id: string) => void;
  onInspectClones?: (id: string) => void;
  showExtraModules?: boolean;
}

export default function PlayerComparator({
  players,
  teams,
  selectedPlayerId,
  onSelectPlayer,
  onInspectClones,
  showExtraModules = false,
}: PlayerComparatorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [posFilter, setPosFilter] = useState<string>("ALL");
  const [rateMode, setRateMode] = useState<"perGame" | "per36">("perGame");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedPlayer = useMemo(() => {
    return (
      players.find((p) => p.id === selectedPlayerId) ||
      players[0]
    );
  }, [players, selectedPlayerId]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return players.filter((p) => {
      if (teamFilter !== "ALL" && p.anbaTeam !== teamFilter) return false;
      if (posFilter !== "ALL" && p.pos !== posFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.anbaTeam.toLowerCase().includes(q) ||
        p.nbaTeam.toLowerCase().includes(q)
      );
    });
  }, [players, searchQuery, teamFilter, posFilter]);

  const spotlightPresets = useMemo(() => {
    const rot = players.filter((p) => p.anba.mp >= 12 && p.nba.mp >= 12);
    const pool = rot.length >= 4 ? rot : players;
    const highestSim = [...pool].sort((a, b) => b.similarityScore - a.similarityScore)[0];
    const topBoost = [...pool].sort((a, b) => b.deltas.gameScore - a.deltas.gameScore)[0];
    const topDrop = [...pool].sort((a, b) => a.deltas.gameScore - b.deltas.gameScore)[0];
    const topScorer = [...pool].sort((a, b) => b.anba.pts - a.anba.pts)[0];

    return [
      topScorer && { label: `Líder PTS: ${topScorer.name}`, id: topScorer.id, tag: `${topScorer.anba.pts} PTS` },
      highestSim && { label: `Más Fiel: ${highestSim.name}`, id: highestSim.id, tag: `${highestSim.similarityScore}%` },
      topBoost && { label: `Salto ANBA: ${topBoost.name}`, id: topBoost.id, tag: `+${topBoost.deltas.gameScore} GmSc` },
      topDrop && { label: `Salto NBA: ${topDrop.name}`, id: topDrop.id, tag: `${topDrop.deltas.gameScore} GmSc` },
    ].filter(Boolean) as { label: string; id: string; tag: string }[];
  }, [players]);

  if (!selectedPlayer) return null;

  const diagnosis = diagnosePlayer(selectedPlayer);

  const radarData = [
    {
      subject: "Anotación",
      ANBA: selectedPlayer.radar.anba.scoring,
      NBA: selectedPlayer.radar.nba.scoring,
    },
    {
      subject: "Eficiencia",
      ANBA: selectedPlayer.radar.anba.efficiency,
      NBA: selectedPlayer.radar.nba.efficiency,
    },
    {
      subject: "Creación",
      ANBA: selectedPlayer.radar.anba.playmaking,
      NBA: selectedPlayer.radar.nba.playmaking,
    },
    {
      subject: "Rebote",
      ANBA: selectedPlayer.radar.anba.rebounding,
      NBA: selectedPlayer.radar.nba.rebounding,
    },
    {
      subject: "Defensa",
      ANBA: selectedPlayer.radar.anba.defense,
      NBA: selectedPlayer.radar.nba.defense,
    },
    {
      subject: "Triple 3P",
      ANBA: selectedPlayer.radar.anba.perimeter,
      NBA: selectedPlayer.radar.nba.perimeter,
    },
  ];

  const is36 = rateMode === "per36";

  const deltaChartData = [
    {
      metric: is36 ? "PTS/36" : "PTS",
      delta: is36 ? selectedPlayer.deltas.pts36 : selectedPlayer.deltas.pts,
      anba: is36 ? selectedPlayer.anba.pts36 : selectedPlayer.anba.pts,
      nba: is36 ? selectedPlayer.nba.pts36 : selectedPlayer.nba.pts,
    },
    {
      metric: is36 ? "REB/36" : "REB",
      delta: is36 ? selectedPlayer.deltas.trb36 : selectedPlayer.deltas.trb,
      anba: is36 ? selectedPlayer.anba.trb36 : selectedPlayer.anba.trb,
      nba: is36 ? selectedPlayer.nba.trb36 : selectedPlayer.nba.trb,
    },
    {
      metric: is36 ? "AST/36" : "AST",
      delta: is36 ? selectedPlayer.deltas.ast36 : selectedPlayer.deltas.ast,
      anba: is36 ? selectedPlayer.anba.ast36 : selectedPlayer.anba.ast,
      nba: is36 ? selectedPlayer.nba.ast36 : selectedPlayer.nba.ast,
    },
    {
      metric: "GmSc",
      delta: selectedPlayer.deltas.gameScore,
      anba: selectedPlayer.anba.gameScore,
      nba: selectedPlayer.nba.gameScore,
    },
    {
      metric: "TS%",
      delta: selectedPlayer.deltas.tsPct,
      anba: selectedPlayer.anba.tsPct,
      nba: selectedPlayer.nba.tsPct,
    },
    {
      metric: "3P%",
      delta: selectedPlayer.deltas.fg3Pct,
      anba: selectedPlayer.anba.fg3Pct,
      nba: selectedPlayer.nba.fg3Pct,
    },
    {
      metric: "3PAr%",
      delta: selectedPlayer.deltas.fg3aRate,
      anba: selectedPlayer.anba.fg3aRate,
      nba: selectedPlayer.nba.fg3aRate,
    },
  ];

  const statRows: {
    category: string;
    items: {
      label: string;
      shortLabel?: string;
      anba: number;
      nba: number;
      decimals: number;
      max: number;
      suffix?: string;
      invertColor?: boolean;
    }[];
  }[] = [
    {
      category: "Impacto & Uso",
      items: [
        { label: "Partidos Jugados (PJ)", shortLabel: "Partidos (PJ)", anba: selectedPlayer.anba.g, nba: selectedPlayer.nba.g, decimals: 0, max: 82 },
        { label: "Minutos por Partido (MIN)", shortLabel: "Minutos (MIN)", anba: selectedPlayer.anba.mp, nba: selectedPlayer.nba.mp, decimals: 1, max: 40 },
        { label: "GameScore (Hollinger)", shortLabel: "GameScore", anba: selectedPlayer.anba.gameScore, nba: selectedPlayer.nba.gameScore, decimals: 2, max: 32 },
        { label: "True Shooting (TS%)", shortLabel: "True Shooting (TS%)", anba: selectedPlayer.anba.tsPct, nba: selectedPlayer.nba.tsPct, decimals: 1, suffix: "%", max: 75 },
        { label: "Effective FG% (eFG%)", shortLabel: "Effective FG% (eFG%)", anba: selectedPlayer.anba.efgPct, nba: selectedPlayer.nba.efgPct, decimals: 1, suffix: "%", max: 75 },
      ],
    },
    {
      category: is36 ? "Producción Por 36 Minutos" : "Producción Por Partido",
      items: [
        {
          label: is36 ? "Puntos / 36m" : "Puntos (PTS)",
          anba: is36 ? selectedPlayer.anba.pts36 : selectedPlayer.anba.pts,
          nba: is36 ? selectedPlayer.nba.pts36 : selectedPlayer.nba.pts,
          decimals: 2,
          max: 38,
        },
        {
          label: is36 ? "Rebotes Totales / 36m" : "Rebotes Totales (REB)",
          shortLabel: is36 ? "Rebotes / 36m" : "Rebotes (REB)",
          anba: is36 ? selectedPlayer.anba.trb36 : selectedPlayer.anba.trb,
          nba: is36 ? selectedPlayer.nba.trb36 : selectedPlayer.nba.trb,
          decimals: 2,
          max: 16,
        },
        {
          label: "Rebotes Ofensivos (ORB)",
          shortLabel: "Reb. Ofensivos (ORB)",
          anba: selectedPlayer.anba.orb,
          nba: selectedPlayer.nba.orb,
          decimals: 2,
          max: 5,
        },
        {
          label: "Rebotes Defensivos (DRB)",
          shortLabel: "Reb. Defensivos (DRB)",
          anba: selectedPlayer.anba.drb,
          nba: selectedPlayer.nba.drb,
          decimals: 2,
          max: 12,
        },
        {
          label: is36 ? "Asistencias / 36m" : "Asistencias (AST)",
          anba: is36 ? selectedPlayer.anba.ast36 : selectedPlayer.anba.ast,
          nba: is36 ? selectedPlayer.nba.ast36 : selectedPlayer.nba.ast,
          decimals: 2,
          max: 12,
        },
        {
          label: is36 ? "Robos / 36m" : "Robos (STL)",
          anba: is36 ? selectedPlayer.anba.stl36 : selectedPlayer.anba.stl,
          nba: is36 ? selectedPlayer.nba.stl36 : selectedPlayer.nba.stl,
          decimals: 2,
          max: 3.5,
        },
        {
          label: is36 ? "Tapones / 36m" : "Tapones (BLK)",
          anba: is36 ? selectedPlayer.anba.blk36 : selectedPlayer.anba.blk,
          nba: is36 ? selectedPlayer.nba.blk36 : selectedPlayer.nba.blk,
          decimals: 2,
          max: 3.5,
        },
        {
          label: is36 ? "Pérdidas / 36m" : "Pérdidas (TOV)",
          anba: is36 ? selectedPlayer.anba.tov36 : selectedPlayer.anba.tov,
          nba: is36 ? selectedPlayer.nba.tov36 : selectedPlayer.nba.tov,
          decimals: 2,
          max: 5,
          invertColor: true,
        },
      ],
    },
    {
      category: "Volumen y Precisión de Tiro",
      items: [
        { label: "Tiros de Campo Anotados (FGM)", shortLabel: "Tiros Anotados (FGM)", anba: selectedPlayer.anba.fg, nba: selectedPlayer.nba.fg, decimals: 2, max: 14 },
        { label: "Tiros de Campo Intentados (FGA)", shortLabel: "Tiros Intentados (FGA)", anba: selectedPlayer.anba.fga, nba: selectedPlayer.nba.fga, decimals: 2, max: 25 },
        { label: "Porcentaje Tiro de Campo (FG%)", shortLabel: "Acierto Tiro (FG%)", anba: selectedPlayer.anba.fgPct, nba: selectedPlayer.nba.fgPct, decimals: 1, suffix: "%", max: 75 },
        { label: "Triples Anotados (3PM)", shortLabel: "Triples Anot. (3PM)", anba: selectedPlayer.anba.fg3, nba: selectedPlayer.nba.fg3, decimals: 2, max: 6 },
        { label: "Triples Intentados (3PA)", shortLabel: "Triples Int. (3PA)", anba: selectedPlayer.anba.fg3a, nba: selectedPlayer.nba.fg3a, decimals: 2, max: 13 },
        { label: "Porcentaje Triples (3P%)", shortLabel: "Acierto Triple (3P%)", anba: selectedPlayer.anba.fg3Pct, nba: selectedPlayer.nba.fg3Pct, decimals: 1, suffix: "%", max: 60 },
        { label: "Tiros Libres Intentados (FTA)", shortLabel: "Tiros Libres Int. (FTA)", anba: selectedPlayer.anba.fta, nba: selectedPlayer.nba.fta, decimals: 2, max: 12 },
        { label: "Porcentaje Tiros Libres (FT%)", shortLabel: "Acierto Libres (FT%)", anba: selectedPlayer.anba.ftPct, nba: selectedPlayer.nba.ftPct, decimals: 1, suffix: "%", max: 100 },
      ],
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Control & Search Bar — Mobile Friendly */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Player Search & Selector (text-base on mobile prevents iOS Safari zoom!) */}
          <div className="relative flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                placeholder={`Buscar entre ${players.length} jugadores (ej. Booker, Edwards, Maxey...)`}
                className="w-full pl-10 pr-14 py-2.5 text-base sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Borrar
                </button>
              )}
            </div>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 mt-1.5 max-h-72 sm:max-h-80 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl z-30 divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filteredPlayers.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500 text-center">
                      No se encontraron jugadores con ese filtro.
                    </div>
                  ) : (
                    filteredPlayers.slice(0, 45).map((p) => {
                      const active = p.id === selectedPlayer.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSelectPlayer(p.id);
                            setDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/90 transition ${
                            active ? "bg-emerald-500/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt={p.name}
                                className="w-8 h-8 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shrink-0"
                              />
                            ) : (
                              <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                                {p.anbaTeam}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                                <span className="truncate">{p.name}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                  {p.anbaTeam}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-500 truncate">
                                {p.pos} · NBA: {p.nbaTeam} · {p.anba.pts} PTS (A) vs {p.nba.pts} (N)
                              </div>
                            </div>
                          </div>
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded border shrink-0 ${getSimilarityBadgeColor(
                              p.similarityScore
                            )}`}
                          >
                            {p.similarityScore.toFixed(0)}%
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Filters & Rate Mode — Responsive 2-column grid on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <select
                value={teamFilter}
                onChange={(e) => {
                  setTeamFilter(e.target.value);
                  setDropdownOpen(true);
                }}
                aria-label="Filtrar por franquicia ANBA"
                className="w-full sm:w-auto text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-2 text-zinc-700 dark:text-zinc-300 focus:outline-none truncate"
              >
                <option value="ALL">Equipo ANBA (Todos)</option>
                {teams
                  .slice()
                  .sort((a, b) => a.abbr.localeCompare(b.abbr))
                  .map((t) => (
                    <option key={t.abbr} value={t.abbr}>
                      {t.abbr} — {t.name}
                    </option>
                  ))}
              </select>

              <select
                value={posFilter}
                onChange={(e) => {
                  setPosFilter(e.target.value);
                  setDropdownOpen(true);
                }}
                aria-label="Filtrar por posición"
                className="w-full sm:w-auto text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-2 text-zinc-700 dark:text-zinc-300 focus:outline-none truncate"
              >
                <option value="ALL">Posición (Todas)</option>
                <option value="PG">PG — Base</option>
                <option value="SG">SG — Escolta</option>
                <option value="SF">SF — Alero</option>
                <option value="PF">PF — Ala-Pívot</option>
                <option value="C">C — Pívot</option>
              </select>
            </div>

            {/* Per Game vs Per 36 toggle */}
            <div className="grid grid-cols-2 sm:inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-0.5">
              <button
                onClick={() => setRateMode("perGame")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition text-center ${
                  rateMode === "perGame"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                Por Partido
              </button>
              <button
                onClick={() => setRateMode("per36")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition text-center ${
                  rateMode === "per36"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                Por 36 Min
              </button>
            </div>
          </div>
        </div>

        {/* Spotlight Quick Chips — Horizontal scroll on mobile */}
        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-500" /> Destacados:
          </span>
          {spotlightPresets.map((chip) => (
            <button
              key={chip.id + chip.label}
              onClick={() => onSelectPlayer(chip.id)}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition shrink-0 ${
                selectedPlayer.id === chip.id
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-medium"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <span>{chip.label}</span>
              <span className="font-mono text-[10px] opacity-75">({chip.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Player Hero Card — Mobile-Adapted */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center sm:items-start gap-3.5 sm:gap-4">
            {selectedPlayer.avatarUrl && (
              <div className="relative shrink-0">
                <img
                  src={selectedPlayer.avatarUrl}
                  alt={selectedPlayer.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md"
                />
              </div>
            )}

            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ANBA: {selectedPlayer.anbaTeam} ({selectedPlayer.anba.g} PJ)
                </span>
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-mono font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  NBA: {selectedPlayer.nbaTeam} ({selectedPlayer.nba.g} PJ)
                </span>
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {selectedPlayer.posEs} · {selectedPlayer.age}a
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                {selectedPlayer.name}
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                    diagnosis.tone === "emerald"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : diagnosis.tone === "orange"
                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
                      : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
                  }`}
                >
                  {diagnosis.label}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 lg:hidden -mt-2">
            {diagnosis.description}
          </p>

          {/* Key Summary KPIs — Clean 2x2 grid on mobile, 4 cols on tablet/desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 lg:min-w-[520px]">
            <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2.5 sm:p-3">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Índice Fidelidad
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedPlayer.similarityScore.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 truncate">
                Similitud ANBA-NBA
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2.5 sm:p-3">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                GameScore
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
                <span className="font-mono text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPlayer.anba.gameScore.toFixed(1)}
                </span>
                <span className="text-[11px] text-zinc-400">vs</span>
                <span className="font-mono text-xs sm:text-sm font-semibold text-orange-500">
                  {selectedPlayer.nba.gameScore.toFixed(1)}
                </span>
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block font-mono text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border ${getDeltaColorClass(
                    selectedPlayer.deltas.gameScore
                  )}`}
                >
                  {formatDelta(selectedPlayer.deltas.gameScore, 2)} ANBA
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2.5 sm:p-3">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                {is36 ? "Puntos / 36m" : "Puntos / Part."}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
                <span className="font-mono text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {(is36 ? selectedPlayer.anba.pts36 : selectedPlayer.anba.pts).toFixed(1)}
                </span>
                <span className="text-[11px] text-zinc-400">vs</span>
                <span className="font-mono text-xs sm:text-sm font-semibold text-orange-500">
                  {(is36 ? selectedPlayer.nba.pts36 : selectedPlayer.nba.pts).toFixed(1)}
                </span>
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block font-mono text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border ${getDeltaColorClass(
                    is36 ? selectedPlayer.deltas.pts36 : selectedPlayer.deltas.pts
                  )}`}
                >
                  {formatDelta(is36 ? selectedPlayer.deltas.pts36 : selectedPlayer.deltas.pts, 1)} PTS
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2.5 sm:p-3">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                Eficiencia TS%
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
                <span className="font-mono text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPlayer.anba.tsPct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-zinc-400">vs</span>
                <span className="font-mono text-xs sm:text-sm font-semibold text-orange-500">
                  {selectedPlayer.nba.tsPct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block font-mono text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border ${getDeltaColorClass(
                    selectedPlayer.deltas.tsPct
                  )}`}
                >
                  {formatDelta(selectedPlayer.deltas.tsPct, 1, "%")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row: Radar Percentile Footprint + Diverging Delta Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Radar Footprint */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Huella de Percentiles (0–100)</span>
              </h3>
              <div className="flex items-center gap-2.5 text-[11px] sm:text-xs shrink-0">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  ANBA
                </span>
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                  NBA
                </span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-1">
              Percentil de {selectedPlayer.name} frente a la liga en 6 dimensiones.
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#52525b" strokeOpacity={0.35} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#a1a1aa", fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  axisLine={false}
                />
                <Radar
                  name="NBA Real"
                  dataKey="NBA"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="#f97316"
                  fillOpacity={0.2}
                />
                <Radar
                  name="ANBA"
                  dataKey="ANBA"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="#10b981"
                  fillOpacity={0.32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#f4f4f5",
                  }}
                  formatter={(value: number) => [`Percentil ${value.toFixed(0)}`, ""]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-center">
            {radarData.slice(0, 3).map((d) => (
              <div key={d.subject} className="text-xs">
                <div className="text-zinc-400 text-[10px] sm:text-[11px] truncate">{d.subject}</div>
                <div className="font-mono font-semibold mt-0.5 text-[11px] sm:text-xs">
                  <span className="text-emerald-500">P{d.ANBA.toFixed(0)}</span>
                  <span className="text-zinc-500 mx-1">/</span>
                  <span className="text-orange-500">P{d.NBA.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diverging Delta Chart + Shot Diet / Splits */}
        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
          {/* Diverging Delta Bar Chart */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 shadow-sm flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                  Desviación Neta (ANBA menos NBA Real)
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
                  Verde = produce más en ANBA · Naranja = produce menos en ANBA.
                </p>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400">
                Base 0 = Realidad NBA
              </span>
            </div>

            <div className="h-48 sm:h-52 w-full mt-3 sm:mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deltaChartData}
                  margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#3f3f46" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(113, 113, 122, 0.1)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 shadow-xl">
                          <div className="font-bold mb-1">{item.metric}</div>
                          <div className="flex justify-between gap-4 font-mono">
                            <span className="text-emerald-400">ANBA: {item.anba}</span>
                            <span className="text-orange-400">NBA: {item.nba}</span>
                          </div>
                          <div className="mt-1 pt-1 border-t border-zinc-800 font-mono font-semibold">
                            Diferencia: {item.delta > 0 ? `+${item.delta}` : item.delta}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" />
                  <Bar dataKey="delta" radius={[4, 4, 4, 4]}>
                    {deltaChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.delta >= 0 ? "#10b981" : "#f97316"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shot Diet & Shooting Splits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shot Diet Card */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-emerald-500" />
                  Dieta de Tiro (2PA% vs 3PA%)
                </h4>
                <span className="font-mono text-[10px] sm:text-[11px] text-zinc-400">
                  FTr: {selectedPlayer.anba.ftaRate}% / {selectedPlayer.nba.ftaRate}%
                </span>
              </div>

              <div className="space-y-3 mt-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      ANBA ({selectedPlayer.anba.fga} FGA/p)
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {selectedPlayer.anba.fg2aRate}% T2 · {selectedPlayer.anba.fg3aRate}% T3
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex">
                    <div
                      style={{ width: `${selectedPlayer.anba.fg2aRate}%` }}
                      className="bg-emerald-500/70 h-full"
                      title={`Tiros de 2: ${selectedPlayer.anba.fg2aRate}%`}
                    />
                    <div
                      style={{ width: `${selectedPlayer.anba.fg3aRate}%` }}
                      className="bg-cyan-400 h-full"
                      title={`Triples: ${selectedPlayer.anba.fg3aRate}%`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      NBA Real ({selectedPlayer.nba.fga} FGA/p)
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {selectedPlayer.nba.fg2aRate}% T2 · {selectedPlayer.nba.fg3aRate}% T3
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex">
                    <div
                      style={{ width: `${selectedPlayer.nba.fg2aRate}%` }}
                      className="bg-orange-500/70 h-full"
                      title={`Tiros de 2: ${selectedPlayer.nba.fg2aRate}%`}
                    />
                    <div
                      style={{ width: `${selectedPlayer.nba.fg3aRate}%` }}
                      className="bg-amber-300 h-full"
                      title={`Triples: ${selectedPlayer.nba.fg3aRate}%`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shooting Splits Card */}
            {showExtraModules && onInspectClones ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-500" />
                    Equivalente NBA de su versión ANBA
                  </h4>
                  {selectedPlayer.clones.nbaRealClones[0] && (
                    <div className="mt-2.5">
                      <div className="mt-2 flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/70 dark:border-zinc-800">
                        <div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {selectedPlayer.clones.nbaRealClones[0].name}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500">
                            NBA ({selectedPlayer.clones.nbaRealClones[0].nbaTeam}):{" "}
                            {selectedPlayer.clones.nbaRealClones[0].pts} PTS ·{" "}
                            {selectedPlayer.clones.nbaRealClones[0].trb} REB ·{" "}
                            {selectedPlayer.clones.nbaRealClones[0].ast} AST
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                          {selectedPlayer.clones.nbaRealClones[0].similarity}% Match
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onInspectClones(selectedPlayer.id)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline pt-1"
                >
                  Ver los 5 clones estadísticos en detalle
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cyan-500" />
                    Splits de Tiro (2P% / 3P% / FT%)
                  </h4>
                  <span className="font-mono text-[11px] text-zinc-400">
                    ANBA vs NBA
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    {
                      label: "Tiro 2P%",
                      anba: selectedPlayer.anba.fg2Pct,
                      nba: selectedPlayer.nba.fg2Pct,
                    },
                    {
                      label: "Triple 3P%",
                      anba: selectedPlayer.anba.fg3Pct,
                      nba: selectedPlayer.nba.fg3Pct,
                    },
                    {
                      label: "Libres FT%",
                      anba: selectedPlayer.anba.ftPct,
                      nba: selectedPlayer.nba.ftPct,
                    },
                  ].map((s) => {
                    const d = s.anba - s.nba;
                    return (
                      <div
                        key={s.label}
                        className="p-2 sm:p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/70 dark:border-zinc-800 text-center"
                      >
                        <div className="text-[10px] text-zinc-400 truncate">
                          {s.label}
                        </div>
                        <div className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {s.anba.toFixed(1)}%
                        </div>
                        <div className="font-mono text-[10px] sm:text-[11px] text-orange-500">
                          {s.nba.toFixed(1)}%
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block font-mono text-[10px] px-1 py-0.2 rounded border ${getDeltaColorClass(
                              d
                            )}`}
                          >
                            {formatDelta(d, 1, "%")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Side-by-Side Statistical Table — Mobile-First Card Rows + Desktop Grid */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Desglose Estadístico Completo: ANBA vs. NBA Real
            </h3>
            <p className="text-xs text-zinc-500">
              Comparativa métrica a métrica con barras de proporción visual y diferencial exacto.
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ● ANBA ({selectedPlayer.anbaTeam})
            </span>
            <span className="text-orange-600 dark:text-orange-400 font-semibold">
              ● NBA ({selectedPlayer.nbaTeam})
            </span>
          </div>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
          {statRows.map((section) => (
            <div key={section.category} className="p-3.5 sm:p-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
                {section.category}
              </div>
              <div className="space-y-2.5 sm:space-y-2">
                {section.items.map((item) => {
                  const diff = item.anba - item.nba;
                  const pctAnba = Math.min(100, Math.max(2, (item.anba / item.max) * 100));
                  const pctNba = Math.min(100, Math.max(2, (item.nba / item.max) * 100));
                  const suffix = item.suffix || "";

                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-zinc-100 dark:border-zinc-800/40 sm:border-transparent bg-zinc-50/40 dark:bg-zinc-950/30 sm:bg-transparent p-2.5 sm:py-1.5 sm:px-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                    >
                      {/* Mobile Layout (< 640px): Clean 2-Line Broadcast Card */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                            {item.shortLabel || item.label}
                          </span>
                          <span
                            className={`font-mono text-[11px] px-1.5 py-0.5 rounded border font-semibold tabular-nums ${getDeltaColorClass(
                              diff,
                              item.invertColor
                            )}`}
                          >
                            {formatDelta(diff, item.decimals, suffix)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 font-mono text-xs tabular-nums">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 w-14 text-left shrink-0">
                            {item.anba.toFixed(item.decimals)}
                            {suffix}
                          </span>
                          <div className="flex-1 space-y-1">
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pctAnba}%` }}
                                className="h-full bg-emerald-500 rounded-full"
                              />
                            </div>
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pctNba}%` }}
                                className="h-full bg-orange-500 rounded-full"
                              />
                            </div>
                          </div>
                          <span className="font-semibold text-orange-600 dark:text-orange-400 w-14 text-right shrink-0">
                            {item.nba.toFixed(item.decimals)}
                            {suffix}
                          </span>
                        </div>
                      </div>

                      {/* Desktop / Tablet Layout (>= 640px): 12-Col Precision Row */}
                      <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3">
                        <div className="col-span-4 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {item.label}
                        </div>

                        <div className="col-span-5 space-y-1">
                          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pctAnba}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pctNba}%` }}
                              className="h-full bg-orange-500 rounded-full"
                            />
                          </div>
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-2 font-mono text-xs tabular-nums">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 w-14 text-right">
                            {item.anba.toFixed(item.decimals)}
                            {suffix}
                          </span>
                          <span className="text-zinc-400">/</span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400 w-14 text-right">
                            {item.nba.toFixed(item.decimals)}
                            {suffix}
                          </span>
                          <span
                            className={`w-16 text-right px-1.5 py-0.5 rounded border text-[11px] font-semibold ${getDeltaColorClass(
                              diff,
                              item.invertColor
                            )}`}
                          >
                            {formatDelta(diff, item.decimals, suffix)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
