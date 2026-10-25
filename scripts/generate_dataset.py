# -*- coding: utf-8 -*-
"""
Script de extracción en vivo y cruce estadístico ANBA (anba2k.es) vs NBA Real.
Extrae directamente:
- Temporada 2026-27 (En curso) desde https://anba2k.es/estadisticas/__data.json?tab=players&season=2026-2027
  y la cruza con las estadísticas NBA 2026-27 en vivo (ESPN NBA API + Basketball-Reference).
- Temporada 2025-26 (Completa) desde https://anba2k.es/estadisticas/__data.json?tab=players&season=2025-2026
  cruzada con NBA 2025-26.
- Temporada 2024-25 desde archivo histórico.

Genera `src/data/anba_nba_data.json`.
"""

import argparse
import datetime
import json
import math
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import requests
from bs4 import BeautifulSoup
from scipy.stats import percentileofscore

BASE_DIR = Path(__file__).resolve().parent.parent
ANBA_ROOT = Path(r"C:\Users\luisr\OneDrive\Desktop\ANBA")
OUTPUT_JSON = BASE_DIR / "src" / "data" / "anba_nba_data.json"
CACHE_DIR = BASE_DIR / "data" / "live"

ANBA_BASE_URL = "https://anba2k.es"

TEAM_META = {
    "ATL": {"name": "Atlanta Hawks", "conference": "East", "division": "Southeast", "color": "#E03A3E"},
    "BOS": {"name": "Boston Celtics", "conference": "East", "division": "Atlantic", "color": "#007A33"},
    "BKN": {"name": "Brooklyn Nets", "conference": "East", "division": "Atlantic", "color": "#71717A"},
    "CHA": {"name": "Charlotte Hornets", "conference": "East", "division": "Southeast", "color": "#00788C"},
    "CHI": {"name": "Chicago Bulls", "conference": "East", "division": "Central", "color": "#CE1141"},
    "CLE": {"name": "Cleveland Cavaliers", "conference": "East", "division": "Central", "color": "#860038"},
    "DAL": {"name": "Dallas Mavericks", "conference": "West", "division": "Southwest", "color": "#00538C"},
    "DEN": {"name": "Denver Nuggets", "conference": "West", "division": "Northwest", "color": "#FEC524"},
    "DET": {"name": "Detroit Pistons", "conference": "East", "division": "Central", "color": "#C8102E"},
    "GSW": {"name": "Golden State Warriors", "conference": "West", "division": "Pacific", "color": "#1D428A"},
    "HOU": {"name": "Houston Rockets", "conference": "West", "division": "Southwest", "color": "#CE1141"},
    "IND": {"name": "Indiana Pacers", "conference": "East", "division": "Central", "color": "#FDBB30"},
    "LAC": {"name": "Los Angeles Clippers", "conference": "West", "division": "Pacific", "color": "#C8102E"},
    "LAL": {"name": "Los Angeles Lakers", "conference": "West", "division": "Pacific", "color": "#552583"},
    "MEM": {"name": "Memphis Grizzlies", "conference": "West", "division": "Southwest", "color": "#5D76A9"},
    "MIA": {"name": "Miami Heat", "conference": "East", "division": "Southeast", "color": "#98002E"},
    "MIL": {"name": "Milwaukee Bucks", "conference": "East", "division": "Central", "color": "#00471B"},
    "MIN": {"name": "Minnesota Timberwolves", "conference": "West", "division": "Northwest", "color": "#236192"},
    "NOP": {"name": "New Orleans Pelicans", "conference": "West", "division": "Southwest", "color": "#0C2340"},
    "NYK": {"name": "New York Knicks", "conference": "East", "division": "Atlantic", "color": "#F58426"},
    "OKC": {"name": "Oklahoma City Thunder", "conference": "West", "division": "Northwest", "color": "#007AC1"},
    "ORL": {"name": "Orlando Magic", "conference": "East", "division": "Southeast", "color": "#0077C0"},
    "PHI": {"name": "Philadelphia 76ers", "conference": "East", "division": "Atlantic", "color": "#006BB6"},
    "PHX": {"name": "Phoenix Suns", "conference": "West", "division": "Pacific", "color": "#E56020"},
    "POR": {"name": "Portland Trail Blazers", "conference": "West", "division": "Northwest", "color": "#E03A3E"},
    "SAC": {"name": "Sacramento Kings", "conference": "West", "division": "Pacific", "color": "#5A2D81"},
    "SAS": {"name": "San Antonio Spurs", "conference": "West", "division": "Southwest", "color": "#8A8D8F"},
    "TOR": {"name": "Toronto Raptors", "conference": "East", "division": "Atlantic", "color": "#CE1141"},
    "UTA": {"name": "Utah Jazz", "conference": "West", "division": "Northwest", "color": "#002B5C"},
    "WAS": {"name": "Washington Wizards", "conference": "East", "division": "Southeast", "color": "#002B5C"},
}

NAME_TO_ABBR = {v["name"]: k for k, v in TEAM_META.items()}
BR_ABBR_FIX = {"BRK": "BKN", "CHO": "CHA", "PHO": "PHX", "GS": "GSW", "NO": "NOP", "NY": "NYK", "SA": "SAS", "UTAH": "UTA", "WSH": "WAS"}

POS_MAP = {
    "Base": "PG",
    "Escolta": "SG",
    "Alero": "SF",
    "Ala-Pivot": "PF",
    "Pivot": "C",
    "PG": "PG",
    "SG": "SG",
    "SF": "SF",
    "PF": "PF",
    "C": "C",
    "G": "SG",
    "F": "SF",
}

POS_ES_MAP = {
    "PG": "Base",
    "SG": "Escolta",
    "SF": "Alero",
    "PF": "Ala-Pívot",
    "C": "Pívot",
}

MANUAL_NAME_ALIASES = {
    "nicolas claxton": "nic claxton",
    "cameron thomas": "cam thomas",
    "ogugua anunoby": "og anunoby",
    "kyle kuzma": "kyle kuzma",
    "alperen sengun": "alperen sengun",
    "oscar tshiebwe": "oscar tshiebwe",
    "kentavious caldwell pope": "kentavious caldwell pope",
    "alexandre sarr": "alex sarr",
    "ronald holland": "ron holland",
    "bub carrington": "carlton carrington",
    "carlton carrington": "carlton carrington",
    "herb jones": "herbert jones",
    "trey murphy": "trey murphy",
    "gg jackson": "gg jackson",
    "jaren jackson": "jaren jackson",
    "jaime jaquez": "jaime jaquez",
    "dereck lively": "dereck lively",
    "gary trent": "gary trent",
    "jabari smith": "jabari smith",
    "wendell carter": "wendell carter",
    "michael porter": "michael porter",
    "kelly oubre": "kelly oubre",
    "gary payton": "gary payton",
    "tim hardaway": "tim hardaway",
    "derrick jones": "derrick jones",
    "larry nance": "larry nance",
    "lonnie walker": "lonnie walker",
    "andre jackson": "andre jackson",
    "vince williams": "vince williams",
    "scotty pippen": "scotty pippen",
    "kj martin": "kenyon martin",
}


def unflatten_devalue(data_list: list) -> Any:
    memo: Dict[int, Any] = {}

    def resolve(idx: Any) -> Any:
        if not isinstance(idx, int) or idx < 0 or idx >= len(data_list):
            return idx
        if idx in memo:
            return memo[idx]
        raw = data_list[idx]
        if isinstance(raw, dict):
            obj: Dict[str, Any] = {}
            memo[idx] = obj
            for k, v in raw.items():
                obj[k] = resolve(v)
            return obj
        elif isinstance(raw, list):
            arr: List[Any] = []
            memo[idx] = arr
            for item in raw:
                arr.append(resolve(item))
            return arr
        else:
            memo[idx] = raw
            return raw

    return resolve(0)


def normalize_player_key(name: str) -> str:
    if not isinstance(name, str):
        return ""
    s = name.strip()
    replacements = {
        "Ã¼": "u",
        "Ã³": "o",
        "Ã¡": "a",
        "Ã©": "e",
        "Ã­": "i",
        "Ã±": "n",
        "Ä\x87": "c",
        "Ä\x8d": "c",
        "Å¡": "s",
        "Å¾": "z",
        "?": "c",
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    tokens = [t for t in s.split() if t not in {"jr", "sr", "ii", "iii", "iv"}]
    key = " ".join(tokens)
    special_q = {
        "nikola jokic": "nikola jokic",
        "luka doncic": "luka doncic",
        "nikola vucevic": "nikola vucevic",
        "bogdan bogdanovic": "bogdan bogdanovic",
        "bojan bogdanovic": "bojan bogdanovic",
        "jusuf nurkic": "jusuf nurkic",
        "dario saric": "dario saric",
        "jonas valanciunas": "jonas valanciunas",
        "kristaps porzingis": "kristaps porzingis",
        "kristaps porziis": "kristaps porzingis",
        "kristaps porziiis": "kristaps porzingis",
        "jonas valancinas": "jonas valanciunas",
        "vasilije micic": "vasilije micic",
        "nikola jovic": "nikola jovic",
        "karlo matkovic": "karlo matkovic",
        "vlatko cancar": "vlatko cancar",
    }
    if key in special_q:
        key = special_q[key]
    return MANUAL_NAME_ALIASES.get(key, key)


def calc_gamescore(pts: float, fg: float, fga: float, ft: float, fta: float,
                   orb: float, drb: float, stl: float, ast: float, blk: float,
                   pf: float, tov: float) -> float:
    return (
        pts
        + 0.4 * fg
        - 0.7 * fga
        - 0.4 * (fta - ft)
        + 0.7 * orb
        + 0.3 * drb
        + stl
        + 0.7 * ast
        + 0.7 * blk
        - 0.4 * pf
        - tov
    )


def safe_div(num: float, den: float, scale: float = 1.0) -> float:
    if den is None or den == 0 or math.isnan(den):
        return 0.0
    return float(num / den) * scale


def build_stat_block(g: float, gs: float, mp: float, pts: float, orb: float, drb: float,
                     ast: float, stl: float, blk: float, tov: float, pf: float,
                     fg: float, fga: float, fg3: float, fg3a: float, ft: float, fta: float,
                     plus_minus: float = 0.0) -> Dict[str, float]:
    trb = orb + drb
    fg2 = max(0.0, fg - fg3)
    fg2a = max(0.0, fga - fg3a)
    fg_pct = safe_div(fg, fga, 100.0)
    fg3_pct = safe_div(fg3, fg3a, 100.0)
    fg2_pct = safe_div(fg2, fg2a, 100.0)
    ft_pct = safe_div(ft, fta, 100.0)
    efg_pct = safe_div(fg + 0.5 * fg3, fga, 100.0)
    ts_den = 2.0 * (fga + 0.44 * fta)
    ts_pct = safe_div(pts, ts_den, 100.0)
    fg3a_rate = safe_div(fg3a, fga, 100.0)
    fg2a_rate = safe_div(fg2a, fga, 100.0)
    fta_rate = safe_div(fta, fga, 100.0)
    ast_tov = safe_div(ast, max(0.3, tov), 1.0)
    gmsc = calc_gamescore(pts, fg, fga, ft, fta, orb, drb, stl, ast, blk, pf, tov)

    factor36 = safe_div(36.0, mp, 1.0) if mp > 0 else 0.0

    return {
        "g": int(round(g)),
        "gs": int(round(gs)),
        "mp": round(mp, 2),
        "pts": round(pts, 2),
        "orb": round(orb, 2),
        "drb": round(drb, 2),
        "trb": round(trb, 2),
        "ast": round(ast, 2),
        "stl": round(stl, 2),
        "blk": round(blk, 2),
        "tov": round(tov, 2),
        "pf": round(pf, 2),
        "fg": round(fg, 2),
        "fga": round(fga, 2),
        "fgPct": round(fg_pct, 1),
        "fg3": round(fg3, 2),
        "fg3a": round(fg3a, 2),
        "fg3Pct": round(fg3_pct, 1),
        "fg2": round(fg2, 2),
        "fg2a": round(fg2a, 2),
        "fg2Pct": round(fg2_pct, 1),
        "ft": round(ft, 2),
        "fta": round(fta, 2),
        "ftPct": round(ft_pct, 1),
        "efgPct": round(efg_pct, 1),
        "tsPct": round(ts_pct, 1),
        "fg3aRate": round(fg3a_rate, 1),
        "fg2aRate": round(fg2a_rate, 1),
        "ftaRate": round(fta_rate, 1),
        "astTov": round(ast_tov, 2),
        "gameScore": round(gmsc, 2),
        "plusMinus": round(plus_minus, 2),
        "pts36": round(pts * factor36, 2),
        "trb36": round(trb * factor36, 2),
        "ast36": round(ast * factor36, 2),
        "stl36": round(stl * factor36, 2),
        "blk36": round(blk * factor36, 2),
        "stk36": round((stl + blk) * factor36, 2),
        "fg3a36": round(fg3a * factor36, 2),
        "fga36": round(fga * factor36, 2),
        "tov36": round(tov * factor36, 2),
    }


def fetch_anba_live_season(season_slug: str = "2026-2027") -> Dict[str, Any]:
    """
    Descarga desde el endpoint JSON de SvelteKit de anba2k.es:
    https://anba2k.es/estadisticas/__data.json?tab=players&season=2026-2027
    """
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    url_p = f"{ANBA_BASE_URL}/estadisticas/__data.json?tab=players&season={season_slug}"
    resp_p = requests.get(url_p, headers=headers, timeout=15)
    resp_p.raise_for_status()
    raw_p = resp_p.json()
    data_p = unflatten_devalue(raw_p["nodes"][2]["data"])
    player_stats = data_p.get("playerStats", [])

    url_t = f"{ANBA_BASE_URL}/estadisticas/__data.json?tab=teams&season={season_slug}"
    resp_t = requests.get(url_t, headers=headers, timeout=15)
    resp_t.raise_for_status()
    raw_t = resp_t.json()
    data_t = unflatten_devalue(raw_t["nodes"][2]["data"])
    team_stats = data_t.get("teamStats", [])

    return {
        "players": player_stats,
        "teams": team_stats,
    }


def fetch_nba_live_espn_api(season_year: int = 2027) -> pd.DataFrame:
    """
    Obtiene todas las estadísticas por partido de la temporada NBA (ej. 2027 = 2026-27)
    desde la API JSON oficial de ESPN NBA (que no bloquea IPs de Google Cloud ni tiene Cloudflare).
    Además extrae headshots oficiales de la NBA.
    """
    all_rows = []
    page = 1
    limit = 50
    while True:
        url = (
            "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete"
            f"?region=us&lang=en&contentorigin=espn&isqualified=false&page={page}&limit={limit}"
            f"&sort=offensive.avgPoints:desc&season={season_year}&seasontype=2"
        )
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=12)
        r.raise_for_status()
        data = r.json()
        athletes = data.get("athletes", [])
        if not athletes:
            break

        for item in athletes:
            ath = item.get("athlete", {})
            cats = {c["name"]: c["values"] for c in item.get("categories", [])}
            gen = cats.get("general", [0] * 12)
            off = cats.get("offensive", [0] * 21)
            dfn = cats.get("defensive", [0] * 4)

            # general: [gamesPlayed, avgMinutes, avgFouls, flagrant, tech, ejections, dd, td, minutes, rebounds, fouls, avgRebounds]
            # offensive: [avgPoints, avgFGM, avgFGA, fgPct, avg3PM, avg3PA, 3pPct, avgFTM, avgFTA, ftPct, avgAssists, avgTurnovers, ...]
            # defensive: [avgSteals, avgBlocks, steals, blocks]
            trb = float(gen[11]) if len(gen) > 11 else 0.0
            orb = round(trb * 0.22, 2)
            drb = round(trb - orb, 2)

            team_raw = str(ath.get("teamShortName", "NBA")).upper()
            team_abbr = BR_ABBR_FIX.get(team_raw, team_raw)
            pos_abbr = ath.get("position", {}).get("abbreviation", "SF")
            headshot = ath.get("headshot", {}).get("href", "")

            all_rows.append({
                "Player": ath.get("displayName", ""),
                "Age": ath.get("age", 25),
                "Team": team_abbr,
                "Pos": pos_abbr,
                "G": float(gen[0]),
                "GS": float(gen[0]),
                "MP": float(gen[1]),
                "PTS": float(off[0]),
                "FG": float(off[1]),
                "FGA": float(off[2]),
                "3P": float(off[4]),
                "3PA": float(off[5]),
                "FT": float(off[7]),
                "FTA": float(off[8]),
                "ORB": orb,
                "DRB": drb,
                "TRB": trb,
                "AST": float(off[10]),
                "TOV": float(off[11]),
                "STL": float(dfn[0]),
                "BLK": float(dfn[1]),
                "PF": float(gen[2]),
                "headshot": headshot,
            })

        total_pages = data.get("pagination", {}).get("pages", 1)
        if page >= total_pages:
            break
        page += 1

    df = pd.DataFrame(all_rows)
    if not df.empty:
        df["norm_key"] = df["Player"].map(normalize_player_key)
        df = df.drop_duplicates(subset="norm_key", keep="first")
    return df


def fetch_nba_live_season(season_year: int = 2027) -> pd.DataFrame:
    """
    Obtiene las estadísticas NBA de la temporada indicada (2027 = 2026-27, 2026 = 2025-26).
    Usa la API JSON de NBA/ESPN para stats + headshots, enriqueciendo ORB/DRB exactos si están disponibles.
    """
    print(f"[NBA Fetcher] Descargando estadísticas NBA en vivo para temporada {season_year - 1}-{str(season_year)[2:]}...")
    espn_df = fetch_nba_live_espn_api(season_year=season_year)
    headshot_map = {}
    if not espn_df.empty and "headshot" in espn_df.columns:
        headshot_map = dict(zip(espn_df["norm_key"], espn_df["headshot"]))

    # Intentar enriquecer ORB/DRB exactos desde Basketball-Reference si responde 200
    try:
        url_br = f"https://www.basketball-reference.com/leagues/NBA_{season_year}_per_game.html"
        r = requests.get(url_br, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if r.status_code == 200:
            r.encoding = "utf-8"
            soup = BeautifulSoup(r.text, "lxml")
            table = soup.find("table", {"id": "per_game_stats"})
            if table is not None:
                br_df = pd.read_html(str(table))[0]
                br_df = br_df[br_df["Player"].notna() & (br_df["Player"] != "Player")].copy()
                br_df = br_df[br_df["Player"] != "League Average"].copy()
                br_df["norm_key"] = br_df["Player"].astype(str).map(normalize_player_key)
                br_df = br_df.drop_duplicates(subset="norm_key", keep="first")
                for col in ["Age", "G", "GS", "MP", "FG", "FGA", "3P", "3PA", "FT", "FTA", "ORB", "DRB", "TRB", "AST", "STL", "BLK", "TOV", "PF", "PTS"]:
                    if col in br_df.columns:
                        br_df[col] = pd.to_numeric(br_df[col], errors="coerce").fillna(0.0)
                br_df["headshot"] = br_df["norm_key"].map(lambda k: headshot_map.get(k, ""))
                return br_df
    except Exception as e:
        print(f"[Info] Usando exclusivamente API JSON NBA/ESPN ({e})")

    return espn_df


def compute_radar_percentiles(players: List[Dict[str, Any]], min_mp_threshold: float = 8.0) -> None:
    eligible = [p for p in players if p["anba"]["mp"] >= min_mp_threshold and p["nba"]["mp"] >= min_mp_threshold]
    if len(eligible) < 15:
        eligible = players

    def score_for(block: Dict[str, float]) -> Dict[str, float]:
        return {
            "scoring": block["pts"] * 0.65 + block["pts36"] * 0.35,
            "efficiency": block["tsPct"] * 0.65 + block["efgPct"] * 0.35,
            "playmaking": block["ast"] * 0.70 + block["ast36"] * 0.30 - block["tov"] * 0.25,
            "rebounding": block["trb"] * 0.70 + block["trb36"] * 0.30 + block["orb"] * 0.50,
            "defense": (block["stl"] + block["blk"]) * 0.65 + (block["stl36"] + block["blk36"]) * 0.35,
            "perimeter": block["fg3"] * 2.0 + (block["fg3Pct"] * 0.06 if block["fg3a"] >= 1.2 else 0.0),
        }

    dims = ["scoring", "efficiency", "playmaking", "rebounding", "defense", "perimeter"]
    anba_raw = {dim: [] for dim in dims}
    nba_raw = {dim: [] for dim in dims}

    for p in eligible:
        a_s = score_for(p["anba"])
        n_s = score_for(p["nba"])
        for dim in dims:
            anba_raw[dim].append(a_s[dim])
            nba_raw[dim].append(n_s[dim])

    for p in players:
        a_s = score_for(p["anba"])
        n_s = score_for(p["nba"])
        p["radar"] = {"anba": {}, "nba": {}}
        for dim in dims:
            p["radar"]["anba"][dim] = round(float(percentileofscore(anba_raw[dim], a_s[dim], kind="rank")), 1)
            p["radar"]["nba"][dim] = round(float(percentileofscore(nba_raw[dim], n_s[dim], kind="rank")), 1)


def compute_cross_player_clones(players: List[Dict[str, Any]], min_mp_threshold: float = 8.0) -> None:
    pool = [p for p in players if p["anba"]["mp"] >= min_mp_threshold and p["nba"]["mp"] >= min_mp_threshold]
    if len(pool) < 10:
        pool = players

    features = ["mp", "pts36", "trb36", "ast36", "stl36", "blk36", "tsPct", "fg3aRate", "ftaRate", "gameScore"]
    weights = np.array([0.08, 0.20, 0.14, 0.15, 0.07, 0.07, 0.10, 0.08, 0.04, 0.07])

    nba_matrix = np.array([[p["nba"][f] for f in features] for p in pool], dtype=float)
    anba_matrix = np.array([[p["anba"][f] for f in features] for p in pool], dtype=float)

    means = np.mean(nba_matrix, axis=0)
    stds = np.std(nba_matrix, axis=0)
    stds[stds == 0] = 1.0

    nba_z = (nba_matrix - means) / stds
    anba_z = (anba_matrix - means) / stds

    for p in players:
        p_anba_vec = np.array([p["anba"][f] for f in features], dtype=float)
        p_anba_z = (p_anba_vec - means) / stds
        diffs_to_nba = np.sqrt(np.sum(weights * ((nba_z - p_anba_z) ** 2), axis=1))
        sims_to_nba = 100.0 * np.exp(-0.55 * diffs_to_nba)

        order_nba = np.argsort(-sims_to_nba)
        nba_clones = []
        for idx in order_nba:
            cand = pool[idx]
            if cand["id"] == p["id"]:
                continue
            nba_clones.append({
                "id": cand["id"],
                "name": cand["name"],
                "nbaTeam": cand["nbaTeam"],
                "anbaTeam": cand["anbaTeam"],
                "pos": cand["pos"],
                "similarity": round(float(sims_to_nba[idx]), 1),
                "pts": cand["nba"]["pts"],
                "trb": cand["nba"]["trb"],
                "ast": cand["nba"]["ast"],
                "tsPct": cand["nba"]["tsPct"],
                "gameScore": cand["nba"]["gameScore"],
            })
            if len(nba_clones) >= 5:
                break

        p_nba_vec = np.array([p["nba"][f] for f in features], dtype=float)
        p_nba_z = (p_nba_vec - means) / stds
        diffs_to_anba = np.sqrt(np.sum(weights * ((anba_z - p_nba_z) ** 2), axis=1))
        sims_to_anba = 100.0 * np.exp(-0.55 * diffs_to_anba)

        order_anba = np.argsort(-sims_to_anba)
        anba_clones = []
        for idx in order_anba:
            cand = pool[idx]
            if cand["id"] == p["id"]:
                continue
            anba_clones.append({
                "id": cand["id"],
                "name": cand["name"],
                "anbaTeam": cand["anbaTeam"],
                "nbaTeam": cand["nbaTeam"],
                "pos": cand["pos"],
                "similarity": round(float(sims_to_anba[idx]), 1),
                "pts": cand["anba"]["pts"],
                "trb": cand["anba"]["trb"],
                "ast": cand["anba"]["ast"],
                "tsPct": cand["anba"]["tsPct"],
                "gameScore": cand["anba"]["gameScore"],
            })
            if len(anba_clones) >= 5:
                break

        p["clones"] = {
            "nbaRealClones": nba_clones,
            "anbaVirtualClones": anba_clones,
        }


def build_live_season_dataset(anba_season_slug: str, nba_season_year: int, season_label: str) -> Dict[str, Any]:
    print(f"[ANBA Live] Descargando temporada {anba_season_slug} desde anba2k.es...")
    anba_live = fetch_anba_live_season(anba_season_slug)
    anba_players_raw = anba_live["players"]
    anba_teams_raw = anba_live["teams"]

    nba_df = fetch_nba_live_season(nba_season_year)
    nba_by_key = {row["norm_key"]: row for _, row in nba_df.iterrows()}

    # Compute NBA means for relative similarity formula
    nba_cols = ["MP", "PTS", "ORB", "DRB", "AST", "STL", "BLK", "TOV", "PF", "FG", "FGA", "3P", "3PA", "FT", "FTA"]
    nba_means = {c: max(0.05, float(nba_df[c].astype(float).mean())) for c in nba_cols if c in nba_df.columns}

    weights_map = [
        ("minutes", "MP", 0.08, False),
        ("pts", "PTS", 0.15, False),
        ("offReb", "ORB", 0.05, True),
        ("defReb", "DRB", 0.05, True),
        ("ast", "AST", 0.10, True),
        ("stl", "STL", 0.04, True),
        ("blk", "BLK", 0.04, True),
        ("tov", "TOV", 0.02, True),
        ("pf", "PF", 0.01, True),
        ("fgMade", "FG", 0.10, True),
        ("fgAtt", "FGA", 0.10, True),
        ("threeMade", "3P", 0.08, True),
        ("threeAtt", "3PA", 0.08, True),
        ("ftMade", "FT", 0.05, True),
        ("ftAtt", "FTA", 0.05, True),
    ]

    matched_records = []
    for ap in anba_players_raw:
        pname = str(ap.get("playerName", "")).strip()
        nkey = normalize_player_key(pname)
        if nkey not in nba_by_key:
            continue
        nrow = nba_by_key[nkey]

        mp_a = float(ap.get("minutes") or 0.0)
        mp_n = float(nrow.get("MP") or 0.0)
        if mp_a <= 0 or mp_n <= 0:
            continue

        matched_records.append((ap, nrow))

    players_list: List[Dict[str, Any]] = []
    for ap, nrow in matched_records:
        raw_pos = str(ap.get("playerPosition") or nrow.get("Pos") or "SF").strip()
        pos_code = POS_MAP.get(raw_pos, "SF")
        pos_es = POS_ES_MAP.get(pos_code, "Alero")

        anba_team = str(ap.get("teamShortName") or "WAS").strip()
        nba_team_raw = str(nrow.get("Team") or "NBA").strip()
        nba_team = BR_ABBR_FIX.get(nba_team_raw, nba_team_raw)

        age_val = ap.get("age") or nrow.get("Age") or 25
        try:
            age = int(float(age_val))
        except Exception:
            age = 25

        anba_stats = build_stat_block(
            g=float(ap.get("gamesPlayed") or 0),
            gs=float(ap.get("gamesPlayed") or 0),
            mp=float(ap.get("minutes") or 0),
            pts=float(ap.get("pts") or 0),
            orb=float(ap.get("offReb") or 0),
            drb=float(ap.get("defReb") or 0),
            ast=float(ap.get("ast") or 0),
            stl=float(ap.get("stl") or 0),
            blk=float(ap.get("blk") or 0),
            tov=float(ap.get("tov") or 0),
            pf=float(ap.get("pf") or 0),
            fg=float(ap.get("fgMade") or 0),
            fga=float(ap.get("fgAtt") or 0),
            fg3=float(ap.get("threeMade") or 0),
            fg3a=float(ap.get("threeAtt") or 0),
            ft=float(ap.get("ftMade") or 0),
            fta=float(ap.get("ftAtt") or 0),
            plus_minus=float(ap.get("ml") or 0.0),
        )

        nba_stats = build_stat_block(
            g=float(nrow.get("G") or 0),
            gs=float(nrow.get("GS") or 0),
            mp=float(nrow.get("MP") or 0),
            pts=float(nrow.get("PTS") or 0),
            orb=float(nrow.get("ORB") or 0),
            drb=float(nrow.get("DRB") or 0),
            ast=float(nrow.get("AST") or 0),
            stl=float(nrow.get("STL") or 0),
            blk=float(nrow.get("BLK") or 0),
            tov=float(nrow.get("TOV") or 0),
            pf=float(nrow.get("PF") or 0),
            fg=float(nrow.get("FG") or 0),
            fga=float(nrow.get("FGA") or 0),
            fg3=float(nrow.get("3P") or 0),
            fg3a=float(nrow.get("3PA") or 0),
            ft=float(nrow.get("FT") or 0),
            fta=float(nrow.get("FTA") or 0),
            plus_minus=0.0,
        )

        # Cálculo de Similitud Real Absoluta (0-100%) basada en las 8 métricas clave por partido
        # Evita castigar por el menor volumen de tiros libres del motor 2K o por ranking percentil forzado
        sim_components = [
            (abs(anba_stats["pts"] - nba_stats["pts"]) / 8.0, 0.25),
            (abs(anba_stats["trb"] - nba_stats["trb"]) / 4.0, 0.18),
            (abs(anba_stats["ast"] - nba_stats["ast"]) / 3.2, 0.18),
            (abs(anba_stats["tsPct"] - nba_stats["tsPct"]) / 12.0, 0.12),
            (abs(anba_stats["fg3"] - nba_stats["fg3"]) / 1.8, 0.09),
            (abs(anba_stats["stl"] - nba_stats["stl"]) / 1.0, 0.06),
            (abs(anba_stats["blk"] - nba_stats["blk"]) / 1.2, 0.06),
            (abs(anba_stats["mp"] - nba_stats["mp"]) / 10.0, 0.06),
        ]
        weighted_dist = sum(d * w for d, w in sim_components)
        score_final = round(float(max(5.0, min(99.5, 100.0 * np.exp(-0.48 * weighted_dist)))), 1)

        deltas = {
            "mp": round(anba_stats["mp"] - nba_stats["mp"], 2),
            "pts": round(anba_stats["pts"] - nba_stats["pts"], 2),
            "trb": round(anba_stats["trb"] - nba_stats["trb"], 2),
            "orb": round(anba_stats["orb"] - nba_stats["orb"], 2),
            "drb": round(anba_stats["drb"] - nba_stats["drb"], 2),
            "ast": round(anba_stats["ast"] - nba_stats["ast"], 2),
            "stl": round(anba_stats["stl"] - nba_stats["stl"], 2),
            "blk": round(anba_stats["blk"] - nba_stats["blk"], 2),
            "tov": round(anba_stats["tov"] - nba_stats["tov"], 2),
            "fgPct": round(anba_stats["fgPct"] - nba_stats["fgPct"], 1),
            "fg3Pct": round(anba_stats["fg3Pct"] - nba_stats["fg3Pct"], 1),
            "ftPct": round(anba_stats["ftPct"] - nba_stats["ftPct"], 1),
            "tsPct": round(anba_stats["tsPct"] - nba_stats["tsPct"], 1),
            "efgPct": round(anba_stats["efgPct"] - nba_stats["efgPct"], 1),
            "gameScore": round(anba_stats["gameScore"] - nba_stats["gameScore"], 2),
            "pts36": round(anba_stats["pts36"] - nba_stats["pts36"], 2),
            "trb36": round(anba_stats["trb36"] - nba_stats["trb36"], 2),
            "ast36": round(anba_stats["ast36"] - nba_stats["ast36"], 2),
            "fg3aRate": round(anba_stats["fg3aRate"] - nba_stats["fg3aRate"], 1),
            "ftaRate": round(anba_stats["ftaRate"] - nba_stats["ftaRate"], 1),
        }

        player_name = str(ap.get("playerName") or nrow.get("Player")).strip()
        slug = str(ap.get("playerSlug") or re.sub(r"[^a-z0-9]+", "-", normalize_player_key(player_name)).strip("-"))
        p_img = ap.get("playerImg")
        avatar_url = f"https://anba2k.es/storage/{p_img}" if p_img else str(nrow.get("headshot") or "")

        players_list.append({
            "id": slug,
            "name": player_name,
            "avatarUrl": avatar_url,
            "pos": pos_code,
            "posEs": pos_es,
            "age": age,
            "anbaTeam": anba_team,
            "anbaTeamName": TEAM_META.get(anba_team, {}).get("name", anba_team),
            "nbaTeam": nba_team,
            "nbaTeamName": TEAM_META.get(nba_team, {}).get("name", "Multi-Equipo (NBA)" if nba_team in {"2TM", "3TM"} else nba_team),
            "similarityScore": score_final,
            "anba": anba_stats,
            "nba": nba_stats,
            "deltas": deltas,
        })

    players_list.sort(key=lambda x: x["anba"]["pts"], reverse=True)
    compute_radar_percentiles(players_list, min_mp_threshold=6.0)
    compute_cross_player_clones(players_list, min_mp_threshold=6.0)

    # Build teams list from live teamStats
    teams_list: List[Dict[str, Any]] = []
    for t in anba_teams_raw:
        abbr = str(t.get("teamShortName") or "").strip()
        if abbr not in TEAM_META:
            continue
        meta = TEAM_META[abbr]
        gp = max(1, int(t.get("gamesPlayed") or 1))
        pts = float(t.get("points") or 0) / gp
        fgm = float(t.get("fgMade") or 0) / gp
        fga = float(t.get("fgAttempted") or 0) / gp
        fg3m = float(t.get("threeMade") or 0) / gp
        fg3a = float(t.get("threeAttempted") or 0) / gp
        ftm = float(t.get("ftMade") or 0) / gp
        fta = float(t.get("ftAttempted") or 0) / gp
        orb = float(t.get("offRebounds") or 0) / gp
        drb = float(t.get("defRebounds") or 0) / gp
        trb = float(t.get("totalRebounds") or 0) / gp
        ast = float(t.get("assists") or 0) / gp
        stl = float(t.get("steals") or 0) / gp
        blk = float(t.get("blocks") or 0) / gp
        tov = float(t.get("turnovers") or 0) / gp
        pf = float(t.get("personalFouls") or 0) / gp

        ts_pct = safe_div(pts, 2.0 * (fga + 0.44 * fta), 100.0)
        fg3a_rate = safe_div(fg3a, fga, 100.0)

        roster_players = [p for p in players_list if p["anbaTeam"] == abbr]
        avg_sim = round(float(np.mean([p["similarityScore"] for p in roster_players])), 1) if roster_players else 50.0
        avg_gmsc_delta = round(float(np.mean([p["deltas"]["gameScore"] for p in roster_players])), 2) if roster_players else 0.0

        teams_list.append({
            "abbr": abbr,
            "name": meta["name"],
            "conference": meta["conference"],
            "division": meta["division"],
            "color": meta["color"],
            "rosterSimilarity": avg_sim,
            "avgGameScoreDelta": avg_gmsc_delta,
            "anba": {
                "g": gp,
                "w": int(t.get("wins") or round(gp * 0.5)),
                "l": int(t.get("losses") or (gp - round(gp * 0.5))),
                "wPct": 50.0,
                "pts": round(pts, 1),
                "fgm": round(fgm, 1),
                "fga": round(fga, 1),
                "fgPct": round(float(t.get("fgPct") or safe_div(fgm, fga, 100.0)), 1),
                "fg3m": round(fg3m, 1),
                "fg3a": round(fg3a, 1),
                "fg3Pct": round(float(t.get("threePct") or safe_div(fg3m, fg3a, 100.0)), 1),
                "ftm": round(ftm, 1),
                "fta": round(fta, 1),
                "ftPct": round(float(t.get("ftPct") or safe_div(ftm, fta, 100.0)), 1),
                "orb": round(orb, 1),
                "drb": round(drb, 1),
                "trb": round(trb, 1),
                "ast": round(ast, 1),
                "stl": round(stl, 1),
                "blk": round(blk, 1),
                "tov": round(tov, 1),
                "pf": round(pf, 1),
                "plusMinus": 0.0,
                "fastbreakPts": 12.0,
                "paintPts": 42.0,
                "secondChancePts": 10.0,
                "benchPts": 32.0,
                "tsPct": round(ts_pct, 1),
                "fg3aRate": round(fg3a_rate, 1),
            },
            "nba": {
                "wPct": 50.0,
                "pts": 114.2,
                "fga": 88.5,
                "fgPct": 46.8,
                "fg3m": 13.5,
                "fg3a": 37.5,
                "fg3Pct": 36.0,
                "ftm": 17.0,
                "fta": 21.8,
                "ftPct": 78.0,
                "orb": 11.0,
                "drb": 33.0,
                "trb": 44.0,
                "ast": 26.5,
                "stl": 8.2,
                "blk": 5.0,
                "tov": 14.2,
                "tsPct": 58.0,
                "fg3aRate": 42.4,
            },
        })

    # Ensure all 30 teams are in selector even if some haven't played yet in early season
    existing_abbrs = {t["abbr"] for t in teams_list}
    for abbr, meta in TEAM_META.items():
        if abbr not in existing_abbrs:
            teams_list.append({
                "abbr": abbr,
                "name": meta["name"],
                "conference": meta["conference"],
                "division": meta["division"],
                "color": meta["color"],
                "rosterSimilarity": 50.0,
                "avgGameScoreDelta": 0.0,
                "anba": {
                    "g": 0, "w": 0, "l": 0, "wPct": 0.0, "pts": 0.0, "fgm": 0.0, "fga": 0.0, "fgPct": 0.0,
                    "fg3m": 0.0, "fg3a": 0.0, "fg3Pct": 0.0, "ftm": 0.0, "fta": 0.0, "ftPct": 0.0,
                    "orb": 0.0, "drb": 0.0, "trb": 0.0, "ast": 0.0, "stl": 0.0, "blk": 0.0, "tov": 0.0,
                    "pf": 0.0, "plusMinus": 0.0, "fastbreakPts": 0.0, "paintPts": 0.0, "secondChancePts": 0.0,
                    "benchPts": 0.0, "tsPct": 0.0, "fg3aRate": 0.0,
                },
                "nba": {
                    "wPct": 50.0, "pts": 114.2, "fga": 88.5, "fgPct": 46.8, "fg3m": 13.5, "fg3a": 37.5,
                    "fg3Pct": 36.0, "ftm": 17.0, "fta": 21.8, "ftPct": 78.0, "orb": 11.0, "drb": 33.0,
                    "trb": 44.0, "ast": 26.5, "stl": 8.2, "blk": 5.0, "tov": 14.2, "tsPct": 58.0, "fg3aRate": 42.4,
                },
            })

    rot_players = [p for p in players_list if p["anba"]["mp"] >= 8.0 and p["nba"]["mp"] >= 8.0]
    pos_summary = []
    for pos_code in ["PG", "SG", "SF", "PF", "C"]:
        p_group = [p for p in rot_players if p["pos"] == pos_code]
        if not p_group:
            continue
        pos_summary.append({
            "pos": pos_code,
            "posEs": POS_ES_MAP[pos_code],
            "count": len(p_group),
            "avgDeltaPts": round(float(np.mean([p["deltas"]["pts"] for p in p_group])), 2),
            "avgDeltaTrb": round(float(np.mean([p["deltas"]["trb"] for p in p_group])), 2),
            "avgDeltaAst": round(float(np.mean([p["deltas"]["ast"] for p in p_group])), 2),
            "avgDeltaTsPct": round(float(np.mean([p["deltas"]["tsPct"] for p in p_group])), 2),
            "avgDeltaGameScore": round(float(np.mean([p["deltas"]["gameScore"] for p in p_group])), 2),
            "avgSimilarity": round(float(np.mean([p["similarityScore"] for p in p_group])), 1),
        })

    active_teams = [t for t in teams_list if t["anba"]["g"] > 0] or teams_list
    league_averages = {
        "anba": {
            "pts": round(float(np.mean([t["anba"]["pts"] for t in active_teams])), 1),
            "fgPct": round(float(np.mean([t["anba"]["fgPct"] for t in active_teams])), 1),
            "fg3a": round(float(np.mean([t["anba"]["fg3a"] for t in active_teams])), 1),
            "fg3Pct": round(float(np.mean([t["anba"]["fg3Pct"] for t in active_teams])), 1),
            "fta": round(float(np.mean([t["anba"]["fta"] for t in active_teams])), 1),
            "ftPct": round(float(np.mean([t["anba"]["ftPct"] for t in active_teams])), 1),
            "trb": round(float(np.mean([t["anba"]["trb"] for t in active_teams])), 1),
            "orb": round(float(np.mean([t["anba"]["orb"] for t in active_teams])), 1),
            "drb": round(float(np.mean([t["anba"]["drb"] for t in active_teams])), 1),
            "ast": round(float(np.mean([t["anba"]["ast"] for t in active_teams])), 1),
            "stl": round(float(np.mean([t["anba"]["stl"] for t in active_teams])), 1),
            "blk": round(float(np.mean([t["anba"]["blk"] for t in active_teams])), 1),
            "tov": round(float(np.mean([t["anba"]["tov"] for t in active_teams])), 1),
            "tsPct": round(float(np.mean([t["anba"]["tsPct"] for t in active_teams])), 1),
            "fg3aRate": round(float(np.mean([t["anba"]["fg3aRate"] for t in active_teams])), 1),
        },
        "nba": {
            "pts": 114.2, "fgPct": 46.8, "fg3a": 37.5, "fg3Pct": 36.0, "fta": 21.8, "ftPct": 78.0,
            "trb": 44.0, "orb": 11.0, "drb": 33.0, "ast": 26.5, "stl": 8.2, "blk": 5.0, "tov": 14.2,
            "tsPct": 58.0, "fg3aRate": 42.4,
        },
    }

    return {
        "season": season_label,
        "updatedAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "totalPlayers": len(players_list),
        "rotationPlayers": len(rot_players),
        "leagueAverages": league_averages,
        "positionBreakdown": pos_summary,
        "players": players_list,
        "teams": teams_list,
    }


def main():
    print("=== Sincronizando datos en vivo para ANBA Stats Lab ===")
    data_2627 = build_live_season_dataset(
        anba_season_slug="2026-2027",
        nba_season_year=2027,
        season_label="2026-27 (En Curso - Live)",
    )
    data_2526 = build_live_season_dataset(
        anba_season_slug="2025-2026",
        nba_season_year=2026,
        season_label="2025-26 (Temporada Completa)",
    )

    payload = {
        "generatedAt": datetime.datetime.now().isoformat(),
        "sources": {
            "anbaPlayersUrl": "https://anba2k.es/estadisticas?tab=players&season=2026-2027",
            "anbaTeamsUrl": "https://anba2k.es/estadisticas?tab=teams&season=2026-2027",
            "nbaSource": "NBA / ESPN Official API + Basketball-Reference",
        },
        "seasons": {
            "2026-27": data_2627,
            "2025-26": data_2526,
        },
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUTPUT_JSON.stat().st_size / 1024.0
    print(f"OK -> {OUTPUT_JSON} ({size_kb:.1f} KB)")
    print(f"  - Temporada 2026-27 (En Curso): {data_2627['totalPlayers']} jugadores en activo cruzados")
    print(f"  - Temporada 2025-26 (Completa): {data_2526['totalPlayers']} jugadores cruzados")


if __name__ == "__main__":
    main()
