/**
 * Koorax Football Website - Enhanced Features
 * نظام الأذكار العشوائية + اللغة + الثيم
 * بدون أي مكتبات خارجية، محافظ 100% على التصميم الحالي
 */

// ========== التخزين المحلي ==========
const STORAGE_KEYS = {
  LAST_ZIKR: 'lastZikr',
  LANGUAGE: 'selectedLanguage',
  THEME: 'themeMode'
};

// ========== الترجمات ==========
const translations = {
  ar: {
    siteTitle: 'Koorax - مباريات كرة القدم',
    matches: 'المباريات',
    competitions: 'البطولات',
    live: 'مباشر',
    finished: 'انتهت',
    upcoming: 'قادمة',
    closeButton: 'إغلاق',
    standings: 'الترتيب',
    topScorers: 'الهدافون',
    assists: 'صناع الأهداف'
  },
  en: {
    siteTitle: 'Koorax - Football Matches',
    matches: 'Matches',
    competitions: 'Competitions',
    live: 'Live',
    finished: 'Finished',
    upcoming: 'Upcoming',
    closeButton: 'Close',
    standings: 'Standings',
    topScorers: 'Top Scorers',
    assists: 'Assists'
  }
};

// ========== قائمة الأذكار ==========
const azkar = {
  ar: [
    'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
    'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    'سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ',
    'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ',
    'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ',
    'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ',
    'اللَّهُمَّ آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً'
  ],
  en: [
    'Glory be to Allah and praise be to Him',
    'There is no god but Allah alone, with no partner',
    'All praise is due to Allah, Lord of the worlds',
    'O Allah, send peace and blessings upon our Prophet Muhammad',
    'Glory be to Allah the Almighty and praise be to Him',
    'There is no power and no strength except with Allah',
    'O Allah, I ask You for Paradise',
    'Lord, forgive me and my parents',
    'O Allah, I seek refuge in You from the punishment of the grave',
    'O Allah, grant us good in this world and good in the Hereafter'
  ]
};

// ========== دوال المساعدة ==========
class KooraxApp {
  constructor() {
    this.currentLanguage = this.getLanguage();
    this.currentTheme = this.getTheme();
    this.init();
  }

  init() {
    this.applyTheme();
    this.applyLanguage();
    this.initializeControls();
    this.showZikrIfNeeded();
  }

  // ===== إدارة اللغة =====
  getLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'ar';
  }

  setLanguage(lang) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    this.currentLanguage = lang;
  }

  toggleLanguage() {
    const newLang = this.currentLanguage === 'ar' ? 'en' : 'ar';
    this.setLanguage(newLang);
    this.applyLanguage();
  }

  applyLanguage() {
    const html = document.documentElement;
    const isArabic = this.currentLanguage === 'ar';
    
    html.setAttribute('lang', this.currentLanguage);
    html.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    
    // تحديث العنوان
    document.title = translations[this.currentLanguage].siteTitle;
    
    // تحديث النصوص القابلة للترجمة
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[this.currentLanguage][key]) {
        el.textContent = translations[this.currentLanguage][key];
      }
    });
  }

  // ===== إدارة الثيم =====
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  }

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    this.currentTheme = theme;
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    this.applyTheme();
  }

  applyTheme() {
    const body = document.body;
    
    if (this.currentTheme === 'light') {
      body.style.background = '#f8fafc';
      body.style.backgroundImage = `
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(249, 115, 22, 0.1) 0px, transparent 50%)
      `;
      body.style.color = '#0f172a';
    } else {
      body.style.background = '#0a0e27';
      body.style.backgroundImage = `
        radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(239, 68, 68, 0.1) 0px, transparent 50%)
      `;
      body.style.color = '#fff';
    }

    // تحديث الـ glass-cards
    this.updateGlassCards();
  }

  updateGlassCards() {
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
      if (this.currentTheme === 'light') {
        card.style.background = 'rgba(255, 255, 255, 0.7)';
        card.style.borderColor = 'rgba(0, 0, 0, 0.08)';
      } else {
        card.style.background = 'rgba(15, 23, 42, 0.6)';
        card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }
    });
  }

  // ===== نظام الأذكار =====
  getRandomZikr() {
    const lastZikr = localStorage.getItem(STORAGE_KEYS.LAST_ZIKR);
    const zikrList = azkar[this.currentLanguage];
    let selectedZikr;
    
    do {
      selectedZikr = zikrList[Math.floor(Math.random() * zikrList.length)];
    } while (selectedZikr === lastZikr && zikrList.length > 1);
    
    localStorage.setItem(STORAGE_KEYS.LAST_ZIKR, selectedZikr);
    return selectedZikr;
  }

  showZikrIfNeeded() {
    // عرض الذكر مرة واحدة فقط عند أول تحميل للصفحة
    const sessionKey = 'zikrShownThisSession';
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }
    
    sessionStorage.setItem(sessionKey, 'true');
    setTimeout(() => this.showZikrModal(), 500);
  }

  showZikrModal() {
    const zikr = this.getRandomZikr();
    const closeText = translations[this.currentLanguage].closeButton;
    
    // إنشاء المودال بنفس تصميم الموقع
    const modal = document.createElement('div');
    modal.id = 'zikr-modal';
    modal.innerHTML = `
      <div class="zikr-backdrop" onclick="document.getElementById('zikr-modal').remove()"></div>
      <div class="zikr-content glass-card">
        <div class="zikr-icon">
          <i class="fas fa-star-and-crescent gradient-text"></i>
        </div>
        <div class="zikr-text">${zikr}</div>
        <button class="zikr-close-btn" onclick="document.getElementById('zikr-modal').remove()">
          <i class="fas fa-times"></i>
          <span>${closeText}</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // تطبيق الأنيميشن
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
  }

  // ===== أزرار التحكم =====
  initializeControls() {
    this.addControlButtons();
  }

  addControlButtons() {
    // البحث عن الـ navbar
    const nav = document.querySelector('nav .container');
    if (!nav) return;

    const buttonsContainer = nav.querySelector('.flex.gap-3') || nav.querySelector('.flex');
    if (!buttonsContainer) return;

    // إنشاء أزرار التحكم
    const controlsHTML = `
      <button id="lang-toggle" class="control-btn glass-card" title="تغيير اللغة / Change Language">
        <i class="fas fa-language"></i>
        <span>${this.currentLanguage === 'ar' ? 'EN' : 'ع'}</span>
      </button>
      <button id="theme-toggle" class="control-btn glass-card" title="تغيير الوضع / Toggle Theme">
        <i class="fas fa-${this.currentTheme === 'dark' ? 'sun' : 'moon'}"></i>
      </button>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = controlsHTML;
    
    while (tempDiv.firstChild) {
      buttonsContainer.appendChild(tempDiv.firstChild);
    }

    // ربط الأحداث
    const langBtn = document.getElementById('lang-toggle');
    const themeBtn = document.getElementById('theme-toggle');

    if (langBtn) {
      langBtn.addEventListener('click', () => {
        this.toggleLanguage();
        langBtn.querySelector('span').textContent = this.currentLanguage === 'ar' ? 'EN' : 'ع';
      });
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
        const icon = themeBtn.querySelector('i');
        icon.className = `fas fa-${this.currentTheme === 'dark' ? 'sun' : 'moon'}`;
      });
    }
  }
}

// ===== الأنماط الإضافية =====
function addZikrStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* نظام الأذكار - محافظ 100% على التصميم */
    #zikr-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #zikr-modal.show {
      opacity: 1;
    }

    #zikr-modal.show .zikr-content {
      transform: scale(1);
      opacity: 1;
    }

    .zikr-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      cursor: pointer;
    }

    .zikr-content {
      position: relative;
      max-width: 500px;
      width: 90%;
      padding: 40px 30px;
      border-radius: 24px;
      text-align: center;
      transform: scale(0.8);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .zikr-icon {
      font-size: 4rem;
      margin-bottom: 24px;
    }

    .zikr-text {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.8;
      margin-bottom: 32px;
      color: inherit;
    }

    .zikr-close-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 28px;
      border: none;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.3);
      border: 1px solid rgba(59, 130, 246, 0.5);
      color: inherit;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .zikr-close-btn:hover {
      background: rgba(59, 130, 246, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
    }

    /* أزرار التحكم */
    .control-btn {
      display: inline-flex;
      align-items: center;
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

    /* استجابة للشاشات الصغيرة */
    @media (max-width: 768px) {
      .zikr-content {
        padding: 30px 20px;
      }
      
      .zikr-icon {
        font-size: 3rem;
      }
      
      .zikr-text {
        font-size: 1.5rem;
      }
      
      .control-btn span {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}

// ===== التشغيل ==========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addZikrStyles();
    window.kooraxApp = new KooraxApp();
  });
} else {
  addZikrStyles();
  window.kooraxApp = new KooraxApp();
}
