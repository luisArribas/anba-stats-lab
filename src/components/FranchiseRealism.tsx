"use client";

import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Building2,
  Gauge,
  Compass,
  Users,
  ExternalLink,
  Trophy,
  UserCheck,
  SlidersHorizontal,
  Activity,
} from "lucide-react";
import {
  LeagueAverageBlock,
  PlayerComparison,
  TeamComparison,
} from "@/types/stats";
import { formatDelta } from "@/lib/formatters";

interface FranchiseRealismProps {
  teams: TeamComparison[];
  players: PlayerComparison[];
  leagueAverages: {
    anba: LeagueAverageBlock;
    nba: LeagueAverageBlock;
  };
  onInspectPlayer: (id: string) => void;
}

type TeamStatMode = "per_game" | "advanced";
type ScatterMode = "efficiency" | "pacespace";

interface TeamMetricRow {
  key: string;
  label: string;
  shortLabel: string;
  anbaVal: number;
  nbaVal: number;
  decimals?: number;
  suffix?: string;
  invertGood?: boolean;
  group?: string;
}

export default function FranchiseRealism({
  teams,
  players,
  leagueAverages,
  onInspectPlayer,
}: FranchiseRealismProps) {
  const [selectedTeamAbbr, setSelectedTeamAbbr] = useState<string>(
    teams[0]?.abbr || "OKC"
  );
  const [statMode, setStatMode] = useState<TeamStatMode>("per_game");
  const [tableMode, setTableMode] = useState<TeamStatMode>("per_game");
  const [scatterMode, setScatterMode] = useState<ScatterMode>("efficiency");
  const [confFilter, setConfFilter] = useState<"ALL" | "East" | "West">("ALL");

  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.abbr === selectedTeamAbbr) || teams[0];
  }, [teams, selectedTeamAbbr]);

  const teamRoster = useMemo(() => {
    if (!selectedTeam) return [];
    return players
      .filter((p) => p.anbaTeam === selectedTeam.abbr && p.leagueStatus !== "nba_only")
      .sort((a, b) => b.anba.mp - a.anba.mp);
  }, [players, selectedTeam]);

  const filteredTeams = useMemo(() => {
    const base =
      confFilter === "ALL"
        ? [...teams]
        : teams.filter((t) => t.conference === confFilter);
    return base.sort((a, b) => b.anba.wPct - a.anba.wPct || b.anba.nrtg - a.anba.nrtg);
  }, [teams, confFilter]);

  if (!selectedTeam) return null;

  const macroCards = [
    {
      label: "Puntos / Partido",
      anba: leagueAverages.anba.pts,
      nba: leagueAverages.nba.pts,
      decimals: 1,
      suffix: "",
      note: "Anotación media por franquicia",
    },
    {
      label: "Rating Ofensivo (ORtg)",
      anba: leagueAverages.anba.ortg ?? 114.0,
      nba: leagueAverages.nba.ortg ?? 115.0,
      decimals: 1,
      suffix: "",
      note: "Puntos por cada 100 posesiones",
    },
    {
      label: "Ritmo (Pace)",
      anba: leagueAverages.anba.pace ?? 98.5,
      nba: leagueAverages.nba.pace ?? 99.0,
      decimals: 1,
      suffix: "",
      note: "Posesiones por 48 minutos",
    },
    {
      label: "Tasa de Triple (3PAr)",
      anba: leagueAverages.anba.fg3aRate,
      nba: leagueAverages.nba.fg3aRate,
      decimals: 1,
      suffix: "%",
      note: `3PA/p: ${leagueAverages.anba.fg3a.toFixed(1)} vs ${leagueAverages.nba.fg3a.toFixed(1)}`,
    },
    {
      label: "True Shooting (TS%)",
      anba: leagueAverages.anba.tsPct,
      nba: leagueAverages.nba.tsPct,
      decimals: 1,
      suffix: "%",
      note: "Eficiencia real de tiro",
    },
    {
      label: "Asistencias / Partido",
      anba: leagueAverages.anba.ast,
      nba: leagueAverages.nba.ast,
      decimals: 1,
      suffix: "",
      note: `Pérdidas: ${leagueAverages.anba.tov.toFixed(1)} vs ${leagueAverages.nba.tov.toFixed(1)}`,
    },
  ];

  const perGameMetrics: TeamMetricRow[] = [
    {
      key: "pts",
      label: "Puntos por Partido",
      shortLabel: "PTS",
      anbaVal: selectedTeam.anba.pts,
      nbaVal: selectedTeam.nba.pts,
      decimals: 1,
    },
    {
      key: "fgPct",
      label: "% Tiros de Campo",
      shortLabel: "FG%",
      anbaVal: selectedTeam.anba.fgPct,
      nbaVal: selectedTeam.nba.fgPct,
      decimals: 1,
      suffix: "%",
    },
    {
      key: "fg3m",
      label: "Triples Anotados / P",
      shortLabel: "3PM",
      anbaVal: selectedTeam.anba.fg3m,
      nbaVal: selectedTeam.nba.fg3m,
      decimals: 1,
    },
    {
      key: "fg3a",
      label: "Triples Intentados / P",
      shortLabel: "3PA",
      anbaVal: selectedTeam.anba.fg3a,
      nbaVal: selectedTeam.nba.fg3a,
      decimals: 1,
    },
    {
      key: "fg3Pct",
      label: "% Acierto en Triple",
      shortLabel: "3P%",
      anbaVal: selectedTeam.anba.fg3Pct,
      nbaVal: selectedTeam.nba.fg3Pct,
      decimals: 1,
      suffix: "%",
    },
    {
      key: "ftm",
      label: "Tiros Libres Anotados",
      shortLabel: "FTM",
      anbaVal: selectedTeam.anba.ftm,
      nbaVal: selectedTeam.nba.ftm,
      decimals: 1,
    },
    {
      key: "fta",
      label: "Tiros Libres Intentados",
      shortLabel: "FTA",
      anbaVal: selectedTeam.anba.fta,
      nbaVal: selectedTeam.nba.fta,
      decimals: 1,
    },
    {
      key: "ftPct",
      label: "% Tiros Libres",
      shortLabel: "FT%",
      anbaVal: selectedTeam.anba.ftPct,
      nbaVal: selectedTeam.nba.ftPct,
      decimals: 1,
      suffix: "%",
    },
    {
      key: "orb",
      label: "Rebotes Ofensivos",
      shortLabel: "OREB",
      anbaVal: selectedTeam.anba.orb,
      nbaVal: selectedTeam.nba.orb,
      decimals: 1,
    },
    {
      key: "drb",
      label: "Rebotes Defensivos",
      shortLabel: "DREB",
      anbaVal: selectedTeam.anba.drb,
      nbaVal: selectedTeam.nba.drb,
      decimals: 1,
    },
    {
      key: "trb",
      label: "Rebotes Totales",
      shortLabel: "REB",
      anbaVal: selectedTeam.anba.trb,
      nbaVal: selectedTeam.nba.trb,
      decimals: 1,
    },
    {
      key: "ast",
      label: "Asistencias",
      shortLabel: "AST",
      anbaVal: selectedTeam.anba.ast,
      nbaVal: selectedTeam.nba.ast,
      decimals: 1,
    },
    {
      key: "stl",
      label: "Robos de Balón",
      shortLabel: "STL",
      anbaVal: selectedTeam.anba.stl,
      nbaVal: selectedTeam.nba.stl,
      decimals: 1,
    },
    {
      key: "blk",
      label: "Tapones",
      shortLabel: "BLK",
      anbaVal: selectedTeam.anba.blk,
      nbaVal: selectedTeam.nba.blk,
      decimals: 1,
    },
    {
      key: "tov",
      label: "Pérdidas de Balón",
      shortLabel: "TOV",
      anbaVal: selectedTeam.anba.tov,
      nbaVal: selectedTeam.nba.tov,
      decimals: 1,
      invertGood: true,
    },
    {
      key: "pf",
      label: "Faltas Personales",
      shortLabel: "PF",
      anbaVal: selectedTeam.anba.pf,
      nbaVal: selectedTeam.nba.pf,
      decimals: 1,
      invertGood: true,
    },
  ];

  const advancedMetrics: TeamMetricRow[] = [
    {
      key: "ortg",
      label: "Rating Ofensivo (ORtg)",
      shortLabel: "ORtg",
      anbaVal: selectedTeam.anba.ortg,
      nbaVal: selectedTeam.nba.ortg,
      decimals: 1,
      group: "Ratings & Ritmo",
    },
    {
      key: "drtg",
      label: "Rating Defensivo (DRtg · menos es mejor)",
      shortLabel: "DRtg",
      anbaVal: selectedTeam.anba.drtg,
      nbaVal: selectedTeam.nba.drtg,
      decimals: 1,
      invertGood: true,
      group: "Ratings & Ritmo",
    },
    {
      key: "nrtg",
      label: "Net Rating (Diferencial / 100 pos)",
      shortLabel: "NetRtg",
      anbaVal: selectedTeam.anba.nrtg,
      nbaVal: selectedTeam.nba.nrtg,
      decimals: 1,
      group: "Ratings & Ritmo",
    },
    {
      key: "pace",
      label: "Ritmo (Pace · Posesiones/48m)",
      shortLabel: "PACE",
      anbaVal: selectedTeam.anba.pace,
      nbaVal: selectedTeam.nba.pace,
      decimals: 1,
      group: "Ratings & Ritmo",
    },
    {
      key: "tsPct",
      label: "True Shooting % (TS%)",
      shortLabel: "TS%",
      anbaVal: selectedTeam.anba.tsPct,
      nbaVal: selectedTeam.nba.tsPct,
      decimals: 1,
      suffix: "%",
      group: "Ratings & Ritmo",
    },
    {
      key: "threePar",
      label: "Tasa de Triples (3PAr)",
      shortLabel: "3PAr",
      anbaVal: selectedTeam.anba.threePar,
      nbaVal: selectedTeam.nba.threePar,
      decimals: 1,
      suffix: "%",
      group: "Ratings & Ritmo",
    },
    {
      key: "ftr",
      label: "Tasa de Tiros Libres (FTr)",
      shortLabel: "FTr",
      anbaVal: selectedTeam.anba.ftr,
      nbaVal: selectedTeam.nba.ftr,
      decimals: 1,
      suffix: "%",
      group: "Ratings & Ritmo",
    },
    {
      key: "offEfgPct",
      label: "Four Factors Ataque · eFG% Efectivo",
      shortLabel: "Off eFG%",
      anbaVal: selectedTeam.anba.offEfgPct,
      nbaVal: selectedTeam.nba.offEfgPct,
      decimals: 1,
      suffix: "%",
      group: "Four Factors",
    },
    {
      key: "offTovPct",
      label: "Four Factors Ataque · % Pérdidas (TOV%)",
      shortLabel: "Off TOV%",
      anbaVal: selectedTeam.anba.offTovPct,
      nbaVal: selectedTeam.nba.offTovPct,
      decimals: 1,
      suffix: "%",
      invertGood: true,
      group: "Four Factors",
    },
    {
      key: "offOrbPct",
      label: "Four Factors Ataque · % Rebote Ofensivo",
      shortLabel: "ORB%",
      anbaVal: selectedTeam.anba.offOrbPct,
      nbaVal: selectedTeam.nba.offOrbPct,
      decimals: 1,
      suffix: "%",
      group: "Four Factors",
    },
    {
      key: "offFtFga",
      label: "Four Factors Ataque · Ratio FT/FGA",
      shortLabel: "Off FT/FGA",
      anbaVal: selectedTeam.anba.offFtFga,
      nbaVal: selectedTeam.nba.offFtFga,
      decimals: 1,
      suffix: "%",
      group: "Four Factors",
    },
    {
      key: "defEfgPct",
      label: "Four Factors Defensa · eFG% Permitido",
      shortLabel: "Def eFG%",
      anbaVal: selectedTeam.anba.defEfgPct,
      nbaVal: selectedTeam.nba.defEfgPct,
      decimals: 1,
      suffix: "%",
      invertGood: true,
      group: "Four Factors",
    },
    {
      key: "defTovPct",
      label: "Four Factors Defensa · % Pérdidas Forzadas",
      shortLabel: "Def TOV%",
      anbaVal: selectedTeam.anba.defTovPct,
      nbaVal: selectedTeam.nba.defTovPct,
      decimals: 1,
      suffix: "%",
      group: "Four Factors",
    },
    {
      key: "defDrbPct",
      label: "Four Factors Defensa · % Rebote Defensivo",
      shortLabel: "DRB%",
      anbaVal: selectedTeam.anba.defDrbPct,
      nbaVal: selectedTeam.nba.defDrbPct,
      decimals: 1,
      suffix: "%",
      group: "Four Factors",
    },
    {
      key: "defFtFga",
      label: "Four Factors Defensa · FT/FGA Permitido",
      shortLabel: "Def FT/FGA",
      anbaVal: selectedTeam.anba.defFtFga,
      nbaVal: selectedTeam.nba.defFtFga,
      decimals: 1,
      suffix: "%",
      invertGood: true,
      group: "Four Factors",
    },
  ];

  const activeMetrics = statMode === "per_game" ? perGameMetrics : advancedMetrics;

  const scatterData = useMemo(() => {
    return teams.map((t) => ({
      abbr: t.abbr,
      name: t.name,
      managerName: t.managerName || "Mánager ANBA",
      x: scatterMode === "efficiency" ? t.anba.ortg : t.anba.threePar,
      y: scatterMode === "efficiency" ? t.anba.drtg : t.anba.tsPct,
      nrtg: t.anba.nrtg,
      wPct: t.anba.wPct,
      record: `${t.anba.w}-${t.anba.l}`,
      nbaRecord: `${t.nba.w}-${t.nba.l}`,
      pts: t.anba.pts,
      color: t.color,
    }));
  }, [teams, scatterMode]);

  return (
    <div className="space-y-6">
      {/* 1. Macro Radiografía de la Liga: Media de las 30 Franquicias */}
      <div className="rounded-xl border border-[#262c3b] bg-[#161a23] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#eceef2] flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#4d84e2]" />
              Radiografía Macro: Promedio de las 30 Franquicias (ANBA 2K vs NBA Real)
            </h2>
            <p className="text-xs text-[#8b9099] mt-0.5">
              Compara el ritmo, eficiencia y estilo colectivo del ecosistema ANBA frente a los promedios oficiales de la NBA.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 text-[#4d84e2] font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#4d84e2]" />
              ANBA 2K
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#c9a84c] font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a84c]" />
              NBA Real
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {macroCards.map((c) => {
            const diff = c.anba - c.nba;
            const isPos = diff > 0.05;
            const isNeg = diff < -0.05;
            return (
              <div
                key={c.label}
                className="rounded-lg border border-[#262c3b] bg-[#0f1219]/90 p-3.5 flex flex-col justify-between"
              >
                <div className="text-[11px] font-semibold text-[#8b9099] uppercase tracking-wider">
                  {c.label}
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <span className="text-lg font-extrabold text-[#4d84e2]">
                    {c.anba.toFixed(c.decimals)}
                    {c.suffix}
                  </span>
                  <span className="text-xs font-bold text-[#c9a84c]">
                    NBA: {c.nba.toFixed(c.decimals)}
                    {c.suffix}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isPos
                        ? "bg-[#5ee89a]/10 text-[#5ee89a] border-[#5ee89a]/30"
                        : isNeg
                        ? "bg-[#f26464]/10 text-[#f26464] border-[#f26464]/30"
                        : "bg-[#262c3b]/50 text-[#8b9099] border-[#262c3b]"
                    }`}
                  >
                    {formatDelta(diff, c.decimals)}
                    {c.suffix}
                  </span>
                  <span className="text-[10px] text-[#8b9099] truncate">
                    {c.note}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Selector Rápido de las 30 Franquicias */}
      <div className="rounded-xl border border-[#262c3b] bg-[#161a23] p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#4d84e2]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#eceef2]">
              Selecciona una Franquicia para auditar su Fidelidad Táctica
            </span>
          </div>
          <select
            value={selectedTeam.abbr}
            onChange={(e) => setSelectedTeamAbbr(e.target.value)}
            aria-label="Seleccionar franquicia ANBA"
            className="text-xs font-semibold rounded-lg border border-[#262c3b] bg-[#0f1219] px-3 py-2 text-[#eceef2] focus:outline-none focus:border-[#4d84e2]"
          >
            {teams.map((t) => (
              <option key={t.abbr} value={t.abbr}>
                {t.abbr} — {t.name} | ANBA: {t.anba.w}-{t.anba.l} vs NBA: {t.nba.w}-{t.nba.l}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {teams.map((t) => {
            const active = t.abbr === selectedTeam.abbr;
            return (
              <button
                key={t.abbr}
                onClick={() => setSelectedTeamAbbr(t.abbr)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 border transition-all ${
                  active
                    ? "bg-[#16233a] border-[#4d84e2] text-white shadow-sm"
                    : "bg-[#0f1219]/80 border-[#262c3b] text-[#8b9099] hover:text-[#eceef2] hover:border-[#4d84e2]/40"
                }`}
              >
                {t.logoUrl ? (
                  <img
                    src={t.logoUrl}
                    alt={t.abbr}
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                )}
                <span>{t.abbr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cara a Cara de la Franquicia Seleccionada + Mapa Táctico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Radiografía 1v1 de la Franquicia (ANBA vs NBA Real) */}
        <div className="lg:col-span-7 rounded-xl border border-[#262c3b] bg-[#161a23] p-5 shadow-lg flex flex-col justify-between">
          <div>
            {/* Team Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262c3b]">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-xl bg-[#0f1219] border border-[#262c3b] flex items-center justify-center p-2 shrink-0">
                  {selectedTeam.logoUrl ? (
                    <img
                      src={selectedTeam.logoUrl}
                      alt={selectedTeam.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span
                      className="font-mono font-bold text-sm text-white px-2 py-1 rounded"
                      style={{ backgroundColor: selectedTeam.color }}
                    >
                      {selectedTeam.abbr}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-[#eceef2] tracking-tight">
                      {selectedTeam.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#0f1219] text-[#8b9099] border border-[#262c3b]">
                      Conf. {selectedTeam.conference === "East" ? "Este" : "Oeste"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#8b9099]">
                    {selectedTeam.managerName && (
                      <span className="inline-flex items-center gap-1 text-[#eceef2] font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-[#4d84e2]" />
                        Mánager ANBA:{" "}
                        <strong className="text-[#4d84e2]">
                          {selectedTeam.managerName}
                        </strong>
                      </span>
                    )}
                    <span>·</span>
                    <span>
                      Similitud Táctica:{" "}
                      <strong className="text-[#5ee89a] font-mono">
                        {selectedTeam.rosterSimilarity.toFixed(1)}%
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Mode Selector: Por Partido | Avanzadas & Four Factors */}
              <div className="inline-flex rounded-lg border border-[#262c3b] bg-[#0f1219] p-1 self-start sm:self-center shrink-0">
                <button
                  onClick={() => setStatMode("per_game")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    statMode === "per_game"
                      ? "bg-[#4d84e2] text-white shadow-sm"
                      : "text-[#8b9099] hover:text-[#eceef2]"
                  }`}
                >
                  Por Partido
                </button>
                <button
                  onClick={() => setStatMode("advanced")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    statMode === "advanced"
                      ? "bg-[#4d84e2] text-white shadow-sm"
                      : "text-[#8b9099] hover:text-[#eceef2]"
                  }`}
                >
                  Avanzadas & 4 Factors
                </button>
              </div>
            </div>

            {/* Record & Headline Summary Cards (ANBA vs NBA) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="rounded-lg bg-[#0f1219] border border-[#4d84e2]/30 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#4d84e2]">
                  Récord ANBA 2K
                </div>
                <div className="font-mono text-base sm:text-lg font-black text-[#eceef2] mt-0.5">
                  {selectedTeam.anba.w}-{selectedTeam.anba.l}{" "}
                  <span className="text-xs font-normal text-[#8b9099]">
                    ({selectedTeam.anba.wPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-[#0f1219] border border-[#c9a84c]/30 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">
                  Récord NBA Real
                </div>
                <div className="font-mono text-base sm:text-lg font-black text-[#eceef2] mt-0.5">
                  {selectedTeam.nba.w}-{selectedTeam.nba.l}{" "}
                  <span className="text-xs font-normal text-[#8b9099]">
                    ({selectedTeam.nba.wPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-[#0f1219] border border-[#262c3b] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b9099]">
                  Net Rating (A / N)
                </div>
                <div className="font-mono text-base sm:text-lg font-black mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[#4d84e2]">
                    {selectedTeam.anba.nrtg > 0
                      ? `+${selectedTeam.anba.nrtg.toFixed(1)}`
                      : selectedTeam.anba.nrtg.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#8b9099]">/</span>
                  <span className="text-[#c9a84c] text-sm">
                    {selectedTeam.nba.nrtg > 0
                      ? `+${selectedTeam.nba.nrtg.toFixed(1)}`
                      : selectedTeam.nba.nrtg.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-[#0f1219] border border-[#262c3b] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b9099]">
                  Ritmo Pace (A / N)
                </div>
                <div className="font-mono text-base sm:text-lg font-black mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[#4d84e2]">
                    {selectedTeam.anba.pace.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#8b9099]">/</span>
                  <span className="text-[#c9a84c] text-sm">
                    {selectedTeam.nba.pace.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Diverging Bar Comparison List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {activeMetrics.map((m) => {
                const diff = m.anbaVal - m.nbaVal;
                const maxVal = Math.max(
                  Math.abs(m.anbaVal),
                  Math.abs(m.nbaVal),
                  1
                );
                const anbaPct = Math.min(
                  100,
                  Math.max(6, (Math.abs(m.anbaVal) / maxVal) * 100)
                );
                const nbaPct = Math.min(
                  100,
                  Math.max(6, (Math.abs(m.nbaVal) / maxVal) * 100)
                );

                const isPositiveGood = m.invertGood ? diff < -0.05 : diff > 0.05;
                const isNegativeBad = m.invertGood ? diff > 0.05 : diff < -0.05;

                return (
                  <div
                    key={m.key}
                    className="rounded-lg bg-[#0f1219]/90 border border-[#262c3b]/80 px-3.5 py-2.5 hover:border-[#4d84e2]/40 transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#eceef2] w-16">
                          {m.shortLabel}
                        </span>
                        <span className="text-[#8b9099] text-[11px] hidden sm:inline">
                          {m.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-[#4d84e2] font-bold">
                          {m.anbaVal.toFixed(m.decimals ?? 1)}
                          {m.suffix || ""}
                        </span>
                        <span className="text-[#8b9099]">vs</span>
                        <span className="text-[#c9a84c] font-bold">
                          {m.nbaVal.toFixed(m.decimals ?? 1)}
                          {m.suffix || ""}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border min-w-[54px] text-right ${
                            isPositiveGood
                              ? "bg-[#5ee89a]/10 text-[#5ee89a] border-[#5ee89a]/30"
                              : isNegativeBad
                              ? "bg-[#f26464]/10 text-[#f26464] border-[#f26464]/30"
                              : "bg-[#262c3b]/40 text-[#8b9099] border-[#262c3b]"
                          }`}
                        >
                          {formatDelta(diff, m.decimals ?? 1)}
                          {m.suffix || ""}
                        </span>
                      </div>
                    </div>

                    {/* Dual Progress Bars */}
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="w-full bg-[#161a23] h-2 rounded-full overflow-hidden flex justify-end">
                        <div
                          className="bg-[#4d84e2] h-full rounded-full transition-all duration-300"
                          style={{ width: `${anbaPct}%` }}
                        />
                      </div>
                      <div className="w-full bg-[#161a23] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#c9a84c] h-full rounded-full transition-all duration-300"
                          style={{ width: `${nbaPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Interactive 30-Team Tactical Map */}
        <div className="lg:col-span-5 rounded-xl border border-[#262c3b] bg-[#161a23] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#262c3b]">
              <div>
                <h3 className="text-sm font-bold text-[#eceef2] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#4d84e2]" />
                  Mapa Táctico de las 30 Franquicias ANBA
                </h3>
                <p className="text-[11px] text-[#8b9099] mt-0.5">
                  Haz clic en cualquier burbuja para inspeccionar esa franquicia.
                </p>
              </div>

              <div className="inline-flex rounded-lg border border-[#262c3b] bg-[#0f1219] p-0.5 self-start">
                <button
                  onClick={() => setScatterMode("efficiency")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    scatterMode === "efficiency"
                      ? "bg-[#4d84e2] text-white"
                      : "text-[#8b9099] hover:text-[#eceef2]"
                  }`}
                >
                  ORtg vs DRtg
                </button>
                <button
                  onClick={() => setScatterMode("pacespace")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    scatterMode === "pacespace"
                      ? "bg-[#4d84e2] text-white"
                      : "text-[#8b9099] hover:text-[#eceef2]"
                  }`}
                >
                  3PAr vs TS%
                </button>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-[#8b9099] flex items-center justify-between">
              <span>
                {scatterMode === "efficiency"
                  ? "Eje X: Rating Ofensivo (ORtg) · Eje Y: Rating Defensivo (DRtg)"
                  : "Eje X: Volumen Triple (3PAr%) · Eje Y: Eficiencia Tiro (TS%)"}
              </span>
              <span className="font-mono text-[#4d84e2] font-bold">
                Seleccionado: {selectedTeam.abbr}
              </span>
            </div>

            <div className="h-80 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 15, right: 18, bottom: 24, left: -8 }}
                >
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={scatterMode === "efficiency" ? "ORtg" : "3PAr%"}
                    domain={["dataMin - 1.5", "dataMax + 1.5"]}
                    tick={{
                      fill: "#8b9099",
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                    axisLine={{ stroke: "#262c3b" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={scatterMode === "efficiency" ? "DRtg" : "TS%"}
                    domain={["dataMin - 1.5", "dataMax + 1.5"]}
                    reversed={scatterMode === "efficiency"}
                    tick={{
                      fill: "#8b9099",
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                    axisLine={{ stroke: "#262c3b" }}
                  />
                  <ZAxis type="number" dataKey="wPct" range={[65, 190]} />
                  {scatterMode === "efficiency" && (
                    <>
                      <ReferenceLine
                        x={leagueAverages.anba.ortg ?? 114}
                        stroke="#262c3b"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={leagueAverages.anba.ortg ?? 114}
                        stroke="#262c3b"
                        strokeDasharray="3 3"
                      />
                    </>
                  )}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const t = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#262c3b] bg-[#0f1219] p-3 text-xs text-[#eceef2] shadow-2xl">
                          <div className="font-bold text-sm flex items-center justify-between gap-3">
                            <span>
                              {t.abbr} — {t.name}
                            </span>
                            <span className="font-mono text-[#4d84e2]">
                              {t.record}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8b9099] mt-0.5">
                            Mánager: {t.managerName} · NBA: {t.nbaRecord}
                          </div>
                          <div className="font-mono mt-2 pt-2 border-t border-[#262c3b] space-y-1 text-[11px]">
                            {scatterMode === "efficiency" ? (
                              <>
                                <div>
                                  ORtg ANBA:{" "}
                                  <strong className="text-[#4d84e2]">
                                    {t.x.toFixed(1)}
                                  </strong>
                                </div>
                                <div>
                                  DRtg ANBA:{" "}
                                  <strong className="text-[#c9a84c]">
                                    {t.y.toFixed(1)}
                                  </strong>
                                </div>
                                <div>
                                  Net Rating:{" "}
                                  <strong className="text-[#5ee89a]">
                                    {t.nrtg > 0 ? `+${t.nrtg}` : t.nrtg}
                                  </strong>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  Volumen Triple (3PAr):{" "}
                                  <strong className="text-[#4d84e2]">
                                    {t.x.toFixed(1)}%
                                  </strong>
                                </div>
                                <div>
                                  True Shooting (TS%):{" "}
                                  <strong className="text-[#5ee89a]">
                                    {t.y.toFixed(1)}%
                                  </strong>
                                </div>
                                <div>Puntos/p: {t.pts.toFixed(1)}</div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    onClick={(d: any) => {
                      if (d && d.abbr) setSelectedTeamAbbr(d.abbr);
                    }}
                    className="cursor-pointer"
                  >
                    {scatterData.map((entry, idx) => {
                      const isSel = entry.abbr === selectedTeam.abbr;
                      return (
                        <Cell
                          key={idx}
                          fill={isSel ? "#c9a84c" : "#4d84e2"}
                          fillOpacity={isSel ? 1 : 0.75}
                          stroke={isSel ? "#ffffff" : "#161a23"}
                          strokeWidth={isSel ? 2.5 : 1}
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tactical Summary Box of Selected Team */}
          <div className="mt-4 rounded-lg border border-[#262c3b] bg-[#0f1219] p-3.5 text-xs">
            <div className="font-bold text-[#eceef2] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#4d84e2]" />
                Diagnóstico Táctico: {selectedTeam.name}
              </span>
              <span className="font-mono text-[11px] text-[#c9a84c]">
                Dif. Victorias:{" "}
                {formatDelta(selectedTeam.anba.wPct - selectedTeam.nba.wPct, 1)}%
              </span>
            </div>
            <p className="text-[#8b9099] text-[11px] mt-1.5 leading-relaxed">
              En ANBA 2K, <strong className="text-[#eceef2]">{selectedTeam.name}</strong>{" "}
              promedia <strong className="text-[#4d84e2]">{selectedTeam.anba.pts.toFixed(1)} PTS</strong>{" "}
              (ORtg {selectedTeam.anba.ortg.toFixed(1)} · DRtg {selectedTeam.anba.drtg.toFixed(1)}) frente a los{" "}
              <strong className="text-[#c9a84c]">{selectedTeam.nba.pts.toFixed(1)} PTS</strong>{" "}
              (ORtg {selectedTeam.nba.ortg.toFixed(1)} · DRtg {selectedTeam.nba.drtg.toFixed(1)}) de su homólogo en la NBA real.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Plantilla en ANBA de la Franquicia Seleccionada */}
      <div className="rounded-xl border border-[#262c3b] bg-[#161a23] shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#262c3b] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#eceef2] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4d84e2]" />
              Plantilla en ANBA de {selectedTeam.name} ({teamRoster.length} jugadores)
            </h3>
            <p className="text-xs text-[#8b9099]">
              Haz clic en cualquier jugador para abrir su comparativa individual 1v1 (incluye jugadores que solo han debutado en ANBA).
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#8b9099]">
            Ordenado por Minutos en {selectedTeam.abbr} (ANBA)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#262c3b] bg-[#0f1219] text-[11px] font-bold uppercase tracking-wider text-[#8b9099]">
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-2">Pos</th>
                <th className="py-3 px-2">Equipo NBA</th>
                <th className="py-3 px-3 text-right">PJ (A / N)</th>
                <th className="py-3 px-3 text-right">MIN (A / N)</th>
                <th className="py-3 px-3 text-right">PTS (A / N)</th>
                <th className="py-3 px-3 text-right">REB (A / N)</th>
                <th className="py-3 px-3 text-right">AST (A / N)</th>
                <th className="py-3 px-3 text-right">USG% (A / N)</th>
                <th className="py-3 px-3 text-right">TS% (A / N)</th>
                <th className="py-3 px-4 text-right">PER (A / N)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262c3b]/60 text-xs font-mono tabular-nums">
              {teamRoster.map((p) => {
                const isAnbaOnly = p.leagueStatus === "anba_only";
                return (
                  <tr
                    key={p.id}
                    onClick={() => onInspectPlayer(p.id)}
                    className="hover:bg-[#16233a]/40 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-4 font-sans font-semibold text-[#eceef2] flex items-center gap-2">
                      <span>{p.name}</span>
                      {isAnbaOnly && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#4d84e2]/20 text-[#4d84e2] border border-[#4d84e2]/30">
                          Solo ANBA
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 text-[#8b9099] opacity-60" />
                    </td>
                    <td className="py-2.5 px-2 text-[#8b9099]">{p.pos}</td>
                    <td className="py-2.5 px-2 text-[#c9a84c] font-bold">
                      {isAnbaOnly ? "—" : p.nbaTeam}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[#4d84e2] font-bold">{p.anba.g}</span>{" "}
                      /{" "}
                      <span className="text-[#8b9099]">
                        {isAnbaOnly ? "—" : p.nba.g}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[#4d84e2] font-bold">
                        {p.anba.mp.toFixed(1)}
                      </span>{" "}
                      /{" "}
                      <span className="text-[#c9a84c]">
                        {isAnbaOnly ? "—" : p.nba.mp.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[#4d84e2] font-bold">
                        {p.anba.pts.toFixed(1)}
                      </span>{" "}
                      /{" "}
                      <span className="text-[#c9a84c]">
                        {isAnbaOnly ? "—" : p.nba.pts.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[#4d84e2] font-bold">
                        {p.anba.trb.toFixed(1)}
                      </span>{" "}
                      /{" "}
                      <span className="text-[#c9a84c]">
                        {isAnbaOnly ? "—" : p.nba.trb.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[#4d84e2] font-bold">
                        {p.anba.ast.toFixed(1)}
                      </span>{" "}
                      /{" "}
                      <span className="text-[#c9a84c]">
                        {isAnbaOnly ? "—" : p.nba.ast.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[#4d84e2] font-bold">
                        {p.anba.usgPct.toFixed(1)}%
                      </span>{" "}
                      /{" "}
                      <span className="text-[#c9a84c]">
                        {isAnbaOnly ? "—" : `${p.nba.usgPct.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[#4d84e2] font-bold">
                        {p.anba.tsPct.toFixed(1)}%
                      </span>{" "}
                      /{" "}
                      <span className="text-[#c9a84c]">
                        {isAnbaOnly ? "—" : `${p.nba.tsPct.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-[#4d84e2] font-bold">
                        {p.anba.per.toFixed(1)}
                      </span>{" "}
                      /{" "}
                      <span className="text-[#c9a84c]">
                        {isAnbaOnly ? "—" : p.nba.per.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Tabla Clasificatoria Comparativa de las 30 Franquicias */}
      <div className="rounded-xl border border-[#262c3b] bg-[#161a23] shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#262c3b] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#eceef2] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#c9a84c]" />
              Clasificación Comparativa de las 30 Franquicias (ANBA 2K vs NBA Real)
            </h3>
            <p className="text-xs text-[#8b9099]">
              Comparativa directa de récords, promedios por partido y métricas avanzadas (ORtg, DRtg, Net Rating, Pace, Four Factors).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Table Mode Toggle */}
            <div className="inline-flex rounded-lg border border-[#262c3b] bg-[#0f1219] p-0.5">
              <button
                onClick={() => setTableMode("per_game")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  tableMode === "per_game"
                    ? "bg-[#4d84e2] text-white"
                    : "text-[#8b9099] hover:text-[#eceef2]"
                }`}
              >
                Por Partido
              </button>
              <button
                onClick={() => setTableMode("advanced")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  tableMode === "advanced"
                    ? "bg-[#4d84e2] text-white"
                    : "text-[#8b9099] hover:text-[#eceef2]"
                }`}
              >
                Avanzadas
              </button>
            </div>

            {/* Conference Filter */}
            <div className="inline-flex rounded-lg border border-[#262c3b] bg-[#0f1219] p-0.5">
              {(["ALL", "East", "West"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setConfFilter(c)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    confFilter === c
                      ? "bg-[#262c3b] text-[#eceef2]"
                      : "text-[#8b9099] hover:text-[#eceef2]"
                  }`}
                >
                  {c === "ALL" ? "Toda la Liga" : c === "East" ? "Este" : "Oeste"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {tableMode === "per_game" ? (
                <tr className="border-b border-[#262c3b] bg-[#0f1219] text-[11px] font-bold uppercase tracking-wider text-[#8b9099]">
                  <th className="py-3 px-4">Franquicia / Mánager</th>
                  <th className="py-3 px-2 text-right">Récord ANBA</th>
                  <th className="py-3 px-2 text-right">Récord NBA</th>
                  <th className="py-3 px-3 text-right">PTS (A / N)</th>
                  <th className="py-3 px-3 text-right">FG% (A / N)</th>
                  <th className="py-3 px-3 text-right">3P% (A / N)</th>
                  <th className="py-3 px-3 text-right">REB (A / N)</th>
                  <th className="py-3 px-3 text-right">AST (A / N)</th>
                  <th className="py-3 px-3 text-right">TOV (A / N)</th>
                  <th className="py-3 px-4 text-right">Similitud</th>
                </tr>
              ) : (
                <tr className="border-b border-[#262c3b] bg-[#0f1219] text-[11px] font-bold uppercase tracking-wider text-[#8b9099]">
                  <th className="py-3 px-4">Franquicia / Mánager</th>
                  <th className="py-3 px-2 text-right">Net Rtg (A / N)</th>
                  <th className="py-3 px-3 text-right">ORtg (A / N)</th>
                  <th className="py-3 px-3 text-right">DRtg (A / N)</th>
                  <th className="py-3 px-3 text-right">Pace (A / N)</th>
                  <th className="py-3 px-3 text-right">TS% (A / N)</th>
                  <th className="py-3 px-3 text-right">3PAr% (A / N)</th>
                  <th className="py-3 px-3 text-right">Off eFG% (A / N)</th>
                  <th className="py-3 px-4 text-right">Def eFG% (A / N)</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-[#262c3b]/60 text-xs font-mono tabular-nums">
              {filteredTeams.map((t, i) => {
                const isSelected = t.abbr === selectedTeam.abbr;
                return (
                  <tr
                    key={t.abbr}
                    onClick={() => setSelectedTeamAbbr(t.abbr)}
                    className={`hover:bg-[#16233a]/40 cursor-pointer transition ${
                      isSelected ? "bg-[#16233a]/60" : ""
                    }`}
                  >
                    <td className="py-2.5 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-[#8b9099] w-5">
                          {i + 1}
                        </span>
                        {t.logoUrl ? (
                          <img
                            src={t.logoUrl}
                            alt={t.abbr}
                            className="w-5 h-5 object-contain shrink-0"
                          />
                        ) : (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                        )}
                        <div>
                          <div className="font-bold text-[#eceef2] flex items-center gap-1.5">
                            <span>{t.name}</span>
                            <span className="font-mono text-[10px] text-[#8b9099]">
                              {t.abbr}
                            </span>
                          </div>
                          {t.managerName && (
                            <div className="text-[10px] text-[#8b9099]">
                              Mánager: {t.managerName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {tableMode === "per_game" ? (
                      <>
                        <td className="py-2.5 px-2 text-right font-bold text-[#4d84e2]">
                          {t.anba.w}-{t.anba.l}{" "}
                          <span className="text-[10px] font-normal text-[#8b9099]">
                            ({t.anba.wPct.toFixed(0)}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-[#c9a84c]">
                          {t.nba.w}-{t.nba.l}{" "}
                          <span className="text-[10px] font-normal text-[#8b9099]">
                            ({t.nba.wPct.toFixed(0)}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.pts.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#c9a84c]">
                            {t.nba.pts.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.fgPct.toFixed(1)}%
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.fgPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.fg3Pct.toFixed(1)}%
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.fg3Pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.trb.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.trb.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.ast.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.ast.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.tov.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.tov.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded border border-[#5ee89a]/30 bg-[#5ee89a]/10 text-[#5ee89a] font-bold">
                            {t.rosterSimilarity.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-2 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.nrtg > 0
                              ? `+${t.anba.nrtg.toFixed(1)}`
                              : t.anba.nrtg.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#c9a84c]">
                            {t.nba.nrtg > 0
                              ? `+${t.nba.nrtg.toFixed(1)}`
                              : t.nba.nrtg.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.ortg.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#c9a84c]">
                            {t.nba.ortg.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.drtg.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#c9a84c]">
                            {t.nba.drtg.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.pace.toFixed(1)}
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.pace.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.tsPct.toFixed(1)}%
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.tsPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.threePar.toFixed(1)}%
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.threePar.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.offEfgPct.toFixed(1)}%
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.offEfgPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="text-[#4d84e2] font-bold">
                            {t.anba.defEfgPct.toFixed(1)}%
                          </span>{" "}
                          /{" "}
                          <span className="text-[#8b9099]">
                            {t.nba.defEfgPct.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
