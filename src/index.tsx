import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { 
  getCompetitions, 
  getMatches, 
  getMatchesByDateRange,
  getStandings, 
  getTopScorers,
  FootballApiEnv 
} from './footballApi';

type Bindings = {
  FOOTBALL_API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
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

app.get('/api/matches/live', async (c) => {
  try {
    const data = await getMatches({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, 'LIVE');
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch live matches' }, 500);
  }
});

app.get('/api/matches/upcoming', async (c) => {
  try {
    // Get matches for next 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = nextWeek.toISOString().split('T')[0];
    
    const data = await getMatchesByDateRange(
      { FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, 
      dateFrom, 
      dateTo
    );
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch upcoming matches' }, 500);
  }
});

app.get('/api/matches/finished', async (c) => {
  try {
    const data = await getMatches({ FOOTBALL_API_TOKEN: c.env.FOOTBALL_API_TOKEN }, 'FINISHED');
    return c.json(data);
  } catch (error) {
    return c.json({ error: 'Failed to fetch finished matches' }, 500);
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

// Frontend Routes
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مباريات كرة القدم - المباريات المباشرة والبطولات</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          
          * {
            font-family: 'Cairo', sans-serif;
          }
          
          body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            min-height: 100vh;
          }
          
          .glass-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          }
          
          .glass-card:hover {
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          .status-badge {
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          .status-live {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            animation: pulse 2s infinite;
          }
          
          .status-finished {
            background: rgba(100, 116, 139, 0.5);
          }
          
          .status-scheduled {
            background: rgba(59, 130, 246, 0.5);
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        </style>
    </head>
    <body class="text-white">
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-futbol text-3xl gradient-text"></i>
                        <h1 class="text-2xl font-bold gradient-text">مباريات كرة القدم</h1>
                    </div>
                    <div class="flex gap-4">
                        <a href="/matches" class="px-4 py-2 rounded-lg glass-card hover:bg-blue-600 transition">
                            <i class="fas fa-calendar-alt ml-2"></i>المباريات
                        </a>
                        <a href="/competitions" class="px-4 py-2 rounded-lg glass-card hover:bg-blue-600 transition">
                            <i class="fas fa-trophy ml-2"></i>البطولات
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <div class="text-center animate-fade-in">
                <i class="fas fa-futbol text-8xl gradient-text mb-6 inline-block"></i>
                <h2 class="text-5xl font-bold mb-4">مرحباً بك في موقع المباريات</h2>
                <p class="text-xl text-gray-300 mb-8">تابع المباريات المباشرة والبطولات العالمية</p>
                
                <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
                    <a href="/matches" class="glass-card p-8 rounded-2xl hover:scale-105 transition-transform">
                        <i class="fas fa-calendar-alt text-5xl text-blue-400 mb-4"></i>
                        <h3 class="text-2xl font-bold mb-2">المباريات</h3>
                        <p class="text-gray-300">شاهد المباريات المباشرة والقادمة والمنتهية</p>
                    </a>
                    
                    <a href="/competitions" class="glass-card p-8 rounded-2xl hover:scale-105 transition-transform">
                        <i class="fas fa-trophy text-5xl text-yellow-400 mb-4"></i>
                        <h3 class="text-2xl font-bold mb-2">البطولات</h3>
                        <p class="text-gray-300">تصفح البطولات والجداول والهدافين</p>
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/matches', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>المباريات - مباريات كرة القدم</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          
          * {
            font-family: 'Cairo', sans-serif;
          }
          
          body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            min-height: 100vh;
          }
          
          .glass-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          }
          
          .glass-card:hover {
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 0.5rem;
            height: 120px;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          .status-badge {
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          .status-live {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            animation: pulse 2s infinite;
          }
          
          .status-finished {
            background: rgba(100, 116, 139, 0.5);
          }
          
          .status-scheduled {
            background: rgba(59, 130, 246, 0.5);
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        </style>
    </head>
    <body class="text-white">
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <a href="/" class="flex items-center gap-3">
                            <i class="fas fa-futbol text-3xl gradient-text"></i>
                            <h1 class="text-2xl font-bold gradient-text">مباريات كرة القدم</h1>
                        </a>
                    </div>
                    <div class="flex gap-4">
                        <a href="/matches" class="px-4 py-2 rounded-lg bg-blue-600 transition">
                            <i class="fas fa-calendar-alt ml-2"></i>المباريات
                        </a>
                        <a href="/competitions" class="px-4 py-2 rounded-lg glass-card hover:bg-blue-600 transition">
                            <i class="fas fa-trophy ml-2"></i>البطولات
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <!-- Live Matches Section -->
            <section class="mb-12 animate-fade-in">
                <div class="flex items-center gap-3 mb-6">
                    <i class="fas fa-circle text-red-500 text-sm animate-pulse"></i>
                    <h2 class="text-3xl font-bold gradient-text">مباريات مباشرة</h2>
                </div>
                <div id="live-matches" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                </div>
            </section>

            <!-- Upcoming Matches Section -->
            <section class="mb-12 animate-fade-in">
                <div class="flex items-center gap-3 mb-6">
                    <i class="fas fa-clock text-blue-400 text-xl"></i>
                    <h2 class="text-3xl font-bold gradient-text">مباريات قادمة</h2>
                </div>
                <div id="upcoming-matches" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                </div>
            </section>

            <!-- Finished Matches Section -->
            <section class="mb-12 animate-fade-in">
                <div class="flex items-center gap-3 mb-6">
                    <i class="fas fa-check-circle text-gray-400 text-xl"></i>
                    <h2 class="text-3xl font-bold gradient-text">مباريات منتهية</h2>
                </div>
                <div id="finished-matches" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                    <div class="skeleton"></div>
                </div>
            </section>
        </div>

        <script>
          function getStatusBadge(status) {
            if (status === 'IN_PLAY' || status === 'PAUSED') {
              return '<span class="status-badge status-live">مباشر</span>';
            } else if (status === 'FINISHED') {
              return '<span class="status-badge status-finished">انتهت</span>';
            } else {
              return '<span class="status-badge status-scheduled">لم تبدأ</span>';
            }
          }

          function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
          }

          function createMatchCard(match) {
            const homeTeam = match.homeTeam;
            const awayTeam = match.awayTeam;
            const score = match.score;
            
            return \`
              <div class="glass-card p-6 rounded-xl animate-fade-in">
                <div class="flex justify-between items-start mb-4">
                  <span class="text-xs text-gray-400">\${match.competition.name}</span>
                  \${getStatusBadge(match.status)}
                </div>
                
                <div class="flex items-center justify-between mb-4">
                  <div class="flex-1 text-center">
                    <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                      \${homeTeam.crest ? \`<img src="\${homeTeam.crest}" alt="\${homeTeam.name}" class="w-full h-full object-contain">\` : '<i class="fas fa-shield-alt text-4xl text-gray-500"></i>'}
                    </div>
                    <h3 class="font-bold text-sm">\${homeTeam.name}</h3>
                  </div>
                  
                  <div class="px-6">
                    <div class="text-3xl font-bold text-center">
                      \${score.fullTime.home !== null ? score.fullTime.home : '-'} 
                      <span class="text-gray-500">:</span> 
                      \${score.fullTime.away !== null ? score.fullTime.away : '-'}
                    </div>
                  </div>
                  
                  <div class="flex-1 text-center">
                    <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                      \${awayTeam.crest ? \`<img src="\${awayTeam.crest}" alt="\${awayTeam.name}" class="w-full h-full object-contain">\` : '<i class="fas fa-shield-alt text-4xl text-gray-500"></i>'}
                    </div>
                    <h3 class="font-bold text-sm">\${awayTeam.name}</h3>
                  </div>
                </div>
                
                <div class="text-center text-sm text-gray-400 border-t border-gray-700 pt-3">
                  <i class="far fa-calendar ml-1"></i>
                  \${formatDate(match.utcDate)}
                </div>
              </div>
            \`;
          }

          async function loadMatches() {
            try {
              // Load live matches
              const liveResponse = await axios.get('/api/matches/live');
              const liveMatches = liveResponse.data.matches;
              const liveContainer = document.getElementById('live-matches');
              
              if (liveMatches.length === 0) {
                liveContainer.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">لا توجد مباريات مباشرة حالياً</div>';
              } else {
                liveContainer.innerHTML = liveMatches.map(createMatchCard).join('');
              }

              // Load upcoming matches
              const upcomingResponse = await axios.get('/api/matches/upcoming');
              const upcomingMatches = upcomingResponse.data.matches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED').slice(0, 9);
              const upcomingContainer = document.getElementById('upcoming-matches');
              
              if (upcomingMatches.length === 0) {
                upcomingContainer.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">لا توجد مباريات قادمة</div>';
              } else {
                upcomingContainer.innerHTML = upcomingMatches.map(createMatchCard).join('');
              }

              // Load finished matches
              const finishedResponse = await axios.get('/api/matches/finished');
              const finishedMatches = finishedResponse.data.matches.slice(0, 9);
              const finishedContainer = document.getElementById('finished-matches');
              
              if (finishedMatches.length === 0) {
                finishedContainer.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">لا توجد مباريات منتهية</div>';
              } else {
                finishedContainer.innerHTML = finishedMatches.map(createMatchCard).join('');
              }
            } catch (error) {
              console.error('Error loading matches:', error);
              document.getElementById('live-matches').innerHTML = '<div class="col-span-full text-center text-red-400 py-8">حدث خطأ في تحميل المباريات</div>';
            }
          }

          // Initial load
          loadMatches();

          // Refresh every 60 seconds
          setInterval(loadMatches, 60000);
        </script>
    </body>
    </html>
  `);
});

app.get('/competitions', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>البطولات - مباريات كرة القدم</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          
          * {
            font-family: 'Cairo', sans-serif;
          }
          
          body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            min-height: 100vh;
          }
          
          .glass-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          }
          
          .glass-card:hover {
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateY(-5px);
            transition: all 0.3s ease;
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 0.5rem;
            height: 200px;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        </style>
    </head>
    <body class="text-white">
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <a href="/" class="flex items-center gap-3">
                            <i class="fas fa-futbol text-3xl gradient-text"></i>
                            <h1 class="text-2xl font-bold gradient-text">مباريات كرة القدم</h1>
                        </a>
                    </div>
                    <div class="flex gap-4">
                        <a href="/matches" class="px-4 py-2 rounded-lg glass-card hover:bg-blue-600 transition">
                            <i class="fas fa-calendar-alt ml-2"></i>المباريات
                        </a>
                        <a href="/competitions" class="px-4 py-2 rounded-lg bg-blue-600 transition">
                            <i class="fas fa-trophy ml-2"></i>البطولات
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <div class="mb-8 animate-fade-in">
                <h2 class="text-4xl font-bold gradient-text mb-2">البطولات العالمية</h2>
                <p class="text-gray-300">تابع أهم البطولات والدوريات العالمية</p>
            </div>

            <div id="competitions-container" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="skeleton"></div>
                <div class="skeleton"></div>
                <div class="skeleton"></div>
            </div>
        </div>

        <script>
          async function loadCompetitions() {
            try {
              const response = await axios.get('/api/competitions');
              const competitions = response.data.competitions;
              const container = document.getElementById('competitions-container');
              
              if (competitions.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">لا توجد بطولات متاحة</div>';
                return;
              }

              container.innerHTML = competitions.map(comp => \`
                <a href="/competitions/\${comp.id}" class="glass-card p-6 rounded-xl block animate-fade-in">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 flex items-center justify-center">
                      \${comp.emblem ? \`<img src="\${comp.emblem}" alt="\${comp.name}" class="w-full h-full object-contain">\` : '<i class="fas fa-trophy text-4xl text-yellow-400"></i>'}
                    </div>
                    <div class="flex-1">
                      <h3 class="font-bold text-lg mb-1">\${comp.name}</h3>
                      <p class="text-sm text-gray-400">\${comp.area.name}</p>
                    </div>
                  </div>
                  
                  <div class="border-t border-gray-700 pt-4">
                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition">
                      <i class="fas fa-arrow-left ml-2"></i>
                      عرض التفاصيل
                    </button>
                  </div>
                </a>
              \`).join('');
            } catch (error) {
              console.error('Error loading competitions:', error);
              document.getElementById('competitions-container').innerHTML = '<div class="col-span-full text-center text-red-400 py-8">حدث خطأ في تحميل البطولات</div>';
            }
          }

          loadCompetitions();
        </script>
    </body>
    </html>
  `);
});

app.get('/competitions/:id', (c) => {
  const competitionId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تفاصيل البطولة - مباريات كرة القدم</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          
          * {
            font-family: 'Cairo', sans-serif;
          }
          
          body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            min-height: 100vh;
          }
          
          .glass-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .tab-button {
            padding: 12px 24px;
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .tab-button.active {
            border-bottom-color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
          }
          
          .tab-button:hover {
            background: rgba(59, 130, 246, 0.05);
          }
          
          .skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 0.5rem;
            height: 60px;
            margin-bottom: 8px;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          .table-row {
            transition: all 0.3s ease;
          }
          
          .table-row:hover {
            background: rgba(59, 130, 246, 0.1);
            transform: scale(1.01);
          }
        </style>
    </head>
    <body class="text-white">
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <a href="/" class="flex items-center gap-3">
                            <i class="fas fa-futbol text-3xl gradient-text"></i>
                            <h1 class="text-2xl font-bold gradient-text">مباريات كرة القدم</h1>
                        </a>
                    </div>
                    <div class="flex gap-4">
                        <a href="/matches" class="px-4 py-2 rounded-lg glass-card hover:bg-blue-600 transition">
                            <i class="fas fa-calendar-alt ml-2"></i>المباريات
                        </a>
                        <a href="/competitions" class="px-4 py-2 rounded-lg glass-card hover:bg-blue-600 transition">
                            <i class="fas fa-trophy ml-2"></i>البطولات
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <div class="mb-8">
                <a href="/competitions" class="text-blue-400 hover:text-blue-300 transition">
                    <i class="fas fa-arrow-right ml-2"></i>العودة للبطولات
                </a>
            </div>

            <div class="glass-card rounded-xl p-6 mb-8 animate-fade-in">
                <div class="flex gap-4 border-b border-gray-700">
                    <button class="tab-button active" onclick="switchTab('standings', this)">
                        <i class="fas fa-list-ol ml-2"></i>الترتيب
                    </button>
                    <button class="tab-button" onclick="switchTab('scorers', this)">
                        <i class="fas fa-futbol ml-2"></i>الهدافون
                    </button>
                </div>

                <div id="standings-tab" class="tab-content mt-6">
                    <div class="space-y-2">
                        <div class="skeleton"></div>
                        <div class="skeleton"></div>
                        <div class="skeleton"></div>
                    </div>
                </div>

                <div id="scorers-tab" class="tab-content mt-6 hidden">
                    <div class="space-y-2">
                        <div class="skeleton"></div>
                        <div class="skeleton"></div>
                        <div class="skeleton"></div>
                    </div>
                </div>
            </div>
        </div>

        <script>
          const competitionId = ${competitionId};

          function switchTab(tabName, button) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
              tab.classList.add('hidden');
            });
            
            // Remove active from all buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
              btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.remove('hidden');
            button.classList.add('active');
          }

          async function loadStandings() {
            try {
              const response = await axios.get(\`/api/competitions/\${competitionId}/standings\`);
              const standings = response.data.standings;
              const container = document.getElementById('standings-tab');
              
              if (!standings || standings.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 py-8">لا توجد بيانات الترتيب متاحة</div>';
                return;
              }

              const tableData = standings[0].table;
              
              container.innerHTML = \`
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-700 text-sm">
                        <th class="text-center py-3 px-2">#</th>
                        <th class="text-right py-3 px-4">الفريق</th>
                        <th class="text-center py-3 px-2">لعب</th>
                        <th class="text-center py-3 px-2">فاز</th>
                        <th class="text-center py-3 px-2">تعادل</th>
                        <th class="text-center py-3 px-2">خسر</th>
                        <th class="text-center py-3 px-2">الأهداف</th>
                        <th class="text-center py-3 px-2 font-bold">النقاط</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${tableData.map(team => \`
                        <tr class="table-row border-b border-gray-800">
                          <td class="text-center py-4 px-2 font-bold text-blue-400">\${team.position}</td>
                          <td class="py-4 px-4">
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 flex-shrink-0">
                                \${team.team.crest ? \`<img src="\${team.team.crest}" alt="\${team.team.name}" class="w-full h-full object-contain">\` : '<i class="fas fa-shield-alt text-gray-500"></i>'}
                              </div>
                              <span class="font-semibold">\${team.team.name}</span>
                            </div>
                          </td>
                          <td class="text-center py-4 px-2">\${team.playedGames}</td>
                          <td class="text-center py-4 px-2 text-green-400">\${team.won}</td>
                          <td class="text-center py-4 px-2 text-yellow-400">\${team.draw}</td>
                          <td class="text-center py-4 px-2 text-red-400">\${team.lost}</td>
                          <td class="text-center py-4 px-2">\${team.goalsFor}:\${team.goalsAgainst}</td>
                          <td class="text-center py-4 px-2 font-bold text-lg text-blue-400">\${team.points}</td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                </div>
              \`;
            } catch (error) {
              console.error('Error loading standings:', error);
              document.getElementById('standings-tab').innerHTML = '<div class="text-center text-red-400 py-8">حدث خطأ في تحميل الترتيب</div>';
            }
          }

          async function loadScorers() {
            try {
              const response = await axios.get(\`/api/competitions/\${competitionId}/scorers\`);
              const scorers = response.data.scorers;
              const container = document.getElementById('scorers-tab');
              
              if (!scorers || scorers.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 py-8">لا توجد بيانات الهدافين متاحة</div>';
                return;
              }

              container.innerHTML = \`
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-700 text-sm">
                        <th class="text-center py-3 px-2">#</th>
                        <th class="text-right py-3 px-4">اللاعب</th>
                        <th class="text-right py-3 px-4">الفريق</th>
                        <th class="text-center py-3 px-2 font-bold">الأهداف</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${scorers.slice(0, 20).map((scorer, index) => \`
                        <tr class="table-row border-b border-gray-800">
                          <td class="text-center py-4 px-2 font-bold text-blue-400">\${index + 1}</td>
                          <td class="py-4 px-4">
                            <div>
                              <div class="font-semibold">\${scorer.player.name}</div>
                              <div class="text-xs text-gray-400">\${scorer.player.nationality || ''}</div>
                            </div>
                          </td>
                          <td class="py-4 px-4">
                            <div class="flex items-center gap-2">
                              <div class="w-6 h-6 flex-shrink-0">
                                \${scorer.team.crest ? \`<img src="\${scorer.team.crest}" alt="\${scorer.team.name}" class="w-full h-full object-contain">\` : '<i class="fas fa-shield-alt text-gray-500 text-xs"></i>'}
                              </div>
                              <span class="text-sm">\${scorer.team.name}</span>
                            </div>
                          </td>
                          <td class="text-center py-4 px-2 font-bold text-lg">
                            <span class="inline-flex items-center gap-1">
                              <i class="fas fa-futbol text-blue-400 text-sm"></i>
                              \${scorer.goals}
                            </span>
                          </td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                </div>
              \`;
            } catch (error) {
              console.error('Error loading scorers:', error);
              document.getElementById('scorers-tab').innerHTML = '<div class="text-center text-red-400 py-8">حدث خطأ في تحميل الهدافين</div>';
            }
          }

          // Load data
          loadStandings();
          loadScorers();
        </script>
    </body>
    </html>
  `);
});

export default app;
