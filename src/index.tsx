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
          <span class="hidden md:inline" data-translate="home">الرئيسية</span>
        </a>
        <a href="/matches" class="nav-link ${currentPage === 'matches' ? 'active' : ''}">
          <i class="fas fa-calendar-alt"></i>
          <span class="hidden md:inline" data-translate="matches">المباريات</span>
        </a>
        <a href="/competitions" class="nav-link ${currentPage === 'competitions' ? 'active' : ''}">
          <i class="fas fa-trophy"></i>
          <span class="hidden md:inline" data-translate="competitions">البطولات</span>
        </a>
        
        <!-- Dark Mode Toggle -->
        <button onclick="kooraxToggleDarkMode()" class="header-btn" title="Toggle Dark Mode">
          <i id="theme-toggle-icon" class="fas fa-moon"></i>
        </button>
        
        <!-- Language Toggle -->
        <button onclick="kooraxToggleLanguage()" class="header-btn" title="تبديل اللغة / Toggle Language">
          <i class="fas fa-language"></i>
          <span class="hidden md:inline" id="lang-toggle-text">EN</span>
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
                <span data-translate="liveMatches">🔴 مباريات مباشرة الآن</span>
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
              <span data-translate="importantMatches">أهم المباريات</span>
            </h2>
            <a href="/matches" class="text-primary hover:underline">
              <span data-translate="viewAll">عرض الكل</span>
              <i class="fas fa-arrow-left mr-2"></i>
            </a>
          </div>
          <div id="important-matches" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
          </div>
        </div>
        
        <!-- Quick Links - Only Matches and Competitions -->
        <div class="grid grid-cols-2 gap-4">
          <a href="/matches" class="glass-card p-8 text-center hover:scale-105 transition-transform">
            <i class="fas fa-calendar-alt text-5xl text-primary mb-4"></i>
            <h3 class="text-xl font-bold" data-translate="matches">المباريات</h3>
          </a>
          <a href="/competitions" class="glass-card p-8 text-center hover:scale-105 transition-transform">
            <i class="fas fa-trophy text-5xl text-yellow-500 mb-4"></i>
            <h3 class="text-xl font-bold" data-translate="competitions">البطولات</h3>
          </a>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      function getStatusText(status) {
        const t = window.kooraxT;
        if (status === 'IN_PLAY' || status === 'PAUSED') return t('live');
        if (status === 'FINISHED') return t('finished');
        return t('scheduled');
      }

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
          const t = window.kooraxT;
          document.getElementById('important-matches').innerHTML = 
            importantMatches.length > 0 
              ? importantMatches.map(createMatchCard).join('') 
              : '<p class="text-center text-secondary col-span-2 py-12" data-translate="noMatches">لا توجد مباريات مهمة اليوم</p>';
          
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading matches:', error);
          document.getElementById('important-matches').innerHTML = 
            '<p class="text-center text-red-500 col-span-2 py-12" data-translate="error">حدث خطأ في تحميل المباريات</p>';
          window.kooraxApplyTranslations();
        }
      }
      
      function createMatchCard(match) {
        const t = window.kooraxT;
        const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
          ? \`<span class="status-live">\${t('live')}</span>\`
          : match.status === 'FINISHED'
          ? \`<span class="status-finished">\${t('finished')}</span>\`
          : \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
        
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
      
      // Listen for language changes
      window.addEventListener('language-changed', () => {
        loadHomeMatches();
      });
    </script>
</body>
</html>
  `);
});

// Matches page - Complete with all filters + Mobile Menu
app.get('/matches', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - المباريات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('matches')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Page Title -->
        <div class="glass-card p-6 rounded-2xl mb-6">
          <h1 class="text-4xl font-black gradient-text mb-2">
            <i class="fas fa-calendar-alt mr-3"></i>
            <span data-translate="allMatches">جميع المباريات</span>
          </h1>
        </div>

        <!-- Filters -->
        <div class="glass-card p-6 rounded-2xl mb-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onclick="filterMatches('all')" class="filter-btn active" data-filter="all">
              <i class="fas fa-list mr-2"></i>
              <span data-translate="all">الكل</span>
            </button>
            <button onclick="filterMatches('live')" class="filter-btn" data-filter="live">
              <i class="fas fa-circle text-red-500 mr-2"></i>
              <span data-translate="live">مباشر</span>
            </button>
            <button onclick="filterMatches('scheduled')" class="filter-btn" data-filter="scheduled">
              <i class="fas fa-clock mr-2"></i>
              <span data-translate="scheduled">لم تبدأ</span>
            </button>
            <button onclick="filterMatches('finished')" class="filter-btn" data-filter="finished">
              <i class="fas fa-check-circle mr-2"></i>
              <span data-translate="finished">انتهت</span>
            </button>
          </div>
        </div>

        <!-- Matches Container -->
        <div id="matches-container">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
            <div class="skeleton h-32"></div>
          </div>
        </div>
    </div>
    
    <!-- Mobile Menu Bar -->
    <div class="mobile-menu-bar">
      <nav>
        <a href="/" class="mobile-menu-item">
          <i class="fas fa-home"></i>
          <span data-translate="home">الرئيسية</span>
        </a>
        <a href="/matches" class="mobile-menu-item active">
          <i class="fas fa-calendar-alt"></i>
          <span data-translate="matches">المباريات</span>
        </a>
        <a href="/competitions" class="mobile-menu-item">
          <i class="fas fa-trophy"></i>
          <span data-translate="competitions">البطولات</span>
        </a>
      </nav>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      let allMatches = [];
      let currentFilter = 'all';

      async function loadAllMatches() {
        try {
          const response = await axios.get('/api/matches');
          allMatches = response.data.matches;
          displayMatches();
        } catch (error) {
          console.error('Error loading matches:', error);
          const t = window.kooraxT;
          document.getElementById('matches-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }

      function filterMatches(filter) {
        currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
          }
        });
        
        displayMatches();
      }

      function displayMatches() {
        let filtered = allMatches;
        
        if (currentFilter === 'live') {
          filtered = allMatches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
        } else if (currentFilter === 'scheduled') {
          filtered = allMatches.filter(m => m.status === 'SCHEDULED');
        } else if (currentFilter === 'finished') {
          filtered = allMatches.filter(m => m.status === 'FINISHED');
        }
        
        const t = window.kooraxT;
        const container = document.getElementById('matches-container');
        
        if (filtered.length === 0) {
          container.innerHTML = \`
            <div class="glass-card p-12 text-center rounded-2xl">
              <i class="fas fa-calendar-times text-6xl text-secondary mb-4"></i>
              <p class="text-xl text-secondary" data-translate="noMatches">\${t('noMatches')}</p>
            </div>
          \`;
          return;
        }
        
        // Group by competition
        const grouped = {};
        filtered.forEach(match => {
          const compId = match.competition.id;
          if (!grouped[compId]) {
            grouped[compId] = {
              competition: match.competition,
              matches: []
            };
          }
          grouped[compId].matches.push(match);
        });
        
        let html = '';
        Object.values(grouped).forEach(group => {
          html += \`
            <div class="glass-card p-6 rounded-2xl mb-6">
              <h2 class="text-2xl font-bold gradient-text mb-4 flex items-center gap-3">
                <span>\${group.competition.emblem ? \`<img src="\${group.competition.emblem}" class="w-8 h-8" onerror="this.style.display='none'">\` : ''}</span>
                <span>\${group.competition.name}</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                \${group.matches.map(createMatchCard).join('')}
              </div>
            </div>
          \`;
        });
        
        container.innerHTML = html;
      }

      function createMatchCard(match) {
        const t = window.kooraxT;
        const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
          ? \`<span class="status-live">\${t('live')}</span>\`
          : match.status === 'FINISHED'
          ? \`<span class="status-finished">\${t('finished')}</span>\`
          : \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
        
        const score = (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          ? \`<div class="score-display">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
          : \`<div class="text-lg text-secondary">\${new Date(match.utcDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>\`;
        
        return \`
          <a href="/matches/\${match.id}" class="match-card block">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-secondary">\${new Date(match.utcDate).toLocaleDateString('ar-EG')}</span>
              \${statusBadge}
            </div>
            <div class="flex items-center justify-between gap-2 md:gap-4">
              <div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <img src="\${match.homeTeam.crest || ''}" alt="\${match.homeTeam.name}" class="team-logo w-10 h-10 md:w-12 md:h-12 flex-shrink-0" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <span class="font-bold truncate text-sm md:text-base">\${match.homeTeam.name}</span>
              </div>
              <div class="text-center px-2 md:px-4 flex-shrink-0">
                \${score}
              </div>
              <div class="flex items-center gap-2 md:gap-3 flex-1 justify-end min-w-0">
                <span class="font-bold truncate text-sm md:text-base">\${match.awayTeam.name}</span>
                <img src="\${match.awayTeam.crest || ''}" alt="\${match.awayTeam.name}" class="team-logo w-10 h-10 md:w-12 md:h-12 flex-shrink-0" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
              </div>
            </div>
          </a>
        \`;
      }
      
      loadAllMatches();
      setInterval(loadAllMatches, 60000);
      
      window.addEventListener('language-changed', () => {
        displayMatches();
      });
    </script>
</body>
</html>
  `);
});

// Match Details page - Full details with events, lineup, stats
app.get('/matches/:id', (c) => {
  const matchId = c.req.param('id');
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - تفاصيل المباراة</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader()}
    
    <div class="container mx-auto px-4 py-6">
        <div id="match-details-container">
          <div class="skeleton h-96"></div>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const matchId = ${matchId};
      
      async function loadMatchDetails() {
        try {
          const response = await axios.get(\`/api/matches/\${matchId}\`);
          const match = response.data;
          
          displayMatchDetails(match);
        } catch (error) {
          console.error('Error loading match details:', error);
          const t = window.kooraxT;
          document.getElementById('match-details-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      function displayMatchDetails(match) {
        const t = window.kooraxT;
        const container = document.getElementById('match-details-container');
        
        const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
          ? \`<span class="status-live">\${t('live')}</span>\`
          : match.status === 'FINISHED'
          ? \`<span class="status-finished">\${t('finished')}</span>\`
          : \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
        
        const score = (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED')
          ? \`<div class="text-6xl font-black gradient-text">\${match.score.fullTime.home || 0} - \${match.score.fullTime.away || 0}</div>\`
          : \`<div class="text-2xl text-secondary">\${new Date(match.utcDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</div>\`;
        
        let html = \`
          <!-- Match Header -->
          <div class="glass-card p-8 rounded-2xl mb-6">
            <div class="text-center mb-6">
              <div class="flex items-center justify-center gap-3 mb-4">
                \${match.competition.emblem ? \`<img src="\${match.competition.emblem}" class="w-12 h-12" onerror="this.style.display='none'">\` : ''}
                <h2 class="text-xl font-bold">\${match.competition.name}</h2>
              </div>
              \${statusBadge}
            </div>
            
            <div class="grid grid-cols-3 gap-8 items-center mb-6">
              <!-- Home Team -->
              <div class="text-center">
                <img src="\${match.homeTeam.crest || ''}" alt="\${match.homeTeam.name}" class="w-24 h-24 mx-auto mb-4" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <h3 class="text-2xl font-bold">\${match.homeTeam.name}</h3>
              </div>
              
              <!-- Score -->
              <div class="text-center">
                \${score}
                <p class="text-sm text-secondary mt-2">\${new Date(match.utcDate).toLocaleString('ar-EG')}</p>
              </div>
              
              <!-- Away Team -->
              <div class="text-center">
                <img src="\${match.awayTeam.crest || ''}" alt="\${match.awayTeam.name}" class="w-24 h-24 mx-auto mb-4" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <h3 class="text-2xl font-bold">\${match.awayTeam.name}</h3>
              </div>
            </div>
            
            <!-- Match Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              \${match.venue ? \`
                <div class="text-center">
                  <i class="fas fa-map-marker-alt text-primary mb-2"></i>
                  <p class="text-sm text-secondary" data-translate="venue">\${t('venue')}</p>
                  <p class="font-bold">\${match.venue}</p>
                </div>
              \` : ''}
              \${match.referees && match.referees.length > 0 ? \`
                <div class="text-center">
                  <i class="fas fa-user-tie text-primary mb-2"></i>
                  <p class="text-sm text-secondary" data-translate="referee">\${t('referee')}</p>
                  <p class="font-bold">\${match.referees[0].name}</p>
                </div>
              \` : ''}
              \${match.attendance ? \`
                <div class="text-center">
                  <i class="fas fa-users text-primary mb-2"></i>
                  <p class="text-sm text-secondary" data-translate="attendance">\${t('attendance')}</p>
                  <p class="font-bold">\${match.attendance.toLocaleString()}</p>
                </div>
              \` : ''}
            </div>
          </div>
        \`;
        
        // Events (Goals, Cards, Substitutions)
        if (match.goals && match.goals.length > 0) {
          html += \`
            <div class="glass-card p-6 rounded-2xl mb-6">
              <h3 class="text-2xl font-bold gradient-text mb-4">
                <i class="fas fa-futbol mr-3"></i>
                <span data-translate="events">\${t('events')}</span>
              </h3>
              <div class="space-y-3">
                \${match.goals.map(goal => \`
                  <div class="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                      \${goal.minute}'
                    </div>
                    <div class="flex-1">
                      <p class="font-bold">\${goal.scorer.name}</p>
                      <p class="text-sm text-secondary">\${goal.team.name}</p>
                    </div>
                    <div>
                      <i class="fas fa-futbol text-2xl text-primary"></i>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`;
        }
        
        // Lineup
        if (match.lineups && match.lineups.length > 0) {
          html += \`
            <div class="glass-card p-6 rounded-2xl mb-6">
              <h3 class="text-2xl font-bold gradient-text mb-4">
                <i class="fas fa-users mr-3"></i>
                <span data-translate="lineup">\${t('lineup')}</span>
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                \${match.lineups.map(lineup => \`
                  <div>
                    <h4 class="text-xl font-bold mb-4">\${lineup.team.name}</h4>
                    <p class="text-sm text-secondary mb-3">\${t('lineup')}: \${lineup.formation || 'N/A'}</p>
                    <div class="space-y-2">
                      \${lineup.startingEleven ? lineup.startingEleven.map(player => \`
                        <div class="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                            \${player.shirtNumber || '-'}
                          </div>
                          <p class="flex-1">\${player.name}</p>
                        </div>
                      \`).join('') : '<p class="text-sm text-secondary">لا توجد تشكيلة</p>'}
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`;
        }
        
        container.innerHTML = html;
        window.kooraxApplyTranslations();
      }
      
      loadMatchDetails();
      setInterval(loadMatchDetails, 30000);
      
      window.addEventListener('language-changed', () => {
        loadMatchDetails();
      });
    </script>
</body>
</html>
  `);
});

// Competitions page + Mobile Menu
app.get('/competitions', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - البطولات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('competitions')}
    
    <div class="container mx-auto px-4 py-6">
        <div class="glass-card p-6 rounded-2xl mb-6">
          <h1 class="text-4xl font-black gradient-text">
            <i class="fas fa-trophy mr-3"></i>
            <span data-translate="competitions">البطولات</span>
          </h1>
        </div>

        <div id="competitions-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="skeleton h-48"></div>
          <div class="skeleton h-48"></div>
          <div class="skeleton h-48"></div>
        </div>
    </div>
    
    <!-- Mobile Menu Bar -->
    <div class="mobile-menu-bar">
      <nav>
        <a href="/" class="mobile-menu-item">
          <i class="fas fa-home"></i>
          <span data-translate="home">الرئيسية</span>
        </a>
        <a href="/matches" class="mobile-menu-item">
          <i class="fas fa-calendar-alt"></i>
          <span data-translate="matches">المباريات</span>
        </a>
        <a href="/competitions" class="mobile-menu-item active">
          <i class="fas fa-trophy"></i>
          <span data-translate="competitions">البطولات</span>
        </a>
      </nav>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      async function loadCompetitions() {
        try {
          const response = await axios.get('/api/competitions');
          const competitions = response.data.competitions;
          const t = window.kooraxT;
          const lang = window.kooraxGetLang();
          
          const container = document.getElementById('competitions-container');
          
          if (competitions.length === 0) {
            container.innerHTML = \`
              <div class="glass-card p-12 text-center rounded-2xl col-span-3">
                <i class="fas fa-trophy text-6xl text-secondary mb-4"></i>
                <p class="text-xl text-secondary" data-translate="noData">\${t('noData')}</p>
              </div>
            \`;
            return;
          }
          
          container.innerHTML = competitions.map(comp => {
            const compInfo = ${JSON.stringify(COMPETITIONS_INFO)}[comp.id] || {};
            const compName = lang === 'ar' ? (compInfo.name || comp.name) : (compInfo.nameEn || comp.name);
            
            return \`
              <a href="/competitions/\${comp.id}" class="glass-card p-6 rounded-2xl hover:scale-105 transition-transform block">
                <div class="flex items-center gap-4 mb-4">
                  \${comp.emblem ? \`<img src="\${comp.emblem}" class="w-16 h-16" onerror="this.style.display='none'">\` : \`<i class="fas fa-trophy text-4xl text-yellow-500"></i>\`}
                  <div class="flex-1">
                    <h3 class="text-xl font-bold">\${compName}</h3>
                    <p class="text-sm text-secondary">\${comp.area?.name || compInfo.country || ''}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-white/10">
                  <span class="text-sm text-secondary">\${compInfo.type === 'cup' ? '🏆 ' + t('competitions') : '🏟️ ' + t('standings')}</span>
                  <i class="fas fa-arrow-left text-primary"></i>
                </div>
              </a>
            \`;
          }).join('');
          
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading competitions:', error);
          const t = window.kooraxT;
          document.getElementById('competitions-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12 col-span-3" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      loadCompetitions();
      
      window.addEventListener('language-changed', () => {
        loadCompetitions();
      });
    </script>
</body>
</html>
  `);
});

// Competition Details page (Standings + Scorers)
app.get('/competitions/:id', (c) => {
  const compId = c.req.param('id');
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - تفاصيل البطولة</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader('competitions')}
    
    <div class="container mx-auto px-4 py-6">
        <!-- Competition Header -->
        <div id="comp-header" class="glass-card p-6 rounded-2xl mb-6">
          <div class="skeleton h-24"></div>
        </div>

        <!-- Tabs -->
        <div class="glass-card p-2 rounded-2xl mb-6">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="showTab('standings')" class="tab-btn active" data-tab="standings">
              <i class="fas fa-list-ol mr-2"></i>
              <span data-translate="standings">الترتيب</span>
            </button>
            <button onclick="showTab('scorers')" class="tab-btn" data-tab="scorers">
              <i class="fas fa-futbol mr-2"></i>
              <span data-translate="topScorers">الهدافون</span>
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div id="standings-tab" class="tab-content active">
          <div class="skeleton h-96"></div>
        </div>
        
        <div id="scorers-tab" class="tab-content">
          <div class="skeleton h-96"></div>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const compId = ${compId};
      let currentTab = 'standings';
      
      function showTab(tab) {
        currentTab = tab;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
          }
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(tab + '-tab').classList.add('active');
        
        if (tab === 'standings') {
          loadStandings();
        } else {
          loadScorers();
        }
      }
      
      async function loadCompetitionHeader() {
        try {
          const response = await axios.get('/api/competitions');
          const competitions = response.data.competitions;
          const comp = competitions.find(c => c.id == compId);
          
          if (!comp) return;
          
          const t = window.kooraxT;
          const lang = window.kooraxGetLang();
          const compInfo = ${JSON.stringify(COMPETITIONS_INFO)}[comp.id] || {};
          const compName = lang === 'ar' ? (compInfo.name || comp.name) : (compInfo.nameEn || comp.name);
          
          document.getElementById('comp-header').innerHTML = \`
            <div class="flex items-center gap-4">
              \${comp.emblem ? \`<img src="\${comp.emblem}" class="w-20 h-20" onerror="this.style.display='none'">\` : \`<i class="fas fa-trophy text-5xl text-yellow-500"></i>\`}
              <div class="flex-1">
                <h1 class="text-3xl font-black gradient-text">\${compName}</h1>
                <p class="text-secondary">\${comp.area?.name || compInfo.country || ''}</p>
              </div>
              <a href="/competitions" class="text-primary hover:underline">
                <i class="fas fa-arrow-right mr-2"></i>
                <span data-translate="backToCompetitions">\${t('backToCompetitions')}</span>
              </a>
            </div>
          \`;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading competition header:', error);
        }
      }
      
      async function loadStandings() {
        try {
          const response = await axios.get(\`/api/competitions/\${compId}/standings\`);
          const standings = response.data.standings;
          const t = window.kooraxT;
          
          const container = document.getElementById('standings-tab');
          
          if (!standings || standings.length === 0) {
            container.innerHTML = \`
              <div class="glass-card p-12 text-center rounded-2xl">
                <i class="fas fa-list-ol text-6xl text-secondary mb-4"></i>
                <p class="text-xl text-secondary" data-translate="noData">\${t('noData')}</p>
              </div>
            \`;
            return;
          }
          
          let html = '';
          standings.forEach(standing => {
            if (standing.table) {
              html += \`
                <div class="glass-card p-6 rounded-2xl mb-6">
                  \${standing.group ? \`<h3 class="text-xl font-bold mb-4">\${standing.group}</h3>\` : ''}
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead>
                        <tr class="border-b border-white/10">
                          <th class="text-right p-3" data-translate="position">\${t('position')}</th>
                          <th class="text-right p-3" data-translate="team">\${t('team')}</th>
                          <th class="text-center p-3" data-translate="played">\${t('played')}</th>
                          <th class="text-center p-3" data-translate="won">\${t('won')}</th>
                          <th class="text-center p-3" data-translate="draw">\${t('draw')}</th>
                          <th class="text-center p-3" data-translate="lost">\${t('lost')}</th>
                          <th class="text-center p-3" data-translate="goalDifference">\${t('goalDifference')}</th>
                          <th class="text-center p-3 font-bold" data-translate="points">\${t('points')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        \${standing.table.map((team, idx) => \`
                          <tr class="border-b border-white/5 hover:bg-white/5 transition">
                            <td class="p-3">
                              <div class="w-8 h-8 rounded-full \${idx < 4 ? 'bg-green-500/20 text-green-500' : idx >= standing.table.length - 3 ? 'bg-red-500/20 text-red-500' : 'bg-white/10'} flex items-center justify-center font-bold text-sm">
                                \${team.position}
                              </div>
                            </td>
                            <td class="p-3">
                              <div class="flex items-center gap-3">
                                <img src="\${team.team.crest}" class="w-8 h-8" onerror="this.style.display='none'">
                                <span class="font-medium">\${team.team.name}</span>
                              </div>
                            </td>
                            <td class="text-center p-3">\${team.playedGames}</td>
                            <td class="text-center p-3">\${team.won}</td>
                            <td class="text-center p-3">\${team.draw}</td>
                            <td class="text-center p-3">\${team.lost}</td>
                            <td class="text-center p-3 \${team.goalDifference > 0 ? 'text-green-500' : team.goalDifference < 0 ? 'text-red-500' : ''}">\${team.goalDifference > 0 ? '+' : ''}\${team.goalDifference}</td>
                            <td class="text-center p-3 font-bold text-primary">\${team.points}</td>
                          </tr>
                        \`).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              \`;
            }
          });
          
          container.innerHTML = html;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading standings:', error);
          const t = window.kooraxT;
          document.getElementById('standings-tab').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      async function loadScorers() {
        try {
          const response = await axios.get(\`/api/competitions/\${compId}/scorers\`);
          const scorers = response.data.scorers;
          const t = window.kooraxT;
          
          const container = document.getElementById('scorers-tab');
          
          if (!scorers || scorers.length === 0) {
            container.innerHTML = \`
              <div class="glass-card p-12 text-center rounded-2xl">
                <i class="fas fa-futbol text-6xl text-secondary mb-4"></i>
                <p class="text-xl text-secondary" data-translate="noData">\${t('noData')}</p>
              </div>
            \`;
            return;
          }
          
          container.innerHTML = \`
            <div class="glass-card p-6 rounded-2xl">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-white/10">
                      <th class="text-right p-3">#</th>
                      <th class="text-right p-3" data-translate="player">\${t('player')}</th>
                      <th class="text-right p-3" data-translate="team">\${t('team')}</th>
                      <th class="text-center p-3" data-translate="goals">\${t('goals')}</th>
                      <th class="text-center p-3" data-translate="assists">\${t('assists')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${scorers.map((scorer, idx) => \`
                      <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="p-3">
                          <div class="w-8 h-8 rounded-full \${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-gray-400/20 text-gray-400' : idx === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/10'} flex items-center justify-center font-bold text-sm">
                            \${idx + 1}
                          </div>
                        </td>
                        <td class="p-3">
                          <p class="font-bold">\${scorer.player.name}</p>
                          <p class="text-sm text-secondary">\${scorer.player.nationality || ''}</p>
                        </td>
                        <td class="p-3">
                          <div class="flex items-center gap-2">
                            \${scorer.team.crest ? \`<img src="\${scorer.team.crest}" class="w-6 h-6" onerror="this.style.display='none'">\` : ''}
                            <span>\${scorer.team.name}</span>
                          </div>
                        </td>
                        <td class="text-center p-3">
                          <span class="text-xl font-bold text-primary">\${scorer.goals || scorer.playedMatches || 0}</span>
                        </td>
                        <td class="text-center p-3 text-secondary">\${scorer.assists || '-'}</td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          \`;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading scorers:', error);
          const t = window.kooraxT;
          document.getElementById('scorers-tab').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      loadCompetitionHeader();
      loadStandings();
      
      window.addEventListener('language-changed', () => {
        loadCompetitionHeader();
        if (currentTab === 'standings') {
          loadStandings();
        } else {
          loadScorers();
        }
      });
    </script>
</body>
</html>
  `);
});

// Team Details page
app.get('/teams/:id', (c) => {
  const teamId = c.req.param('id');
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚽ Koorax - تفاصيل الفريق</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <link rel="stylesheet" href="/static/koorax-enhanced.css">
</head>
<body>
    ${getEnhancedHeader()}
    
    <div class="container mx-auto px-4 py-6">
        <div id="team-details-container">
          <div class="skeleton h-96"></div>
        </div>
    </div>
    
    <script src="/static/koorax-features.js"></script>
    <script>
      const teamId = ${teamId};
      
      async function loadTeamDetails() {
        try {
          const [teamResponse, matchesResponse] = await Promise.all([
            axios.get(\`/api/teams/\${teamId}\`),
            axios.get(\`/api/teams/\${teamId}/matches\`)
          ]);
          
          const team = teamResponse.data;
          const matches = matchesResponse.data.matches || [];
          const t = window.kooraxT;
          
          const container = document.getElementById('team-details-container');
          
          let html = \`
            <!-- Team Header -->
            <div class="glass-card p-8 rounded-2xl mb-6">
              <div class="flex flex-col md:flex-row items-center gap-6">
                <img src="\${team.crest}" class="w-32 h-32" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E⚽%3C/text%3E%3C/svg%3E'">
                <div class="flex-1 text-center md:text-right">
                  <h1 class="text-4xl font-black gradient-text mb-2">\${team.name}</h1>
                  <p class="text-xl text-secondary mb-4">\${team.shortName || ''}</p>
                  <div class="flex flex-wrap gap-3 justify-center md:justify-start">
                    \${team.founded ? \`<span class="px-4 py-2 bg-white/10 rounded-full text-sm">📅 \${t('founded')}: \${team.founded}</span>\` : ''}
                    \${team.venue ? \`<span class="px-4 py-2 bg-white/10 rounded-full text-sm">🏟️ \${team.venue}</span>\` : ''}
                    \${team.area?.name ? \`<span class="px-4 py-2 bg-white/10 rounded-full text-sm">🌍 \${team.area.name}</span>\` : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Team Matches -->
            <div class="glass-card p-6 rounded-2xl">
              <h2 class="text-2xl font-bold gradient-text mb-6">
                <i class="fas fa-calendar-alt mr-3"></i>
                <span data-translate="matches">\${t('matches')}</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                \${matches.slice(0, 10).map(match => {
                  const isHome = match.homeTeam.id == teamId;
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  const score = match.score.fullTime.home !== null 
                    ? \`\${match.score.fullTime.home} - \${match.score.fullTime.away}\`
                    : new Date(match.utcDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
                  
                  const statusBadge = match.status === 'IN_PLAY' || match.status === 'PAUSED'
                    ? \`<span class="status-live">\${t('live')}</span>\`
                    : match.status === 'FINISHED'
                    ? \`<span class="status-finished">\${t('finished')}</span>\`
                    : \`<span class="status-scheduled">\${t('scheduled')}</span>\`;
                  
                  return \`
                    <a href="/matches/\${match.id}" class="match-card block">
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-sm text-secondary">\${match.competition.name}</span>
                        \${statusBadge}
                      </div>
                      <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center gap-2 flex-1">
                          <img src="\${opponent.crest}" class="w-10 h-10" onerror="this.style.display='none'">
                          <span class="font-bold truncate">\${isHome ? 'vs' : '@'} \${opponent.name}</span>
                        </div>
                        <div class="text-center px-4">
                          <div class="text-lg font-bold">\${score}</div>
                        </div>
                      </div>
                    </a>
                  \`;
                }).join('')}
              </div>
            </div>
          \`;
          
          container.innerHTML = html;
          window.kooraxApplyTranslations();
        } catch (error) {
          console.error('Error loading team details:', error);
          const t = window.kooraxT;
          document.getElementById('team-details-container').innerHTML = 
            \`<p class="text-center text-red-500 py-12" data-translate="error">\${t('error')}</p>\`;
        }
      }
      
      loadTeamDetails();
      
      window.addEventListener('language-changed', () => {
        loadTeamDetails();
      });
    </script>
</body>
</html>
  `);
});

export default app;
