// 全局应用状态
const appState = {
    currentTrack: null,
    currentTrackIndex: -1,
    isPlaying: false,
    tracks: [],
    playMode: 'sequence', // sequence, loop, random
    favorites: [],
    recentPlays: [],
    darkTheme: false,
    audioElement: null,
    currentPlaylist: null,
    volume: 0.7, // 匹配HTML中的默认音量值(0.7)
    playlists: [] // 歌单数据
};

// DOM 元素缓存
const dom = {
    audio: null,
    playBtn: null,
    prevBtn: null,
    nextBtn: null,
    progressBar: null,
    currentTime: null,
    duration: null,
    volumeSlider: null,
    playModeBtn: null,
    miniPlayerTitle: null,
    miniPlayerArtist: null,
    miniPlayerCover: null,
    largeCoverImage: null,
    trackTitle: null,
    trackArtist: null,
    trackAlbum: null,
    searchInput: null,
    themeToggle: null,
    sidebarToggle: null,
    sidebar: null
};

// 初始化应用
function initApp() {
    console.log('初始化 My Music Vault 应用...');
    
    // 缓存 DOM 元素
    cacheDomElements();
    
    // 使用HTML中已有的音频元素
    appState.audioElement = dom.audio;
    
    // 从本地存储加载歌单数据 - 确保在loadAppData前加载
    loadPlaylistsFromLocalStorage();
    
    // 初始化应用数据
    loadAppData();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 特别检查是否是歌单页面，如果是则确保歌单正确渲染
    if (window.location.pathname.includes('playlists.html')) {
        console.log('当前在歌单页面，确保歌单渲染');
        // 延迟一下确保DOM完全加载
        setTimeout(() => {
            renderPlaylistsGrid();
        }, 50);
    }
    
    // 初始化UI
    initializeUI();
    
    // 尝试从本地存储加载音量设置
    const savedVolume = localStorage.getItem('myMusicVaultVolume');
    if (savedVolume !== null) {
        appState.volume = parseFloat(savedVolume);
        if (dom.audio) {
            dom.audio.volume = appState.volume;
        }
        if (dom.volumeSlider) {
            dom.volumeSlider.value = appState.volume;
        }
    }
    
    // 尝试从本地存储加载播放模式设置
    const savedPlayMode = localStorage.getItem('myMusicVaultPlayMode');
    if (savedPlayMode && ['sequence', 'loop', 'random'].includes(savedPlayMode)) {
        appState.playMode = savedPlayMode;
    }
    
    // 初始化本地存储数据
    initializeLocalStorageData();
    
    // 尝试加载上一次播放的状态
    loadLastPlayState();
    
    // 更新播放模式按钮UI
    updatePlayModeButtonUI();
    
    // 初始化迷你播放器
    if (window.initMiniPlayer) {
        window.initMiniPlayer();
    }
    
    // 渲染初始UI内容
    renderTracksList(appState.tracks);
    renderRecentPlaysList();
    renderFavoritesList();
    renderTagsContainer();
    
    // 暴露关键函数到全局window对象，以便mini-player.js使用
    window.togglePlayPause = togglePlayPause;
    window.playPreviousTrack = playPreviousTrack;
    window.playNextTrack = playNextTrack;
    window.playTrackById = playTrackById;
    window.playTrackByIndex = playTrackByIndex;
    window.updatePlayerUI = updatePlayerUI;
}

// 缓存DOM元素
function cacheDomElements() {
    // 音频控制元素
    dom.audio = document.getElementById('audio-player');
    dom.playBtn = document.getElementById('play-pause-btn');
    dom.prevBtn = document.getElementById('prev-btn');
    dom.nextBtn = document.getElementById('next-btn');
    dom.progressBar = document.querySelector('.progress-bar');
    dom.progressFill = document.getElementById('progress-fill');
    dom.currentTime = document.getElementById('current-time');
    dom.duration = document.getElementById('total-time');
    dom.volumeSlider = document.getElementById('volume-slider');
    dom.playModeBtn = document.getElementById('repeat-btn');
    
    // 播放模式相关按钮
    dom.shuffleBtn = document.getElementById('shuffle-btn');
    dom.volumeBtn = document.getElementById('volume-btn');
    
    // 播放器信息元素
    dom.miniPlayerTitle = document.querySelector('.player-title');
    dom.miniPlayerArtist = document.querySelector('.player-artist');
    dom.miniPlayerCover = document.querySelector('.player-cover img');
    dom.largeCoverImage = document.getElementById('large-cover-image');
    dom.trackTitle = document.querySelector('.track-title');
    dom.trackArtist = document.querySelector('.track-artist');
    dom.trackAlbum = document.querySelector('.track-album');
    
    // 交互元素
    dom.searchInput = document.querySelector('.search-bar input');
    dom.themeToggle = document.querySelector('.theme-toggle');
    dom.sidebarToggle = document.querySelector('.sidebar-toggle');
    dom.sidebar = document.querySelector('.sidebar');
}

// 加载应用数据
function loadAppData() {
    // 直接使用fallback数据以确保网站能正常运行
    console.log('加载应用数据，使用示例数据...');
    appState.tracks = fallbackTracks;
    
    // 尝试从本地存储加载收藏列表
    const savedFavorites = localStorage.getItem('myMusicVaultFavorites');
    if (savedFavorites) {
        try {
            appState.favorites = JSON.parse(savedFavorites);
        } catch (e) {
            console.error('加载收藏列表失败:', e);
            appState.favorites = [];
        }
    }
    
    // 尝试从本地存储加载最近播放列表
    const savedRecentPlays = localStorage.getItem('myMusicVaultRecentPlays');
    if (savedRecentPlays) {
        try {
            appState.recentPlays = JSON.parse(savedRecentPlays);
        } catch (e) {
            console.error('加载最近播放列表失败:', e);
            appState.recentPlays = [];
        }
    }
    
    // 加载歌单数据（如果尚未加载）
    if (appState.playlists.length === 0) {
        loadPlaylistsFromLocalStorage();
    }
    
    // 在所有页面渲染歌曲列表
    renderTracksList(appState.tracks);
    
    // 如果当前页面有推荐区块，渲染推荐内容
    if (document.querySelector('.featured-section')) {
        renderFeaturedContent();
    }
    
    // 如果当前页面有专辑区块，渲染专辑内容
    if (document.querySelector('.albums-section')) {
        renderAlbumsGrid();
    }
    
    // 如果当前页面有标签筛选，渲染标签
    if (document.querySelector('.tags-container')) {
        renderTagsContainer();
    }
    
    // 如果当前页面有歌单区块，渲染歌单内容
    if (document.querySelector('.playlists-section')) {
        renderPlaylistsGrid();
    }
    
    // 如果是歌单页面，重新渲染歌单列表
    if (window.location.pathname.includes('playlists.html')) {
        renderPlaylistsGrid();
    }
}

// Sample tracks data with public URLs
const fallbackTracks = [
    {
        id: 1,
        title: "Summer Vibes",
        artist: "Acoustic Dreams",
        album: "Summer Memories",
        duration: 210,
        coverImagePath: "https://picsum.photos/id/10/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        tags: ["Pop", "Summer", "Acoustic"]
    },
    {
        id: 2,
        title: "Electric Dreams",
        artist: "Synthwave Collective",
        album: "Retro Future",
        duration: 235,
        coverImagePath: "https://picsum.photos/id/20/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        tags: ["Electronic", "Synthwave", "Retro"]
    },
    {
        id: 3,
        title: "Morning Coffee",
        artist: "Jazz Ambient",
        album: "Urban Chill",
        duration: 185,
        coverImagePath: "https://picsum.photos/id/30/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        tags: ["Jazz", "Ambient", "Chill"]
    },
    {
        id: 4,
        title: "Ocean Waves",
        artist: "Nature Sounds",
        album: "Meditation",
        duration: 300,
        coverImagePath: "https://picsum.photos/id/40/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        tags: ["Nature", "Relaxation", "Meditation"]
    },
    {
        id: 5,
        title: "City Lights",
        artist: "Urban Beats",
        album: "Night Drive",
        duration: 245,
        coverImagePath: "https://picsum.photos/id/50/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        tags: ["Electronic", "Urban", "Night"]
    },
    {
        id: 6,
        title: "Acoustic Sunrise",
        artist: "Guitar Melodies",
        album: "Peaceful Morning",
        duration: 200,
        coverImagePath: "https://picsum.photos/id/60/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        tags: ["Acoustic", "Guitar", "Peaceful"]
    },
    {
        id: 7,
        title: "Digital Horizon",
        artist: "Techno Pulse",
        album: "Future Sound",
        duration: 270,
        coverImagePath: "https://picsum.photos/id/70/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
        tags: ["Techno", "Electronic", "Future"]
    },
    {
        id: 8,
        title: "Mountain Echo",
        artist: "Nature Harmony",
        album: "Wilderness",
        duration: 250,
        coverImagePath: "https://picsum.photos/id/80/300/300",
        audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        tags: ["Nature", "Instrumental", "Peaceful"]
    }
];

// 使用降级数据
function useFallbackData() {
    console.log('使用降级数据...');
    appState.tracks = fallbackTracks;
    renderTracksList(appState.tracks);
}

// 绑定事件监听器
function bindEventListeners() {
    // 音频事件
    if (dom.audio) {
        dom.audio.addEventListener('timeupdate', updateProgress);
        dom.audio.addEventListener('loadedmetadata', onMetadataLoaded);
        dom.audio.addEventListener('ended', handleTrackEnd);
        dom.audio.addEventListener('error', handleAudioError);
    }
    
    // 控制按钮事件
    if (dom.playBtn) dom.playBtn.addEventListener('click', togglePlayPause);
    if (dom.prevBtn) dom.prevBtn.addEventListener('click', playPreviousTrack);
    if (dom.nextBtn) dom.nextBtn.addEventListener('click', playNextTrack);
    
    // 进度条事件
    if (dom.progressBar) {
        dom.progressBar.addEventListener('click', seekTo);
    } else {
        // 如果没有找到进度条，尝试通过ID查找
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', seekTo);
        }
    }
    
    // 音量控制事件
    if (dom.volumeSlider) {
        dom.volumeSlider.addEventListener('input', adjustVolume);
        dom.volumeSlider.value = appState.volume;
    } else {
        // 如果没有找到音量滑块，尝试通过ID查找
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', adjustVolume);
            volumeSlider.value = appState.volume;
        }
    }
    
    // 播放模式事件
    if (dom.playModeBtn) dom.playModeBtn.addEventListener('click', togglePlayMode);
    
    // 随机播放按钮事件
    if (dom.shuffleBtn) {
        dom.shuffleBtn.addEventListener('click', () => {
            appState.playMode = appState.playMode === 'random' ? 'sequence' : 'random';
            updatePlayModeButtonUI();
            localStorage.setItem('myMusicVaultPlayMode', appState.playMode);
        });
    }
    
    // 静音按钮事件
    if (dom.volumeBtn) {
        dom.volumeBtn.addEventListener('click', toggleMute);
    }
    
    // 搜索事件 - 更可靠的实现
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-btn');
    
    console.log('搜索元素初始化: 输入框=', searchInput, '按钮=', searchBtn);
    
    // 为输入框添加事件监听
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        searchInput.addEventListener('keypress', handleEnterKey);
    }
    
    // 为搜索按钮添加事件监听
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // 回车事件处理函数
    function handleEnterKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    }
    
    // 主题切换事件
    if (dom.themeToggle) dom.themeToggle.addEventListener('click', toggleTheme);
    
    // 侧边栏切换事件
    if (dom.sidebarToggle) dom.sidebarToggle.addEventListener('click', toggleSidebar);
    
    // 点击歌曲列表项播放歌曲
    document.addEventListener('click', (e) => {
        // 处理track-item点击
        if (e.target.closest('.track-item')) {
            const trackElement = e.target.closest('.track-item');
            const trackId = parseInt(trackElement.dataset.trackId);
            playTrackById(trackId);
        }
        // 处理track-card点击
        else if (e.target.closest('.track-card')) {
            const cardElement = e.target.closest('.track-card');
            const trackId = parseInt(cardElement.dataset.trackId);
            playTrackById(trackId);
        }
        // 处理playnow按钮点击
        else if (e.target.closest('.play-btn-large') || e.target.closest('.large-play-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            // 查找带有data-track-id的元素
            const trackElement = e.target.closest('[data-track-id]');
            if (trackElement) {
                const trackId = parseInt(trackElement.dataset.trackId);
                playTrackById(trackId);
                return;
            }
            
            // 查找带有data-album-title的元素
            const albumElement = e.target.closest('[data-album-title]');
            if (albumElement) {
                const albumTitle = albumElement.dataset.albumTitle;
                // 找到该专辑中的第一首歌并播放
                const albumTrack = appState.tracks.find(track => 
                    track.album.toLowerCase() === albumTitle.toLowerCase()
                );
                if (albumTrack) {
                    playTrackById(albumTrack.id);
                } else if (appState.tracks.length > 0) {
                    // 如果没找到，就播放第一首
                    playTrackByIndex(0);
                }
                return;
            }
            
            // 如果都没找到，尝试播放第一首歌
            if (appState.tracks.length > 0) {
                playTrackByIndex(0);
            }
        }
        // 处理play-btn点击（用于歌单和专辑）
        else if (e.target.closest('.play-btn') && !e.target.closest('#play-pause-btn')) {
            e.preventDefault();
            e.stopPropagation();
            // 检查是否是歌单卡片中的播放按钮
            const playlistCard = e.target.closest('.playlist-card');
            if (playlistCard) {
                // 播放歌单中的第一首歌
                if (appState.tracks.length > 0) {
                    playTrackByIndex(0);
                }
                return;
            }
            // 检查是否是专辑卡片中的播放按钮
            const albumCard = e.target.closest('.album-card');
            if (albumCard) {
                const albumTitle = albumCard.querySelector('.album-title')?.textContent;
                if (albumTitle) {
                    // 找到该专辑中的第一首歌并播放
                    const albumTrack = appState.tracks.find(track => 
                        track.album.toLowerCase() === albumTitle.toLowerCase()
                    );
                    if (albumTrack) {
                        playTrackById(albumTrack.id);
                    } else if (appState.tracks.length > 0) {
                        // 如果没找到，就播放第一首
                        playTrackByIndex(0);
                    }
                }
            }
        }
    });
    
    // 收藏按钮事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const trackElement = e.target.closest('[data-track-id]');
            const trackId = parseInt(trackElement.dataset.trackId);
            toggleFavorite(trackId);
        }
        // 添加到歌单按钮事件
        else if (e.target.closest('.add-to-playlist-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.add-to-playlist-btn');
            const trackId = parseInt(btn.dataset.trackId);
            addToPlaylist(trackId);
        }
        // 检查是否直接点击了包含"添加到歌单"文本的按钮
        else if (e.target.classList.contains('action-btn') && e.target.textContent.includes('添加到歌单')) {
            e.preventDefault();
            e.stopPropagation();
            const trackElement = e.target.closest('[data-track-id]');
            if (trackElement) {
                const trackId = parseInt(trackElement.dataset.trackId);
                addToPlaylist(trackId);
            }
        }
    });
    
    // 窗口调整大小时更新侧边栏状态
    window.addEventListener('resize', updateSidebarOnResize);
}

// 初始化UI
function initializeUI() {
    // 设置默认主题
    if (appState.darkTheme) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    // 更新侧边栏显示状态
    updateSidebarOnResize();
    
    // 更新导航链接的活动状态
    updateActiveNavigationLinks();
    
    // 初始化音频音量（HTML中音量滑块是0-1范围）
    dom.audio.volume = appState.volume;
    if (dom.volumeSlider) {
        dom.volumeSlider.value = appState.volume;
    }
}

// 初始化本地存储数据
function initializeLocalStorageData() {
    // 初始化收藏列表
    const savedFavorites = localStorage.getItem('myMusicVaultFavorites');
    appState.favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    // 初始化最近播放列表
    const savedRecentPlays = localStorage.getItem('myMusicVaultRecentPlays');
    appState.recentPlays = savedRecentPlays ? JSON.parse(savedRecentPlays) : [];
    
    // 如果需要，将示例数据写入本地存储
    seedLocalStorageData();
    
    // 渲染最近播放列表（如果在最近播放页面）
    if (window.location.pathname.includes('recent.html')) {
        renderRecentPlaysList();
    }
    
    // 渲染收藏列表（如果在收藏页面）
    if (window.location.pathname.includes('favorites.html')) {
        renderFavoritesList();
    }
}

// 将示例数据写入本地存储（种子函数）
function seedLocalStorageData() {
    // 只有当本地存储为空时才写入示例数据
    if (appState.recentPlays.length === 0) {
        const mockRecentPlays = [1, 3, 5]; // 根据实际track IDs调整
        localStorage.setItem('myMusicVaultRecentPlays', JSON.stringify(mockRecentPlays));
        appState.recentPlays = mockRecentPlays;
    }
    
    if (appState.favorites.length === 0) {
        const mockFavorites = [2, 4]; // 根据实际track IDs调整
        localStorage.setItem('myMusicVaultFavorites', JSON.stringify(mockFavorites));
        appState.favorites = mockFavorites;
    }
}

// 加载上一次播放状态
function loadLastPlayState() {
    const lastPlayState = localStorage.getItem('myMusicVaultLastPlayState');
    if (lastPlayState) {
        try {
            const state = JSON.parse(lastPlayState);
            if (state.trackId && state.currentTime) {
                const track = appState.tracks.find(t => t.id === state.trackId);
                if (track) {
                    // 预加载上次播放的歌曲，但不自动播放
                    dom.audio.src = track.audioPath;
                    dom.audio.currentTime = Math.min(state.currentTime, track.duration);
                    
                    // 更新UI显示上次播放的歌曲
                    updatePlayerUI(track, state.trackIndex);
                }
            }
        } catch (error) {
            console.error('加载播放状态失败:', error);
        }
    }
}

// 保存当前播放状态
function savePlayState() {
    const playState = {
        trackId: appState.currentTrack?.id,
        trackIndex: appState.currentTrackIndex,
        currentTime: dom.audio.currentTime,
        isPlaying: appState.isPlaying
    };
    localStorage.setItem('myMusicVaultLastPlayState', JSON.stringify(playState));
}

// 切换播放/暂停
function togglePlayPause() {
    if (!dom.audio) {
        console.error('音频元素不存在');
        return;
    }
    
    if (!appState.currentTrack) {
        // 如果没有当前曲目，尝试播放第一首
        if (appState.tracks && appState.tracks.length > 0) {
            playTrackByIndex(0);
        }
        return;
    }
    
    // 先保存目标状态，避免闪烁
    const targetState = !appState.isPlaying;
    
    try {
        if (appState.isPlaying) {
            // 暂停播放
            try {
                // 先更新状态和UI，再执行实际的暂停操作
                appState.isPlaying = false;
                updatePlayButtonUI();
                
                dom.audio.pause();
                
                // 暂停专辑封面动画
                if (dom.miniPlayerCover) {
                    dom.miniPlayerCover.style.animation = 'none';
                }
                console.log('暂停播放成功');
            } catch (pauseError) {
                console.error('暂停失败:', pauseError);
                // 出错时确保状态正确
                appState.isPlaying = dom.audio && !dom.audio.paused;
                updatePlayButtonUI();
            }
        } else {
            // 开始播放 - 先更新状态，再执行播放
            appState.isPlaying = true;
            updatePlayButtonUI();
            
            dom.audio.play().then(() => {
                // 添加专辑封面动画
                if (dom.miniPlayerCover) {
                    dom.miniPlayerCover.style.animation = 'rotate 20s linear infinite';
                }
                console.log('开始播放成功');
            }).catch(error => {
                console.error('播放失败:', error);
                // 播放失败时回滚状态
                appState.isPlaying = false;
                updatePlayButtonUI();
            });
        }
    } catch (error) {
        console.error('切换播放状态时出错:', error);
        // 确保状态一致性
        appState.isPlaying = dom.audio && !dom.audio.paused;
        updatePlayButtonUI();
    }
}

// 将togglePlayPause暴露到全局，供mini-player.js调用
window.togglePlayPause = togglePlayPause;

// 播放当前歌曲
function playTrack() {
    if (dom.audio) {
        dom.audio.play().then(() => {
            appState.isPlaying = true;
            updatePlayButtonUI();
            // 如果有专辑封面动画，添加旋转效果
            if (dom.miniPlayerCover) {
                dom.miniPlayerCover.style.animation = 'rotate 20s linear infinite';
            }
        }).catch(error => {
            console.error('播放失败:', error);
        });
    }
}

// 暂停当前歌曲
function pauseTrack() {
    if (dom.audio) {
        dom.audio.pause();
        appState.isPlaying = false;
        updatePlayButtonUI();
        // 暂停专辑封面动画
        if (dom.miniPlayerCover) {
            dom.miniPlayerCover.style.animation = 'none';
        }
    }
}

// 播放上一首
function playPreviousTrack() {
    if (appState.currentTrackIndex > 0) {
        playTrackByIndex(appState.currentTrackIndex - 1);
    } else if (appState.playMode === 'loop') {
        // 如果是循环模式，播放最后一首
        playTrackByIndex(appState.tracks.length - 1);
    }
}

// 播放下一首
function playNextTrack() {
    if (appState.playMode === 'random') {
        // 随机播放模式
        const randomIndex = getRandomTrackIndex();
        playTrackByIndex(randomIndex);
    } else if (appState.currentTrackIndex < appState.tracks.length - 1) {
        // 顺序播放模式
        playTrackByIndex(appState.currentTrackIndex + 1);
    } else if (appState.playMode === 'loop') {
        // 如果是循环模式，播放第一首
        playTrackByIndex(0);
    }
}

// 随机获取歌曲索引（不重复当前歌曲）
function getRandomTrackIndex() {
    if (appState.tracks.length <= 1) return 0;
    
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * appState.tracks.length);
    } while (randomIndex === appState.currentTrackIndex);
    
    return randomIndex;
}

// 按索引播放歌曲
function playTrackByIndex(index) {
    if (index >= 0 && index < appState.tracks.length) {
        const track = appState.tracks[index];
        playSelectedTrack(track, index);
    }
}

// 按ID播放歌曲
function playTrackById(id) {
    const trackIndex = appState.tracks.findIndex(track => track.id === id);
    if (trackIndex !== -1) {
        playTrackByIndex(trackIndex);
    }
}

// 播放选定的歌曲
function playSelectedTrack(track, index) {
    if (!track || !track.audioPath || !dom.audio) {
        console.error('无效的曲目数据或音频元素');
        return;
    }
    
    appState.currentTrack = track;
    appState.currentTrackIndex = index;
    
    // 移除现有事件监听器，避免重复绑定
    dom.audio.removeEventListener('timeupdate', updateProgress);
    dom.audio.removeEventListener('loadedmetadata', onMetadataLoaded);
    dom.audio.removeEventListener('ended', handleTrackEnd);
    dom.audio.removeEventListener('error', handleAudioError);
    
    // 保存播放状态
    const wasPlaying = appState.isPlaying;
    
    // 设置音频源
    dom.audio.src = track.audioPath;
    
    // 重新绑定事件监听器
    dom.audio.addEventListener('timeupdate', updateProgress);
    dom.audio.addEventListener('loadedmetadata', onMetadataLoaded);
    dom.audio.addEventListener('ended', handleTrackEnd);
    dom.audio.addEventListener('error', handleAudioError);
    
    // 更新播放器UI
    updatePlayerUI(track, index);
    
    // 加载完成后播放
    dom.audio.oncanplay = function() {
        // 自动播放
        dom.audio.play().then(() => {
            appState.isPlaying = true;
            updatePlayButtonUI();
            
            // 添加到最近播放
            addToRecentPlays(track.id);
            
            // 如果在播放器页面，滚动到当前播放的歌曲
            if (window.location.pathname.includes('player.html')) {
                scrollToCurrentTrack();
            }
        }).catch(error => {
            console.error('播放失败:', error);
            appState.isPlaying = false;
            updatePlayButtonUI();
            alert('歌曲播放失败，请尝试其他歌曲。');
        });
        
        // 清除oncanplay处理程序，避免重复调用
        dom.audio.oncanplay = null;
    };
    
    // 显式加载音频
    dom.audio.load();
}

// 音频元数据加载完成处理函数
function onMetadataLoaded() {
    // 音频元数据加载完成后更新时长显示
    if (dom.duration && !isNaN(dom.audio.duration)) {
        dom.duration.textContent = formatTime(dom.audio.duration);
    }
}

// 更新播放器UI
function updatePlayerUI(track, index) {
    // 更新迷你播放器信息
    const miniPlayerTitle = document.getElementById('mini-player-title');
    const miniPlayerArtist = document.getElementById('mini-player-artist');
    const miniPlayerCover = document.getElementById('mini-player-cover');
    
    if (miniPlayerTitle) miniPlayerTitle.textContent = track.title || '未知歌曲';
    if (miniPlayerArtist) miniPlayerArtist.textContent = track.artist || '未知艺术家';
    if (miniPlayerCover) miniPlayerCover.src = track.coverImagePath || 'images/default-cover.png';
    
    // 更新详细播放器页面
    if (dom.largeCoverImage) dom.largeCoverImage.src = track.coverImagePath || 'images/default-cover.png';
    if (dom.trackTitle) dom.trackTitle.textContent = track.title || '未知歌曲';
    if (dom.trackArtist) dom.trackArtist.textContent = track.artist || '未知艺术家';
    if (dom.trackAlbum) dom.trackAlbum.textContent = track.album || '未知专辑';
    
    // 更新进度条
    if (dom.currentTime) dom.currentTime.textContent = '0:00';
    if (dom.duration) dom.duration.textContent = track.duration ? formatTime(track.duration) : '0:00';
    if (dom.progressFill) dom.progressFill.style.width = '0%';
    
    // 更新播放模式按钮图标
    updatePlayModeButtonUI();
    
    // 通知迷你播放器更新UI
    if (window.updateMiniPlayerUI) {
        window.updateMiniPlayerUI(track);
    }
}

// 更新播放按钮UI
function updatePlayButtonUI() {
    // 更新主播放按钮
    if (dom.playBtn) {
        dom.playBtn.textContent = appState.isPlaying ? '⏸' : '▶';
    }
    
    // 更新所有其他播放按钮
    document.querySelectorAll('.play-btn:not(#play-pause-btn)').forEach(btn => {
        if (btn.textContent.trim()) {
            btn.textContent = appState.isPlaying ? '⏸' : '▶';
        } else {
            // 如果按钮没有文本内容，可能使用图标
            if (btn.querySelector('i')) {
                const icon = btn.querySelector('i');
                if (appState.isPlaying) {
                    icon.className = 'fas fa-pause';
                } else {
                    icon.className = 'fas fa-play';
                }
            }
        }
    });
}

// 更新播放进度
function updateProgress() {
    if (!dom.audio || !dom.progressFill || !dom.currentTime) return;
    
    if (isNaN(dom.audio.duration)) return;
    
    const progress = (dom.audio.currentTime / dom.audio.duration) * 100;
    dom.progressFill.style.width = `${progress}%`;
    dom.currentTime.textContent = formatTime(dom.audio.currentTime);
    
    // 更新总时长
    if (dom.duration && !isNaN(dom.audio.duration)) {
        dom.duration.textContent = formatTime(dom.audio.duration);
    }
    
    // 定期保存播放状态
    if (Math.floor(dom.audio.currentTime) % 10 === 0) {
        savePlayState();
    }
}

// 设置音频总时长
function setDuration() {
    if (!dom.duration) return;
    dom.duration.textContent = formatTime(dom.audio.duration);
}

// 跳转到指定时间点
function seekTo(e) {
    if (!dom.audio || !dom.progressFill || !dom.currentTime) return;
    
    // 尝试找到进度条元素
    const progressBar = e.currentTarget;
    if (!progressBar) return;
    
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    if (!isNaN(dom.audio.duration)) {
        dom.audio.currentTime = pos * dom.audio.duration;
        
        // 立即更新进度条
        updateProgress();
    }
}

// 调整音量
function adjustVolume(e) {
    if (!dom.audio) return;
    
    // HTML中音量滑块是0-1范围的float值
    const volume = parseFloat(e.target.value);
    appState.volume = volume;
    dom.audio.volume = volume;
    
    // 更新音量按钮图标
    if (dom.volumeBtn) {
        if (volume === 0) {
            dom.volumeBtn.textContent = '🔇';
        } else if (volume < 0.3) {
            dom.volumeBtn.textContent = '🔈';
        } else if (volume < 0.7) {
            dom.volumeBtn.textContent = '🔉';
        } else {
            dom.volumeBtn.textContent = '🔊';
        }
    }
    
    // 保存音量设置
    localStorage.setItem('myMusicVaultVolume', volume);
}

// 切换播放模式
function togglePlayMode() {
    const modes = ['sequence', 'loop', 'random'];
    const currentIndex = modes.indexOf(appState.playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    appState.playMode = modes[nextIndex];
    
    updatePlayModeButtonUI();
    
    // 保存播放模式设置
    localStorage.setItem('myMusicVaultPlayMode', appState.playMode);
}

// 更新播放模式按钮UI
function updatePlayModeButtonUI() {
    // 更新重复按钮状态
    if (dom.playModeBtn) {
        switch (appState.playMode) {
            case 'sequence':
                dom.playModeBtn.textContent = '🔁';
                dom.playModeBtn.style.opacity = '0.6';
                dom.playModeBtn.title = '顺序播放';
                break;
            case 'loop':
                dom.playModeBtn.textContent = '🔁';
                dom.playModeBtn.style.opacity = '1';
                dom.playModeBtn.title = '循环播放';
                break;
            case 'random':
                // 如果有专门的随机按钮
                if (dom.shuffleBtn) {
                    dom.shuffleBtn.style.opacity = '1';
                }
                dom.playModeBtn.textContent = '🔁';
                dom.playModeBtn.style.opacity = '0.6';
                dom.playModeBtn.title = '随机播放';
                break;
        }
    }
    
    // 更新随机播放按钮状态
    if (dom.shuffleBtn) {
        dom.shuffleBtn.style.opacity = appState.playMode === 'random' ? '1' : '0.6';
    }
}

// 处理歌曲播放结束
function handleTrackEnd() {
    if (appState.playMode === 'sequence' && appState.currentTrackIndex < appState.tracks.length - 1) {
        // 顺序播放模式，播放下一首
        playNextTrack();
    } else if (appState.playMode === 'loop') {
        // 循环播放模式，重播当前歌曲
        dom.audio.currentTime = 0;
        dom.audio.play();
    } else {
        // 随机播放模式或播放列表结束
        playNextTrack();
    }
}

// 处理音频错误
function handleAudioError(error) {
    console.error('音频播放错误:', error);
    alert('音频播放出错，请尝试播放其他歌曲。');
    // 尝试播放下一首
    setTimeout(playNextTrack, 1000);
}

// 切换静音
function toggleMute() {
    if (!dom.audio) return;
    
    const wasMuted = dom.audio.muted;
    dom.audio.muted = !wasMuted;
    
    if (dom.volumeBtn) {
        if (dom.audio.muted) {
            dom.volumeBtn.textContent = '🔇';
        } else if (appState.volume < 0.3) {
            dom.volumeBtn.textContent = '🔈';
        } else if (appState.volume < 0.7) {
            dom.volumeBtn.textContent = '🔉';
        } else {
            dom.volumeBtn.textContent = '🔊';
        }
    }
}

// 切换主题
function toggleTheme() {
    appState.darkTheme = !appState.darkTheme;
    document.body.classList.toggle('dark-theme', appState.darkTheme);
    document.body.classList.toggle('light-theme', !appState.darkTheme);
    
    // 保存主题设置
    localStorage.setItem('myMusicVaultTheme', appState.darkTheme ? 'dark' : 'light');
}

// 切换侧边栏
function toggleSidebar() {
    if (dom.sidebar) {
        dom.sidebar.classList.toggle('active');
    }
}

// 窗口调整大小时更新侧边栏
function updateSidebarOnResize() {
    if (!dom.sidebar) return;
    
    if (window.innerWidth >= 992) {
        dom.sidebar.classList.remove('active');
    } else {
        dom.sidebar.classList.add('active');
    }
}

// 更新活动导航链接
function updateActiveNavigationLinks() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath.includes(linkPath)) {
            link.classList.add('active');
        }
    });
}

// 执行搜索的函数 - 全新实现
function performSearch() {
    console.log('performSearch 函数被调用');
    
    // 直接获取搜索输入框的值
    const searchInput = document.querySelector('.search-bar input');
    console.log('搜索输入框:', searchInput);
    
    if (!searchInput) {
        console.error('未找到搜索输入框');
        return;
    }
    
    // 获取搜索词并进行清理
    const searchTerm = searchInput.value.toLowerCase().trim();
    console.log('搜索关键词:', searchTerm);
    
    // 确保歌曲数据存在
    if (!appState.tracks || !Array.isArray(appState.tracks)) {
        console.error('歌曲数据不存在或格式错误');
        return;
    }
    
    // 执行搜索过滤
    const filteredTracks = appState.tracks.filter(track => {
        const matchesTitle = track.title.toLowerCase().includes(searchTerm);
        const matchesArtist = track.artist.toLowerCase().includes(searchTerm);
        const matchesAlbum = track.album.toLowerCase().includes(searchTerm);
        const matchesTag = track.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        console.log(`曲目 ${track.title} 匹配情况 - 标题:${matchesTitle}, 艺术家:${matchesArtist}, 专辑:${matchesAlbum}, 标签:${matchesTag}`);
        return matchesTitle || matchesArtist || matchesAlbum || matchesTag;
    });
    
    console.log('搜索结果数量:', filteredTracks.length);
    console.log('搜索结果:', filteredTracks);
    
    // 查找并更新所有可能的歌曲列表容器
    updateAllSongContainers(filteredTracks, searchTerm);
}

// 更新所有可能的歌曲容器
function updateAllSongContainers(filteredTracks, searchTerm) {
    console.log('开始更新歌曲容器');
    
    // 获取所有可能的容器
    const containers = [
        document.getElementById('tracks-grid'),      // 首页网格
        document.querySelector('.tracks-list'),       // 通用列表
        document.getElementById('recent-tracks'),     // 最近播放
        document.getElementById('discover-tracks'),   // 发现页面
        document.getElementById('local-tracks')       // 本地音乐
    ].filter(container => container !== null);
    
    console.log('找到的容器数量:', containers.length);
    console.log('容器列表:', containers);
    
    // 为每个容器更新内容
    containers.forEach(container => {
        console.log(`更新容器: ${container.id || container.className}`);
        container.innerHTML = '';
        
        if (filteredTracks.length === 0) {
            // 显示无结果消息
            const noResult = document.createElement('div');
            noResult.className = 'no-results';
            noResult.textContent = `没有找到包含 "${searchTerm}" 的歌曲`;
            container.appendChild(noResult);
        } else {
            // 根据容器类型渲染不同样式
            const isGridContainer = container.id === 'tracks-grid';
            
            if (isGridContainer) {
                // 网格布局渲染
                filteredTracks.forEach((track) => {
                    const isCurrentTrack = appState.currentTrack && appState.currentTrack.id === track.id;
                    
                    const trackCard = document.createElement('div');
                    trackCard.className = `track-card ${isCurrentTrack ? 'current-track' : ''}`;
                    trackCard.dataset.trackId = track.id;
                    
                    trackCard.innerHTML = `
                        <div class="track-card-cover">
                            <img src="${track.coverImagePath || 'images/default-cover.png'}" alt="${track.title}">
                            <div class="track-card-overlay">
                                <button class="play-btn-large">▶</button>
                            </div>
                        </div>
                        <div class="track-card-info">
                            <h3 class="track-card-title">${track.title}</h3>
                            <p class="track-card-artist">${track.artist}</p>
                            <p class="track-card-album">${track.album}</p>
                        </div>
                    `;
                    
                    container.appendChild(trackCard);
                });
            } else {
                // 列表布局渲染
                filteredTracks.forEach((track, index) => {
                    const isCurrentTrack = appState.currentTrack && appState.currentTrack.id === track.id;
                    const isFavorite = appState.favorites.includes(track.id);
                    
                    const trackItem = document.createElement('div');
                    trackItem.className = `track-item ${isCurrentTrack ? 'current-track' : ''}`;
                    trackItem.dataset.trackId = track.id;
                    
                    trackItem.innerHTML = `
                        <div class="track-item-number">${index + 1}</div>
                        <div class="track-item-cover">
                            <img src="${track.coverImagePath || 'images/default-cover.png'}" alt="${track.title}">
                        </div>
                        <div class="track-item-info">
                            <div class="track-item-title">${track.title}</div>
                            <div class="track-item-artist">${track.artist}</div>
                        </div>
                        <div class="track-item-album">${track.album}</div>
                        <div class="track-item-duration">${formatTime(track.duration)}</div>
                        <div class="track-item-actions">
                            <button class="favorite-btn" title="${isFavorite ? '取消收藏' : '添加收藏'}">
                                <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-broken'}"></i>
                            </button>
                        </div>
                    `;
                    
                    container.appendChild(trackItem);
                });
            }
        }
    });
    
    // 重新绑定点击事件
    bindTrackEvents();
}

// 绑定歌曲项点击事件
function bindTrackEvents() {
    // 点击歌曲列表项播放歌曲
    document.querySelectorAll('.track-item, .track-card').forEach(element => {
        element.addEventListener('click', (e) => {
            const trackId = parseInt(element.dataset.trackId);
            playTrackById(trackId);
        });
    });
    
    // 点击播放按钮
    document.querySelectorAll('.play-btn-large').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const trackCard = button.closest('.track-card');
            if (trackCard) {
                const trackId = parseInt(trackCard.dataset.trackId);
                playTrackById(trackId);
            }
        });
    });
}

// 保留旧的handleSearch函数以保证兼容性
function handleSearch(e) {
    console.log('旧的handleSearch函数被调用，重定向到performSearch');
    performSearch();
}

// 渲染歌曲列表
function renderTracksList(tracks, customContainer = null) {
    // 优先使用自定义容器
    let tracksListElement = customContainer;
    
    if (!tracksListElement) {
        // 尝试找到所有可能的歌曲列表容器
        tracksListElement = document.querySelector('.tracks-list');
        if (!tracksListElement) {
            tracksListElement = document.getElementById('local-tracks');
        }
        if (!tracksListElement) {
            tracksListElement = document.getElementById('recently-played');
        }
        if (!tracksListElement) {
            tracksListElement = document.getElementById('discover-tracks');
        }
        if (!tracksListElement) {
            console.error('未找到歌曲列表容器');
            return;
        }
    }
    
    tracksListElement.innerHTML = '';
    
    if (tracks.length === 0) {
        // 显示空状态
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = '暂无歌曲';
        tracksListElement.appendChild(emptyState);
        return;
    }
    
    tracks.forEach((track, index) => {
        const isCurrentTrack = appState.currentTrack && appState.currentTrack.id === track.id;
        const isFavorite = appState.favorites.includes(track.id);
        
        // 确保封面图片URL有效，如果无效使用默认图片
        let coverImageUrl = track.coverImagePath;
        if (!coverImageUrl || coverImageUrl.trim() === '') {
            coverImageUrl = 'images/default-cover.png';
        }
        
        const trackItem = document.createElement('div');
        trackItem.className = `track-item ${isCurrentTrack ? 'current-track' : ''}`;
        trackItem.dataset.trackId = track.id;
        
        trackItem.innerHTML = `
            <div class="track-item-number">${index + 1}</div>
            <div class="track-item-cover">
                <img src="${coverImageUrl}" alt="${track.title}" onerror="this.src='images/default-cover.png'">
            </div>
            <div class="track-item-info">
                <div class="track-item-title">${track.title}</div>
                <div class="track-item-artist">${track.artist}</div>
            </div>
            <div class="track-item-album">${track.album}</div>
            <div class="track-item-duration">${formatTime(track.duration)}</div>
            <div class="track-item-actions">
                <button class="favorite-btn" title="${isFavorite ? '取消收藏' : '添加收藏'}">
                    <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-broken'}"></i>
                </button>
            </div>
        `;
        
        tracksListElement.appendChild(trackItem);
    });
}

// 渲染推荐内容
function renderFeaturedContent() {
    // 从歌曲中选择一首作为推荐
    const featuredTrack = appState.tracks[0]; // 简单起见，选择第一首
    if (!featuredTrack) return;
    
    const featuredSection = document.querySelector('.featured-section');
    if (!featuredSection) return;
    
    const featuredContent = `
        <div class="featured-track" data-track-id="${featuredTrack.id}">
            <div class="featured-cover">
                <img src="${featuredTrack.coverImagePath || 'images/default-cover.png'}" alt="${featuredTrack.title}" class="featured-image">
                <div class="play-overlay">
                    <button class="play-btn play-btn-large">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="featured-info">
                <span class="featured-tag">精选推荐</span>
                <h2 class="featured-title">${featuredTrack.title}</h2>
                <p class="featured-artist">${featuredTrack.artist}</p>
                <p class="featured-desc">${featuredTrack.album} 专辑中的热门歌曲，以其动人旋律和深情歌词深受听众喜爱。</p>
                <div class="featured-actions">
                    <button class="play-btn large-play-btn" data-track-id="${featuredTrack.id}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn add-to-playlist-btn" data-track-id="${featuredTrack.id}">
                        <i class="fas fa-plus"></i> 添加到歌单
                    </button>
                    <button class="action-btn favorite-btn" data-track-id="${featuredTrack.id}">
                        <i class="fas fa-heart-broken"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    featuredSection.innerHTML = featuredContent;
}

// 渲染专辑网格
function renderAlbumsGrid() {
    const albumsSection = document.querySelector('.albums-section');
    if (!albumsSection) return;
    
    // 按专辑分组
    const albums = {};
    appState.tracks.forEach(track => {
        if (!albums[track.album]) {
            albums[track.album] = {
                title: track.album,
                artist: track.artist,
                coverImagePath: track.coverImagePath,
                trackCount: 0
            };
        }
        albums[track.album].trackCount++;
    });
    
    const albumsGrid = document.createElement('div');
    albumsGrid.className = 'albums-grid';
    
    Object.values(albums).forEach(album => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        
        albumCard.innerHTML = `
            <div class="album-cover">
                <img src="${album.coverImagePath || 'images/default-cover.png'}" alt="${album.title}">
                <div class="play-overlay">
                    <button class="play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <h3 class="album-title">${album.title}</h3>
            <p class="album-artist">${album.artist}</p>
        `;
        
        albumsGrid.appendChild(albumCard);
    });
    
    albumsSection.appendChild(albumsGrid);
}

// 渲染标签容器
function renderTagsContainer() {
    // 同时检查ID和类选择器
    let tagsContainer = document.getElementById('tags-container') || document.querySelector('.tags-container');
    if (!tagsContainer) return;
    
    // 清空容器
    tagsContainer.innerHTML = '';
    
    // 从歌曲数据中收集所有标签
    const trackTags = new Set();
    appState.tracks.forEach(track => {
        if (track.tags && Array.isArray(track.tags)) {
            track.tags.forEach(tag => trackTags.add(tag));
        }
    });
    
    // 添加"所有"选项
    const allTag = document.createElement('button');
    allTag.className = 'tag-btn active';
    allTag.textContent = 'All Genres';
    allTag.dataset.genre = 'all';
    
    allTag.addEventListener('click', () => {
        // 更新标签选中状态
        document.querySelectorAll('.tag-btn').forEach(t => {
            t.classList.remove('active');
        });
        allTag.classList.add('active');
        
        // 显示所有歌曲
        renderTracksList(appState.tracks);
    });
    
    tagsContainer.appendChild(allTag);
    
    // 添加所有标签
    [...trackTags].forEach(tag => {
        const tagElement = document.createElement('button');
        tagElement.className = 'tag-btn';
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag;
        
        tagElement.addEventListener('click', () => {
            // 筛选包含特定标签的歌曲
            const filteredTracks = appState.tracks.filter(track => 
                track.tags && Array.isArray(track.tags) && 
                track.tags.some(trackTag => trackTag.toLowerCase() === tag.toLowerCase())
            );
            
            // 找到要渲染的容器，优先使用discover-tracks容器
            let tracksContainer = document.getElementById('discover-tracks');
            if (tracksContainer && tracksContainer.offsetParent) {
                // 在discover页面，使用discover-tracks容器
                if (filteredTracks.length > 0) {
                    renderTracksList(filteredTracks, tracksContainer);
                } else {
                    tracksContainer.innerHTML = `<p class="no-results">没有找到包含"${tag}"标签的歌曲。</p>`;
                }
            } else {
                // 在其他页面，使用默认容器
                renderTracksList(filteredTracks);
            }
            
            // 更新标签选中状态
            document.querySelectorAll('.tag-btn').forEach(t => {
                t.classList.remove('active');
            });
            tagElement.classList.add('active');
        });
        
        tagsContainer.appendChild(tagElement);
    });
}

// 渲染歌单网格
function renderPlaylistsGrid() {
    console.log('开始渲染歌单网格');
    
    // 检查是否在playlists.html页面
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer) {
        console.log('在playlists.html页面，渲染歌单到grid-container');
        gridContainer.innerHTML = '';
        
        if (appState.playlists.length === 0) {
            gridContainer.innerHTML = '<div class="empty-state">暂无歌单数据</div>';
            return;
        }
        
        appState.playlists.forEach(playlist => {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            gridItem.setAttribute('onclick', `showSongs('${playlist.id}')`);
            
            gridItem.innerHTML = `
                <div class="item-cover">
                    <img src="${playlist.coverImagePath}" alt="${playlist.name}">
                    <div class="play-icon"><i class="fas fa-play"></i></div>
                </div>
                <div class="item-info">
                    <h3>${playlist.name}</h3>
                    <p>${playlist.trackIds.length} 首歌曲</p>
                </div>
            `;
            
            gridContainer.appendChild(gridItem);
        });
        
        return;
    }
    
    // 其他页面的歌单渲染
    const playlistsSection = document.querySelector('.playlists-section');
    if (!playlistsSection) {
        console.log('未找到歌单容器，跳过渲染');
        return;
    }
    
    // 使用真实歌单数据
    const playlists = appState.playlists.map(playlist => ({
        id: playlist.id,
        title: playlist.name,
        description: playlist.description,
        coverImagePath: playlist.coverImagePath,
        trackCount: playlist.trackIds.length
    }));
    
    const playlistsGrid = document.createElement('div');
    playlistsGrid.className = 'playlists-grid';
    
    playlists.forEach(playlist => {
        const playlistCard = document.createElement('div');
        playlistCard.className = 'playlist-card';
        playlistCard.dataset.playlistId = playlist.id;
        
        // 确保封面图片URL有效
        let coverImageUrl = playlist.coverImagePath;
        if (!coverImageUrl || coverImageUrl.trim() === '') {
            coverImageUrl = 'images/default-playlist.png';
        }
        
        playlistCard.innerHTML = `
            <div class="playlist-cover">
                <img src="${coverImageUrl}" alt="${playlist.title}" onerror="this.src='images/default-playlist.png'">
            </div>
            <h3 class="playlist-title">${playlist.title}</h3>
            <p class="playlist-desc">${playlist.description}</p>
            <div class="playlist-actions">
                <button class="play-btn" data-playlist-id="${playlist.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="action-btn edit-playlist-btn" data-playlist-id="${playlist.id}">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
        `;
        
        // 添加点击事件
        playlistCard.addEventListener('click', function(e) {
            // 如果点击的是按钮，不触发整个卡片的点击事件
            if (e.target.closest('button')) {
                return;
            }
            
            // 显示歌单内容
            showPlaylistContent(playlist.id, playlist.title);
        });
        
        playlistsGrid.appendChild(playlistCard);
    });
    
    // 添加新建歌单按钮
    const addPlaylistCard = document.createElement('div');
    addPlaylistCard.className = 'playlist-card add-playlist';
    
    addPlaylistCard.innerHTML = `
        <div class="add-playlist-content">
            <span>+</span>
            <p>创建新歌单</p>
        </div>
    `;
    
    // 新建歌单点击事件
    addPlaylistCard.addEventListener('click', function() {
        const playlistName = prompt('请输入新歌单名称:');
        if (playlistName && playlistName.trim()) {
            alert('歌单 "' + playlistName + '" 创建成功！');
            // 这里可以添加实际创建歌单的逻辑
            renderPlaylistsGrid(); // 重新渲染歌单列表
        }
    });
    
    playlistsGrid.appendChild(addPlaylistCard);
    
    // 先清空再添加，避免重复
    const existingGrid = playlistsSection.querySelector('.playlists-grid');
    if (existingGrid) {
        playlistsSection.removeChild(existingGrid);
    }
    
    playlistsSection.appendChild(playlistsGrid);
}

// 显示歌单内容
function showPlaylistContent(playlistId, playlistTitle) {
    console.log('显示歌单内容:', playlistId, playlistTitle);
    
    // 创建或更新歌单内容区域
    let playlistContentSection = document.querySelector('.playlist-content-section');
    if (!playlistContentSection) {
        playlistContentSection = document.createElement('section');
        playlistContentSection.className = 'playlist-content-section';
        
        // 插入到合适的位置
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const sectionHeader = mainContent.querySelector('.section-header');
            if (sectionHeader) {
                mainContent.insertBefore(playlistContentSection, sectionHeader.nextSibling);
            } else {
                mainContent.appendChild(playlistContentSection);
            }
        }
    }
    
    // 设置歌单标题
    playlistContentSection.innerHTML = `
        <div class="section-header">
            <h2>${playlistTitle}</h2>
        </div>
        <div class="tracks-list" id="playlist-tracks"></div>
    `;
    
    // 根据歌单ID过滤歌曲
    let playlistTracks = [];
    if (playlistId === 1) { // 我的最爱歌单
        playlistTracks = appState.tracks.filter(track => 
            appState.favorites.includes(track.id)
        );
    } else if (playlistId === 2) { // 驾车必备歌单（模拟数据）
        playlistTracks = appState.tracks.filter(track => 
            track.tags.some(tag => ['Electronic', 'Pop'].includes(tag))
        );
    } else if (playlistId === 3) { // 放松心情歌单（模拟数据）
        playlistTracks = appState.tracks.filter(track => 
            track.tags.some(tag => ['Chill', 'Ambient', 'Peaceful'].includes(tag))
        );
    } else {
        // 其他歌单使用默认数据
        playlistTracks = appState.tracks;
    }
    
    // 渲染歌单中的歌曲
    const tracksListElement = document.getElementById('playlist-tracks');
    if (tracksListElement) {
        tracksListElement.innerHTML = '';
        
        if (playlistTracks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = '此歌单暂无歌曲';
            tracksListElement.appendChild(emptyState);
        } else {
            playlistTracks.forEach((track, index) => {
                const isCurrentTrack = appState.currentTrack && appState.currentTrack.id === track.id;
                const isFavorite = appState.favorites.includes(track.id);
                
                const trackItem = document.createElement('div');
                trackItem.className = `track-item ${isCurrentTrack ? 'current-track' : ''}`;
                trackItem.dataset.trackId = track.id;
                
                trackItem.innerHTML = `
                    <div class="track-item-number">${index + 1}</div>
                    <div class="track-item-cover">
                        <img src="${track.coverImagePath || 'images/default-cover.png'}" alt="${track.title}" onerror="this.src='images/default-cover.png'">
                    </div>
                    <div class="track-item-info">
                        <div class="track-item-title">${track.title}</div>
                        <div class="track-item-artist">${track.artist}</div>
                    </div>
                    <div class="track-item-album">${track.album}</div>
                    <div class="track-item-duration">${formatTime(track.duration)}</div>
                    <div class="track-item-actions">
                        <button class="favorite-btn" title="${isFavorite ? '取消收藏' : '添加收藏'}">
                            <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-broken'}"></i>
                        </button>
                    </div>
                `;
                
                tracksListElement.appendChild(trackItem);
            });
        }
    }
    
    // 滚动到歌单内容区域
    playlistContentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 渲染最近播放列表
function renderRecentPlaysList() {
    const tracksListElement = document.querySelector('.tracks-list');
    if (!tracksListElement) return;
    
    // 获取最近播放的歌曲对象
    const recentTracks = appState.recentPlays
        .map(trackId => appState.tracks.find(t => t.id === trackId))
        .filter(track => track !== undefined);
    
    renderTracksList(recentTracks);
}

// 渲染收藏列表
function renderFavoritesList() {
    const tracksListElement = document.querySelector('.tracks-list');
    if (!tracksListElement) return;
    
    // 获取收藏的歌曲对象
    const favoriteTracks = appState.tracks.filter(track => 
        appState.favorites.includes(track.id)
    );
    
    renderTracksList(favoriteTracks);
}

// 从本地存储加载歌单数据
function loadPlaylistsFromLocalStorage() {
    console.log('从本地存储加载歌单数据');
    const savedPlaylists = localStorage.getItem('myMusicVaultPlaylists');
    if (savedPlaylists) {
        try {
            appState.playlists = JSON.parse(savedPlaylists);
            console.log('成功加载歌单数据:', appState.playlists.length, '个歌单');
        } catch (e) {
            console.error('加载歌单数据失败:', e);
            appState.playlists = [];
        }
    }
    
    // 如果没有歌单数据，初始化默认歌单
    if (appState.playlists.length === 0) {
        console.log('未找到歌单数据，初始化默认歌单');
        appState.playlists = [
            {
                id: 'favorites',
                name: '我的最爱',
                description: '我收藏的所有喜欢的歌曲',
                coverImagePath: 'images/playlist1.svg',
                trackIds: []
            },
            {
                id: 'driving',
                name: '驾车必备',
                description: '适合开车时听的动感音乐',
                coverImagePath: 'images/playlist2.svg',
                trackIds: []
            },
            {
                id: 'relaxing',
                name: '放松心情',
                description: '舒缓压力，放松身心',
                coverImagePath: 'images/playlist3.svg',
                trackIds: []
            },
            {
                id: 'workout',
                name: '健身专用',
                description: '充满活力的健身音乐',
                coverImagePath: 'images/cover1.png',
                trackIds: []
            },
            {
                id: 'study',
                name: '学习专注',
                description: '安静的背景音乐',
                coverImagePath: 'images/cover2.png',
                trackIds: []
            }
        ];
        savePlaylistsToLocalStorage();
    }
}

// 保存歌单数据到本地存储
function savePlaylistsToLocalStorage() {
    try {
        localStorage.setItem('myMusicVaultPlaylists', JSON.stringify(appState.playlists));
        console.log('歌单数据已保存到本地存储');
    } catch (e) {
        console.error('保存歌单数据失败:', e);
    }
}

// 添加到歌单
function addToPlaylist(trackId) {
    console.log('添加歌曲到歌单:', trackId);
    
    // 显示可用歌单选项
    const track = appState.tracks.find(t => t.id === trackId);
    if (!track) {
        console.error('找不到对应的歌曲:', trackId);
        return;
    }
    
    // 构建歌单选择提示
    let playlistOptions = '';
    appState.playlists.forEach((playlist, index) => {
        playlistOptions += `${index + 1}. ${playlist.name} (${playlist.trackIds.length}首歌曲)\n`;
    });
    playlistOptions += '\n或输入新歌单名称创建新歌单:';
    
    // 让用户选择歌单
    const playlistInput = prompt('请选择歌单添加:\n' + playlistOptions);
    
    if (!playlistInput || playlistInput.trim() === '') {
        return; // 用户取消操作
    }
    
    // 处理用户输入
    const inputNumber = parseInt(playlistInput);
    let playlist;
    
    if (!isNaN(inputNumber) && inputNumber >= 1 && inputNumber <= appState.playlists.length) {
        // 选择现有歌单
        playlist = appState.playlists[inputNumber - 1];
    } else {
        // 创建新歌单
        const newPlaylistName = playlistInput.trim();
        
        // 检查歌单名称是否已存在
        if (appState.playlists.some(p => p.name === newPlaylistName)) {
            alert('歌单名称已存在，请使用其他名称');
            return;
        }
        
        playlist = {
            id: 'custom-' + Date.now(),
            name: newPlaylistName,
            description: '自定义歌单',
            coverImagePath: 'images/default-playlist.png',
            trackIds: []
        };
        
        appState.playlists.push(playlist);
        console.log('创建新歌单:', playlist.name);
    }
    
    // 添加歌曲到歌单
    if (!playlist.trackIds.includes(trackId)) {
        playlist.trackIds.push(trackId);
        
        // 如果是"我的最爱"歌单，同时也添加到收藏
        if (playlist.id === 'favorites' && !appState.favorites.includes(trackId)) {
            appState.favorites.push(trackId);
            localStorage.setItem('myMusicVaultFavorites', JSON.stringify(appState.favorites));
        }
        
        // 保存歌单数据
        savePlaylistsToLocalStorage();
        
        alert(`歌曲 "${track.title}" 已添加到歌单 "${playlist.name}"`);
        
        // 如果在歌单页面，刷新显示
        if (window.location.pathname.includes('playlists.html')) {
            renderPlaylistsGrid();
        }
    } else {
        alert(`歌曲 "${track.title}" 已经在歌单 "${playlist.name}" 中了`);
    }
}

// 添加到最近播放
function addToRecentPlays(trackId) {
    // 从列表中移除（如果已存在）
    appState.recentPlays = appState.recentPlays.filter(id => id !== trackId);
    
    // 添加到列表开头
    appState.recentPlays.unshift(trackId);
    
    // 限制列表长度
    if (appState.recentPlays.length > 50) {
        appState.recentPlays = appState.recentPlays.slice(0, 50);
    }
    
    // 保存到本地存储
    localStorage.setItem('myMusicVaultRecentPlays', JSON.stringify(appState.recentPlays));
}

// 切换收藏状态
function toggleFavorite(trackId) {
    const index = appState.favorites.indexOf(trackId);
    
    if (index === -1) {
        // 添加到收藏
        appState.favorites.push(trackId);
    } else {
        // 从收藏中移除
        appState.favorites.splice(index, 1);
    }
    
    // 更新UI
    const favoriteButtons = document.querySelectorAll(`.favorite-btn[data-track-id="${trackId}"]`);
    favoriteButtons.forEach(btn => {
        const icon = btn.querySelector('i');
        if (appState.favorites.includes(trackId)) {
            icon.className = 'fas fa-heart';
            btn.title = '取消收藏';
        } else {
            icon.className = 'fas fa-heart-broken';
            btn.title = '添加收藏';
        }
    });
    
    // 保存到本地存储
    localStorage.setItem('myMusicVaultFavorites', JSON.stringify(appState.favorites));
    
    // 如果在收藏页面，重新渲染列表
    if (window.location.pathname.includes('favorites.html')) {
        renderFavoritesList();
    }
}

// 滚动到当前播放的歌曲
function scrollToCurrentTrack() {
    const currentTrackElement = document.querySelector('.track-item.current-track');
    if (currentTrackElement) {
        currentTrackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 格式化时间（秒 -> MM:SS）
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 暴露关键函数到全局作用域，供其他脚本使用
window.togglePlayPause = togglePlayPause;
window.playNextTrack = playNextTrack;
window.playPreviousTrack = playPreviousTrack;
window.formatTime = formatTime;
window.appState = appState;
window.renderTracksList = renderTracksList;
window.renderPlaylistsGrid = renderPlaylistsGrid;
window.loadPlaylistsFromLocalStorage = loadPlaylistsFromLocalStorage;

// 为playlists.html提供showSongs函数
window.showSongs = function(playlistId) {
    console.log('显示歌单内容:', playlistId);
    
    const playlist = appState.playlists.find(p => p.id === playlistId);
    if (!playlist) {
        console.error('找不到歌单:', playlistId);
        return;
    }
    
    // 获取歌单中的歌曲
    const playlistTracks = playlist.trackIds
        .map(trackId => appState.tracks.find(t => t.id === trackId))
        .filter(track => track !== undefined);
    
    // 更新页面标题
    const headerTitle = document.querySelector('.header-info h1');
    if (headerTitle) {
        headerTitle.textContent = playlist.name;
    }
    
    // 更新歌曲数量显示
    const headerDesc = document.querySelector('.header-info p');
    if (headerDesc) {
        headerDesc.textContent = `创建于 ${new Date().toLocaleDateString()} · ${playlist.trackIds.length} 首歌曲`;
    }
    
    // 渲染歌曲列表
    const songListElement = document.getElementById('song-list');
    const discoverTracksElement = document.getElementById('discover-tracks');
    
    if (songListElement) {
        songListElement.innerHTML = '';
        
        if (playlistTracks.length === 0) {
            songListElement.innerHTML = '<div class="empty-state">此歌单暂无歌曲</div>';
            return;
        }
        
        playlistTracks.forEach((track, index) => {
            const isCurrentTrack = appState.currentTrack && appState.currentTrack.id === track.id;
            const isFavorite = appState.favorites.includes(track.id);
            
            const songItem = document.createElement('div');
            songItem.className = `song-item ${isCurrentTrack ? 'current-track' : ''}`;
            songItem.dataset.trackId = track.id;
            
            songItem.innerHTML = `
                <div class="song-number">${index + 1}</div>
                <div class="song-title">
                    <img src="${track.coverImagePath || 'images/default-cover.png'}" alt="${track.title}" class="song-cover">
                    <div>
                        <h4>${track.title}</h4>
                        <p>${track.artist}</p>
                    </div>
                </div>
                <div class="song-artist">${track.artist}</div>
                <div class="song-album">${track.album}</div>
                <div class="song-duration">${formatTime(track.duration)}</div>
                <div class="song-actions">
                    <button class="play-button"><i class="fas fa-play"></i></button>
                    <button class="favorite-button" data-track-id="${track.id}"><i class="fas ${isFavorite ? 'fa-heart' : 'far fa-heart'}"></i></button>
                </div>
            `;
            
            songListElement.appendChild(songItem);
        });
        
        // 添加事件监听
        attachPlaylistEventListeners();
    } else if (discoverTracksElement) {
        renderTracksList(playlistTracks, discoverTracksElement);
    }
};

// 为歌单页面添加事件监听器
function attachPlaylistEventListeners() {
    // 播放按钮事件
    document.querySelectorAll('.song-item .play-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const songItem = this.closest('.song-item');
            const trackId = parseInt(songItem.dataset.trackId);
            playTrackById(trackId);
        });
    });
    
    // 收藏按钮事件
    document.querySelectorAll('.song-item .favorite-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const trackId = parseInt(this.dataset.trackId);
            toggleFavorite(trackId);
        });
    });
    
    // 点击歌曲项播放
    document.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', function() {
            const trackId = parseInt(this.dataset.trackId);
            playTrackById(trackId);
        });
    });
}

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}