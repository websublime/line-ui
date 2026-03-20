import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '../components/sc-section.js';
import { copyToken } from '../utils/clipboard.js';

/* ─────────────────────────────────────────────────────────
   Token data — sourced from packages/theme/src/tokens/
   ───────────────────────────────────────────────────────── */

interface EasingToken {
  readonly token: string;
  readonly value: string;
  readonly type: 'cubic-bezier' | 'steps' | 'linear' | 'alias';
}

interface DurationToken {
  readonly token: string;
  readonly value: string;
  readonly ms: number;
}

interface AnimationToken {
  readonly token: string;
  readonly value: string;
  readonly keyframeName: string;
  readonly continuous: boolean;
}

/* ── Easing tokens (81 total) ── */

const EASINGS_STANDARD: readonly EasingToken[] = [
  { token: '--line-ease-1', value: 'cubic-bezier(0.25, 0, 0.5, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-2', value: 'cubic-bezier(0.25, 0, 0.4, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-3', value: 'cubic-bezier(0.25, 0, 0.3, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-4', value: 'cubic-bezier(0.25, 0, 0.2, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-5', value: 'cubic-bezier(0.25, 0, 0.1, 1)', type: 'cubic-bezier' }
] as const;

const EASINGS_IN: readonly EasingToken[] = [
  { token: '--line-ease-in-1', value: 'cubic-bezier(0.25, 0, 1, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-2', value: 'cubic-bezier(0.5, 0, 1, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-3', value: 'cubic-bezier(0.7, 0, 1, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-4', value: 'cubic-bezier(0.9, 0, 1, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-5', value: 'cubic-bezier(1, 0, 1, 1)', type: 'cubic-bezier' }
] as const;

const EASINGS_OUT: readonly EasingToken[] = [
  { token: '--line-ease-out-1', value: 'cubic-bezier(0, 0, 0.75, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-out-2', value: 'cubic-bezier(0, 0, 0.5, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-out-3', value: 'cubic-bezier(0, 0, 0.3, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-out-4', value: 'cubic-bezier(0, 0, 0.1, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-out-5', value: 'cubic-bezier(0, 0, 0, 1)', type: 'cubic-bezier' }
] as const;

const EASINGS_IN_OUT: readonly EasingToken[] = [
  { token: '--line-ease-in-out-1', value: 'cubic-bezier(0.1, 0, 0.9, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-out-2', value: 'cubic-bezier(0.3, 0, 0.7, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-out-3', value: 'cubic-bezier(0.5, 0, 0.5, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-out-4', value: 'cubic-bezier(0.7, 0, 0.3, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-in-out-5', value: 'cubic-bezier(0.9, 0, 0.1, 1)', type: 'cubic-bezier' }
] as const;

const EASINGS_ELASTIC_OUT: readonly EasingToken[] = [
  { token: '--line-ease-elastic-out-1', value: 'cubic-bezier(0.5, 0.75, 0.75, 1.25)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-out-2', value: 'cubic-bezier(0.5, 1, 0.75, 1.25)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-out-3', value: 'cubic-bezier(0.5, 1.25, 0.75, 1.25)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-out-4', value: 'cubic-bezier(0.5, 1.5, 0.75, 1.25)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-out-5', value: 'cubic-bezier(0.5, 1.75, 0.75, 1.25)', type: 'cubic-bezier' }
] as const;

const EASINGS_ELASTIC_IN: readonly EasingToken[] = [
  { token: '--line-ease-elastic-in-1', value: 'cubic-bezier(0.5, -0.25, 0.75, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-2', value: 'cubic-bezier(0.5, -0.5, 0.75, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-3', value: 'cubic-bezier(0.5, -0.75, 0.75, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-4', value: 'cubic-bezier(0.5, -1, 0.75, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-5', value: 'cubic-bezier(0.5, -1.25, 0.75, 1)', type: 'cubic-bezier' }
] as const;

const EASINGS_ELASTIC_IN_OUT: readonly EasingToken[] = [
  { token: '--line-ease-elastic-in-out-1', value: 'cubic-bezier(0.5, -0.1, 0.1, 1.5)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-out-2', value: 'cubic-bezier(0.5, -0.3, 0.1, 1.5)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-out-3', value: 'cubic-bezier(0.5, -0.5, 0.1, 1.5)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-out-4', value: 'cubic-bezier(0.5, -0.7, 0.1, 1.5)', type: 'cubic-bezier' },
  { token: '--line-ease-elastic-in-out-5', value: 'cubic-bezier(0.5, -0.9, 0.1, 1.5)', type: 'cubic-bezier' }
] as const;

const EASINGS_STEP: readonly EasingToken[] = [
  { token: '--line-ease-step-1', value: 'steps(2)', type: 'steps' },
  { token: '--line-ease-step-2', value: 'steps(3)', type: 'steps' },
  { token: '--line-ease-step-3', value: 'steps(4)', type: 'steps' },
  { token: '--line-ease-step-4', value: 'steps(7)', type: 'steps' },
  { token: '--line-ease-step-5', value: 'steps(10)', type: 'steps' }
] as const;

const EASINGS_ELASTIC_ALIAS: readonly EasingToken[] = [
  { token: '--line-ease-elastic-1', value: 'var(--line-ease-elastic-out-1)', type: 'alias' },
  { token: '--line-ease-elastic-2', value: 'var(--line-ease-elastic-out-2)', type: 'alias' },
  { token: '--line-ease-elastic-3', value: 'var(--line-ease-elastic-out-3)', type: 'alias' },
  { token: '--line-ease-elastic-4', value: 'var(--line-ease-elastic-out-4)', type: 'alias' },
  { token: '--line-ease-elastic-5', value: 'var(--line-ease-elastic-out-5)', type: 'alias' }
] as const;

const EASINGS_SQUISH_ALIAS: readonly EasingToken[] = [
  { token: '--line-ease-squish-1', value: 'var(--line-ease-elastic-in-out-1)', type: 'alias' },
  { token: '--line-ease-squish-2', value: 'var(--line-ease-elastic-in-out-2)', type: 'alias' },
  { token: '--line-ease-squish-3', value: 'var(--line-ease-elastic-in-out-3)', type: 'alias' },
  { token: '--line-ease-squish-4', value: 'var(--line-ease-elastic-in-out-4)', type: 'alias' },
  { token: '--line-ease-squish-5', value: 'var(--line-ease-elastic-in-out-5)', type: 'alias' }
] as const;

const EASINGS_SPRING: readonly EasingToken[] = [
  { token: '--line-ease-spring-1', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-spring-2', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-spring-3', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-spring-4', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-spring-5', value: 'linear(...)', type: 'linear' }
] as const;

const EASINGS_BOUNCE: readonly EasingToken[] = [
  { token: '--line-ease-bounce-1', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-bounce-2', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-bounce-3', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-bounce-4', value: 'linear(...)', type: 'linear' },
  { token: '--line-ease-bounce-5', value: 'linear(...)', type: 'linear' }
] as const;

const EASINGS_NAMED: readonly EasingToken[] = [
  { token: '--line-ease-circ-in', value: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)', type: 'cubic-bezier' },
  { token: '--line-ease-circ-in-out', value: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)', type: 'cubic-bezier' },
  { token: '--line-ease-circ-out', value: 'cubic-bezier(0.075, 0.82, 0.165, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-cubic-in', value: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)', type: 'cubic-bezier' },
  { token: '--line-ease-cubic-in-out', value: 'cubic-bezier(0.645, 0.045, 0.355, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-cubic-out', value: 'cubic-bezier(0.215, 0.61, 0.355, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-expo-in', value: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)', type: 'cubic-bezier' },
  { token: '--line-ease-expo-in-out', value: 'cubic-bezier(1, 0, 0, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-expo-out', value: 'cubic-bezier(0.19, 1, 0.22, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-quad-in', value: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)', type: 'cubic-bezier' },
  { token: '--line-ease-quad-in-out', value: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)', type: 'cubic-bezier' },
  { token: '--line-ease-quad-out', value: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', type: 'cubic-bezier' },
  { token: '--line-ease-quart-in', value: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)', type: 'cubic-bezier' },
  { token: '--line-ease-quart-in-out', value: 'cubic-bezier(0.77, 0, 0.175, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-quart-out', value: 'cubic-bezier(0.165, 0.84, 0.44, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-quint-in', value: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)', type: 'cubic-bezier' },
  { token: '--line-ease-quint-in-out', value: 'cubic-bezier(0.86, 0, 0.07, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-quint-out', value: 'cubic-bezier(0.23, 1, 0.32, 1)', type: 'cubic-bezier' },
  { token: '--line-ease-sine-in', value: 'cubic-bezier(0.47, 0, 0.745, 0.715)', type: 'cubic-bezier' },
  { token: '--line-ease-sine-in-out', value: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)', type: 'cubic-bezier' },
  { token: '--line-ease-sine-out', value: 'cubic-bezier(0.39, 0.575, 0.565, 1)', type: 'cubic-bezier' }
] as const;

/** All easing groups with labels. */
const EASING_GROUPS = [
  { label: 'Standard', tokens: EASINGS_STANDARD },
  { label: 'Ease In', tokens: EASINGS_IN },
  { label: 'Ease Out', tokens: EASINGS_OUT },
  { label: 'Ease In-Out', tokens: EASINGS_IN_OUT },
  { label: 'Elastic Out', tokens: EASINGS_ELASTIC_OUT },
  { label: 'Elastic In', tokens: EASINGS_ELASTIC_IN },
  { label: 'Elastic In-Out', tokens: EASINGS_ELASTIC_IN_OUT },
  { label: 'Step', tokens: EASINGS_STEP },
  { label: 'Elastic (alias)', tokens: EASINGS_ELASTIC_ALIAS },
  { label: 'Squish (alias)', tokens: EASINGS_SQUISH_ALIAS },
  { label: 'Spring', tokens: EASINGS_SPRING },
  { label: 'Bounce', tokens: EASINGS_BOUNCE },
  { label: 'Named Curves', tokens: EASINGS_NAMED }
] as const;

/* ── Duration tokens (12 total) ── */

const DURATIONS_PRACTICAL: readonly DurationToken[] = [
  { token: '--line-duration-instant', value: '0ms', ms: 0 },
  { token: '--line-duration-quick-1', value: '80ms', ms: 80 },
  { token: '--line-duration-quick-2', value: '120ms', ms: 120 },
  { token: '--line-duration-moderate-1', value: '180ms', ms: 180 },
  { token: '--line-duration-moderate-2', value: '260ms', ms: 260 },
  { token: '--line-duration-gentle-1', value: '320ms', ms: 320 },
  { token: '--line-duration-gentle-2', value: '420ms', ms: 420 }
] as const;

const DURATIONS_SEMANTIC: readonly DurationToken[] = [
  { token: '--line-duration-xfast', value: '50ms', ms: 50 },
  { token: '--line-duration-fast', value: '150ms', ms: 150 },
  { token: '--line-duration-normal', value: '300ms', ms: 300 },
  { token: '--line-duration-slow', value: '500ms', ms: 500 },
  { token: '--line-duration-glacial', value: '1000ms', ms: 1000 }
] as const;

/* ── Animation tokens (23 total) ── */

const ANIMATIONS: readonly AnimationToken[] = [
  {
    token: '--line-animation-fade-in',
    value: 'fade-in 0.5s var(--line-ease-3)',
    keyframeName: 'fade-in',
    continuous: false
  },
  {
    token: '--line-animation-fade-in-bloom',
    value: 'fade-in-bloom 2s var(--line-ease-3)',
    keyframeName: 'fade-in-bloom',
    continuous: false
  },
  {
    token: '--line-animation-fade-out',
    value: 'fade-out 0.5s var(--line-ease-3)',
    keyframeName: 'fade-out',
    continuous: false
  },
  {
    token: '--line-animation-fade-out-bloom',
    value: 'fade-out-bloom 2s var(--line-ease-3)',
    keyframeName: 'fade-out-bloom',
    continuous: false
  },
  {
    token: '--line-animation-scale-up',
    value: 'scale-up 0.5s var(--line-ease-3)',
    keyframeName: 'scale-up',
    continuous: false
  },
  {
    token: '--line-animation-scale-down',
    value: 'scale-down 0.5s var(--line-ease-3)',
    keyframeName: 'scale-down',
    continuous: false
  },
  {
    token: '--line-animation-slide-out-up',
    value: 'slide-out-up 0.5s var(--line-ease-3)',
    keyframeName: 'slide-out-up',
    continuous: false
  },
  {
    token: '--line-animation-slide-out-down',
    value: 'slide-out-down 0.5s var(--line-ease-3)',
    keyframeName: 'slide-out-down',
    continuous: false
  },
  {
    token: '--line-animation-slide-out-right',
    value: 'slide-out-right 0.5s var(--line-ease-3)',
    keyframeName: 'slide-out-right',
    continuous: false
  },
  {
    token: '--line-animation-slide-out-left',
    value: 'slide-out-left 0.5s var(--line-ease-3)',
    keyframeName: 'slide-out-left',
    continuous: false
  },
  {
    token: '--line-animation-slide-in-up',
    value: 'slide-in-up 0.5s var(--line-ease-3)',
    keyframeName: 'slide-in-up',
    continuous: false
  },
  {
    token: '--line-animation-slide-in-down',
    value: 'slide-in-down 0.5s var(--line-ease-3)',
    keyframeName: 'slide-in-down',
    continuous: false
  },
  {
    token: '--line-animation-slide-in-right',
    value: 'slide-in-right 0.5s var(--line-ease-3)',
    keyframeName: 'slide-in-right',
    continuous: false
  },
  {
    token: '--line-animation-slide-in-left',
    value: 'slide-in-left 0.5s var(--line-ease-3)',
    keyframeName: 'slide-in-left',
    continuous: false
  },
  {
    token: '--line-animation-shake-x',
    value: 'shake-x 0.75s var(--line-ease-out-5)',
    keyframeName: 'shake-x',
    continuous: false
  },
  {
    token: '--line-animation-shake-y',
    value: 'shake-y 0.75s var(--line-ease-out-5)',
    keyframeName: 'shake-y',
    continuous: false
  },
  {
    token: '--line-animation-shake-z',
    value: 'shake-z 1s var(--line-ease-in-out-3)',
    keyframeName: 'shake-z',
    continuous: false
  },
  { token: '--line-animation-spin', value: 'spin 2s linear infinite', keyframeName: 'spin', continuous: true },
  {
    token: '--line-animation-ping',
    value: 'ping 5s var(--line-ease-out-3) infinite',
    keyframeName: 'ping',
    continuous: true
  },
  {
    token: '--line-animation-blink',
    value: 'blink 1s var(--line-ease-out-3) infinite',
    keyframeName: 'blink',
    continuous: true
  },
  {
    token: '--line-animation-float',
    value: 'float 3s var(--line-ease-in-out-3) infinite',
    keyframeName: 'float',
    continuous: true
  },
  {
    token: '--line-animation-bounce',
    value: 'bounce 2s var(--line-ease-squish-2) infinite',
    keyframeName: 'bounce',
    continuous: true
  },
  {
    token: '--line-animation-pulse',
    value: 'pulse 2s var(--line-ease-out-3) infinite',
    keyframeName: 'pulse',
    continuous: true
  }
] as const;

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

@customElement('sc-page-motion')
export class ScPageMotion extends LitElement {
  /** Set of easing card IDs currently animating. */
  @state() private _animatingEasings = new Set<string>();

  /** Set of animation demo keys currently playing. */
  @state() private _playingAnimations = new Set<string>();

  /** Set of animation demo keys set to infinite loop. */
  @state() private _infiniteAnimations = new Set<string>();

  static override styles = css`
    :host {
      display: block;
    }

    /* ── Page header ── */

    .page-title {
      font-size: var(--line-font-size-6, 2rem);
      font-weight: var(--line-font-weight-8, 800);
      color: var(--line-high-contrast, #fff);
      letter-spacing: -0.03em;
      margin: 0 0 var(--line-size-2, 0.5rem);
    }

    .page-subtitle {
      font-size: var(--line-font-size-2, 1rem);
      color: var(--line-low-contrast, #999);
      margin: 0 0 var(--line-size-8, 2.5rem);
      line-height: var(--line-lineheight-3, 1.6);
    }

    .page-subtitle strong {
      color: var(--line-high-contrast, #fff);
      font-weight: var(--line-font-weight-6, 600);
    }

    /* ── Shared token box ── */

    .token-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--line-size-2, 0.5rem);
      cursor: pointer;
      position: relative;
    }

    .token-name {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      text-align: center;
      word-break: break-all;
    }

    .token-value {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-solid-background, #c8ff00);
      text-align: center;
    }

    /* Copy flash */
    .token-box.copied .token-name {
      color: var(--line-solid-background, #c8ff00);
    }

    .token-box.copied::after {
      content: '\\2713';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -70%);
      font-size: var(--line-font-size-4, 1.5rem);
      font-weight: var(--line-font-weight-8, 800);
      color: var(--line-solid-background, #c8ff00);
      background: var(--line-background, #111);
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--line-radius-round, 1e5px);
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--line-border-size-2, 2px) solid var(--line-solid-background, #c8ff00);
      animation: pop-check 700ms var(--line-ease-2) forwards;
      pointer-events: none;
    }

    @keyframes pop-check {
      0% { opacity: 0; transform: translate(-50%, -70%) scale(0.5); }
      15% { opacity: 1; transform: translate(-50%, -70%) scale(1.1); }
      30% { transform: translate(-50%, -70%) scale(1); }
      75% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* ── Easing section ── */

    .easing-subsection {
      margin-bottom: var(--line-size-7, 2rem);
    }

    .easing-subsection-title {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-high-contrast, #fff);
      margin: 0 0 var(--line-size-1, 0.25rem);
    }

    .easing-subsection-count {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      margin: 0 0 var(--line-size-4, 1.25rem);
    }

    .easing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--line-size-4, 1.25rem);
    }

    .easing-card {
      display: flex;
      flex-direction: column;
      gap: var(--line-size-2, 0.5rem);
      padding: var(--line-size-3, 1rem);
      border-radius: var(--line-radius-2, 5px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      background: var(--line-subtle-background, #161616);
      cursor: pointer;
      transition: border-color 150ms ease;
    }

    .easing-card:hover {
      border-color: var(--line-ui-border-hover, #555);
    }

    .easing-track {
      position: relative;
      height: 24px;
      background: var(--line-ui-background, #222);
      border-radius: var(--line-radius-round, 1e5px);
      overflow: hidden;
    }

    .easing-ball {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      border-radius: var(--line-radius-round, 1e5px);
      background: var(--line-solid-background, #c8ff00);
      transition: none;
    }

    .easing-ball.animating {
      left: calc(100% - 22px);
    }

    .easing-card .token-name {
      font-size: var(--line-font-size-00, 0.625rem);
    }

    .easing-card .token-value {
      /* 9px — one step below --line-font-size-00 (10px). No design token exists
         at this size; used here to fit long cubic-bezier values in narrow cards. */
      font-size: 0.5625rem;
      opacity: 0.7;
      line-height: 1.3;
    }

    .easing-type-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: var(--line-radius-1, 2px);
      /* 9px — matches .token-value; keeps badge text visually subordinate. */
      font-size: 0.5625rem;
      font-family: 'IBM Plex Mono', monospace;
      background: var(--line-ui-background, #222);
      color: var(--line-low-contrast, #999);
      align-self: flex-start;
    }

    /* ── Duration section ── */

    .duration-grid {
      display: flex;
      flex-direction: column;
      gap: var(--line-size-3, 1rem);
    }

    .duration-subsection {
      margin-bottom: var(--line-size-7, 2rem);
    }

    .duration-subsection-title {
      font-size: var(--line-font-size-2, 1rem);
      font-weight: var(--line-font-weight-6, 600);
      color: var(--line-high-contrast, #fff);
      margin: 0 0 var(--line-size-4, 1.25rem);
    }

    .duration-row {
      display: grid;
      grid-template-columns: 200px 1fr 60px;
      align-items: center;
      gap: var(--line-size-3, 1rem);
      cursor: pointer;
      padding: var(--line-size-2, 0.5rem);
      border-radius: var(--line-radius-2, 5px);
      transition: background 150ms ease;
    }

    .duration-row:hover {
      background: var(--line-subtle-background, #161616);
    }

    .duration-label {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-low-contrast, #999);
      word-break: break-all;
    }

    .duration-track {
      height: 8px;
      background: var(--line-ui-background, #222);
      border-radius: var(--line-radius-round, 1e5px);
      overflow: hidden;
      position: relative;
    }

    .duration-bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: var(--line-solid-background, #c8ff00);
      border-radius: var(--line-radius-round, 1e5px);
      transition: none;
    }

    .duration-bar.animating {
      width: 100%;
    }

    .duration-ms {
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      color: var(--line-solid-background, #c8ff00);
      text-align: right;
    }

    /* ── Animation section ── */

    .animation-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--line-size-5, 1.5rem);
    }

    .animation-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--line-size-3, 1rem);
      padding: var(--line-size-4, 1.25rem);
      border-radius: var(--line-radius-2, 5px);
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      background: var(--line-subtle-background, #161616);
      position: relative;
    }

    .animation-stage {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .animation-demo-box {
      width: 40px;
      height: 40px;
      border-radius: var(--line-radius-2, 5px);
      background: var(--line-solid-background, #c8ff00);
    }

    .animation-controls {
      display: flex;
      gap: var(--line-size-2, 0.5rem);
      align-items: center;
    }

    .animation-btn {
      padding: 4px 10px;
      border: var(--line-border-size-1, 1px) solid var(--line-ui-border, #444);
      border-radius: var(--line-radius-2, 5px);
      background: var(--line-ui-background, #222);
      color: var(--line-high-contrast, #fff);
      font-size: var(--line-font-size-00, 0.625rem);
      font-family: 'IBM Plex Mono', monospace;
      cursor: pointer;
      transition: border-color 150ms ease, background 150ms ease;
    }

    .animation-btn:hover {
      border-color: var(--line-ui-border-hover, #555);
      background: var(--line-ui-hover-background, #2a2a2a);
    }

    .animation-btn.active {
      border-color: var(--line-solid-background, #c8ff00);
      color: var(--line-solid-background, #c8ff00);
    }

    .animation-card .token-name {
      cursor: pointer;
    }

    /* ── Keyframes for animation demos ──
       Must be defined inside shadow DOM for them to work. */

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fade-in-bloom {
      0% { opacity: 0; filter: brightness(1) blur(20px); }
      10% { opacity: 1; filter: brightness(2) blur(10px); }
      100% { opacity: 1; filter: brightness(1) blur(0); }
    }

    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes fade-out-bloom {
      0% { opacity: 1; filter: brightness(1) blur(0); }
      10% { opacity: 1; filter: brightness(2) blur(10px); }
      100% { opacity: 0; filter: brightness(1) blur(20px); }
    }

    @keyframes scale-up {
      from { transform: scale(1); }
      to { transform: scale(1.25); }
    }

    @keyframes scale-down {
      from { transform: scale(1); }
      to { transform: scale(0.75); }
    }

    @keyframes slide-out-up {
      from { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }

    @keyframes slide-out-down {
      from { transform: translateY(0); }
      to { transform: translateY(100%); }
    }

    @keyframes slide-out-right {
      from { transform: translateX(0); }
      to { transform: translateX(100%); }
    }

    @keyframes slide-out-left {
      from { transform: translateX(0); }
      to { transform: translateX(-100%); }
    }

    @keyframes slide-in-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    @keyframes slide-in-down {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }

    @keyframes slide-in-right {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    @keyframes slide-in-left {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @keyframes shake-x {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-5%); }
      40% { transform: translateX(5%); }
      60% { transform: translateX(-5%); }
      80% { transform: translateX(5%); }
    }

    @keyframes shake-y {
      0%, 100% { transform: translateY(0); }
      20% { transform: translateY(-5%); }
      40% { transform: translateY(5%); }
      60% { transform: translateY(-5%); }
      80% { transform: translateY(5%); }
    }

    @keyframes shake-z {
      0%, 100% { transform: rotate(0deg); }
      20% { transform: rotate(-2deg); }
      40% { transform: rotate(2deg); }
      60% { transform: rotate(-2deg); }
      80% { transform: rotate(2deg); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(1turn); }
    }

    @keyframes ping {
      0% { transform: scale(1); opacity: 1; }
      90%, 100% { transform: scale(2); opacity: 0; }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-25%); }
    }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      25% { transform: translateY(-20%); }
      40% { transform: translateY(-3%); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(0.9, 0.9); }
    }

    /* ── Responsive ── */

    @media (max-width: 768px) {
      .easing-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .duration-row {
        grid-template-columns: 140px 1fr 50px;
      }
      .animation-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  /* ── Copy helper ── */

  private _copy(token: string, e: Event): void {
    const el = e.currentTarget as HTMLElement;
    copyToken(token, el);
  }

  /* ── Easing: play ball animation ── */

  private _playEasing(token: string, e: Event): void {
    /* Copy on click */
    const card = e.currentTarget as HTMLElement;
    copyToken(token, card);

    const ball = card.querySelector('.easing-ball') as HTMLElement | null;
    if (!ball) return;

    /* If already animating, reset */
    if (this._animatingEasings.has(token)) {
      ball.classList.remove('animating');
      /* Force reflow to reset transition */
      void ball.offsetHeight;
    }

    /* Apply the easing via the CSS custom property and animate */
    ball.style.transition = `left 800ms var(${token})`;
    requestAnimationFrame(() => {
      ball.classList.add('animating');
      const next = new Set(this._animatingEasings);
      next.add(token);
      this._animatingEasings = next;
    });

    /* Reset after animation completes */
    setTimeout(() => {
      ball.classList.remove('animating');
      ball.style.transition = 'none';
      const next = new Set(this._animatingEasings);
      next.delete(token);
      this._animatingEasings = next;
    }, 850);
  }

  /* ── Duration: play bar animation ── */

  private _playDuration(d: DurationToken, e: Event): void {
    const row = e.currentTarget as HTMLElement;
    copyToken(d.token, row);

    const bar = row.querySelector('.duration-bar') as HTMLElement | null;
    if (!bar) return;

    /* Reset */
    bar.classList.remove('animating');
    bar.style.transition = 'none';
    void bar.offsetHeight;

    /* Use the actual ms value for a visible duration (min 200ms for instant to be visible) */
    const duration = Math.max(d.ms, 200);
    bar.style.transition = `width ${duration}ms var(--line-ease-3)`;
    requestAnimationFrame(() => {
      bar.classList.add('animating');
    });

    /* Reset after animation */
    setTimeout(() => {
      bar.classList.remove('animating');
      bar.style.transition = 'none';
    }, duration + 300);
  }

  /* ── Animation: play/replay ── */

  private _playAnimation(a: AnimationToken): void {
    const key = a.token;
    const stage = this.shadowRoot?.querySelector(`[data-anim="${key}"]`) as HTMLElement | null;
    if (!stage) return;

    const box = stage.querySelector('.animation-demo-box') as HTMLElement | null;
    if (!box) return;

    /* Remove animation to reset */
    box.style.animation = 'none';
    void box.offsetHeight;

    const isInfinite = this._infiniteAnimations.has(key);
    const iterationCount = a.continuous || isInfinite ? 'infinite' : '1';

    /* Build animation shorthand — use keyframe name + timing from token value,
       but override iteration count based on toggle state */
    box.style.animation = `var(${a.token})`;
    box.style.animationIterationCount = iterationCount;
    box.style.animationFillMode = 'both';

    const next = new Set(this._playingAnimations);
    next.add(key);
    this._playingAnimations = next;

    if (!(a.continuous || isInfinite)) {
      /* For one-shot animations, reset after they finish (max 2.5s for bloom) */
      setTimeout(() => {
        box.style.animation = 'none';
        const after = new Set(this._playingAnimations);
        after.delete(key);
        this._playingAnimations = after;
      }, 2500);
    }
  }

  private _toggleInfinite(a: AnimationToken): void {
    const key = a.token;
    const next = new Set(this._infiniteAnimations);

    if (next.has(key)) {
      next.delete(key);
      /* Stop the animation */
      const box = this.shadowRoot?.querySelector(`[data-anim="${key}"] .animation-demo-box`) as HTMLElement | null;
      if (box) {
        box.style.animation = 'none';
      }
      const playing = new Set(this._playingAnimations);
      playing.delete(key);
      this._playingAnimations = playing;
    } else {
      next.add(key);
      /* Restart with infinite */
      this._infiniteAnimations = next;
      this._playAnimation(a);
      return;
    }

    this._infiniteAnimations = next;
  }

  /* ── Render: Easings ── */

  private _renderEasings() {
    return html`
      <sc-section
        heading="Easing Curves"
        description="81 easing tokens organized by category. Click any card to preview the easing and copy its token reference."
        .count=${81}
      >
        ${EASING_GROUPS.map(
          (group) => html`
          <div class="easing-subsection">
            <h3 class="easing-subsection-title">${group.label}</h3>
            <p class="easing-subsection-count">${group.tokens.length} tokens</p>
            <div class="easing-grid">
              ${group.tokens.map(
                (t) => html`
                <div
                  class="token-box easing-card"
                  @click=${(e: Event) => this._playEasing(t.token, e)}
                >
                  <div class="easing-track">
                    <div class="easing-ball"></div>
                  </div>
                  <span class="easing-type-badge">${t.type}</span>
                  <span class="token-name">${t.token}</span>
                  <span class="token-value">${t.value}</span>
                </div>
              `
              )}
            </div>
          </div>
        `
        )}
      </sc-section>
    `;
  }

  /* ── Render: Durations ── */

  private _renderDurations() {
    return html`
      <sc-section
        heading="Durations"
        description="12 duration tokens for consistent animation timing. Click any row to preview the duration and copy its token reference."
        .count=${12}
      >
        <div class="duration-subsection">
          <h3 class="duration-subsection-title">Practical (7)</h3>
          <div class="duration-grid">
            ${DURATIONS_PRACTICAL.map(
              (d) => html`
              <div
                class="token-box duration-row"
                @click=${(e: Event) => this._playDuration(d, e)}
              >
                <span class="duration-label">${d.token}</span>
                <div class="duration-track">
                  <div class="duration-bar"></div>
                </div>
                <span class="duration-ms">${d.value}</span>
              </div>
            `
            )}
          </div>
        </div>

        <div class="duration-subsection">
          <h3 class="duration-subsection-title">Semantic (5)</h3>
          <div class="duration-grid">
            ${DURATIONS_SEMANTIC.map(
              (d) => html`
              <div
                class="token-box duration-row"
                @click=${(e: Event) => this._playDuration(d, e)}
              >
                <span class="duration-label">${d.token}</span>
                <div class="duration-track">
                  <div class="duration-bar"></div>
                </div>
                <span class="duration-ms">${d.value}</span>
              </div>
            `
            )}
          </div>
        </div>
      </sc-section>
    `;
  }

  /* ── Render: Animations ── */

  private _renderAnimations() {
    return html`
      <sc-section
        heading="Animations"
        description="23 animation shorthand tokens with live demos. Click play to preview, toggle loop for continuous playback. Click the token name to copy."
        .count=${23}
      >
        <div class="animation-grid">
          ${ANIMATIONS.map(
            (a) => html`
            <div class="animation-card">
              <div class="animation-stage" data-anim="${a.token}">
                <div class="animation-demo-box"></div>
              </div>
              <div class="animation-controls">
                <button
                  class="animation-btn"
                  @click=${() => this._playAnimation(a)}
                  title="Play animation"
                >play</button>
                <button
                  class="animation-btn ${this._infiniteAnimations.has(a.token) ? 'active' : ''}"
                  @click=${() => this._toggleInfinite(a)}
                  title="Toggle infinite loop"
                >loop</button>
              </div>
              <span
                class="token-name"
                @click=${(e: Event) => this._copy(a.token, e)}
              >${a.token}</span>
              <span class="token-value">${a.value}</span>
            </div>
          `
          )}
        </div>
      </sc-section>
    `;
  }

  /* ── Main render ── */

  override render() {
    return html`
      <h1 class="page-title">Motion</h1>
      <p class="page-subtitle">
        <strong>81</strong> easings,
        <strong>12</strong> durations, and
        <strong>23</strong> animations
        = <strong>116</strong> motion tokens.
        Click any token to copy its CSS custom property reference.
      </p>

      ${this._renderEasings()}
      ${this._renderDurations()}
      ${this._renderAnimations()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-page-motion': ScPageMotion;
  }
}
