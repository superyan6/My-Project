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
            <div class="pp-controls">
              <button class="pp-prev" title="Previous">◀◀</button>
              <button class="pp-toggle" title="Play/Pause">▶</button>
              <button class="pp-next" title="Next">▶▶</button>
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

    // attach events
    this.toggleBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
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

  PlaylistPlayer.prototype.highlight = function(){
    const nodes = this.listEl.querySelectorAll('.pp-item');
    nodes.forEach(n=> n.classList.toggle('active', Number(n.getAttribute('data-index'))===this.index));
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
    const idx = (this.index-1+this.playlist.length)%this.playlist.length;
    this.load(idx); this.play();
  };
  PlaylistPlayer.prototype.next = function(){
    const idx = (this.index+1)%this.playlist.length;
    this.load(idx); this.play();
  };

  PlaylistPlayer.prototype.onPlay = function(){ this.toggleBtn.textContent = '⏸'; };
  PlaylistPlayer.prototype.onPause = function(){ this.toggleBtn.textContent = '▶'; };
  PlaylistPlayer.prototype.onTimeUpdate = function(){
    if (!this.audio.duration) return;
    const pct = (this.audio.currentTime / this.audio.duration) * 100;
    this.progress.value = pct;
    this.curTime.textContent = formatTime(this.audio.currentTime);
  };
  PlaylistPlayer.prototype.onEnded = function(){ this.next(); };

  PlaylistPlayer.prototype.setPlaylist = function(list){ this.playlist = list; this.renderList(); this.load(0); };

  // expose
  window.PlaylistPlayer = PlaylistPlayer;

})(window);
