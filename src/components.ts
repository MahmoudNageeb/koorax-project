/**
 * Koorax Page Components
 * مكونات مشتركة لجميع الصفحات
 */

// ========== NAVBAR COMPONENT ==========
export function getNavbar(currentPage = '') {
  return `
    <nav class="glass-card sticky top-0 z-50 mb-8">
      <div class="container mx-auto px-4 py-5">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <a href="/" class="flex items-center gap-3 group">
              <i class="fas fa-futbol text-4xl gradient-text group-hover:rotate-[360deg] transition-transform duration-700"></i>
              <h1 class="text-2xl md:text-3xl font-black gradient-text" data-i18n="siteTitle">Koorax</h1>
            </a>
          </div>
          <div class="flex gap-2 md:gap-3 flex-wrap">
            <a href="/matches" class="nav-link glass-card flex items-center gap-2 ${currentPage === 'matches' ? 'active' : ''}">
              <i class="fas fa-calendar-alt"></i>
              <span class="hidden sm:inline" data-i18n="matches">المباريات</span>
            </a>
            <a href="/competitions" class="nav-link glass-card flex items-center gap-2 ${currentPage === 'competitions' ? 'active' : ''}">
              <i class="fas fa-trophy"></i>
              <span class="hidden sm:inline" data-i18n="competitions">البطولات</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  `;
}

// ========== FOOTER COMPONENT ==========
export function getFooter() {
  return `
    <footer class="glass-card mt-16 py-8">
      <div class="container mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-2 mb-4">
          <i class="fas fa-futbol text-2xl gradient-text"></i>
          <span class="text-xl font-bold" data-i18n="siteTitle">Koorax</span>
        </div>
        <p class="text-sm opacity-70">© 2024 Koorax. All rights reserved.</p>
      </div>
    </footer>
  `;
}

// ========== MATCH CARD COMPONENT ==========
export function getMatchCard(match: any) {
  const status = match.status;
  let statusClass = 'status-scheduled';
  let statusText = 'NS';
  
  if (status === 'LIVE' || status === 'IN_PLAY') {
    statusClass = 'status-live';
    statusText = '<span data-i18n="live">مباشر</span>';
  } else if (status === 'FINISHED' || status === 'FULL_TIME') {
    statusClass = 'status-finished';
    statusText = '<span data-i18n="ft">ن.و</span>';
  } else if (status === 'PAUSED') {
    statusClass = 'status-scheduled';
    statusText = '<span data-i18n="ht">ش.أ</span>';
  }
  
  const homeTeam = match.homeTeam || {};
  const awayTeam = match.awayTeam || {};
  const score = match.score || {};
  const fullTime = score.fullTime || {};
  
  return `
    <a href="/matches/${match.id}" class="glass-card match-card p-4 md:p-6 rounded-2xl block hover-lift">
      <!-- Competition Badge -->
      <div class="flex items-center justify-between mb-4">
        <div class="competition-badge text-xs md:text-sm">
          <img src="${match.competition?.emblem || '/static/default-badge.png'}" 
               alt="${match.competition?.name || ''}" 
               class="w-4 h-4"
               onerror="this.src='/static/default-badge.png'">
          <span class="hidden sm:inline">${match.competition?.name || ''}</span>
        </div>
        <div class="status-badge ${statusClass} text-xs md:text-sm">
          ${statusText}
        </div>
      </div>
      
      <!-- Teams and Score -->
      <div class="grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 items-center">
        <!-- Home Team -->
        <div class="flex flex-col items-center text-center">
          <img src="${homeTeam.crest || '/static/default-team.png'}" 
               alt="${homeTeam.name || ''}"
               class="w-12 h-12 md:w-16 md:h-16 object-contain mb-2"
               onerror="this.src='/static/default-team.png'">
          <span class="font-bold text-sm md:text-base line-clamp-2">${homeTeam.name || ''}</span>
        </div>
        
        <!-- Score -->
        <div class="flex flex-col items-center">
          ${fullTime.home !== null && fullTime.away !== null ? `
            <div class="text-2xl md:text-3xl font-black gradient-text">
              ${fullTime.home} - ${fullTime.away}
            </div>
          ` : `
            <div class="text-lg md:text-xl font-bold opacity-50" data-i18n="vs">VS</div>
          `}
          <div class="text-xs md:text-sm opacity-70 mt-1">
            ${new Date(match.utcDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <!-- Away Team -->
        <div class="flex flex-col items-center text-center">
          <img src="${awayTeam.crest || '/static/default-team.png'}" 
               alt="${awayTeam.name || ''}"
               class="w-12 h-12 md:w-16 md:h-16 object-contain mb-2"
               onerror="this.src='/static/default-team.png'">
          <span class="font-bold text-sm md:text-base line-clamp-2">${awayTeam.name || ''}</span>
        </div>
      </div>
    </a>
  `;
}

// ========== LOADING SKELETON ==========
export function getLoadingSkeleton(count = 6) {
  let skeletons = '';
  for (let i = 0; i < count; i++) {
    skeletons += `
      <div class="glass-card p-6 rounded-2xl">
        <div class="skeleton h-6 w-32 mb-4"></div>
        <div class="grid grid-cols-3 gap-4 items-center mb-4">
          <div class="skeleton h-16 w-16 rounded-full mx-auto"></div>
          <div class="skeleton h-8 w-20 mx-auto"></div>
          <div class="skeleton h-16 w-16 rounded-full mx-auto"></div>
        </div>
        <div class="skeleton h-4 w-full mb-2"></div>
        <div class="skeleton h-4 w-3/4 mx-auto"></div>
      </div>
    `;
  }
  return skeletons;
}

// ========== NO DATA MESSAGE ==========
export function getNoDataMessage(message = 'لا توجد مباريات') {
  return `
    <div class="glass-card p-12 rounded-3xl text-center">
      <i class="fas fa-inbox text-6xl opacity-30 mb-4"></i>
      <p class="text-xl opacity-70" data-i18n="noData">${message}</p>
    </div>
  `;
}

// ========== ERROR MESSAGE ==========
export function getErrorMessage(message = 'حدث خطأ') {
  return `
    <div class="glass-card p-12 rounded-3xl text-center">
      <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
      <p class="text-xl mb-4" data-i18n="error">${message}</p>
      <button onclick="location.reload()" class="px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition">
        <span data-i18n="tryAgain">حاول مرة أخرى</span>
      </button>
    </div>
  `;
}
