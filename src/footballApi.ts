// Football-Data.org API Configuration
export const APP_NAME = 'Koorax';
export const API_BASE_URL = 'https://api.football-data.org/v4';
export const API_TOKEN = '538ffa00605b475596acc8ee0e54a7c5';

// Competition IDs for Football-Data.org
export const ALLOWED_COMPETITION_IDS = [
  2021, // Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  2014, // La Liga 🇪🇸
  2019, // Serie A 🇮🇹
  2002, // Bundesliga 🇩🇪
  2015, // Ligue 1 🇫🇷
  2001, // UEFA Champions League 🏆
  2018, // European Championship (includes qualifiers)
  2000, // FIFA World Cup
  2152, // Copa Libertadores
  2013, // Brasileirão Serie A
  2003, // Eredivisie 🇳🇱
  2017  // Primeira Liga 🇵🇹
];

// Cups
export const CUP_COMPETITIONS = [
  2001, // UEFA Champions League
  2146, // Copa del Rey (Spanish Cup)
  2054, // FA Cup (English Cup)
  2055, // DFB-Pokal (German Cup)
  2019, // Coppa Italia (Italian Cup)
  2044  // Coupe de France (French Cup)
];

export const COMPETITIONS_INFO: Record<number, { name: string; nameEn: string; icon: string; country: string; type: 'league' | 'cup' }> = {
  2021: { name: 'الدوري الإنجليزي', nameEn: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', type: 'league' },
  2014: { name: 'الدوري الإسباني', nameEn: 'La Liga', icon: '🇪🇸', country: 'Spain', type: 'league' },
  2019: { name: 'الدوري الإيطالي', nameEn: 'Serie A', icon: '🇮🇹', country: 'Italy', type: 'league' },
  2002: { name: 'الدوري الألماني', nameEn: 'Bundesliga', icon: '🇩🇪', country: 'Germany', type: 'league' },
  2015: { name: 'الدوري الفرنسي', nameEn: 'Ligue 1', icon: '🇫🇷', country: 'France', type: 'league' },
  2001: { name: 'دوري أبطال أوروبا', nameEn: 'Champions League', icon: '🏆', country: 'UEFA', type: 'cup' },
  2146: { name: 'كأس ملك إسبانيا', nameEn: 'Copa del Rey', icon: '🇪🇸', country: 'Spain', type: 'cup' },
  2054: { name: 'كأس الاتحاد الإنجليزي', nameEn: 'FA Cup', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', type: 'cup' },
  2055: { name: 'كأس ألمانيا', nameEn: 'DFB-Pokal', icon: '🇩🇪', country: 'Germany', type: 'cup' },
  2080: { name: 'كأس إيطاليا', nameEn: 'Coppa Italia', icon: '🇮🇹', country: 'Italy', type: 'cup' },
  2044: { name: 'كأس فرنسا', nameEn: 'Coupe de France', icon: '🇫🇷', country: 'France', type: 'cup' },
  2003: { name: 'الدوري الهولندي', nameEn: 'Eredivisie', icon: '🇳🇱', country: 'Netherlands', type: 'league' },
  2017: { name: 'الدوري البرتغالي', nameEn: 'Primeira Liga', icon: '🇵🇹', country: 'Portugal', type: 'league' }
};

export interface FootballApiEnv {
  FOOTBALL_API_TOKEN?: string;
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

async function fetchFromAPI(endpoint: string, token: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = url;
  
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  console.log(`Fetching from Football-Data: ${endpoint}`);
  
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': token
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Get all competitions
export async function getCompetitions(env: FootballApiEnv) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const data = await fetchFromAPI('/competitions', token);
    
    const filtered = data.competitions.filter((comp: any) => 
      ALLOWED_COMPETITION_IDS.includes(comp.id)
    );
    
    return { competitions: filtered };
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
}

// Get matches with filters
export async function getMatches(env: FootballApiEnv, status?: string) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    let endpoint = '/matches';
    
    if (status) {
      endpoint += `?status=${status}`;
    }
    
    const data = await fetchFromAPI(endpoint, token);
    
    // Filter by allowed competitions
    const filtered = data.matches.filter((match: any) => 
      ALLOWED_COMPETITION_IDS.includes(match.competition.id)
    );
    
    return { matches: filtered };
  } catch (error) {
    console.error('Error fetching matches:', error);
    return { matches: [] };
  }
}

// Get match by ID with full details
export async function getMatchById(env: FootballApiEnv, matchId: number) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const data = await fetchFromAPI(`/matches/${matchId}`, token);
    return data;
  } catch (error) {
    console.error('Error fetching match by ID:', error);
    throw error;
  }
}

// Get standings for a competition
export async function getStandings(env: FootballApiEnv, competitionId: number) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const data = await fetchFromAPI(`/competitions/${competitionId}/standings`, token);
    return data;
  } catch (error) {
    console.error('Error fetching standings:', error);
    return { standings: [] };
  }
}

// Get top scorers for a competition
export async function getTopScorers(env: FootballApiEnv, competitionId: number) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const data = await fetchFromAPI(`/competitions/${competitionId}/scorers`, token);
    return data;
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return { scorers: [] };
  }
}

// Get team details
export async function getTeamById(env: FootballApiEnv, teamId: number) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const data = await fetchFromAPI(`/teams/${teamId}`, token);
    return data;
  } catch (error) {
    console.error('Error fetching team by ID:', error);
    throw error;
  }
}

// Get team matches
export async function getTeamMatches(env: FootballApiEnv, teamId: number, status?: string) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    let endpoint = `/teams/${teamId}/matches`;
    if (status) {
      endpoint += `?status=${status}`;
    }
    const data = await fetchFromAPI(endpoint, token);
    return data;
  } catch (error) {
    console.error('Error fetching team matches:', error);
    return { matches: [] };
  }
}

// Get matches by date range
export async function getMatchesByDateRange(env: FootballApiEnv, dateFrom: string, dateTo: string) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const endpoint = `/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    const data = await fetchFromAPI(endpoint, token);
    
    const filtered = data.matches.filter((match: any) => 
      ALLOWED_COMPETITION_IDS.includes(match.competition.id)
    );
    
    return { matches: filtered };
  } catch (error) {
    console.error('Error fetching matches by date range:', error);
    return { matches: [] };
  }
}

// Translations
export const TRANSLATIONS = {
  ar: {
    appName: 'كوراكس',
    home: 'الرئيسية',
    matches: 'المباريات',
    competitions: 'البطولات',
    teams: 'الفرق',
    standings: 'الترتيب',
    topScorers: 'الهدافون',
    live: 'مباشر',
    finished: 'انتهت',
    scheduled: 'لم تبدأ',
    today: 'اليوم',
    tomorrow: 'غداً',
    yesterday: 'أمس',
    allMatches: 'جميع المباريات',
    liveMatches: 'المباريات المباشرة',
    upcomingMatches: 'المباريات القادمة',
    finishedMatches: 'المباريات المنتهية',
    matchDetails: 'تفاصيل المباراة',
    events: 'الأحداث',
    lineup: 'التشكيلة',
    statistics: 'الإحصائيات',
    goals: 'أهداف',
    yellowCard: 'إنذار',
    redCard: 'طرد',
    substitution: 'تبديل',
    penalty: 'ركلة جزاء',
    table: 'الجدول',
    position: 'المركز',
    team: 'الفريق',
    played: 'لعب',
    won: 'فوز',
    draw: 'تعادل',
    lost: 'خسارة',
    goalsFor: 'له',
    goalsAgainst: 'عليه',
    goalDifference: 'فارق',
    points: 'نقاط',
    noMatches: 'لا توجد مباريات',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    arabic: 'عربي',
    english: 'English'
  },
  en: {
    appName: 'Koorax',
    home: 'Home',
    matches: 'Matches',
    competitions: 'Competitions',
    teams: 'Teams',
    standings: 'Standings',
    topScorers: 'Top Scorers',
    live: 'Live',
    finished: 'Finished',
    scheduled: 'Scheduled',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    allMatches: 'All Matches',
    liveMatches: 'Live Matches',
    upcomingMatches: 'Upcoming Matches',
    finishedMatches: 'Finished Matches',
    matchDetails: 'Match Details',
    events: 'Events',
    lineup: 'Lineup',
    statistics: 'Statistics',
    goals: 'Goals',
    yellowCard: 'Yellow Card',
    redCard: 'Red Card',
    substitution: 'Substitution',
    penalty: 'Penalty',
    table: 'Table',
    position: 'Position',
    team: 'Team',
    played: 'Played',
    won: 'Won',
    draw: 'Draw',
    lost: 'Lost',
    goalsFor: 'For',
    goalsAgainst: 'Against',
    goalDifference: 'Diff',
    points: 'Points',
    noMatches: 'No matches available',
    loading: 'Loading...',
    error: 'An error occurred',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    arabic: 'عربي',
    english: 'English'
  }
};
