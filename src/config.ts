// Football Data API Configuration
export const ALLOWED_COMPETITIONS = {
  'PL': 'Premier League',
  'PD': 'La Liga', 
  'SA': 'Serie A',
  'BL1': 'Bundesliga',
  'FL1': 'Ligue 1',
  'CL': 'UEFA Champions League',
  'ELC': 'Egyptian Premier League'
};

export const ALLOWED_COMPETITION_IDS = [
  2021, // Premier League
  2014, // La Liga
  2019, // Serie A
  2002, // Bundesliga
  2015, // Ligue 1
  2001, // UEFA Champions League
  2028  // Egyptian Premier League (adjust if needed)
];

export const API_BASE_URL = 'https://api.football-data.org/v4';
