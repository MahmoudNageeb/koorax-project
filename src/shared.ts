// Koorax - Shared Styles and Components

export const KOORAX_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Cairo', 'Inter', sans-serif;
  }
  
  /* Dark Theme */
  body.dark {
    background: #0a0e27;
    background-image: 
      radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(239, 68, 68, 0.15) 0px, transparent 50%);
    color: #fff;
  }
  
  /* Light Theme */
  body.light {
    background: #f8fafc;
    background-image: 
      radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%);
    color: #0f172a;
  }
  
  body {
    min-height: 100vh;
    transition: all 0.3s ease;
  }
  
  .glass-card {
    backdrop-filter: blur(20px);
    border: 1px solid;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  body.dark .glass-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  body.light .glass-card {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(15, 23, 42, 0.1);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }
  
  .glass-card:hover {
    transform: translateY(-4px) scale(1.02);
  }
  
  body.dark .glass-card:hover {
    background: rgba(15, 23, 42, 0.75);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  body.light .glass-card:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.15);
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
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%);
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
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  
  .koorax-nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(20px);
  }
  
  body.dark .koorax-nav {
    background: rgba(15, 23, 42, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  body.light .koorax-nav {
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid rgba(15, 23, 42, 0.1);
  }
  
  .nav-link {
    position: relative;
    padding: 10px 20px;
    border-radius: 12px;
    transition: all 0.3s;
    overflow: hidden;
    text-decoration: none;
  }
  
  body.dark .nav-link {
    color: #e2e8f0;
  }
  
  body.light .nav-link {
    color: #334155;
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
  
  .nav-link:hover::before,
  .nav-link.active::before {
    opacity: 1;
  }
  
  .nav-link.active {
    background: rgba(59, 130, 246, 0.3);
  }
  
  .theme-toggle, .lang-toggle {
    padding: 8px 16px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 600;
  }
  
  body.dark .theme-toggle, body.dark .lang-toggle {
    background: rgba(59, 130, 246, 0.2);
    color: #e2e8f0;
  }
  
  body.light .theme-toggle, body.light .lang-toggle {
    background: rgba(59, 130, 246, 0.1);
    color: #334155;
  }
  
  .theme-toggle:hover, .lang-toggle:hover {
    transform: scale(1.05);
    background: rgba(59, 130, 246, 0.3);
  }
  
  .mobile-menu-btn {
    display: none;
    padding: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
  }
  
  body.dark .mobile-menu-btn {
    color: #e2e8f0;
  }
  
  body.light .mobile-menu-btn {
    color: #334155;
  }
  
  @media (max-width: 768px) {
    .mobile-menu-btn {
      display: block;
    }
    
    .desktop-menu {
      display: none;
    }
    
    .mobile-menu {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
    
    .mobile-menu.hidden {
      display: none;
    }
  }
  
  .news-card {
    overflow: hidden;
    position: relative;
  }
  
  .news-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  .news-card:hover img {
    transform: scale(1.1);
  }
  
  .match-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  
  .match-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }
  
  .match-card:hover::before {
    left: 100%;
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
  
  .score-display {
    font-size: 2.5rem;
    font-weight: 900;
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  body.light .score-display {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

export function getNavbar(lang: string, theme: string, currentPath: string = '/'): string {
  const t = lang === 'ar' ? {
    appName: 'كوراكس',
    home: 'الرئيسية',
    matches: 'المباريات',
    competitions: 'البطولات',
    news: 'الأخبار',
    topScorers: 'الهدافون'
  } : {
    appName: 'Koorax',
    home: 'Home',
    matches: 'Matches',
    competitions: 'Competitions',
    news: 'News',
    topScorers: 'Top Scorers'
  };
  
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const isAr = lang === 'ar';
  
  return `
    <nav class="koorax-nav">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <a href="/" class="flex items-center gap-3 group">
              <i class="fas fa-futbol text-4xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
              <h1 class="text-3xl font-black gradient-text">${t.appName}</h1>
            </a>
          </div>
          
          <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
            <i class="fas fa-bars"></i>
          </button>
          
          <div class="desktop-menu flex items-center gap-3">
            <a href="/" class="nav-link ${currentPath === '/' ? 'active' : ''}">
              <i class="fas fa-home ${isAr ? 'ml-2' : 'mr-2'}"></i>
              ${t.home}
            </a>
            <a href="/matches" class="nav-link ${currentPath === '/matches' ? 'active' : ''}">
              <i class="fas fa-calendar-alt ${isAr ? 'ml-2' : 'mr-2'}"></i>
              ${t.matches}
            </a>
            <a href="/competitions" class="nav-link ${currentPath === '/competitions' ? 'active' : ''}">
              <i class="fas fa-trophy ${isAr ? 'ml-2' : 'mr-2'}"></i>
              ${t.competitions}
            </a>
            <a href="/news" class="nav-link ${currentPath === '/news' ? 'active' : ''}">
              <i class="fas fa-newspaper ${isAr ? 'ml-2' : 'mr-2'}"></i>
              ${t.news}
            </a>
            <a href="/top-scorers" class="nav-link ${currentPath === '/top-scorers' ? 'active' : ''}">
              <i class="fas fa-star ${isAr ? 'ml-2' : 'mr-2'}"></i>
              ${t.topScorers}
            </a>
            
            <button class="theme-toggle" onclick="toggleTheme()">
              <i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>
            </button>
            
            <button class="lang-toggle" onclick="toggleLanguage()">
              ${lang === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
        
        <div class="mobile-menu hidden mt-4">
          <a href="/" class="nav-link ${currentPath === '/' ? 'active' : ''}">
            <i class="fas fa-home ${isAr ? 'ml-2' : 'mr-2'}"></i>
            ${t.home}
          </a>
          <a href="/matches" class="nav-link ${currentPath === '/matches' ? 'active' : ''}">
            <i class="fas fa-calendar-alt ${isAr ? 'ml-2' : 'mr-2'}"></i>
            ${t.matches}
          </a>
          <a href="/competitions" class="nav-link ${currentPath === '/competitions' ? 'active' : ''}">
            <i class="fas fa-trophy ${isAr ? 'ml-2' : 'mr-2'}"></i>
            ${t.competitions}
          </a>
          <a href="/news" class="nav-link ${currentPath === '/news' ? 'active' : ''}">
            <i class="fas fa-newspaper ${isAr ? 'ml-2' : 'mr-2'}"></i>
            ${t.news}
          </a>
          <a href="/top-scorers" class="nav-link ${currentPath === '/top-scorers' ? 'active' : ''}">
            <i class="fas fa-star ${isAr ? 'ml-2' : 'mr-2'}"></i>
            ${t.topScorers}
          </a>
          
          <div class="flex gap-3 mt-4">
            <button class="theme-toggle flex-1" onclick="toggleTheme()">
              <i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'} ${isAr ? 'ml-2' : 'mr-2'}"></i>
              ${theme === 'dark' ? (isAr ? 'وضع فاتح' : 'Light') : (isAr ? 'وضع داكن' : 'Dark')}
            </button>
            
            <button class="lang-toggle flex-1" onclick="toggleLanguage()">
              <i class="fas fa-language ${isAr ? 'ml-2' : 'mr-2'}"></i>
              ${lang === 'ar' ? 'English' : 'عربي'}
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <script>
      // Get initial theme and language from localStorage or default
      let currentTheme = localStorage.getItem('koorax_theme') || 'dark';
      let currentLang = localStorage.getItem('koorax_language') || 'ar';
      
      // Apply theme on load
      document.body.className = currentTheme;
      document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', currentLang);
      
      function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.className = currentTheme;
        localStorage.setItem('koorax_theme', currentTheme);
        location.reload();
      }
      
      function toggleLanguage() {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('koorax_language', currentLang);
        document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', currentLang);
        location.reload();
      }
      
      function toggleMobileMenu() {
        const menu = document.querySelector('.mobile-menu');
        menu.classList.toggle('hidden');
      }
    </script>
  `;
}
