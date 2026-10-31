import { PlayerComparison } from "@/types/stats";

export function formatDelta(val: number, decimals = 1, suffix = ""): string {
  const fixed = Math.abs(val).toFixed(decimals);
  if (Math.abs(val) < 0.05) return `0.${"0".repeat(decimals)}${suffix}`;
  return `${val > 0 ? "+" : "-"}${fixed}${suffix}`;
}

export function getDeltaColorClass(val: number, invert = false): string {
  const effective = invert ? -val : val;
  if (Math.abs(effective) < 0.25) {
    return "text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  }
  if (effective > 0) {
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
  }
  return "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/25";
}

export function getSimilarityBadgeColor(score: number): string {
  if (score >= 85) {
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }
  if (score >= 60) {
    return "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  }
  if (score >= 35) {
    return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30";
  }
  return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30";
}

export interface PlayerDiagnosis {
  label: string;
  description: string;
  tone: "emerald" | "orange" | "cyan" | "indigo";
}

export function diagnosePlayer(p: PlayerComparison): PlayerDiagnosis {
  if (p.leagueStatus === "anba_only" || p.nba.g === 0) {
    return {
      label: "Solo en ANBA 2K · Sin debutar en NBA",
      description: `Ha jugado ${p.anba.g} PJ en ANBA 2K (${p.anba.pts.toFixed(1)} PTS), pero aún no ha debutado en la NBA Real esta temporada.`,
      tone: "indigo",
    };
  }
  if (p.leagueStatus === "nba_only" || p.anba.g === 0) {
    return {
      label: "Solo en NBA Real · Sin debutar en ANBA",
      description: `Ha jugado ${p.nba.g} PJ en la NBA Real (${p.nba.pts.toFixed(1)} PTS), pero aún no ha disputado partidos en ANBA 2K esta temporada.`,
      tone: "orange",
    };
  }

  const dGmSc = p.deltas.gameScore;
  const dMp = p.deltas.mp;
  const sim = p.similarityScore;

  if (sim >= 88 && Math.abs(dGmSc) <= 1.8) {
    return {
      label: "Réplica de Alta Fidelidad",
      description: `Su producción en ANBA calca su rendimiento NBA real (${sim.toFixed(1)}% de similitud).`,
      tone: "cyan",
    };
  }
  if (dGmSc >= 3.2) {
    return {
      label: "Sobre-Rendimiento en ANBA",
      description: `Rinde muy por encima de la realidad (+${dGmSc.toFixed(1)} GameScore en ANBA). Muy favorecido por el motor/rol.`,
      tone: "emerald",
    };
  }
  if (dGmSc <= -3.2) {
    return {
      label: "Infra-Rendimiento en Simulador",
      description: `Pierde impacto estadístico en ANBA (${dGmSc.toFixed(1)} GameScore vs NBA). Oportunidad Buy-Low o ajuste de sistema.`,
      tone: "orange",
    };
  }
  if (Math.abs(dMp) >= 6.5) {
    return {
      label: dMp > 0 ? "Expansión de Rol en ANBA" : "Rol Reducido en ANBA",
      description: `Juega ${dMp > 0 ? "+" : ""}${dMp.toFixed(1)} min/partido respecto a la NBA real, alterando su volumen bruto.`,
      tone: "indigo",
    };
  }
  return {
    label: "Rendimiento Equilibrado",
    description: `Desviación moderada entre ANBA (${p.anba.gameScore.toFixed(1)} GmSc) y NBA (${p.nba.gameScore.toFixed(1)} GmSc).`,
    tone: "cyan",
  };
}
