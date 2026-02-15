/**
 * Enhanced Match Details Display
 * عرض تفاصيل المباراة الشامل مع التشكيلة والأحداث
 */

// Function to display lineup
function displayLineup(match) {
  if (!match.lineups || match.lineups.length === 0) {
    return '<p class="text-gray-400 text-center py-8">التشكيلة غير متوفرة</p>';
  }
  
  const homeLineup = match.lineups.find(l => l.team.id === match.homeTeam.id);
  const awayLineup = match.lineups.find(l => l.team.id === match.awayTeam.id);
  
  let html = '<div class="grid md:grid-cols-2 gap-6">';
  
  // Home Team Lineup
  if (homeLineup) {
    html += `
      <div>
        <h4 class="text-xl font-bold mb-4 text-center">${match.homeTeam.name}</h4>
        ${homeLineup.formation ? `<p class="text-center text-gray-400 mb-4">التشكيل: ${homeLineup.formation}</p>` : ''}
        ${homeLineup.coach ? `<p class="text-sm text-gray-400 mb-4"><i class="fas fa-user-tie"></i> المدرب: ${homeLineup.coach.name}</p>` : ''}
        
        <!-- Starting XI -->
        <div class="mb-6">
          <h5 class="font-bold text-green-400 mb-3 flex items-center gap-2">
            <i class="fas fa-users"></i> التشكيل الأساسي
          </h5>
          <div class="space-y-2">
            ${homeLineup.startingEleven ? homeLineup.startingEleven.map(player => `
              <div class="flex items-center gap-3 p-2 rounded bg-gray-800/50 hover:bg-gray-800 transition">
                <span class="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full text-sm font-bold">
                  ${player.shirtNumber || '-'}
                </span>
                <span class="flex-1">${player.name}</span>
                <span class="text-xs text-gray-400">${player.position || ''}</span>
              </div>
            `).join('') : '<p class="text-gray-400">غير متوفر</p>'}
          </div>
        </div>
        
        <!-- Substitutes -->
        ${homeLineup.substitutes && homeLineup.substitutes.length > 0 ? `
          <div>
            <h5 class="font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <i class="fas fa-exchange-alt"></i> الاحتياط
            </h5>
            <div class="space-y-2">
              ${homeLineup.substitutes.map(player => `
                <div class="flex items-center gap-3 p-2 rounded bg-gray-800/30 hover:bg-gray-800/50 transition">
                  <span class="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full text-sm font-bold">
                    ${player.shirtNumber || '-'}
                  </span>
                  <span class="flex-1 text-gray-300">${player.name}</span>
                  <span class="text-xs text-gray-400">${player.position || ''}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  // Away Team Lineup
  if (awayLineup) {
    html += `
      <div>
        <h4 class="text-xl font-bold mb-4 text-center">${match.awayTeam.name}</h4>
        ${awayLineup.formation ? `<p class="text-center text-gray-400 mb-4">التشكيل: ${awayLineup.formation}</p>` : ''}
        ${awayLineup.coach ? `<p class="text-sm text-gray-400 mb-4"><i class="fas fa-user-tie"></i> المدرب: ${awayLineup.coach.name}</p>` : ''}
        
        <!-- Starting XI -->
        <div class="mb-6">
          <h5 class="font-bold text-green-400 mb-3 flex items-center gap-2">
            <i class="fas fa-users"></i> التشكيل الأساسي
          </h5>
          <div class="space-y-2">
            ${awayLineup.startingEleven ? awayLineup.startingEleven.map(player => `
              <div class="flex items-center gap-3 p-2 rounded bg-gray-800/50 hover:bg-gray-800 transition">
                <span class="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full text-sm font-bold">
                  ${player.shirtNumber || '-'}
                </span>
                <span class="flex-1">${player.name}</span>
                <span class="text-xs text-gray-400">${player.position || ''}</span>
              </div>
            `).join('') : '<p class="text-gray-400">غير متوفر</p>'}
          </div>
        </div>
        
        <!-- Substitutes -->
        ${awayLineup.substitutes && awayLineup.substitutes.length > 0 ? `
          <div>
            <h5 class="font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <i class="fas fa-exchange-alt"></i> الاحتياط
            </h5>
            <div class="space-y-2">
              ${awayLineup.substitutes.map(player => `
                <div class="flex items-center gap-3 p-2 rounded bg-gray-800/30 hover:bg-gray-800/50 transition">
                  <span class="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full text-sm font-bold">
                    ${player.shirtNumber || '-'}
                  </span>
                  <span class="flex-1 text-gray-300">${player.name}</span>
                  <span class="text-xs text-gray-400">${player.position || ''}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

// Function to display match events (goals, cards, substitutions)
function displayEvents(match) {
  // Check for goals data
  const goals = match.goals || [];
  const bookings = match.bookings || [];
  const substitutions = match.substitutions || [];
  
  if (goals.length === 0 && bookings.length === 0 && substitutions.length === 0) {
    return '<p class="text-gray-400 text-center py-8">لا توجد أحداث متوفرة للمباراة</p>';
  }
  
  // Combine all events
  const allEvents = [];
  
  // Add goals
  goals.forEach(goal => {
    allEvents.push({
      type: 'goal',
      minute: goal.minute,
      team: goal.team,
      player: goal.scorer,
      assist: goal.assist,
      score: goal.score
    });
  });
  
  // Add bookings (cards)
  bookings.forEach(booking => {
    allEvents.push({
      type: booking.card === 'YELLOW_CARD' ? 'yellow' : 'red',
      minute: booking.minute,
      team: booking.team,
      player: booking.player
    });
  });
  
  // Add substitutions
  substitutions.forEach(sub => {
    allEvents.push({
      type: 'substitution',
      minute: sub.minute,
      team: sub.team,
      playerOut: sub.playerOut,
      playerIn: sub.playerIn
    });
  });
  
  // Sort by minute
  allEvents.sort((a, b) => a.minute - b.minute);
  
  // Render events timeline
  let html = '<div class="space-y-4">';
  
  allEvents.forEach(event => {
    const isHome = event.team.id === match.homeTeam.id;
    
    html += `
      <div class="flex items-center gap-4 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition ${isHome ? '' : 'flex-row-reverse'}">
        <div class="w-16 h-16 flex items-center justify-center rounded-full ${
          event.type === 'goal' ? 'bg-green-600' : 
          event.type === 'yellow' ? 'bg-yellow-500' :
          event.type === 'red' ? 'bg-red-600' :
          'bg-blue-600'
        }">
          <i class="fas ${
            event.type === 'goal' ? 'fa-futbol' :
            event.type === 'yellow' ? 'fa-square' :
            event.type === 'red' ? 'fa-square' :
            'fa-exchange-alt'
          } text-2xl text-white"></i>
        </div>
        
        <div class="flex-1 ${isHome ? 'text-right' : 'text-left'}">
          <div class="flex items-center gap-2 ${isHome ? 'justify-end' : 'justify-start'}">
            <span class="text-2xl font-bold text-gray-300">${event.minute}'</span>
            ${event.type === 'goal' && event.score ? `<span class="text-sm text-gray-400">(${event.score.home}-${event.score.away})</span>` : ''}
          </div>
          
          ${event.type === 'goal' ? `
            <div class="mt-1">
              <p class="font-bold text-lg">⚽ ${event.player.name}</p>
              ${event.assist ? `<p class="text-sm text-gray-400">تمريرة: ${event.assist.name}</p>` : ''}
            </div>
          ` : ''}
          
          ${event.type === 'yellow' || event.type === 'red' ? `
            <p class="font-bold text-lg mt-1">
              ${event.type === 'yellow' ? '🟨' : '🟥'} ${event.player.name}
            </p>
          ` : ''}
          
          ${event.type === 'substitution' ? `
            <div class="mt-1 text-sm">
              <p class="text-red-400"><i class="fas fa-arrow-down"></i> ${event.playerOut.name}</p>
              <p class="text-green-400"><i class="fas fa-arrow-up"></i> ${event.playerIn.name}</p>
            </div>
          ` : ''}
          
          <p class="text-xs text-gray-500 mt-1">${event.team.name}</p>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Function to display statistics
function displayStatistics(match) {
  // Note: The free API tier might not include detailed stats
  // This is a placeholder for when stats are available
  
  if (!match.stats || match.stats.length === 0) {
    return `
      <div class="text-center py-8">
        <i class="fas fa-chart-bar text-6xl text-gray-700 mb-4"></i>
        <p class="text-gray-400">الإحصائيات التفصيلية غير متوفرة</p>
        <p class="text-sm text-gray-500 mt-2">متوفرة فقط في الاشتراك المدفوع للـ API</p>
      </div>
    `;
  }
  
  // If stats are available, display them
  let html = '<div class="space-y-4">';
  
  match.stats.forEach(stat => {
    html += `
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-400">${match.homeTeam.shortName}</span>
          <span class="font-bold">${stat.type}</span>
          <span class="text-sm text-gray-400">${match.awayTeam.shortName}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-gray-700 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${stat.homeValue}%"></div>
          </div>
          <span class="text-sm font-bold w-12 text-center">${stat.homeValue}</span>
          <span class="text-sm font-bold w-12 text-center">${stat.awayValue}</span>
          <div class="flex-1 bg-gray-700 rounded-full h-2">
            <div class="bg-red-600 h-2 rounded-full" style="width: ${stat.awayValue}%"></div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Export functions
window.matchDetailsDisplay = {
  displayLineup,
  displayEvents,
  displayStatistics
};
