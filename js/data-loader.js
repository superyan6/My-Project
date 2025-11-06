// 数据加载器 - 负责曲目数据的加载、处理和缓存

class DataLoader {
  constructor() {
    this.tracks = [];
    this.isLoading = false;
    this.loadPromise = null;
    this.cacheKey = 'mmv_tracks_cache';
    this.cacheExpiry = 3600000; // 缓存过期时间（1小时）
  }

  // 加载曲目数据
  async loadTracks() {
    // 如果正在加载，返回同一个promise
    if (this.isLoading) {
      return this.loadPromise;
    }

    try {
      // 尝试从缓存加载
      const cachedData = this.getCachedData();
      if (cachedData) {
        console.log('从缓存加载曲目数据');
        this.tracks = cachedData;
        return cachedData;
      }

      // 标记为正在加载
      this.isLoading = true;
      
      // 创建加载promise
      this.loadPromise = new Promise(async (resolve, reject) => {
        try {
          // 从JSON文件加载数据
          const response = await fetch('data/tracks.json');
          
          if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
          }
          
          const data = await response.json();
          
          // 验证数据格式
          if (!Array.isArray(data)) {
            throw new Error('曲目数据格式错误：不是数组');
          }
          
          // 处理和验证每首歌的数据
          this.tracks = this.processTracks(data);
          
          // 缓存数据
          this.cacheData(this.tracks);
          
          resolve(this.tracks);
        } catch (error) {
          console.error('加载曲目数据失败:', error);
          reject(error);
        } finally {
          this.isLoading = false;
          this.loadPromise = null;
        }
      });

      return this.loadPromise;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  }

  // 处理和验证曲目数据
  processTracks(tracks) {
    return tracks.map((track, index) => {
      // 确保所有必需字段都存在
      const processedTrack = {
        id: track.id || `track_${index}`,
        title: track.title || '未知标题',
        artist: track.artist || '未知艺术家',
        album: track.album || '未知专辑',
        duration: track.duration || '0:00',
        coverImagePath: track.coverImagePath || 'images/default-cover.png',
        audioPath: track.audioPath || '',
        tags: Array.isArray(track.tags) ? track.tags : [],
        // 添加一些额外的计算字段
        durationInSeconds: this.convertTimeToSeconds(track.duration)
      };
      
      return processedTrack;
    });
  }

  // 将时间格式(mm:ss)转换为秒数
  convertTimeToSeconds(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;
    
    const parts = timeString.split(':').map(Number);
    if (parts.length !== 2) return 0;
    
    return parts[0] * 60 + parts[1];
  }

  // 获取所有曲目
  getTracks() {
    return this.tracks;
  }

  // 根据ID获取曲目
  getTrackById(id) {
    return this.tracks.find(track => track.id === id);
  }

  // 获取所有标签
  getAllTags() {
    const tagSet = new Set();
    this.tracks.forEach(track => {
      track.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }

  // 根据标签筛选曲目
  getTracksByTag(tag) {
    return this.tracks.filter(track => track.tags.includes(tag));
  }

  // 搜索曲目
  searchTracks(query) {
    if (!query || query.trim() === '') {
      return this.tracks;
    }
    
    const lowercaseQuery = query.toLowerCase();
    
    return this.tracks.filter(track => 
      track.title.toLowerCase().includes(lowercaseQuery) ||
      track.artist.toLowerCase().includes(lowercaseQuery) ||
      track.album.toLowerCase().includes(lowercaseQuery) ||
      track.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  // 获取热门曲目（可以基于一些简单的规则）
  getTopTracks(limit = 10) {
    // 这里简单返回前N首，可以根据实际需求修改逻辑
    return this.tracks.slice(0, limit);
  }

  // 按标签分组曲目
  getTracksGroupedByTag() {
    const grouped = {};
    
    this.tracks.forEach(track => {
      track.tags.forEach(tag => {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(track);
      });
    });
    
    return grouped;
  }

  // 缓存数据到localStorage
  cacheData(data) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('缓存数据失败:', error);
    }
  }

  // 从缓存获取数据
  getCachedData() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // 检查是否过期
      if (now - cacheData.timestamp > this.cacheExpiry) {
        this.clearCache();
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.warn('读取缓存数据失败:', error);
      this.clearCache();
      return null;
    }
  }

  // 清除缓存
  clearCache() {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.warn('清除缓存失败:', error);
    }
  }

  // 导出数据为JSON
  exportData() {
    return JSON.stringify(this.tracks, null, 2);
  }

  // 生成模拟数据（用于开发测试）
  generateMockData() {
    const mockTracks = [
      {
        id: 'mock_01',
        title: '测试曲目 1',
        artist: '测试艺术家 1',
        album: '测试专辑 1',
        duration: '3:45',
        coverImagePath: 'images/cover1.png',
        audioPath: 'audio/lemon-tree.mp3',
        tags: ['测试', '流行']
      },
      {
        id: 'mock_02',
        title: '测试曲目 2',
        artist: '测试艺术家 2',
        album: '测试专辑 2',
        duration: '4:12',
        coverImagePath: 'images/cover2.png',
        audioPath: 'audio/lemon-tree.mp3',
        tags: ['测试', '摇滚']
      }
    ];
    
    return this.processTracks(mockTracks);
  }
}

// 创建单例实例
const dataLoader = new DataLoader();

// 导出dataLoader实例和DataLoader类
window.dataLoader = dataLoader;
window.DataLoader = DataLoader;

// 为了兼容性，也挂载到window对象
if (typeof window !== 'undefined') {
  window.dataLoader = dataLoader;
  window.DataLoader = DataLoader;
}