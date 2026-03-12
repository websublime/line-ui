import './style.css';

const SVG_SUN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

const SVG_MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function setup() {
  const htmlElement = document.documentElement;
  const bodyElement = document.body;
  const themeButton = document.querySelector<HTMLButtonElement>('.ui-theme-button');

  // --- Set initial theme button icon ---
  if (themeButton) {
    themeButton.innerHTML = htmlElement.classList.contains('dark') ? SVG_SUN : SVG_MOON;
  }

  // --- Palette switching ---
  for (const button of document.querySelectorAll<HTMLButtonElement>('.ui-nav-button')) {
    button.addEventListener('click', function () {
      for (const b of document.querySelectorAll('.ui-nav-button')) {
        b.classList.remove('ui-nav-button-active');
      }
      this.classList.add('ui-nav-button-active');
      const { theme } = this.dataset;
      if (theme) {
        // Preserve any non-schema classes on body (fix: don't clobber classList)
        const currentClasses = Array.from(bodyElement.classList).filter((c) => !c.startsWith('line-schema-'));
        bodyElement.className = [...currentClasses, theme].join(' ');
      }
    });
  }

  // --- Dark/light toggle with visual feedback ---
  themeButton?.addEventListener('click', () => {
    const isDark = htmlElement.classList.contains('dark');

    if (isDark) {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
    } else {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
    }

    if (themeButton) {
      themeButton.innerHTML = htmlElement.classList.contains('dark') ? SVG_SUN : SVG_MOON;
    }
  });

  // --- Click interaction: toggle active state ---
  for (const card of document.querySelectorAll<HTMLElement>('.showcase-click-card')) {
    card.addEventListener('click', function () {
      this.classList.toggle('is-active');
    });
  }

  // --- Ripple effect demo ---
  for (const area of document.querySelectorAll<HTMLElement>('.showcase-ripple-area')) {
    area.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const circle = document.createElement('span');
      circle.classList.add('ripple-circle');
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${e.clientX - rect.left - size / 2}px`;
      circle.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
  }

  // --- Smooth scroll for nav links ---
  for (const link of document.querySelectorAll<HTMLAnchorElement>('.ui-nav-links a[href^="#"]')) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href') ?? '';
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

setup();
