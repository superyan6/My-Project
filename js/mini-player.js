class MiniPlayer {
    constructor() {
        // 播放器状态
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.tracks = [];
        this.isShuffle = false;
        this.repeatMode = 0; // 0: 不重复, 1: 单曲循环, 2: 列表循环
        this.shuffledIndices = [];
        this.originalIndices = [];
        
        // DOM元素
        this.elements = {};
        this.audio = null;
        
        // 全局播放器引用
        this.globalPlayer = null;
        
        // 同步定时器
        this.syncInterval = null;
        
        // 先定义所有必要的方法
        this.bindEvents = this._bindEvents;
        this.updatePlayPauseButton = this._updatePlayPauseButton;
        
        // 初始化
        this.initialize();
    }
    
    // 内部方法定义
    _updatePlayPauseButton() {
        if (this.elements.playPauseBtn) {
            const iconElement = this.elements.playPauseBtn.querySelector('i');
            if (iconElement) {
                if (this.isPlaying) {
                    iconElement.classList.remove('fa-play');
                    iconElement.classList.add('fa-pause');
                } else {
                    iconElement.classList.remove('fa-pause');
                    iconElement.classList.add('fa-play');
                }
            }
        }
    }
    
    _bindEvents() {
        // 绑定播放/暂停按钮事件
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }
        
        // 绑定上一首按钮事件
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.playPrevious());
        }
        
        // 绑定下一首按钮事件
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.playNext());
        }
        
        // 绑定随机播放按钮事件
        if (this.elements.shuffleBtn) {
            this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }
        
        // 绑定重复模式按钮事件
        if (this.elements.repeatBtn) {
            this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }
        
        // 绑定进度条事件
        if (this.elements.progressBar) {
            this.elements.progressBar.addEventListener('click', (e) => this.seek(e));
        }
        
        // 绑定音量控制事件
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e));
        }
        
        // 绑定音量按钮事件
        if (this.elements.volumeBtn) {
            this.elements.volumeBtn.addEventListener('click', () => this.toggleMute());
        }
        
        // 绑定音频元素事件
        if (this.audio) {
            this.audio.addEventListener('loadedmetadata', () => this.updateTrackInfo());
            this.audio.addEventListener('ended', () => this.handleEnded());
            this.audio.addEventListener('error', (e) => this.handleError(e));
        }
        
        // 绑定播放列表相关事件
        if (this.elements.playlistBtn) {
            this.elements.playlistBtn.addEventListener('click', () => this.togglePlaylist());
        }
        
        if (this.elements.closePlaylist) {
            this.elements.closePlaylist.addEventListener('click', () => this.hidePlaylist());
        }
        
        // 绑定收藏按钮事件
        if (this.elements.favoriteBtn) {
            this.elements.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }
    }
    

    
    // 查找指定ID的曲目索引
    findTrackIndexById(id) {
        return this.tracks.findIndex(track => track.id === id);
    }
    
    // 准备指定索引的曲目
    prepareTrack(index) {
        console.log('Preparing track at index:', index, 'of', this.tracks.length);
        
        if (index >= 0 && index < this.tracks.length) {
            this.currentTrackIndex = index;
            const track = this.tracks[index];
            
            if (track && this.audio) {
                try {
                    // 优先使用url属性，兼容audioPath
                    const audioSrc = track.url || track.audioPath || '';
                    console.log('Setting audio source to:', audioSrc);
                    
                    if (audioSrc) {
                        // 停止当前播放
                        this.audio.pause();
                        this.audio.src = audioSrc;
                        
                        // 重置进度条
                        if (this.elements.progressBar) {
                            this.elements.progressBar.value = 0;
                        }
                        if (this.elements.progressFill) {
                            this.elements.progressFill.style.width = '0%';
                        }
                        
                        // 重置时间显示
                        const timeElements = [
                            this.elements.currentTimeDisplay,
                            document.getElementById('current-time'),
                            document.getElementById('mini-player-current-time')
                        ];
                        timeElements.forEach(element => {
                            if (element) element.textContent = '0:00';
                        });
                        
                        // 预加载音频元数据
                        this.audio.load();
                    }
                } catch (error) {
                    console.error('Error preparing track:', error);
                }
            }
            
            // 立即更新UI（不等待音频加载）
            this.updateTrackInfo();
            
            // 同步到全局播放器
            if (window._globalAudioPlayer === this) {
                this.broadcastTrackChange(index);
            }
        }
    }
    
    // 更新轨道信息
    updateTrackInfo() {
        // 添加调试信息
        console.log('updateTrackInfo called:', { currentIndex: this.currentTrackIndex, tracksLength: this.tracks.length });
        
        if (this.tracks.length > 0 && this.currentTrackIndex >= 0 && this.currentTrackIndex < this.tracks.length) {
            const track = this.tracks[this.currentTrackIndex];
            
            if (track) {
                console.log('Current track:', track);
                
                // 获取所有可能的标题、艺术家和封面元素
                const titleElements = [
                    this.elements.currentTitle,
                    document.getElementById('mini-player-title'),
                    document.getElementById('player-title')
                ];
                
                const artistElements = [
                    this.elements.currentArtist,
                    document.getElementById('mini-player-artist'),
                    document.getElementById('player-artist')
                ];
                
                const coverElements = [
                    this.elements.currentCover,
                    document.getElementById('mini-player-cover'),
                    document.getElementById('player-cover'),
                    document.querySelector('.song-cover img')
                ];
                
                // 更新所有找到的标题元素
                titleElements.forEach(element => {
                    if (element) {
                        element.textContent = track.title || '未知歌曲';
                        // 确保元素可见
                        element.style.display = 'block';
                    }
                });
                
                // 更新所有找到的艺术家元素
                artistElements.forEach(element => {
                    if (element) {
                        element.textContent = track.artist || '未知艺术家';
                        // 确保元素可见
                        element.style.display = 'block';
                    }
                });
                
                // 查找封面图片路径的优先级顺序
                const coverSrc = track.coverUrl || track.coverPath || track.coverImagePath || 'images/default-cover.png';
                console.log('Using cover image:', coverSrc);
                
                // 更新所有找到的封面元素
                coverElements.forEach(element => {
                    if (element) {
                        // 重置错误处理
                        element.onerror = null;
                        element.src = coverSrc;
                        element.onerror = () => {
                            // 当封面图加载失败时使用默认封面
                            console.log('Cover image failed to load, using default');
                            element.src = 'images/default-cover.png';
                        };
                        
                        // 确保元素可见
                        element.style.display = 'block';
                        
                        // 应用动画效果（如果播放中）
                        if (this.isPlaying) {
                            element.style.animation = 'spin 20s linear infinite';
                        } else {
                            element.style.animation = 'none';
                        }
                    }
                });
                
                // 更新进度条显示
                if (this.audio && this.audio.duration) {
                    const durationElements = [
                        this.elements.durationDisplay,
                        document.getElementById('total-time'),
                        document.getElementById('mini-player-total-time')
                    ];
                    durationElements.forEach(element => {
                        if (element) {
                            element.textContent = this.formatTime(this.audio.duration);
                        }
                    });
                }
            }
        }
    }
    
    // 更新播放列表
    updatePlaylist() {
        if (this.elements.playlistItems && this.tracks.length > 0) {
            this.elements.playlistItems.innerHTML = '';
            
            this.tracks.forEach((track, index) => {
                const item = document.createElement('div');
                item.className = 'playlist-item' + (index === this.currentTrackIndex ? ' active' : '');
                item.innerHTML = `
                    <div class="playlist-track-info">
                        <div class="playlist-track-title">${track.title || 'Unknown Title'}</div>
                        <div class="playlist-track-artist">${track.artist || 'Unknown Artist'}</div>
                    </div>
                    <div class="playlist-track-duration">${this.formatTime(track.duration || 0)}</div>
                `;
                
                item.addEventListener('click', () => this.playTrackAtIndex(index));
                this.elements.playlistItems.appendChild(item);
            });
        }
    }
    
    // 更新随机播放按钮
    updateShuffleButton() {
        if (this.elements.shuffleBtn) {
            if (this.isShuffle) {
                this.elements.shuffleBtn.classList.add('active');
            } else {
                this.elements.shuffleBtn.classList.remove('active');
            }
        }
    }
    
    // 更新重复模式按钮
    updateRepeatButton() {
        if (this.elements.repeatBtn) {
            this.elements.repeatBtn.classList.remove('repeat-one', 'repeat-all');
            
            switch (this.repeatMode) {
                case 1: // 单曲循环
                    this.elements.repeatBtn.classList.add('repeat-one');
                    break;
                case 2: // 列表循环
                    this.elements.repeatBtn.classList.add('repeat-all');
                    break;
            }
        }
    }
    
    // 更新收藏按钮
    updateFavoriteButton() {
        if (this.elements.favoriteBtn) {
            const track = this.tracks[this.currentTrackIndex];
            if (track && track.isFavorite) {
                this.elements.favoriteBtn.classList.add('active');
            } else {
                this.elements.favoriteBtn.classList.remove('active');
            }
        }
    }
    
    // 更新播放列表高亮
    updatePlaylistHighlight() {
        if (this.elements.playlistItems) {
            const items = this.elements.playlistItems.querySelectorAll('.playlist-item');
            items.forEach((item, index) => {
                if (index === this.currentTrackIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }
    
    // 保存播放状态
    savePlayState() {
        try {
            const playState = {
                currentTrackIndex: this.currentTrackIndex,
                isPlaying: this.isPlaying,
                isShuffle: this.isShuffle,
                repeatMode: this.repeatMode,
                currentTime: this.audio ? this.audio.currentTime : 0
            };
            localStorage.setItem('miniPlayerState', JSON.stringify(playState));
        } catch (error) {
            console.warn('保存播放状态失败:', error);
        }
    }
    
    // 恢复播放状态
    restorePlayState() {
        try {
            const savedState = localStorage.getItem('miniPlayerState');
            if (savedState) {
                const playState = JSON.parse(savedState);
                this.currentTrackIndex = playState.currentTrackIndex || 0;
                this.isShuffle = playState.isShuffle || false;
                this.repeatMode = playState.repeatMode || 0;
                
                // 如果有曲目，准备恢复的曲目
                if (this.tracks.length > 0 && this.currentTrackIndex < this.tracks.length) {
                    this.prepareTrack(this.currentTrackIndex);
                    
                    // 恢复播放位置
                    if (this.audio && playState.currentTime) {
                        this.audio.currentTime = playState.currentTime;
                    }
                }
            }
        } catch (error) {
            console.warn('恢复播放状态失败:', error);
        }
    }
    
    // 清空曲目列表
    clearTracks() {
        this.tracks = [];
        this.currentTrackIndex = 0;
        this.shuffledIndices = [];
        this.originalIndices = [];
    }
    
    // 添加曲目
    addTrack(track) {
        this.tracks.push(track);
        this.originalIndices.push(this.tracks.length - 1);
    }
    
    // 切换收藏状态
    toggleFavorite() {
        if (this.tracks.length > 0 && this.currentTrackIndex >= 0 && this.currentTrackIndex < this.tracks.length) {
            const track = this.tracks[this.currentTrackIndex];
            track.isFavorite = !track.isFavorite;
            this.updateFavoriteButton();
        }
    }
    
    // 切换播放列表显示
    togglePlaylist() {
        if (this.elements.playlistPanel) {
            if (this.elements.playlistPanel.classList.contains('open')) {
                this.hidePlaylist();
            } else {
                this.showPlaylist();
            }
        }
    }
    
    // 显示播放列表
    showPlaylist() {
        if (this.elements.playlistPanel) {
            this.elements.playlistPanel.classList.add('open');
        }
    }
    
    // 隐藏播放列表
    hidePlaylist() {
        if (this.elements.playlistPanel) {
            this.elements.playlistPanel.classList.remove('open');
        }
    }
    
    // 设置音量
    setVolume(e) {
        if (this.audio && e.target) {
            try {
                // 确保音量值有效
                let volumeValue = parseFloat(e.target.value) / 100;
                volumeValue = Math.max(0, Math.min(1, volumeValue)); // 限制在0-1范围内
                
                this.audio.volume = volumeValue;
                this.audio.muted = volumeValue === 0;
                this.updateVolumeButton();
                
                // 保存音量设置
                localStorage.setItem('playerVolume', volumeValue.toString());
                
                // 如果之前因为音量问题停止了播放，尝试恢复播放
                if (!this.audio.paused && this.isPlaying) {
                    // 确保音频继续播放
                    this.audio.play().catch(err => {
                        console.log('尝试恢复播放失败(可能需要用户交互):', err);
                    });
                }
            } catch (error) {
                console.error('设置音量时出错:', error);
            }
        }
    }
    
    // 更新音量按钮
    updateVolumeButton() {
        if (this.elements.volumeBtn && this.audio) {
            const iconElement = this.elements.volumeBtn.querySelector('i');
            if (iconElement) {
                if (this.audio.muted || this.audio.volume === 0) {
                    iconElement.className = 'fas fa-volume-mute';
                } else if (this.audio.volume < 0.33) {
                    iconElement.className = 'fas fa-volume-down';
                } else {
                    iconElement.className = 'fas fa-volume-up';
                }
            }
        }
    }
    
    // 切换静音
    toggleMute() {
        if (this.audio) {
            try {
                // 记录之前的音量值
                const wasMuted = this.audio.muted;
                const previousVolume = this.audio.volume;
                
                if (wasMuted || previousVolume === 0) {
                    // 恢复静音前的音量或默认音量
                    const savedVolume = parseFloat(localStorage.getItem('playerVolume')) || 0.7;
                    this.audio.volume = savedVolume;
                    this.audio.muted = false;
                    
                    // 更新音量滑块
                    if (this.elements.volumeSlider) {
                        this.elements.volumeSlider.value = savedVolume * 100;
                    }
                    
                    // 尝试恢复播放
                    if (!this.audio.paused && this.isPlaying) {
                        this.audio.play().catch(err => {
                            console.log('尝试恢复播放失败(可能需要用户交互):', err);
                        });
                    }
                } else {
                    // 静音但不要影响音量值
                    this.audio.muted = !this.audio.muted;
                    
                    // 更新音量滑块显示（但保持实际值不变）
                    if (this.elements.volumeSlider) {
                        this.elements.volumeSlider.value = this.audio.muted ? 0 : previousVolume * 100;
                    }
                    
                    // 保存非静音状态的音量
                    localStorage.setItem('playerVolume', previousVolume.toString());
                }
                
                this.updateVolumeButton();
        }
    }
    
    // 跳转到指定位置
    seek(e) {
        if (!this.audio || !this.elements.progressBar) return;
        
        const progressBar = this.elements.progressBar;
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / progressBar.offsetWidth;
        this.audio.currentTime = pos * this.audio.duration;
    }
    
    // 添加视觉效果
    addVisualEffects() {
        if (this.elements.currentCover) {
            this.elements.currentCover.style.animation = 'spin 20s linear infinite';
        }
    }
    
    // 移除视觉效果
    removeVisualEffects() {
        if (this.elements.currentCover) {
            this.elements.currentCover.style.animation = 'none';
        }
    }
    
    // 停止封面旋转
    stopCoverRotation() {
        this.removeVisualEffects();
    }
    
    // 处理音频错误
    handleError(e) {
        console.error('音频播放错误:', e);
        // 可以在这里添加错误处理逻辑，比如尝试播放下一首
    }
    
    // 初始化播放器
    initialize() {
        // 优先使用全局播放器实例，确保跨页面统一控制
        this.initializeGlobalPlayer();
        
        // 如果没有全局播放器，创建新的音频元素
        if (!this.globalPlayer || !this.globalPlayer.audio) {
            // 先尝试获取已存在的音频元素
            this.audio = document.getElementById('audio-player');
            if (!this.audio) {
                this.audio = document.createElement('audio');
                this.audio.id = 'audio-player';
                document.body.appendChild(this.audio);
            }
        } else {
            // 使用全局播放器的音频元素
            this.audio = this.globalPlayer.audio;
        }
        
        // 增强的DOM元素获取，支持多种可能的ID
        this.elements = {
            playPauseBtn: document.getElementById('play-pause-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            shuffleBtn: document.getElementById('shuffle-btn'),
            repeatBtn: document.getElementById('repeat-btn'),
            favoriteBtn: document.getElementById('favorite-btn') || document.querySelector('.favorite-btn'),
            playlistBtn: document.getElementById('playlist-toggle-btn') || document.getElementById('playlist-btn'),
            volumeBtn: document.getElementById('volume-btn'),
            volumeSlider: document.getElementById('volume-slider'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            currentTimeDisplay: document.getElementById('current-time') || document.getElementById('mini-player-current-time'),
            durationDisplay: document.getElementById('total-time') || document.getElementById('mini-player-total-time'),
            currentTitle: document.getElementById('mini-player-title') || document.getElementById('player-title'),
            currentArtist: document.getElementById('mini-player-artist') || document.getElementById('player-artist'),
            currentCover: document.getElementById('mini-player-cover') || document.getElementById('player-cover'),
            playlistPanel: document.getElementById('playlist-panel'),
            closePlaylist: document.getElementById('close-playlist'),
            playlistItems: document.getElementById('playlist-items')
        };
        
        // 调试输出，确认元素是否找到
        console.log('Player initialized, DOM elements found:', {
            hasAudio: !!this.audio,
            hasPlayPauseBtn: !!this.elements.playPauseBtn,
            hasVolumeControls: !!this.elements.volumeBtn && !!this.elements.volumeSlider,
            hasTrackInfoElements: !!this.elements.currentTitle && !!this.elements.currentArtist && !!this.elements.currentCover
        });
        
        // 调用绑定事件方法
        this.bindEvents();
        
        // 确保绑定timeupdate事件
        if (this.audio) {
            // 先移除可能存在的事件监听器，避免重复绑定
            this.audio.removeEventListener('timeupdate', this._timeUpdateHandler);
            // 创建绑定this的处理函数
            this._timeUpdateHandler = () => this.updateProgress();
            this.audio.addEventListener('timeupdate', this._timeUpdateHandler);
            
            // 初始化音量设置
            const savedVolume = localStorage.getItem('playerVolume');
            if (savedVolume !== null) {
                this.audio.volume = parseFloat(savedVolume);
                if (this.elements.volumeSlider) {
                    this.elements.volumeSlider.value = parseFloat(savedVolume) * 100;
                }
            } else {
                // 默认音量70%
                this.audio.volume = 0.7;
                if (this.elements.volumeSlider) {
                    this.elements.volumeSlider.value = 70;
                }
            }
            
            // 初始化音量按钮状态
            this.updateVolumeButton();
        }
        
        // 加载音乐数据
        this.loadTracks();
        
        // 从localStorage恢复播放状态
        this.restorePlayState();
    }
    
    // 初始化全局播放器
    initializeGlobalPlayer() {
        // 检查是否已有全局播放器实例
        if (window._globalAudioPlayer) {
            this.globalPlayer = window._globalAudioPlayer;
            console.log('迷你播放器使用全局播放器实例');
            
            // 同步全局播放器的状态
            if (this.globalPlayer) {
                this.isPlaying = this.globalPlayer.isPlaying || false;
                this.currentTrackIndex = this.globalPlayer.currentTrackIndex || 0;
                this.tracks = this.globalPlayer.tracks || [];
                this.isShuffle = this.globalPlayer.isShuffle || false;
                this.repeatMode = this.globalPlayer.repeatMode || 0;
                
                // 启动同步定时器
                this.startSyncTimer();
            }
        } else {
            // 如果没有全局播放器，将当前实例设置为全局播放器
            window._globalAudioPlayer = this;
            console.log('迷你播放器创建为全局播放器实例');
        }
    }
    
    // 启动同步定时器
    startSyncTimer() {
        // 每500ms同步一次全局播放器状态
        this.syncInterval = setInterval(() => {
            this.syncWithGlobalPlayer();
        }, 500);
    }
    
    // 同步全局播放器状态
    syncWithGlobalPlayer() {
        if (window._globalAudioPlayer && window._globalAudioPlayer !== this) {
            // 更新引用到最新的全局播放器
            this.globalPlayer = window._globalAudioPlayer;
            
            // 同步状态
            this.isPlaying = this.globalPlayer.isPlaying || false;
            this.currentTrackIndex = this.globalPlayer.currentTrackIndex || 0;
            this.tracks = this.globalPlayer.tracks || [];
            this.isShuffle = this.globalPlayer.isShuffle || false;
            this.repeatMode = this.globalPlayer.repeatMode || 0;
            this.audio = this.globalPlayer.audio;
            
            // 更新UI
            this.updatePlayPauseButton();
            this.updateShuffleButton();
            this.updateRepeatButton();
            this.updateTrackInfo();
            this.updatePlaylistHighlight();
            this.updateFavoriteButton();
        }
    }
    
    // 停止所有其他音频元素，防止多音频同时播放
    stopAllOtherAudio() {
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            if (audio !== this.audio && audio !== this.globalPlayer?.audio) {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (error) {
                    console.warn('停止其他音频时出错:', error);
                }
            }
        });
    }
    
    // 加载音乐数据
    async loadTracks() {
        try {
            // 优先使用全局播放器的曲目数据
            if (this.globalPlayer && this.globalPlayer.tracks && this.globalPlayer.tracks.length > 0) {
                this.tracks = [...this.globalPlayer.tracks]; // 创建副本避免引用问题
                this.currentTrackIndex = this.globalPlayer.currentTrackIndex || 0;
                
                if (this.tracks.length > 0) {
                    console.log('Loaded tracks from global player:', this.tracks.length, 'tracks');
                    this.updatePlaylist();
                    this.prepareTrack(this.currentTrackIndex);
                }
                return;
            }
            
            // 如果没有全局播放器的曲目，尝试从JSON文件加载
            const response = await fetch('data/tracks.json');
            if (!response.ok) throw new Error('Network response was not ok');
            this.tracks = await response.json();
            
            console.log('Loaded tracks from JSON:', this.tracks.length, 'tracks');
            
            // 确保曲目数据正确格式化
            this.tracks = this.tracks.map(track => ({
                id: track.id || Math.random().toString(36).substr(2, 9),
                title: track.title || '未知歌曲',
                artist: track.artist || '未知艺术家',
                album: track.album || '未知专辑',
                duration: track.duration || 0,
                audioPath: track.audioPath || track.url || '',
                coverImagePath: track.coverImagePath || track.coverPath || track.coverUrl || 'images/default-cover.png',
                // 兼容两种属性名
                url: track.audioPath || track.url || '',
                coverUrl: track.coverImagePath || track.coverPath || track.coverUrl || 'images/default-cover.png'
            }));
            
            // 初始化原始索引
            this.originalIndices = Array.from({ length: this.tracks.length }, (_, i) => i);
            
            // 如果有歌曲，初始化第一首
            if (this.tracks.length > 0) {
                this.updatePlaylist();
                // 预加载第一首但不自动播放（遵循浏览器策略）
                this.prepareTrack(0);
                
                // 如果是全局播放器，同步曲目到其他播放器
                if (window._globalAudioPlayer === this) {
                    this.broadcastTracksUpdate();
                }
            }
        } catch (error) {
            console.error('加载音乐数据失败:', error);
            
            // 使用示例数据作为备选
            this.tracks = [
                {
                    id: 1,
                    title: "Lemon Tree",
                    artist: "Fool's Garden",
                    album: "Dish of the Day",
                    audioPath: "mp3/lemon-tree.mp3",
                    coverPath: "images/default-cover.png",
                    coverImagePath: "images/default-cover.png",
                    url: "mp3/lemon-tree.mp3",
                    coverUrl: "images/default-cover.png"
                }
            ];
            
            console.log('Using fallback track data');
            this.originalIndices = [0];
            this.updatePlaylist();
            this.prepareTrack(0);
            
            // 如果是全局播放器，同步曲目到其他播放器
            if (window._globalAudioPlayer === this) {
                this.broadcastTracksUpdate();
            }
        }
    }
    
    // 广播曲目更新
    broadcastTracksUpdate() {
        // 触发自定义事件通知其他播放器
        const event = new CustomEvent('tracksUpdated', {
            detail: {
                tracks: this.tracks,
                currentTrackIndex: this.currentTrackIndex
            }
        });
        window.dispatchEvent(event);
    }
    
    // 广播播放状态变化
    broadcastPlayStateChange(isPlaying) {
        const event = new CustomEvent('playStateChanged', {
            detail: {
                isPlaying: isPlaying,
                currentTrackIndex: this.currentTrackIndex
            }
        });
        window.dispatchEvent(event);
    }
    
    // 广播曲目变更
    broadcastTrackChange(index) {
        const event = new CustomEvent('trackChanged', {
            detail: {
                trackIndex: index,
                track: this.tracks[index]
            }
        });
        window.dispatchEvent(event);
    }
    
    // 广播播放模式变更
    broadcastPlayModeChange() {
        const event = new CustomEvent('playModeChanged', {
            detail: {
                isShuffle: this.isShuffle,
                repeatMode: this.repeatMode
            }
        });
        window.dispatchEvent(event);
    }
    
    // 播放指定索引的曲目
    playTrackAtIndex(index) {
        if (index >= 0 && index < this.tracks.length) {
            // 停止所有其他音频元素，防止多音频同时播放
            this.stopAllOtherAudio();
            
            this.prepareTrack(index);
            this.play();
        }
    }
    
    // 播放
    play() {
        // 停止所有其他音频元素，防止多音频同时播放
        this.stopAllOtherAudio();
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            
            // 更新全局播放器状态
            if (window._globalAudioPlayer === this) {
                this.broadcastPlayStateChange(true);
            }
            
            this.updatePlayPauseButton();
            this.addVisualEffects();
        }).catch(error => {
            console.error('播放失败:', error);
            // 提示用户手动点击播放
            alert('请点击播放按钮开始播放音乐');
        });
    }
    
    // 暂停
    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            
            // 更新全局播放器状态
            if (window._globalAudioPlayer === this) {
                this.broadcastPlayStateChange(false);
            }
            
            this.updatePlayPauseButton();
            this.removeVisualEffects();
        }
    }
    
    // 切换播放/暂停
    togglePlayPause() {
        // 停止所有其他音频元素，防止多音频同时播放
        this.stopAllOtherAudio();
        
        if (this.isPlaying) {
            this.pause();
        } else {
            // 如果没有加载曲目，则加载第一首
            if (!this.audio.src && this.tracks.length > 0) {
                this.playTrackAtIndex(0);
            } else {
                this.play();
            }
        }
    }
    
    // 播放上一首
    playPrevious() {
        // 停止所有其他音频元素，防止多音频同时播放
        this.stopAllOtherAudio();
        
        if (this.tracks.length === 0) return;
        
        let newIndex;
        if (this.isShuffle) {
            // 在随机模式下找到当前索引的前一个
            const currentShuffleIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
            newIndex = currentShuffleIndex > 0 ? 
                this.shuffledIndices[currentShuffleIndex - 1] : 
                this.shuffledIndices[this.shuffledIndices.length - 1];
        } else {
            // 正常模式
            newIndex = this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : this.tracks.length - 1;
        }
        
        this.playTrackAtIndex(newIndex);
        
        // 同步到全局播放器
        if (window._globalAudioPlayer === this) {
            this.broadcastTrackChange(newIndex);
        }
    }
    
    // 播放下一首
    playNext() {
        // 停止所有其他音频元素，防止多音频同时播放
        this.stopAllOtherAudio();
        
        if (this.tracks.length === 0) return;
        
        let newIndex;
        if (this.isShuffle) {
            // 在随机模式下找到当前索引的下一个
            const currentShuffleIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
            newIndex = currentShuffleIndex < this.shuffledIndices.length - 1 ? 
                this.shuffledIndices[currentShuffleIndex + 1] : 
                this.shuffledIndices[0];
        } else {
            // 正常模式
            newIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        }
        
        this.playTrackAtIndex(newIndex);
        
        // 同步到全局播放器
        if (window._globalAudioPlayer === this) {
            this.broadcastTrackChange(newIndex);
        }
    }
    
    // 切换随机播放
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        
        if (this.isShuffle) {
            // 创建随机索引数组，确保当前歌曲在第一位
            this.shuffledIndices = [...this.originalIndices];
            const currentIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
            
            // 将当前歌曲移到第一位
            this.shuffledIndices.splice(currentIndex, 1);
            this.shuffledIndices.unshift(this.currentTrackIndex);
            
            // 打乱剩余部分
            for (let i = 1; i < this.shuffledIndices.length; i++) {
                const j = Math.floor(Math.random() * (this.shuffledIndices.length - 1)) + 1;
                [this.shuffledIndices[i], this.shuffledIndices[j]] = [this.shuffledIndices[j], this.shuffledIndices[i]];
            }
        }
        
        // 更新按钮样式
        this.updateShuffleButton();
        
        // 保存状态
        this.savePlayState();
        
        // 同步到全局播放器
        if (window._globalAudioPlayer === this) {
            this.broadcastPlayModeChange();
        }
    }
    
    // 切换重复模式
    toggleRepeat() {
        // 0: 不重复 -> 1: 单曲循环 -> 2: 列表循环 -> 0
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.updateRepeatButton();
        this.savePlayState();
        
        // 同步到全局播放器
        if (window._globalAudioPlayer === this) {
            this.broadcastPlayModeChange();
        }
    }
    
    // 处理曲目播放结束
    handleEnded() {
        // 停止所有其他音频元素，防止多音频同时播放
        this.stopAllOtherAudio();
        
        console.log('Track ended, current index:', this.currentTrackIndex, 'tracks length:', this.tracks.length);
        
        switch (this.repeatMode) {
            case 1: // 单曲循环
                this.audio.currentTime = 0;
                this.play();
                break;
            case 2: // 列表循环
                // 确保可以正确循环所有曲目
                this.playNext();
                break;
            case 0: // 不重复，检查是否有下一首
                if (this.currentTrackIndex < this.tracks.length - 1) {
                    // 即使在非循环模式下，也应该能够播放完所有歌曲
                    console.log('Playing next track automatically');
                    this.playNext();
                } else { // 播放结束，重置状态
                    this.isPlaying = false;
                    
                    // 更新全局播放器状态
                    if (window._globalAudioPlayer === this) {
                        this.broadcastPlayStateChange(false);
                    }
                    
                    this.updatePlayPauseButton();
                    this.stopCoverRotation();
                    this.audio.currentTime = 0;
                    
                    // 更新进度条
                    if (this.elements.progressFill) {
                        this.elements.progressFill.style.width = '0%';
                    }
                    
                    // 更新时间显示
                    const timeElements = [
                        this.elements.currentTimeDisplay,
                        document.getElementById('current-time'),
                        document.getElementById('mini-player-current-time')
                    ];
                    timeElements.forEach(element => {
                        if (element) element.textContent = '0:00';
                    });
                }
                break;
        }
    }
    
    // 更新进度条
    updateProgress() {
        if (!this.audio || !this.elements.progressBar) {
            return;
        }
        
        if (isNaN(this.audio.duration)) return;
        
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        const progressPercentage = (currentTime / duration) * 100;
        
        // 更新进度条填充
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progressPercentage}%`;
        }
        
        // 更新进度条值
        this.elements.progressBar.value = progressPercentage;
        
        // 更新时间显示 - 支持更多可能的元素ID
                const currentTimeElements = [
                    this.elements.currentTimeDisplay,
                    document.getElementById('current-time'),
                    document.getElementById('mini-player-current-time')
                ];
                
                const durationElements = [
                    this.elements.durationDisplay,
                    document.getElementById('total-time'),
                    document.getElementById('mini-player-total-time')
                ];
                
                // 更新当前时间
                const formattedCurrentTime = this.formatTime(currentTime);
                currentTimeElements.forEach(element => {
                    if (element) element.textContent = formattedCurrentTime;
                });
                
                // 更新总时长
                const formattedDuration = this.formatTime(duration);
                durationElements.forEach(element => {
                    if (element) element.textContent = formattedDuration;
                })
    }
    
    // 格式化时间
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    // 清理播放器实例
    destroy() {
        // 清除同步定时器
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // 移除事件监听器
        if (this.audio) {
            this.audio.removeEventListener('timeupdate', () => this.updateProgress());
            this.audio.removeEventListener('loadedmetadata', () => this.updateTrackInfo());
            this.audio.removeEventListener('ended', () => this.handleEnded());
            this.audio.removeEventListener('error', (e) => this.handleError(e));
        }
        
        // 移除DOM元素
        if (this.audio && this.audio.parentNode && window._globalAudioPlayer !== this) {
            // 只有非全局播放器才移除音频元素
            this.audio.parentNode.removeChild(this.audio);
        }
    }
}

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', function() {
    // 等待DOM完全加载
    setTimeout(() => {
        // 创建播放器实例
        const player = new MiniPlayer();
        
        // 暴露API给全局
        window.player = player;
        window.playTrackAtIndex = (index) => player.playTrackAtIndex(index);
        window.togglePlayPause = () => player.togglePlayPause();
        
        console.log('迷你播放器初始化完成');
    }, 100);
});

// 添加全局API用于控制播放器
if (typeof window !== 'undefined') {
    window.playerAPI = {
        // 播放指定曲目
        playTrack: function(tracks, index) {
            if (window.player) {
                if (tracks && Array.isArray(tracks)) {
                    // 清空现有曲目
                    window.player.clearTracks();
                    // 添加新曲目
                    tracks.forEach(track => window.player.addTrack(track));
                }
                if (index !== undefined && index >= 0) {
                    window.player.prepareTrack(index);
                    window.player.play();
                }
            }
        },
        
        // 播放/暂停
        togglePlayPause: function() {
            if (window.player) {
                window.player.togglePlayPause();
            }
        },
        
        // 跳转到下一首
        playNext: function() {
            if (window.player) {
                window.player.playNext();
            }
        },
        
        // 跳转到上一首
        playPrevious: function() {
            if (window.player) {
                window.player.playPrevious();
            }
        }
    };
}

// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.repeat-one .fa-redo::before {
    content: '\\f363'; /* Font Awesome repeat-1 icon */
}

/* 播放列表动画 */
.playlist-panel {
    transition: height 0.3s ease, opacity 0.3s ease;
    opacity: 0;
}

.playlist-panel.open {
    opacity: 1;
}

/* 响应式优化 */
@media (max-width: 768px) {
    .playlist-panel {
        width: 100%;
    }
}
`;
document.head.appendChild(style);

// 确保页面滚动时播放器固定在底部
window.addEventListener('scroll', function() {
    const player = document.querySelector('.bottom-player');
    if (player) {
        player.style.zIndex = '9999';
    }
});

// 页面卸载时保存播放状态
window.addEventListener('beforeunload', function() {
    // 保存播放状态到localStorage
    if (window.player) {
        window.player.savePlayState();
    }
});

// 监听页面可见性变化，优化播放体验
document.addEventListener('visibilitychange', function() {
    if (window.player) {
        if (document.hidden) {
            // 页面隐藏时保存状态但继续播放
            window.player.savePlayState();
        } else {
            // 页面重新可见时恢复UI状态
            if (window.player.tracks && window.player.tracks.length > 0) {
                window.player.updateTrackInfo();
                window.player.updateProgress();
            }
        }
    }
});

// 定期保存播放状态，确保在意外情况下也能恢复
setInterval(function() {
    if (window.player && window.player.isPlaying) {
        window.player.savePlayState();
    }
}, 5000); // 每5秒保存一次