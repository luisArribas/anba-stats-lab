"use client";

import React, { useState } from "react";
import rawDataset from "@/data/anba_nba_data.json";
import { FullDatasetPayload } from "@/types/stats";
import PlayerComparator from "@/components/PlayerComparator";
import SimulatorAnomalies from "@/components/SimulatorAnomalies";
import FranchiseRealism from "@/components/FranchiseRealism";
import StatisticalClones from "@/components/StatisticalClones";
import {
  Swords,
  Cpu,
  ShieldAlert,
  Sparkles,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";

const dataset = rawDataset as unknown as FullDatasetPayload;
const AVAILABLE_SEASONS = Object.keys(dataset.seasons);

type ModuleTab = "comparator" | "anomalies" | "franchises" | "clones";

// Flag para activar más adelante los módulos 1, 3 y 5 si lo deseas
const ENABLE_EXTRA_MODULES = false;

export default function HomePage() {
  const [selectedSeason, setSelectedSeason] = useState<string>(
    AVAILABLE_SEASONS.includes("2026-27")
      ? "2026-27"
      : AVAILABLE_SEASONS[0] || "2026-27"
  );
  const [activeTab, setActiveTab] = useState<ModuleTab>("comparator");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const currentSeasonData =
    dataset.seasons[selectedSeason] || dataset.seasons["2026-27"];

  const activePlayerId =
    selectedPlayerId &&
    currentSeasonData.players.some((p) => p.id === selectedPlayerId)
      ? selectedPlayerId
      : currentSeasonData.players[0]?.id || "";

  const tabs: {
    id: ModuleTab;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: "comparator",
      label: "Comparador 1v1",
      subtitle: "ANBA vs Realidad NBA",
      icon: <Swords className="w-4 h-4" />,
    },
    {
      id: "anomalies",
      label: "Auditoría 2K",
      subtitle: "Rotos e Infravalorados",
      icon: <Cpu className="w-4 h-4" />,
      badge: `${currentSeasonData.players.filter((p) => Math.abs(p.deltas.pts) >= 4).length}`,
    },
    {
      id: "franchises",
      label: "Índice Franquicias",
      subtitle: "Fidelidad Táctica",
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: `${currentSeasonData.teams.length}`,
    },
    {
      id: "clones",
      label: "Clones Estadísticos",
      subtitle: "¿Como quién rinde?",
      icon: <Sparkles className="w-4 h-4" />,
      badge: "Cosine AI",
    },
  ];

  const formattedLastSync = (() => {
    try {
      const dt = new Date(dataset.generatedAt);
      return dt.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return currentSeasonData.updatedAt || "08:00 CET";
    }
  })();

  const handleInspectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setActiveTab("comparator");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1219] text-[#eceef2]">
      {/* Top Navbar replicating anba2k.es header */}
      <header className="sticky top-0 z-50 border-b border-[#262c3b] bg-[#0f1219]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Brand Logo & Title identical to anba2k.es */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <a
                href="https://anba2k.es/estadisticas"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex shrink-0 items-center gap-2.5 rounded-lg outline-none"
                title="Ir a ANBA2K.es"
              >
                <img
                  src="https://anba2k.es/anba-logo.png"
                  alt="ANBA 2K"
                  className="h-7 sm:h-8 w-auto transition-transform duration-200 group-hover:scale-105"
                />
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-black tracking-tight text-[#eceef2]">
                      ANBA
                    </span>
                    <span className="text-lg sm:text-xl font-black tracking-tight text-[#c9a84c]">
                      2K
                    </span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#16233a] text-[#4d84e2] border border-[#4d84e2]/30">
                      Stats Lab
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.16em] text-[#8b9099] hidden sm:block mt-0.5">
                    Adictos a la NBA · Comparador Oficial
                  </span>
                </div>
              </a>
            </div>

            {/* Season Selector & Daily Auto-Sync Status */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Season Selector Pill */}
              <div className="flex items-center bg-[#161a23] p-1 rounded-lg border border-[#262c3b]">
                <Calendar className="w-3.5 h-3.5 text-[#8b9099] ml-2 mr-1.5 hidden md:block" />
                {AVAILABLE_SEASONS.map((season) => {
                  const active = selectedSeason === season;
                  return (
                    <button
                      key={season}
                      onClick={() => setSelectedSeason(season)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        active
                          ? "bg-[#4d84e2] text-white shadow-sm"
                          : "text-[#8b9099] hover:text-[#eceef2]"
                      }`}
                    >
                      {season}
                      {season === "2026-27" && (
                        <span
                          className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${
                            active ? "bg-[#5ee89a]" : "bg-[#5ee89a]/70"
                          }`}
                          title="Temporada actual en curso"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Automated Daily Sync Indicator (Desktop) */}
              <div
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161a23] border border-[#262c3b] text-[11px] text-[#8b9099]"
                title="Las estadísticas de ANBA2K.es y NBA se sincronizan automáticamente todos los días a las 08:00 AM (hora de Madrid)"
              >
                <span className="w-2 h-2 rounded-full bg-[#5ee89a]" />
                <Clock className="w-3.5 h-3.5 text-[#8b9099]" />
                <span>
                  Sync diario <strong className="text-[#eceef2]">08:00h</strong>{" "}
                  <span className="text-[#8b9099]/80">({formattedLastSync})</span>
                </span>
              </div>

              <a
                href="https://anba2k.es/estadisticas"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161a23] hover:bg-[#262c3b]/60 border border-[#262c3b] text-xs font-medium text-[#8b9099] hover:text-[#eceef2] transition-colors"
              >
                <span>anba2k.es</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Navigation Tabs (Solo visibles si ENABLE_EXTRA_MODULES = true) */}
          {ENABLE_EXTRA_MODULES && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center gap-2.5 px-4 py-2 rounded-lg text-left transition-colors shrink-0 border ${
                      isActive
                        ? "bg-[#16233a] border-[#4d84e2]/40 text-[#eceef2]"
                        : "bg-[#161a23]/60 border-transparent text-[#8b9099] hover:text-[#eceef2] hover:bg-[#161a23]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md ${
                        isActive
                          ? "bg-[#4d84e2]/20 text-[#4d84e2]"
                          : "bg-[#0f1219] text-[#8b9099]"
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-tight">
                          {tab.label}
                        </span>
                        {tab.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              isActive
                                ? "bg-[#4d84e2]/20 text-[#7ab3ff]"
                                : "bg-[#0f1219] text-[#8b9099]"
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8b9099] hidden sm:block">
                        {tab.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {(!ENABLE_EXTRA_MODULES || activeTab === "comparator") && (
          <PlayerComparator
            players={currentSeasonData.players}
            season={selectedSeason}
            selectedPlayerId={activePlayerId}
            onSelectPlayer={setSelectedPlayerId}
          />
        )}
        {ENABLE_EXTRA_MODULES && activeTab === "anomalies" && (
          <SimulatorAnomalies
            players={currentSeasonData.players}
            teams={currentSeasonData.teams}
            positionBreakdown={currentSeasonData.positionBreakdown}
            onInspectPlayer={handleInspectPlayer}
          />
        )}
        {ENABLE_EXTRA_MODULES && activeTab === "franchises" && (
          <FranchiseRealism
            teams={currentSeasonData.teams}
            players={currentSeasonData.players}
            leagueAverages={currentSeasonData.leagueAverages}
            onInspectPlayer={handleInspectPlayer}
          />
        )}
        {ENABLE_EXTRA_MODULES && activeTab === "clones" && (
          <StatisticalClones
            players={currentSeasonData.players}
            selectedPlayerId={activePlayerId}
            onSelectPlayer={setSelectedPlayerId}
            onOpenIn1v1={handleInspectPlayer}
          />
        )}
      </main>

      {/* Footer matching anba2k.es */}
      <footer className="border-t border-[#262c3b] bg-[#0f1219] py-5 mt-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8b9099]">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="w-2 h-2 rounded-full bg-[#5ee89a] shrink-0" />
            <span>
              <strong className="text-[#eceef2]">ANBA2K Stats Lab</strong> ·{" "}
              {currentSeasonData.players.length} jugadores cruzados en{" "}
              <strong className="text-[#eceef2]">{selectedSeason}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#8b9099]">
            <Clock className="w-3.5 h-3.5 text-[#4d84e2]" />
            <span>
              Actualización diaria automática:{" "}
              <strong className="text-[#eceef2]">08:00 AM (Madrid)</strong> ·
              Última: {formattedLastSync}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
