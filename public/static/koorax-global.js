/**
 * Koorax Global System - v4.0
 * نظام عالمي للترجمة والثيم والحالة
 * يعمل على كامل الموقع بدون إعادة تحميل
 */

// ========== GLOBAL STATE ==========
window.KooraxGlobal = window.KooraxGlobal || {
  language: localStorage.getItem('koorax_language') || 'ar',
  theme: localStorage.getItem('koorax_theme') || 'dark',
  listeners: []
};

// ========== الترجمات الشاملة ==========
const TRANSLATIONS = {
  ar: {
    // Navigation
    siteTitle: 'Koorax',
    siteTitleFull: 'Koorax - مباريات كرة القدم',
    home: 'الرئيسية',
    matches: 'المباريات',
    competitions: 'البطولات',
    news: 'الأخبار',
    
    // Match Status
    live: 'مباشر',
    finished: 'انتهت',
    upcoming: 'قادمة',
    scheduled: 'لم تبدأ',
    postponed: 'مؤجلة',
    cancelled: 'ملغاة',
    suspended: 'متوقفة',
    
    // Match Details
    matchDetails: 'تفاصيل المباراة',
    venue: 'الملعب',
    referee: 'الحكم',
    attendance: 'الحضور',
    date: 'التاريخ',
    time: 'الوقت',
    competition: 'البطولة',
    season: 'الموسم',
    matchday: 'الجولة',
    stage: 'المرحلة',
    
    // Score
    score: 'النتيجة',
    fullTime: 'الوقت الأصلي',
    halfTime: 'الشوط الأول',
    extraTime: 'الوقت الإضافي',
    penalties: 'ركلات الترجيح',
    
    // Events
    events: 'أحداث المباراة',
    goals: 'الأهداف',
    cards: 'البطاقات',
    substitutions: 'التبديلات',
    yellowCard: 'بطاقة صفراء',
    redCard: 'بطاقة حمراء',
    goal: 'هدف',
    ownGoal: 'هدف عكسي',
    penalty: 'ضربة جزاء',
    minute: 'الدقيقة',
    
    // Lineup
    lineup: 'التشكيل',
    formation: 'الخطة',
    coach: 'المدرب',
    bench: 'الاحتياط',
    startingXI: 'التشكيل الأساسي',
    
    // Statistics
    statistics: 'الإحصائيات',
    possession: 'الاستحواذ',
    shots: 'التسديدات',
    shotsOnTarget: 'التسديدات على المرمى',
    shotsOffTarget: 'التسديدات خارج المرمى',
    corners: 'الركنيات',
    fouls: 'الأخطاء',
    offsides: 'التسلل',
    passes: 'التمريرات',
    passAccuracy: 'دقة التمرير',
    
    // Standings
    standings: 'الترتيب',
    position: 'المركز',
    team: 'الفريق',
    played: 'لعب',
    won: 'فاز',
    drawn: 'تعادل',
    lost: 'خسر',
    goalsFor: 'له',
    goalsAgainst: 'عليه',
    goalDifference: 'الفرق',
    points: 'النقاط',
    
    // Top Scorers
    topScorers: 'الهدافون',
    player: 'اللاعب',
    goals_count: 'الأهداف',
    assists: 'التمريرات الحاسمة',
    
    // Filters
    all: 'الكل',
    today: 'اليوم',
    yesterday: 'أمس',
    tomorrow: 'غداً',
    thisWeek: 'هذا الأسبوع',
    
    // Actions
    viewDetails: 'عرض التفاصيل',
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    error: 'حدث خطأ',
    tryAgain: 'حاول مرة أخرى',
    
    // Theme
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    
    // Language
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    
    // Time
    now: 'الآن',
    min: 'د',
    ft: 'ن.و',
    ht: 'ش.أ',
    et: 'و.إ',
    pen: 'ج',
    
    // Common
    vs: 'ضد',
    at: 'في'
  },
  
  en: {
    // Navigation
    siteTitle: 'Koorax',
    siteTitleFull: 'Koorax - Football Matches',
    home: 'Home',
    matches: 'Matches',
    competitions: 'Competitions',
    news: 'News',
    
    // Match Status
    live: 'Live',
    finished: 'Finished',
    upcoming: 'Upcoming',
    scheduled: 'Scheduled',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
    suspended: 'Suspended',
    
    // Match Details
    matchDetails: 'Match Details',
    venue: 'Venue',
    referee: 'Referee',
    attendance: 'Attendance',
    date: 'Date',
    time: 'Time',
    competition: 'Competition',
    season: 'Season',
    matchday: 'Matchday',
    stage: 'Stage',
    
    // Score
    score: 'Score',
    fullTime: 'Full Time',
    halfTime: 'Half Time',
    extraTime: 'Extra Time',
    penalties: 'Penalties',
    
    // Events
    events: 'Match Events',
    goals: 'Goals',
    cards: 'Cards',
    substitutions: 'Substitutions',
    yellowCard: 'Yellow Card',
    redCard: 'Red Card',
    goal: 'Goal',
    ownGoal: 'Own Goal',
    penalty: 'Penalty',
    minute: 'Minute',
    
    // Lineup
    lineup: 'Lineup',
    formation: 'Formation',
    coach: 'Coach',
    bench: 'Bench',
    startingXI: 'Starting XI',
    
    // Statistics
    statistics: 'Statistics',
    possession: 'Possession',
    shots: 'Shots',
    shotsOnTarget: 'Shots on Target',
    shotsOffTarget: 'Shots off Target',
    corners: 'Corners',
    fouls: 'Fouls',
    offsides: 'Offsides',
    passes: 'Passes',
    passAccuracy: 'Pass Accuracy',
    
    // Standings
    standings: 'Standings',
    position: 'Position',
    team: 'Team',
    played: 'Played',
    won: 'Won',
    drawn: 'Drawn',
    lost: 'Lost',
    goalsFor: 'GF',
    goalsAgainst: 'GA',
    goalDifference: 'GD',
    points: 'Points',
    
    // Top Scorers
    topScorers: 'Top Scorers',
    player: 'Player',
    goals_count: 'Goals',
    assists: 'Assists',
    
    // Filters
    all: 'All',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    
    // Actions
    viewDetails: 'View Details',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    noData: 'No data available',
    error: 'An error occurred',
    tryAgain: 'Try again',
    
    // Theme
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    
    // Language
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    
    // Time
    now: 'Now',
    min: 'min',
    ft: 'FT',
    ht: 'HT',
    et: 'ET',
    pen: 'Pen',
    
    // Common
    vs: 'vs',
    at: 'at'
  }
};

// ========== THEME SYSTEM ==========
const THEME_STYLES = {
  dark: {
    background: '#0a0e27',
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(239, 68, 68, 0.1) 0px, transparent 50%)
    `,
    color: '#ffffff',
    glassBackground: 'rgba(15, 23, 42, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    cardHover: 'rgba(15, 23, 42, 0.75)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    accent: '#3b82f6'
  },
  light: {
    background: '#f8fafc',
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.08) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(249, 115, 22, 0.08) 0px, transparent 50%)
    `,
    color: '#0f172a',
    glassBackground: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    cardHover: 'rgba(255, 255, 255, 0.9)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accent: '#2563eb'
  }
};

// ========== GLOBAL FUNCTIONS ==========

// Translate function - يعمل في أي مكان
window.t = function(key) {
  const lang = window.KooraxGlobal.language;
  return TRANSLATIONS[lang][key] || key;
};

// Set language globally
window.setLanguage = function(lang) {
  if (!TRANSLATIONS[lang]) return;
  
  window.KooraxGlobal.language = lang;
  localStorage.setItem('koorax_language', lang);
  
  // Update HTML attributes
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  
  // Update all translatable elements
  updateTranslations();
  
  // Notify all listeners
  notifyListeners('language', lang);
  
  // Trigger custom event
  window.dispatchEvent(new CustomEvent('koorax:languageChange', { detail: { language: lang } }));
};

// Set theme globally
window.setTheme = function(theme) {
  if (!THEME_STYLES[theme]) return;
  
  window.KooraxGlobal.theme = theme;
  localStorage.setItem('koorax_theme', theme);
  
  // Apply theme styles
  applyThemeStyles(theme);
  
  // Notify all listeners
  notifyListeners('theme', theme);
  
  // Trigger custom event
  window.dispatchEvent(new CustomEvent('koorax:themeChange', { detail: { theme } }));
};

// Toggle language
window.toggleLanguage = function() {
  const newLang = window.KooraxGlobal.language === 'ar' ? 'en' : 'ar';
  window.setLanguage(newLang);
};

// Toggle theme
window.toggleTheme = function() {
  const newTheme = window.KooraxGlobal.theme === 'dark' ? 'light' : 'dark';
  window.setTheme(newTheme);
};

// Subscribe to changes
window.subscribe = function(callback) {
  window.KooraxGlobal.listeners.push(callback);
  return function unsubscribe() {
    const index = window.KooraxGlobal.listeners.indexOf(callback);
    if (index > -1) {
      window.KooraxGlobal.listeners.splice(index, 1);
    }
  };
};

// ========== INTERNAL FUNCTIONS ==========

function updateTranslations() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = window.t(key);
    
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translated;
    } else {
      el.textContent = translated;
    }
  });
  
  // Update title
  document.title = window.t('siteTitleFull');
}

function applyThemeStyles(theme) {
  const styles = THEME_STYLES[theme];
  const body = document.body;
  
  // Apply body styles
  body.style.background = styles.background;
  body.style.backgroundImage = styles.backgroundImage;
  body.style.color = styles.color;
  
  // Update CSS custom properties
  document.documentElement.style.setProperty('--bg-color', styles.background);
  document.documentElement.style.setProperty('--text-primary', styles.textPrimary);
  document.documentElement.style.setProperty('--text-secondary', styles.textSecondary);
  document.documentElement.style.setProperty('--glass-bg', styles.glassBackground);
  document.documentElement.style.setProperty('--glass-border', styles.glassBorder);
  document.documentElement.style.setProperty('--card-hover', styles.cardHover);
  document.documentElement.style.setProperty('--accent', styles.accent);
  
  // Update glass cards
  document.querySelectorAll('.glass-card').forEach(card => {
    card.style.background = styles.glassBackground;
    card.style.borderColor = styles.glassBorder;
  });
  
  // Update data-theme attribute
  document.body.setAttribute('data-theme', theme);
}

function notifyListeners(type, value) {
  window.KooraxGlobal.listeners.forEach(callback => {
    try {
      callback({ type, value });
    } catch (err) {
      console.error('Listener error:', err);
    }
  });
}

// ========== INITIALIZE ==========
function initializeKoorax() {
  // Apply saved language
  const savedLang = localStorage.getItem('koorax_language') || 'ar';
  window.setLanguage(savedLang);
  
  // Apply saved theme
  const savedTheme = localStorage.getItem('koorax_theme') || 'dark';
  window.setTheme(savedTheme);
  
  // Add control buttons if not exists
  addGlobalControls();
  
  console.log('✅ Koorax Global System initialized');
}

function addGlobalControls() {
  // Check if controls already exist
  if (document.querySelector('#koorax-global-controls')) return;
  
  // Find navbar
  const navButtons = document.querySelector('nav .flex.gap-3');
  if (!navButtons) return;
  
  // Create controls container
  const controlsHTML = `
    <button id="lang-toggle-global" class="control-btn glass-card" title="Toggle Language">
      <i class="fas fa-language"></i>
      <span class="control-text">${window.KooraxGlobal.language === 'ar' ? 'EN' : 'ع'}</span>
    </button>
    <button id="theme-toggle-global" class="control-btn glass-card" title="Toggle Theme">
      <i class="fas fa-${window.KooraxGlobal.theme === 'dark' ? 'sun' : 'moon'}"></i>
    </button>
  `;
  
  const container = document.createElement('div');
  container.id = 'koorax-global-controls';
  container.className = 'flex gap-3';
  container.innerHTML = controlsHTML;
  
  navButtons.appendChild(container);
  
  // Attach event listeners
  document.getElementById('lang-toggle-global')?.addEventListener('click', () => {
    window.toggleLanguage();
    const btn = document.getElementById('lang-toggle-global');
    const text = btn?.querySelector('.control-text');
    if (text) text.textContent = window.KooraxGlobal.language === 'ar' ? 'EN' : 'ع';
  });
  
  document.getElementById('theme-toggle-global')?.addEventListener('click', () => {
    window.toggleTheme();
    const btn = document.getElementById('theme-toggle-global');
    const icon = btn?.querySelector('i');
    if (icon) {
      icon.className = `fas fa-${window.KooraxGlobal.theme === 'dark' ? 'sun' : 'moon'}`;
    }
  });
}

// Add necessary styles
function addGlobalStyles() {
  const style = document.createElement('style');
  style.id = 'koorax-global-styles';
  style.textContent = `
    /* Control Buttons */
    .control-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: inherit;
    }
    
    .control-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
    }
    
    .control-btn i {
      font-size: 1.25rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .control-text {
        display: none;
      }
      
      .control-btn {
        padding: 10px 12px;
      }
    }
    
    /* Prevent horizontal scroll */
    html, body {
      overflow-x: hidden;
      max-width: 100vw;
    }
    
    /* Responsive utilities */
    .container {
      width: 100%;
      max-width: 100%;
      padding-left: 1rem;
      padding-right: 1rem;
    }
    
    @media (min-width: 768px) {
      .container {
        max-width: 768px;
      }
    }
    
    @media (min-width: 1024px) {
      .container {
        max-width: 1024px;
      }
    }
    
    @media (min-width: 1280px) {
      .container {
        max-width: 1280px;
      }
    }
  `;
  
  if (!document.getElementById('koorax-global-styles')) {
    document.head.appendChild(style);
  }
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addGlobalStyles();
    initializeKoorax();
  });
} else {
  addGlobalStyles();
  initializeKoorax();
}

// Export for use in other scripts
window.KooraxTranslations = TRANSLATIONS;
