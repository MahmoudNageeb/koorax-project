/**
 * Enhanced Navigation Component for Koorax
 * شريط تنقل محسّن مع قائمة همبرجر وبحث سريع
 */

function createEnhancedNav(currentPage = 'home') {
  return `
    <nav class="nav-enhanced glass-card sticky top-0 z-50" id="main-nav">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <a href="/" class="flex items-center gap-3 group">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300 group-hover:rotate-12">
                <i class="fas fa-futbol text-white text-xl"></i>
              </div>
              <h1 class="text-2xl md:text-3xl font-black gradient-text hidden sm:block" data-i18n="siteTitle">Koorax</h1>
            </a>
          </div>

          <!-- Desktop Navigation Links -->
          <div class="hidden lg:flex items-center gap-2">
            <a href="/" class="nav-link-enhanced ${currentPage === 'home' ? 'active' : ''}" data-page="home">
              <i class="fas fa-home"></i>
              <span data-i18n="home">الرئيسية</span>
            </a>
            <a href="/matches" class="nav-link-enhanced ${currentPage === 'matches' ? 'active' : ''}" data-page="matches">
              <i class="fas fa-calendar-alt"></i>
              <span data-i18n="matches">المباريات</span>
            </a>
            <a href="/competitions" class="nav-link-enhanced ${currentPage === 'competitions' ? 'active' : ''}" data-page="competitions">
              <i class="fas fa-trophy"></i>
              <span data-i18n="competitions">البطولات</span>
            </a>
            <a href="#" class="nav-link-enhanced" data-page="standings" onclick="alert('قريباً!'); return false;">
              <i class="fas fa-list-ol"></i>
              <span data-i18n="standings">الترتيب</span>
            </a>
            <a href="#" class="nav-link-enhanced" data-page="topScorers" onclick="alert('قريباً!'); return false;">
              <i class="fas fa-futbol"></i>
              <span data-i18n="topScorers">الهدافون</span>
            </a>
          </div>

          <!-- Search Box (Desktop & Tablet) -->
          <div class="search-box hidden md:flex">
            <input 
              type="text" 
              data-i18n-placeholder="searchPlaceholder"
              placeholder="ابحث عن فريق..." 
              id="team-search"
              autocomplete="off"
            />
            <i class="fas fa-search"></i>
          </div>

          <!-- Controls & Hamburger -->
          <div class="flex items-center gap-3">
            <!-- Language Toggle -->
            <button id="lang-toggle-nav" class="control-btn glass-card" title="Toggle Language">
              <i class="fas fa-language"></i>
              <span class="control-text hidden sm:inline">${window.KooraxGlobal?.language === 'ar' ? 'EN' : 'ع'}</span>
            </button>
            
            <!-- Theme Toggle -->
            <button id="theme-toggle-nav" class="control-btn glass-card" title="Toggle Theme">
              <i class="fas fa-${window.KooraxGlobal?.theme === 'dark' ? 'sun' : 'moon'}"></i>
            </button>

            <!-- Hamburger Menu (Mobile) -->
            <button class="hamburger lg:hidden" id="hamburger-menu" aria-label="Menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div class="nav-menu" id="mobile-menu">
          <div class="flex flex-col gap-2">
            <a href="/" class="nav-link-enhanced-mobile ${currentPage === 'home' ? 'active' : ''}">
              <i class="fas fa-home"></i>
              <span data-i18n="home">الرئيسية</span>
            </a>
            <a href="/matches" class="nav-link-enhanced-mobile ${currentPage === 'matches' ? 'active' : ''}">
              <i class="fas fa-calendar-alt"></i>
              <span data-i18n="matches">المباريات</span>
            </a>
            <a href="/competitions" class="nav-link-enhanced-mobile ${currentPage === 'competitions' ? 'active' : ''}">
              <i class="fas fa-trophy"></i>
              <span data-i18n="competitions">البطولات</span>
            </a>
            <a href="#" class="nav-link-enhanced-mobile" onclick="alert('قريباً!'); return false;">
              <i class="fas fa-list-ol"></i>
              <span data-i18n="standings">الترتيب</span>
            </a>
            <a href="#" class="nav-link-enhanced-mobile" onclick="alert('قريباً!'); return false;">
              <i class="fas fa-futbol"></i>
              <span data-i18n="topScorers">الهدافون</span>
            </a>
            
            <!-- Search in Mobile Menu -->
            <div class="search-box-mobile mt-4">
              <input 
                type="text" 
                data-i18n-placeholder="searchPlaceholder"
                placeholder="ابحث عن فريق..." 
                id="team-search-mobile"
                autocomplete="off"
              />
              <i class="fas fa-search"></i>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

// Initialize navigation after DOM loaded
function initializeNav() {
  // Toggle hamburger menu
  const hamburger = document.getElementById('hamburger-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });

    // Close menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      });
    });
  }

  // Language toggle
  const langToggle = document.getElementById('lang-toggle-nav');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      window.toggleLanguage();
      const text = langToggle.querySelector('.control-text');
      if (text) {
        text.textContent = window.KooraxGlobal.language === 'ar' ? 'EN' : 'ع';
      }
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle-nav');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      window.toggleTheme();
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = `fas fa-${window.KooraxGlobal.theme === 'dark' ? 'sun' : 'moon'}`;
      }
    });
  }

  // Team search functionality (placeholder)
  const searchInputs = [document.getElementById('team-search'), document.getElementById('team-search-mobile')];
  searchInputs.forEach(input => {
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = input.value.trim();
          if (query) {
            alert(`البحث عن: ${query}\n\n(ميزة البحث قيد التطوير)`);
            input.value = '';
          }
        }
      });
    }
  });
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNav);
} else {
  initializeNav();
}

// Export for use
window.createEnhancedNav = createEnhancedNav;
