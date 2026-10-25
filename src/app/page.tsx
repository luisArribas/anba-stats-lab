"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  AlertOctagon,
  Building2,
  Dna,
  Sun,
  Moon,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import rawDataset from "@/data/anba_nba_data.json";
import { FullDatasetPayload } from "@/types/stats";
import PlayerComparator from "@/components/PlayerComparator";
import SimulatorAnomalies from "@/components/SimulatorAnomalies";
import FranchiseRealism from "@/components/FranchiseRealism";
import StatisticalClones from "@/components/StatisticalClones";

const dataset = rawDataset as unknown as FullDatasetPayload;

/**
 * Cambia `ENABLE_EXTRA_MODULES` a `true` cuando quieras mostrar también las pestañas de:
 * - Anomalías del Simulador (Chetos vs Infravalorados)
 * - Realismo de Franquicias (30 equipos)
 * - Clones Estadísticos (Similitud Cruzada)
 */
const ENABLE_EXTRA_MODULES = false;

type ActiveTab = "comparator" | "anomalies" | "franchises" | "clones";
type SeasonKey = "2026-27" | "2025-26";

export default function HomePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [seasonKey, setSeasonKey] = useState<SeasonKey>("2026-27");
  const [activeTab, setActiveTab] = useState<ActiveTab>("comparator");

  const currentSeason =
    dataset.seasons[seasonKey] || Object.values(dataset.seasons)[0];

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    currentSeason.players[0]?.id || "devin-booker"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const exists = currentSeason.players.some((p) => p.id === selectedPlayerId);
    if (!exists && currentSeason.players.length > 0) {
      setSelectedPlayerId(currentSeason.players[0].id);
    }
  }, [seasonKey, currentSeason, selectedPlayerId]);

  const handleOpenIn1v1 = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab("comparator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenInClones = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab("clones");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "comparator",
      label: "Comparador 1v1",
      subtitle: "ANBA vs NBA Real",
      icon: BarChart3,
    },
    {
      id: "anomalies",
      label: "Anomalías del Simulador",
      subtitle: "Chetos, Infravalorados y Sesgos",
      icon: AlertOctagon,
    },
    {
      id: "franchises",
      label: "Realismo de Franquicias",
      subtitle: "30 Equipos & Pace/Space",
      icon: Building2,
    },
    {
      id: "clones",
      label: "Clones Estadísticos",
      subtitle: "Motor de Similitud Cruzada",
      icon: Dna,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header — Mobile-First Compact & Desktop Responsive */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 sm:py-3.5 gap-2.5">
            {/* Row 1 on Mobile: Brand Identity + Mobile Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <span className="font-mono font-black text-white text-xs sm:text-sm tracking-tighter">
                    A/N
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      ANBA Stats Lab
                    </h1>
                    <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-semibold">
                      1v1
                    </span>
                  </div>
                  <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400">
                    Comparativa Estadística: Simulador ANBA (anba2k.es) vs. NBA Real
                  </p>
                </div>
              </div>

              {/* Mobile Quick Buttons (anba2k.es + Theme Toggle) */}
              <div className="flex sm:hidden items-center gap-1.5">
                <a
                  href="https://anba2k.es/estadisticas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-medium text-zinc-600 dark:text-zinc-300"
                >
                  <span>anba2k.es</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                  aria-label="Cambiar tema"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Row 2 on Mobile / Right Controls on Desktop */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              {/* Auto-sync daily schedule badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-[11px] text-zinc-500"
                title="Sincronización automática diaria a las 08:00 AM (Hora de Madrid)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Clock className="w-3 h-3 text-emerald-500 hidden md:inline" />
                <span className="font-mono truncate">
                  Sync diario 08:00h · {currentSeason.totalPlayers} jug.
                </span>
              </div>

              {/* Season Selector */}
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900 px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <select
                  value={seasonKey}
                  onChange={(e) => setSeasonKey(e.target.value as SeasonKey)}
                  aria-label="Seleccionar temporada"
                  className="bg-transparent text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                >
                  <option
                    value="2026-27"
                    className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    2026-27 (Actual)
                  </option>
                  <option
                    value="2025-26"
                    className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    2025-26 (Completa)
                  </option>
                </select>
              </div>

              {/* Desktop link to ANBA official stats */}
              <a
                href="https://anba2k.es/estadisticas"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-emerald-500/50 transition"
              >
                <span>anba2k.es</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              {/* Desktop Theme Switcher */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                title="Alternar modo oscuro / claro"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extra Modules Navigation Tabs (Hidden while ENABLE_EXTRA_MODULES === false) */}
          {ENABLE_EXTRA_MODULES && (
            <nav className="grid grid-cols-2 lg:grid-cols-4 gap-2 pb-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition ${
                      isActive
                        ? "border-emerald-500/50 bg-emerald-500/10 text-zinc-900 dark:text-white shadow-sm"
                        : "border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {(!ENABLE_EXTRA_MODULES || activeTab === "comparator") && (
          <PlayerComparator
            players={currentSeason.players}
            teams={currentSeason.teams}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            onInspectClones={handleOpenInClones}
            showExtraModules={ENABLE_EXTRA_MODULES}
          />
        )}

        {ENABLE_EXTRA_MODULES && activeTab === "anomalies" && (
          <SimulatorAnomalies
            players={currentSeason.players}
            teams={currentSeason.teams}
            positionBreakdown={currentSeason.positionBreakdown}
            onInspectPlayer={handleOpenIn1v1}
          />
        )}

        {ENABLE_EXTRA_MODULES && activeTab === "franchises" && (
          <FranchiseRealism
            teams={currentSeason.teams}
            players={currentSeason.players}
            leagueAverages={currentSeason.leagueAverages}
            onInspectPlayer={handleOpenIn1v1}
          />
        )}

        {ENABLE_EXTRA_MODULES && activeTab === "clones" && (
          <StatisticalClones
            players={currentSeason.players}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            onOpenIn1v1={handleOpenIn1v1}
          />
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-5 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs text-zinc-500">
          <div>
            <strong>ANBA Stats Lab</strong> · Sincronización diaria automática 08:00 AM (Madrid) · Última act:{" "}
            <span className="font-mono">{currentSeason.updatedAt}</span>
          </div>
          <div className="font-mono text-[11px]">
            <span className="text-emerald-500">● ANBA</span> vs{" "}
            <span className="text-orange-500">● NBA Real</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
