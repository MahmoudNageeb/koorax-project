// ============================================
// 🕌 نظام الأذكار الإسلامية - Koorax
// ============================================
// يعرض ذكر عشوائي عند تحميل الصفحة
// مع دعم اللغتين العربية والإنجليزية
// ونظام Dark/Light Mode
// ============================================

// 📚 قائمة الأذكار بالعربية
const AZKAR_AR = [
  "بسم الله الرحمن الرحيم",
  "الحمد لله رب العالمين",
  "سبحان الله وبحمده، سبحان الله العظيم",
  "لا إله إلا الله وحده لا شريك له",
  "اللهم صل وسلم على نبينا محمد",
  "استغفر الله العظيم وأتوب إليه",
  "لا حول ولا قوة إلا بالله",
  "حسبنا الله ونعم الوكيل",
  "اللهم إني أسألك العفو والعافية",
  "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة",
  "اللهم اهدني وسددني",
  "اللهم إني أعوذ بك من الهم والحزن",
  "اللهم بارك لنا فيما رزقتنا",
  "سبحان الله والحمد لله ولا إله إلا الله والله أكبر",
  "اللهم أنت ربي لا إله إلا أنت"
];

// 📚 قائمة الأذكار بالإنجليزية (ترجمات معاني)
const AZKAR_EN = [
  "In the name of Allah, the Most Gracious, the Most Merciful",
  "All praise is due to Allah, Lord of the worlds",
  "Glory be to Allah and praise Him, Glory be to Allah the Great",
  "There is no deity except Allah alone without any partners",
  "O Allah, send blessings and peace upon our Prophet Muhammad",
  "I seek forgiveness from Allah and repent to Him",
  "There is no power nor strength except with Allah",
  "Allah is sufficient for us and He is the best Disposer of affairs",
  "O Allah, I ask You for pardon and well-being",
  "Our Lord, give us good in this world and good in the Hereafter",
  "O Allah, guide me and make me steadfast",
  "O Allah, I seek refuge in You from worry and grief",
  "O Allah, bless us in what You have provided us",
  "Glory be to Allah, praise be to Allah, there is no deity except Allah, and Allah is the Greatest",
  "O Allah, You are my Lord, there is no deity except You"
];

// ============================================
// 🎯 دوال النظام الرئيسية
// ============================================

/**
 * الحصول على اللغة المحفوظة
 * @returns {string} 'ar' أو 'en'
 */
function getSavedLanguage() {
  return localStorage.getItem('koorax_language') || 'ar';
}

/**
 * الحصول على الثيم المحفوظ
 * @returns {string} 'dark' أو 'light'
 */
function getSavedTheme() {
  return localStorage.getItem('koorax_theme') || 'dark';
}

/**
 * حفظ اللغة
 * @param {string} lang - اللغة المراد حفظها
 */
function saveLanguage(lang) {
  localStorage.setItem('koorax_language', lang);
}

/**
 * حفظ الثيم
 * @param {string} theme - الثيم المراد حفظه
 */
function saveTheme(theme) {
  localStorage.setItem('koorax_theme', theme);
}

/**
 * اختيار ذكر عشوائي (بدون تكرار)
 * @param {Array} azkarList - قائمة الأذكار
 * @returns {string} الذكر المختار
 */
function getRandomZikr(azkarList) {
  // الحصول على آخر ذكر معروض
  const lastZikr = localStorage.getItem('koorax_last_zikr');
  
  let randomZikr;
  let attempts = 0;
  const maxAttempts = 10;
  
  // محاولة اختيار ذكر مختلف عن السابق
  do {
    const randomIndex = Math.floor(Math.random() * azkarList.length);
    randomZikr = azkarList[randomIndex];
    attempts++;
  } while (randomZikr === lastZikr && attempts < maxAttempts && azkarList.length > 1);
  
  // حفظ الذكر الجديد
  localStorage.setItem('koorax_last_zikr', randomZikr);
  
  return randomZikr;
}

/**
 * إنشاء مودال الذكر (بنفس تصميم الموقع)
 * @param {string} zikr - نص الذكر
 * @param {string} lang - اللغة الحالية
 */
function createZikrModal(zikr, lang) {
  // إنشاء backdrop (طبقة خلفية شفافة)
  const backdrop = document.createElement('div');
  backdrop.id = 'zikr-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  // إنشاء المودال (باستخدام نفس أسلوب glass-card)
  const modal = document.createElement('div');
  modal.id = 'zikr-modal';
  modal.className = 'glass-card';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    max-width: 500px;
    width: 90%;
    padding: 2rem;
    border-radius: 1.5rem;
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
    box-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
  `;
  
  // محتوى المودال
  const isArabic = lang === 'ar';
  const closeText = isArabic ? 'إغلاق' : 'Close';
  
  modal.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <i class="fas fa-mosque gradient-text" style="font-size: 3rem; display: inline-block;"></i>
    </div>
    <p style="font-size: 1.5rem; font-weight: 700; line-height: 2; margin-bottom: 2rem; color: inherit;">
      ${zikr}
    </p>
    <button 
      id="close-zikr-btn" 
      style="
        padding: 0.75rem 2rem;
        border-radius: 0.75rem;
        border: none;
        background: rgba(59, 130, 246, 0.3);
        color: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
      "
      onmouseover="this.style.background='rgba(59, 130, 246, 0.5)'; this.style.transform='scale(1.05)'"
      onmouseout="this.style.background='rgba(59, 130, 246, 0.3)'; this.style.transform='scale(1)'"
    >
      <i class="fas fa-times" style="margin-${isArabic ? 'left' : 'right'}: 0.5rem;"></i>
      ${closeText}
    </button>
  `;
  
  // إضافة العناصر للصفحة
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
  
  // تطبيق الأنيميشن (fade + scale)
  requestAnimationFrame(() => {
    backdrop.style.opacity = '1';
    modal.style.opacity = '1';
    modal.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  
  // دالة الإغلاق
  const closeModal = () => {
    backdrop.style.opacity = '0';
    modal.style.opacity = '0';
    modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
    
    setTimeout(() => {
      backdrop.remove();
      modal.remove();
    }, 300);
  };
  
  // ربط حدث الإغلاق
  document.getElementById('close-zikr-btn').addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  
  // الإغلاق بمفتاح Escape
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

/**
 * عرض الذكر عند تحميل الصفحة
 */
function showZikrOnLoad() {
  // التحقق من أن المودال غير موجود بالفعل
  if (document.getElementById('zikr-modal')) {
    return;
  }
  
  // الحصول على اللغة الحالية
  const currentLang = getSavedLanguage();
  
  // اختيار قائمة الأذكار المناسبة
  const azkarList = currentLang === 'ar' ? AZKAR_AR : AZKAR_EN;
  
  // اختيار ذكر عشوائي
  const randomZikr = getRandomZikr(azkarList);
  
  // عرض المودال بعد ثانية من تحميل الصفحة (لضمان تحميل الـ DOM)
  setTimeout(() => {
    createZikrModal(randomZikr, currentLang);
  }, 1000);
}

// ============================================
// 🌍 نظام تغيير اللغة
// ============================================

/**
 * تبديل اللغة
 */
function toggleLanguage() {
  const currentLang = getSavedLanguage();
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  saveLanguage(newLang);
  
  // تحديث اتجاه الصفحة
  document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', newLang);
  
  // إعادة تحميل الصفحة لتطبيق التغييرات
  location.reload();
}

// ============================================
// 🌙 نظام Dark/Light Mode
// ============================================

/**
 * تبديل الثيم
 */
function toggleTheme() {
  const currentTheme = getSavedTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  saveTheme(newTheme);
  
  // تطبيق الثيم
  document.body.className = newTheme;
  
  // إعادة تحميل الصفحة لتطبيق التغييرات
  location.reload();
}

/**
 * تطبيق الإعدادات المحفوظة عند تحميل الصفحة
 */
function applyStoredSettings() {
  const savedLang = getSavedLanguage();
  const savedTheme = getSavedTheme();
  
  // تطبيق اللغة
  document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', savedLang);
  
  // تطبيق الثيم
  document.body.className = savedTheme;
}

// ============================================
// 🚀 التشغيل التلقائي
// ============================================

// تطبيق الإعدادات المحفوظة فوراً
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyStoredSettings();
    showZikrOnLoad();
  });
} else {
  applyStoredSettings();
  showZikrOnLoad();
}

// ============================================
// 📤 تصدير الدوال للاستخدام العام
// ============================================
window.toggleLanguage = toggleLanguage;
window.toggleTheme = toggleTheme;
window.getSavedLanguage = getSavedLanguage;
window.getSavedTheme = getSavedTheme;
