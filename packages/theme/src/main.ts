import './style.css';

/* ================================================================
   Showcase — vanilla JS interactivity for the L0-L3 theme demo
   ================================================================ */

const PALETTES = [
  'gray',
  'mauve',
  'slate',
  'sage',
  'olive',
  'sand',
  'tomato',
  'red',
  'crimson',
  'pink',
  'plum',
  'purple',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'grass',
  'brown',
  'bronze',
  'gold',
  'sky',
  'mint',
  'lime',
  'yellow',
  'amber',
  'orange'
] as const;

type Palette = (typeof PALETTES)[number];

const SEMANTIC_ROLES = [
  'App background',
  'Subtle background',
  'UI element background',
  'Hovered UI background',
  'Active UI background',
  'Subtle borders',
  'UI element border',
  'Hovered border',
  'Solid background',
  'Hovered solid',
  'Low-contrast text',
  'High-contrast text'
] as const;

const SEMANTIC_TOKENS = [
  '--line-background',
  '--line-subtle-background',
  '--line-ui-background',
  '--line-ui-hover-background',
  '--line-ui-active-background',
  '--line-subtle-border',
  '--line-ui-border',
  '--line-ui-border-hover',
  '--line-solid-background',
  '--line-solid-hover',
  '--line-low-contrast',
  '--line-high-contrast'
] as const;

const ALIASES = [
  { name: 'primary', palette: 'blue' },
  { name: 'danger', palette: 'red' },
  { name: 'success', palette: 'green' },
  { name: 'warning', palette: 'amber' },
  { name: 'info', palette: 'cyan' },
  { name: 'neutral', palette: 'gray' }
] as const;

const ALIAS_SUFFIXES = [
  '',
  '-hover',
  '-active',
  '-text',
  '-subtle',
  '-subtle-hover',
  '-outline',
  '-outline-hover',
  '-fg'
] as const;

let activePalette: Palette = 'blue';

/* ── Helpers ── */

function $(sel: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector(sel);
}

function $$(sel: string, root: ParentNode = document): HTMLElement[] {
  return Array.from(root.querySelectorAll(sel));
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (children) for (const c of children) e.append(c);
  return e;
}

function getTokenValue(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function setSchema(palette: Palette) {
  activePalette = palette;
  const body = document.body;
  const classes = Array.from(body.classList).filter((c) => !c.startsWith('line-schema-'));
  body.className = [...classes, `line-schema-${palette}`].join(' ');

  // Update mini grid active state
  for (const mini of $$('.sc-l0-mini')) {
    mini.classList.toggle('is-active', mini.dataset.palette === palette);
  }

  renderL0Strip();
  renderL0Contrast();
  renderL2Strip();
}

/* ================================================================
   Setup
   ================================================================ */

function setup() {
  buildL0();
  buildL1();
  buildL2();
  buildL3();
  setupModeToggle();
  setupHeaderDots();

  // Set initial schema
  setSchema('blue');
}

/* ── Mode toggle ── */

function setupModeToggle() {
  const btn = $('#mode-toggle')!;
  const label = $('#mode-label')!;
  const html = document.documentElement;

  btn.addEventListener('click', () => {
    const isDark = html.classList.contains('dark');
    html.classList.toggle('dark', !isDark);
    html.classList.toggle('light', isDark);
    label.textContent = isDark ? 'light' : 'dark';
    // Re-render things that depend on computed color values
    renderL0Strip();
    renderL0Contrast();
  });
}

/* ── Header breadcrumb dots ── */

function setupHeaderDots() {
  for (const dot of $$('.sc-header-dot')) {
    dot.addEventListener('click', () => {
      const layer = dot.dataset.layer;
      const target = $(`#${layer}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Intersection observer to highlight active dot
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          for (const d of $$('.sc-header-dot')) {
            d.classList.toggle('is-active', d.dataset.layer === id);
          }
        }
      }
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  for (const section of $$('.sc-section')) {
    observer.observe(section);
  }
}

/* ================================================================
   L0 — Primitives
   ================================================================ */

function buildL0() {
  renderL0Strip();
  buildL0AllPalettes();
  buildColorMix();
}

function renderL0Strip() {
  const container = $('#l0-strip')!;
  container.innerHTML = '';
  const detail = $('#l0-detail')!;

  for (let i = 1; i <= 12; i++) {
    const swatch = el('div', {
      class: 'sc-l0-swatch',
      'data-level': String(i),
      style: `background-color: var(--line-${activePalette}-${i})`
    });

    swatch.addEventListener('mouseenter', () => {
      detail.classList.add('is-visible');
      const tokenName = `--line-${activePalette}-${i}`;
      const resolved = getTokenValue(tokenName);
      $('#l0-detail-swatch')!.style.backgroundColor = `var(${tokenName})`;
      $('#l0-detail-token')!.textContent = tokenName;
      $('#l0-detail-value')!.textContent = resolved || '(computed)';
      $('#l0-detail-role')!.textContent = SEMANTIC_ROLES[i - 1];
    });

    swatch.addEventListener('mouseleave', () => {
      detail.classList.remove('is-visible');
    });

    container.appendChild(swatch);
  }
}

function renderL0Contrast() {
  const box = $('#l0-contrast')!;
  box.style.backgroundColor = `var(--line-${activePalette}-9)`;
  box.style.color = `var(--line-${activePalette}-contrast)`;
  $('#l0-contrast-text')!.textContent = `--line-${activePalette}-contrast on --line-${activePalette}-9`;
}

function buildL0AllPalettes() {
  const grid = $('#l0-all-palettes')!;
  for (const p of PALETTES) {
    const mini = el('div', {
      class: 'sc-l0-mini',
      'data-palette': p,
      title: p,
      style: `background-color: var(--line-${p}-9)`
    });
    mini.addEventListener('click', () => setSchema(p));
    grid.appendChild(mini);
  }
}

/* ── Color Mix ── */

function buildColorMix() {
  const selA = $('#cmix-a') as HTMLSelectElement;
  const selB = $('#cmix-b') as HTMLSelectElement;
  const range = $('#cmix-range') as HTMLInputElement;
  const pctLabel = $('#cmix-pct')!;
  const strip = $('#cmix-strip')!;

  for (const p of PALETTES) {
    selA.appendChild(el('option', { value: p }, [p]));
    selB.appendChild(el('option', { value: p }, [p]));
  }
  selA.value = 'blue';
  selB.value = 'red';

  function renderMix() {
    const a = selA.value;
    const b = selB.value;
    const pct = range.value;
    pctLabel.textContent = `${pct}%`;
    strip.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
      const cell = el('div', {
        class: 'sc-colormix-cell',
        style: `background-color: color-mix(in oklch, var(--line-${a}-${i}) ${pct}%, var(--line-${b}-${i}))`
      });
      strip.appendChild(cell);
    }
  }

  selA.addEventListener('change', renderMix);
  selB.addEventListener('change', renderMix);
  range.addEventListener('input', renderMix);
  renderMix();
}

/* ================================================================
   L1 — Foundation Tokens
   ================================================================ */

function buildL1() {
  buildTypeScale();
  buildSizes();
  buildRadius();
  buildShadows();
  buildEasing();
  buildZindex();
  buildDuration();
  buildOpacity();
}

function buildTypeScale() {
  const container = $('#l1-type')!;
  const levels = [
    { token: '--line-font-size-0', label: 'size-0' },
    { token: '--line-font-size-1', label: 'size-1' },
    { token: '--line-font-size-2', label: 'size-2' },
    { token: '--line-font-size-3', label: 'size-3' },
    { token: '--line-font-size-4', label: 'size-4' },
    { token: '--line-font-size-5', label: 'size-5' },
    { token: '--line-font-size-6', label: 'size-6' },
    { token: '--line-font-size-7', label: 'size-7' },
    { token: '--line-font-size-8', label: 'size-8' },
    { token: '--line-font-size-9', label: 'size-9' }
  ];

  for (const { token, label } of levels) {
    const row = el('div', { class: 'sc-type-row' });
    row.appendChild(el('span', { class: 'sc-type-label' }, [label]));
    const sample = el(
      'span',
      {
        class: 'sc-type-sample',
        style: `font-size: var(${token})`
      },
      ['Ag']
    );
    row.appendChild(sample);
    container.appendChild(row);
  }
}

function buildSizes() {
  const container = $('#l1-sizes')!;
  const sizes = [
    { token: '--line-size-1', label: 'size-1', px: 4 },
    { token: '--line-size-2', label: 'size-2', px: 8 },
    { token: '--line-size-3', label: 'size-3', px: 16 },
    { token: '--line-size-4', label: 'size-4', px: 20 },
    { token: '--line-size-5', label: 'size-5', px: 24 },
    { token: '--line-size-6', label: 'size-6', px: 28 },
    { token: '--line-size-7', label: 'size-7', px: 32 },
    { token: '--line-size-8', label: 'size-8', px: 48 },
    { token: '--line-size-9', label: 'size-9', px: 64 }
  ];

  const maxPx = 64;
  for (const { label, px } of sizes) {
    const row = el('div', { class: 'sc-size-row' });
    row.appendChild(el('span', { class: 'sc-size-label' }, [label]));
    row.appendChild(
      el('div', {
        class: 'sc-size-bar',
        style: `width: ${(px / maxPx) * 100}%`
      })
    );
    container.appendChild(row);
  }
}

function buildRadius() {
  const container = $('#l1-radius')!;
  const radii = [
    { token: '--line-radius-1', label: 'r-1' },
    { token: '--line-radius-2', label: 'r-2' },
    { token: '--line-radius-3', label: 'r-3' },
    { token: '--line-radius-4', label: 'r-4' },
    { token: '--line-radius-5', label: 'r-5' },
    { token: '--line-radius-6', label: 'round' }
  ];

  for (const { token, label } of radii) {
    const sample = el(
      'div',
      {
        class: 'sc-radius-sample',
        style: `border-radius: var(${token})`
      },
      [label]
    );
    container.appendChild(sample);
  }
}

function buildShadows() {
  const container = $('#l1-shadows')!;
  for (let i = 1; i <= 6; i++) {
    const card = el(
      'div',
      {
        class: 'sc-shadow-card',
        style: `box-shadow: var(--line-shadow-${i})`
      },
      [`shadow-${i}`]
    );
    container.appendChild(card);
  }
}

function buildEasing() {
  const container = $('#l1-easing')!;
  const curves = [
    { label: 'ease-3', token: '--line-ease-3' },
    { label: 'in-3', token: '--line-ease-in-3' },
    { label: 'out-3', token: '--line-ease-out-3' },
    { label: 'in-out-3', token: '--line-ease-in-out-3' },
    { label: 'spring-3', token: '--line-ease-spring-3' }
  ];

  for (const { label, token } of curves) {
    const row = el('div', { class: 'sc-easing-row' });
    row.appendChild(el('span', { class: 'sc-easing-label' }, [label]));

    const track = el('div', { class: 'sc-easing-track' });
    const ball = el('div', {
      class: 'sc-easing-ball',
      style: `animation-timing-function: var(${token})`
    });
    track.appendChild(ball);
    row.appendChild(track);

    const btn = el('button', { class: 'sc-easing-btn' }, ['play']);
    btn.addEventListener('click', () => {
      const isPlaying = track.classList.toggle('is-playing');
      btn.textContent = isPlaying ? 'stop' : 'play';
    });
    row.appendChild(btn);

    // Also toggle on track click
    track.addEventListener('click', () => {
      const isPlaying = track.classList.toggle('is-playing');
      btn.textContent = isPlaying ? 'stop' : 'play';
    });

    container.appendChild(row);
  }
}

function buildZindex() {
  const container = $('#l1-zindex')!;
  const levels = [
    { label: 'dropdown', token: '--line-z-dropdown', value: 50 },
    { label: 'sticky', token: '--line-z-sticky', value: 100 },
    { label: 'fixed', token: '--line-z-fixed', value: 200 },
    { label: 'overlay', token: '--line-z-overlay', value: 300 },
    { label: 'modal', token: '--line-z-modal', value: 400 },
    { label: 'popover', token: '--line-z-popover', value: 500 },
    { label: 'toast', token: '--line-z-toast', value: 600 },
    { label: 'tooltip', token: '--line-z-tooltip', value: 700 }
  ];

  const maxVal = 700;
  for (const { label, value } of levels) {
    const row = el('div', { class: 'sc-zindex-row' });
    row.appendChild(el('span', { class: 'sc-zindex-label' }, [label]));
    row.appendChild(
      el('div', {
        class: 'sc-zindex-bar',
        style: `width: ${(value / maxVal) * 100}%`
      })
    );
    row.appendChild(el('span', { class: 'sc-zindex-val' }, [String(value)]));
    container.appendChild(row);
  }
}

function buildDuration() {
  const container = $('#l1-duration')!;
  const durations = [
    { label: 'instant', ms: 0 },
    { label: 'quick-1', ms: 80 },
    { label: 'quick-2', ms: 120 },
    { label: 'moderate-1', ms: 180 },
    { label: 'moderate-2', ms: 260 },
    { label: 'gentle-1', ms: 320 },
    { label: 'gentle-2', ms: 420 }
  ];

  const maxMs = 420;
  for (const { label, ms } of durations) {
    const row = el('div', { class: 'sc-duration-row' });
    row.appendChild(el('span', { class: 'sc-duration-label' }, [label]));
    row.appendChild(
      el('div', {
        class: 'sc-duration-bar',
        style: `width: ${Math.max((ms / maxMs) * 100, 1)}%`
      })
    );
    row.appendChild(el('span', { class: 'sc-duration-val' }, [`${ms}ms`]));
    container.appendChild(row);
  }
}

function buildOpacity() {
  const container = $('#l1-opacity')!;
  const ops = [
    { label: 'disabled', token: '--line-opacity-disabled', val: 0.5 },
    { label: 'placeholder', token: '--line-opacity-placeholder', val: 0.6 },
    { label: 'overlay', token: '--line-opacity-overlay', val: 0.75 }
  ];

  for (const { label, token, val } of ops) {
    const card = el(
      'div',
      {
        class: 'sc-opacity-card',
        style: `opacity: var(${token})`
      },
      [`${label}\n${val}`]
    );
    container.appendChild(card);
  }
}

/* ================================================================
   L2 — Semantic Roles
   ================================================================ */

function buildL2() {
  buildL2Panels();
  renderL2Strip();
}

function buildL2Panels() {
  const container = $('#l2-panels')!;

  for (const mode of ['light', 'dark'] as const) {
    const panel = el('div', { class: 'sc-l2-panel' });
    panel.appendChild(el('h4', {}, [`${mode} mode (gray defaults)`]));

    const grid = el('div', { class: 'sc-l2-tokens' });
    for (let i = 0; i < SEMANTIC_TOKENS.length; i++) {
      // Levels 1-7 are light backgrounds (dark text), 8-12 are dark (white text)
      const textColor = i < 7 ? '#000' : '#fff';
      const cell = el(
        'div',
        {
          class: 'sc-l2-cell',
          style: `background-color: var(${SEMANTIC_TOKENS[i]}); color: ${textColor}`,
          title: `${SEMANTIC_TOKENS[i]} — ${SEMANTIC_ROLES[i]}`
        },
        [String(i + 1)]
      );
      grid.appendChild(cell);
    }
    panel.appendChild(grid);
    container.appendChild(panel);
  }
}

function renderL2Strip() {
  const container = $('#l2-strip')!;
  container.innerHTML = '';
  for (let i = 0; i < SEMANTIC_TOKENS.length; i++) {
    const cell = el('div', {
      class: 'sc-l2-strip-cell',
      style: `background-color: var(${SEMANTIC_TOKENS[i]})`,
      title: `${SEMANTIC_TOKENS[i]}: ${SEMANTIC_ROLES[i]}`
    });
    container.appendChild(cell);
  }
}

/* ================================================================
   L3 — Aliases
   ================================================================ */

function buildL3() {
  buildAliasCards();
  buildAliasVariants();
}

function buildAliasCards() {
  const grid = $('#l3-grid')!;

  for (const alias of ALIASES) {
    const card = el('div', {
      class: 'sc-alias-card',
      'data-alias': alias.name
    });

    // Header (solid-9 color)
    const header = el(
      'div',
      {
        class: 'sc-alias-header',
        style: `background-color: var(--line-${alias.name}); color: var(--line-${alias.name}-text)`
      },
      [alias.name]
    );
    card.appendChild(header);

    // Subtle strip
    const subtle = el('div', {
      class: 'sc-alias-subtle',
      style: `background-color: var(--line-${alias.name}-subtle)`
    });
    card.appendChild(subtle);

    // Body
    const body = el('div', { class: 'sc-alias-body' });
    body.appendChild(el('div', { class: 'sc-alias-mapping' }, [`mapped to ${alias.palette}`]));

    // Palette dots (levels 1-12 of source palette)
    const dots = el('div', { class: 'sc-alias-dots' });
    for (let i = 1; i <= 12; i++) {
      dots.appendChild(
        el('div', {
          class: 'sc-alias-dot',
          style: `background-color: var(--line-${alias.palette}-${i})`
        })
      );
    }
    body.appendChild(dots);
    card.appendChild(body);

    // Anatomy (hidden by default)
    const anatomy = el('div', { class: 'sc-alias-anatomy' });
    for (const suffix of ALIAS_SUFFIXES) {
      const tokenName = `--line-${alias.name}${suffix}`;
      const displayName = suffix || '(base)';

      const row = el('div', { class: 'sc-alias-anatomy-row' });
      row.appendChild(
        el('div', {
          class: 'sc-alias-anatomy-swatch',
          style: `background-color: var(${tokenName})`
        })
      );
      row.appendChild(el('span', { class: 'sc-alias-anatomy-name' }, [`${tokenName}  ${displayName}`]));
      anatomy.appendChild(row);
    }
    card.appendChild(anatomy);

    // Click to expand
    card.addEventListener('click', () => {
      const wasExpanded = card.classList.contains('is-expanded');
      // Collapse all
      for (const c of $$('.sc-alias-card')) c.classList.remove('is-expanded');
      if (!wasExpanded) card.classList.add('is-expanded');
    });

    grid.appendChild(card);
  }
}

function buildAliasVariants() {
  const container = $('#l3-variants')!;

  for (const alias of ALIASES) {
    // Solid
    container.appendChild(
      el(
        'button',
        {
          class: 'sc-l3-variant-btn',
          'data-variant': 'solid',
          style: `background-color: var(--line-${alias.name}); color: var(--line-${alias.name}-text); border: none`
        },
        [`${alias.name} solid`]
      )
    );

    // Outline
    container.appendChild(
      el(
        'button',
        {
          class: 'sc-l3-variant-btn',
          'data-variant': 'outline',
          style: `background: transparent; border: 1px solid var(--line-${alias.name}-outline); color: var(--line-${alias.name}-fg)`
        },
        [`${alias.name} outline`]
      )
    );

    // Subtle
    container.appendChild(
      el(
        'button',
        {
          class: 'sc-l3-variant-btn',
          'data-variant': 'subtle',
          style: `background-color: var(--line-${alias.name}-subtle); color: var(--line-${alias.name}-fg); border: none`
        },
        [`${alias.name} subtle`]
      )
    );
  }
}

/* ── Boot ── */
setup();
