# -*- coding: utf-8 -*-
"""
Scraper autónomo de ANBA (https://anba2k.es) y NBA Real (Basketball-Reference / NBA API)
Totalmente independiente del bot de Discord/Telegram de ANBA.

Uso:
  C:\\Users\\luisr\\anaconda3\\python.exe scripts/scrape_anba_live.py --season 2025-2026
"""

import argparse
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent.parent
LIVE_DATA_DIR = BASE_DIR / "data" / "live"

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}


def extract_max_page(soup: BeautifulSoup) -> int:
    hrefs = [a.get("href", "") for a in soup.select("a[href*='page=']")]
    pages: List[int] = []
    for h in hrefs:
        m = re.search(r"[?&]page=(\d+)", h)
        if m:
            pages.append(int(m.group(1)))
    if pages:
        return max(pages)

    spans = soup.select("span.font-medium")
    nums: List[int] = []
    for sp in spans:
        nums += [int(x) for x in re.findall(r"\d+", sp.get_text(" ", strip=True))]
    total = max(nums) if nums else 20
    return max(1, math.ceil(total / 20))


def scrape_anba_players(season: str = "2025-2026", phase: str = "regular") -> pd.DataFrame:
    url = "https://anba2k.es/estadisticas/jugadores"
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    base_params: Dict[str, Any] = {
        "season": season,
        "order": "player_name",
        "order_direction": "asc",
    }
    if phase == "playoffs":
        base_params["phase"] = "playoffs"

    resp0 = session.get(url, params=base_params, timeout=20)
    resp0.raise_for_status()
    soup0 = BeautifulSoup(resp0.text, "lxml")
    n_pages = extract_max_page(soup0)

    print(f"[ANBA Scraper] Extrayendo {n_pages} páginas de jugadores (temporada {season})...")
    dfs: List[pd.DataFrame] = []

    for page in range(1, n_pages + 1):
        params = dict(base_params, page=page)
        resp = session.get(url, params=params, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        table = soup.select_one("table.players-stats")
        if table is None:
            break
        page_dfs = pd.read_html(str(table), decimal=",", thousands=".")
        if page_dfs:
            df = page_dfs[0]
            df.columns = [str(c).strip() for c in df.columns]
            dfs.append(df)

    out = pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()
    return out


def scrape_anba_teams(season: str = "2025-2026", phase: str = "regular") -> pd.DataFrame:
    url = "https://anba2k.es/estadisticas/equipos"
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    params: Dict[str, Any] = {
        "season": season,
        "order": "PER_W",
        "order_direction": "desc",
    }
    if phase == "playoffs":
        params["phase"] = "playoffs"

    print(f"[ANBA Scraper] Extrayendo estadísticas de equipos (temporada {season})...")
    resp = session.get(url, params=params, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")
    table = soup.select_one("table.players-stats")
    if table is None:
        raise ValueError("No se encontró table.players-stats en la página de equipos de ANBA.")
    dfs = pd.read_html(str(table), decimal=",", thousands=".")
    df = dfs[0]
    df.columns = [str(c).strip() for c in df.columns]
    return df


def main():
    parser = argparse.ArgumentParser(description="Scraper en vivo de ANBA")
    parser.add_argument("--season", default="2025-2026", help="Temporada ANBA (ej. 2025-2026)")
    args = parser.parse_args()

    LIVE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    players_df = scrape_anba_players(season=args.season)
    teams_df = scrape_anba_teams(season=args.season)

    players_out = LIVE_DATA_DIR / f"anba_players_{args.season}.csv"
    teams_out = LIVE_DATA_DIR / f"anba_teams_{args.season}.csv"

    players_df.to_csv(players_out, index=False, encoding="utf-8")
    teams_df.to_csv(teams_out, index=False, encoding="utf-8")
    print(f"[OK] Guardados {len(players_df)} jugadores en {players_out}")
    print(f"[OK] Guardados {len(teams_df)} equipos en {teams_out}")


if __name__ == "__main__":
    main()
