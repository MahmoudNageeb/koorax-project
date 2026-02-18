/**
 * Koorax Global Features
 * - Dark Mode Toggle
 * - Language Toggle (Arabic/English)
 * - Prayer Notification on Homepage
 */

// Prayer notification messages
const PRAYER_MESSAGES = [
  'اللهم صل وسلم وبارك على سيدنا محمد ❤️',
  'صلى الله عليه وسلم 🤲',
  'اللهم صل على محمد وعلى آل محمد 🌙',
  'عليه أفضل الصلاة والسلام ✨',
  'صلوا على النبي المختار 💚'
];

// Initialize app settings from localStorage or defaults
function initializeSettings() {
  // Get saved settings
  const savedTheme = localStorage.getItem('koorax-theme') || 'dark';
  const savedLang = localStorage.getItem('koorax-lang') || 'ar';
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', savedLang);
  
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

// Toggle language
function toggleLanguage() {
  const currentLang = document.documentElement.getAttribute('lang');
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  document.documentElement.setAttribute('lang', newLang);
  document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem('koorax-lang', newLang);
  
  // Reload page to apply translations
  window.location.reload();
}

// Show prayer notification with beautiful animation
function showPrayerNotification() {
  // Random message
  const message = PRAYER_MESSAGES[Math.floor(Math.random() * PRAYER_MESSAGES.length)];
  
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
