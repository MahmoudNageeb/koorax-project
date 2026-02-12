// Koorax Utilities

export function getLanguage(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('koorax_language') || 'ar';
  }
  return 'ar';
}

export function setLanguage(lang: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('koorax_language', lang);
  }
}

export function getTheme(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('koorax_theme') || 'dark';
  }
  return 'dark';
}

export function setTheme(theme: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('koorax_theme', theme);
  }
}

export function formatDate(dateString: string, lang: string = 'ar'): string {
  const date = new Date(dateString);
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return date.toLocaleDateString(locale, { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ar-EG', { 
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTodayDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    dateFrom: today.toISOString().split('T')[0],
    dateTo: tomorrow.toISOString().split('T')[0]
  };
}
