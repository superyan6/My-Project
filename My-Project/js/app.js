// 应用核心初始化和数据管理
class App {
  constructor() {
    this.tracks = [];
    this.currentTrack = null;
    this.favorites = new Set();
    this.playHistory = [];
    this.player = null;
    this.isInitialized = false;
    this.currentView = 'home';
    // 初始化数据加载器
    this.dataLoader = new DataLoader();
  }

  // 初始化应用
  async initialize() {
    try {
      console.log('初始化 My Music Vault...');
      
      // 加载音乐数据
      await this.loadTracks();
      
      // 初始化收藏数据
      this.loadFavorites();
      
      // 初始化播放历史
      this.loadPlayHistory();
      
      // 初始化播放器
      this.initializePlayer();
      
      // 初始化UI事件
      this.initializeUIEvents();
      
      // 初始化首页数据展示
      this.initializeHomePage();
      
      // 初始化主题
      this.initTheme();
      
      this.isInitialized = true;
      console.log('应用初始化完成');
      
    } catch (error) {
      console.error('应用初始化失败:', error);
      this.showNotification('应用初始化失败，请刷新页面重试', 'error');
    }
  }
  
  // 初始化主题
  initTheme() {
    console.log('初始化主题...');
    
    // 从localStorage获取主题设置，如果没有则使用默认暗色主题
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // 更新主题切换按钮状态
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        if (savedTheme === 'dark') {
          icon.classList.remove('fa-moon');
          icon.classList.add('fa-sun');
        } else {
          icon.classList.remove('fa-sun');
          icon.classList.add('fa-moon');
        }
      }
      
      // 添加主题切换事件
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  }
  
  // 切换主题
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新主题切换按钮图标
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        if (newTheme === 'dark') {
          icon.classList.remove('fa-moon');
          icon.classList.add('fa-sun');
        } else {
          icon.classList.remove('fa-sun');
          icon.classList.add('fa-moon');
        }
      }
    }
    
    this.showNotification(`已切换到${newTheme === 'dark' ? '暗色' : '亮色'}主题`);
  }
  
  // 显示通知 - 现在默认禁用所有通知显示
  showNotification(message, type = 'info') {
    // 仅在控制台记录，不显示任何通知给用户
    // 这样可以避免在页面切换时显示错误提示
    console.log(`[通知]: ${message} (类型: ${type})`);
    
    // 如果需要重新启用通知，可以取消下面的注释
    /*
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加动画类
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 自动移除
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
    */
  }

  // 加载音乐数据
  async loadTracks() {
    try {
      // 使用数据加载器加载曲目
      this.tracks = await this.dataLoader.loadTracks();
      console.log('加载了', this.tracks.length, '首音乐');
    } catch (error) {
      console.error('加载音乐数据失败:', error);
      // 使用模拟数据作为后备
      this.tracks = this.getMockTracks();
    }
  }

  // 初始化播放器
  initializePlayer() {
    // 停止所有可能正在播放的音频元素，防止多音频同时播放
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    // 优先使用全局播放器实例，确保在所有页面中统一使用同一个播放器实例
    if (window._globalAudioPlayer) {
      // 使用全局播放器实例
      this.player = window._globalAudioPlayer;
      
      // 更新曲目列表
      if (this.tracks.length && this.player.tracks !== this.tracks) {
        this.player.setTracks(this.tracks);
      }
      
      console.log('使用全局播放器实例');
    } else {
      // 如果没有全局实例，尝试获取或创建音频元素
      let audioElement = document.getElementById('audio-player');
      
      // 如果找不到音频元素，创建一个
      if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'audio-player';
        audioElement.preload = 'metadata';
        document.body.appendChild(audioElement);
        console.log('创建新的音频元素');
      }
      
      // 初始化新的播放器实例
      this.player = new Player(audioElement, this.tracks);
      
      // 保存到全局变量，确保在所有页面中统一使用同一个播放器实例
      window._globalAudioPlayer = this.player;
      console.log('创建新的播放器实例并设置为全局播放器');
      
      // 监听音频事件
      this.setupAudioEventListeners();
    }
    
    // 设置播放器UI元素（使用ID选择器匹配HTML结构）
    const uiElements = {
      title: document.getElementById('mini-player-title'),
      artist: document.getElementById('mini-player-artist'),
      cover: document.getElementById('mini-player-cover'),
      progressBar: document.getElementById('progress-bar'),
      progressFill: document.getElementById('progress-fill'),
      currentTime: document.getElementById('current-time'),
      duration: document.getElementById('total-time'),
      playBtn: document.getElementById('play-pause-btn'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn')
    };
    
    // 检查UI元素是否都找到了
    Object.entries(uiElements).forEach(([key, element]) => {
      if (!element) {
        console.log(`找不到UI元素: ${key}`);
      }
    });
    
    // 初始化UI - 只设置存在的元素
    const validUIElements = {};
    Object.entries(uiElements).forEach(([key, element]) => {
      if (element) {
        validUIElements[key] = element;
      }
    });
    
    // 更新播放器UI引用
    if (Object.keys(validUIElements).length > 0) {
      this.player.initialize(validUIElements);
    }
    
    // 更新UI以反映当前播放状态
    if (this.player.isPlaying && this.player.getCurrentTrack()) {
      this.player.updateUI();
      this.player.updatePlayButtonState();
    } else {
      // 如果有保存的状态，尝试恢复
      try {
        this.player.restoreState();
      } catch (e) {
        console.log('恢复播放器状态失败:', e);
      }
    }
  }
  
  // 设置音频事件监听器
  setupAudioEventListeners() {
    if (this.player && this.player.audio) {
      // 监听timeupdate事件更新进度条
      this.player.audio.addEventListener('timeupdate', () => {
        if (this.player && this.player.updateProgress) {
          this.player.updateProgress();
        }
      });
      
      // 监听ended事件，处理曲目结束
      this.player.audio.addEventListener('ended', () => {
        if (this.player) {
          // 检查是否有handleTrackEnd方法
          if (typeof this.player.handleTrackEnd === 'function') {
            this.player.handleTrackEnd();
          } else {
            // 尝试下一首或循环播放
            if (this.player.loopMode === 'loop' || this.player.currentIndex === this.tracks.length - 1) {
              // 如果是循环模式或最后一首，则重播当前曲目
              this.player.load(this.player.currentIndex);
              this.player.play();
            } else {
              // 否则播放下一首
              this.player.next();
            }
          }
          // 更新UI
          this.player.updateUI();
        }
      });
      
      // 监听loadedmetadata事件，更新时长显示
      this.player.audio.addEventListener('loadedmetadata', () => {
        if (this.player && this.player.updateUI) {
          this.player.updateUI();
        }
      });
    }
  }

  // 初始化UI事件
  initializeUIEvents() {
    // 播放按钮事件
    if (this.player && this.player.ui.playBtn) {
      this.player.ui.playBtn.addEventListener('click', () => this.player.togglePlay());
    }
    
    if (this.player && this.player.ui.prevBtn) {
      this.player.ui.prevBtn.addEventListener('click', () => this.player.prev());
    }
    
    if (this.player && this.player.ui.nextBtn) {
      this.player.ui.nextBtn.addEventListener('click', () => this.player.next());
    }
    
    // 进度条点击事件
    if (this.player && this.player.ui.progressBar) {
      this.player.ui.progressBar.addEventListener('click', (e) => {
        const rect = this.player.ui.progressBar.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width * 100;
        this.player.seek(percentage);
      });
    }
    
    // 收藏按钮事件委托
    document.addEventListener('click', (e) => {
      if (e.target.closest('.track-card__favorite')) {
        const trackId = this.getTrackIdFromElement(e.target.closest('[data-track-id]'));
        if (trackId) {
          this.toggleFavorite(trackId);
          this.updateFavoriteUI(trackId);
        }
      }
    });
    
    // 播放卡片事件委托
    document.addEventListener('click', (e) => {
      // 处理带有data-track-id的卡片
      if (e.target.closest('.track-card__play-btn') || 
          (e.target.closest('.track-card') && !e.target.closest('.track-card__favorite'))) {
        const trackId = this.getTrackIdFromElement(e.target.closest('[data-track-id]'));
        if (trackId) {
          this.playTrack(trackId);
        }
      }
      
      // 处理带有data-title属性的歌曲卡片（recent.html等页面）
      const cardWithData = e.target.closest('.track-card, .recent-track, .playlist-card, .song-list-item');
      if (cardWithData && cardWithData.dataset.title) {
        // 阻止事件冒泡以避免与其他事件监听器冲突
        e.preventDefault();
        e.stopPropagation();
        
        // 获取歌曲信息
        const title = cardWithData.dataset.title;
        const artist = cardWithData.dataset.artist || 'Unknown Artist';
        const src = cardWithData.dataset.src;
        const cover = cardWithData.dataset.cover || 'images/picture1.jpg';
        
        // 如果有播放器实例，使用播放器实例播放
        if (this.player && typeof this.player.playTrack === 'function') {
          // 查找对应的曲目索引
          const trackIndex = this.tracks.findIndex(track => 
            track.title === title || track.audioPath === src
          );
          
          if (trackIndex !== -1) {
            this.player.playTrack(trackIndex);
          } else {
            // 如果曲目不存在于当前列表中，直接创建并播放
            const newTrack = {
              title: title,
              artist: artist,
              audioPath: src,
              coverImagePath: cover
            };
            
            // 确保player对象存在相关方法
            if (this.player.audio && this.player.ui) {
              // 暂停当前播放
              if (!this.player.audio.paused) {
                this.player.audio.pause();
              }
              
              // 设置新的音频源
              this.player.audio.src = src;
              
              // 更新UI
              if (this.player.ui.currentTitle) this.player.ui.currentTitle.textContent = title;
              if (this.player.ui.currentArtist) this.player.ui.currentArtist.textContent = artist;
              if (this.player.ui.currentCover) this.player.ui.currentCover.src = cover;
              
              // 播放
              this.player.audio.load();
              this.player.audio.play();
              
              // 更新播放按钮状态
              if (this.player.ui.playBtn) {
                this.player.ui.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
              }
            }
          }
        }
      }
    });
    
    // 搜索功能
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchTracks(e.target.value));
    }
    
    // Explore Now按钮播放功能 - 修复版
    const exploreNowBtn = document.getElementById('explore-now-btn');
    if (exploreNowBtn) {
      exploreNowBtn.addEventListener('click', function() {
        console.log('Explore Now按钮点击');
        
        // 确保有曲目数据
        if (!this.tracks || this.tracks.length === 0) {
          console.error('无可用歌曲');
          return;
        }
        
        // 获取第一首歌的信息
        const firstTrack = this.tracks[0];
        console.log('播放第一首歌:', firstTrack.title);
        
        // 尝试使用app实例的playFirstTrack方法
        if (typeof this.playFirstTrack === 'function') {
          try {
            console.log('使用App实例的playFirstTrack方法');
            this.playFirstTrack();
          } catch (error) {
            console.error('playFirstTrack方法执行失败:', error);
          }
        }
        
        // 强制直接播放音频
        const audioElement = document.getElementById('audio-player');
        if (audioElement && firstTrack.url) {
          console.log('直接设置音频源并播放');
          audioElement.src = firstTrack.url;
          audioElement.currentTime = 0; // 确保从头开始播放
          
          // 尝试播放
          audioElement.play().then(() => {
            console.log('音频播放成功开始');
            
            // 标记为正在播放状态
            if (this.player) {
              this.player.isPlaying = true;
            }
            
            // 更新播放按钮状态为暂停
            const playPauseBtn = document.getElementById('play-pause-btn');
            if (playPauseBtn) {
              playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
            
          }).catch(error => {
            console.error('音频播放错误:', error);
            // 在用户交互上下文中尝试播放
            setTimeout(() => {
              try {
                audioElement.play();
                console.log('延迟尝试播放成功');
              } catch (retryError) {
                console.error('延迟播放仍失败:', retryError);
              }
            }, 100);
          });
        }
        
        // 直接更新底部播放器UI
        console.log('直接更新播放器UI');
        const titleEl = document.getElementById('mini-player-title');
        const artistEl = document.getElementById('mini-player-artist');
        const coverEl = document.getElementById('mini-player-cover');
        const playBtn = document.getElementById('play-pause-btn');
        
        if (titleEl) titleEl.textContent = firstTrack.title || '未知歌曲';
        if (artistEl) artistEl.textContent = firstTrack.artist || '未知艺术家';
        if (coverEl) coverEl.src = firstTrack.coverImagePath || firstTrack.cover || 'images/picture1.jpg';
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        // 确保底部播放栏可见
        const miniPlayer = document.getElementById('mini-player');
        if (miniPlayer) miniPlayer.style.display = 'block';
        
        // 触发事件通知其他组件
        window.dispatchEvent(new CustomEvent('track-played', { 
          detail: { 
            trackIndex: 0, 
            track: firstTrack 
          } 
        }));
        
        // 设置循环模式为列表循环
        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
          repeatBtn.classList.add('active');
          // 通知其他组件设置已更改
          window.dispatchEvent(new CustomEvent('playModeChanged', { 
            detail: { 
              repeatMode: 2, // 2 代表列表循环
              isShuffle: false 
            } 
          }));
        }
        
        console.log('Explore Now按钮处理完成');
      }.bind(this));
    }
  }

  // 初始化首页展示
  initializeHomePage() {
    // 首页渲染精选曲目
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
      this.renderFeaturedTracks();
    }
    
    // 图书馆页面渲染收藏和完整音乐列表
    if (window.location.pathname.includes('library.html')) {
      this.renderFavorites();
      this.renderFullTracksList(); // 渲染完整音乐列表
    }
    
    // 发现页面渲染内容和音乐列表 - 确保立即渲染
    if (window.location.pathname.includes('discover.html')) {
      this.renderDiscoverPage();
      
      // 立即渲染音乐列表，不依赖于特定ID检查
      if (this.tracks.length > 0) {
        this.renderTracksOnDiscover();
      } else {
        // 如果数据尚未加载完成，设置回调
        this.onTracksLoaded = () => this.renderTracksOnDiscover();
      }
    }
    
    if (window.location.pathname.includes('player.html')) {
      this.initializePlayerPage();
    }
  }
  
  // 在发现页面渲染音乐列表
  renderTracksOnDiscover() {
    // 优先使用discover-tracks容器
    const container = document.getElementById('discover-tracks') || 
                    document.querySelector('.tracks-grid') || 
                    document.querySelector('.tracks-list') || 
                    document.querySelector('#search-results');
    if (!container || this.tracks.length === 0) return;
    
    container.innerHTML = '';
    
    // 在发现页面显示所有歌曲
    this.tracks.forEach((track, index) => {
      const item = this.createTrackListItem(track, index + 1);
      container.appendChild(item);
    });
  }
  
  // 渲染完整的音乐列表
  renderFullTracksList() {
    // 查找图书馆页面的本地音乐容器
    const container = document.querySelector('#local-tracks');
    if (!container || this.tracks.length === 0) return;
    
    container.innerHTML = '';
    
    this.tracks.forEach((track, index) => {
      const item = this.createTrackListItem(track, index + 1);
      container.appendChild(item);
    });
    
    // 添加排序功能支持
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const sortBy = e.target.value;
        this.sortTracks(sortBy);
        this.renderFullTracksList(); // 重新渲染排序后的列表
      });
    }
  }
  
  // 排序音乐列表
  sortTracks(sortBy) {
    this.tracks.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'album':
          return a.album.localeCompare(b.album);
        default:
          return 0;
      }
    });
  }

  // 播放指定曲目 - 统一的播放控制方法
  playTrack(trackId) {
    // 停止所有可能正在播放的音频元素，防止多音频同时播放
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      if (audio !== this.player?.audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // 确保有曲目列表和播放器实例
    if (!this.tracks.length || !this.player) {
      console.warn('无法播放: 曲目列表为空或播放器未初始化');
      return;
    }
    
    const trackIndex = this.tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) {
      console.warn('未找到指定曲目');
      return;
    }
    
    this.currentTrack = this.tracks[trackIndex];
    
    // 使用try-catch避免播放错误，并完全静默处理
    try {
      // 确保使用全局播放器实例，实现跨页面统一控制
      if (window._globalAudioPlayer) {
        // 更新全局播放器的曲目列表（如果不同）
        if (window._globalAudioPlayer.tracks !== this.tracks) {
          window._globalAudioPlayer.setTracks(this.tracks);
        }
        
        // 使用全局播放器播放
        window._globalAudioPlayer.load(trackIndex);
        window._globalAudioPlayer.play();
        
        // 同步当前实例引用
        this.player = window._globalAudioPlayer;
      } else {
        // 回退到本地播放器实例
        this.player.load(trackIndex);
        this.player.play();
        
        // 确保设置全局播放器引用
        window._globalAudioPlayer = this.player;
      }
      
      // 添加到播放历史
      this.addToPlayHistory(trackId);
      
      // 确保UI更新
      if (this.player.ui) {
        this.player.updateUI();
        this.player.updatePlayButtonState();
      }
      
      // 更新当前播放信息
      this.updateNowPlayingInfo();
      
    } catch (error) {
      // 完全静默处理错误，不向用户显示任何提示
      console.log('播放曲目时出错:', error);
    }
  }
  
  // 播放第一首歌曲"one of the girls"
  playFirstTrack() {
    if (!this.player) {
      console.error('播放器未初始化');
      return;
    }
    
    // 查找"one of the girls"歌曲
    const targetTrack = this.tracks.find(track => 
      track.title.toLowerCase().includes('one of the girls') ||
      track.id === 'one-of-the-girls'
    );
    
    if (targetTrack) {
      // 找到了目标歌曲，播放它
      this.playTrack(targetTrack.id);
    } else if (this.tracks.length > 0) {
      // 如果找不到特定歌曲，播放第一首可用歌曲
      console.log('未找到"one of the girls"，播放第一首可用歌曲');
      this.playTrack(this.tracks[0].id);
    } else {
      console.error('没有可播放的歌曲');
    }
  }
  
  // 开始顺序播放所有曲目
  startSequentialPlayback() {
    console.log('开始顺序播放所有曲目');
    
    // 确保使用全局播放器实例
    if (window._globalAudioPlayer) {
      // 更新全局播放器的曲目列表
      if (window._globalAudioPlayer.tracks !== this.tracks) {
        window._globalAudioPlayer.setTracks(this.tracks);
      }
      
      // 设置为列表循环模式
      if (typeof window._globalAudioPlayer.setLoopMode === 'function') {
        window._globalAudioPlayer.setLoopMode('all');
      } else {
        window._globalAudioPlayer.loopMode = 'all';
      }
      
      // 关闭随机播放
      if (typeof window._globalAudioPlayer.setShuffleMode === 'function') {
        window._globalAudioPlayer.setShuffleMode(false);
      } else {
        window._globalAudioPlayer.shuffleMode = false;
      }
      
      // 播放第一首歌
      window._globalAudioPlayer.load(0);
      window._globalAudioPlayer.play();
      
      console.log('全局播放器已开始播放');
    } else if (this.player) {
      // 设置列表循环模式
      if (typeof this.player.setLoopMode === 'function') {
        this.player.setLoopMode('all');
      } else {
        this.player.loopMode = 'all';
      }
      
      // 关闭随机播放
      if (typeof this.player.setShuffleMode === 'function') {
        this.player.setShuffleMode(false);
      } else {
        this.player.shuffleMode = false;
      }
      
      // 播放第一首歌
      this.player.load(0);
      this.player.play();
      
      // 确保设置全局播放器引用
      window._globalAudioPlayer = this.player;
      console.log('本地播放器已开始播放');
    } else {
      console.error('没有可用的播放器实例');
    }
    
    // 确保播放栏UI更新
    this.ensurePlayerUIUpdate();
  }
  
  // 确保播放器UI更新
  ensurePlayerUIUpdate() {
    // 使用全局播放器引用更新UI
    if (window._globalAudioPlayer && window._globalAudioPlayer.ui) {
      window._globalAudioPlayer.updateUI();
      if (typeof window._globalAudioPlayer.updatePlayButtonState === 'function') {
        window._globalAudioPlayer.updatePlayButtonState();
      } else if (typeof window._globalAudioPlayer.updatePlayBtn === 'function') {
        window._globalAudioPlayer.updatePlayBtn();
      }
    }
    
    // 同时尝试使用window.player引用（如果存在）
    if (window.player && typeof window.player.updateUI === 'function') {
      window.player.updateUI();
      if (typeof window.player.updatePlayButtonState === 'function') {
        window.player.updatePlayButtonState();
      } else if (typeof window.player.updatePlayBtn === 'function') {
        window.player.updatePlayBtn();
      }
    }
    
    // 更新当前实例的UI（如果存在）
    if (this.player && this.player.ui) {
      this.player.updateUI();
      if (typeof this.player.updatePlayButtonState === 'function') {
        this.player.updatePlayButtonState();
      } else if (typeof this.player.updatePlayBtn === 'function') {
        this.player.updatePlayBtn();
      }
    }
    
    console.log('播放栏UI已更新');
  }
  
  // 更新当前播放信息 - 用于统一更新播放状态显示
  updateNowPlayingInfo() {
    if (!this.currentTrack) {
      // 如果当前没有播放的歌曲，尝试从播放器获取
      if (this.player && this.player.getCurrentTrack()) {
        this.currentTrack = this.player.getCurrentTrack();
      } else {
        return;
      }
    }
    
    const track = this.currentTrack;
    
    // 更新各种可能的UI元素
    const miniPlayerTitle = document.getElementById('mini-player-title');
    const miniPlayerArtist = document.getElementById('mini-player-artist');
    const miniPlayerCover = document.getElementById('mini-player-cover');
    const fullPlayerTitle = document.querySelector('.full-player__title');
    const fullPlayerArtist = document.querySelector('.full-player__artist');
    const fullPlayerCover = document.querySelector('.full-player__album-art img');
    
    // 更新迷你播放器信息
    if (miniPlayerTitle) miniPlayerTitle.textContent = track.title || '未知标题';
    if (miniPlayerArtist) miniPlayerArtist.textContent = track.artist || '未知艺术家';
    if (miniPlayerCover) {
      miniPlayerCover.src = track.coverImagePath || 'images/default-cover.png';
      miniPlayerCover.alt = `${track.title || '未知标题'} - ${track.artist || '未知艺术家'}`;
    }
    
    // 更新完整播放器信息
    if (fullPlayerTitle) fullPlayerTitle.textContent = track.title || '未知标题';
    if (fullPlayerArtist) fullPlayerArtist.textContent = track.artist || '未知艺术家';
    if (fullPlayerCover) {
      fullPlayerCover.src = track.coverImagePath || 'images/default-cover.png';
      fullPlayerCover.alt = `${track.title || '未知标题'} - ${track.artist || '未知艺术家'}`;
    }
  }
  
  // 直接更新播放器UI的方法，作为备选方案
    updatePlayerUI(trackIndex) {
      if (!this.tracks || !this.tracks[trackIndex]) return;
      
      const track = this.tracks[trackIndex];
      
      // 直接更新底部播放器的UI元素
      const titleEl = document.getElementById('mini-player-title');
      const artistEl = document.getElementById('mini-player-artist');
      const coverEl = document.getElementById('mini-player-cover');
      const playBtn = document.getElementById('play-pause-btn');
      
      if (titleEl) titleEl.textContent = track.title || '未知歌曲';
      if (artistEl) artistEl.textContent = track.artist || '未知艺术家';
      if (coverEl) coverEl.src = track.coverImagePath || track.cover || 'images/picture1.jpg';
      
      // 更新播放按钮状态
      if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }
      
      console.log('直接更新播放器UI成功');
    }

  // 切换收藏状态
  toggleFavorite(trackId) {
    if (this.favorites.has(trackId)) {
      this.favorites.delete(trackId);
    } else {
      this.favorites.add(trackId);
    }
    this.saveFavorites();
  }

  // 获取收藏的曲目
  getFavorites() {
    return this.tracks.filter(track => this.favorites.has(track.id));
  }

  // 加载收藏数据
  loadFavorites() {
    try {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        this.favorites = new Set(JSON.parse(saved));
      } else {
        // 初始化种子数据
        this.seedFavorites();
      }
    } catch (error) {
      console.error('加载收藏数据失败:', error);
      this.favorites = new Set();
    }
  }

  // 保存收藏数据
  saveFavorites() {
    try {
      localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    } catch (error) {
      console.error('保存收藏数据失败:', error);
    }
  }

  // 初始化示例收藏（种子数据）
  seedFavorites() {
    // 默认收藏前3首歌曲
    const defaultFavorites = this.tracks.slice(0, 3).map(t => t.id);
    this.favorites = new Set(defaultFavorites);
    this.saveFavorites();
  }

  // 加载播放历史
  loadPlayHistory() {
    try {
      const saved = localStorage.getItem('playHistory');
      if (saved) {
        this.playHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('加载播放历史失败:', error);
      this.playHistory = [];
    }
  }

  // 渲染精选曲目
  renderFeaturedTracks() {
    const container = document.querySelector('.featured-tracks');
    if (!container || this.tracks.length === 0) return;
    
    container.innerHTML = '';
    
    // 显示前6首歌曲
    const featuredTracks = this.tracks.slice(0, 6);
    
    featuredTracks.forEach(track => {
      const card = this.createTrackCard(track);
      container.appendChild(card);
    });
  }

  // 渲染收藏页面
  renderFavorites() {
    const container = document.querySelector('.favorites-container');
    if (!container) return;
    
    const favoriteTracks = this.getFavorites();
    
    if (favoriteTracks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon"><i class="fas fa-heart"></i></div>
          <h3 class="empty-state__title">暂无收藏歌曲</h3>
          <p class="empty-state__description">浏览音乐并点击心形图标添加到收藏</p>
          <a href="index.html" class="btn btn-primary">去发现音乐</a>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    favoriteTracks.forEach(track => {
      const trackItem = this.createTrackListItem(track);
      container.appendChild(trackItem);
    });
  }

  // 渲染发现页面
  renderDiscoverPage() {
    this.renderCategories();
    this.renderCharts();
  }

  // 渲染音乐分类
  renderCategories() {
    const container = document.querySelector('.categories-container');
    if (!container) return;
    
    const categories = this.getUniqueCategories();
    
    container.innerHTML = `
      <h2 class="section-title">音乐分类</h2>
      <div class="tag-cloud">
        ${categories.map(category => `
          <span class="tag" data-category="${category}">${category}</span>
        `).join('')}
      </div>
    `;
    
    // 添加分类点击事件
    document.querySelectorAll('.tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const category = tag.getAttribute('data-category');
        this.filterByCategory(category);
      });
    });
  }

  // 渲染排行榜
  renderCharts() {
    const container = document.querySelector('.charts-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="chart">
        <h3 class="chart__title">热门推荐</h3>
        <div class="chart__content">
          ${this.tracks.slice(0, 10).map((track, index) => `
            <div class="chart__item" data-track-id="${track.id}">
              <span class="chart__rank ${index < 3 ? 'top-three' : ''}">${index + 1}</span>
              <div class="chart__info">
                <div class="chart__track-title">${track.title}</div>
                <div class="chart__artist">${track.artist}</div>
              </div>
              <div class="chart__cover">
                <img src="${track.coverImagePath}" alt="${track.title}">
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 初始化播放器页面
  initializePlayerPage() {
    if (!this.player) return;
    
    // 设置完整播放器的UI元素
    const fullPlayerUI = {
      title: document.querySelector('.full-player__title'),
      artist: document.querySelector('.full-player__artist'),
      album: document.querySelector('.full-player__album'),
      cover: document.querySelector('.full-player__album-art img'),
      progressBar: document.querySelector('.full-player__progress-bar'),
      progressFill: document.querySelector('.full-player__progress-fill'),
      currentTime: document.querySelector('.full-player__time--current'),
      duration: document.querySelector('.full-player__time--total'),
      playBtn: document.querySelector('.full-player__btn--play'),
      prevBtn: document.querySelector('.full-player__btn--prev'),
      nextBtn: document.querySelector('.full-player__btn--next'),
      loopBtn: document.querySelector('.full-player__btn--loop'),
      shuffleBtn: document.querySelector('.full-player__btn--shuffle'),
      volumeSlider: document.querySelector('.full-player__volume-slider'),
      volumeFill: document.querySelector('.full-player__volume-fill')
    };
    
    // 更新播放器UI引用
    Object.assign(this.player.ui, fullPlayerUI);
    
    // 绑定额外的控制按钮事件
    if (fullPlayerUI.loopBtn) {
      fullPlayerUI.loopBtn.addEventListener('click', () => this.player.toggleLoopMode());
    }
    
    if (fullPlayerUI.shuffleBtn) {
      fullPlayerUI.shuffleBtn.addEventListener('click', () => this.player.toggleShuffleMode());
    }
    
    if (fullPlayerUI.volumeSlider) {
      fullPlayerUI.volumeSlider.addEventListener('click', (e) => {
        const rect = fullPlayerUI.volumeSlider.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width * 100;
        this.player.setVolume(percentage);
      });
    }
    
    // 渲染播放列表
    this.renderPlaylist();
    
    // 更新播放器状态
    this.player.updateUI();
  }

  // 渲染播放列表
  renderPlaylist() {
    const container = document.querySelector('.playlist__content');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.tracks.forEach((track, index) => {
      const isPlaying = this.player && this.player.currentIndex === index;
      const item = document.createElement('div');
      item.className = `track-list__item ${isPlaying ? 'playing' : ''}`;
      item.setAttribute('data-track-id', track.id);
      item.innerHTML = `
        <div class="track-list__number">${index + 1}</div>
        <div class="track-list__info">
          <div class="track-list__cover">
            <img src="${track.coverImagePath}" alt="${track.title}">
          </div>
          <div class="track-list__details">
            <div class="track-list__title">${track.title}</div>
            <div class="track-list__artist">${track.artist}</div>
          </div>
        </div>
        <div class="track-list__album">${track.album}</div>
        <div class="track-list__duration">${track.duration}</div>
      `;
      
      item.addEventListener('click', () => {
        this.player.load(index);
        this.player.play();
      });
      
      container.appendChild(item);
    });
  }

  // 创建曲目卡片
  createTrackCard(track) {
    const isFavorite = this.favorites.has(track.id);
    const card = document.createElement('div');
    card.className = 'track-card';
    card.setAttribute('data-track-id', track.id);
    card.innerHTML = `
      <div class="track-cover">
        <img src="${track.coverImagePath}" alt="${track.title}">
      </div>
      <div class="track-info">
        <h3 class="track-name">${track.title}</h3>
        <p class="track-artist">${track.artist}</p>
        <p class="track-duration" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${track.duration}</p>
      </div>`;
    
    // 添加点击事件
    card.addEventListener('click', (e) => {
      // 如果点击的是收藏按钮，不播放歌曲
      if (e.target.closest('.track-card__favorite')) {
        e.stopPropagation();
        return;
      }
      
      // 获取歌曲在列表中的索引
      const trackIndex = this.tracks.findIndex(t => t.id === track.id);
      if (trackIndex !== -1 && this.player) {
        this.player.load(trackIndex);
        this.player.play();
      }
    });
    
    return card;
  }

  // 创建曲目列表项
  createTrackListItem(track, index = '') {
    const item = document.createElement('div');
    item.className = 'track-list__item';
    item.setAttribute('data-track-id', track.id);
    item.innerHTML = `
      <div class="track-list__number">${index}</div>
      <div class="track-list__info">
        <div class="track-list__cover">
          <img src="${track.coverImagePath}" alt="${track.title}">
        </div>
        <div class="track-list__details">
          <div class="track-list__title">${track.title}</div>
          <div class="track-list__artist">${track.artist}</div>
        </div>
      </div>
      <div class="track-list__album">${track.album}</div>
      <div class="track-list__duration">${track.duration}</div>
    `;
    
    item.addEventListener('click', () => {
      this.playTrack(track.id);
    });
    
    return item;
  }

  // 搜索曲目
  searchTracks(query) {
    const lowercaseQuery = query.toLowerCase().trim();
    
    // 检查当前页面类型
    const isFavoritesPage = window.location.pathname.includes('favorites.html');
    const isRecommendationsPage = window.location.pathname.includes('recommendations.html');
    const isRecentPage = window.location.pathname.includes('recent.html');
    
    // 通用搜索结果容器
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchResultsTitle = document.getElementById('search-results-title');
    
    // 特定页面元素
    const favoritesList = document.getElementById('favorites-list');
    const recommendationsList = document.querySelector('.songs-container');
    const recentList = document.getElementById('recent-list');
    
    // 首页搜索相关元素
    const homeSearchResultsSection = document.querySelector('.search-results-section');
    const homeContainer = document.querySelector('.featured-tracks.search-results');
    
    // 处理空查询情况 - 显示原始内容，隐藏搜索结果
    if (!lowercaseQuery) {
      if (isFavoritesPage) {
        // favorites页面
        if (searchResultsContainer) searchResultsContainer.innerHTML = '';
        if (favoritesList) favoritesList.style.display = '';
      } else if (isRecommendationsPage || isRecentPage) {
        // recommendations或recent页面
        if (searchResultsContainer) searchResultsContainer.innerHTML = '';
        if (recommendationsList) recommendationsList.style.display = '';
        if (recentList) recentList.style.display = '';
      } else {
        // 首页
        if (homeSearchResultsSection) homeSearchResultsSection.style.display = 'none';
        const forYouSection = document.querySelector('.section');
        if (forYouSection) forYouSection.style.display = '';
      }
      return;
    }
    
    // 获取并过滤搜索结果
    let results = this.tracks.filter(track => 
      track.title.toLowerCase().includes(lowercaseQuery) ||
      track.artist.toLowerCase().includes(lowercaseQuery) ||
      track.album.toLowerCase().includes(lowercaseQuery) ||
      (track.tags && track.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
    
    // 根据当前页面类型处理搜索结果
    if (isFavoritesPage) {
      // 在favorites页面上，只显示收藏的歌曲
      const favoriteIds = Array.from(this.favorites);
      results = results.filter(track => favoriteIds.includes(track.id));
      
      // 显示搜索结果，隐藏原始列表
      if (favoritesList) favoritesList.style.display = 'none';
      if (searchResultsTitle) searchResultsTitle.textContent = `搜索结果: "${query}"`;
      
      renderSearchResults(results, query);
    } else if (isRecommendationsPage || isRecentPage) {
      // recommendations或recent页面的搜索逻辑
      if (recommendationsList) recommendationsList.style.display = 'none';
      if (recentList) recentList.style.display = 'none';
      if (searchResultsTitle) searchResultsTitle.textContent = `搜索结果: "${query}"`;
      
      renderSearchResults(results, query);
    } else {
      // 首页搜索逻辑
      if (homeSearchResultsSection) {
        homeSearchResultsSection.style.display = '';
        if (searchResultsTitle) searchResultsTitle.textContent = `搜索结果: "${query}"`;
      }
      
      if (homeContainer) {
        homeContainer.innerHTML = '';
        
        if (results.length === 0) {
          homeContainer.innerHTML = `
            <div class="empty-state">
              <div class="empty-state__icon"><i class="fas fa-search"></i></div>
              <h3 class="empty-state__title">未找到相关音乐</h3>
              <p class="empty-state__description">请尝试使用其他关键词搜索</p>
            </div>
          `;
          return;
        }
        
        results.forEach(track => {
          const card = this.createTrackCard(track);
          homeContainer.appendChild(card);
        });
      }
    }
    
    // 渲染搜索结果的辅助函数
    const renderSearchResults = (results, query) => {
      if (!searchResultsContainer) return;
      
      searchResultsContainer.innerHTML = '';
      
      if (results.length === 0) {
        searchResultsContainer.innerHTML = `
          <div style="padding: 40px 0; text-align: center; color: var(--text-secondary);">
            <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h3 style="margin: 0 0 8px 0;">未找到相关音乐</h3>
            <p style="margin: 0;">请尝试使用其他关键词搜索</p>
          </div>
        `;
        return;
      }
      
      results.forEach((track, index) => {
        const listItem = this.createTrackListItem(track, index + 1);
        searchResultsContainer.appendChild(listItem);
      });
    };
  }

  // 按分类筛选
  filterByCategory(category) {
    const results = this.tracks.filter(track => 
      track.tags && track.tags.includes(category)
    );
    
    const container = document.querySelector('.featured-tracks');
    if (!container) return;
    
    container.innerHTML = '';
    
    results.forEach(track => {
      const card = this.createTrackCard(track);
      container.appendChild(card);
    });
  }

  // 从元素中获取曲目ID
  getTrackIdFromElement(element) {
    return element ? element.getAttribute('data-track-id') : null;
  }

  // 更新收藏UI
  updateFavoriteUI(trackId) {
    const favoriteButtons = document.querySelectorAll(`[data-track-id="${trackId}"] .track-card__favorite`);
    favoriteButtons.forEach(button => {
      button.classList.toggle('active', this.favorites.has(trackId));
    });
  }

  // 获取所有唯一分类
  getUniqueCategories() {
    const categories = new Set();
    this.tracks.forEach(track => {
      if (track.tags) {
        track.tags.forEach(tag => categories.add(tag));
      }
    });
    return Array.from(categories);
  }

  // 获取模拟数据（后备）
  getMockTracks() {
    return [
      {
        id: "t01",
        title: "Neon City",
        artist: "Electronic Dreams",
        album: "Digital Horizons",
        duration: "3:45",
        coverImagePath: "images/cover1.png",
        audioPath: "audio/lemon-tree.mp3",
        tags: ["Electronic", "Ambient"]
      },
      {
        id: "t02",
        title: "Morning Light",
        artist: "Acoustic Waves",
        album: "Nature Sounds",
        duration: "4:12",
        coverImagePath: "images/cover2.png",
        audioPath: "audio/lemon-tree.mp3",
        tags: ["Acoustic", "Folk"]
      },
      {
        id: "t03",
        title: "Urban Nightlife",
        artist: "City Beats",
        album: "Metropolitan",
        duration: "3:28",
        coverImagePath: "images/cover3.png",
        audioPath: "audio/lemon-tree.mp3",
        tags: ["Hip Hop", "Rap"]
      },
      {
        id: "t04",
        title: "Ocean Waves",
        artist: "Nature Sounds",
        album: "Relaxation",
        duration: "5:30",
        coverImagePath: "images/picture1.jpg",
        audioPath: "audio/lemon-tree.mp3",
        tags: ["Ambient", "Relaxation"]
      }
    ];
  }

  // 导出应用实例（单例模式）
  static getInstance() {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  // 静态初始化方法
  static init() {
    const app = App.getInstance();
    document.addEventListener('DOMContentLoaded', () => {
      app.initialize();
    });
  }
}

// 在浏览器环境中，将App类暴露到window对象
if (typeof window !== 'undefined') {
    window.App = App;
    // 自动初始化
    window.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
    
    // 确保在窗口卸载时暂停所有播放，防止音频在页面切换时继续播放
    window.addEventListener('beforeunload', () => {
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
        });
    });
}
// 添加全局seed函数到app.js文件中
function defineSeedFunction() {
  if (typeof window !== 'undefined') {
    window.seed = function() {
      const app = App.getInstance();
      if (app) {
        app.seedFavorites();
        console.log('已初始化示例收藏数据');
        return true;
      }
      return false;
    };
  }
}

// 定义seed函数
defineSeedFunction();

// 为了确保符合要求，直接在window对象上定义seed函数（简化版本）
if (typeof window !== 'undefined') {
  window.seed = function() {
    const app = App.getInstance();
    if (app) {
      // 调用已有的seedFavorites方法
      app.seedFavorites();
      console.log('已初始化示例收藏数据');
      return true;
    }
    return false;
  };
}