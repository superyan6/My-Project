// 1. 基础状态变量初始化
let isPlaying = false; // 播放状态
let progressInterval; // 进度条定时器
let currentProgress = 0; // 当前播放进度（百分比）
const totalDuration = 200; // 模拟歌曲总时长（秒，3分20秒）
let favoriteSongs = []; // 收藏歌曲数组
let currentVolume = 80; // 默认音量（0-100）
let currentSongGenre = "mellow"; // 当前播放歌曲分类

// 2. DOM元素获取
const favoriteBtn = document.getElementById("favorite-btn");
const favoriteCount = document.getElementById("favorite-count");
const favoriteList = document.getElementById("favorite-songs-list");
const volumeBar = document.getElementById("volume-bar");
const volumeIcon = document.getElementById("volume-icon");

// 3. 页面加载初始化（读取本地存储的收藏数据）
document.addEventListener("DOMContentLoaded", () => {
    loadFavoritesFromLocalStorage();
    updateFavoriteUI();
    volumeBar.value = currentVolume;
    updateVolumeIcon();
});

// 4. 播放/暂停控制
function playPause() {
    isPlaying = !isPlaying;
    const playBtn = document.querySelector(".player-controls button");
    
    if (isPlaying) {
        playBtn.textContent = "⏸️ Pause";
        progressInterval = setInterval(updateProgress, 1000); // 每秒更新进度
    } else {
        playBtn.textContent = "▶️ Play";
        clearInterval(progressInterval); // 暂停定时器
    }
}

// 5. 播放进度条更新
function updateProgress() {
    if (currentProgress < 100) {
        currentProgress += (100 / totalDuration); // 按比例更新进度
        document.getElementById("progress-bar").value = currentProgress;
        
        // 转换秒为「分:秒」格式（补0对齐）
        const currentSec = Math.floor((currentProgress / 100) * totalDuration);
        const minutes = Math.floor(currentSec / 60);
        const seconds = currentSec % 60;
        document.getElementById("current-time").textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        // 进度满时自动暂停
        clearInterval(progressInterval);
        isPlaying = false;
        document.querySelector(".player-controls button").textContent = "▶️ Play";
    }
}

// 手动拖动进度条调整进度
function setProgress() {
    currentProgress = document.getElementById("progress-bar").value;
    const currentSec = Math.floor((currentProgress / 100) * totalDuration);
    const minutes = Math.floor(currentSec / 60);
    const seconds = currentSec % 60;
    document.getElementById("current-time").textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// 6. 音量控制
function adjustVolume() {
    currentVolume = volumeBar.value;
    updateVolumeIcon(); // 根据音量切换图标
    console.log(`Current Volume: ${currentVolume}%`); // 模拟音量效果（实际项目可结合audio标签）
}

// 根据音量值更新音量图标（静音/减小/增大）
function updateVolumeIcon() {
    if (currentVolume === 0) {
        volumeIcon.className = "fa-solid fa-volume-mute";
    } else if (currentVolume < 50) {
        volumeIcon.className = "fa-solid fa-volume-down";
    } else {
        volumeIcon.className = "fa-solid fa-volume-up";
    }
}

// 7. 播放指定歌曲（更新播放信息+重置进度）
function playSong(title, artist, desc, genre) {
    currentSongGenre = genre; // 记录当前歌曲分类
    // 更新播放歌曲信息
    document.getElementById("current-song-title").textContent = `${title} - ${artist}`;
    document.getElementById("current-song-desc").textContent = desc;
    
    // 随机切换歌曲封面图
    const randomId = Math.floor(Math.random() * 10) + 1;
    document.getElementById("current-song-img").src = `https://picsum.photos/id/${randomId}/100/100`;
    
    // 重置进度条
    currentProgress = 0;
    document.getElementById("progress-bar").value = 0;
    document.getElementById("current-time").textContent = "0:00";
    
    // 更新收藏按钮状态（判断当前歌曲是否已收藏）
    const isFavorite = favoriteSongs.some(song => song.title === title && song.artist === artist);
    if (isFavorite) {
        favoriteBtn.classList.add("active");
        favoriteBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Added to Favorites';
    } else {
        favoriteBtn.classList.remove("active");
        favoriteBtn.innerHTML = '<i class="fa-regular fa-heart"></i> Add to Favorites';
    }
    
    // 自动播放
    isPlaying = true;
    document.querySelector(".player-controls button").textContent = "⏸️ Pause";
    clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 1000);
}

// 8. 收藏/取消收藏歌曲
function toggleFavorite(title = null, artist = null, desc = null) {
    // 若未传参数，默认取当前播放歌曲信息
    if (!title || !artist) {
        const currentTitle = document.getElementById("current-song-title").textContent;
        [title, artist] = currentTitle.split(" - ");
        desc = document.getElementById("current-song-desc").textContent;
    }

    // 检查歌曲是否已在收藏列表中
    const songIndex = favoriteSongs.findIndex(song => song.title === title && song.artist === artist);
    
    if (songIndex > -1) {
        // 取消收藏：从数组中删除
        favoriteSongs.splice(songIndex, 1);
        // 更新当前播放歌曲的收藏按钮
        if (document.getElementById("current-song-title").textContent.includes(title)) {
            favoriteBtn.classList.remove("active");
            favoriteBtn.innerHTML = '<i class="fa-regular fa-heart"></i> Add to Favorites';
        }
        // 更新推荐列表中对应歌曲的收藏按钮
        const favBtns = document.querySelectorAll(".song-fav-btn");
        favBtns.forEach(btn => {
            if (btn.previousElementSibling?.textContent.includes(title)) {
                btn.classList.remove("active");
                btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }
        });
    } else {
        // 添加收藏：存入数组
        favoriteSongs.push({ title, artist, desc });
        // 更新当前播放歌曲的收藏按钮
        if (document.getElementById("current-song-title").textContent.includes(title)) {
            favoriteBtn.classList.add("active");
            favoriteBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Added to Favorites';
        }
        // 更新推荐列表中对应歌曲的收藏按钮
        const favBtns = document.querySelectorAll(".song-fav-btn");
        favBtns.forEach(btn => {
            if (btn.previousElementSibling?.textContent.includes(title)) {
                btn.classList.add("active");
                btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            }
        });
    }

    // 保存到本地存储（刷新不丢失）+ 更新收藏UI
    saveFavoritesToLocalStorage();
    updateFavoriteUI();
}

// 保存收藏歌曲到本地存储
function saveFavoritesToLocalStorage() {
    localStorage.setItem("favoriteSongs", JSON.stringify(favoriteSongs));
}

// 从本地存储加载收藏歌曲
function loadFavoritesFromLocalStorage() {
    const savedSongs = localStorage.getItem("favoriteSongs");
    if (savedSongs) {
        favoriteSongs = JSON.parse(savedSongs);
    }
}

// 更新收藏列表UI（数量+列表内容）
function updateFavoriteUI() {
    // 更新收藏数量
    favoriteCount.textContent = `(${favoriteSongs.length})`;
    
    // 更新收藏列表内容
    if (favoriteSongs.length === 0) {
        favoriteList.innerHTML = '<p id="empty-favorite">No favorite songs yet. Add some you love!</p>';
    } else {
        let html = "";
        favoriteSongs.forEach(song => {
            html += `
                <div class="song-item">
                    <div class="song-details" onclick="playSong('${song.title}', '${song.artist}', '${song.desc}', '${currentSongGenre}')">
                        <p>${song.title} - ${song.artist}</p>
                        <p>${song.desc}</p>
                    </div>
                    <button class="song-fav-btn active" onclick="toggleFavorite('${song.title}', '${song.artist}', '${song.desc}')">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
            `;
        });
        favoriteList.innerHTML = html;
    }
}

// 9. 歌曲分类筛选
function filterSongsByGenre() {
    const selectedGenre = document.getElementById("genre-filter").value;
    const allSongs = document.querySelectorAll("#recommended-songs-list .song-item");
    
    // 遍历所有歌曲，显示选中分类或隐藏
    allSongs.forEach(song => {
        const songGenre = song.getAttribute("data-genre");
        if (selectedGenre === "all" || songGenre === selectedGenre) {
            song.style.display = "flex";
        } else {
            song.style.display = "none";
        }
    });
}

// 10. 展示歌单内歌曲（弹窗提示）
function showSongs(playlistName) {
    let playlistSongs = "";
    if (playlistName === "late-night") {
        playlistSongs = "1. Lemon Tree - Fool's Garden\n2. Let Her Go - Passenger\n3. Say Something - A Great Big World";
    } else if (playlistName === "indie-folk") {
        playlistSongs = "1. Holocene - Bon Iver\n2. Skinny Love - Bon Iver\n3. First Class - Rex Orange County";
    } else if (playlistName === "pop") {
        playlistSongs = "1. Blinding Lights - The Weeknd\n2. Uptown Funk - Mark Ronson ft. Bruno Mars\n3. Shape of You - Ed Sheeran";
    }
    alert(`Songs in ${playlistName.replace('-', ' ')}:\n${playlistSongs}`);
}