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
  ReferenceLine,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Flame,
  TrendingDown,
  CheckCircle2,
  Search,
  ArrowUpDown,
  ExternalLink,
  AlertTriangle,
  Layers,
} from "lucide-react";
import {
  PlayerComparison,
  PositionBreakdown,
  TeamComparison,
} from "@/types/stats";
import {
  formatDelta,
  getDeltaColorClass,
  getSimilarityBadgeColor,
} from "@/lib/formatters";

interface SimulatorAnomaliesProps {
  players: PlayerComparison[];
  teams: TeamComparison[];
  positionBreakdown: PositionBreakdown[];
  onInspectPlayer: (id: string) => void;
}

type SortField =
  | "deltaGmSc"
  | "deltaPts"
  | "deltaTrb"
  | "deltaAst"
  | "deltaTs"
  | "similarity"
  | "anbaGmSc"
  | "nbaGmSc";

export default function SimulatorAnomalies({
  players,
  teams,
  positionBreakdown,
  onInspectPlayer,
}: SimulatorAnomaliesProps) {
  const [minMp, setMinMp] = useState<number>(12);
  const [posFilter, setPosFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("deltaGmSc");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [scatterMetric, setScatterMetric] = useState<
    "gameScore" | "pts" | "tsPct" | "trb" | "ast"
  >("gameScore");

  const qualifiedPlayers = useMemo(() => {
    return players.filter(
      (p) => p.anba.mp >= minMp && p.nba.mp >= Math.max(8, minMp - 4)
    );
  }, [players, minMp]);

  const topChetos = useMemo(() => {
    return [...qualifiedPlayers]
      .sort((a, b) => b.deltas.gameScore - a.deltas.gameScore)
      .slice(0, 6);
  }, [qualifiedPlayers]);

  const topUnderperforming = useMemo(() => {
    return [...qualifiedPlayers]
      .sort((a, b) => a.deltas.gameScore - b.deltas.gameScore)
      .slice(0, 6);
  }, [qualifiedPlayers]);

  const topExactReplicas = useMemo(() => {
    return [...qualifiedPlayers]
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 6);
  }, [qualifiedPlayers]);

  const filteredTablePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = qualifiedPlayers.filter((p) => {
      if (posFilter !== "ALL" && p.pos !== posFilter) return false;
      if (teamFilter !== "ALL" && p.anbaTeam !== teamFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.anbaTeam.toLowerCase().includes(q) ||
        p.nbaTeam.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      let va = 0;
      let vb = 0;
      switch (sortField) {
        case "deltaGmSc":
          va = a.deltas.gameScore;
          vb = b.deltas.gameScore;
          break;
        case "deltaPts":
          va = a.deltas.pts;
          vb = b.deltas.pts;
          break;
        case "deltaTrb":
          va = a.deltas.trb;
          vb = b.deltas.trb;
          break;
        case "deltaAst":
          va = a.deltas.ast;
          vb = b.deltas.ast;
          break;
        case "deltaTs":
          va = a.deltas.tsPct;
          vb = b.deltas.tsPct;
          break;
        case "similarity":
          va = a.similarityScore;
          vb = b.similarityScore;
          break;
        case "anbaGmSc":
          va = a.anba.gameScore;
          vb = b.anba.gameScore;
          break;
        case "nbaGmSc":
          va = a.nba.gameScore;
          vb = b.nba.gameScore;
          break;
      }
      return sortAsc ? va - vb : vb - va;
    });

    return list;
  }, [qualifiedPlayers, posFilter, teamFilter, search, sortField, sortAsc]);

  const scatterData = useMemo(() => {
    return qualifiedPlayers.map((p) => {
      const x = p.nba[scatterMetric];
      const y = p.anba[scatterMetric];
      return {
        id: p.id,
        name: p.name,
        anbaTeam: p.anbaTeam,
        nbaTeam: p.nbaTeam,
        pos: p.pos,
        x,
        y,
        delta: Number((y - x).toFixed(2)),
        mp: p.anba.mp,
        similarity: p.similarityScore,
      };
    });
  }, [qualifiedPlayers, scatterMetric]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const metricLabelMap = {
    gameScore: "GameScore (Hollinger)",
    pts: "Puntos por Partido (PTS)",
    tsPct: "True Shooting (TS%)",
    trb: "Rebotes por Partido (REB)",
    ast: "Asistencias por Partido (AST)",
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium Cards: Chetos, Infravalorados, Clones de Fidelidad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Más Chetos en ANBA */}
        <div className="rounded-xl border border-emerald-500/25 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Mayor Sobre-Rendimiento en ANBA
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Mayor salto positivo de GameScore (ANBA vs NBA)
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {topChetos.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onInspectPlayer(p.id)}
                className="w-full py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-zinc-400 w-4">
                    {idx + 1}.
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition flex items-center gap-1.5">
                      {p.name}
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {p.anbaTeam}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      ANBA: {p.anba.gameScore.toFixed(1)} GmSc · NBA: {p.nba.gameScore.toFixed(1)}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  +{p.deltas.gameScore.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Card 2: Más Infravalorados / Perjudicados */}
        <div className="rounded-xl border border-orange-500/25 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Top Infravalorados en ANBA
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Rinden mucho más en la NBA real que en ANBA
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {topUnderperforming.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onInspectPlayer(p.id)}
                className="w-full py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-zinc-400 w-4">
                    {idx + 1}.
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition flex items-center gap-1.5">
                      {p.name}
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {p.anbaTeam}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      ANBA: {p.anba.gameScore.toFixed(1)} GmSc · NBA: {p.nba.gameScore.toFixed(1)}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  {p.deltas.gameScore.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Card 3: Mayor Fidelidad Estadística (Score_Final) */}
        <div className="rounded-xl border border-cyan-500/25 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Réplicas Más Fieles (Score Final)
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Estadísticas ANBA prácticamente idénticas a la NBA
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {topExactReplicas.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onInspectPlayer(p.id)}
                className="w-full py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-zinc-400 w-4">
                    {idx + 1}.
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-500 transition flex items-center gap-1.5">
                      {p.name}
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {p.anbaTeam}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {p.anba.pts} PTS / {p.anba.trb} REB vs {p.nba.pts} / {p.nba.trb}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  {p.similarityScore.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Scatter Plot (NBA vs ANBA) + Position Bias Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scatter Plot */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-emerald-500" />
                Mapa de Dispersión: Realidad NBA (Eje X) vs Simulador ANBA (Eje Y)
              </h3>
              <p className="text-xs text-zinc-500">
                Haz clic en cualquier punto para abrir la comparativa 1v1 del jugador.
              </p>
            </div>
            <select
              value={scatterMetric}
              onChange={(e) => setScatterMetric(e.target.value as any)}
              aria-label="Métrica del gráfico de dispersión"
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-zinc-800 dark:text-zinc-200 font-medium"
            >
              <option value="gameScore">GameScore Global</option>
              <option value="pts">Puntos por Partido (PTS)</option>
              <option value="tsPct">Eficiencia True Shooting (TS%)</option>
              <option value="trb">Rebotes por Partido (REB)</option>
              <option value="ast">Asistencias por Partido (AST)</option>
            </select>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  name="NBA Real"
                  tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#3f3f46" }}
                  label={{
                    value: `NBA Real — ${metricLabelMap[scatterMetric]}`,
                    position: "bottom",
                    offset: 4,
                    fill: "#71717a",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="ANBA"
                  tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#3f3f46" }}
                />
                <ZAxis type="number" dataKey="mp" range={[35, 110]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 shadow-xl">
                        <div className="font-bold text-sm">
                          {pt.name} ({pt.anbaTeam})
                        </div>
                        <div className="text-zinc-400 mb-1.5">
                          Posición: {pt.pos} · Fidelidad: {pt.similarity}%
                        </div>
                        <div className="font-mono space-y-0.5">
                          <div className="text-emerald-400">
                            ANBA: {pt.y}
                          </div>
                          <div className="text-orange-400">
                            NBA Real: {pt.x}
                          </div>
                          <div className="pt-1 border-t border-zinc-800 font-bold">
                            Diferencial: {pt.delta > 0 ? `+${pt.delta}` : pt.delta}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  segment={[
                    { x: 0, y: 0 },
                    { x: 75, y: 75 },
                  ]}
                  stroke="#71717a"
                  strokeDasharray="4 4"
                />
                <Scatter
                  data={scatterData}
                  onClick={(data: any) => {
                    if (data && data.id) onInspectPlayer(data.id);
                  }}
                  className="cursor-pointer"
                >
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.delta >= 0 ? "#10b981" : "#f97316"}
                      fillOpacity={0.75}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Position Bias Breakdown */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              Sesgo del Simulador por Posición
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              ¿Qué posiciones salen ganando o perdiendo en el motor de simulación de ANBA frente a la NBA real?
            </p>

            <div className="mt-4 space-y-2.5">
              {positionBreakdown.map((pos) => (
                <div
                  key={pos.pos}
                  className="p-3 rounded-lg border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/60"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {pos.pos}
                      </span>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {pos.posEs}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        ({pos.count} jug.)
                      </span>
                    </div>
                    <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400">
                      Fidelidad media: {pos.avgSimilarity}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Δ PTS</span>
                      <span
                        className={
                          pos.avgDeltaPts >= 0
                            ? "text-emerald-500 font-semibold"
                            : "text-orange-500 font-semibold"
                        }
                      >
                        {formatDelta(pos.avgDeltaPts, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Δ REB</span>
                      <span
                        className={
                          pos.avgDeltaTrb >= 0
                            ? "text-emerald-500 font-semibold"
                            : "text-orange-500 font-semibold"
                        }
                      >
                        {formatDelta(pos.avgDeltaTrb, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Δ AST</span>
                      <span
                        className={
                          pos.avgDeltaAst >= 0
                            ? "text-emerald-500 font-semibold"
                            : "text-orange-500 font-semibold"
                        }
                      >
                        {formatDelta(pos.avgDeltaAst, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Δ GmSc</span>
                      <span
                        className={
                          pos.avgDeltaGameScore >= 0
                            ? "text-emerald-500 font-semibold"
                            : "text-orange-500 font-semibold"
                        }
                      >
                        {formatDelta(pos.avgDeltaGameScore, 2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Interactive Audit Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Tabla de Auditoría Global ({filteredTablePlayers.length} jugadores)
            </h3>
            <p className="text-xs text-zinc-500">
              Ordena por diferencial de GameScore, Puntos, Rebotes, Eficiencia o Índice de Similitud.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar jugador o equipo..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <select
              value={minMp}
              onChange={(e) => setMinMp(Number(e.target.value))}
              aria-label="Minutos mínimos"
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300"
            >
              <option value={0}>Todos los minutos</option>
              <option value={10}>Mín. 10 MIN/p</option>
              <option value={12}>Mín. 12 MIN/p</option>
              <option value={20}>Mín. 20 MIN/p (Titulares/Rotación)</option>
              <option value={28}>Mín. 28 MIN/p (Estrellas)</option>
            </select>

            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              aria-label="Filtrar posición"
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300"
            >
              <option value="ALL">Todas las Posiciones</option>
              <option value="PG">PG (Base)</option>
              <option value="SG">SG (Escolta)</option>
              <option value="SF">SF (Alero)</option>
              <option value="PF">PF (Ala-Pívot)</option>
              <option value="C">C (Pívot)</option>
            </select>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              aria-label="Filtrar equipo ANBA"
              className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300"
            >
              <option value="ALL">Todos los Equipos ANBA</option>
              {teams
                .slice()
                .sort((a, b) => a.abbr.localeCompare(b.abbr))
                .map((t) => (
                  <option key={t.abbr} value={t.abbr}>
                    {t.abbr}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-2">ANBA / NBA</th>
                <th className="py-3 px-2 text-right">MIN (A/N)</th>
                <th
                  onClick={() => handleSort("anbaGmSc")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1">
                    GmSc ANBA <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("nbaGmSc")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1">
                    GmSc NBA <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("deltaGmSc")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    Δ GmSc <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("deltaPts")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Δ PTS <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("deltaTrb")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Δ REB <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("deltaAst")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Δ AST <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("deltaTs")}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Δ TS% <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("similarity")}
                  className="py-3 px-4 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Fidelidad <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 text-xs font-mono tabular-nums">
              {filteredTablePlayers.slice(0, 80).map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onInspectPlayer(p.id)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                >
                  <td className="py-2.5 px-4 font-sans">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {p.name}
                      <ExternalLink className="w-3 h-3 text-zinc-400 opacity-60" />
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.posEs} · {p.age} años
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      {p.anbaTeam}
                    </span>
                    <span className="text-zinc-400 mx-1">/</span>
                    <span className="text-zinc-500">{p.nbaTeam}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-zinc-500">
                    {p.anba.mp.toFixed(1)} / {p.nba.mp.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {p.anba.gameScore.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-orange-600 dark:text-orange-400">
                    {p.nba.gameScore.toFixed(2)}
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
                  <td
                    className={`py-2.5 px-3 text-right ${
                      p.deltas.pts >= 0 ? "text-emerald-500" : "text-orange-500"
                    }`}
                  >
                    {formatDelta(p.deltas.pts, 1)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right ${
                      p.deltas.trb >= 0 ? "text-emerald-500" : "text-orange-500"
                    }`}
                  >
                    {formatDelta(p.deltas.trb, 1)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right ${
                      p.deltas.ast >= 0 ? "text-emerald-500" : "text-orange-500"
                    }`}
                  >
                    {formatDelta(p.deltas.ast, 1)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right ${
                      p.deltas.tsPct >= 0 ? "text-emerald-500" : "text-orange-500"
                    }`}
                  >
                    {formatDelta(p.deltas.tsPct, 1, "%")}
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
    </div>
  );
}
