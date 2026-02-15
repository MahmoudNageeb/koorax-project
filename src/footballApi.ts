import { API_BASE_URL, ALLOWED_COMPETITION_IDS } from './config';

export interface FootballApiEnv {
  FOOTBALL_API_TOKEN: string;
}

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute for optimal performance

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
  const cacheKey = `${endpoint}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

export async function getCompetitions(env: FootballApiEnv) {
  try {
    const data = await fetchFromAPI('/competitions', env.FOOTBALL_API_TOKEN);
    
    // Filter only allowed competitions
    const filtered = data.competitions.filter((comp: any) => 
      ALLOWED_COMPETITION_IDS.includes(comp.id)
    );
    
    return { competitions: filtered };
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
}

export async function getMatches(env: FootballApiEnv, status?: string) {
  try {
    let endpoint = '/matches';
    const params = new URLSearchParams();
    
    if (status) {
      params.append('status', status);
      
      // For FINISHED matches, get last 7 days
      if (status === 'FINISHED') {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        
        params.append('dateFrom', weekAgo.toISOString().split('T')[0]);
        params.append('dateTo', today.toISOString().split('T')[0]);
      }
    }
    
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    
    const data = await fetchFromAPI(endpoint, env.FOOTBALL_API_TOKEN);
    
    // Filter only matches from allowed competitions
    const filtered = data.matches.filter((match: any) => 
      ALLOWED_COMPETITION_IDS.includes(match.competition.id)
    );
    
    return { matches: filtered };
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
}

export async function getMatchesByDateRange(env: FootballApiEnv, dateFrom: string, dateTo: string) {
  try {
    const params = new URLSearchParams({
      dateFrom,
      dateTo
    });
    
    const endpoint = `/matches?${params.toString()}`;
    const data = await fetchFromAPI(endpoint, env.FOOTBALL_API_TOKEN);
    
    // Filter only matches from allowed competitions
    const filtered = data.matches.filter((match: any) => 
      ALLOWED_COMPETITION_IDS.includes(match.competition.id)
    );
    
    return { matches: filtered };
  } catch (error) {
    console.error('Error fetching matches by date:', error);
    throw error;
  }
}

export async function getStandings(env: FootballApiEnv, competitionId: number) {
  try {
    const endpoint = `/competitions/${competitionId}/standings`;
    return await fetchFromAPI(endpoint, env.FOOTBALL_API_TOKEN);
  } catch (error) {
    console.error('Error fetching standings:', error);
    throw error;
  }
}

export async function getTopScorers(env: FootballApiEnv, competitionId: number) {
  try {
    const endpoint = `/competitions/${competitionId}/scorers`;
    return await fetchFromAPI(endpoint, env.FOOTBALL_API_TOKEN);
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    throw error;
  }
}

export async function getTopAssists(env: FootballApiEnv, competitionId: number) {
  try {
    // Note: The free Football Data API doesn't have a dedicated assists endpoint
    // We get scorers data which includes assists information
    const endpoint = `/competitions/${competitionId}/scorers`;
    const data = await fetchFromAPI(endpoint, env.FOOTBALL_API_TOKEN);
    
    // Filter and sort by assists
    if (data.scorers) {
      const assisters = data.scorers
        .filter((player: any) => player.assists && player.assists > 0)
        .sort((a: any, b: any) => (b.assists || 0) - (a.assists || 0));
      
      return { scorers: assisters };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching top assists:', error);
    throw error;
  }
}

export async function getMatchById(env: FootballApiEnv, matchId: number) {
  try {
    const endpoint = `/matches/${matchId}`;
    return await fetchFromAPI(endpoint, env.FOOTBALL_API_TOKEN);
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
}
