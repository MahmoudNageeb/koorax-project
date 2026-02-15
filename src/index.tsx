import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { 
  getCompetitions, 
  getMatches, 
  getMatchesByDateRange,
  getStandings, 
  getTopScorers,
  getMatchById,
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

// Shared CSS Styles
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  
  * {
    font-family: 'Cairo', sans-serif;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    background: #0d1117;
    background-image: 
      radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(34, 197, 94, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(5, 150, 105, 0.1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%);
    min-height: 100vh;
    color: #fff;
  }
  
  .glass-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 
      0 8px 32px 0 rgba(0, 0, 0, 0.4),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .glass-card:hover {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.15);
    transform: translateY(-4px) scale(1.02);
    box-shadow: 
      0 20px 60px 0 rgba(0, 0, 0, 0.5),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
      0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 25%, #2563eb 50%, #1d4ed8 75%, #60a5fa 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(20px);
    }
    to { 
      opacity: 1; 
      transform: translateY(0);
    }
  }
  
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 0%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0.03) 100%
    );
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: 12px;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .status-badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .status-live {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
    animation: pulse 2s ease-in-out infinite;
  }
  
  .status-finished {
    background: rgba(100, 116, 139, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.3);
  }
  
  .status-scheduled {
    background: rgba(59, 130, 246, 0.4);
    border: 1px solid rgba(96, 165, 250, 0.3);
  }
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.8;
      transform: scale(1.05);
    }
  }
  
  .match-card {
    position: relative;
    overflow: hidden;
  }
  
  .match-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s;
  }
  
  .match-card:hover::before {
    left: 100%;
  }
  
  .competition-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.3);
  }
  
  .score-display {
    font-size: 2.5rem;
    font-weight: 900;
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
  }
  
  .team-logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    transition: transform 0.3s;
  }
  
  .team-logo:hover {
    transform: scale(1.1) rotate(5deg);
  }
  
  .nav-link {
    position: relative;
    padding: 10px 20px;
    border-radius: 12px;
    transition: all 0.3s;
    overflow: hidden;
  }
  
  .nav-link::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
    opacity: 0;
    transition: opacity 0.3s;
    z-index: -1;
  }
  
  .nav-link:hover::before {
    opacity: 1;
  }
  
  .competition-filter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .competition-filter:hover,
  .competition-filter.active {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
  }
  
  /* ========== RESPONSIVE FIXES ========== */
  
  /* Prevent horizontal overflow */
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }
  
  /* Container responsive */
  .container {
    width: 100%;
    max-width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
    margin-left: auto;
    margin-right: auto;
  }
  
  @media (min-width: 640px) {
    .container { max-width: 640px; }
  }
  
  @media (min-width: 768px) {
    .container { max-width: 768px; }
  }
  
  @media (min-width: 1024px) {
    .container { max-width: 1024px; }
  }
  
  @media (min-width: 1280px) {
    .container { max-width: 1280px; }
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .glass-card {
      padding: 1rem;
    }
    
    .glass-card:hover {
      transform: translateY(-2px) scale(1.01);
    }
    
    .nav-link {
      padding: 8px 12px;
      font-size: 0.875rem;
    }
    
    .status-badge {
      padding: 4px 10px;
      font-size: 0.65rem;
    }
    
    .competition-badge {
      padding: 3px 8px;
      font-size: 0.65rem;
      gap: 4px;
    }
    
    .team-logo {
      width: 48px;
      height: 48px;
    }
    
    .score-display {
      font-size: 1.75rem;
    }
    
    .competition-filter {
      padding: 6px 12px;
      font-size: 0.75rem;
    }
    
    /* Hide long text on mobile */
    .line-clamp-1 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
    
    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
  
  /* Tablet optimizations */
  @media (min-width: 769px) and (max-width: 1024px) {
    .team-logo {
      width: 56px;
      height: 56px;
    }
    
    .score-display {
      font-size: 2rem;
    }
  }
  
  /* Table responsive */
  @media (max-width: 768px) {
    table {
      font-size: 0.75rem;
    }
    
    th, td {
      padding: 0.5rem 0.25rem;
    }
    
    .hide-mobile {
      display: none;
    }
  }
  
  /* Utility classes */
  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-4px);
  }
  
  /* Light mode support (data-theme attribute) */
  body[data-theme="light"] {
    background: #f8fafc;
    background-image: 
      radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.08) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(249, 115, 22, 0.08) 0px, transparent 50%);
    color: #0f172a;
  }
  
  body[data-theme="light"] .glass-card {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 
      0 8px 32px 0 rgba(0, 0, 0, 0.1),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.8);
  }
  
  body[data-theme="light"] .glass-card:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.15);
  }
  
  body[data-theme="light"] .status-finished {
    background: rgba(148, 163, 184, 0.3);
    border: 1px solid rgba(100, 116, 139, 0.4);
    color: #475569;
  }
  
  body[data-theme="light"] .skeleton {
    background: linear-gradient(
      90deg,
      rgba(0,0,0,0.03) 0%,
      rgba(0,0,0,0.08) 50%,
      rgba(0,0,0,0.03) 100%
    );
  }
  
  /* ========== SPORT THEME ENHANCEMENTS ========== */
  
  /* Hero Banner */
  .hero-banner {
    position: relative;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%);
    padding: 4rem 2rem;
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 3rem;
  }
  
  .hero-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><path d="M30,50 Q50,30 70,50 T110,50" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.3"/></svg>');
    opacity: 0.3;
    animation: float 20s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  /* Enhanced Match Cards */
  .match-card-new {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .match-card-new::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #10b981, #059669);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .match-card-new:hover {
    border-color: rgba(16, 185, 129, 0.4);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.15);
  }
  
  .match-card-new:hover::after {
    opacity: 1;
  }
  
  /* Sport Badge */
  .sport-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .sport-badge.live {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
    animation: pulse 2s ease-in-out infinite;
  }
  
  .sport-badge.soon {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
  }
  
  .sport-badge.finished {
    background: rgba(100, 116, 139, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.3);
  }
  
  /* Enhanced Navigation */
  .nav-enhanced {
    background: rgba(13, 17, 23, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(16, 185, 129, 0.15);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }
  
  .nav-link-enhanced {
    padding: 12px 20px;
    border-radius: 10px;
    transition: all 0.3s;
    position: relative;
  }
  
  .nav-link-enhanced:hover,
  .nav-link-enhanced.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }
  
  .nav-link-enhanced.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #10b981, transparent);
  }
  
  /* Hamburger Menu */
  .hamburger {
    display: none;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    padding: 8px;
  }
  
  .hamburger span {
    width: 24px;
    height: 2px;
    background: #10b981;
    transition: all 0.3s;
    border-radius: 2px;
  }
  
  .hamburger.active span:nth-child(1) {
    transform: rotate(45deg) translateY(9px);
  }
  
  .hamburger.active span:nth-child(2) {
    opacity: 0;
  }
  
  .hamburger.active span:nth-child(3) {
    transform: rotate(-45deg) translateY(-9px);
  }
  
  @media (max-width: 768px) {
    .hamburger {
      display: flex;
    }
    
    .nav-menu {
      position: fixed;
      top: 70px;
      right: -100%;
      width: 80%;
      max-width: 300px;
      height: calc(100vh - 70px);
      background: rgba(13, 17, 23, 0.98);
      backdrop-filter: blur(20px);
      border-left: 1px solid rgba(16, 185, 129, 0.2);
      padding: 2rem;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999;
      overflow-y: auto;
    }
    
    .nav-menu.active {
      right: 0;
    }
    
    .nav-link-enhanced {
      display: block;
      margin-bottom: 0.5rem;
    }
  }
  
  /* Search Box */
  .search-box {
    position: relative;
    width: 100%;
    max-width: 300px;
  }
  
  .search-box input {
    width: 100%;
    padding: 10px 40px 10px 16px;
    border-radius: 12px;
    border: 1px solid rgba(16, 185, 129, 0.2);
    background: rgba(15, 23, 42, 0.5);
    color: #fff;
    font-size: 0.875rem;
    transition: all 0.3s;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: rgba(16, 185, 129, 0.5);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .search-box input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .search-box i {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #10b981;
  }
  
  /* Zikr Toast */
  .zikr-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    transform: translateX(500px);
    opacity: 0;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 9999;
  }
  
  .zikr-toast.show {
    transform: translateX(0);
    opacity: 1;
  }
  
  .zikr-toast .close-btn {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.2);
    border: none;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .zikr-toast .close-btn:hover {
    background: rgba(239, 68, 68, 0.3);
    transform: scale(1.1);
  }
  
  .zikr-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  
  .zikr-text {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.6;
    color: #fff;
    margin-bottom: 8px;
  }
  
  @media (max-width: 768px) {
    .zikr-toast {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
  
  /* Competition Cards */
  .competition-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(16, 185, 129, 0.15);
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }
  
  .competition-card:hover {
    border-color: rgba(16, 185, 129, 0.4);
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 15px 50px rgba(16, 185, 129, 0.2);
  }
  
  .competition-card img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin: 0 auto 1rem;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
  }
  
  /* Enhanced Headings */
  h1, h2, h3 {
    font-weight: 800;
  }
  
  h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
  }
  
  h2 {
    font-size: clamp(1.5rem, 4vw, 2.5rem);
  }
  
  h3 {
    font-size: clamp(1.2rem, 3vw, 1.8rem);
  }
`;

// Frontend Routes
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>⚽ Koorax - مباريات كرة القدم</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>${sharedStyles}</style>
    </head>
    <body>
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <a href="/" class="flex items-center gap-3 group">
                            <i class="fas fa-futbol text-4xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
                            <h1 class="text-3xl font-black gradient-text" data-i18n="siteTitle">Koorax</h1>
                        </a>
                    </div>
                    <div class="flex gap-3">
                        <a href="/matches" class="nav-link glass-card flex items-center gap-2">
                            <i class="fas fa-calendar-alt"></i>
                            <span data-i18n="matches">المباريات</span>
                        </a>
                        <a href="/competitions" class="nav-link glass-card flex items-center gap-2">
                            <i class="fas fa-trophy"></i>
                            <span data-i18n="competitions">البطولات</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-12">
            <div class="text-center animate-fade-in">
                <i class="fas fa-futbol text-9xl gradient-text mb-8 inline-block animate-pulse"></i>
                <h2 class="text-6xl font-black mb-6 gradient-text">مرحباً بك في عالم كرة القدم</h2>
                <p class="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">تابع المباريات المباشرة، الدوريات الكبرى، ودوري أبطال أوروبا</p>
                
                <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16">
                    <a href="/matches" class="glass-card match-card p-10 rounded-3xl group">
                        <i class="fas fa-calendar-alt text-7xl text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300"></i>
                        <h3 class="text-3xl font-bold mb-4" data-i18n="matches">المباريات</h3>
                        <p class="text-gray-300 text-lg">شاهد المباريات المباشرة والقادمة والمنتهية من جميع الدوريات</p>
                    </a>
                    
                    <a href="/competitions" class="glass-card match-card p-10 rounded-3xl group">
                        <i class="fas fa-trophy text-7xl text-yellow-400 mb-6 group-hover:scale-110 transition-transform duration-300"></i>
                        <h3 class="text-3xl font-bold mb-4" data-i18n="competitions">البطولات</h3>
                        <p class="text-gray-300 text-lg">تصفح البطولات والجداول والهدافين</p>
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Koorax Global System v5 - Enhanced -->
        <link rel="stylesheet" href="/static/enhanced-styles.css">
        <script src="/static/koorax-global.js"></script>
        <script src="/static/zikr-toast.js"></script>
        <script src="/static/nav-component.js"></script>
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
        <title>⚽ المباريات - مباريات كرة القدم</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <link rel="stylesheet" href="/static/enhanced-styles.css">
        <style>${sharedStyles}</style>
    </head>
    <body>
        <script>
        // Navigation Component Integration
        document.addEventListener('DOMContentLoaded', function() {
          if (typeof window.createEnhancedNav === 'function') {
            const navPlaceholder = document.querySelector('nav');
            if (navPlaceholder) {
              navPlaceholder.outerHTML = window.createEnhancedNav('matches');
              // Re-initialize after replacement
              if (typeof initializeNav === 'function') {
                setTimeout(initializeNav, 100);
              }
            }
          }
        });
        </script>
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <a href="/" class="flex items-center gap-3 group">
                            <i class="fas fa-futbol text-4xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
                            <h1 class="text-3xl font-black gradient-text" data-i18n="siteTitle">Koorax</h1>
                        </a>
                    </div>
                    <div class="flex gap-3">
                        <a href="/matches" class="nav-link glass-card flex items-center gap-2 bg-blue-600">
                            <i class="fas fa-calendar-alt"></i>
                            <span>المباريات</span>
                        </a>
                        <a href="/competitions" class="nav-link glass-card flex items-center gap-2">
                            <i class="fas fa-trophy"></i>
                            <span>البطولات</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <!-- Filters -->
            <div class="mb-8 glass-card p-6 rounded-2xl">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-filter text-blue-400"></i>
                    فلترة حسب البطولة
                </h3>
                <div class="flex flex-wrap gap-3" id="competition-filters">
                    <button class="competition-filter active" data-competition="all">
                        <i class="fas fa-globe"></i>
                        <span>الكل</span>
                    </button>
                </div>
            </div>

            <!-- Live Matches Section -->
            <section class="mb-12 animate-fade-in">
                <div class="flex items-center gap-4 mb-6">
                    <i class="fas fa-circle text-red-500 text-sm animate-pulse"></i>
                    <h2 class="text-4xl font-black gradient-text">مباريات مباشرة</h2>
                    <span class="status-badge status-live">LIVE</span>
                </div>
                <div id="live-matches" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </section>

            <!-- Upcoming Matches Section -->
            <section class="mb-12 animate-fade-in">
                <div class="flex items-center gap-4 mb-6">
                    <i class="fas fa-clock text-blue-400 text-2xl"></i>
                    <h2 class="text-4xl font-black gradient-text">مباريات قادمة</h2>
                </div>
                <div id="upcoming-matches" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </section>

            <!-- Finished Matches Section -->
            <section class="mb-12 animate-fade-in">
                <div class="flex items-center gap-4 mb-6">
                    <i class="fas fa-check-circle text-green-400 text-2xl"></i>
                    <h2 class="text-4xl font-black gradient-text">مباريات منتهية</h2>
                </div>
                <div id="finished-matches" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </section>
        </div>

        <script>
          let allLiveMatches = [];
          let allUpcomingMatches = [];
          let allFinishedMatches = [];
          let currentFilter = 'all';
          
          const competitionNames = {
            2021: 'Premier League',
            2014: 'La Liga',
            2019: 'Serie A',
            2002: 'Bundesliga',
            2015: 'Ligue 1',
            2001: 'Champions League'
          };

          function getStatusBadge(status) {
            if (status === 'IN_PLAY' || status === 'PAUSED') {
              return '<span class="status-badge status-live">مباشر <i class="fas fa-circle text-xs ml-1 animate-pulse"></i></span>';
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
              <a href="/matches/\${match.id}" class="glass-card match-card p-6 rounded-2xl block hover:cursor-pointer">
                <div class="flex justify-between items-start mb-4">
                  <span class="competition-badge">
                    <i class="fas fa-trophy text-xs"></i>
                    \${match.competition.name}
                  </span>
                  \${getStatusBadge(match.status)}
                </div>
                
                <div class="flex items-center justify-between mb-6">
                  <div class="flex-1 text-center">
                    <div class="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      \${homeTeam.crest ? \`<img src="\${homeTeam.crest}" alt="\${homeTeam.name}" class="team-logo">\` : '<i class="fas fa-shield-alt text-5xl text-gray-500"></i>'}
                    </div>
                    <h3 class="font-bold text-sm leading-tight">\${homeTeam.name}</h3>
                  </div>
                  
                  <div class="px-8">
                    <div class="score-display text-center">
                      \${score.fullTime.home !== null ? score.fullTime.home : '-'} 
                      <span class="text-gray-500 text-3xl">:</span> 
                      \${score.fullTime.away !== null ? score.fullTime.away : '-'}
                    </div>
                  </div>
                  
                  <div class="flex-1 text-center">
                    <div class="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      \${awayTeam.crest ? \`<img src="\${awayTeam.crest}" alt="\${awayTeam.name}" class="team-logo">\` : '<i class="fas fa-shield-alt text-5xl text-gray-500"></i>'}
                    </div>
                    <h3 class="font-bold text-sm leading-tight">\${awayTeam.name}</h3>
                  </div>
                </div>
                
                <div class="text-center text-sm text-gray-400 border-t border-gray-700 pt-4 flex items-center justify-center gap-2">
                  <i class="far fa-calendar"></i>
                  \${formatDate(match.utcDate)}
                </div>
              </a>
            \`;
          }

          function filterMatches() {
            const liveContainer = document.getElementById('live-matches');
            const upcomingContainer = document.getElementById('upcoming-matches');
            const finishedContainer = document.getElementById('finished-matches');

            const filterLive = currentFilter === 'all' ? allLiveMatches : allLiveMatches.filter(m => m.competition.id === parseInt(currentFilter));
            const filterUpcoming = currentFilter === 'all' ? allUpcomingMatches : allUpcomingMatches.filter(m => m.competition.id === parseInt(currentFilter));
            const filterFinished = currentFilter === 'all' ? allFinishedMatches : allFinishedMatches.filter(m => m.competition.id === parseInt(currentFilter));

            if (filterLive.length === 0) {
              liveContainer.innerHTML = '<div class="col-span-full text-center glass-card p-8 rounded-2xl text-gray-400"><i class="fas fa-info-circle text-3xl mb-3"></i><p>لا توجد مباريات مباشرة حالياً</p></div>';
            } else {
              liveContainer.innerHTML = filterLive.map(createMatchCard).join('');
            }

            if (filterUpcoming.length === 0) {
              upcomingContainer.innerHTML = '<div class="col-span-full text-center glass-card p-8 rounded-2xl text-gray-400"><i class="fas fa-info-circle text-3xl mb-3"></i><p>لا توجد مباريات قادمة</p></div>';
            } else {
              upcomingContainer.innerHTML = filterUpcoming.slice(0, 12).map(createMatchCard).join('');
            }

            if (filterFinished.length === 0) {
              finishedContainer.innerHTML = '<div class="col-span-full text-center glass-card p-8 rounded-2xl text-gray-400"><i class="fas fa-info-circle text-3xl mb-3"></i><p>لا توجد مباريات منتهية</p></div>';
            } else {
              finishedContainer.innerHTML = filterFinished.slice(0, 12).map(createMatchCard).join('');
            }
          }

          async function loadMatches() {
            try {
              const [liveResponse, upcomingResponse, finishedResponse] = await Promise.all([
                axios.get('/api/matches/live'),
                axios.get('/api/matches/upcoming'),
                axios.get('/api/matches/finished')
              ]);

              allLiveMatches = liveResponse.data.matches;
              allUpcomingMatches = upcomingResponse.data.matches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED');
              allFinishedMatches = finishedResponse.data.matches;

              // Build competition filters
              const allMatches = [...allLiveMatches, ...allUpcomingMatches, ...allFinishedMatches];
              const competitions = [...new Set(allMatches.map(m => m.competition.id))];
              const filtersContainer = document.getElementById('competition-filters');
              
              const competitionButtons = competitions.map(compId => {
                const match = allMatches.find(m => m.competition.id === compId);
                return \`
                  <button class="competition-filter" data-competition="\${compId}">
                    <i class="fas fa-trophy text-xs"></i>
                    <span>\${match.competition.name}</span>
                  </button>
                \`;
              }).join('');
              
              filtersContainer.innerHTML += competitionButtons;

              // Add filter click handlers
              document.querySelectorAll('.competition-filter').forEach(btn => {
                btn.addEventListener('click', function() {
                  document.querySelectorAll('.competition-filter').forEach(b => b.classList.remove('active'));
                  this.classList.add('active');
                  currentFilter = this.dataset.competition;
                  filterMatches();
                });
              });

              filterMatches();
            } catch (error) {
              console.error('Error loading matches:', error);
            }
          }

          loadMatches();
          // Auto-refresh every 1 second for real-time updates
          setInterval(loadMatches, 1000);
        </script>
        
        <!-- Koorax Global System v5 - Enhanced -->
        <link rel="stylesheet" href="/static/enhanced-styles.css">
        <script src="/static/koorax-global.js"></script>
        <script src="/static/zikr-toast.js"></script>
        <script src="/static/nav-component.js"></script>
    </body>
    </html>
  `);
});

app.get('/matches/:id', (c) => {
  const matchId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>⚽ تفاصيل المباراة</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>${sharedStyles}</style>
    </head>
    <body>
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <a href="/" class="flex items-center gap-3 group">
                            <i class="fas fa-futbol text-4xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
                            <h1 class="text-3xl font-black gradient-text" data-i18n="siteTitle">Koorax</h1>
                        </a>
                    </div>
                    <div class="flex gap-3">
                        <a href="/matches" class="nav-link glass-card flex items-center gap-2">
                            <i class="fas fa-calendar-alt"></i>
                            <span data-i18n="matches">المباريات</span>
                        </a>
                        <a href="/competitions" class="nav-link glass-card flex items-center gap-2">
                            <i class="fas fa-trophy"></i>
                            <span data-i18n="competitions">البطولات</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <div class="mb-6">
                <a href="/matches" class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
                    <i class="fas fa-arrow-right"></i>
                    <span>العودة للمباريات</span>
                </a>
            </div>

            <div id="match-details" class="animate-fade-in">
                <div class="skeleton h-96"></div>
            </div>
        </div>

        <script>
          const matchId = ${matchId};

          function getStatusBadge(status) {
            if (status === 'IN_PLAY' || status === 'PAUSED') {
              return '<span class="status-badge status-live">مباشر <i class="fas fa-circle text-xs ml-1 animate-pulse"></i></span>';
            } else if (status === 'FINISHED') {
              return '<span class="status-badge status-finished">انتهت</span>';
            } else {
              return '<span class="status-badge status-scheduled">لم تبدأ</span>';
            }
          }

          function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }

          async function loadMatchDetails() {
            try {
              const response = await axios.get(\`/api/matches/\${matchId}\`);
              const match = response.data;
              const container = document.getElementById('match-details');

              const homeTeam = match.homeTeam;
              const awayTeam = match.awayTeam;
              const score = match.score;

              container.innerHTML = \`
                <div class="glass-card p-8 rounded-3xl mb-8">
                  <div class="flex justify-between items-start mb-8">
                    <div class="competition-badge text-lg">
                      <i class="fas fa-trophy"></i>
                      <span>\${match.competition.name}</span>
                    </div>
                    \${getStatusBadge(match.status)}
                  </div>

                  <div class="grid md:grid-cols-3 gap-8 items-center mb-8">
                    <!-- Home Team -->
                    <div class="text-center">
                      <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                        \${homeTeam.crest ? \`<img src="\${homeTeam.crest}" alt="\${homeTeam.name}" class="w-full h-full object-contain filter drop-shadow-2xl">\` : '<i class="fas fa-shield-alt text-8xl text-gray-500"></i>'}
                      </div>
                      <h2 class="text-3xl font-black mb-2">\${homeTeam.name}</h2>
                      <p class="text-gray-400">\${homeTeam.shortName}</p>
                    </div>

                    <!-- Score -->
                    <div class="text-center">
                      <div class="text-8xl font-black mb-4" style="background: linear-gradient(135deg, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        \${score.fullTime.home !== null ? score.fullTime.home : '-'}
                        <span class="text-gray-500 text-5xl mx-4">:</span>
                        \${score.fullTime.away !== null ? score.fullTime.away : '-'}
                      </div>
                      \${score.halfTime.home !== null ? \`
                        <p class="text-gray-400 text-xl mb-2">
                          الشوط الأول: \${score.halfTime.home} - \${score.halfTime.away}
                        </p>
                      \` : ''}
                    </div>

                    <!-- Away Team -->
                    <div class="text-center">
                      <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                        \${awayTeam.crest ? \`<img src="\${awayTeam.crest}" alt="\${awayTeam.name}" class="w-full h-full object-contain filter drop-shadow-2xl">\` : '<i class="fas fa-shield-alt text-8xl text-gray-500"></i>'}
                      </div>
                      <h2 class="text-3xl font-black mb-2">\${awayTeam.name}</h2>
                      <p class="text-gray-400">\${awayTeam.shortName}</p>
                    </div>
                  </div>

                  <div class="border-t border-gray-700 pt-6">
                    <div class="flex items-center justify-center gap-3 text-gray-400">
                      <i class="far fa-calendar-alt text-xl"></i>
                      <span class="text-lg">\${formatDate(match.utcDate)}</span>
                    </div>
                  </div>
                </div>

                <!-- Match Info -->
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="glass-card p-6 rounded-2xl">
                    <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
                      <i class="fas fa-info-circle text-blue-400"></i>
                      معلومات المباراة
                    </h3>
                    <div class="space-y-3">
                      <div class="flex justify-between items-center py-2 border-b border-gray-700">
                        <span class="text-gray-400">الحالة</span>
                        <span class="font-bold">\${match.status === 'FINISHED' ? 'انتهت' : match.status === 'IN_PLAY' ? 'مباشر' : 'قادمة'}</span>
                      </div>
                      <div class="flex justify-between items-center py-2 border-b border-gray-700">
                        <span class="text-gray-400">الجولة</span>
                        <span class="font-bold">\${match.matchday || '-'}</span>
                      </div>
                      <div class="flex justify-between items-center py-2 border-b border-gray-700">
                        <span class="text-gray-400">المرحلة</span>
                        <span class="font-bold">\${match.stage || '-'}</span>
                      </div>
                      \${match.venue ? \`
                        <div class="flex justify-between items-center py-2 border-b border-gray-700">
                          <span class="text-gray-400">الملعب</span>
                          <span class="font-bold">\${match.venue}</span>
                        </div>
                      \` : ''}
                      \${match.referee && match.referee.name ? \`
                        <div class="flex justify-between items-center py-2">
                          <span class="text-gray-400">الحكم</span>
                          <span class="font-bold">\${match.referee.name}</span>
                        </div>
                      \` : ''}
                    </div>
                  </div>

                  <div class="glass-card p-6 rounded-2xl">
                    <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
                      <i class="fas fa-chart-bar text-green-400"></i>
                      الإحصائيات
                    </h3>
                    <div class="space-y-3">
                      \${score.fullTime.home !== null ? \`
                        <div class="py-2 border-b border-gray-700">
                          <p class="text-gray-400 mb-2">نتيجة الوقت الأصلي</p>
                          <p class="text-2xl font-bold">\${score.fullTime.home} - \${score.fullTime.away}</p>
                        </div>
                      \` : ''}
                      \${score.halfTime.home !== null ? \`
                        <div class="py-2 border-b border-gray-700">
                          <p class="text-gray-400 mb-2">نتيجة الشوط الأول</p>
                          <p class="text-2xl font-bold">\${score.halfTime.home} - \${score.halfTime.away}</p>
                        </div>
                      \` : ''}
                      \${match.lastUpdated ? \`
                        <div class="py-2">
                          <p class="text-gray-400 mb-2">آخر تحديث</p>
                          <p class="text-sm">\${new Date(match.lastUpdated).toLocaleString('ar-EG')}</p>
                        </div>
                      \` : ''}
                    </div>
                  </div>
                </div>
              \`;
              
              // Add tabs for lineup, events, and stats
              container.innerHTML += \`
                <div class="glass-card p-6 rounded-2xl">
                  <!-- Tabs -->
                  <div class="flex gap-4 mb-6 border-b border-gray-700 overflow-x-auto">
                    <button class="tab-btn active" data-tab="events">
                      <i class="fas fa-clock"></i>
                      <span>أحداث المباراة</span>
                    </button>
                    <button class="tab-btn" data-tab="lineup">
                      <i class="fas fa-users"></i>
                      <span>التشكيلة</span>
                    </button>
                    <button class="tab-btn" data-tab="stats">
                      <i class="fas fa-chart-bar"></i>
                      <span>الإحصائيات</span>
                    </button>
                  </div>
                  
                  <!-- Tab Content -->
                  <div id="tab-content">
                    <div id="events-tab" class="tab-content active">
                      ${window.matchDetailsDisplay ? window.matchDetailsDisplay.displayEvents(match) : '<p class="text-gray-400 text-center py-8">جاري التحميل...</p>'}
                    </div>
                    <div id="lineup-tab" class="tab-content hidden">
                      ${window.matchDetailsDisplay ? window.matchDetailsDisplay.displayLineup(match) : '<p class="text-gray-400 text-center py-8">جاري التحميل...</p>'}
                    </div>
                    <div id="stats-tab" class="tab-content hidden">
                      ${window.matchDetailsDisplay ? window.matchDetailsDisplay.displayStatistics(match) : '<p class="text-gray-400 text-center py-8">جاري التحميل...</p>'}
                    </div>
                  </div>
                </div>
              \`;
              
              // Setup tab switching
              const tabButtons = document.querySelectorAll('.tab-btn');
              tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                  const tabName = btn.dataset.tab;
                  
                  // Update active button
                  tabButtons.forEach(b => b.classList.remove('active'));
                  btn.classList.add('active');
                  
                  // Show/hide content
                  document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                  });
                  document.getElementById(tabName + '-tab').classList.remove('hidden');
                });
              });
            } catch (error) {
              console.error('Error loading match details:', error);
              document.getElementById('match-details').innerHTML = \`
                <div class="glass-card p-8 rounded-2xl text-center">
                  <i class="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                  <h3 class="text-2xl font-bold mb-2">حدث خطأ</h3>
                  <p class="text-gray-400">لم نتمكن من تحميل تفاصيل المباراة</p>
                </div>
              \`;
            }
          }

          // Initial load
          loadMatchDetails();
          
          // Auto-refresh every 1 second for live matches
          setInterval(() => {
            loadMatchDetails();
          }, 1000);
        </script>
        
        <style>
          .tab-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border-bottom: 3px solid transparent;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 600;
            transition: all 0.3s;
            cursor: pointer;
            background: none;
            border-radius: 0;
            white-space: nowrap;
          }
          
          .tab-btn:hover {
            color: rgba(255, 255, 255, 0.9);
            background: rgba(16, 185, 129, 0.1);
          }
          
          .tab-btn.active {
            color: #10b981;
            border-bottom-color: #10b981;
          }
          
          .tab-content {
            animation: fadeIn 0.3s;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
        
        <!-- Match Details Display Script -->
        <script src="/static/match-details-display.js"></script>
        
        <!-- Koorax Global System v5 - Enhanced -->
        <link rel="stylesheet" href="/static/enhanced-styles.css">
        <script src="/static/koorax-global.js"></script>
        <script src="/static/zikr-toast.js"></script>
        <script src="/static/nav-component.js"></script>
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
        <title>⚽ البطولات - مباريات كرة القدم</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>${sharedStyles}</style>
    </head>
    <body>
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <a href="/" class="flex items-center gap-3 group">
                            <i class="fas fa-futbol text-4xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
                            <h1 class="text-3xl font-black gradient-text" data-i18n="siteTitle">Koorax</h1>
                        </a>
                    </div>
                    <div class="flex gap-3">
                        <a href="/matches" class="nav-link glass-card flex items-center gap-2">
                            <i class="fas fa-calendar-alt"></i>
                            <span>المباريات</span>
                        </a>
                        <a href="/competitions" class="nav-link glass-card flex items-center gap-2 bg-blue-600">
                            <i class="fas fa-trophy"></i>
                            <span>البطولات</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <div class="mb-10 animate-fade-in text-center">
                <h2 class="text-5xl font-black gradient-text mb-4">البطولات العالمية</h2>
                <p class="text-xl text-gray-300">تابع أهم الدوريات الخمسة الكبرى ودوري أبطال أوروبا</p>
            </div>

            <div id="competitions-container" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="skeleton h-64"></div>
                <div class="skeleton h-64"></div>
                <div class="skeleton h-64"></div>
            </div>
        </div>

        <script>
          async function loadCompetitions() {
            try {
              const response = await axios.get('/api/competitions');
              const competitions = response.data.competitions;
              const container = document.getElementById('competitions-container');
              
              if (competitions.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center glass-card p-8 rounded-2xl text-gray-400">لا توجد بطولات متاحة</div>';
                return;
              }

              container.innerHTML = competitions.map(comp => \`
                <a href="/competitions/\${comp.id}" class="glass-card match-card p-8 rounded-2xl block group">
                  <div class="flex flex-col items-center mb-6">
                    <div class="w-24 h-24 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      \${comp.emblem ? \`<img src="\${comp.emblem}" alt="\${comp.name}" class="w-full h-full object-contain filter drop-shadow-2xl">\` : '<i class="fas fa-trophy text-7xl text-yellow-400"></i>'}
                    </div>
                    <h3 class="font-black text-2xl mb-2 text-center">\${comp.name}</h3>
                    <p class="text-gray-400 flex items-center gap-2">
                      <i class="fas fa-map-marker-alt text-sm"></i>
                      \${comp.area.name}
                    </p>
                  </div>
                  
                  <div class="border-t border-gray-700 pt-4">
                    <button class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                      <span>عرض التفاصيل</span>
                      <i class="fas fa-arrow-left"></i>
                    </button>
                  </div>
                </a>
              \`).join('');
            } catch (error) {
              console.error('Error loading competitions:', error);
              document.getElementById('competitions-container').innerHTML = '<div class="col-span-full text-center text-red-400 glass-card p-8 rounded-2xl">حدث خطأ في تحميل البطولات</div>';
            }
          }

          loadCompetitions();
        </script>
        
        <!-- Koorax Global System v5 - Enhanced -->
        <link rel="stylesheet" href="/static/enhanced-styles.css">
        <script src="/static/koorax-global.js"></script>
        <script src="/static/zikr-toast.js"></script>
        <script src="/static/nav-component.js"></script>
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
        <title>⚽ تفاصيل البطولة</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>${sharedStyles}
          .tab-button {
            padding: 16px 32px;
            border-bottom: 3px solid transparent;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            font-weight: 700;
          }
          
          .tab-button.active {
            border-bottom-color: #3b82f6;
            background: rgba(59, 130, 246, 0.15);
          }
          
          .tab-button:hover {
            background: rgba(59, 130, 246, 0.08);
          }
          
          .table-row {
            transition: all 0.3s;
          }
          
          .table-row:hover {
            background: rgba(59, 130, 246, 0.1);
            transform: translateX(-4px);
          }
        </style>
    </head>
    <body>
        <nav class="glass-card sticky top-0 z-50 mb-8">
            <div class="container mx-auto px-4 py-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <a href="/" class="flex items-center gap-3 group">
                            <i class="fas fa-futbol text-4xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
                            <h1 class="text-3xl font-black gradient-text" data-i18n="siteTitle">Koorax</h1>
                        </a>
                    </div>
                    <div class="flex gap-3">
                        <a href="/matches" class="nav-link glass-card flex items-center gap-2">
                            <i class="fas fa-calendar-alt"></i>
                            <span>المباريات</span>
                        </a>
                        <a href="/competitions" class="nav-link glass-card flex items-center gap-2 bg-blue-600">
                            <i class="fas fa-trophy"></i>
                            <span>البطولات</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container mx-auto px-4 py-8">
            <div class="mb-6">
                <a href="/competitions" class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
                    <i class="fas fa-arrow-right"></i>
                    <span>العودة للبطولات</span>
                </a>
            </div>

            <div class="glass-card rounded-2xl p-8 mb-8 animate-fade-in">
                <div class="flex gap-6 border-b border-gray-700">
                    <button class="tab-button active" onclick="switchTab('standings', this)">
                        <i class="fas fa-list-ol ml-2"></i>
                        الترتيب
                    </button>
                    <button class="tab-button" onclick="switchTab('scorers', this)">
                        <i class="fas fa-futbol ml-2"></i>
                        الهدافون
                    </button>
                </div>

                <div id="standings-tab" class="tab-content mt-8">
                    <div class="space-y-2">
                        <div class="skeleton h-16"></div>
                        <div class="skeleton h-16"></div>
                        <div class="skeleton h-16"></div>
                    </div>
                </div>

                <div id="scorers-tab" class="tab-content mt-8 hidden">
                    <div class="space-y-2">
                        <div class="skeleton h-16"></div>
                        <div class="skeleton h-16"></div>
                        <div class="skeleton h-16"></div>
                    </div>
                </div>
            </div>
        </div>

        <script>
          const competitionId = ${competitionId};

          function switchTab(tabName, button) {
            document.querySelectorAll('.tab-content').forEach(tab => {
              tab.classList.add('hidden');
            });
            
            document.querySelectorAll('.tab-button').forEach(btn => {
              btn.classList.remove('active');
            });
            
            document.getElementById(tabName + '-tab').classList.remove('hidden');
            button.classList.add('active');
          }

          async function loadStandings() {
            try {
              const response = await axios.get(\`/api/competitions/\${competitionId}/standings\`);
              const standings = response.data.standings;
              const container = document.getElementById('standings-tab');
              
              if (!standings || standings.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 py-12 glass-card rounded-2xl"><i class="fas fa-info-circle text-4xl mb-3"></i><p class="text-lg">لا توجد بيانات الترتيب متاحة</p></div>';
                return;
              }

              const tableData = standings[0].table;
              
              container.innerHTML = \`
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-700 text-sm">
                        <th class="text-center py-4 px-3">#</th>
                        <th class="text-right py-4 px-6">الفريق</th>
                        <th class="text-center py-4 px-3">لعب</th>
                        <th class="text-center py-4 px-3">فاز</th>
                        <th class="text-center py-4 px-3">تعادل</th>
                        <th class="text-center py-4 px-3">خسر</th>
                        <th class="text-center py-4 px-3">الأهداف</th>
                        <th class="text-center py-4 px-3 font-bold">النقاط</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${tableData.map(team => \`
                        <tr class="table-row border-b border-gray-800">
                          <td class="text-center py-5 px-3 font-black text-xl text-blue-400">\${team.position}</td>
                          <td class="py-5 px-6">
                            <div class="flex items-center gap-4">
                              <div class="w-10 h-10 flex-shrink-0">
                                \${team.team.crest ? \`<img src="\${team.team.crest}" alt="\${team.team.name}" class="w-full h-full object-contain">\` : '<i class="fas fa-shield-alt text-gray-500 text-2xl"></i>'}
                              </div>
                              <span class="font-bold text-lg">\${team.team.name}</span>
                            </div>
                          </td>
                          <td class="text-center py-5 px-3 text-gray-400">\${team.playedGames}</td>
                          <td class="text-center py-5 px-3 text-green-400 font-bold">\${team.won}</td>
                          <td class="text-center py-5 px-3 text-yellow-400 font-bold">\${team.draw}</td>
                          <td class="text-center py-5 px-3 text-red-400 font-bold">\${team.lost}</td>
                          <td class="text-center py-5 px-3 font-semibold">\${team.goalsFor}:\${team.goalsAgainst}</td>
                          <td class="text-center py-5 px-3 font-black text-2xl text-blue-400">\${team.points}</td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                </div>
              \`;
            } catch (error) {
              console.error('Error loading standings:', error);
              document.getElementById('standings-tab').innerHTML = '<div class="text-center text-red-400 py-12 glass-card rounded-2xl">حدث خطأ في تحميل الترتيب</div>';
            }
          }

          async function loadScorers() {
            try {
              const response = await axios.get(\`/api/competitions/\${competitionId}/scorers\`);
              const scorers = response.data.scorers;
              const container = document.getElementById('scorers-tab');
              
              if (!scorers || scorers.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 py-12 glass-card rounded-2xl"><i class="fas fa-info-circle text-4xl mb-3"></i><p class="text-lg">لا توجد بيانات الهدافين متاحة</p></div>';
                return;
              }

              container.innerHTML = \`
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-700 text-sm">
                        <th class="text-center py-4 px-3">#</th>
                        <th class="text-right py-4 px-6">اللاعب</th>
                        <th class="text-right py-4 px-6">الفريق</th>
                        <th class="text-center py-4 px-3 font-bold">الأهداف</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${scorers.slice(0, 20).map((scorer, index) => \`
                        <tr class="table-row border-b border-gray-800">
                          <td class="text-center py-5 px-3 font-black text-xl text-blue-400">\${index + 1}</td>
                          <td class="py-5 px-6">
                            <div>
                              <div class="font-bold text-lg">\${scorer.player.name}</div>
                              <div class="text-sm text-gray-400">\${scorer.player.nationality || ''}</div>
                            </div>
                          </td>
                          <td class="py-5 px-6">
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 flex-shrink-0">
                                \${scorer.team.crest ? \`<img src="\${scorer.team.crest}" alt="\${scorer.team.name}" class="w-full h-full object-contain">\` : '<i class="fas fa-shield-alt text-gray-500 text-sm"></i>'}
                              </div>
                              <span class="font-semibold">\${scorer.team.name}</span>
                            </div>
                          </td>
                          <td class="text-center py-5 px-3 font-black text-2xl">
                            <span class="inline-flex items-center gap-2 text-blue-400">
                              <i class="fas fa-futbol text-lg"></i>
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
              document.getElementById('scorers-tab').innerHTML = '<div class="text-center text-red-400 py-12 glass-card rounded-2xl">حدث خطأ في تحميل الهدافين</div>';
            }
          }

          loadStandings();
          loadScorers();
        </script>
        
        <!-- Koorax Global System v5 - Enhanced -->
        <link rel="stylesheet" href="/static/enhanced-styles.css">
        <script src="/static/koorax-global.js"></script>
        <script src="/static/zikr-toast.js"></script>
        <script src="/static/nav-component.js"></script>
    </body>
    </html>
  `);
});

export default app;
