/**
 * Koorax Global Features - Complete Translation System
 * - Dark Mode Toggle
 * - Full Language Toggle (Arabic/English) with complete page translation
 * - Prayer Notification on Homepage
 */

// Prayer notification messages
const PRAYER_MESSAGES = {
  ar: [
    'اللهم صل وسلم وبارك على سيدنا محمد ❤️',
    'صلى الله عليه وسلم 🤲',
    'اللهم صل على محمد وعلى آل محمد 🌙',
    'عليه أفضل الصلاة والسلام ✨',
    'صلوا على النبي المختار 💚'
  ],
  en: [
    'Peace and blessings upon Prophet Muhammad ❤️',
    'May Allah bless our Prophet 🤲',
    'Blessings upon Muhammad 🌙',
    'Peace be upon him ✨',
    'Pray for the Prophet 💚'
  ]
};

// Complete translations object
const TRANSLATIONS = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    matches: 'المباريات',
    competitions: 'البطولات',
    standings: 'الترتيب',
    scorers: 'الهدافون',
    teams: 'الفرق',
    
    // Match status
    live: 'مباشر',
    finished: 'انتهت',
    scheduled: 'لم تبدأ',
    postponed: 'مؤجلة',
    
    // Time
    today: 'اليوم',
    tomorrow: 'غداً',
    yesterday: 'أمس',
    
    // Match filters
    allMatches: 'جميع المباريات',
    liveMatches: 'مباريات مباشرة الآن',
    finishedMatches: 'المباريات المنتهية',
    upcomingMatches: 'المباريات القادمة',
    importantMatches: 'أهم المباريات',
    
    // Match details
    matchDetails: 'تفاصيل المباراة',
    events: 'الأحداث',
    lineup: 'التشكيلة',
    statistics: 'الإحصائيات',
    venue: 'الملعب',
    referee: 'الحكم',
    attendance: 'الحضور',
    
    // Events
    goal: 'هدف',
    ownGoal: 'هدف في مرماه',
    penalty: 'ركلة جزاء',
    yellowCard: 'إنذار',
    redCard: 'طرد',
    substitution: 'تبديل',
    assist: 'صناعة',
    halfTime: 'الشوط الأول',
    matchInfo: 'معلومات المباراة',
    selectDate: 'اختر اليوم',
    bench: 'البدلاء',
    unknown: 'غير معروف',
    cards: 'البطاقات',
    
    // Table
    table: 'الجدول',
    position: 'المركز',
    team: 'الفريق',
    played: 'لعب',
    won: 'فاز',
    draw: 'تعادل',
    lost: 'خسر',
    goalsFor: 'له',
    goalsAgainst: 'عليه',
    goalDifference: 'الفارق',
    points: 'النقاط',
    
    // Top scorers
    topScorers: 'الهدافون',
    player: 'اللاعب',
    goals: 'الأهداف',
    assists: 'التمريرات الحاسمة',
    
    // Messages
    noMatches: 'لا توجد مباريات',
    noData: 'لا توجد بيانات',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    loadMore: 'تحميل المزيد',
    viewAll: 'عرض الكل',
    backToCompetitions: 'العودة للبطولات',
    backToMatches: 'العودة للمباريات',
    
    // Filters
    filterByCompetition: 'تصفية حسب البطولة',
    filterByStatus: 'تصفية حسب الحالة',
    all: 'الكل',
    
    // Settings
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    arabic: 'عربي',
    english: 'English'
  },
  en: {
    // Navigation
    home: 'Home',
    matches: 'Matches',
    competitions: 'Competitions',
    standings: 'Standings',
    scorers: 'Top Scorers',
    teams: 'Teams',
    
    // Match status
    live: 'Live',
    finished: 'Finished',
    scheduled: 'Scheduled',
    postponed: 'Postponed',
    
    // Time
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    
    // Match filters
    allMatches: 'All Matches',
    liveMatches: 'Live Matches Now',
    finishedMatches: 'Finished Matches',
    upcomingMatches: 'Upcoming Matches',
    importantMatches: 'Important Matches',
    
    // Match details
    matchDetails: 'Match Details',
    events: 'Events',
    lineup: 'Lineup',
    statistics: 'Statistics',
    venue: 'Venue',
    referee: 'Referee',
    attendance: 'Attendance',
    
    // Events
    goal: 'Goal',
    ownGoal: 'Own Goal',
    penalty: 'Penalty',
    yellowCard: 'Yellow Card',
    redCard: 'Red Card',
    substitution: 'Substitution',
    assist: 'Assist',
    halfTime: 'Half Time',
    matchInfo: 'Match Info',
    selectDate: 'Select Date',
    bench: 'Substitutes',
    unknown: 'Unknown',
    cards: 'Cards',
    
    // Table
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
    
    // Top scorers
    topScorers: 'Top Scorers',
    player: 'Player',
    goals: 'Goals',
    assists: 'Assists',
    
    // Messages
    noMatches: 'No matches available',
    noData: 'No data available',
    loading: 'Loading...',
    error: 'An error occurred',
    loadMore: 'Load More',
    viewAll: 'View All',
    backToCompetitions: 'Back to Competitions',
    backToMatches: 'Back to Matches',
    
    // Filters
    filterByCompetition: 'Filter by Competition',
    filterByStatus: 'Filter by Status',
    all: 'All',
    
    // Settings
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    arabic: 'عربي',
    english: 'English'
  }
};

// Get current language
function getCurrentLang() {
  return localStorage.getItem('koorax-lang') || 'ar';
}

// Get translation
function t(key) {
  const lang = getCurrentLang();
  return TRANSLATIONS[lang][key] || key;
}

// Apply translations to page
function applyTranslations() {
  const lang = getCurrentLang();
  
  // Update all elements with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    el.textContent = TRANSLATIONS[lang][key] || key;
  });
  
  // Update placeholders
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    el.placeholder = TRANSLATIONS[lang][key] || key;
  });
}

// Initialize app settings from localStorage or defaults
function initializeSettings() {
  // Get saved settings
  const savedTheme = localStorage.getItem('koorax-theme') || 'dark';
  const savedLang = localStorage.getItem('koorax-lang') || 'ar';
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', savedLang);
  
  // Update theme icon
  const themeIcon = document.querySelector('#theme-toggle-icon');
  if (themeIcon) {
    themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  // Update language button text
  const langBtn = document.querySelector('#lang-toggle-text');
  if (langBtn) {
    langBtn.textContent = savedLang === 'ar' ? 'EN' : 'AR';
  }
  
  // Apply translations
  applyTranslations();
  
  return { theme: savedTheme, lang: savedLang };
}

// Toggle dark mode
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('koorax-theme', newTheme);
  
  // Update icon
  const icon = document.querySelector('#theme-toggle-icon');
  if (icon) {
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newTheme } }));
}

// Toggle language with full page translation (NO RELOAD)
function toggleLanguage() {
  const currentLang = document.documentElement.getAttribute('lang');
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  document.documentElement.setAttribute('lang', newLang);
  document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem('koorax-lang', newLang);
  
  // Update language button
  const langBtn = document.querySelector('#lang-toggle-text');
  if (langBtn) {
    langBtn.textContent = newLang === 'ar' ? 'EN' : 'AR';
  }
  
  // Apply translations without reload
  applyTranslations();
  
  // Dispatch event for dynamic content
  window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
}

// Show prayer notification with beautiful animation
function showPrayerNotification() {
  const lang = getCurrentLang();
  const messages = PRAYER_MESSAGES[lang];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'prayer-notification';
  notification.innerHTML = `
    <div class="prayer-content">
      <i class="fas fa-mosque prayer-icon"></i>
      <span class="prayer-text">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="prayer-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto remove after 7 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 500);
  }, 7000);
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    
    // Show prayer notification only on homepage
    if (window.location.pathname === '/') {
      setTimeout(showPrayerNotification, 1000);
    }
  });
} else {
  initializeSettings();
  
  if (window.location.pathname === '/') {
    setTimeout(showPrayerNotification, 1000);
  }
}

// Export functions for global use
window.kooraxToggleDarkMode = toggleDarkMode;
window.kooraxToggleLanguage = toggleLanguage;
window.kooraxShowPrayer = showPrayerNotification;
window.kooraxGetLang = getCurrentLang;
window.kooraxT = t;
window.kooraxApplyTranslations = applyTranslations;
