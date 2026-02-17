// SportMonks API Configuration and Functions

export const APP_NAME = 'Koorax';

// SportMonks API Base URL
export const API_BASE_URL = 'https://api.sportmonks.com/v3/football';

// API Token (from environment variable in production)
export const API_TOKEN = '4Q2MEVr3Ee1DnjWipeOAiq7mIlkbDlWRTx02XsPoeZUB0zMeh8EtkYLysMJP';

// League IDs for SportMonks
// NOTE: Current token is FREE PLAN and only supports these leagues
// For major European leagues (PL, La Liga, etc), upgrade to PAID PLAN
// See API_LIMITATION_NOTICE.md for details
export const ALLOWED_COMPETITION_IDS = [
  271,  // Danish Superliga 🇩🇰
  501,  // Scottish Premiership 🏴󠁧󠁢󠁳󠁣󠁴󠁿
  513,  // Scottish Premiership Play-Offs 🏴󠁧󠁢󠁳󠁣󠁴󠁿
  1659  // Danish Superliga Play-offs 🇩🇰
  
  // DESIRED LEAGUES (requires PAID plan):
  // 8,    // Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  // 564,  // La Liga 🇪🇸
  // 384,  // Serie A 🇮🇹
  // 82,   // Bundesliga 🇩🇪
  // 301,  // Ligue 1 🇫🇷
  // 2,    // UEFA Champions League 🏆
  // 307,  // Egyptian Premier League 🇪🇬
  // 383,  // Saudi Pro League 🇸🇦
  // 427   // Kuwaiti Premier League 🇰🇼
];

export const COMPETITIONS_INFO: Record<number, { name: string; icon: string; country: string }> = {
  // Available in FREE plan
  271: { name: 'الدوري الدنماركي', icon: '🇩🇰', country: 'Denmark' },
  501: { name: 'الدوري الاسكتلندي', icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', country: 'Scotland' },
  513: { name: 'تصفيات الدوري الاسكتلندي', icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', country: 'Scotland' },
  1659: { name: 'تصفيات الدوري الدنماركي', icon: '🇩🇰', country: 'Denmark' },
  
  // DESIRED (requires PAID plan)
  8: { name: 'الدوري الإنجليزي', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England' },
  564: { name: 'الدوري الإسباني', icon: '🇪🇸', country: 'Spain' },
  384: { name: 'الدوري الإيطالي', icon: '🇮🇹', country: 'Italy' },
  82: { name: 'الدوري الألماني', icon: '🇩🇪', country: 'Germany' },
  301: { name: 'الدوري الفرنسي', icon: '🇫🇷', country: 'France' },
  2: { name: 'دوري أبطال أوروبا', icon: '🏆', country: 'UEFA' },
  307: { name: 'الدوري المصري', icon: '🇪🇬', country: 'Egypt' },
  383: { name: 'دوري روشن السعودي', icon: '🇸🇦', country: 'Saudi Arabia' },
  427: { name: 'الدوري الكويتي', icon: '🇰🇼', country: 'Kuwait' }
};

export interface FootballApiEnv {
  SPORTMONKS_API_TOKEN?: string;
}

// Cache for API responses (60 seconds)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchFromSportMonks(endpoint: string, params: Record<string, string> = {}) {
  const apiToken = API_TOKEN;
  const queryParams = new URLSearchParams({ api_token: apiToken, ...params });
  const url = `${API_BASE_URL}${endpoint}?${queryParams}`;
  
  const cacheKey = url;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  console.log(`Fetching from SportMonks: ${endpoint}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`SportMonks API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Get all competitions
export async function getCompetitions(env: FootballApiEnv) {
  try {
    const data = await fetchFromSportMonks('/leagues', { per_page: '100' });
    
    const filtered = data.data.filter((league: any) => 
      ALLOWED_COMPETITION_IDS.includes(league.id)
    );
    
    return { competitions: filtered };
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
}

// Get matches (fixtures) with optional filters
export async function getMatches(env: FootballApiEnv, status?: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const params: Record<string, string> = {
      include: 'league',
      per_page: '100'
    };

    // Filter by date - get today's matches
    if (!status) {
      // Use date_between for today's matches
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      params.date_between = `${today},${tomorrow.toISOString().split('T')[0]}`;
    }

    const data = await fetchFromSportMonks('/fixtures', params);
    
    // Filter only allowed leagues
    const filtered = data.data.filter((fixture: any) => 
      ALLOWED_COMPETITION_IDS.includes(fixture.league_id)
    );

    // Transform to match our frontend format
    const matches = filtered.map(transformFixture);

    return { matches };
  } catch (error) {
    console.error('Error fetching matches:', error);
    return { matches: [] };
  }
}

// Get matches by date range
export async function getMatchesByDateRange(env: FootballApiEnv, dateFrom: string, dateTo: string) {
  try {
    const params: Record<string, string> = {
      include: 'league',
      date_between: `${dateFrom},${dateTo}`,
      per_page: '100'
    };

    const data = await fetchFromSportMonks('/fixtures', params);
    
    const filtered = data.data.filter((fixture: any) => 
      ALLOWED_COMPETITION_IDS.includes(fixture.league_id)
    );

    const matches = filtered.map(transformFixture);
    return { matches };
  } catch (error) {
    console.error('Error fetching matches by date range:', error);
    return { matches: [] };
  }
}

// Get standings for a competition
export async function getStandings(env: FootballApiEnv, competitionId: number) {
  try {
    // Get current season for the league
    const leagueData = await fetchFromSportMonks(`/leagues/${competitionId}`, { include: 'currentseason' });
    const seasonId = leagueData.data?.currentseason?.data?.id;

    if (!seasonId) {
      return { standings: [] };
    }

    const data = await fetchFromSportMonks(`/standings/seasons/${seasonId}`, { include: 'participant' });
    
    // Transform to match our format
    const standings = [{
      table: data.data.map((standing: any) => ({
        position: standing.position,
        team: {
          id: standing.participant?.data?.id,
          name: standing.participant?.data?.name,
          shortName: standing.participant?.data?.short_code,
          crest: standing.participant?.data?.image_path
        },
        playedGames: standing.played,
        won: standing.won,
        draw: standing.draw,
        lost: standing.lost,
        goalsFor: standing.goals_for,
        goalsAgainst: standing.goals_against,
        goalDifference: standing.goal_difference,
        points: standing.points
      }))
    }];

    return { standings };
  } catch (error) {
    console.error('Error fetching standings:', error);
    return { standings: [] };
  }
}

// Get top scorers for a competition
export async function getTopScorers(env: FootballApiEnv, competitionId: number) {
  try {
    const leagueData = await fetchFromSportMonks(`/leagues/${competitionId}`, { include: 'currentseason' });
    const seasonId = leagueData.data?.currentseason?.data?.id;

    if (!seasonId) {
      return { scorers: [] };
    }

    const data = await fetchFromSportMonks(`/topscorers/seasons/${seasonId}`, { 
      include: 'player,participant',
      per_page: '20'
    });
    
    const scorers = data.data.map((scorer: any) => ({
      player: {
        id: scorer.player?.data?.id,
        name: scorer.player?.data?.common_name || scorer.player?.data?.name,
        nationality: scorer.player?.data?.nationality
      },
      team: {
        id: scorer.participant?.data?.id,
        name: scorer.participant?.data?.name,
        shortName: scorer.participant?.data?.short_code,
        crest: scorer.participant?.data?.image_path
      },
      goals: scorer.goals || 0,
      assists: scorer.assists || 0
    }));

    return { scorers };
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return { scorers: [] };
  }
}

// Get match details by ID
export async function getMatchById(env: FootballApiEnv, matchId: number) {
  try {
    const data = await fetchFromSportMonks(`/fixtures/${matchId}`, {
      include: 'league,participants,scores'
    });

    return transformFixture(data.data);
  } catch (error) {
    console.error('Error fetching match by ID:', error);
    throw error;
  }
}

// Transform SportMonks fixture to our format
function transformFixture(fixture: any) {
  // Parse team names from match name (e.g., "Team A vs Team B")
  const matchName = fixture.name || '';
  const teams = matchName.split(' vs ');
  
  const participants = fixture.participants || [];
  const homeTeam = participants.find((p: any) => p.meta?.location === 'home') || participants[0] || {
    id: 0,
    name: teams[0] || 'Home Team',
    short_code: teams[0]?.substring(0, 3) || 'HOM',
    image_path: null
  };
  const awayTeam = participants.find((p: any) => p.meta?.location === 'away') || participants[1] || {
    id: 0,
    name: teams[1] || 'Away Team',
    short_code: teams[1]?.substring(0, 3) || 'AWA',
    image_path: null
  };
  
  const scores = fixture.scores || [];
  const fullTimeScore = scores.find((s: any) => s.description === 'CURRENT') || scores[0];
  const halfTimeScore = scores.find((s: any) => s.description === 'HALFTIME');

  // Map state_id to status
  let status = 'SCHEDULED';
  if (fixture.state_id === 1) status = 'SCHEDULED'; // Not started
  if (fixture.state_id === 2 || fixture.state_id === 3) status = 'IN_PLAY'; // Live or HT
  if (fixture.state_id === 5) status = 'FINISHED'; // Finished
  if (fixture.state_id === 6) status = 'PAUSED'; // Paused

  return {
    id: fixture.id,
    utcDate: fixture.starting_at,
    status,
    competition: {
      id: fixture.league_id,
      name: COMPETITIONS_INFO[fixture.league_id]?.name || fixture.league?.data?.name || 'Unknown',
      emblem: fixture.league?.data?.image_path
    },
    homeTeam: {
      id: homeTeam?.id,
      name: homeTeam?.name || 'Home Team',
      shortName: homeTeam?.short_code,
      crest: homeTeam?.image_path
    },
    awayTeam: {
      id: awayTeam?.id,
      name: awayTeam?.name || 'Away Team',
      shortName: awayTeam?.short_code,
      crest: awayTeam?.image_path
    },
    score: {
      fullTime: {
        home: fullTimeScore?.score?.participant === 'home' ? fullTimeScore?.score?.goals : (awayTeam?.meta?.winner ? 0 : fullTimeScore?.score?.goals || 0),
        away: fullTimeScore?.score?.participant === 'away' ? fullTimeScore?.score?.goals : (homeTeam?.meta?.winner ? 0 : fullTimeScore?.score?.goals || 0)
      },
      halfTime: halfTimeScore ? {
        home: halfTimeScore.score?.participant === 'home' ? halfTimeScore.score?.goals : 0,
        away: halfTimeScore.score?.participant === 'away' ? halfTimeScore.score?.goals : 0
      } : null
    },
    venue: fixture.venue?.data?.name,
    referee: fixture.referee?.data?.common_name,
    events: fixture.events?.data,
    lineup: fixture.lineup?.data,
    statistics: fixture.statistics?.data
  };
}

// Language translations
export const TRANSLATIONS = {
  ar: {
    appName: 'كوراكس',
    home: 'الرئيسية',
    matches: 'المباريات',
    competitions: 'البطولات',
    standings: 'الترتيب',
    topScorers: 'الهدافون',
    live: 'مباشر',
    finished: 'انتهت',
    scheduled: 'لم تبدأ',
    noMatches: 'لا توجد مباريات',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ'
  },
  en: {
    appName: 'Koorax',
    home: 'Home',
    matches: 'Matches',
    competitions: 'Competitions',
    standings: 'Standings',
    topScorers: 'Top Scorers',
    live: 'Live',
    finished: 'Finished',
    scheduled: 'Scheduled',
    noMatches: 'No matches available',
    loading: 'Loading...',
    error: 'An error occurred'
  }
};
