(function(window){
  /* PlaylistPlayer - simple reusable MP3 playlist player
     Usage:
       const player = new PlaylistPlayer('#my-player', { playlist: [ {title, artist, src, cover}, ... ] });
       player.render();
  */

  function formatTime(sec){
    if (!sec && sec !== 0) return '--:--';
    sec = Math.floor(sec);
    const m = Math.floor(sec/60).toString().padStart(1,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function createEl(html){
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
  }

  function PlaylistPlayer(selector, opts){
    this.container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
    if (!this.container) throw new Error('PlaylistPlayer: container not found');
    this.playlist = (opts && opts.playlist) || [];
    this.index = 0;
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.options = opts || {};
    this.playMode = 'normal'; // 播放模式: 'normal'(顺序), 'repeat'(循环), 'repeat-one'(单曲循环), 'shuffle'(随机)
    this.originalIndices = []; // 存储原始索引，用于随机播放模式
    this.lyricsData = []; // 存储解析后的歌词数据

    this.onPlay = this.onPlay.bind(this);
    this.onPause = this.onPause.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onEnded = this.onEnded.bind(this);
  }

  PlaylistPlayer.prototype.render = function(){
    const html = `
      <div class="playlist-player">
        <div class="pp-left">
          <img class="pp-cover" src="" alt="cover">
        </div>
        <div class="pp-right">
          <div class="pp-now">
            <div class="pp-meta">
              <div class="pp-title">-</div>
              <div class="pp-artist">-</div>
            </div>
            <!-- 歌词显示区域 -->
            <div class="pp-lyrics">
              <div class="pp-lyrics-content">
                <p class="pp-lyrics-placeholder">暂无歌词</p>
              </div>
            </div>
            <div class="pp-controls">
              <button class="pp-prev" title="Previous">◀◀</button>
              <button class="pp-backward" title="Backward 15s">⏪</button>
              <button class="pp-toggle" title="Play/Pause">▶</button>
              <button class="pp-forward" title="Forward 15s">⏩</button>
              <button class="pp-next" title="Next">▶▶</button>
              <button class="pp-mode" title="Play Mode">🔄</button>
              <div class="pp-time"><span class="pp-cur">0:00</span> / <span class="pp-total">0:00</span></div>
              <input class="pp-progress" type="range" min="0" max="100" value="0">
              <input class="pp-volume" type="range" min="0" max="1" step="0.01" value="0.8" title="Volume">
            </div>
          </div>
          <div class="pp-list"></div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.el = this.container.querySelector('.playlist-player');
    this.coverEl = this.el.querySelector('.pp-cover');
    this.titleEl = this.el.querySelector('.pp-title');
    this.artistEl = this.el.querySelector('.pp-artist');
    this.toggleBtn = this.el.querySelector('.pp-toggle');
    this.prevBtn = this.el.querySelector('.pp-prev');
    this.nextBtn = this.el.querySelector('.pp-next');
    this.progress = this.el.querySelector('.pp-progress');
    this.curTime = this.el.querySelector('.pp-cur');
    this.totalTime = this.el.querySelector('.pp-total');
    this.listEl = this.el.querySelector('.pp-list');
    this.volumeEl = this.el.querySelector('.pp-volume');
    this.modeBtn = this.el.querySelector('.pp-mode');
    this.backwardBtn = this.el.querySelector('.pp-backward');
    this.forwardBtn = this.el.querySelector('.pp-forward');
    this.lyricsContainer = this.el.querySelector('.pp-lyrics');
    this.lyricsContent = this.el.querySelector('.pp-lyrics-content');
    
    // 初始化随机播放索引数组
    this.initOriginalIndices();

    // attach events
    this.toggleBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
    this.modeBtn.addEventListener('click', () => this.switchPlayMode());
    this.backwardBtn.addEventListener('click', () => this.seekBackward());
    this.forwardBtn.addEventListener('click', () => this.seekForward());
    this.progress.addEventListener('input', (e)=>{
      const pct = e.target.value/100;
      if (this.audio.duration) this.audio.currentTime = this.audio.duration * pct;
    });
    this.volumeEl.addEventListener('input', (e)=>{ this.audio.volume = e.target.value; });

    this.audio.addEventListener('play', this.onPlay);
    this.audio.addEventListener('pause', this.onPause);
    this.audio.addEventListener('timeupdate', this.onTimeUpdate);
    this.audio.addEventListener('ended', this.onEnded);

    this.renderList();
    if (this.playlist.length) this.load(0);
  };

  PlaylistPlayer.prototype.initOriginalIndices = function(){
    this.originalIndices = [];
    for(let i = 0; i < this.playlist.length; i++){
      this.originalIndices.push(i);
    }
  };

  PlaylistPlayer.prototype.renderList = function(){
    this.listEl.innerHTML = '';
    this.playlist.forEach((item, i)=>{
      const itemEl = createEl(`<div class="pp-item" data-index="${i}">
        <div class="pp-item-left"><img src="${item.cover||''}" alt="cover"></div>
        <div class="pp-item-right"><div class="pp-item-title">${item.title}</div><div class="pp-item-artist">${item.artist||''}</div></div>
      </div>`);
      itemEl.addEventListener('click', ()=>{ this.load(i); this.play(); });
      this.listEl.appendChild(itemEl);
    });
    this.highlight();
  };

  // 切换播放模式
  PlaylistPlayer.prototype.switchPlayMode = function(){
    const modes = ['normal', 'repeat', 'repeat-one', 'shuffle'];
    const currentIndex = modes.indexOf(this.playMode);
    this.playMode = modes[(currentIndex + 1) % modes.length];
    this.updateModeIcon();
    
    // 如果切换到随机播放，重新初始化索引数组
    if(this.playMode === 'shuffle'){
      this.initOriginalIndices();
    }
  };

  // 更新播放模式图标
  PlaylistPlayer.prototype.updateModeIcon = function(){
    let icon = '▶';
    let title = '顺序播放';
    
    switch(this.playMode){
      case 'repeat':
        icon = '🔄';
        title = '列表循环';
        break;
      case 'repeat-one':
        icon = '🔂';
        title = '单曲循环';
        break;
      case 'shuffle':
        icon = '🔀';
        title = '随机播放';
        break;
    }
    
    this.modeBtn.textContent = icon;
    this.modeBtn.title = title;
  };

  // 随机播放实现
  PlaylistPlayer.prototype.getRandomIndex = function(){
    if(this.originalIndices.length === 0){
      this.initOriginalIndices();
      // 移除当前播放的索引
      const currentIndex = this.originalIndices.indexOf(this.index);
      if(currentIndex !== -1){
        this.originalIndices.splice(currentIndex, 1);
      }
    }
    
    const randomIndex = Math.floor(Math.random() * this.originalIndices.length);
    const selectedIndex = this.originalIndices[randomIndex];
    
    // 从候选列表中移除已选择的索引
    this.originalIndices.splice(randomIndex, 1);
    
    return selectedIndex;
  };

  PlaylistPlayer.prototype.highlight = function(){
    const nodes = this.listEl.querySelectorAll('.pp-item');
    nodes.forEach(n=> n.classList.toggle('active', Number(n.getAttribute('data-index'))===this.index));
  };

  // 解析歌词
  PlaylistPlayer.prototype.parseLyrics = function(lyricsStr) {
    if (!lyricsStr) return [];
    
    const lines = lyricsStr.split('\n');
    const lyrics = [];
    
    // 简单的歌词格式解析 [mm:ss.xx]歌词内容
    const regex = /\[(\d+):(\d+\.?\d*)\](.+)/;
    
    lines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const time = minutes * 60 + seconds;
        const text = match[3].trim();
        
        if (text) {
          lyrics.push({ time, text });
        }
      }
    });
    
    // 按时间排序
    return lyrics.sort((a, b) => a.time - b.time);
  };
  
  // 显示歌词
  PlaylistPlayer.prototype.displayLyrics = function(lyrics) {
    this.lyricsData = this.parseLyrics(lyrics);
    this.lyricsContent.innerHTML = '';
    
    if (this.lyricsData.length === 0) {
      this.lyricsContent.innerHTML = '<p class="pp-lyrics-placeholder">暂无歌词</p>';
      return;
    }
    
    this.lyricsData.forEach(item => {
      const p = document.createElement('p');
      p.textContent = item.text;
      p.dataset.time = item.time;
      this.lyricsContent.appendChild(p);
    });
  };
  
  // 更新当前歌词高亮
  PlaylistPlayer.prototype.updateLyrics = function(currentTime) {
    if (this.lyricsData.length === 0) return;
    
    let currentIndex = -1;
    for (let i = 0; i < this.lyricsData.length; i++) {
      if (currentTime >= this.lyricsData[i].time) {
        currentIndex = i;
      } else {
        break;
      }
    }
    
    if (currentIndex !== -1) {
      // 移除所有高亮
      this.lyricsContent.querySelectorAll('p').forEach(p => {
        p.classList.remove('active');
      });
      
      // 添加高亮
      const currentLine = this.lyricsContent.children[currentIndex];
      if (currentLine) {
        currentLine.classList.add('active');
        
        // 滚动到当前行
        const containerHeight = this.lyricsContent.clientHeight;
        const lineTop = currentLine.offsetTop;
        const lineHeight = currentLine.clientHeight;
        
        this.lyricsContent.scrollTop = lineTop - containerHeight / 2 + lineHeight / 2;
      }
    }
  };

  PlaylistPlayer.prototype.load = function(i){
    if (i<0 || i>=this.playlist.length) return;
    this.index = i;
    const item = this.playlist[i];
    this.audio.src = item.src;
    this.coverEl.src = item.cover || '';
    this.titleEl.textContent = item.title || '-';
    this.artistEl.textContent = item.artist || '';
    this.highlight();
    
    // 显示歌词
    this.displayLyrics(item.lyrics);
    
    // 添加专辑封面旋转动画
    this.coverEl.style.animation = 'none';
    void this.coverEl.offsetWidth; // 触发重排
    if(!this.audio.paused) {
      this.coverEl.style.animation = 'rotate 20s linear infinite';
    }
    
    // update meta when metadata loaded
    this.audio.addEventListener('loadedmetadata', ()=>{
      this.totalTime.textContent = formatTime(this.audio.duration);
    }, {once:true});
  };

  PlaylistPlayer.prototype.play = function(){
    this.audio.play();
  };
  PlaylistPlayer.prototype.pause = function(){ this.audio.pause(); };
  PlaylistPlayer.prototype.togglePlay = function(){
    if (this.audio.paused) this.play(); else this.pause();
  };
  PlaylistPlayer.prototype.prev = function(){
    let idx;
    if(this.playMode === 'shuffle'){
      // 随机模式下，重新获取一个随机索引
      idx = this.getRandomIndex();
    } else {
      idx = (this.index-1+this.playlist.length)%this.playlist.length;
    }
    this.load(idx); this.play();
  };
  
  PlaylistPlayer.prototype.next = function(){
    let idx;
    if(this.playMode === 'shuffle'){
      // 随机模式下，获取下一个随机索引
      idx = this.getRandomIndex();
    } else {
      idx = (this.index+1)%this.playlist.length;
    }
    this.load(idx); this.play();
  };

  // 记录播放历史
  PlaylistPlayer.prototype.addToHistory = function(song){
    try {
      let history = JSON.parse(localStorage.getItem('playHistory') || '[]');
      
      // 移除重复项（如果存在）
      history = history.filter(item => !(item.title === song.title && item.artist === song.artist));
      
      // 添加到历史记录开头
      history.unshift({
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        timestamp: new Date().toISOString()
      });
      
      // 限制历史记录数量
      if(history.length > 50){
        history = history.slice(0, 50);
      }
      
      localStorage.setItem('playHistory', JSON.stringify(history));
    } catch(e) {
      console.warn('Failed to save play history:', e);
    }
  };

  PlaylistPlayer.prototype.onPlay = function(){ 
    this.toggleBtn.textContent = '⏸';
    // 播放时恢复专辑封面旋转
    if(this.coverEl) {
      this.coverEl.style.animationPlayState = 'running';
    }
    // 当歌曲开始播放时，添加到历史记录
    const currentSong = this.playlist[this.index];
    if(currentSong) {
      this.addToHistory(currentSong);
    }
  };
  PlaylistPlayer.prototype.onPause = function(){ 
    this.toggleBtn.textContent = '▶'; 
    // 暂停时停止专辑封面旋转
    if(this.coverEl) {
      this.coverEl.style.animationPlayState = 'paused';
    }
  };
  
  // 重写播放结束事件处理
  PlaylistPlayer.prototype.onEnded = function(){
    switch(this.playMode){
      case 'repeat-one':
        // 单曲循环
        this.audio.currentTime = 0;
        this.play();
        break;
      case 'shuffle':
        // 随机播放
        const randomIdx = this.getRandomIndex();
        this.load(randomIdx);
        this.play();
        break;
      case 'repeat':
        // 列表循环
        const nextIdx = (this.index + 1) % this.playlist.length;
        this.load(nextIdx);
        this.play();
        break;
      default:
        // 顺序播放
        if(this.index < this.playlist.length - 1){
          this.next();
        } else {
          // 播放结束，重置状态
          this.toggleBtn.textContent = '▶';
        }
    }
  };
  
  // 快退15秒
  PlaylistPlayer.prototype.seekBackward = function(seconds = 15){
    this.audio.currentTime = Math.max(0, this.audio.currentTime - seconds);
  };

  // 快进15秒
  PlaylistPlayer.prototype.seekForward = function(seconds = 15){
    this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + seconds);
  };

  PlaylistPlayer.prototype.onTimeUpdate = function(){
    if (!this.audio.duration) return;
    const pct = (this.audio.currentTime / this.audio.duration) * 100;
    this.progress.value = pct;
    this.curTime.textContent = formatTime(this.audio.currentTime);
    
    // 更新歌词高亮
    this.updateLyrics(this.audio.currentTime);
  };
  PlaylistPlayer.prototype.onEnded = function(){ this.next(); };

  PlaylistPlayer.prototype.setPlaylist = function(list){ this.playlist = list; this.renderList(); this.load(0); };

  // expose
  window.PlaylistPlayer = PlaylistPlayer;

})(window);
