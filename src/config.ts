// Koorax - Football Data API Configuration

export const APP_NAME = 'Koorax';

export const ALLOWED_COMPETITIONS = {
  'PL': 'Premier League',
  'PD': 'La Liga', 
  'SA': 'Serie A',
  'BL1': 'Bundesliga',
  'FL1': 'Ligue 1',
  'CL': 'UEFA Champions League'
};

export const ALLOWED_COMPETITION_IDS = [
  2021, // Premier League
  2014, // La Liga
  2019, // Serie A
  2002, // Bundesliga
  2015, // Ligue 1
  2001  // UEFA Champions League
];

export const API_BASE_URL = 'https://api.football-data.org/v4';

// Language translations
export const TRANSLATIONS = {
  ar: {
    appName: 'كوراكس',
    home: 'الرئيسية',
    matches: 'المباريات',
    competitions: 'البطولات',
    news: 'الأخبار',
    topScorers: 'الهدافون',
    topAssisters: 'صناع الأهداف',
    liveMatches: 'مباريات مباشرة',
    upcomingMatches: 'مباريات قادمة',
    finishedMatches: 'مباريات منتهية',
    todayMatches: 'مباريات اليوم',
    matchDetails: 'تفاصيل المباراة',
    standings: 'الترتيب',
    statistics: 'الإحصائيات',
    lineup: 'التشكيلة',
    goals: 'الأهداف',
    assists: 'التمريرات الحاسمة',
    yellowCards: 'البطاقات الصفراء',
    redCards: 'البطاقات الحمراء',
    substitutions: 'التبديلات',
    referee: 'الحكم',
    venue: 'الملعب',
    competition: 'البطولة',
    date: 'التاريخ',
    time: 'الوقت',
    status: 'الحالة',
    live: 'مباشر',
    finished: 'انتهت',
    scheduled: 'لم تبدأ',
    homeTeam: 'الفريق المضيف',
    awayTeam: 'الفريق الضيف',
    score: 'النتيجة',
    halfTimeScore: 'نتيجة الشوط الأول',
    fullTimeScore: 'النتيجة النهائية',
    player: 'اللاعب',
    team: 'الفريق',
    played: 'لعب',
    won: 'فاز',
    drawn: 'تعادل',
    lost: 'خسر',
    goalsFor: 'له',
    goalsAgainst: 'عليه',
    goalDifference: 'فارق الأهداف',
    points: 'النقاط',
    position: 'المركز',
    filterByCompetition: 'فلترة حسب البطولة',
    all: 'الكل',
    noMatches: 'لا توجد مباريات',
    noData: 'لا توجد بيانات',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    backToMatches: 'العودة للمباريات',
    backToCompetitions: 'العودة للبطولات',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    searchNews: 'بحث في الأخبار',
    readMore: 'اقرأ المزيد',
    latestNews: 'آخر الأخبار'
  },
  en: {
    appName: 'Koorax',
    home: 'Home',
    matches: 'Matches',
    competitions: 'Competitions',
    news: 'News',
    topScorers: 'Top Scorers',
    topAssisters: 'Top Assisters',
    liveMatches: 'Live Matches',
    upcomingMatches: 'Upcoming Matches',
    finishedMatches: 'Finished Matches',
    todayMatches: "Today's Matches",
    matchDetails: 'Match Details',
    standings: 'Standings',
    statistics: 'Statistics',
    lineup: 'Lineup',
    goals: 'Goals',
    assists: 'Assists',
    yellowCards: 'Yellow Cards',
    redCards: 'Red Cards',
    substitutions: 'Substitutions',
    referee: 'Referee',
    venue: 'Venue',
    competition: 'Competition',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    live: 'Live',
    finished: 'Finished',
    scheduled: 'Scheduled',
    homeTeam: 'Home Team',
    awayTeam: 'Away Team',
    score: 'Score',
    halfTimeScore: 'Half Time Score',
    fullTimeScore: 'Full Time Score',
    player: 'Player',
    team: 'Team',
    played: 'Played',
    won: 'Won',
    drawn: 'Drawn',
    lost: 'Lost',
    goalsFor: 'GF',
    goalsAgainst: 'GA',
    goalDifference: 'GD',
    points: 'Points',
    position: 'Position',
    filterByCompetition: 'Filter by Competition',
    all: 'All',
    noMatches: 'No matches available',
    noData: 'No data available',
    loading: 'Loading...',
    error: 'An error occurred',
    backToMatches: 'Back to Matches',
    backToCompetitions: 'Back to Competitions',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    searchNews: 'Search news',
    readMore: 'Read More',
    latestNews: 'Latest News'
  }
};

// Football news sources (dummy data for demonstration)
export const NEWS_SOURCES = [
  {
    id: 1,
    title: {
      ar: 'تألق ميسي يقود الأرجنتين للفوز',
      en: 'Messi Shines as Argentina Wins'
    },
    excerpt: {
      ar: 'قدم ليونيل ميسي أداءً رائعاً في المباراة الأخيرة',
      en: 'Lionel Messi delivered an outstanding performance in the latest match'
    },
    image: 'https://via.placeholder.com/400x250?text=Football+News',
    date: new Date().toISOString()
  },
  {
    id: 2,
    title: {
      ar: 'ريال مدريد يستعد لمواجهة برشلونة',
      en: 'Real Madrid Prepares for Barcelona Clash'
    },
    excerpt: {
      ar: 'الفريق الملكي يعد العدة للكلاسيكو القادم',
      en: 'The Royal Club is gearing up for the upcoming Clasico'
    },
    image: 'https://via.placeholder.com/400x250?text=Football+News',
    date: new Date().toISOString()
  }
];
