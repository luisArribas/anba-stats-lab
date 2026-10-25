"use client";

import React, { useState, useMemo } from "react";
import { PlayerComparison } from "@/types/stats";
import { formatDelta, diagnosePlayer } from "@/lib/formatters";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Search,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Shield,
  Activity,
  Award,
  Flame,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ListOrdered,
  X,
} from "lucide-react";

type RankingSortField = "similarity" | "ptsDelta" | "tsDelta";

interface Props {
  players: PlayerComparison[];
  season: string;
  selectedPlayerId?: string;
  onSelectPlayer?: (id: string) => void;
}

export default function PlayerComparator({
  players,
  season,
  selectedPlayerId: controlledPlayerId,
  onSelectPlayer,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [internalPlayerId, setInternalPlayerId] = useState<string>(
    players[0]?.id || ""
  );
  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  // Estado para el Ranking Global al hacer clic en Similitud, Dif. Puntos o Dif. TS%
  const [showRankingPanel, setShowRankingPanel] = useState(false);
  const [rankingSortField, setRankingSortField] =
    useState<RankingSortField>("similarity");
  const [rankingSortDesc, setRankingSortDesc] = useState<boolean>(true);
  const [rankingMinMinutes, setRankingMinMinutes] = useState<boolean>(false);
  const [rankingSearch, setRankingSearch] = useState<string>("");

  const handleOpenRanking = (field: RankingSortField) => {
    if (showRankingPanel && rankingSortField === field) {
      // Si ya está abierto en esa métrica, invierte el orden (Mayor a Menor <-> Menor a Mayor)
      setRankingSortDesc((prev) => !prev);
    } else {
      setRankingSortField(field);
      setRankingSortDesc(true);
      setShowRankingPanel(true);
    }
  };

  const rankedLeaguePlayers = useMemo(() => {
    const q = rankingSearch.trim().toLowerCase();
    return players
      .filter((p) => {
        if (rankingMinMinutes && (p.anba.mp < 12 || p.nba.mp < 12)) {
          return false;
        }
        if (positionFilter !== "ALL" && !p.pos.includes(positionFilter)) {
          return false;
        }
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.anbaTeam.toLowerCase().includes(q) ||
          p.anbaTeamName.toLowerCase().includes(q) ||
          p.nbaTeam.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (rankingSortField === "similarity") {
          valA = a.similarityScore;
          valB = b.similarityScore;
        } else if (rankingSortField === "ptsDelta") {
          valA = a.deltas.pts;
          valB = b.deltas.pts;
        } else {
          valA = a.deltas.tsPct;
          valB = b.deltas.tsPct;
        }
        return rankingSortDesc ? valB - valA : valA - valB;
      });
  }, [
    players,
    rankingSortField,
    rankingSortDesc,
    rankingMinMinutes,
    positionFilter,
    rankingSearch,
  ]);

  const activePlayerId = controlledPlayerId || internalPlayerId;
  const handleSelectPlayer = (id: string) => {
    setInternalPlayerId(id);
    if (onSelectPlayer) onSelectPlayer(id);
  };

  const selectedPlayer = useMemo(() => {
    return (
      players.find((p) => p.id === activePlayerId) ||
      players[0] ||
      null
    );
  }, [players, activePlayerId]);

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const matchesPos =
          positionFilter === "ALL" || p.pos.includes(positionFilter);
        const q = searchQuery.toLowerCase().trim();
        if (!q) return matchesPos;
        return (
          matchesPos &&
          (p.name.toLowerCase().includes(q) ||
            p.anbaTeam.toLowerCase().includes(q) ||
            p.nbaTeam.toLowerCase().includes(q) ||
            p.anbaTeamName.toLowerCase().includes(q) ||
            p.nbaTeamName.toLowerCase().includes(q))
        );
      })
      .slice(0, 25);
  }, [players, searchQuery, positionFilter]);

  if (!selectedPlayer) return null;

  const diagnosis = diagnosePlayer(selectedPlayer);
  const topClone = selectedPlayer.clones?.nbaRealClones?.[0];

  const radarData = [
    {
      metric: "Anotación",
      ANBA: selectedPlayer.radar.anba.scoring,
      NBA: selectedPlayer.radar.nba.scoring,
    },
    {
      metric: "Creación",
      ANBA: selectedPlayer.radar.anba.playmaking,
      NBA: selectedPlayer.radar.nba.playmaking,
    },
    {
      metric: "Rebote",
      ANBA: selectedPlayer.radar.anba.rebounding,
      NBA: selectedPlayer.radar.nba.rebounding,
    },
    {
      metric: "Defensa",
      ANBA: selectedPlayer.radar.anba.defense,
      NBA: selectedPlayer.radar.nba.defense,
    },
    {
      metric: "Eficiencia",
      ANBA: selectedPlayer.radar.anba.efficiency,
      NBA: selectedPlayer.radar.nba.efficiency,
    },
    {
      metric: "Triple",
      ANBA: selectedPlayer.radar.anba.perimeter,
      NBA: selectedPlayer.radar.nba.perimeter,
    },
  ];

  const shootingSplitsData = [
    {
      name: "TC% (FG%)",
      ANBA: selectedPlayer.anba.fgPct,
      NBA: selectedPlayer.nba.fgPct,
    },
    {
      name: "3P% (Triple)",
      ANBA: selectedPlayer.anba.fg3Pct,
      NBA: selectedPlayer.nba.fg3Pct,
    },
    {
      name: "TL% (FT%)",
      ANBA: selectedPlayer.anba.ftPct,
      NBA: selectedPlayer.nba.ftPct,
    },
    {
      name: "TS% (Real)",
      ANBA: selectedPlayer.anba.tsPct,
      NBA: selectedPlayer.nba.tsPct,
    },
  ];

  const statRows: {
    label: string;
    shortLabel: string;
    anba: number;
    nba: number;
    max: number;
    suffix?: string;
    invertColor?: boolean;
  }[] = [
    {
      label: "Puntos por Partido (PTS)",
      shortLabel: "PTS",
      anba: selectedPlayer.anba.pts,
      nba: selectedPlayer.nba.pts,
      max: 38,
    },
    {
      label: "Rebotes por Partido (REB)",
      shortLabel: "REB",
      anba: selectedPlayer.anba.trb,
      nba: selectedPlayer.nba.trb,
      max: 16,
    },
    {
      label: "Asistencias por Partido (AST)",
      shortLabel: "AST",
      anba: selectedPlayer.anba.ast,
      nba: selectedPlayer.nba.ast,
      max: 13,
    },
    {
      label: "Robos por Partido (STL)",
      shortLabel: "STL",
      anba: selectedPlayer.anba.stl,
      nba: selectedPlayer.nba.stl,
      max: 3.0,
    },
    {
      label: "Tapones por Partido (BLK)",
      shortLabel: "BLK",
      anba: selectedPlayer.anba.blk,
      nba: selectedPlayer.nba.blk,
      max: 3.8,
    },
    {
      label: "Triples Anotados (3PM)",
      shortLabel: "3PM",
      anba: selectedPlayer.anba.fg3,
      nba: selectedPlayer.nba.fg3,
      max: 5.5,
    },
    {
      label: "Minutos por Partido (MIN)",
      shortLabel: "MIN",
      anba: selectedPlayer.anba.mp,
      nba: selectedPlayer.nba.mp,
      max: 40,
    },
    {
      label: "Pérdidas por Partido (TOV)",
      shortLabel: "TOV",
      anba: selectedPlayer.anba.tov,
      nba: selectedPlayer.nba.tov,
      max: 5.5,
      invertColor: true,
    },
    {
      label: "True Shooting (TS%)",
      shortLabel: "TS%",
      anba: selectedPlayer.anba.tsPct,
      nba: selectedPlayer.nba.tsPct,
      max: 75,
      suffix: "%",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Search & Quick Selector Bar */}
      <div className="bg-[#161a23] border border-[#262c3b] rounded-xl p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
          {/* Search Input Dropdown */}
          <div className="relative flex-1">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b9099] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder={`Buscar jugador o equipo en ${season} (${players.length} jugadores)...`}
                className="w-full bg-[#0f1219] border border-[#262c3b] focus:border-[#4d84e2] rounded-lg pl-10 pr-8 py-2.5 text-base sm:text-sm text-[#eceef2] placeholder:text-[#8b9099] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b9099] hover:text-[#eceef2] p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute z-40 left-0 right-0 mt-1.5 bg-[#161a23] border border-[#262c3b] rounded-xl shadow-2xl max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-[#262c3b]/60">
                {filteredPlayers.length === 0 ? (
                  <div className="p-4 text-sm text-[#8b9099] text-center">
                    No se encontraron jugadores con ese criterio.
                  </div>
                ) : (
                  filteredPlayers.map((p) => (
                    <button
                      key={p.id}
                      onMouseDown={() => {
                        handleSelectPlayer(p.id);
                        setSearchQuery("");
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 text-left hover:bg-[#4d84e2]/10 transition-colors ${
                        p.id === selectedPlayer.id ? "bg-[#16233a]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0f1219] text-[#8b9099] border border-[#262c3b] shrink-0">
                          {p.pos}
                        </span>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-[#eceef2] truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-[#8b9099] truncate">
                            ANBA:{" "}
                            <span className="text-[#4d84e2] font-medium">
                              {p.anbaTeamName}
                            </span>{" "}
                            · NBA:{" "}
                            <span className="text-[#c9a84c] font-medium">
                              {p.nbaTeam}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs shrink-0 ml-2">
                        <span className="text-[#4d84e2] font-bold">
                          {p.anba.pts.toFixed(1)}
                        </span>
                        <span className="text-[#8b9099] mx-1">vs</span>
                        <span className="text-[#c9a84c] font-bold">
                          {p.nba.pts.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-[#8b9099] block">
                          PTS
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Position Filter Pills */}
          <div className="flex items-center gap-1 bg-[#0f1219] p-1 rounded-lg border border-[#262c3b] overflow-x-auto no-scrollbar">
            {["ALL", "PG", "SG", "SF", "PF", "C"].map((pos) => (
              <button
                key={pos}
                onClick={() => setPositionFilter(pos)}
                className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  positionFilter === pos
                    ? "bg-[#4d84e2] text-white"
                    : "text-[#8b9099] hover:text-[#eceef2]"
                }`}
              >
                {pos === "ALL" ? "Todos" : pos}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Star Chips (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-[#262c3b]/70 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#8b9099] font-semibold shrink-0 mr-0.5">
            Destacados {season}:
          </span>
          {players.slice(0, 12).map((p) => {
            const active = p.id === selectedPlayer.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPlayer(p.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors shrink-0 border ${
                  active
                    ? "bg-[#16233a] border-[#4d84e2]/50 text-[#eceef2]"
                    : "bg-[#0f1219] border-[#262c3b] text-[#8b9099] hover:text-[#eceef2] hover:border-[#8b9099]/40"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Player Hero Banner & Summary KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Player Identity Card */}
        <div className="lg:col-span-5 bg-[#161a23] border border-[#262c3b] rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#16233a] text-[#7ab3ff] border border-[#4d84e2]/30">
                {selectedPlayer.pos} · {selectedPlayer.posEs}
              </span>
              {selectedPlayer.age > 0 && (
                <span className="text-xs text-[#8b9099]">
                  {selectedPlayer.age} años
                </span>
              )}
              <span className="ml-auto text-[11px] font-mono text-[#8b9099] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#4d84e2]" />
                {season}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              {selectedPlayer.avatarUrl ? (
                <img
                  src={selectedPlayer.avatarUrl}
                  alt={selectedPlayer.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover object-top bg-[#0f1219] border border-[#262c3b] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#eceef2] truncate">
                  {selectedPlayer.name}
                </h2>
                <p className="text-xs text-[#8b9099] mt-0.5 truncate">
                  {diagnosis.label}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-[#262c3b]">
              <div className="bg-[#0f1219] rounded-lg p-2.5 border border-[#262c3b]">
                <span className="text-[10px] uppercase tracking-wider text-[#4d84e2] font-bold block">
                  Equipo ANBA 2K
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#eceef2] mt-0.5 truncate">
                  {selectedPlayer.anbaTeamName}
                </p>
                <p className="text-[11px] text-[#8b9099] font-mono mt-0.5">
                  {selectedPlayer.anba.g} PJ · {selectedPlayer.anba.mp} MIN
                </p>
              </div>

              <div className="bg-[#0f1219] rounded-lg p-2.5 border border-[#262c3b]">
                <span className="text-[10px] uppercase tracking-wider text-[#c9a84c] font-bold block">
                  Equipo NBA Real
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#eceef2] mt-0.5 truncate">
                  {selectedPlayer.nbaTeamName || selectedPlayer.nbaTeam}
                </p>
                <p className="text-[11px] text-[#8b9099] font-mono mt-0.5">
                  {selectedPlayer.nba.g} PJ · {selectedPlayer.nba.mp} MIN
                </p>
              </div>
            </div>
          </div>

          {/* Nearest Statistical Clone Pill */}
          {topClone && (
            <div className="mt-3.5 pt-3 border-t border-[#262c3b] flex items-center justify-between text-xs gap-2">
              <span className="text-[#8b9099] flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
                En ANBA rinde como:
              </span>
              <span className="font-semibold text-[#eceef2] bg-[#0f1219] px-2.5 py-1 rounded-md border border-[#262c3b] truncate">
                {topClone.name}{" "}
                <span className="text-[#5ee89a] font-mono text-[11px]">
                  ({topClone.similarity}% sim)
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 4 Summary Metric Cards (2x2 on Mobile, 4 cols on Desktop) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Fidelidad Global (Clickable Ranking Trigger) */}
          <button
            type="button"
            onClick={() => handleOpenRanking("similarity")}
            className={`bg-[#161a23] border rounded-xl p-3.5 sm:p-4 flex flex-col justify-between text-left transition-all group cursor-pointer ${
              showRankingPanel && rankingSortField === "similarity"
                ? "border-[#4d84e2] bg-[#16233a]/40 shadow-md"
                : "border-[#262c3b] hover:border-[#4d84e2]/60 hover:bg-[#16233a]/20"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8b9099] group-hover:text-[#eceef2] transition-colors">
                Similitud
              </span>
              <Award className="w-4 h-4 text-[#4d84e2] shrink-0" />
            </div>
            <div className="my-1.5 sm:my-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-[#eceef2]">
                {selectedPlayer.similarityScore.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1 w-full">
              <div className="text-[11px] text-[#8b9099] truncate">
                {selectedPlayer.similarityScore >= 80 ? (
                  <span className="text-[#5ee89a] font-medium">
                    Alta fidelidad 2K
                  </span>
                ) : selectedPlayer.similarityScore >= 55 ? (
                  <span className="text-[#7ab3ff] font-medium">
                    Desviación moderada
                  </span>
                ) : (
                  <span className="text-[#f6c453] font-medium">
                    Rol distinto en 2K
                  </span>
                )}
              </div>
              <div className="text-[10px] font-semibold text-[#4d84e2] flex items-center gap-1 pt-1 border-t border-[#262c3b]/70">
                <ListOrdered className="w-3 h-3" />
                <span>Ver ranking liga →</span>
              </div>
            </div>
          </button>

          {/* Diferencial de Puntos (Clickable Ranking Trigger) */}
          <button
            type="button"
            onClick={() => handleOpenRanking("ptsDelta")}
            className={`bg-[#161a23] border rounded-xl p-3.5 sm:p-4 flex flex-col justify-between text-left transition-all group cursor-pointer ${
              showRankingPanel && rankingSortField === "ptsDelta"
                ? "border-[#4d84e2] bg-[#16233a]/40 shadow-md"
                : "border-[#262c3b] hover:border-[#4d84e2]/60 hover:bg-[#16233a]/20"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8b9099] group-hover:text-[#eceef2] transition-colors">
                Dif. Puntos
              </span>
              <Flame className="w-4 h-4 text-[#c9a84c] shrink-0" />
            </div>
            <div className="my-1.5 sm:my-2 flex items-baseline gap-1.5">
              <span
                className={`text-2xl sm:text-3xl font-mono font-black ${
                  selectedPlayer.deltas.pts > 0.5
                    ? "text-[#5ee89a]"
                    : selectedPlayer.deltas.pts < -0.5
                    ? "text-[#f85149]"
                    : "text-[#eceef2]"
                }`}
              >
                {formatDelta(selectedPlayer.deltas.pts, 1)}
              </span>
              <span className="text-[10px] text-[#8b9099] font-mono">PTS</span>
            </div>
            <div className="space-y-1 w-full">
              <div className="text-[11px] text-[#8b9099] font-mono">
                <span className="text-[#4d84e2] font-semibold">
                  {selectedPlayer.anba.pts.toFixed(1)}
                </span>{" "}
                vs{" "}
                <span className="text-[#c9a84c] font-semibold">
                  {selectedPlayer.nba.pts.toFixed(1)}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-[#4d84e2] flex items-center gap-1 pt-1 border-t border-[#262c3b]/70">
                <ListOrdered className="w-3 h-3" />
                <span>Ver ranking liga →</span>
              </div>
            </div>
          </button>

          {/* Diferencial Eficiencia TS% (Clickable Ranking Trigger) */}
          <button
            type="button"
            onClick={() => handleOpenRanking("tsDelta")}
            className={`bg-[#161a23] border rounded-xl p-3.5 sm:p-4 flex flex-col justify-between text-left transition-all group cursor-pointer ${
              showRankingPanel && rankingSortField === "tsDelta"
                ? "border-[#4d84e2] bg-[#16233a]/40 shadow-md"
                : "border-[#262c3b] hover:border-[#4d84e2]/60 hover:bg-[#16233a]/20"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8b9099] group-hover:text-[#eceef2] transition-colors">
                Dif. TS%
              </span>
              <Activity className="w-4 h-4 text-[#5ee89a] shrink-0" />
            </div>
            <div className="my-1.5 sm:my-2 flex items-baseline gap-1">
              <span
                className={`text-2xl sm:text-3xl font-mono font-black ${
                  selectedPlayer.deltas.tsPct > 0.5
                    ? "text-[#5ee89a]"
                    : selectedPlayer.deltas.tsPct < -0.5
                    ? "text-[#f85149]"
                    : "text-[#eceef2]"
                }`}
              >
                {formatDelta(selectedPlayer.deltas.tsPct, 1, "%")}
              </span>
            </div>
            <div className="space-y-1 w-full">
              <div className="text-[11px] text-[#8b9099] font-mono">
                <span className="text-[#4d84e2] font-semibold">
                  {selectedPlayer.anba.tsPct.toFixed(1)}%
                </span>{" "}
                vs{" "}
                <span className="text-[#c9a84c] font-semibold">
                  {selectedPlayer.nba.tsPct.toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] font-semibold text-[#4d84e2] flex items-center gap-1 pt-1 border-t border-[#262c3b]/70">
                <ListOrdered className="w-3 h-3" />
                <span>Ver ranking liga →</span>
              </div>
            </div>
          </button>

          {/* Muestra de Partidos Temporada */}
          <div className="bg-[#161a23] border border-[#262c3b] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8b9099]">
                Partidos {season}
              </span>
              <Shield className="w-4 h-4 text-[#7ab3ff] shrink-0" />
            </div>
            <div className="my-1.5 sm:my-2 flex items-baseline gap-1.5 font-mono">
              <span className="text-xl sm:text-2xl font-black text-[#4d84e2]">
                {selectedPlayer.anba.g}
              </span>
              <span className="text-xs text-[#8b9099]">ANBA</span>
              <span className="text-[#8b9099]">/</span>
              <span className="text-xl sm:text-2xl font-black text-[#c9a84c]">
                {selectedPlayer.nba.g}
              </span>
              <span className="text-xs text-[#8b9099]">NBA</span>
            </div>
            <div className="text-[11px] text-[#8b9099] truncate">
              {selectedPlayer.deltas.gameScore > 2.5 ? (
                <span className="text-[#5ee89a] font-medium">
                  ↑ Rinde más en ANBA
                </span>
              ) : selectedPlayer.deltas.gameScore < -2.5 ? (
                <span className="text-[#f85149] font-medium">
                  ↓ Rinde menos en ANBA
                </span>
              ) : (
                <span className="text-[#8b9099]">Rendimiento parejo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable League-Wide Ranking Table (Similitud / Dif. Puntos / Dif. TS%) */}
      {showRankingPanel && (
        <div className="bg-[#161a23] border border-[#4d84e2]/50 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#262c3b]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#16233a] text-[#4d84e2] border border-[#4d84e2]/30">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#eceef2] uppercase tracking-wider">
                    Ranking de Toda la Liga ({season})
                  </h3>
                  <p className="text-xs text-[#8b9099]">
                    Haz clic en cualquier jugador para cargarlo en el comparador ({rankedLeaguePlayers.length} jugadores)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRankingPanel(false)}
                className="lg:hidden p-1.5 rounded-lg bg-[#0f1219] text-[#8b9099] hover:text-[#eceef2] border border-[#262c3b]"
                title="Cerrar ranking"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controles de Ordenación y Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Selector de Métrica */}
              <div className="flex items-center bg-[#0f1219] p-1 rounded-lg border border-[#262c3b]">
                {[
                  { id: "similarity" as RankingSortField, label: "Similitud %" },
                  { id: "ptsDelta" as RankingSortField, label: "Dif. Puntos" },
                  { id: "tsDelta" as RankingSortField, label: "Dif. TS%" },
                ].map((tab) => {
                  const active = rankingSortField === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRankingSortField(tab.id)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        active
                          ? "bg-[#4d84e2] text-white"
                          : "text-[#8b9099] hover:text-[#eceef2]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Botón Invertir Orden (Mayor a Menor / Menor a Mayor) */}
              <button
                type="button"
                onClick={() => setRankingSortDesc((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f1219] hover:bg-[#16233a] text-xs font-semibold text-[#eceef2] border border-[#262c3b] transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#4d84e2]" />
                <span>
                  {rankingSortDesc ? "Mayor a Menor ↓" : "Menor a Mayor ↑"}
                </span>
              </button>

              {/* Filtro Rotación >= 12 min */}
              <button
                type="button"
                onClick={() => setRankingMinMinutes((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  rankingMinMinutes
                    ? "bg-[#16233a] border-[#4d84e2]/50 text-[#7ab3ff]"
                    : "bg-[#0f1219] border-[#262c3b] text-[#8b9099] hover:text-[#eceef2]"
                }`}
              >
                ≥ 12 MIN
              </button>

              {/* Buscador rápido dentro de la lista */}
              <input
                type="text"
                value={rankingSearch}
                onChange={(e) => setRankingSearch(e.target.value)}
                placeholder="Filtrar nombre/equipo..."
                className="bg-[#0f1219] border border-[#262c3b] focus:border-[#4d84e2] rounded-lg px-2.5 py-1.5 text-xs text-[#eceef2] placeholder:text-[#8b9099] focus:outline-none w-36 sm:w-44"
              />

              {/* Cerrar en Desktop */}
              <button
                type="button"
                onClick={() => setShowRankingPanel(false)}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0f1219] hover:bg-[#262c3b] text-xs text-[#8b9099] hover:text-[#eceef2] border border-[#262c3b] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>

          {/* Tabla Scrollable */}
          <div className="max-h-96 overflow-y-auto rounded-lg border border-[#262c3b] bg-[#0f1219]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#161a23] border-b border-[#262c3b] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8b9099]">
                <tr>
                  <th className="py-2.5 px-2.5 sm:px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-2 sm:px-3">Jugador</th>
                  <th
                    onClick={() => handleOpenRanking("similarity")}
                    className={`py-2.5 px-2 sm:px-3 text-right cursor-pointer hover:text-[#eceef2] ${
                      rankingSortField === "similarity" ? "text-[#4d84e2]" : ""
                    }`}
                  >
                    Similitud {rankingSortField === "similarity" && (rankingSortDesc ? "↓" : "↑")}
                  </th>
                  <th
                    onClick={() => handleOpenRanking("ptsDelta")}
                    className={`py-2.5 px-2 sm:px-3 text-right cursor-pointer hover:text-[#eceef2] ${
                      rankingSortField === "ptsDelta" ? "text-[#4d84e2]" : ""
                    }`}
                  >
                    Dif. PTS {rankingSortField === "ptsDelta" && (rankingSortDesc ? "↓" : "↑")}
                  </th>
                  <th className="hidden md:table-cell py-2.5 px-3 text-right">
                    PTS (ANBA vs NBA)
                  </th>
                  <th
                    onClick={() => handleOpenRanking("tsDelta")}
                    className={`py-2.5 px-2.5 sm:px-3 text-right cursor-pointer hover:text-[#eceef2] ${
                      rankingSortField === "tsDelta" ? "text-[#4d84e2]" : ""
                    }`}
                  >
                    Dif. TS% {rankingSortField === "tsDelta" && (rankingSortDesc ? "↓" : "↑")}
                  </th>
                  <th className="hidden md:table-cell py-2.5 px-3 text-right">
                    TS% (ANBA vs NBA)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262c3b]/60 text-xs">
                {rankedLeaguePlayers.map((p, index) => {
                  const isSelected = p.id === selectedPlayer.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        handleSelectPlayer(p.id);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#16233a]"
                          : "hover:bg-[#161a23]"
                      }`}
                    >
                      <td className="py-2.5 px-2.5 sm:px-3 text-center font-mono text-[11px] text-[#8b9099]">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#161a23] text-[#8b9099] border border-[#262c3b] shrink-0">
                            {p.pos}
                          </span>
                          <div className="truncate">
                            <p className="font-semibold text-[#eceef2] truncate">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-[#8b9099] truncate">
                              <span className="text-[#4d84e2]">{p.anbaTeam}</span>{" "}
                              /{" "}
                              <span className="text-[#c9a84c]">{p.nbaTeam}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-right font-mono font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            p.similarityScore >= 80
                              ? "bg-[#5ee89a]/15 text-[#5ee89a]"
                              : p.similarityScore >= 55
                              ? "bg-[#4d84e2]/15 text-[#7ab3ff]"
                              : "bg-[#f6c453]/15 text-[#f6c453]"
                          }`}
                        >
                          {p.similarityScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-right font-mono font-bold">
                        <span
                          className={
                            p.deltas.pts > 0.5
                              ? "text-[#5ee89a]"
                              : p.deltas.pts < -0.5
                              ? "text-[#f85149]"
                              : "text-[#eceef2]"
                          }
                        >
                          {formatDelta(p.deltas.pts, 1)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell py-2.5 px-3 text-right font-mono text-[11px] text-[#8b9099]">
                        <span className="text-[#4d84e2] font-semibold">
                          {p.anba.pts.toFixed(1)}
                        </span>{" "}
                        vs{" "}
                        <span className="text-[#c9a84c] font-semibold">
                          {p.nba.pts.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 sm:px-3 text-right font-mono font-bold">
                        <span
                          className={
                            p.deltas.tsPct > 0.5
                              ? "text-[#5ee89a]"
                              : p.deltas.tsPct < -0.5
                              ? "text-[#f85149]"
                              : "text-[#eceef2]"
                          }
                        >
                          {formatDelta(p.deltas.tsPct, 1, "%")}
                        </span>
                      </td>
                      <td className="hidden md:table-cell py-2.5 px-3 text-right font-mono text-[11px] text-[#8b9099]">
                        <span className="text-[#4d84e2] font-semibold">
                          {p.anba.tsPct.toFixed(1)}%
                        </span>{" "}
                        vs{" "}
                        <span className="text-[#c9a84c] font-semibold">
                          {p.nba.tsPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Comparison Grid: Diverging Bars + Radar & Shooting Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Head-to-Head Broadcast Stat Comparison Bars */}
        <div className="lg:col-span-7 bg-[#161a23] border border-[#262c3b] rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-5 pb-3 border-b border-[#262c3b]">
            <div>
              <h3 className="text-sm font-bold text-[#eceef2] uppercase tracking-wider">
                Cara a Cara Estadístico (Por Partido)
              </h3>
              <p className="text-xs text-[#8b9099] mt-0.5">
                Comparativa directa ANBA 2K vs NBA Real ({season})
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#4d84e2]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#4d84e2]" />
                ANBA 2K
              </span>
              <span className="flex items-center gap-1.5 text-[#c9a84c]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a84c]" />
                NBA Real
              </span>
            </div>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {statRows.map((item) => {
              const diff = item.anba - item.nba;
              const anbaPct = Math.min(100, (item.anba / item.max) * 100);
              const nbaPct = Math.min(100, (item.nba / item.max) * 100);
              const isPositive = item.invertColor ? diff < -0.2 : diff > 0.2;
              const isNegative = item.invertColor ? diff > 0.2 : diff < -0.2;

              const diffBadgeClass = isPositive
                ? "bg-[#5ee89a]/15 text-[#5ee89a] border border-[#5ee89a]/30"
                : isNegative
                ? "bg-[#f85149]/15 text-[#f85149] border border-[#f85149]/30"
                : "bg-[#0f1219] text-[#8b9099] border border-[#262c3b]";

              return (
                <div
                  key={item.label}
                  className="bg-[#0f1219]/60 sm:bg-transparent rounded-lg p-2.5 sm:p-0 border border-[#262c3b]/60 sm:border-0"
                >
                  {/* Mobile top row: Label + Diff Pill */}
                  <div className="flex sm:hidden items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#eceef2]">
                      {item.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${diffBadgeClass}`}
                    >
                      {diff > 0.1 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : diff < -0.1 ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {formatDelta(diff, 1, item.suffix || "")}
                    </span>
                  </div>

                  {/* Bar Comparison Row */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    {/* Desktop Label */}
                    <div className="hidden sm:block sm:col-span-4 text-xs font-medium text-[#eceef2] truncate">
                      {item.label}
                    </div>

                    {/* ANBA Value + Right-Aligned Bar */}
                    <div className="col-span-6 sm:col-span-3 flex items-center justify-end gap-2">
                      <span className="font-mono text-xs font-bold text-[#4d84e2] shrink-0">
                        {item.anba.toFixed(1)}
                        {item.suffix || ""}
                      </span>
                      <div className="w-full bg-[#0f1219] h-2.5 rounded-l-full overflow-hidden flex justify-end border border-[#262c3b]">
                        <div
                          className="bg-[#4d84e2] h-full rounded-l-full transition-all duration-500"
                          style={{ width: `${anbaPct}%` }}
                        />
                      </div>
                    </div>

                    {/* NBA Left-Aligned Bar + Value */}
                    <div className="col-span-6 sm:col-span-3 flex items-center gap-2">
                      <div className="w-full bg-[#0f1219] h-2.5 rounded-r-full overflow-hidden flex justify-start border border-[#262c3b]">
                        <div
                          className="bg-[#c9a84c] h-full rounded-r-full transition-all duration-500"
                          style={{ width: `${nbaPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#c9a84c] shrink-0">
                        {item.nba.toFixed(1)}
                        {item.suffix || ""}
                      </span>
                    </div>

                    {/* Desktop Diff Badge */}
                    <div className="hidden sm:flex sm:col-span-2 justify-end">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${diffBadgeClass}`}
                      >
                        {diff > 0.1 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : diff < -0.1 ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {formatDelta(diff, 1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 6-Axis Radar + Shooting Splits */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
          {/* Percentile Radar Chart */}
          <div className="bg-[#161a23] border border-[#262c3b] rounded-xl p-4 sm:p-5 flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[#eceef2] uppercase tracking-wider">
                  Huella de Percentiles (0–99)
                </h3>
                <p className="text-xs text-[#8b9099]">
                  Impacto relativo frente al resto de la liga
                </p>
              </div>
            </div>

            <div className="h-60 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="73%" data={radarData}>
                  <PolarGrid stroke="#262c3b" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "#eceef2", fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#8b9099", fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    name="ANBA 2K"
                    dataKey="ANBA"
                    stroke="#4d84e2"
                    strokeWidth={2}
                    fill="#4d84e2"
                    fillOpacity={0.28}
                  />
                  <Radar
                    name="NBA Real"
                    dataKey="NBA"
                    stroke="#c9a84c"
                    strokeWidth={2}
                    fill="#c9a84c"
                    fillOpacity={0.22}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161a23",
                      borderColor: "#262c3b",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#eceef2",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "6px" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shooting Efficiency Splits Bar Chart */}
          <div className="bg-[#161a23] border border-[#262c3b] rounded-xl p-4 sm:p-5">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#eceef2] uppercase tracking-wider">
                Splits de Tiro (FG% / 3P% / FT% / TS%)
              </h3>
              <p className="text-xs text-[#8b9099]">
                Comparativa de porcentajes de acierto
              </p>
            </div>

            <div className="h-44 sm:h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shootingSplitsData}
                  margin={{ top: 5, right: 5, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#262c3b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#8b9099", fontSize: 11 }}
                    axisLine={{ stroke: "#262c3b" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#8b9099", fontSize: 10 }}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(38, 44, 59, 0.4)" }}
                    contentStyle={{
                      backgroundColor: "#161a23",
                      borderColor: "#262c3b",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#eceef2",
                    }}
                    formatter={(val: number) => `${val.toFixed(1)}%`}
                  />
                  <Bar
                    dataKey="ANBA"
                    name="ANBA 2K"
                    fill="#4d84e2"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="NBA"
                    name="NBA Real"
                    fill="#c9a84c"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology & Formulas Explainer Accordion */}
      <div className="bg-[#161a23] border border-[#262c3b] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMethodology((prev) => !prev)}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#0f1219]/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#16233a] text-[#4d84e2] border border-[#4d84e2]/30">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#eceef2]">
                ¿Cómo se calculan el % de Similitud, el Gráfico de Araña y el Clon Estadístico?
              </h3>
              <p className="text-[11px] text-[#8b9099] hidden sm:block">
                Haz clic para ver el detalle de las fórmulas y ponderaciones utilizadas en ANBA Stats Lab
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4d84e2] shrink-0 ml-2">
            <span>{showMethodology ? "Ocultar detalle" : "Ver fórmulas"}</span>
            {showMethodology ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showMethodology && (
          <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#262c3b] space-y-4 text-xs text-[#8b9099]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 1. % de Similitud */}
              <div className="bg-[#0f1219] border border-[#262c3b] rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#eceef2] uppercase tracking-wider">
                    1. % de Similitud Global
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16233a] text-[#7ab3ff]">
                    0 – 99.5%
                  </span>
                </div>
                <p className="leading-relaxed">
                  Mide el parecido directo entre los promedios por partido del jugador en{" "}
                  <strong className="text-[#4d84e2]">ANBA 2K</strong> y en la{" "}
                  <strong className="text-[#c9a84c]">NBA Real</strong> a través de 8 métricas clave ponderadas (sin penalizar por el menor número de faltas/tiros libres que se pitan en el simulador 2K):
                </p>
                <ul className="space-y-1 font-mono text-[11px] text-[#eceef2]/90 pt-1">
                  <li>· Puntos (PTS): <span className="text-[#4d84e2]">25%</span> (escala ±8.0)</li>
                  <li>· Rebotes (REB): <span className="text-[#4d84e2]">18%</span> (escala ±4.0)</li>
                  <li>· Asistencias (AST): <span className="text-[#4d84e2]">18%</span> (escala ±3.2)</li>
                  <li>· Eficiencia (TS%): <span className="text-[#4d84e2]">12%</span> (escala ±12%)</li>
                  <li>· Triples (3PM): <span className="text-[#4d84e2]">9%</span> (escala ±1.8)</li>
                  <li>· Robos / Tapones / Minutos: <span className="text-[#4d84e2]">6% c/u</span></li>
                </ul>
                <p className="text-[11px] text-[#8b9099] pt-1 border-t border-[#262c3b]/70">
                  La distancia ponderada <code className="text-[#eceef2]">D</code> se convierte en porcentaje mediante decaimiento exponencial:{" "}
                  <code className="text-[#5ee89a]">100 × e^(-0.48 × D)</code>.
                </p>
              </div>

              {/* 2. Gráfico de Araña */}
              <div className="bg-[#0f1219] border border-[#262c3b] rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#eceef2] uppercase tracking-wider">
                    2. Huella de Percentiles (Araña)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#c9a84c]/15 text-[#f6c453]">
                    Percentil 0–99
                  </span>
                </div>
                <p className="leading-relaxed">
                  Cada vértice indica a qué porcentaje de jugadores de la liga supera en esa faceta (dentro de ANBA por un lado y dentro de la NBA por otro):
                </p>
                <ul className="space-y-1 text-[11px] text-[#eceef2]/90 pt-1">
                  <li>
                    <strong className="text-[#eceef2]">· Anotación:</strong>{" "}
                    <code className="text-[#8b9099]">65% PTS/partido + 35% PTS/36m</code>
                  </li>
                  <li>
                    <strong className="text-[#eceef2]">· Creación:</strong>{" "}
                    <code className="text-[#8b9099]">70% AST/partido + 30% AST/36m − 25% TOV</code>
                  </li>
                  <li>
                    <strong className="text-[#eceef2]">· Rebote:</strong>{" "}
                    <code className="text-[#8b9099]">70% REB + 30% REB/36m + bonus ROF</code>
                  </li>
                  <li>
                    <strong className="text-[#eceef2]">· Defensa:</strong>{" "}
                    <code className="text-[#8b9099]">65% (STL+BLK) + 35% (STL+BLK)/36m</code>
                  </li>
                  <li>
                    <strong className="text-[#eceef2]">· Eficiencia:</strong>{" "}
                    <code className="text-[#8b9099]">65% True Shooting (TS%) + 35% eFG%</code>
                  </li>
                  <li>
                    <strong className="text-[#eceef2]">· Triple:</strong>{" "}
                    <code className="text-[#8b9099]">Volumen de 3PM anotados + acierto 3P%</code>
                  </li>
                </ul>
              </div>

              {/* 3. TS% y Clon Estadístico */}
              <div className="bg-[#0f1219] border border-[#262c3b] rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#eceef2] uppercase tracking-wider">
                    3. True Shooting (TS%) y Clones
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#5ee89a]/15 text-[#5ee89a]">
                    Métricas Avanzadas
                  </span>
                </div>
                <p className="leading-relaxed">
                  <strong className="text-[#eceef2]">True Shooting (TS%):</strong> Mide la eficiencia real de anotación ponderando tiros de 2, triples (que valen un 50% más) y tiros libres:
                </p>
                <div className="bg-[#161a23] px-2.5 py-1.5 rounded border border-[#262c3b] font-mono text-[11px] text-[#eceef2] text-center">
                  TS% = PTS / [ 2 × (FGA + 0.44 × FTA) ]
                </div>
                <p className="leading-relaxed pt-1">
                  <strong className="text-[#eceef2]">«En ANBA rinde como...»:</strong> Compara el vector estadístico estandarizado (Z-Score) del jugador en ANBA contra todos los jugadores de la NBA real y encuentra el jugador real cuya huella estadística es más cercana.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
