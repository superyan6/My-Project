// mini-player.js - 处理底部迷你播放器逻辑
function initMiniPlayer() {
    // 使用共享的音频元素
    const audioElement = document.getElementById('audio-player');
    if (!audioElement) {
        console.error('音频元素未找到');
        return;
    }
    
    // 尝试恢复之前的播放状态
    restoreAudioState(audioElement);
    
    // 初始化播放模式
    window.playMode = window.playMode || 'sequence'; // sequence: 顺序播放, loop: 列表循环, single: 单曲循环, shuffle: 随机播放
    
    // 创建并初始化随机播放索引数组
    window.shuffleIndices = [];

    // 缓存DOM元素
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const miniPlayerImg = document.getElementById('mini-player-cover');
    const miniPlayerTitle = document.getElementById('mini-player-title');
    const miniPlayerArtist = document.getElementById('mini-player-artist');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn') || createRepeatButton();
    
    // 创建并初始化播放列表面板
    initPlaylistPanel();
    const playlistToggleBtn = document.getElementById('playlist-toggle-btn') || createPlaylistToggleButton();

    // 检查是否有必要的DOM元素
    if (!playPauseBtn || !prevBtn || !nextBtn || !progressBar || !progressFill) {
        console.error('迷你播放器的必要元素未找到');
        return;
    }

    // 播放/暂停控制
    playPauseBtn.addEventListener('click', () => {
        if (window.togglePlayPause) {
            window.togglePlayPause();
        } else {
            console.error('togglePlayPause函数未找到');
        }
    });

    // 上一首
    prevBtn.addEventListener('click', () => {
        if (window.playPreviousTrack) {
            window.playPreviousTrack();
        } else {
            console.error('playPreviousTrack函数未找到');
        }
    });

    // 下一首
    nextBtn.addEventListener('click', () => {
        if (window.playNextTrack) {
            window.playNextTrack();
        } else {
            console.error('playNextTrack函数未找到');
        }
    });
    
    // 播放列表切换按钮事件
    playlistToggleBtn.addEventListener('click', togglePlaylistPanel);

    // 进度条点击事件
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (!audioElement) return;
            
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audioElement.currentTime = pos * audioElement.duration;
        });
    }

    // 更新进度条和时间显示
    function updateProgress() {
        if (!audioElement) return;
        
        const { duration, currentTime } = audioElement;
        
        if (isNaN(duration)) {
            progressFill.style.width = '0%';
            currentTimeEl.textContent = '0:00';
            totalTimeEl.textContent = '0:00';
            return;
        }
        
        const progress = (currentTime / duration) * 100;
        progressFill.style.width = `${progress}%`;
        
        // 使用全局的formatTime函数或内部实现
        const formatTimeFn = window.formatTime || function(seconds) {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        currentTimeEl.textContent = formatTimeFn(currentTime);
        totalTimeEl.textContent = formatTimeFn(duration);
    }

    // 音量控制
    if (volumeBtn && volumeSlider) {
        volumeBtn.addEventListener('click', () => {
            audioElement.muted = !audioElement.muted;
            volumeBtn.textContent = audioElement.muted ? '🔇' : '🔊';
        });

        volumeSlider.addEventListener('input', () => {
            audioElement.volume = volumeSlider.value;
        });
    }

    // 监听音频事件
    if (audioElement) {
        // 确保移除任何现有的事件监听器，防止重复监听
        const cleanupProgressListeners = () => {
            try {
                audioElement.removeEventListener('timeupdate', updateProgress);
                audioElement.removeEventListener('loadedmetadata', updateProgress);
                audioElement.removeEventListener('ended', handleTrackEnd);
            } catch (e) {
                console.log('清理现有监听器时出错:', e);
            }
        };
        
        cleanupProgressListeners();
        
        // 添加新的事件监听器
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('loadedmetadata', updateProgress);
        audioElement.addEventListener('ended', handleTrackEnd); // 监听歌曲结束事件
    }
    if (audioElement) {
        audioElement.addEventListener('play', () => {
            if (playPauseBtn) {
                playPauseBtn.textContent = '⏸';
            }
        });
        audioElement.addEventListener('pause', () => {
            if (playPauseBtn) {
                playPauseBtn.textContent = '▶';
            }
        });
    }
    
    // 初始化播放模式按钮
    updatePlayModeButton();

    // 更新迷你播放器UI
window.updateMiniPlayerUI = function(track) {
    if (track) {
        // 更新歌曲信息
        if (miniPlayerTitle) {
            miniPlayerTitle.textContent = track.title || '未知歌曲';
        }
        if (miniPlayerArtist) {
            miniPlayerArtist.textContent = track.artist || '未知艺术家';
        }
        if (miniPlayerImg) {
            // 设置封面图片并添加错误处理
            miniPlayerImg.src = track.coverImagePath || 'https://picsum.photos/id/24/64/64';
            miniPlayerImg.onerror = function() {
                this.src = 'https://picsum.photos/id/24/64/64';
            };
        }
        
        // 保存当前播放的歌曲信息
        saveAudioState(audioElement, track);
    }
    
    // 更新播放状态
    if (playPauseBtn) {
        playPauseBtn.textContent = audioElement && !audioElement.paused ? '⏸' : '▶';
    }
    
    // 更新进度条
    updateProgress();
};

// 播放历史功能已集成到saveAudioState函数中

// 保存音频播放状态到localStorage
function saveAudioState(audioElement, track) {
    try {
        // 保存当前播放状态
        const audioState = {
            currentTime: audioElement.currentTime,
            paused: audioElement.paused,
            volume: audioElement.volume,
            track: track,
            trackIndex: window.currentTrackIndex,
            playMode: window.playMode,
            timestamp: Date.now() // 添加时间戳，用于判断状态是否过期
        };
        localStorage.setItem('miniPlayerState', JSON.stringify(audioState));
        
        // 如果有歌曲信息，单独保存到播放历史中
        if (track && track.id) {
            try {
                // 获取现有的播放历史
                let playHistory = JSON.parse(localStorage.getItem('miniPlayerPlayHistory') || '[]');
                
                // 移除已存在的相同歌曲（避免重复）
                playHistory = playHistory.filter(item => item.id !== track.id);
                
                // 添加到历史记录开头
                playHistory.unshift({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    coverImagePath: track.coverImagePath,
                    audioPath: track.audioPath,
                    duration: track.duration,
                    playedAt: Date.now()
                });
                
                // 限制历史记录长度（最多保存50首）
                if (playHistory.length > 50) {
                    playHistory = playHistory.slice(0, 50);
                }
                
                // 保存到localStorage
                localStorage.setItem('miniPlayerPlayHistory', JSON.stringify(playHistory));
            } catch (e) {
                console.error('保存播放历史失败:', e);
            }
        }
    } catch (e) {
        console.error('保存音频状态失败:', e);
    }
}

// 从localStorage恢复音频播放状态
function restoreAudioState(audioElement) {
    try {
        const savedState = localStorage.getItem('miniPlayerState');
        if (savedState) {
            const audioState = JSON.parse(savedState);
            
            // 检查状态是否在合理时间内（例如5分钟内）
            const now = Date.now();
            const stateAge = now - audioState.timestamp;
            const maxAge = 5 * 60 * 1000; // 5分钟
            
            if (stateAge < maxAge && audioState.track && audioState.track.audioPath) {
                // 设置音频源
                audioElement.src = audioState.track.audioPath;
                audioElement.volume = audioState.volume;
                
                // 恢复播放模式
                if (audioState.playMode) {
                    window.playMode = audioState.playMode;
                }
                
                // 恢复当前播放索引
                if (audioState.trackIndex !== undefined) {
                    window.currentTrackIndex = audioState.trackIndex;
                }
                
                // 更新播放模式按钮
                updatePlayModeButton();
                
                // 当音频元数据加载完成后，设置当前时间并恢复播放状态
                audioElement.addEventListener('loadedmetadata', function onLoadedMetadata() {
                    audioElement.currentTime = audioState.currentTime;
                    
                    // 如果之前是播放状态，则恢复播放
                    if (!audioState.paused) {
                        audioElement.play().catch(err => {
                            console.error('自动播放失败:', err);
                        });
                    }
                    
                    // 更新全局当前播放的歌曲
                    window.currentTrack = audioState.track;
                    
                    // 更新迷你播放器UI
                    updateMiniPlayerUI(audioState.track);
                    
                    // 更新播放列表
                    if (window.updatePlaylistItems) {
                        window.updatePlaylistItems();
                    }
                    
                    // 移除事件监听器
                    audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                });
            }
        }
    } catch (e) {
        console.error('恢复音频状态失败:', e);
    }
}

// 监听音频播放状态变化，自动保存
function setupAutoSave(audioElement) {
    // 定期保存播放状态
    setInterval(() => {
        if (window.currentTrack) {
            saveAudioState(audioElement, window.currentTrack);
        }
    }, 5000); // 每5秒保存一次
    
    // 页面卸载前保存
    window.addEventListener('beforeunload', () => {
        if (window.currentTrack) {
            saveAudioState(audioElement, window.currentTrack);
        }
    });
}

    // 启用自动保存功能
    setupAutoSave(audioElement);
    
    console.log('Mini player initialized and integrated with main player');
}

// 创建播放列表切换按钮
function createPlaylistToggleButton() {
    const volumeControl = document.querySelector('.volume-control');
    if (!volumeControl) return null;
    
    const btn = document.createElement('button');
    btn.id = 'playlist-toggle-btn';
    btn.className = 'control-btn';
    btn.textContent = '📋';
    btn.title = '显示/隐藏播放列表';
    
    // 将按钮添加到音量控制区域旁边
    volumeControl.parentNode.insertBefore(btn, volumeControl.nextSibling);
    
    return btn;
}

// 创建重复播放按钮
function createRepeatButton() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (!playPauseBtn) return null;
    
    const btn = document.createElement('button');
    btn.id = 'repeat-btn';
    btn.className = 'control-btn';
    btn.textContent = '🔁';
    btn.title = '切换播放模式';
    
    // 添加点击事件
    btn.addEventListener('click', togglePlayMode);
    
    // 将按钮添加到播放/暂停按钮旁边（播放列表按钮前面）
    const playlistToggleBtn = document.getElementById('playlist-toggle-btn');
    if (playlistToggleBtn && playPauseBtn.parentNode) {
        playPauseBtn.parentNode.insertBefore(btn, playlistToggleBtn);
    }
    
    return btn;
}

// 切换播放模式
function togglePlayMode() {
    const repeatBtn = document.getElementById('repeat-btn');
    if (!repeatBtn) return;
    
    // 播放模式循环切换：顺序播放 -> 列表循环 -> 单曲循环 -> 随机播放 -> 顺序播放
    const modes = ['sequence', 'loop', 'single', 'shuffle'];
    const currentIndex = modes.indexOf(window.playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    window.playMode = modes[nextIndex];
    
    // 更新按钮显示和标题
    updatePlayModeButton();
    
    // 如果切换到随机播放，初始化随机索引数组
    if (window.playMode === 'shuffle') {
        initShuffleIndices();
    }
    
    console.log('播放模式已切换为:', window.playMode);
}

// 更新播放模式按钮显示
function updatePlayModeButton() {
    const repeatBtn = document.getElementById('repeat-btn');
    if (!repeatBtn) return;
    
    const modeIcons = {
        'sequence': '▶',
        'loop': '🔁',
        'single': '🔂',
        'shuffle': '🔀'
    };
    
    const modeTitles = {
        'sequence': '顺序播放',
        'loop': '列表循环',
        'single': '单曲循环',
        'shuffle': '随机播放'
    };
    
    repeatBtn.textContent = modeIcons[window.playMode] || '▶';
    repeatBtn.title = modeTitles[window.playMode] || '顺序播放';
    
    // 更新按钮样式
    repeatBtn.classList.toggle('active', window.playMode !== 'sequence');
}

// 初始化随机播放索引数组
function initShuffleIndices() {
    let currentPlaylist = window.currentPlaylist || [];
    if (currentPlaylist.length === 0 && window.fallbackTracks) {
        currentPlaylist = window.fallbackTracks;
    }
    
    // 创建索引数组
    window.shuffleIndices = Array.from({length: currentPlaylist.length}, (_, i) => i);
    
    // 打乱索引数组（Fisher-Yates 洗牌算法）
    for (let i = window.shuffleIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [window.shuffleIndices[i], window.shuffleIndices[j]] = [window.shuffleIndices[j], window.shuffleIndices[i]];
    }
    
    // 如果有当前播放的歌曲，确保它在第一个位置
    if (window.currentTrackIndex !== undefined && window.currentTrackIndex >= 0) {
        const currentIndex = window.shuffleIndices.indexOf(window.currentTrackIndex);
        if (currentIndex > 0) {
            [window.shuffleIndices[0], window.shuffleIndices[currentIndex]] = [window.shuffleIndices[currentIndex], window.shuffleIndices[0]];
        }
    }
}

// 初始化播放列表面板
function initPlaylistPanel() {
    // 检查是否已经存在播放列表面板
    if (document.getElementById('playlist-panel')) return;
    
    // 创建播放列表面板容器
    const playlistPanel = document.createElement('div');
    playlistPanel.id = 'playlist-panel';
    playlistPanel.className = 'playlist-panel';
    playlistPanel.style.display = 'none';
    
    // 创建播放列表头部
    const playlistHeader = document.createElement('div');
    playlistHeader.className = 'playlist-header';
    
    const playlistTitle = document.createElement('h3');
    playlistTitle.className = 'playlist-title';
    playlistTitle.textContent = '当前播放列表';
    
    const playlistCloseBtn = document.createElement('button');
    playlistCloseBtn.className = 'playlist-close-btn';
    playlistCloseBtn.textContent = '✕';
    playlistCloseBtn.addEventListener('click', togglePlaylistPanel);
    
    playlistHeader.appendChild(playlistTitle);
    playlistHeader.appendChild(playlistCloseBtn);
    
    // 创建播放列表内容区域
    const playlistContent = document.createElement('div');
    playlistContent.className = 'playlist-content';
    
    // 创建播放列表
    const playlistList = document.createElement('ul');
    playlistList.id = 'playlist-items';
    playlistList.className = 'playlist-items';
    
    playlistContent.appendChild(playlistList);
    
    // 组装播放列表面板
    playlistPanel.appendChild(playlistHeader);
    playlistPanel.appendChild(playlistContent);
    
    // 添加到body
    document.body.appendChild(playlistPanel);
    
    // 添加点击外部关闭播放列表的事件
    document.addEventListener('click', (e) => {
        const isClickInsidePanel = playlistPanel.contains(e.target);
        const isClickOnToggle = e.target.id === 'playlist-toggle-btn';
        
        if (!isClickInsidePanel && !isClickOnToggle && playlistPanel.style.display !== 'none') {
            togglePlaylistPanel();
        }
    });
}

// 切换播放列表面板显示/隐藏
function togglePlaylistPanel() {
    const playlistPanel = document.getElementById('playlist-panel');
    if (!playlistPanel) return;
    
    // 如果播放列表为空，尝试加载播放列表
    const playlistItems = document.getElementById('playlist-items');
    if (playlistItems.children.length === 0) {
        updatePlaylistItems();
    }
    
    // 切换显示状态
    if (playlistPanel.style.display === 'none' || playlistPanel.style.display === '') {
        playlistPanel.style.display = 'block';
        // 平滑显示动画
        setTimeout(() => {
            playlistPanel.classList.add('active');
        }, 10);
    } else {
        playlistPanel.classList.remove('active');
        // 平滑隐藏动画
        setTimeout(() => {
            playlistPanel.style.display = 'none';
        }, 300);
    }
}

// 更新播放列表项
function updatePlaylistItems() {
    const playlistItems = document.getElementById('playlist-items');
    if (!playlistItems) return;
    
    // 清空现有列表
    playlistItems.innerHTML = '';
    
    // 获取当前播放列表（优先使用全局播放列表，如果没有则使用fallback数据）
    let currentPlaylist = window.currentPlaylist || [];
    
    // 如果没有播放列表，尝试从script.js中获取fallback数据
    if (currentPlaylist.length === 0 && window.fallbackTracks) {
        currentPlaylist = window.fallbackTracks;
    }
    
    // 如果仍然没有数据，显示空状态
    if (currentPlaylist.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'playlist-empty';
        emptyItem.textContent = '播放列表为空';
        playlistItems.appendChild(emptyItem);
        return;
    }
    
    // 获取当前播放的歌曲ID
    const currentTrackId = window.currentTrack ? window.currentTrack.id : null;
    
    // 创建播放列表项
    currentPlaylist.forEach((track, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'playlist-item';
        if (track.id === currentTrackId) {
            listItem.classList.add('playing');
        }
        
        // 播放按钮
        const playBtn = document.createElement('button');
        playBtn.className = 'playlist-item-play';
        playBtn.textContent = track.id === currentTrackId ? '▶' : '';
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playTrackAtIndex(index);
        });
        
        // 歌曲序号
        const trackNumber = document.createElement('span');
        trackNumber.className = 'playlist-item-number';
        trackNumber.textContent = index + 1;
        
        // 歌曲信息
        const trackInfo = document.createElement('div');
        trackInfo.className = 'playlist-item-info';
        
        const trackTitle = document.createElement('div');
        trackTitle.className = 'playlist-item-title';
        trackTitle.textContent = track.title || '未知歌曲';
        
        const trackArtist = document.createElement('div');
        trackArtist.className = 'playlist-item-artist';
        trackArtist.textContent = track.artist || '未知艺术家';
        
        trackInfo.appendChild(trackTitle);
        trackInfo.appendChild(trackArtist);
        
        // 歌曲时长
        const trackDuration = document.createElement('span');
        trackDuration.className = 'playlist-item-duration';
        trackDuration.textContent = track.duration || '0:00';
        
        // 组装列表项
        listItem.appendChild(playBtn);
        listItem.appendChild(trackNumber);
        listItem.appendChild(trackInfo);
        listItem.appendChild(trackDuration);
        
        // 添加点击事件
        listItem.addEventListener('click', () => {
            playTrackAtIndex(index);
        });
        
        playlistItems.appendChild(listItem);
    });
}

// 播放指定索引的歌曲
function playTrackAtIndex(index) {
    // 获取当前播放列表
    let currentPlaylist = window.currentPlaylist || [];
    if (currentPlaylist.length === 0 && window.fallbackTracks) {
        currentPlaylist = window.fallbackTracks;
    }
    
    if (index >= 0 && index < currentPlaylist.length) {
        const track = currentPlaylist[index];
        
        // 如果存在全局播放歌曲的函数，使用它
        if (window.playTrack) {
            window.playTrack(track, index);
        } else {
            // 否则直接播放
            const audioElement = document.getElementById('audio-player');
            if (audioElement && track.audioPath) {
                audioElement.src = track.audioPath;
                audioElement.play();
                window.currentTrack = track;
                window.currentTrackIndex = index;
                
                // 保存歌曲信息到localStorage
                saveAudioState(audioElement, track);
                
                updateMiniPlayerUI(track);
                updatePlaylistItems();
            }
        }
    }
}

// 播放下一首歌曲
window.playNextTrack = function() {
    let currentPlaylist = window.currentPlaylist || [];
    if (currentPlaylist.length === 0 && window.fallbackTracks) {
        currentPlaylist = window.fallbackTracks;
    }
    
    if (currentPlaylist.length === 0) return;
    
    let nextIndex = 0;
    const currentIndex = window.currentTrackIndex !== undefined ? window.currentTrackIndex : -1;
    
    switch (window.playMode) {
        case 'single':
            // 单曲循环，保持当前索引
            nextIndex = currentIndex >= 0 ? currentIndex : 0;
            break;
        case 'shuffle':
            // 随机播放，获取下一个随机索引
            if (window.shuffleIndices.length === 0) {
                initShuffleIndices();
            }
            
            if (currentIndex >= 0) {
                const currentShuffleIndex = window.shuffleIndices.indexOf(currentIndex);
                nextIndex = window.shuffleIndices[(currentShuffleIndex + 1) % window.shuffleIndices.length];
            } else {
                nextIndex = window.shuffleIndices[0];
            }
            break;
        case 'loop':
        case 'sequence':
        default:
            // 列表循环或顺序播放
            nextIndex = (currentIndex + 1) % currentPlaylist.length;
            
            // 如果是顺序播放且已经是最后一首，停止播放
            if (window.playMode === 'sequence' && currentIndex === currentPlaylist.length - 1) {
                const audioElement = document.getElementById('audio-player');
                if (audioElement) {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                }
                return;
            }
            break;
    }
    
    playTrackAtIndex(nextIndex);
};

// 播放上一首歌曲
window.playPreviousTrack = function() {
    let currentPlaylist = window.currentPlaylist || [];
    if (currentPlaylist.length === 0 && window.fallbackTracks) {
        currentPlaylist = window.fallbackTracks;
    }
    
    if (currentPlaylist.length === 0) return;
    
    let prevIndex = 0;
    const currentIndex = window.currentTrackIndex !== undefined ? window.currentTrackIndex : 0;
    const audioElement = document.getElementById('audio-player');
    
    // 如果当前歌曲播放超过3秒，则重新播放当前歌曲
    if (audioElement && audioElement.currentTime > 3) {
        audioElement.currentTime = 0;
        return;
    }
    
    switch (window.playMode) {
        case 'single':
            // 单曲循环，保持当前索引
            prevIndex = currentIndex;
            break;
        case 'shuffle':
            // 随机播放，获取上一个随机索引
            if (window.shuffleIndices.length === 0) {
                initShuffleIndices();
            }
            
            const currentShuffleIndex = window.shuffleIndices.indexOf(currentIndex);
            prevIndex = window.shuffleIndices[(currentShuffleIndex - 1 + window.shuffleIndices.length) % window.shuffleIndices.length];
            break;
        case 'loop':
        case 'sequence':
        default:
            // 列表循环或顺序播放
            prevIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
            break;
    }
    
    playTrackAtIndex(prevIndex);
};

// 切换播放/暂停
window.togglePlayPause = function() {
    const audioElement = document.getElementById('audio-player');
    if (!audioElement) return;
    
    if (audioElement.paused) {
        audioElement.play().catch(err => {
            console.error('播放失败:', err);
        });
    } else {
        audioElement.pause();
    }
};

// 处理歌曲播放结束事件
function handleTrackEnd() {
    // 根据播放模式决定下一步操作
    const audioElement = document.getElementById('audio-player');
    if (!audioElement) return;
    
    switch (window.playMode) {
        case 'single':
            // 单曲循环，重新播放当前歌曲
            audioElement.currentTime = 0;
            audioElement.play();
            break;
        case 'loop':
        case 'sequence':
        case 'shuffle':
        default:
            // 其他模式，播放下一首
            playNextTrack();
            break;
    }
}

// 监听播放状态变化，更新播放列表UI
function updatePlaylistUIOnPlay() {
    const audioElement = document.getElementById('audio-player');
    if (!audioElement) return;
    
    audioElement.addEventListener('play', () => {
        updatePlaylistItems();
    });
}

// 暴露函数到全局
window.initMiniPlayer = initMiniPlayer;
window.togglePlaylistPanel = togglePlaylistPanel;
window.updatePlaylistItems = updatePlaylistItems;
window.togglePlayMode = togglePlayMode;
window.updatePlayModeButton = updatePlayModeButton;

// 页面加载完成后自动初始化迷你播放器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 延迟初始化，确保script.js已经加载完成
        setTimeout(() => {
            window.initMiniPlayer();
            updatePlaylistUIOnPlay();
            
            // 监听全局播放列表变化
            if (window.addEventListener) {
                // 监听自定义事件
                window.addEventListener('playlistUpdated', updatePlaylistItems);
            }
        }, 100);
    });
} else {
    // 延迟初始化，确保script.js已经加载完成
    setTimeout(() => {
        window.initMiniPlayer();
        updatePlaylistUIOnPlay();
        
        // 监听全局播放列表变化
        if (window.addEventListener) {
            // 监听自定义事件
            window.addEventListener('playlistUpdated', updatePlaylistItems);
        }
    }, 100);
}