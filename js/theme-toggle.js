// theme-toggle.js - 统一的主题切换功能模块
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // 使用图标或文本作为主题切换按钮
    let themeIcon = themeToggle.querySelector('i');
    const isUsingFontAwesome = themeIcon !== null;
    
    // 强制使用浅色主题（清除之前的主题设置）
    localStorage.removeItem('theme');
    
    // 设置为浅色主题
    document.body.classList.remove('dark-theme');
    if (!isUsingFontAwesome) {
        themeToggle.textContent = '🌙';
    }
    
    // 切换主题
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            if (isUsingFontAwesome) {
                themeIcon.className = 'fas fa-sun';
            } else {
                themeToggle.textContent = '☀️';
            }
        } else {
            localStorage.setItem('theme', 'light');
            if (isUsingFontAwesome) {
                themeIcon.className = 'fas fa-moon';
            } else {
                themeToggle.textContent = '🌙';
            }
        }
    });
}

// 函数定义完成，直接在DOM加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
} else {
    setupThemeToggle();
}