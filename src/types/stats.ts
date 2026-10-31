export interface StatBlock {
  g: number;
  gs: number;
  mp: number;
  totalMp: number;
  pts: number;
  orb: number;
  drb: number;
  trb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fg: number;
  fga: number;
  fgPct: number;
  fg3: number;
  fg3a: number;
  fg3Pct: number;
  fg2: number;
  fg2a: number;
  fg2Pct: number;
  ft: number;
  fta: number;
  ftPct: number;
  efgPct: number;
  tsPct: number;
  fg3aRate: number;
  fg2aRate: number;
  ftaRate: number;
  threePar: number;
  ftr: number;
  orbPct: number;
  drbPct: number;
  trbPct: number;
  astPct: number;
  stlPct: number;
  blkPct: number;
  tovPct: number;
  usgPct: number;
  per: number;
  ows: number;
  dws: number;
  ws: number;
  ws48: number;
  astTov: number;
  gameScore: number;
  plusMinus: number;
  pts36: number;
  trb36: number;
  ast36: number;
  stl36: number;
  blk36: number;
  stk36: number;
  fg3a36: number;
  fga36: number;
  tov36: number;
}

export interface RadarDimensions {
  scoring: number;
  efficiency: number;
  playmaking: number;
  rebounding: number;
  defense: number;
  perimeter: number;
}

export interface PlayerCloneMatch {
  id: string;
  name: string;
  nbaTeam: string;
  anbaTeam: string;
  pos: string;
  similarity: number;
  pts: number;
  trb: number;
  ast: number;
  tsPct: number;
  gameScore: number;
}

export interface PlayerComparison {
  id: string;
  name: string;
  avatarUrl?: string;
  pos: "PG" | "SG" | "SF" | "PF" | "C";
  posEs: string;
  age: number;
  anbaTeam: string;
  anbaTeamName: string;
  nbaTeam: string;
  nbaTeamName: string;
  similarityScore: number;
  anba: StatBlock;
  nba: StatBlock;
  deltas: {
    mp: number;
    pts: number;
    trb: number;
    orb: number;
    drb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    fgPct: number;
    fg3Pct: number;
    ftPct: number;
    tsPct: number;
    efgPct: number;
    gameScore: number;
    pts36: number;
    trb36: number;
    ast36: number;
    fg3aRate: number;
    ftaRate: number;
    threePar: number;
    ftr: number;
    orbPct: number;
    drbPct: number;
    trbPct: number;
    astPct: number;
    stlPct: number;
    blkPct: number;
    tovPct: number;
    usgPct: number;
    per: number;
    ows: number;
    dws: number;
    ws: number;
    ws48: number;
  };
  radar: {
    anba: RadarDimensions;
    nba: RadarDimensions;
  };
  clones: {
    nbaRealClones: PlayerCloneMatch[];
    anbaVirtualClones: PlayerCloneMatch[];
  };
}

export interface TeamComparison {
  abbr: string;
  name: string;
  conference: string;
  division: string;
  color: string;
  rosterSimilarity: number;
  avgGameScoreDelta: number;
  anba: {
    g: number;
    w: number;
    l: number;
    wPct: number;
    pts: number;
    fgm: number;
    fga: number;
    fgPct: number;
    fg3m: number;
    fg3a: number;
    fg3Pct: number;
    ftm: number;
    fta: number;
    ftPct: number;
    orb: number;
    drb: number;
    trb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    pf: number;
    plusMinus: number;
    fastbreakPts: number;
    paintPts: number;
    secondChancePts: number;
    benchPts: number;
    tsPct: number;
    fg3aRate: number;
  };
  nba: {
    wPct: number;
    pts: number;
    fga: number;
    fgPct: number;
    fg3m: number;
    fg3a: number;
    fg3Pct: number;
    ftm: number;
    fta: number;
    ftPct: number;
    orb: number;
    drb: number;
    trb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    tsPct: number;
    fg3aRate: number;
  };
}

export interface PositionBreakdown {
  pos: string;
  posEs: string;
  count: number;
  avgDeltaPts: number;
  avgDeltaTrb: number;
  avgDeltaAst: number;
  avgDeltaTsPct: number;
  avgDeltaGameScore: number;
  avgSimilarity: number;
}

export interface LeagueAverageBlock {
  pts: number;
  fgPct: number;
  fg3a: number;
  fg3Pct: number;
  fta: number;
  ftPct: number;
  trb: number;
  orb: number;
  drb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  tsPct: number;
  fg3aRate: number;
}

export interface SeasonDataset {
  season: string;
  updatedAt: string;
  totalPlayers: number;
  rotationPlayers: number;
  leagueAverages: {
    anba: LeagueAverageBlock;
    nba: LeagueAverageBlock;
  };
  positionBreakdown: PositionBreakdown[];
  players: PlayerComparison[];
  teams: TeamComparison[];
}

export interface FullDatasetPayload {
  generatedAt: string;
  sources: {
    anbaPlayersUrl: string;
    anbaTeamsUrl: string;
    nbaSource: string;
  };
  seasons: Record<string, SeasonDataset>;
}
