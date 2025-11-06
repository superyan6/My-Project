// 音量控制功能
window.addEventListener('load', function() {
  // 获取元素
  var audioPlayer = document.getElementById('audio-player');
  var volumeSlider = document.getElementById('volume-slider');
  var volumeBtn = document.getElementById('volume-btn');
  
  // 音量滑块控制
  if (audioPlayer && volumeSlider) {
    volumeSlider.oninput = function() {
      audioPlayer.volume = parseFloat(this.value);
    };
  }
  
  // 静音按钮控制
  if (audioPlayer && volumeBtn) {
    volumeBtn.onclick = function() {
      audioPlayer.muted = !audioPlayer.muted;
    };
  }
});