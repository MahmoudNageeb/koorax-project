/**
 * Enhanced Matches Display Component
 * عرض المباريات بشكل كروت احترافية
 */

function getStatusBadgeClass(status) {
  const statusMap = {
    'LIVE': 'live',
    'IN_PLAY': 'live',
    'PAUSED': 'live',
    'SCHEDULED': 'soon',
    'TIMED': 'soon',
    'FINISHED': 'finished',
    'POSTPONED': 'finished',
    'CANCELLED': 'finished',
    'SUSPENDED': 'finished'
  };
  return statusMap[status] || 'finished';
}

function getStatusText(status) {
  const lang = window.KooraxGlobal?.language || 'ar';
  
  const statusAr = {
    'LIVE': 'مباشر',
    'IN_PLAY': 'مباشر',
    'PAUSED': 'استراحة',
    'SCHEDULED': 'قريباً',
    'TIMED': 'قريباً',
    'FINISHED': 'انتهت',
    'POSTPONED': 'مؤجلة',
    'CANCELLED': 'ملغاة',
    'SUSPENDED': 'متوقفة'
  };
  
  const statusEn = {
    'LIVE': 'Live',
    'IN_PLAY': 'Live',
    'PAUSED': 'Half Time',
    'SCHEDULED': 'Upcoming',
    'TIMED': 'Upcoming',
    'FINISHED': 'Finished',
    'POSTPONED': 'Postponed',
    'CANCELLED': 'Cancelled',
    'SUSPENDED': 'Suspended'
  };
  
  return lang === 'ar' ? (statusAr[status] || status) : (statusEn[status] || status);
}

function formatMatchTime(utcDate, status) {
  if (!utcDate) return '';
  
  const matchDate = new Date(utcDate);
  const now = new Date();
  const lang = window.KooraxGlobal?.language || 'ar';
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  
  // For finished matches, show result
  if (status === 'FINISHED') {
    return lang === 'ar' ? 'انتهت' : 'FT';
  }
  
  // For live matches
  if (status === 'LIVE' || status === 'IN_PLAY') {
    return lang === 'ar' ? 'الآن' : 'Now';
  }
  
  // For upcoming matches
  const diffMs = matchDate - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays > 1) {
    return matchDate.toLocaleDateString(locale, { 
      month: 'short', 
      day: 'numeric'
    });
  } else if (diffHours > 0) {
    const hourText = lang === 'ar' ? 'ساعة' : 'hour';
    return `${diffHours} ${hourText}`;
  } else if (diffMins > 0) {
    const minText = lang === 'ar' ? 'دقيقة' : 'min';
    return `${diffMins} ${minText}`;
  } else {
    return matchDate.toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

function getCompetitionName(competitionId, competitionName) {
  const lang = window.KooraxGlobal?.language || 'ar';
  
  const competitionsAr = {
    2021: 'الدوري الإنجليزي',
    2014: 'الدوري الإسباني',
    2019: 'الدوري الإيطالي',
    2002: 'الدوري الألماني',
    2015: 'الدوري الفرنسي',
    2001: 'دوري أبطال أوروبا',
    2003: 'الدوري الهولندي',
    2017: 'الدوري البرتغالي',
    2013: 'الدوري البرازيلي'
  };
  
  const competitionsEn = {
    2021: 'Premier League',
    2014: 'La Liga',
    2019: 'Serie A',
    2002: 'Bundesliga',
    2015: 'Ligue 1',
    2001: 'Champions League',
    2003: 'Eredivisie',
    2017: 'Primeira Liga',
    2013: 'Brasileiro'
  };
  
  if (lang === 'ar') {
    return competitionsAr[competitionId] || competitionName || 'بطولة';
  } else {
    return competitionsEn[competitionId] || competitionName || 'Competition';
  }
}

function createMatchCard(match) {
  const homeTeam = match.homeTeam || {};
  const awayTeam = match.awayTeam || {};
  const score = match.score || {};
  const fullTime = score.fullTime || {};
  const competition = match.competition || {};
  
  const homeScore = fullTime.home !== null && fullTime.home !== undefined ? fullTime.home : '-';
  const awayScore = fullTime.away !== null && fullTime.away !== undefined ? fullTime.away : '-';
  
  const statusClass = getStatusBadgeClass(match.status);
  const statusText = getStatusText(match.status);
  const matchTime = formatMatchTime(match.utcDate, match.status);
  const competitionName = getCompetitionName(competition.id, competition.name);
  
  const homeLogo = homeTeam.crest || 'https://via.placeholder.com/48?text=?';
  const awayLogo = awayTeam.crest || 'https://via.placeholder.com/48?text=?';
  
  return `
    <div class="match-card-new" onclick="window.location.href='/matches/${match.id}'">
      <!-- Match Teams -->
      <div class="match-teams">
        <!-- Home Team -->
        <div class="team">
          <div class="team-logo-wrapper">
            <img src="${homeLogo}" alt="${homeTeam.name}" class="team-logo" onerror="this.src='https://via.placeholder.com/48?text=?'">
          </div>
          <div class="team-name">${homeTeam.name || 'Home'}</div>
        </div>
        
        <!-- Score -->
        <div class="match-score">
          <div class="score-display">${homeScore} - ${awayScore}</div>
          <div class="match-time">${matchTime}</div>
        </div>
        
        <!-- Away Team -->
        <div class="team">
          <div class="team-logo-wrapper">
            <img src="${awayLogo}" alt="${awayTeam.name}" class="team-logo" onerror="this.src='https://via.placeholder.com/48?text=?'">
          </div>
          <div class="team-name">${awayTeam.name || 'Away'}</div>
        </div>
      </div>
      
      <!-- Match Info -->
      <div class="match-info">
        <div class="competition-badge">
          <i class="fas fa-trophy"></i>
          <span>${competitionName}</span>
        </div>
        <div class="sport-badge ${statusClass}">
          ${statusClass === 'live' ? '<i class="fas fa-circle"></i>' : ''}
          <span>${statusText}</span>
        </div>
      </div>
    </div>
  `;
}

function displayMatches(matches, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!matches || matches.length === 0) {
    const lang = window.KooraxGlobal?.language || 'ar';
    const noDataText = lang === 'ar' ? 'لا توجد مباريات' : 'No matches available';
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-futbol text-6xl text-gray-600 mb-4"></i>
        <p class="text-xl text-gray-400">${noDataText}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = matches.map(match => createMatchCard(match)).join('');
}

// Loading skeleton
function showLoadingSkeleton(containerId, count = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const skeletons = Array(count).fill(0).map(() => `
    <div class="match-card-new">
      <div class="match-teams">
        <div class="team">
          <div class="skeleton" style="width: 64px; height: 64px; border-radius: 12px;"></div>
          <div class="skeleton" style="width: 80px; height: 16px; margin-top: 8px;"></div>
        </div>
        <div class="match-score">
          <div class="skeleton" style="width: 60px; height: 32px;"></div>
          <div class="skeleton" style="width: 50px; height: 14px; margin-top: 8px;"></div>
        </div>
        <div class="team">
          <div class="skeleton" style="width: 64px; height: 64px; border-radius: 12px;"></div>
          <div class="skeleton" style="width: 80px; height: 16px; margin-top: 8px;"></div>
        </div>
      </div>
      <div class="match-info" style="padding-top: 1rem; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08);">
        <div class="skeleton" style="width: 120px; height: 24px;"></div>
        <div class="skeleton" style="width: 80px; height: 24px;"></div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = skeletons;
}

// Export functions
window.matchesDisplay = {
  createMatchCard,
  displayMatches,
  showLoadingSkeleton,
  getStatusText,
  formatMatchTime,
  getCompetitionName
};
