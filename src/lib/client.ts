export function initSite() {
  const themeButton = document.querySelector<HTMLButtonElement>('.theme-toggle');
  function syncTheme() { const dark = document.documentElement.dataset.theme === 'dark'; themeButton?.setAttribute('aria-label', dark ? '切换到浅色主题' : '切换到深色主题'); }
  syncTheme();
  themeButton?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('trial-theme', theme); } catch {}
    syncTheme();
  });
  document.querySelector('.mobile-menu')?.addEventListener('click', event => {
    const button = event.currentTarget as HTMLButtonElement;
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open)); document.querySelector('#main-nav')?.classList.toggle('open', open);
  });
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.06 });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('visible'));
  const progress = document.querySelector<HTMLElement>('.reading-progress');
  if (progress) {
    const update = () => { const max = document.documentElement.scrollHeight - innerHeight; progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`; };
    addEventListener('scroll', update, { passive: true }); update();
  }
  document.querySelectorAll<HTMLElement>('.prose pre').forEach(pre => {
    const button = document.createElement('button'); button.className = 'copy-code'; button.textContent = '复制'; button.setAttribute('aria-label', '复制代码'); pre.append(button);
    button.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || ''); button.textContent = '已复制'; } catch { button.textContent = '请手动复制'; }
      setTimeout(() => { button.textContent = '复制'; }, 2000);
    });
  });
}
