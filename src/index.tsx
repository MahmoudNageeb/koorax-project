import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { 
  getCompetitions, 
  getMatches, 
  getMatchById,
  getStandings, 
  getTopScorers,
  getTeamById,
  getTeamMatches,
  getMatchesByDateRange,
  FootballApiEnv,
  COMPETITIONS_INFO,
  TRANSLATIONS
} from './footballApi';

type Bindings = {
  FOOTBALL_API_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './' }));

// API Routes
app.get('/api/competitions', async (c) => {
  try {
    const data = await getCompetitions({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN });
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch competitions' }, 500);
  }
});

app.get('/api/matches', async (c) => {
  try {
    const status = c.req.query('status');
    const data = await getMatches({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, status);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch matches' }, 500);
  }
});

app.get('/api/matches/:id', async (c) => {
  try {
    const matchId = parseInt(c.req.param('id'));
    const data = await getMatchById({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, matchId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch match details' }, 500);
  }
});

app.get('/api/competitions/:id/standings', async (c) => {
  try {
    const competitionId = parseInt(c.req.param('id'));
    const data = await getStandings({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, competitionId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch standings' }, 500);
  }
});

app.get('/api/competitions/:id/scorers', async (c) => {
  try {
    const competitionId = parseInt(c.req.param('id'));
    const data = await getTopScorers({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, competitionId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch top scorers' }, 500);
  }
});

app.get('/api/teams/:id', async (c) => {
  try {
    const teamId = parseInt(c.req.param('id'));
    const data = await getTeamById({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, teamId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch team details' }, 500);
  }
});

app.get('/api/teams/:id/matches', async (c) => {
  try {
    const teamId = parseInt(c.req.param('id'));
    const status = c.req.query('status');
    const data = await getTeamMatches({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, teamId, status);
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch team matches' }, 500);
  }
});

// Helper function to generate enhanced header with dark mode + language toggle
function getEnhancedHeader(currentPage: string = '') {
  return `
<nav class="glass-card sticky top-0 z-50 mb-6">
  <div class="container mx-auto px-4 py-4">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3 group">
        <i class="fas fa-futbol text-3xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
        <h1 class="text-2xl font-black gradient-text">Koorax</h1>
      </a>
      
      <!-- Navigation Links -->
      <div class="flex items-center gap-2">
        <a href="/" class="nav-link ${currentPage === 'home' ? 'active' : ''}">
          <i class="fas fa-home"></i>
          <span class="hidden md:inline lang-home">الرئيسية</span>
        </a>
        <a href="/matches" class="nav-link ${currentPage === 'matches' ? 'active' : ''}">
          <i class="fas fa-calendar-alt"></i>
          <span class="hidden md:inline lang-matches">المباريات</span>
        </a>
        <a href="/competitions" class="nav-link ${currentPage === 'competitions' ? 'active' : ''}">
          <i class="fas fa-trophy"></i>
          <span class="hidden md:inline lang-competitions">البطولات</span>
        </a>
        
        <!-- Dark Mode Toggle -->
        <button onclick="kooraxToggleDarkMode()" class="header-btn" title="Toggle Dark Mode">
          <i id="theme-toggle-icon" class="fas fa-moon"></i>
        </button>
        
        <!-- Language Toggle -->
        <button onclick="kooraxToggleLanguage()" class="header-btn" title="تبديل اللغة / Toggle Language">
          <i class="fas fa-language"></i>
          <span class="hidden md:inline">EN</span>
        </button>
      </div>
    </div>
  </div>
</nav>
  `;
}

// Homepage
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - مباريات كرة القدم</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('home')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Live Matches Section -->
        <div id="live-section" style="display: none;" class="mb-8">
          <div class="glass-card p-6 rounded-2xl">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <h2 class="text-3xl font-black gradient-text">
                <span class="lang-live-matches">🔴 مباريات مباشرة الآن</span>
              </h2>
            </div>
            <div id="live-matches" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
          </div>
        </div>
        
        <!-- Important Matches Today -->
        <div class="glass-card p-6 rounded-2xl mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-black gradient-text">
              <i class="fas fa-star mr-3"></i>
              <span class="lang-important-matches">أهم المباريات</span>
            </h2>
            <a href="/matches" class="text-primary hover:underline">
              <span class="lang-all-matches">عرض الكل</span>
              <i class="fas fa-arrow-left mr-2"></i>
            </a>
          </div>
          <div id="important-matches" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
          </div>
        </div>
        
        <!-- Quick Links -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/matches" class="glass-card p-6 text-center hover:scale-105 transition-transform">
            <i class="fas fa-calendar-alt text-4xl text-primary mb-3"></i>
            <h3 class="font-bold lang-matches">المباريات</h3>
          </a>
          <a href="/competitions" class="glass-card p-6 text-center hover:scale-105 transition-transform">
            <i class="fas fa-trophy text-4xl text-yellow-500 mb-3"></i>
            <h3 class="font-bold lang-competitions">البطولات</h3>
          </a>
          <a href="/standings" class="glass-card p-6 text-center hover:scale-105 transition-transform">
            <i class="fas fa-list-ol text-4xl text-blue-500 mb-3"></i>
            <h3 class="font-bold lang-standings">الترتيب</h3>
          </a>
          <a href="/scorers" class="glass-card p-6 text-center hover:scale-105 transition-transform">
            <i class="fas fa-futbol text-4xl text-green-500 mb-3"></i>
            <h3 class="font-bold lang-scorers">الهدافون</h3>
          </a>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      async function loadHomeMatches() {
        try {
          const response = await axios.get('/api/matches');
          const matches = response.data.matches;
          
          // Filter live matches
          const liveMatches = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
          const upcomingToday = matches.filter(m => {
            const matchDate = new Date(m.utcDate);
            const today = new Date();
            return matchDate.toDateString() === today.toDateString() && m.status === 'SCHEDULED';
          }).slice(0, 6);
          
          // Show live matches
          if (liveMatches.length > 0) {
            document.getElementById('live-section').style.display = 'block';
            document.getElementById('live-matches').innerHTML = liveMatches.map(createMatchCard).join('');
          }
          
          // Show important matches (live + upcoming today)
          const importantMatches = [...liveMatches, ...upcomingToday].slice(0, 6);
          document.getElementById('important-matches').innerHTML = 
            importantMatches.length > 0 
              ? importantMatches.map(createMatchCard).join('') 
              : '<p class="text-center text-secondary col-span-2 py-12">لا توجد مباريات مهمة اليوم</p>';
          
        } catch (error) {
          console.error('Error loading matches:', error);
          document.getElementById('important-matches').innerHTML = 
            '<p class="text-center text-red-500 col-span-2 py-12">حدث خطأ في تحميل المباريات</p>';
        }
      }
      
      function createMatchCard(match) {
        const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
          ? '<span class="status-live">مباشر</span>'
          : match.status === 'FINISHED'
          ? '<span class="status-finished">انتهت</span>'
          : '<span class="status-scheduled">لم تبدأ</span>';
        
        const score = (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          ? \`<div class="score-display">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
          : \`<div class="text-lg text-secondary">\${new Date(match.utcDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>\`;
        
        return \`
          <a href="/matches/\${match.id}" class="match-card block">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-secondary">\${match.competition.name}</span>
              \${statusBadge}
            </div>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 flex-1">
                <img src="\${match.homeTeam.crest || ''}" alt="\${match.homeTeam.name}" class="team-logo w-12 h-12" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <span class="font-bold truncate">\${match.homeTeam.name}</span>
              </div>
              <div class="text-center px-4">
                \${score}
              </div>
              <div class="flex items-center gap-3 flex-1 justify-end">
                <span class="font-bold truncate">\${match.awayTeam.name}</span>
                <img src="\${match.awayTeam.crest || ''}" alt="\${match.awayTeam.name}" class="team-logo w-12 h-12" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
              </div>
            </div>
          </a>
        \`;
      }
      
      loadHomeMatches();
      setInterval(loadHomeMatches, 60000); // Refresh every minute
    </script>
</body>
</html>
  `);
});

export default app;
