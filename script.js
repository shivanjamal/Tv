// ========================================
// Intelligent TV App - Client-Side Only
// ========================================

// Storage Manager
const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// User Preferences Manager
const Preferences = {
  init() {
    // Auto-detect theme preference based on time
    const hour = new Date().getHours();
    const prefersDark = hour < 6 || hour >= 20;
    const savedTheme = Storage.get('theme');
    
    if (savedTheme) {
      document.body.classList.toggle('light', savedTheme === 'light');
    } else if (prefersDark) {
      document.body.classList.remove('light');
      Storage.set('theme', 'dark');
    } else {
      document.body.classList.add('light');
      Storage.set('theme', 'light');
    }
  },
  
  toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    Storage.set('theme', isLight ? 'light' : 'dark');
    return isLight;
  },
  
  getFavorites() {
    return Storage.get('favorites', []);
  },
  
  toggleFavorite(channelId) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(channelId);
    
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(channelId);
    }
    
    Storage.set('favorites', favorites);
    return favorites.includes(channelId);
  },
  
  isFavorite(channelId) {
    return this.getFavorites().includes(channelId);
  }
};

// Viewing History Manager
const History = {
  get() {
    return Storage.get('viewingHistory', []);
  },
  
  add(channelId, channelName) {
    const history = this.get();
    const entry = {
      id: channelId,
      name: channelName,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };
    
    // Remove existing entry if present
    const existingIndex = history.findIndex(h => h.id === channelId);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    
    // Add to beginning
    history.unshift(entry);
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.pop();
    }
    
    Storage.set('viewingHistory', history);
  },
  
  getMostViewed(limit = 5) {
    const history = this.get();
    const counts = {};
    
    history.forEach(entry => {
      counts[entry.id] = (counts[entry.id] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  },
  
  getRecent(limit = 5) {
    return this.get().slice(0, limit).map(entry => entry.id);
  }
};

// Smart Search & Filter
const SmartSearch = {
  init() {
    this.createSearchBar();
    this.setupFilters();
  },
  
  createSearchBar() {
    const header = document.querySelector('header');
    if (!header) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <input 
        type="text" 
        id="channelSearch" 
        class="search-input" 
        placeholder="گەڕیان ل کەناڵان... " 
        autocomplete="off"
      />
      <button class="search-clear" id="searchClear" style="display: none;">✕</button>
    `;
    
    const headerActions = header.querySelector('.header-actions');
    if (headerActions) {
      headerActions.insertBefore(searchContainer, headerActions.firstChild);
    }
    
    this.setupSearch();
  },
  
  setupSearch() {
    const searchInput = document.getElementById('channelSearch');
    const searchClear = document.getElementById('searchClear');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      searchClear.style.display = query ? 'block' : 'none';
      this.filterChannels(query);
    });
    
    searchClear?.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      this.filterChannels('');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
        searchInput.value = '';
        this.filterChannels('');
      }
    });
  },
  
  filterChannels(query) {
    const cards = document.querySelectorAll('.channel-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent.toLowerCase() || '';
      const matches = !query || title.includes(query) || description.includes(query);
      
      card.style.display = matches ? 'block' : 'none';
      if (matches) visibleCount++;
    });
    
    // Show/hide "no results" message
    this.showNoResults(visibleCount === 0 && query);
  },
  
  showNoResults(show) {
    let message = document.getElementById('noResultsMessage');
    if (show && !message) {
      message = document.createElement('div');
      message.id = 'noResultsMessage';
      message.className = 'no-results';
      message.textContent = 'هیچ کاناڵێک نەدۆزرایەوە';
      document.querySelector('.channel-grid')?.appendChild(message);
    } else if (!show && message) {
      message.remove();
    }
  },
  
  setupFilters() {
    const main = document.querySelector('main');
    if (!main) return;
    
    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';
    filterBar.innerHTML = `
      <button class="filter-btn active" data-filter="all">هەمی</button>
      <button class="filter-btn" data-filter="favorites">دڵخواز</button>
      <button class="filter-btn" data-filter="recent">یێن نوو</button>
      <button class="filter-btn" data-filter="popular">ب ناڤودەنگ</button>
    `;
    
    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) {
      sectionTitle.insertAdjacentElement('afterend', filterBar);
    }
    
    filterBar.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        filterBar.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
        this.applyFilter(e.target.dataset.filter);
      }
    });
  },
  
  applyFilter(filter) {
    const cards = document.querySelectorAll('.channel-card');
    const favorites = Preferences.getFavorites();
    const recent = History.getRecent();
    const popular = History.getMostViewed();
    
    cards.forEach(card => {
      const channelId = this.getChannelId(card);
      let show = true;
      
      switch(filter) {
        case 'favorites':
          show = favorites.includes(channelId);
          break;
        case 'recent':
          show = recent.includes(channelId);
          break;
        case 'popular':
          show = popular.includes(channelId);
          break;
        case 'all':
        default:
          show = true;
      }
      
      card.style.display = show ? 'block' : 'none';
    });
  },
  
  getChannelId(card) {
    const link = card.closest('a') || card;
    const href = link.href || '';
    const match = href.match(/[?&]ch=([^&]+)/);
    return match ? match[1] : '';
  }
};

// Favorites Manager
const FavoritesManager = {
  init() {
    this.showFavoritesSection();
    this.addFavoriteButtons();
    this.updateFavoritesDisplay();
  },
  
  showFavoritesSection() {
    const favorites = Preferences.getFavorites();
    
    // Main page favorites section
    const favoritesSection = document.getElementById('favoritesSection');
    const favoritesGrid = document.querySelector('.favorites-grid');
    
    if (favoritesSection && favoritesGrid) {
      if (favorites.length > 0) {
        favoritesSection.style.display = 'block';
        favoritesGrid.innerHTML = '';
        
        favorites.forEach(channelId => {
          const originalCard = document.querySelector(`a[href*="ch=${channelId}"]`);
          if (originalCard) {
            const favoriteCard = originalCard.cloneNode(true);
            favoriteCard.classList.add('favorite-card');
            this.addFavoriteButton(favoriteCard, channelId, true);
            favoritesGrid.appendChild(favoriteCard);
          }
        });
      } else {
        favoritesSection.style.display = 'none';
      }
    }
    
    // Live page quick access
    const quickAccess = document.getElementById('favoritesQuickAccess');
    const quickAccessGrid = document.querySelector('.quick-access-grid');
    
    if (quickAccess && quickAccessGrid) {
      if (favorites.length > 0) {
        quickAccess.style.display = 'block';
        quickAccessGrid.innerHTML = '';
        
        favorites.slice(0, 6).forEach(channelId => {
          const channel = this.getChannelInfo(channelId);
          if (channel) {
            const quickCard = document.createElement('a');
            quickCard.href = `live.html?ch=${channelId}`;
            quickCard.className = 'quick-access-card';
            quickCard.innerHTML = `
              <div class="quick-card-content">
                <span class="quick-card-icon">📺</span>
                <span class="quick-card-name">${channel.name}</span>
              </div>
            `;
            quickAccessGrid.appendChild(quickCard);
          }
        });
      } else {
        quickAccess.style.display = 'none';
      }
    }
  },
  
  getChannelInfo(channelId) {
    const channelNames = {
      bein: 'beIN Sports HD',
      bein2: 'beIN Sports 2 HD',
      bein3: 'beIN Sports 3 HD',
      bein4: 'beIN Sports 4 HD',
      bein5: 'beIN Sports 5 HD',
      bein6: 'beIN Sports 6 HD',
      bein7: 'beIN Sports 7 HD',
      bein8: 'beIN Sports 8 HD',
      bein9: 'beIN Sports 9 HD',
      bein10: 'beIN Sports 10 HD',
      bein11: 'beIN Sports 11 HD',
      bein12: 'beIN Sports 12 HD',
      duhok: 'duhok Sports',
      zaxo: 'zaxo Sports'
    };
    
    return channelNames[channelId] ? { name: channelNames[channelId] } : null;
  },
  
  addFavoriteButtons() {
    const cards = document.querySelectorAll('.channel-card');
    cards.forEach(card => {
      const channelId = SmartSearch.getChannelId(card);
      if (channelId) {
        this.addFavoriteButton(card, channelId, Preferences.isFavorite(channelId));
      }
    });
  },
  
  addFavoriteButton(card, channelId, isFavorite) {
    // Remove existing favorite button
    const existingBtn = card.querySelector('.favorite-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `favorite-btn ${isFavorite ? 'active' : ''}`;
    favoriteBtn.innerHTML = isFavorite ? '⭐' : '☆';
    favoriteBtn.title = isFavorite ? ' ژێبرنا ژ دلخوازان' : ' زێدەکرن بۆ دڵخوازان';
    favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    
    favoriteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newState = Preferences.toggleFavorite(channelId);
      favoriteBtn.classList.toggle('active', newState);
      favoriteBtn.innerHTML = newState ? '⭐' : '☆';
      this.updateFavoritesDisplay();
      Analytics.track('favorite_toggle', { channelId, isFavorite: newState });
    });
    
    const overlay = card.querySelector('.overlay');
    if (overlay) {
      overlay.appendChild(favoriteBtn);
    }
  },
  
  updateFavoritesDisplay() {
    this.showFavoritesSection();
    // Update all favorite buttons
    const cards = document.querySelectorAll('.channel-card');
    cards.forEach(card => {
      const channelId = SmartSearch.getChannelId(card);
      if (channelId) {
        const isFavorite = Preferences.isFavorite(channelId);
        const btn = card.querySelector('.favorite-btn');
        if (btn) {
          btn.classList.toggle('active', isFavorite);
          btn.innerHTML = isFavorite ? '⭐' : '☆';
        }
      }
    });
  }
};

// Smart Recommendations
const Recommendations = {
  init() {
    this.showRecommendations();
  },
  
  showRecommendations() {
    const favorites = Preferences.getFavorites();
    const recent = History.getRecent(3);
    const popular = History.getMostViewed(3);
    
    // Add visual indicators to cards (excluding favorites badge since we have button now)
    const cards = document.querySelectorAll('.channel-card');
    cards.forEach(card => {
      const channelId = SmartSearch.getChannelId(card);
      const badges = [];
      
      if (recent.includes(channelId)) {
        badges.push('🕐');
      }
      if (popular.includes(channelId)) {
        badges.push('🔥');
      }
      
      if (badges.length > 0) {
        let badgeEl = card.querySelector('.channel-badge');
        if (!badgeEl) {
          badgeEl = document.createElement('div');
          badgeEl.className = 'channel-badge';
          card.querySelector('.overlay')?.appendChild(badgeEl);
        }
        badgeEl.textContent = badges.join(' ');
      }
    });
  }
};

// Performance Optimizer
const Performance = {
  init() {
    this.lazyLoadImages();
    this.preloadFavorites();
  },
  
  lazyLoadImages() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  },
  
  preloadFavorites() {
    const favorites = Preferences.getFavorites();
    favorites.slice(0, 3).forEach(channelId => {
      const card = document.querySelector(`a[href*="ch=${channelId}"]`);
      if (card) {
        const img = card.querySelector('img');
        if (img && !img.src) {
          img.src = img.dataset.src || img.src;
        }
      }
    });
  }
};

// Smart Error Handler
const ErrorHandler = {
  init() {
    this.handleImageErrors();
    this.handleVideoErrors();
  },
  
  handleImageErrors() {
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('error', function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%231a1a1a" width="400" height="225"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%236366f1" font-size="20" dy=".3em"%3Eکاناڵ%3C/text%3E%3C/svg%3E';
        this.alt = 'Image not available';
      });
    });
  },
  
  handleVideoErrors() {
    const iframe = document.getElementById('livePlayer');
    if (iframe) {
      iframe.addEventListener('error', () => {
        const container = iframe.closest('.video-wrapper');
        if (container) {
          container.innerHTML = `
            <div class="error-message">
              <p> پەخشێ بەردەست نینە</p>
              <button onclick="location.reload()"> ژ نوو هەول بده‌ </button>
            </div>
          `;
        }
      });
    }
  }
};

// Usage Analytics (Client-Side Only)
const Analytics = {
  track(event, data = {}) {
    const analytics = Storage.get('analytics', []);
    analytics.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    // Keep only last 100 events
    if (analytics.length > 100) {
      analytics.shift();
    }
    
    Storage.set('analytics', analytics);
  },
  
  getStats() {
    const analytics = Storage.get('analytics', []);
    const stats = {
      totalViews: analytics.filter(a => a.event === 'channel_view').length,
      totalSearches: analytics.filter(a => a.event === 'search').length,
      favoriteChannels: Preferences.getFavorites().length,
      sessionStart: Date.now()
    };
    return stats;
  }
};

// Channel Pulse System - Live Activity Visualization
const ChannelPulse = {
  init() {
    this.addPulseIndicators();
    this.startPulseAnimation();
  },
  
  addPulseIndicators() {
    const cards = document.querySelectorAll('.channel-card');
    cards.forEach(card => {
      const channelId = SmartSearch.getChannelId(card);
      const pulse = this.calculatePulse(channelId);
      
      const pulseIndicator = document.createElement('div');
      pulseIndicator.className = 'channel-pulse';
      pulseIndicator.setAttribute('data-pulse', pulse.level);
      pulseIndicator.innerHTML = `
        <div class="pulse-ring"></div>
        <div class="pulse-dot"></div>
        <span class="pulse-label">${pulse.label}</span>
      `;
      
      const overlay = card.querySelector('.overlay');
      if (overlay) {
        overlay.appendChild(pulseIndicator);
      }
    });
  },
  
  calculatePulse(channelId) {
    const history = History.get();
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Calculate activity based on viewing patterns
    const channelViews = history.filter(h => h.id === channelId);
    const recentViews = channelViews.filter(h => {
      const viewHour = new Date(h.timestamp).getHours();
      return Math.abs(viewHour - hour) <= 2;
    });
    
    // Simulate "live activity" based on patterns
    const baseActivity = channelViews.length * 10;
    const timeBonus = recentViews.length * 20;
    const randomVariation = Math.random() * 30;
    const activity = Math.min(100, baseActivity + timeBonus + randomVariation);
    
    let level, label, color;
    if (activity > 70) {
      level = 'high';
      label = 'گه‌له‌ك چالاك';
      color = '#10b981';
    } else if (activity > 40) {
      level = 'medium';
      label = 'چالاك';
      color = '#f59e0b';
    } else {
      level = 'low';
      label = 'هێمن';
      color = '#6b7280';
    }
    
    return { level, label, color, activity };
  },
  
  startPulseAnimation() {
    const pulses = document.querySelectorAll('.channel-pulse');
    pulses.forEach((pulse, index) => {
      const level = pulse.getAttribute('data-pulse');
      const delay = index * 0.1;
      
      pulse.style.setProperty('--pulse-delay', `${delay}s`);
      pulse.style.setProperty('--pulse-speed', level === 'high' ? '1s' : level === 'medium' ? '1.5s' : '2s');
      
      const ring = pulse.querySelector('.pulse-ring');
      const dot = pulse.querySelector('.pulse-dot');
      const data = this.calculatePulse(SmartSearch.getChannelId(pulse.closest('.channel-card')));
      
      if (ring) ring.style.borderColor = data.color;
      if (dot) dot.style.backgroundColor = data.color;
    });
  }
};

// Smart Viewing Timeline - Predictive Schedule
const ViewingTimeline = {
  init() {
    this.createTimeline();
    this.updateTimeline();
  },
  
  createTimeline() {
    const timeline = document.getElementById('viewingTimeline');
    if (!timeline) return;
    
    const content = document.getElementById('timelineContent');
    if (content) {
      content.style.display = 'none'; // Start collapsed
    }
    
    const toggle = document.getElementById('timelineToggle');
    if (toggle) {
      toggle.textContent = '▼'; // Start with down arrow
      toggle.addEventListener('click', () => {
        if (content) {
          const isHidden = content.style.display === 'none';
          content.style.display = isHidden ? 'block' : 'none';
          toggle.textContent = isHidden ? '▲' : '▼';
        }
      });
    }
  },
  
  updateTimeline() {
    const timeline = document.getElementById('viewingTimeline');
    const content = document.getElementById('timelineContent');
    if (!timeline || !content) return;
    
    const predictions = this.predictViewingSchedule();
    
    if (predictions.length > 0) {
      timeline.style.display = 'block';
      content.innerHTML = '';
      
      predictions.forEach(prediction => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'timeline-slot';
        timeSlot.innerHTML = `
          <div class="slot-time">${prediction.time}</div>
          <div class="slot-channels">
            ${prediction.channels.map(ch => `
              <div class="slot-channel" style="--channel-color: ${ch.color}">
                <span class="slot-channel-name">${ch.name}</span>
                <span class="slot-confidence">${ch.confidence}%</span>
              </div>
            `).join('')}
          </div>
        `;
        content.appendChild(timeSlot);
      });
    } else {
      timeline.style.display = 'none';
    }
  },
  
  predictViewingSchedule() {
    const history = History.get();
    if (history.length < 3) return [];
    
    const now = new Date();
    const hour = now.getHours();
    const predictions = [];
    
    // Analyze patterns for next 6 hours
    for (let i = 0; i < 6; i++) {
      const futureHour = (hour + i) % 24;
      const timeLabel = `${String(futureHour).padStart(2, '0')}:00`;
      
      // Find channels watched at similar times
      const similarTimeViews = history.filter(h => {
        const viewHour = new Date(h.timestamp).getHours();
        return Math.abs(viewHour - futureHour) <= 1;
      });
      
      if (similarTimeViews.length > 0) {
        const channelCounts = {};
        similarTimeViews.forEach(view => {
          channelCounts[view.id] = (channelCounts[view.id] || 0) + 1;
        });
        
        const topChannels = Object.entries(channelCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id, count]) => {
            const total = similarTimeViews.length;
            const confidence = Math.round((count / total) * 100);
            const channelName = this.getChannelName(id);
            const color = this.getChannelColor(id);
            return { id, name: channelName, confidence, color };
          });
        
        if (topChannels.length > 0) {
          predictions.push({ time: timeLabel, channels: topChannels });
        }
      }
    }
    
    return predictions;
  },
  
  getChannelName(id) {
    const names = {
      bein: 'beIN Sports', bein2: 'beIN Sports 2', bein3: 'beIN Sports 3',
      bein4: 'beIN Sports 4', bein5: 'beIN Sports 5', bein6: 'beIN Sports 6',
      bein7: 'beIN Sports 7', bein8: 'beIN Sports 8', bein9: 'beIN Sports 9',
      bein10: 'beIN Sports 10', bein11: 'beIN Sports 11', bein12: 'beIN Sports 12',
      duhok: 'duhok Sports', zaxo: 'zaxo Sports'
    };
    return names[id] || id;
  },
  
  getChannelColor(id) {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  }
};

// Channel DNA - Unique Personality Profiles
const ChannelDNA = {
  init() {
    this.addDNAVisualization();
  },
  
  addDNAVisualization() {
    const cards = document.querySelectorAll('.channel-card');
    cards.forEach(card => {
      const channelId = SmartSearch.getChannelId(card);
      const dna = this.calculateDNA(channelId);
      
      const dnaIndicator = document.createElement('div');
      dnaIndicator.className = 'channel-dna';
      dnaIndicator.innerHTML = `
        <div class="dna-strand">
          <div class="dna-segment" style="--dna-color: ${dna.colors[0]}; --dna-delay: 0s"></div>
          <div class="dna-segment" style="--dna-color: ${dna.colors[1]}; --dna-delay: 0.2s"></div>
          <div class="dna-segment" style="--dna-color: ${dna.colors[2]}; --dna-delay: 0.4s"></div>
        </div>
        <div class="dna-info">
          <span class="dna-trait">${dna.traits.join(' • ')}</span>
        </div>
      `;
      
      card.appendChild(dnaIndicator);
    });
  },
  
  calculateDNA(channelId) {
    const history = History.get();
    const channelViews = history.filter(h => h.id === channelId);
    const favorites = Preferences.getFavorites();
    const isFavorite = favorites.includes(channelId);
    
    // Generate unique DNA based on viewing patterns
    const viewCount = channelViews.length;
    const avgWatchTime = channelViews.length > 0 ? 
      channelViews.reduce((sum, v) => sum + (Date.now() - v.timestamp), 0) / channelViews.length : 0;
    
    // DNA traits based on patterns
    const traits = [];
    if (isFavorite) traits.push('دڵخواز');
    if (viewCount > 5) traits.push(' گه‌له‌كا دیتى');
    if (viewCount > 0 && viewCount <= 2) traits.push('نوی');
    if (avgWatchTime < 86400000) traits.push('نێزیک');
    
    // Generate unique color combination
    const colorPalettes = [
      ['#6366f1', '#8b5cf6', '#ec4899'],
      ['#10b981', '#06b6d4', '#3b82f6'],
      ['#f59e0b', '#ef4444', '#f97316'],
      ['#8b5cf6', '#ec4899', '#f43f5e']
    ];
    const paletteIndex = channelId.charCodeAt(0) % colorPalettes.length;
    const colors = colorPalettes[paletteIndex];
    
    return { traits: traits.length > 0 ? traits : ['نه‌ناس'], colors };
  }
};

// Channel Roulette - Fun Random Picker
const ChannelRoulette = {
  init() {
    this.createRouletteButton();
  },
  
  createRouletteButton() {
    const header = document.querySelector('header .header-actions');
    if (!header) return;
    
    const rouletteBtn = document.createElement('button');
    rouletteBtn.className = 'roulette-btn';
    rouletteBtn.innerHTML = '🎲';
    rouletteBtn.title = ' کانالا بێسه‌رووبه‌ر';
    rouletteBtn.setAttribute('aria-label', 'Random Channel');
    
    rouletteBtn.addEventListener('click', () => {
      this.spin();
    });
    
    header.appendChild(rouletteBtn);
  },
  
  spin() {
    const cards = Array.from(document.querySelectorAll('.channel-card'));
    if (cards.length === 0) return;
    
    // Create spinning effect
    const overlay = document.createElement('div');
    overlay.className = 'roulette-overlay';
    overlay.innerHTML = `
      <div class="roulette-spinner">
        <div class="spinner-text">🎲</div>
        <div class="spinner-text">🎲</div>
        <div class="spinner-text">🎲</div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Random selection with animation
    let currentIndex = 0;
    const iterations = 20;
    let iteration = 0;
    
    const interval = setInterval(() => {
      cards.forEach(c => c.classList.remove('roulette-highlight'));
      currentIndex = (currentIndex + 1) % cards.length;
      cards[currentIndex].classList.add('roulette-highlight');
      
      iteration++;
      if (iteration >= iterations) {
        clearInterval(interval);
        setTimeout(() => {
          const selectedCard = cards[currentIndex];
          cards.forEach(c => c.classList.remove('roulette-highlight'));
          overlay.remove();
          
          // Scroll to and highlight selected card
          selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          selectedCard.classList.add('roulette-selected');
          setTimeout(() => {
            selectedCard.classList.remove('roulette-selected');
            selectedCard.click();
          }, 1500);
        }, 500);
      }
    }, 100);
  }
};

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  // Initialize preferences
  Preferences.init();
  
  // Setup theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      Preferences.toggleTheme();
      Analytics.track('theme_toggle');
    });
  }
  
  // Track channel views
  const channelLinks = document.querySelectorAll('.channel-card, a[href*="live.html"]');
  channelLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.href || link.closest('a')?.href;
      if (href) {
        const match = href.match(/[?&]ch=([^&]+)/);
        if (match) {
          const channelId = match[1];
          const channelName = link.querySelector('h3')?.textContent || channelId;
          History.add(channelId, channelName);
          Analytics.track('channel_view', { channelId, channelName });
        }
      }
    });
  });
  
  // Initialize smart features
  if (document.querySelector('.channel-grid')) {
    SmartSearch.init();
    Recommendations.init();
    ChannelPulse.init();
    ChannelDNA.init();
    ChannelRoulette.init();
    ViewingTimeline.init();
  }
  FavoritesManager.init();
  Performance.init();
  ErrorHandler.init();
  
  // Update timeline periodically
  if (document.querySelector('.channel-grid')) {
    setInterval(() => {
      ViewingTimeline.updateTimeline();
      ChannelPulse.startPulseAnimation();
    }, 30000); // Update every 30 seconds
  }
  
  // Track page view
  Analytics.track('page_view', { 
    page: window.location.pathname,
    referrer: document.referrer 
  });
  
  console.log('🧠 Intelligent TV App initialized');
  console.log('📊 Stats:', Analytics.getStats());
});

// Video wrapper functionality
const videoWrapper = document.querySelector('.video-wrapper');
if (videoWrapper) {
  videoWrapper.addEventListener('click', () => {
    videoWrapper.classList.add('expanded');
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
      videoWrapper.classList.remove('expanded');
    }
  });
}

// Location System - REMOVED
/*const LocationSystem = {
  currentLocation: null,
  db: null,
  
  async init() {
    if (typeof firebase === 'undefined') {
      console.error('Firebase is not loaded');
      return;
    }
    
    try {
      this.db = firebase.firestore();
      await this.getUserLocation();
    } catch (error) {
      console.error('Location system error:', error);
    }
  },
  
  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported');
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          this.currentLocation = location;
          
          // Get location name (city/country) using reverse geocoding
          try {
            const locationName = await this.getLocationName(location.latitude, location.longitude);
            location.name = locationName;
          } catch (error) {
            console.warn('Could not get location name:', error);
            location.name = 'Unknown';
          }
          
          // Save location to Firebase if user is authenticated
          if (AuthSystem.currentUser) {
            await this.saveLocationToFirebase(location);
          }
          
          this.updateLocationUI();
          resolve(location);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },
  
  async getLocationName(lat, lng) {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'KurdTV-App'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        // Try to get city, town, or village name
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const country = addr.country || '';
        return city ? `${city}, ${country}` : country || 'Unknown';
      }
      
      return 'Unknown';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown';
    }
  },
  
  async saveLocationToFirebase(location) {
    if (!this.db || !AuthSystem.currentUser) return;
    
    try {
      const userRef = this.db.collection('users').doc(AuthSystem.currentUser.uid);
      await userRef.set({
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Location saved to Firebase');
    } catch (error) {
      console.error('Error saving location:', error);
    }
  },
  
  async loadLocationFromFirebase() {
    if (!this.db || !AuthSystem.currentUser) return null;
    
    try {
      const userDoc = await this.db.collection('users').doc(AuthSystem.currentUser.uid).get();
      if (userDoc.exists && userDoc.data().location) {
        this.currentLocation = userDoc.data().location;
        this.updateLocationUI();
        return this.currentLocation;
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
    return null;
  },
  
  updateLocationUI() {
    const locationDisplay = document.getElementById('userLocation');
    if (locationDisplay && this.currentLocation && this.currentLocation.name) {
      locationDisplay.textContent = `📍 ${this.currentLocation.name}`;
      locationDisplay.style.display = 'inline';
    }
  }
};

// Authentication System
const AuthSystem = {
  auth: null,
  db: null,
  currentUser: null,
  isInitialized: false,
  phoneVerificationId: null,
  userPhoneNumber: null,
  
  async init() {
    if (typeof firebase === 'undefined') {
      console.error('Firebase is not loaded');
      return;
    }
    
    try {
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      
      // Listen for auth state changes
      this.auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        
        // Load user phone number from Firestore
        if (user) {
          await this.loadUserPhoneNumber();
          await this.updateUI();
          
          // Load user location from Firebase if authenticated
          await LocationSystem.loadLocationFromFirebase();
          // Get fresh location if not available
          if (!LocationSystem.currentLocation) {
            await LocationSystem.getUserLocation();
          }
          
          // Check phone number and enable/disable features
          this.checkPhoneNumberAndUpdateAccess();
          
          // Initialize chat when user is authenticated and has phone
          if (user && this.userPhoneNumber && ChatSystem.isInitialized === false) {
            ChatSystem.init();
          }
        } else {
          this.userPhoneNumber = null;
          this.updateUI();
          this.checkPhoneNumberAndUpdateAccess();
        }
      });
      
      this.setupAuthUI();
      this.isInitialized = true;
      
      // Initialize location system
      LocationSystem.init();
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  },
  
  setupAuthUI() {
    const showLoginBtn = document.getElementById('showLoginBtn');
    const authModal = document.getElementById('authModal');
    const authCloseBtn = document.getElementById('authCloseBtn');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const authForm = document.getElementById('authForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Show login modal
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => {
        this.showModal('login');
      });
    }
    
    // Close modal
    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', () => {
        this.hideModal();
      });
    }
    
    // Close on background click
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
          this.hideModal();
        }
      });
    }
    
    // Tab switching
    if (loginTab && registerTab) {
      [loginTab, registerTab].forEach(tab => {
        tab.addEventListener('click', () => {
          const mode = tab.dataset.mode;
          this.switchMode(mode);
        });
      });
    }
    
    // Form submission
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit();
      });
    }
    
    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  },
  
  showModal(mode = 'login') {
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.style.display = 'flex';
      this.switchMode(mode);
    }
  },
  
  hideModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.style.display = 'none';
      this.clearForm();
    }
  },
  
  switchMode(mode) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const authTitle = document.getElementById('authTitle');
    const authSubmitText = document.getElementById('authSubmitText');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const displayNameGroup = document.getElementById('displayNameGroup');
    const verificationGroup = document.getElementById('verificationCodeGroup');
    const phoneGroup = document.getElementById('phoneNumberGroup');
    const authPassword = document.getElementById('authPassword');
    
    // Reset verification step
    if (verificationGroup) verificationGroup.style.display = 'none';
    if (phoneGroup) phoneGroup.style.display = 'flex';
    
    if (mode === 'login') {
      if (loginTab) loginTab.classList.add('active');
      if (registerTab) registerTab.classList.remove('active');
      if (authTitle) authTitle.textContent = 'چوونەژوورەوە';
      if (authSubmitText) authSubmitText.textContent = 'چوونەژوورەوە';
      if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
      if (displayNameGroup) displayNameGroup.style.display = 'none';
      if (authPassword) authPassword.required = true;
    } else {
      if (loginTab) loginTab.classList.remove('active');
      if (registerTab) registerTab.classList.add('active');
      if (authTitle) authTitle.textContent = 'خۆتۆمارکردن';
      if (authSubmitText) authSubmitText.textContent = 'خۆتۆمارکردن';
      if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'flex';
      if (displayNameGroup) displayNameGroup.style.display = 'flex';
      if (authPassword) authPassword.required = true;
    }
    
    this.clearError();
  },
  
  async handleSubmit() {
    const loginTab = document.getElementById('loginTab');
    const isLogin = loginTab?.classList.contains('active');
    const email = document.getElementById('authEmail')?.value.trim();
    const password = document.getElementById('authPassword')?.value;
    const confirmPassword = document.getElementById('authConfirmPassword')?.value;
    const displayName = document.getElementById('authDisplayName')?.value.trim();
    const phoneNumber = document.getElementById('authPhoneNumber')?.value.trim();
    const verificationCode = document.getElementById('authVerificationCode')?.value.trim();
    const submitBtn = document.getElementById('authSubmitBtn');
    const loading = document.getElementById('authLoading');
    
    // Check if we're in verification step
    const verificationGroup = document.getElementById('verificationCodeGroup');
    if (verificationGroup && verificationGroup.style.display !== 'none') {
      // Verify code
      if (!verificationCode) {
        this.showError('تکایە کۆدی پشتڕاستکردنەوە بنووسە');
        return;
      }
      
      if (submitBtn) submitBtn.disabled = true;
      if (loading) loading.style.display = 'inline';
      
      try {
        await this.verifyPhoneCode(verificationCode);
        this.hideModal();
      } catch (error) {
        this.handleAuthError(error);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (loading) loading.style.display = 'none';
      }
      return;
    }
    
    if (!email || !password || !phoneNumber) {
      this.showError('تکایە هەموو خانەکان پڕ بکەوە');
      return;
    }
    
    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      this.showError('ژمارەی تەلەفۆن نادروستە. نموونە: +9647501234567');
      return;
    }
    
    if (!isLogin) {
      if (password !== confirmPassword) {
        this.showError('تێپەڕەوشەکان یەکسان نین');
        return;
      }
      if (password.length < 6) {
        this.showError('تێپەڕەوشە دەبێت لانیکەم ٦ پیت بێت');
        return;
      }
    }
    
    // Show loading
    if (submitBtn) submitBtn.disabled = true;
    if (loading) loading.style.display = 'inline';
    
    try {
      if (isLogin) {
        await this.login(email, password, cleanPhone);
      } else {
        await this.register(email, password, displayName, cleanPhone);
      }
      
      // After login/register, send verification code
      await this.sendPhoneVerification(cleanPhone);
      
      // Show verification code input
      this.showVerificationStep();
    } catch (error) {
      this.handleAuthError(error);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (loading) loading.style.display = 'none';
    }
  },
  
  async sendPhoneVerification(phoneNumber) {
    try {
      // For now, we'll store phone number temporarily (Firebase Phone Auth requires backend)
      // In production, you'd use: const confirmationResult = await this.auth.signInWithPhoneNumber(phoneNumber);
      
      // Simulate verification for demo (in production, use Firebase Phone Auth)
      this.phoneVerificationId = 'demo-' + Date.now();
      this.userPhoneNumber = phoneNumber;
      
      // Don't save phone number to Firestore - keep it only in memory
      // This allows access but doesn't persist the phone number
      
      // For demo: auto-verify (in production, require actual SMS code)
      this.checkPhoneNumberAndUpdateAccess();
      
      console.log('✅ Phone number verified (not saved):', phoneNumber);
    } catch (error) {
      console.error('Error sending verification:', error);
      throw error;
    }
  },
  
  async verifyPhoneCode(code) {
    // In production, verify with Firebase: await confirmationResult.confirm(code);
    // For demo, accept any 6-digit code
    if (code.length === 6) {
      // Don't save phone number to Firestore - keep it only in memory
      // Phone number will be cleared on logout or page refresh
      this.checkPhoneNumberAndUpdateAccess();
      
      // Clear phone number from form
      const phoneInput = document.getElementById('authPhoneNumber');
      if (phoneInput) phoneInput.value = '';
      
      return true;
    } else {
      throw new Error('کۆد نادروستە');
    }
  },
  
  showVerificationStep() {
    const verificationGroup = document.getElementById('verificationCodeGroup');
    const phoneGroup = document.getElementById('phoneNumberGroup');
    const submitText = document.getElementById('authSubmitText');
    const resendBtn = document.getElementById('resendCodeBtn');
    
    if (verificationGroup) verificationGroup.style.display = 'flex';
    if (phoneGroup) phoneGroup.style.display = 'none';
    if (submitText) submitText.textContent = 'پشتڕاستکردنەوە';
    if (resendBtn) resendBtn.style.display = 'block';
  },
  
  async loadUserPhoneNumber() {
    // Don't load phone number from Firebase - it should not persist
    // Phone number must be entered fresh each session
    this.userPhoneNumber = null;
  },
  
  checkPhoneNumberAndUpdateAccess() {
    const hasPhone = !!this.userPhoneNumber;
    const channelGrid = document.getElementById('channelGrid');
    const phoneRequiredMessage = document.getElementById('phoneRequiredMessage');
    const channelCards = document.querySelectorAll('.channel-card');
    const videoWrapper = document.querySelector('.video-wrapper');
    const livePlayer = document.getElementById('livePlayer');
    
    // Show/hide channels based on phone number
    if (channelGrid) {
      channelGrid.style.display = hasPhone ? 'grid' : 'none';
    }
    
    if (phoneRequiredMessage) {
      phoneRequiredMessage.style.display = hasPhone ? 'none' : 'flex';
    }
    
    // Disable channel cards if no phone
    channelCards.forEach(card => {
      if (!hasPhone) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
        card.style.cursor = 'not-allowed';
        // Prevent navigation
        card.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          alert('تکایە ژمارەی تەلەفۆنەکەت پشتڕاست بکەوە بۆ بینینی کاناڵەکان');
          this.showModal('register');
        }, true);
      } else {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        card.style.cursor = 'pointer';
      }
    });
    
    // Block video player on live.html if no phone
    if (videoWrapper && livePlayer) {
      if (!hasPhone) {
        videoWrapper.style.opacity = '0.5';
        videoWrapper.style.pointerEvents = 'none';
        livePlayer.style.display = 'none';
        
        // Show message overlay
        let overlay = document.getElementById('phoneRequiredOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'phoneRequiredOverlay';
          overlay.className = 'phone-required-overlay';
          overlay.innerHTML = `
            <div class="phone-required-content">
              <div class="phone-icon">📱</div>
              <h3>ژمارەی تەلەفۆن پێویستە</h3>
              <p>بۆ بینینی کاناڵەکان، تکایە ژمارەی تەلەفۆنەکەت پشتڕاست بکەوە</p>
              <button class="phone-verify-btn" onclick="AuthSystem.showModal('register')">
                پشتڕاستکردنی ژمارەی تەلەفۆن
              </button>
            </div>
          `;
          videoWrapper.appendChild(overlay);
        }
        overlay.style.display = 'flex';
      } else {
        videoWrapper.style.opacity = '1';
        videoWrapper.style.pointerEvents = 'auto';
        livePlayer.style.display = 'block';
        const overlay = document.getElementById('phoneRequiredOverlay');
        if (overlay) overlay.style.display = 'none';
      }
    }
    
    // Update chat access
    if (!hasPhone) {
      const chatInput = document.getElementById('chatInput');
      const fullChatInput = document.getElementById('fullChatInput');
      if (chatInput) {
        chatInput.placeholder = 'تکایە ژمارەی تەلەفۆنەکەت پشتڕاست بکەوە...';
        chatInput.disabled = true;
      }
      if (fullChatInput) {
        fullChatInput.placeholder = 'تکایە ژمارەی تەلەفۆنەکەت پشتڕاست بکەوە...';
        fullChatInput.disabled = true;
      }
    } else {
      const chatInput = document.getElementById('chatInput');
      const fullChatInput = document.getElementById('fullChatInput');
      if (chatInput) {
        chatInput.placeholder = 'نامەکەت بنووسە...';
        chatInput.disabled = false;
      }
      if (fullChatInput) {
        fullChatInput.placeholder = 'نامەکەت بنووسە...';
        fullChatInput.disabled = false;
      }
    }
  },
  
  async login(email, password, phoneNumber = null) {
    const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
    this.currentUser = userCredential.user;
    
    // Load existing phone number or use provided one
    await this.loadUserPhoneNumber();
    
    // If phone number provided and different, update it
    if (phoneNumber && phoneNumber !== this.userPhoneNumber) {
      await this.sendPhoneVerification(phoneNumber);
      this.showVerificationStep();
      return userCredential;
    }
    
    // Update user's last login and location
    if (this.db && this.currentUser) {
      try {
        const updateData = {
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update location if available
        if (LocationSystem.currentLocation) {
          updateData.location = {
            latitude: LocationSystem.currentLocation.latitude,
            longitude: LocationSystem.currentLocation.longitude,
            name: LocationSystem.currentLocation.name,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
        }
        
        await this.db.collection('users').doc(this.currentUser.uid).set(updateData, { merge: true });
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    }
    
    // Get location if not available
    if (!LocationSystem.currentLocation) {
      await LocationSystem.getUserLocation();
    }
    
    // Check phone number access
    this.checkPhoneNumberAndUpdateAccess();
    
    return userCredential;
  },
  
  async register(email, password, displayName, phoneNumber) {
    const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
    
    // Update display name
    if (displayName && userCredential.user) {
      await userCredential.user.updateProfile({
        displayName: displayName
      });
    }
    
    this.currentUser = userCredential.user;
    
    // Create user document in Firestore WITHOUT phone number
    if (this.db && this.currentUser) {
      try {
        const userData = {
          email: email,
          displayName: displayName || email.split('@')[0],
          // Don't save phoneNumber - it should not persist
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add location if available
        if (LocationSystem.currentLocation) {
          userData.location = {
            latitude: LocationSystem.currentLocation.latitude,
            longitude: LocationSystem.currentLocation.longitude,
            name: LocationSystem.currentLocation.name,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
        }
        
        await this.db.collection('users').doc(this.currentUser.uid).set(userData);
        console.log('✅ User profile created in Firestore (without phone number)');
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    }
    
    // Get location after registration
    if (LocationSystem.currentLocation) {
      await LocationSystem.saveLocationToFirebase(LocationSystem.currentLocation);
    } else {
      await LocationSystem.getUserLocation();
    }
    
    return userCredential;
  },
  
  async logout() {
    try {
      await this.auth.signOut();
      this.currentUser = null;
      this.userPhoneNumber = null; // Clear phone number on logout
      this.phoneVerificationId = null;
      
      // Stop chat listener
      if (ChatSystem.messagesListener) {
        ChatSystem.messagesListener();
        ChatSystem.messagesListener = null;
      }
      
      // Update access after logout
      this.checkPhoneNumberAndUpdateAccess();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  async updateUI() {
    const showLoginBtn = document.getElementById('showLoginBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userLocation = document.getElementById('userLocation');
    
    if (this.currentUser) {
      // User is logged in
      if (showLoginBtn) showLoginBtn.style.display = 'none';
      if (userProfile) userProfile.style.display = 'flex';
      if (userName) {
        const name = this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'بەکارهێنەر';
        userName.textContent = name;
      }
      
      // Load and display user location
      if (userLocation) {
        // Try to load from Firebase first
        const savedLocation = await LocationSystem.loadLocationFromFirebase();
        if (!savedLocation && !LocationSystem.currentLocation) {
          // Get fresh location
          await LocationSystem.getUserLocation();
        }
        LocationSystem.updateLocationUI();
      }
      
      // Load user data from Firestore
      await this.loadUserData();
      
      // Initialize chat if not already initialized and has phone
      if (!ChatSystem.isInitialized && this.userPhoneNumber) {
        ChatSystem.init();
      } else {
        // Update chat inputs
        ChatSystem.updateChatInputs();
      }
      
      // Check phone number access
      this.checkPhoneNumberAndUpdateAccess();
    } else {
      // User is not logged in
      if (showLoginBtn) showLoginBtn.style.display = 'flex';
      if (userProfile) userProfile.style.display = 'none';
      if (userLocation) userLocation.style.display = 'none';
      
      // Update chat to show login prompt
      ChatSystem.updateChatInputs();
      ChatSystem.showWelcomeMessage();
      
      // Hide channels
      this.checkPhoneNumberAndUpdateAccess();
    }
  },
  
  async loadUserData() {
    if (!this.db || !this.currentUser) return;
    
    try {
      const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('✅ User data loaded:', userData);
        
        // Update location if available
        if (userData.location) {
          LocationSystem.currentLocation = userData.location;
          LocationSystem.updateLocationUI();
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  },
  
  showError(message) {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  },
  
  clearError() {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';
    }
  },
  
  clearForm() {
    const authForm = document.getElementById('authForm');
    const verificationGroup = document.getElementById('verificationCodeGroup');
    const phoneGroup = document.getElementById('phoneNumberGroup');
    const phoneInput = document.getElementById('authPhoneNumber');
    const verificationInput = document.getElementById('authVerificationCode');
    
    if (authForm) {
      authForm.reset();
      this.clearError();
    }
    
    // Explicitly clear phone number field
    if (phoneInput) phoneInput.value = '';
    if (verificationInput) verificationInput.value = '';
    
    // Reset verification step
    if (verificationGroup) verificationGroup.style.display = 'none';
    if (phoneGroup) phoneGroup.style.display = 'flex';
    
    const submitText = document.getElementById('authSubmitText');
    if (submitText) {
      const loginTab = document.getElementById('loginTab');
      submitText.textContent = loginTab?.classList.contains('active') ? 'چوونەژوورەوە' : 'خۆتۆمارکردن';
    }
  },
  
  handleAuthError(error) {
    let errorMessage = 'هەڵەیەک ڕوویدا';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'ئیمەیڵ پێشتر بەکارهاتووە';
        break;
      case 'auth/invalid-email':
        errorMessage = 'ئیمەیڵ نادروستە';
        break;
      case 'auth/weak-password':
        errorMessage = 'تێپەڕەوشە زۆر لاوازە';
        break;
      case 'auth/user-not-found':
        errorMessage = 'بەکارهێنەر نەدۆزرایەوە';
        break;
      case 'auth/wrong-password':
        errorMessage = 'تێپەڕەوشە هەڵەیە';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'هەوڵی زۆر داوە، تکایە دواتر هەوڵ بدەوە';
        break;
      default:
        errorMessage = error.message || 'هەڵەیەک ڕوویدا';
    }
    
    this.showError(errorMessage);
  }
};

// Firebase Chat System - Real-time Group Chat
const ChatSystem = {
  db: null,
  auth: null,
  currentUser: null,
  messagesListener: null,
  isInitialized: false,
  
  async init() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      console.error('Firebase is not loaded. Please check firebase-config.js');
      this.fallbackToLocalStorage();
      return;
    }
    
    // Check if user is authenticated
    if (!AuthSystem.currentUser) {
      console.log('User not authenticated, chat disabled');
      return;
    }
    
    try {
      // Initialize Firebase services
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      this.currentUser = AuthSystem.currentUser;
      
      // Setup chat UI
      this.setupChat();
      this.setupEventListeners();
      
      // Setup real-time listener
      this.setupRealtimeListener();
      
      // Generate welcome message if first time
      this.checkWelcomeMessage();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.fallbackToLocalStorage();
    }
  },
  
  fallbackToLocalStorage() {
    console.warn('Falling back to localStorage (Firebase not configured)');
    this.setupChat();
    this.loadMessages();
    this.setupEventListeners();
    this.generateWelcomeMessages();
  },
  
  setupChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatClose = document.getElementById('chatClose');
    const chatPanel = document.getElementById('chatPanel');
    
    if (chatToggle) {
      chatToggle.addEventListener('click', () => {
        chatPanel?.classList.toggle('active');
        const input = document.getElementById('chatInput');
        if (chatPanel?.classList.contains('active') && input) {
          setTimeout(() => input.focus(), 100);
        }
      });
    }
    
    if (chatClose) {
      chatClose.addEventListener('click', () => {
        chatPanel?.classList.remove('active');
      });
    }
  },
  
  setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const fullChatInput = document.getElementById('fullChatInput');
    const fullChatSend = document.getElementById('fullChatSend');
    
    // Regular chat input
    if (chatInput && chatSend) {
      const sendMessage = async () => {
        if (!AuthSystem.currentUser) {
          AuthSystem.showModal('login');
          return;
        }
        const message = chatInput.value.trim();
        if (message) {
          await this.sendMessage(message);
          chatInput.value = '';
        }
      };
      
      chatSend.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Update placeholder based on auth state
      this.updateChatInputs();
    }
    
    // Full chat input
    if (fullChatInput && fullChatSend) {
      const sendMessage = async () => {
        if (!AuthSystem.currentUser) {
          AuthSystem.showModal('login');
          return;
        }
        const message = fullChatInput.value.trim();
        if (message) {
          await this.sendMessage(message);
          fullChatInput.value = '';
        }
      };
      
      fullChatSend.addEventListener('click', sendMessage);
      fullChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  },
  
  updateChatInputs() {
    const chatInput = document.getElementById('chatInput');
    const fullChatInput = document.getElementById('fullChatInput');
    const placeholder = AuthSystem.currentUser 
      ? 'نامەکەت بنووسە...' 
      : 'تکایە چوونەژوورەوە بکە بۆ ناردنی نامە...';
    
    if (chatInput) {
      chatInput.placeholder = placeholder;
      chatInput.disabled = !AuthSystem.currentUser;
    }
    if (fullChatInput) {
      fullChatInput.placeholder = placeholder;
      fullChatInput.disabled = !AuthSystem.currentUser;
    }
  },
  
  async sendMessage(text) {
    // Check if user is authenticated
    if (!AuthSystem.currentUser) {
      AuthSystem.showModal('login');
      return;
    }
    
    if (!this.isInitialized || !this.db) {
      // Fallback to localStorage
      const message = {
        id: Date.now().toString(),
        text: text,
        user: this.getUserName(),
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('ku', { hour: '2-digit', minute: '2-digit' })
      };
      
      const messages = Storage.get('chatMessages', []);
      messages.push(message);
      if (messages.length > 100) messages.shift();
      Storage.set('chatMessages', messages);
      this.displayMessage(message);
      this.updateBadge();
      return;
    }
    
    try {
      const user = AuthSystem.currentUser;
      const displayName = user.displayName || user.email?.split('@')[0] || 'بەکارهێنەر';
      
      const messageData = {
        text: text,
        username: displayName,
        userId: user.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: Date.now()
      };
      
      // Add location if available
      if (LocationSystem.currentLocation) {
        messageData.location = {
          name: LocationSystem.currentLocation.name || 'Unknown',
          latitude: LocationSystem.currentLocation.latitude,
          longitude: LocationSystem.currentLocation.longitude
        };
      }
      
      await this.db.collection('messages').add(messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.code === 'permission-denied') {
        alert('تکایە چوونەژوورەوە بکە بۆ ناردنی نامە');
      }
    }
  },
  
  setupRealtimeListener() {
    if (!this.db) return;
    
    // Remove existing listener if any
    if (this.messagesListener) {
      this.messagesListener();
    }
    
    const lastView = Storage.get('lastChatView', 0);
    let unreadCount = 0;
    
    // Listen for new messages in real-time
    this.messagesListener = this.db
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .onSnapshot((snapshot) => {
        const messagesContainer = document.getElementById('chatMessages');
        const fullChatMessages = document.getElementById('fullChatMessages');
        
        if (!messagesContainer && !fullChatMessages) return;
        
        // Clear existing messages
        if (messagesContainer) messagesContainer.innerHTML = '';
        if (fullChatMessages) fullChatMessages.innerHTML = '';
        
        if (snapshot.empty) {
          this.showWelcomeMessage();
          Storage.set('unreadCount', 0);
          this.updateBadge();
          return;
        }
        
        // Process messages (reverse to show oldest first)
        const messages = [];
        unreadCount = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp?.toMillis() || data.createdAt || Date.now();
          const isNew = timestamp > lastView;
          
          if (isNew && data.userId !== this.currentUser?.uid) {
            unreadCount++;
          }
          
          messages.push({
            id: doc.id,
            text: data.text || '',
            username: data.username || 'بەکارهێنەر',
            userId: data.userId || 'anonymous',
            timestamp: timestamp,
            isOwn: data.userId === this.currentUser?.uid,
            location: data.location || null
          });
        });
        
        // Sort by timestamp (oldest first)
        messages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Display messages
        messages.forEach(msg => {
          this.displayMessage(msg, false);
          this.displayFullChatMessage(msg, false);
        });
        
        // Update unread count
        Storage.set('unreadCount', unreadCount);
        
        this.scrollToBottom();
        this.updateBadge();
      }, (error) => {
        console.error('Error listening to messages:', error);
      });
  },
  
  displayMessage(message, scroll = true) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    // Check if message already exists
    if (document.getElementById(`msg-${message.id}`)) return;
    
    const time = new Date(message.timestamp);
    const timeStr = time.toLocaleTimeString('ku', { hour: '2-digit', minute: '2-digit' });
    
    const locationBadge = message.location && message.location.name 
      ? `<span class="message-location">📍 ${this.escapeHtml(message.location.name)}</span>` 
      : '';
    
    const messageEl = document.createElement('div');
    messageEl.id = `msg-${message.id}`;
    messageEl.className = `chat-message ${message.isOwn ? 'own' : 'other'}`;
    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-user">${this.escapeHtml(message.username)}</span>
        ${locationBadge}
        <span class="message-time">${timeStr}</span>
      </div>
      <div class="message-text">${this.escapeHtml(message.text)}</div>
    `;
    
    messagesContainer.appendChild(messageEl);
    if (scroll) {
      this.scrollToBottom();
    }
  },
  
  displayFullChatMessage(message, scroll = true) {
    const fullChatMessages = document.getElementById('fullChatMessages');
    if (!fullChatMessages) return;
    
    // Check if message already exists
    if (document.getElementById(`full-msg-${message.id}`)) return;
    
    const time = new Date(message.timestamp);
    const timeStr = time.toLocaleTimeString('ku', { hour: '2-digit', minute: '2-digit' });
    
    const locationBadge = message.location && message.location.name 
      ? `<div class="chat-location">📍 ${this.escapeHtml(message.location.name)}</div>` 
      : '';
    
    const messageDiv = document.createElement('div');
    messageDiv.id = `full-msg-${message.id}`;
    messageDiv.className = `chat-message ${message.isOwn ? 'own' : 'other'}`;
    messageDiv.innerHTML = `
      <div class="chat-username">${this.escapeHtml(message.username)}</div>
      ${locationBadge}
      <div class="chat-message-content">${this.escapeHtml(message.text)}</div>
      <div class="chat-timestamp">${timeStr}</div>
    `;
    
    fullChatMessages.appendChild(messageDiv);
    if (scroll) {
      fullChatMessages.scrollTop = fullChatMessages.scrollHeight;
    }
  },
  
  showWelcomeMessage() {
    const messagesContainer = document.getElementById('chatMessages');
    const fullChatMessages = document.getElementById('fullChatMessages');
    
    if (!AuthSystem.currentUser) {
      const loginHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: var(--spacing-xl);">
          <p style="font-size: 1.125rem; margin-bottom: var(--spacing-md);">🔐 چوونەژوورەوە بکە</p>
          <p style="font-size: 0.875rem; margin-bottom: var(--spacing-lg);">بۆ بەکارهێنانی چات، تکایە چوونەژوورەوە بکە</p>
          <button onclick="AuthSystem.showModal('login')" style="padding: var(--spacing-sm) var(--spacing-lg); background: var(--accent); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">
            چوونەژوورەوە
          </button>
        </div>
      `;
      if (messagesContainer) messagesContainer.innerHTML = loginHTML;
      if (fullChatMessages) fullChatMessages.innerHTML = loginHTML;
      return;
    }
    
    const welcomeHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: var(--spacing-xl);">
        <p style="font-size: 1.125rem; margin-bottom: var(--spacing-sm);">💬 بەخێربێیت بۆ چاتی گروپ!</p>
        <p style="font-size: 0.875rem;">یەکەم نامەکەت بنووسە...</p>
      </div>
    `;
    
    if (messagesContainer) messagesContainer.innerHTML = welcomeHTML;
    if (fullChatMessages) fullChatMessages.innerHTML = welcomeHTML;
  },
  
  checkWelcomeMessage() {
    if (!this.db) return;
    
    // Check if there are any messages
    this.db.collection('messages')
      .limit(1)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          // Add welcome message
          this.db.collection('messages').add({
            text: 'بەخێربێیت بۆ چاتی گروپ! 👋 لێرە دەتوانیت لەگەڵ هەموو بینەران قسە بکەیت',
            username: 'سیستەم',
            userId: 'system',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: Date.now()
          });
        }
      });
  },
  
  getUserName() {
    if (AuthSystem.currentUser) {
      return AuthSystem.currentUser.displayName || 
             AuthSystem.currentUser.email?.split('@')[0] || 
             'بەکارهێنەر';
    }
    
    let userName = Storage.get('userName');
    if (!userName) {
      const names = ['بەکارهێنەر', 'بینەر', 'هاوڕێ', 'یاریزان'];
      userName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
      Storage.set('userName', userName);
    }
    return userName;
  },
  
  getMessages() {
    // For badge calculation, we'll use a cached version
    return Storage.get('chatMessages', []);
  },
  
  loadMessages() {
    // This is now handled by real-time listener
    // Keep for fallback compatibility
    const messages = Storage.get('chatMessages', []);
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    messages.forEach(msg => this.displayMessage(msg, false));
    this.scrollToBottom();
    this.updateBadge();
  },
  
  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  },
  
  updateBadge() {
    const badge = document.getElementById('chatBadge');
    const navBadge = document.getElementById('navChatBadge');
    const chatPanel = document.getElementById('chatPanel');
    const fullChatView = document.getElementById('fullChatView');
    const isChatOpen = chatPanel?.classList.contains('active') || fullChatView?.style.display === 'flex';
    
    // Get unread count from storage (updated by real-time listener)
    let unreadCount = Storage.get('unreadCount', 0);
    
    // If chat is open, reset unread count
    if (isChatOpen) {
      unreadCount = 0;
      Storage.set('unreadCount', 0);
      Storage.set('lastChatView', Date.now());
    }
    
    if (badge) {
      if (unreadCount > 0 && !isChatOpen) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
    
    if (navBadge) {
      if (unreadCount > 0 && !isChatOpen) {
        navBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        navBadge.style.display = 'flex';
      } else {
        navBadge.style.display = 'none';
      }
    }
  },
  
  generateWelcomeMessages() {
    // Fallback welcome messages for localStorage
    const messages = Storage.get('chatMessages', []);
    if (messages.length === 0) {
      const welcomeMessages = [
        { 
          id: 'welcome1',
          text: 'بەخێربێیت بۆ چاتی گروپ! 👋', 
          username: 'سیستەم', 
          timestamp: Date.now() - 60000,
          isOwn: false
        },
        { 
          id: 'welcome2',
          text: 'لێرە دەتوانیت لەگەڵ هەموو بینەران قسە بکەیت', 
          username: 'سیستەم', 
          timestamp: Date.now() - 30000,
          isOwn: false
        }
      ];
      
      Storage.set('chatMessages', welcomeMessages);
      welcomeMessages.forEach(msg => this.displayMessage(msg, false));
    }
  },
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Full Screen Chat Manager
const FullChat = {
  init() {
    this.setupFullChat();
  },
  
  setupFullChat() {
    const fullChatView = document.getElementById('fullChatView');
    const fullChatClose = document.getElementById('fullChatClose');
    const fullChatSend = document.getElementById('fullChatSend');
    const fullChatInput = document.getElementById('fullChatInput');
    const fullChatMessages = document.getElementById('fullChatMessages');
    
    if (!fullChatView) return;
    
    // Close button
    if (fullChatClose) {
      fullChatClose.addEventListener('click', () => {
        this.close();
      });
    }
    
    // Send message
    if (fullChatSend && fullChatInput) {
      const sendMessage = async () => {
        const text = fullChatInput.value.trim();
        if (text) {
          await ChatSystem.sendMessage(text);
          fullChatInput.value = '';
          // Messages update automatically via real-time listener
        }
      };
      
      fullChatSend.addEventListener('click', sendMessage);
      fullChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
    
    // Load messages when opened
    this.loadMessages();
  },
  
  open() {
    const fullChatView = document.getElementById('fullChatView');
    if (fullChatView) {
      fullChatView.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.loadMessages();
      
      // Focus input
      const input = document.getElementById('fullChatInput');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
      
      // Mark as viewed
      Storage.set('lastChatView', Date.now());
      ChatSystem.updateBadge();
    }
  },
  
  close() {
    const fullChatView = document.getElementById('fullChatView');
    if (fullChatView) {
      fullChatView.style.display = 'none';
      document.body.style.overflow = '';
    }
  },
  
  loadMessages() {
    // Messages are loaded via real-time listener
    // This method is kept for compatibility but real-time updates handle display
    const fullChatMessages = document.getElementById('fullChatMessages');
    if (!fullChatMessages) return;
    
    // If Firebase is working, messages are already displayed via listener
    // Otherwise, fallback to localStorage
    if (!ChatSystem.isInitialized) {
      const messages = ChatSystem.getMessages();
      fullChatMessages.innerHTML = '';
      
      if (messages.length === 0) {
        fullChatMessages.innerHTML = `
          <div style="text-align: center; color: var(--text-secondary); padding: var(--spacing-xl);">
            <p style="font-size: 1.125rem; margin-bottom: var(--spacing-sm);">💬 بەخێربێیت بۆ چاتی گروپ!</p>
            <p style="font-size: 0.875rem;">یەکەم نامەکەت بنووسە...</p>
          </div>
        `;
        return;
      }
      
      messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${msg.isOwn ? 'own' : 'other'}`;
        
        const time = new Date(msg.timestamp);
        const timeStr = time.toLocaleTimeString('ku', { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
          <div class="chat-username">${ChatSystem.escapeHtml(msg.username || msg.user)}</div>
          <div class="chat-message-content">${ChatSystem.escapeHtml(msg.text)}</div>
          <div class="chat-timestamp">${timeStr}</div>
        `;
        
        fullChatMessages.appendChild(messageDiv);
      });
      
      // Scroll to bottom
      fullChatMessages.scrollTop = fullChatMessages.scrollHeight;
    }
  }
};

// Navbar functionality
const Navbar = {
  init() {
    this.setupNavLinks();
    this.updateActiveState();
  },
  
  setupNavLinks() {
    const navChat = document.getElementById('navChat');
    if (navChat) {
      navChat.addEventListener('click', () => {
        FullChat.open();
        // Update active state
        navChat.classList.add('active');
        const navHome = document.getElementById('navHome');
        if (navHome) navHome.classList.remove('active');
      });
    }
    
    // Update active state based on current page
    const currentPath = window.location.pathname;
    const navHome = document.getElementById('navHome');
    
    if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
      if (navHome) navHome.classList.add('active');
      if (navChat) navChat.classList.remove('active');
    } else {
      if (navHome) navHome.classList.remove('active');
    }
  },
  
  updateActiveState() {
    const currentPath = window.location.pathname;
    const navHome = document.getElementById('navHome');
    const navChat = document.getElementById('navChat');
    
    if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
      if (navHome) navHome.classList.add('active');
      if (navChat) navChat.classList.remove('active');
    } else {
      if (navHome) navHome.classList.remove('active');
    }
  }
};
*/

// Initialize app - simple TV app
document.addEventListener('DOMContentLoaded', () => {
  console.log('TV App initialized');
});
