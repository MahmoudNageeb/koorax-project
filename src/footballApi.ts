// Football-Data.org API Configuration
export const APP_NAME = 'Koorax';
export const API_BASE_URL = 'https://api.football-data.org/v4';
export const API_TOKEN = '79312930c9804b81a10b12dcf14da7fb';

// Competition IDs for Football-Data.org
export const ALLOWED_COMPETITION_IDS = [
  // European Leagues
  2021, // Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  2014, // La Liga 🇪🇸
  2019, // Serie A 🇮🇹
  2002, // Bundesliga 🇩🇪
  2015, // Ligue 1 🇫🇷
  2003, // Eredivisie 🇳🇱
  2017, // Primeira Liga 🇵🇹
  
  // Arab Leagues
  2357, // Egyptian Premier League 🇪🇬
  2420, // Saudi Pro League 🇸🇦
  2421, // UAE Arabian Gulf League 🇦🇪
  
  // International Tournaments
  2001, // UEFA Champions League 🏆
  2018, // European Championship
  2000, // FIFA World Cup
  
  // South American
  2152, // Copa Libertadores
  2013  // Brasileirão Serie A
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
  // European Leagues
  2021: { name: 'الدوري الإنجليزي', nameEn: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', type: 'league' },
  2014: { name: 'الدوري الإسباني', nameEn: 'La Liga', icon: '🇪🇸', country: 'Spain', type: 'league' },
  2019: { name: 'الدوري الإيطالي', nameEn: 'Serie A', icon: '🇮🇹', country: 'Italy', type: 'league' },
  2002: { name: 'الدوري الألماني', nameEn: 'Bundesliga', icon: '🇩🇪', country: 'Germany', type: 'league' },
  2015: { name: 'الدوري الفرنسي', nameEn: 'Ligue 1', icon: '🇫🇷', country: 'France', type: 'league' },
  2003: { name: 'الدوري الهولندي', nameEn: 'Eredivisie', icon: '🇳🇱', country: 'Netherlands', type: 'league' },
  2017: { name: 'الدوري البرتغالي', nameEn: 'Primeira Liga', icon: '🇵🇹', country: 'Portugal', type: 'league' },
  
  // Arab Leagues
  2357: { name: 'الدوري المصري', nameEn: 'Egyptian Premier League', icon: '🇪🇬', country: 'Egypt', type: 'league' },
  2420: { name: 'دوري روشن السعودي', nameEn: 'Saudi Pro League', icon: '🇸🇦', country: 'Saudi Arabia', type: 'league' },
  2421: { name: 'دوري الخليج العربي', nameEn: 'UAE Arabian Gulf League', icon: '🇦🇪', country: 'UAE', type: 'league' },
  
  // International Tournaments
  2001: { name: 'دوري أبطال أوروبا', nameEn: 'Champions League', icon: '🏆', country: 'UEFA', type: 'cup' },
  2146: { name: 'كأس ملك إسبانيا', nameEn: 'Copa del Rey', icon: '🇪🇸', country: 'Spain', type: 'cup' },
  2054: { name: 'كأس الاتحاد الإنجليزي', nameEn: 'FA Cup', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', type: 'cup' },
  2055: { name: 'كأس ألمانيا', nameEn: 'DFB-Pokal', icon: '🇩🇪', country: 'Germany', type: 'cup' },
  2080: { name: 'كأس إيطاليا', nameEn: 'Coppa Italia', icon: '🇮🇹', country: 'Italy', type: 'cup' },
  2044: { name: 'كأس فرنسا', nameEn: 'Coupe de France', icon: '🇫🇷', country: 'France', type: 'cup' }
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
    
    if (!data || !data.competitions) {
      console.error('Invalid API response:', data);
      return { competitions: [] };
    }
    
    const filtered = data.competitions.filter((comp: any) => 
      ALLOWED_COMPETITION_IDS.includes(comp.id)
    );
    
    return { competitions: filtered };
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return { competitions: [] };
  }
}

// Get matches with filters (last 3 days + next 3 days)
export async function getMatches(env: FootballApiEnv, status?: string) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    
    // Calculate date range: 3 days ago to 3 days from now
    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setDate(dateFrom.getDate() - 3);
    const dateTo = new Date(today);
    dateTo.setDate(dateTo.getDate() + 3);
    
    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];
    
    let endpoint = `/matches?dateFrom=${dateFromStr}&dateTo=${dateToStr}`;
    
    if (status) {
      endpoint += `&status=${status}`;
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

// Get player details
export async function getPlayerById(env: FootballApiEnv, playerId: number) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const data = await fetchFromAPI(`/persons/${playerId}`, token);
    return data;
  } catch (error) {
    console.error('Error fetching player by ID:', error);
    throw error;
  }
}

// Get matches for current matchday of a competition
export async function getCurrentMatchdayMatches(env: FootballApiEnv, competitionId: number) {
  try {
    const token = env.FOOTBALL_API_TOKEN || API_TOKEN;
    const data = await fetchFromAPI(`/competitions/${competitionId}/matches?status=SCHEDULED,IN_PLAY,PAUSED`, token);
    return data;
  } catch (error) {
    console.error('Error fetching current matchday matches:', error);
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
