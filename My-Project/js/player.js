// 播放器核心逻辑类
class Player {
  constructor(audioEl, trackList) {
    // 确保音频元素有效
    if (!audioEl) {
      console.error('无效的音频元素');
      return;
    }
    
    // 首先，检查是否有全局播放器实例正在运行
    if (window._globalAudioPlayer && window._globalAudioPlayer !== this) {
      // 如果存在其他全局播放器，暂停它以防止冲突
      if (window._globalAudioPlayer.audio) {
        window._globalAudioPlayer.audio.pause();
      }
    }
    
    // 如果已经有全局播放器实例，返回它而不是创建新的
    if (window._globalAudioPlayer) {
      // 更新当前实例的引用
      this.audio = audioEl;
      this.tracks = trackList || [];
      this.originalTracks = [...trackList] || [];
      
      // 复制全局播放器的状态到当前实例
      const globalPlayer = window._globalAudioPlayer;
      this.currentIndex = globalPlayer.currentIndex;
      this.loopMode = globalPlayer.loopMode;
      this.shuffleMode = globalPlayer.shuffleMode;
      this.isPlaying = globalPlayer.isPlaying;
      
      // 如果音频元素不同，同步播放状态
      if (this.audio !== globalPlayer.audio) {
        // 为了确保音乐不中断，我们不直接替换音频元素，而是保留全局播放器的音频元素
        // 只更新UI引用和事件监听器
        this.audio = globalPlayer.audio; // 使用全局播放器的音频元素
        
        // 重新附加事件监听器
        this.attachEvents();
      }
      
      this.ui = {};
      return this;
    }
    
    // 创建新的播放器实例
    this.audio = audioEl;
    this.tracks = trackList || [];
    this.currentIndex = 0;
    this.loopMode = 'none'; // 'none', 'one', 'all'
    this.shuffleMode = false;
    this.originalTracks = [...trackList] || []; // 保存原始列表用于随机播放
    this.isPlaying = false;
    this.ui = {};
    
    // 将当前实例设为全局播放器
    window._globalAudioPlayer = this;
    
    this.attachEvents();
  }

  // 初始化UI元素引用
  initialize(uiElements = {}) {
    // 首先尝试从传入的uiElements获取元素
    this.ui = {
      title: uiElements.title,
      artist: uiElements.artist,
      album: uiElements.album,
      cover: uiElements.cover,
      progressBar: uiElements.progressBar,
      progressFill: uiElements.progressFill,
      currentTime: uiElements.currentTime,
      duration: uiElements.duration,
      playBtn: uiElements.playBtn,
      prevBtn: uiElements.prevBtn,
      nextBtn: uiElements.nextBtn,
      loopBtn: uiElements.loopBtn,
      shuffleBtn: uiElements.shuffleBtn,
      volumeSlider: uiElements.volumeSlider,
      volumeFill: uiElements.volumeFill
    };

    // 如果没有提供UI元素，尝试自动查找mini-player的元素
    if (!this.ui.playBtn) {
      this.ui = {
        title: document.getElementById('mini-player-title'),
        artist: document.getElementById('mini-player-artist'),
        cover: document.getElementById('mini-player-cover'),
        progressBar: document.querySelector('.progress-bar'),
        progressFill: document.getElementById('progress-fill'),
        currentTime: document.getElementById('current-time'),
        duration: document.getElementById('total-time'),
        playBtn: document.getElementById('play-pause-btn'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        loopBtn: document.getElementById('repeat-btn'),
        shuffleBtn: document.getElementById('shuffle-btn'),
        volumeSlider: document.getElementById('volume-slider')
      };
    }
  }

  // 加载指定索引的曲目
  load(index) {
    if (!this.tracks || index < 0 || index >= this.tracks.length) {
      console.error('无效的曲目索引');
      return false;
    }

    this.currentIndex = index;
    const track = this.tracks[index];
    
    try {
      this.audio.src = track.audioPath;
      this.updateUI(track);
      
      // 重置进度条
      if (this.ui.progressFill) {
        this.ui.progressFill.style.width = '0%';
      }
      if (this.ui.currentTime) {
        this.ui.currentTime.textContent = '0:00';
      }
      
      // 加载完成后自动播放
      if (this.isPlaying) {
        this.play();
      }
      
      this.saveState();
      return true;
    } catch (error) {
      console.error('加载曲目失败:', error);
      return false;
    }
  }

  // 播放
  play() {
    try {
      // 首先停止所有其他可能正在播放的音频元素
      this.stopAllOtherAudio();
      
      this.audio.play();
      this.isPlaying = true;
      this.updatePlayButtonState();
      this.updateUI();
      this.saveState();
      return true;
    } catch (error) {
      console.error('播放失败:', error);
      return false;
    }
  }

  // 暂停
  pause() {
    try {
      this.audio.pause();
      this.isPlaying = false;
      this.updatePlayButtonState();
      this.updateUI();
      this.saveState();
      return true;
    } catch (error) {
      console.error('暂停失败:', error);
      return false;
    }
  }

  // 切换播放/暂停状态
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      // 如果还没有加载曲目，加载第一首
      if (!this.audio.src && this.tracks.length > 0) {
        this.load(0);
      }
      this.play();
    }
  }

  // 播放下一曲
  next() {
    let nextIndex;
    
    if (this.shuffleMode) {
      // 随机播放模式
      const availableIndices = Array.from({ length: this.tracks.length }, (_, i) => i)
        .filter(i => i !== this.currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      // 顺序播放模式
      if (this.loopMode === 'one') {
        // 单曲循环时，重新加载当前曲目
        this.load(this.currentIndex);
        this.play();
        return;
      }
      nextIndex = (this.currentIndex + 1) % this.tracks.length;
    }
    
    this.load(nextIndex);
    this.play();
  }

  // 播放上一曲
  prev() {
    // 如果当前播放时间超过3秒，重新开始当前曲目
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    
    let prevIndex;
    
    if (this.shuffleMode) {
      // 随机模式下，简单返回上一个
      prevIndex = this.currentIndex - 1;
      if (prevIndex < 0) prevIndex = this.tracks.length - 1;
    } else {
      if (this.loopMode === 'one') {
        // 单曲循环时，重新加载当前曲目
        this.load(this.currentIndex);
        this.play();
        return;
      }
      prevIndex = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    }
    
    this.load(prevIndex);
    this.play();
  }

  // 跳转到指定百分比位置
  seek(percentage) {
    if (isNaN(percentage)) return;
    
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    this.audio.currentTime = (clampedPercentage / 100) * this.audio.duration;
  }

  // 设置音量
  setVolume(percentage) {
    if (isNaN(percentage)) return;
    
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    this.audio.volume = clampedPercentage / 100;
    
    if (this.ui.volumeFill) {
      this.ui.volumeFill.style.width = `${clampedPercentage}%`;
    }
    
    // 保存音量设置
    localStorage.setItem('playerVolume', clampedPercentage);
  }

  // 切换循环模式
  toggleLoopMode() {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(this.loopMode);
    this.loopMode = modes[(currentIndex + 1) % modes.length];
    this.updateLoopButtonState();
    this.saveState();
    
    // 发布播放模式变更事件
    this.dispatchPlayModeEvent();
    return this.loopMode;
  }

  // 切换随机播放模式
  toggleShuffleMode() {
    this.shuffleMode = !this.shuffleMode;
    
    if (this.shuffleMode) {
      // 初始化随机播放列表
      this.initShuffleList();
    } else {
      // 恢复原始播放列表
      this.tracks = [...this.originalTracks];
    }
    
    this.updateShuffleButtonState();
    this.saveState();
    
    // 发布播放模式变更事件
    this.dispatchPlayModeEvent();
    return this.shuffleMode;
  }

  // 初始化随机播放列表
  initShuffleList() {
    this.shuffleList = Array.from({ length: this.tracks.length }, (_, i) => i);
    
    // Fisher-Yates 洗牌算法
    for (let i = this.shuffleList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffleList[i], this.shuffleList[j]] = [this.shuffleList[j], this.shuffleList[i]];
    }
    
    // 确保当前曲目在最前面
    const currentTrackIndex = this.shuffleList.indexOf(this.currentIndex);
    if (currentTrackIndex !== 0) {
      [this.shuffleList[0], this.shuffleList[currentTrackIndex]] = [
        this.shuffleList[currentTrackIndex], 
        this.shuffleList[0]
      ];
    }
  }

  // 获取下一个随机索引
  getNextShuffleIndex() {
    if (!this.shuffleMode || this.shuffleList.length === 0) {
      return (this.currentIndex + 1) % this.tracks.length;
    }
    
    const currentShuffleIndex = this.shuffleList.indexOf(this.currentIndex);
    
    if (currentShuffleIndex === -1 || currentShuffleIndex === this.shuffleList.length - 1) {
      // 如果当前曲目不在随机列表中，或者已经是最后一首，重新洗牌
      this.initShuffleList();
      return this.shuffleList[1] || 0;
    }
    
    return this.shuffleList[currentShuffleIndex + 1];
  }

  // 获取上一个随机索引
  getPreviousShuffleIndex() {
    if (!this.shuffleMode || this.shuffleList.length === 0) {
      return (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    }
    
    const currentShuffleIndex = this.shuffleList.indexOf(this.currentIndex);
    
    if (currentShuffleIndex === -1 || currentShuffleIndex === 0) {
      // 如果当前曲目不在随机列表中，或者已经是第一首，重新洗牌
      this.initShuffleList();
      return this.shuffleList[this.shuffleList.length - 1] || 0;
    }
    
    return this.shuffleList[currentShuffleIndex - 1];
  }

  // 播放指定ID的曲目
  playTrackById(trackId) {
    const trackIndex = this.tracks.findIndex(track => track.id === trackId);
    
    if (trackIndex !== -1) {
      this.load(trackIndex);
      this.play();
      return true;
    }
    
    console.error('未找到指定ID的曲目:', trackId);
    return false;
  }

  // 获取当前曲目信息
  getCurrentTrack() {
    return this.tracks[this.currentIndex];
  }

  // 监听音频事件
  attachEvents() {
    // 先清理可能存在的事件监听器，避免重复绑定
    this.cleanupEvents();
    
    // 播放进度更新
    this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
    
    // 播放结束事件
    this.audio.addEventListener('ended', () => this.handleTrackEnd());
    
    // 元数据加载完成
    this.audio.addEventListener('loadedmetadata', () => this.handleMetadataLoaded());
    
    // 播放开始事件
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayButtonState();
      // 更新全局播放状态，供mini-player使用
      if (window.currentTrack !== this.getCurrentTrack()) {
        window.currentTrack = this.getCurrentTrack();
        if (window.updateMiniPlayerUI) {
          window.updateMiniPlayerUI(this.getCurrentTrack());
        }
      }
    });
    
    // 暂停事件
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayButtonState();
    });
    
    // 出错事件 - 静默处理，避免显示错误提示
    this.audio.addEventListener('error', (e) => this.handleError(e));
    
    // 加载开始事件
    this.audio.addEventListener('loadstart', () => {
      // 可以在这里添加加载指示器
    });
    
    // 可以播放事件
    this.audio.addEventListener('canplay', () => {
      // 可以在这里处理准备就绪状态
    });
  }
  
  // 清理事件监听器
  cleanupEvents() {
    try {
      const clone = this.audio.cloneNode(true);
      const parent = this.audio.parentNode;
      
      if (parent) {
        parent.replaceChild(clone, this.audio);
        this.audio = clone;
      }
    } catch (e) {
      console.log('清理现有监听器时出错:', e);
    }
  }

  // 处理播放进度更新
  handleTimeUpdate() {
    if (isNaN(this.audio.duration)) return;
    
    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration;
    const progressPercentage = (currentTime / duration) * 100;
    
    // 更新进度条
    if (this.ui.progressFill) {
      this.ui.progressFill.style.width = `${progressPercentage}%`;
    }
    
    // 更新时间显示
    if (this.ui.currentTime) {
      this.ui.currentTime.textContent = this.formatTime(currentTime);
    }
    
    if (this.ui.duration && !isNaN(duration)) {
      this.ui.duration.textContent = this.formatTime(duration);
    }
  }

  // 处理曲目播放结束
  // 处理曲目结束
  handleTrackEnd() {
    if (this.loopMode === 'one') {
      // 单曲循环，重新播放当前曲目
      this.load(this.currentIndex);
      this.play();
    } else {
      // 播放下一首曲目
      this.next();
    }
    
    // 发布播放状态变更事件
    this.dispatchPlayStateEvent();
  }

  // 处理元数据加载完成
  handleMetadataLoaded() {
    if (this.ui.duration && !isNaN(this.audio.duration)) {
      this.ui.duration.textContent = this.formatTime(this.audio.duration);
    }
  }

  // 处理音频错误 - 完全静默处理，不显示任何提示
  handleError(event) {
    // 仅在控制台记录错误，不向用户显示任何提示
    console.log('音频播放错误(静默处理):', event);
    
    // 静默停止，不尝试自动播放下一首
    this.isPlaying = false;
    this.updatePlayButtonState();
  }

  // 更新UI
  // 更新UI显示
  updateUI(track = this.getCurrentTrack()) {
    if (!track) return;
    
    // 更新歌曲信息
    if (this.ui.title) this.ui.title.textContent = track.title || '未知标题';
    if (this.ui.artist) this.ui.artist.textContent = track.artist || '未知艺术家';
    if (this.ui.album && track.album) this.ui.album.textContent = track.album;
    
    // 更新封面
    if (this.ui.cover) {
      // 先设置默认封面，加载完成后再更新
      this.ui.cover.src = 'images/default-cover.png';
      const img = new Image();
      img.onload = () => {
        this.ui.cover.src = track.coverPath || track.coverImagePath || 'images/default-cover.png';
      };
      img.src = track.coverPath || track.coverImagePath || 'images/default-cover.png';
    }
    
    // 更新播放状态UI
    this.updatePlayButtonState();
    
    // 更新播放列表高亮
    this.syncPlaylistHighlight();
  }

  // 更新播放按钮状态
  updatePlayButtonState() {
    const playButtons = [this.ui.playBtn];
    
    // 同时更新mini-player和full-player的播放按钮
    const miniPlayerPlayBtn = document.getElementById('play-pause-btn');
    const fullPlayerPlayBtn = document.querySelector('.full-player__btn--play');
    
    if (miniPlayerPlayBtn && miniPlayerPlayBtn !== this.ui.playBtn) {
      playButtons.push(miniPlayerPlayBtn);
    }
    
    if (fullPlayerPlayBtn) {
      playButtons.push(fullPlayerPlayBtn);
    }
    
    playButtons.forEach(btn => {
      if (btn) {
        // 处理Font Awesome图标按钮
        const icon = btn.querySelector('i');
        if (icon) {
          if (this.isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
          } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
          }
        }
        // 处理文本图标按钮（mini-player使用的）
        else if (btn.textContent && (btn.textContent === '▶' || btn.textContent === '⏸')) {
          btn.textContent = this.isPlaying ? '⏸' : '▶';
        }
      }
    });
  }

  // 更新循环按钮状态
  updateLoopButtonState() {
    const loopButtons = [this.ui.loopBtn];
    
    // 同时更新mini-player和full-player的循环按钮
    const miniPlayerRepeatBtn = document.getElementById('repeat-btn');
    const fullPlayerLoopBtn = document.querySelector('.full-player__btn--loop');
    
    if (miniPlayerRepeatBtn && miniPlayerRepeatBtn !== this.ui.loopBtn) {
      loopButtons.push(miniPlayerRepeatBtn);
    }
    
    if (fullPlayerLoopBtn) {
      loopButtons.push(fullPlayerLoopBtn);
    }
    
    loopButtons.forEach(btn => {
      if (btn) {
        // 处理player.js的循环模式
        btn.classList.remove('active-none', 'active-one', 'active-all');
        
        switch (this.loopMode) {
          case 'none':
            btn.classList.add('active-none');
            btn.setAttribute('title', '循环关闭');
            // 同时更新mini-player的播放模式
            if (window.playMode) {
              window.playMode = 'sequence';
              if (window.updatePlayModeButton) {
                window.updatePlayModeButton();
              }
            }
            break;
          case 'one':
            btn.classList.add('active-one');
            btn.setAttribute('title', '单曲循环');
            // 同时更新mini-player的播放模式
            if (window.playMode) {
              window.playMode = 'single';
              if (window.updatePlayModeButton) {
                window.updatePlayModeButton();
              }
            }
            break;
          case 'all':
            btn.classList.add('active-all');
            btn.setAttribute('title', '循环所有');
            // 同时更新mini-player的播放模式
            if (window.playMode) {
              window.playMode = 'loop';
              if (window.updatePlayModeButton) {
                window.updatePlayModeButton();
              }
            }
            break;
        }
      }
    });
  }

  // 更新随机播放按钮状态
  updateShuffleButtonState() {
    const shuffleButtons = [this.ui.shuffleBtn];
    
    // 同时更新mini-player和full-player的随机播放按钮
    const miniPlayerShuffleBtn = document.getElementById('shuffle-btn');
    const fullPlayerShuffleBtn = document.querySelector('.full-player__btn--shuffle');
    
    if (miniPlayerShuffleBtn && miniPlayerShuffleBtn !== this.ui.shuffleBtn) {
      shuffleButtons.push(miniPlayerShuffleBtn);
    }
    
    if (fullPlayerShuffleBtn) {
      shuffleButtons.push(fullPlayerShuffleBtn);
    }
    
    shuffleButtons.forEach(btn => {
      if (btn) {
        btn.classList.toggle('active', this.shuffleMode);
        btn.setAttribute('title', this.shuffleMode ? '随机播放（已开启）' : '随机播放');
        
        // 同时更新mini-player的随机播放模式
        if (window.playMode) {
          if (this.shuffleMode && window.playMode !== 'shuffle') {
            window.playMode = 'shuffle';
            if (window.updatePlayModeButton) {
              window.updatePlayModeButton();
            }
          } else if (!this.shuffleMode && window.playMode === 'shuffle') {
            window.playMode = 'sequence';
            if (window.updatePlayModeButton) {
              window.updatePlayModeButton();
            }
          }
        }
      }
    });
  }

  // 同步播放列表高亮
  syncPlaylistHighlight() {
    const trackItems = document.querySelectorAll('.track-list__item');
    
    trackItems.forEach((item, index) => {
      if (index === this.currentIndex) {
        item.classList.add('playing');
      } else {
        item.classList.remove('playing');
      }
    });
  }

  // 格式化时间
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // 停止所有其他可能正在播放的音频元素
  stopAllOtherAudio() {
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      if (audio !== this.audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (error) {
          console.warn('停止其他音频时出错:', error);
        }
      }
    });
  }

  // 保存播放器状态
  saveState() {
    try {
      const state = {
        currentIndex: this.currentIndex,
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
        isPlaying: this.isPlaying,
        loopMode: this.loopMode,
        shuffleMode: this.shuffleMode,
        // 增强的跨页面播放支持
        tracksCount: this.tracks.length,
        volume: this.audio.volume,
        lastSaved: Date.now()
      };
      
      localStorage.setItem('playerState', JSON.stringify(state));
      console.log('播放器状态已保存:', state);
    } catch (error) {
      console.error('保存播放器状态失败:', error);
    }
  }

  // 恢复播放器状态
  restoreState() {
    try {
      const savedState = localStorage.getItem('playerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // 确保曲目列表已加载且索引有效
        if (this.tracks.length > 0) {
          // 检查索引是否有效，如果无效则使用默认索引
          let indexToLoad = state.currentIndex || 0;
          if (indexToLoad >= this.tracks.length || indexToLoad < 0) {
            indexToLoad = 0;
          }
          
          // 加载并恢复播放状态
          this.load(indexToLoad);
          
          // 恢复播放位置
          if (state.currentTime && state.duration) {
            this.audio.currentTime = state.currentTime;
          }
          
          // 恢复播放状态
          if (state.isPlaying) {
            // 使用setTimeout确保DOM已完全加载
            setTimeout(() => {
              this.play();
            }, 100);
          }
          
          // 恢复循环模式
          if (state.loopMode) {
            this.loopMode = state.loopMode;
            this.updateLoopButtonState();
          }
          
          // 恢复随机播放模式
          if (state.shuffleMode) {
            this.shuffleMode = state.shuffleMode;
            this.updateShuffleButtonState();
          }
          
          // 恢复音量（优先从状态中恢复）
          if (state.volume !== undefined) {
            this.setVolume(state.volume * 100); // Player类的setVolume方法接受百分比
          }
          
          console.log('播放器状态已恢复:', state);
        }
      }
      
      // 单独恢复音量设置（兼容旧版本）
      const savedVolume = localStorage.getItem('playerVolume');
      if (savedVolume !== null) {
        this.setVolume(parseFloat(savedVolume) * 100); // 转换为百分比
      }
    } catch (error) {
      console.error('恢复播放器状态失败:', error);
    }
  }

  // 重置播放器
  reset() {
    this.pause();
    this.audio.src = '';
    this.currentIndex = 0;
    this.isPlaying = false;
    this.shuffleMode = false;
    this.loopMode = 'none';
    
    // 清除进度条
    if (this.ui.progressFill) {
      this.ui.progressFill.style.width = '0%';
    }
    
    if (this.ui.currentTime) {
      this.ui.currentTime.textContent = '0:00';
    }
    
    if (this.ui.duration) {
      this.ui.duration.textContent = '0:00';
    }
    
    this.updateUI();
    this.saveState();
  }
  
  // 发布播放状态变更事件
  dispatchPlayStateEvent() {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('playStateChanged', {
        bubbles: true,
        cancelable: true,
        detail: {
          isPlaying: this.isPlaying,
          currentTrackIndex: this.currentIndex,
          currentTrack: this.getCurrentTrack()
        }
      });
      window.dispatchEvent(event);
    }
  }
  
  // 发布曲目变更事件
  dispatchTrackChangedEvent(trackIndex) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('trackChanged', {
        bubbles: true,
        cancelable: true,
        detail: {
          trackIndex: trackIndex,
          track: this.tracks[trackIndex]
        }
      });
      window.dispatchEvent(event);
    }
  }
  
  // 发布曲目列表更新事件
  dispatchTracksUpdatedEvent() {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('tracksUpdated', {
        bubbles: true,
        cancelable: true,
        detail: {
          tracks: this.tracks,
          currentTrackIndex: this.currentIndex
        }
      });
      window.dispatchEvent(event);
    }
  }
  
  // 发布播放模式变更事件
  dispatchPlayModeEvent() {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('playModeChanged', {
        bubbles: true,
        cancelable: true,
        detail: {
          isShuffle: this.shuffleMode,
          repeatMode: this.loopMode
        }
      });
      window.dispatchEvent(event);
    }
  }
  
  // 播放指定索引的曲目（公共方法）
  playTrackAtIndex(index) {
    if (index >= 0 && index < this.tracks.length) {
      this.load(index);
      this.play();
      return true;
    }
    return false;
  }
  
  // 初始化播放器API（方便其他页面调用）
  initPlayerAPI() {
    if (typeof window !== 'undefined' && !window.playerAPI) {
      window.playerAPI = {
        playTrack: (tracks, index) => {
          if (tracks && Array.isArray(tracks)) {
            this.setTracks(tracks);
            this.playTrackAtIndex(index);
          }
        },
        playPause: () => {
          this.togglePlay();
        },
        nextTrack: () => {
          this.next();
        },
        prevTrack: () => {
          this.prev();
        },
        setVolume: (volume) => {
          this.setVolume(volume);
        },
        toggleShuffle: () => {
          this.toggleShuffleMode();
        },
        toggleRepeat: () => {
          this.toggleLoopMode();
        }
      };
    }
  }

  // 设置播放列表
  setTracks(tracks) {
    this.tracks = tracks || [];
    
    // 如果当前索引超出了新列表的范围，重置为0
    if (this.currentIndex >= this.tracks.length) {
      this.currentIndex = 0;
    }
    
    // 重置随机播放列表
    if (this.shuffleMode) {
      this.initShuffleList();
    }
    
    return this;
  }

  // 获取播放器状态信息
  getState() {
    return {
      currentIndex: this.currentIndex,
      currentTrack: this.getCurrentTrack(),
      isPlaying: this.isPlaying,
      currentTime: this.audio.currentTime,
      duration: this.audio.duration,
      loopMode: this.loopMode,
      shuffleMode: this.shuffleMode,
      volume: this.audio.volume
    };
  }
}

// 在浏览器环境中，将Player类挂载到window对象上
if (typeof window !== 'undefined') {
  window.Player = Player;
}

// 提供一个简单的工厂函数
definePlayerFactory();

// 全局播放器实例
let globalPlayerInstance = null;

// 创建播放器工厂函数
function definePlayerFactory() {
  if (typeof window === 'undefined') return;
  
  // 播放器初始化函数
  window.initPlayer = function(trackList = []) {
    // 优先使用全局单例播放器
    if (window._globalAudioPlayer) {
      // 更新曲目列表
      window._globalAudioPlayer.setTracks(trackList);
      return window._globalAudioPlayer;
    }
    
    if (globalPlayerInstance) {
      // 如果已有实例，更新曲目列表
      globalPlayerInstance.setTracks(trackList);
      return globalPlayerInstance;
    }
    
    // 创建新实例
    const audioElement = document.getElementById('audio-player') || createAudioElement();
    globalPlayerInstance = new Player(audioElement, trackList);
    
    // 初始化UI
    globalPlayerInstance.initialize();
    
    // 恢复播放状态
    globalPlayerInstance.restoreState();
    
    return globalPlayerInstance;
  };
  
  // 创建音频元素
  function createAudioElement() {
    const audio = document.createElement('audio');
    audio.id = 'audio-player';
    audio.preload = 'metadata';
    // 使用appendChild而不是insertBefore确保兼容性
    document.body.appendChild(audio);
    return audio;
  }
  
  // 从JSON加载曲目并初始化播放器
  window.loadTracksFromJson = async function(jsonPath = 'data/tracks.json') {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error(`加载失败: ${response.status}`);
      
      const tracks = await response.json();
      if (!Array.isArray(tracks)) throw new Error('数据格式错误');
      
      // 初始化播放器
      const player = window.initPlayer(tracks);
      
      // 暴露全局曲目列表
      window.tracks = tracks;
      
      return tracks;
    } catch (error) {
      console.error('加载曲目失败:', error);
      // 返回模拟数据以避免显示错误
      const mockTracks = [
        {
          id: "mock01",
          title: "示例音乐",
          artist: "未知艺术家",
          album: "示例专辑",
          duration: "3:00",
          coverImagePath: "images/picture1.jpg",
          audioPath: "audio/lemon-tree.mp3"
        }
      ];
      
      // 尝试使用模拟数据初始化播放器
      window.tracks = mockTracks;
      return mockTracks;
    }
  };
}