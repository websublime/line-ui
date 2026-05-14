import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

/**
 * One playlist row entry consumed by `<sc-music-player>`.
 */
export interface ScPlaylistEntry {
  title: string;
  artist: string;
  /** Marks the row that should render with the additive `playlist-item-active` part. */
  active?: boolean;
}

/**
 * Detail payload emitted by `sc-player-toggle`.
 */
export interface ScPlayerToggleDetail {
  playing: boolean;
}

/**
 * Detail payload emitted by `sc-player-seek` and `sc-player-volume`.
 */
export interface ScPlayerValueDetail {
  value: number;
}

/**
 * Headless music player composition block.
 *
 * Defines structure and layout only — no design system tokens internally.
 * Every visual zone is exposed via `::part()` for external styling. Generic
 * CSS custom properties (without the design system prefix) allow structural customisation
 * from the consumer.
 *
 * Mirrors the headless contract established by `sc-product-card` and
 * `sc-login-block` (see docs/specs/00-spec-playground.md §0, §8.4, §16 D1/D4/D5).
 *
 * Per spec §16 D5, the player exposes a `--surface-color-scheme` host custom
 * property. The consumer (`sc-page-playground`) sets this to `dark` so
 * `light-dark()` expressions in consumer `::part()` rules resolve to the dark
 * branch regardless of the page's global light/dark mode. The block itself
 * never sets `color-scheme` or carries a `.dark` class internally.
 *
 * The `playing` property reflects to a boolean attribute so consumers can
 * scope styles such as `sc-music-player[playing]::part(ctrl-play) { ... }` to
 * the play vs. pause visual state.
 *
 * @fires sc-player-toggle - User clicked play/pause (or pressed Space/Enter while focused on it). Detail: `{ playing }`.
 * @fires sc-player-seek - User clicked the progress track (or pressed Arrow Left/Right while focused on it). Detail: `{ value }`.
 * @fires sc-player-volume - User clicked the volume track. Detail: `{ value }`.
 */
@customElement('sc-music-player')
export class ScMusicPlayer extends LitElement {
  /** Current track title */
  @property({ type: String, attribute: 'track-title' }) trackTitle = '';

  /** Current artist name */
  @property({ type: String }) artist = '';

  /** Progress percentage (0–100) */
  @property({ type: Number }) progress = 40;

  /** Volume percentage (0–100) */
  @property({ type: Number }) volume = 70;

  /** Track duration in seconds — drives the right-hand value in the progress timecode. */
  @property({ type: Number }) duration = 238;

  /**
   * Toggled by the play/pause control. Reflected to a boolean attribute so
   * consumers can target `sc-music-player[playing]::part(ctrl-play)`.
   */
  @property({ type: Boolean, reflect: true }) playing = false;

  /** Playlist rows; the entry with `active: true` carries the additive `playlist-item-active` part. */
  @property({ type: Array }) playlist: ScPlaylistEntry[] = [];

  @query('.progress-track') private _progressTrack!: HTMLElement;
  @query('.volume-track') private _volumeTrack!: HTMLElement;

  static override styles = css`
    :host {
      --card-radius: 12px;
      --card-padding: 1.5rem;
      --card-gap: 1.25rem;

      --album-art-size: 160px;
      --album-art-radius: 8px;
      --album-art-gradient: linear-gradient(135deg, #555, #222);

      --track-title-font-size: 1.125rem;
      --track-title-font-weight: 700;

      --artist-font-size: 0.875rem;

      --progress-height: 6px;
      --progress-radius: 999px;

      --ctrl-size: 40px;
      --ctrl-radius: 50%;
      --ctrl-border-width: 1px;
      --ctrl-play-size: 56px;

      --volume-height: 4px;
      --volume-radius: 999px;

      --playlist-row-height: 40px;
      --playlist-row-padding: 0.5rem 0.75rem;
      --playlist-active-border-width: 3px;

      /*
       * Consumer-controlled surface color-scheme override (§16 D5).
       * Default 'light dark' = follow the inherited page color-scheme.
       * The consumer sets this to 'dark' on the host so light-dark()
       * expressions in their ::part() rules resolve to the dark branch.
       */
      color-scheme: var(--surface-color-scheme, light dark);

      display: block;
    }

    /* ── Card shell ── */
    .card {
      box-sizing: border-box;
      border-radius: var(--card-radius);
      padding: var(--card-padding);
      display: flex;
      flex-direction: column;
      gap: var(--card-gap);
      width: 100%;
    }

    /* ── Album art ── */
    .album-art {
      width: var(--album-art-size);
      height: var(--album-art-size);
      border-radius: var(--album-art-radius);
      background: var(--album-art-gradient);
      align-self: center;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .album-art svg {
      width: 50%;
      height: 50%;
      opacity: 0.55;
    }

    /* ── Track info ── */
    .track-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      text-align: center;
    }

    .track-title {
      margin: 0;
      font-size: var(--track-title-font-size);
      font-weight: var(--track-title-font-weight);
    }

    .artist {
      margin: 0;
      font-size: var(--artist-font-size);
    }

    /* ── Progress bar ── */
    .progress {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .progress-track {
      position: relative;
      width: 100%;
      height: var(--progress-height);
      border-radius: var(--progress-radius);
      cursor: pointer;
      outline: none;
    }

    .progress-track:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 3px;
    }

    .progress-fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      width: var(--_progress, 40%);
      height: 100%;
      border-radius: inherit;
    }

    .progress-time {
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
      display: flex;
      justify-content: flex-end;
    }

    /* ── Controls ── */
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .ctrl-btn {
      box-sizing: border-box;
      width: var(--ctrl-size);
      height: var(--ctrl-size);
      border-radius: var(--ctrl-radius);
      border: var(--ctrl-border-width) solid transparent;
      background: transparent;
      color: inherit;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background 150ms ease-in-out, color 150ms ease-in-out, border-color 150ms ease-in-out;
    }

    .ctrl-btn:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    .ctrl-btn svg {
      width: 45%;
      height: 45%;
    }

    .ctrl-play {
      width: var(--ctrl-play-size);
      height: var(--ctrl-play-size);
    }

    .ctrl-play svg {
      width: 50%;
      height: 50%;
    }

    /* ── Volume ── */
    .volume {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .volume-icon {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .volume-track {
      position: relative;
      flex: 1;
      height: var(--volume-height);
      border-radius: var(--volume-radius);
      cursor: pointer;
      outline: none;
    }

    .volume-track:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 3px;
    }

    .volume-fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      width: var(--_volume, 70%);
      height: 100%;
      border-radius: inherit;
    }

    /* ── Playlist ── */
    .playlist {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .playlist-item {
      box-sizing: border-box;
      min-height: var(--playlist-row-height);
      padding: var(--playlist-row-padding);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      border-inline-start: var(--playlist-active-border-width) solid transparent;
    }

    .playlist-item-title {
      font-weight: 600;
    }

    .playlist-item-artist {
      opacity: 0.75;
      font-size: 0.8125rem;
    }
  `;

  protected override updated(changed: PropertyValues): void {
    if (changed.has('progress')) {
      this.style.setProperty('--_progress', `${this._clampedProgress}%`);
    }
    if (changed.has('volume')) {
      this.style.setProperty('--_volume', `${this._clampedVolume}%`);
    }
  }

  private _clamp(value: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.min(100, Math.max(0, value));
  }

  /** Single source of truth for the clamped progress percentage (0–100). */
  private get _clampedProgress(): number {
    return this._clamp(this.progress);
  }

  /** Single source of truth for the clamped volume percentage (0–100). */
  private get _clampedVolume(): number {
    return this._clamp(this.volume);
  }

  private _emitToggle = () => {
    this.playing = !this.playing;
    this.dispatchEvent(
      new CustomEvent<ScPlayerToggleDetail>('sc-player-toggle', {
        detail: { playing: this.playing },
        bubbles: true,
        composed: true
      })
    );
  };

  private _emitSeek(value: number) {
    const next = this._clamp(value);
    this.progress = next;
    this.dispatchEvent(
      new CustomEvent<ScPlayerValueDetail>('sc-player-seek', {
        detail: { value: next },
        bubbles: true,
        composed: true
      })
    );
  }

  private _emitVolume(value: number) {
    const next = this._clamp(value);
    this.volume = next;
    this.dispatchEvent(
      new CustomEvent<ScPlayerValueDetail>('sc-player-volume', {
        detail: { value: next },
        bubbles: true,
        composed: true
      })
    );
  }

  private _onProgressClick = (event: MouseEvent) => {
    const rect = this._progressTrack.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    this._emitSeek(ratio * 100);
  };

  private _onProgressKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this._emitSeek(this.progress - 5);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this._emitSeek(this.progress + 5);
    }
  };

  private _onVolumeClick = (event: MouseEvent) => {
    const rect = this._volumeTrack.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    this._emitVolume(ratio * 100);
  };

  private _onVolumeKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this._emitVolume(this.volume - 5);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this._emitVolume(this.volume + 5);
    }
  };

  private _formatTime(percent: number): string {
    const totalSeconds = this.duration;
    const elapsed = Math.round((this._clamp(percent) / 100) * totalSeconds);
    const total = totalSeconds;
    const fmt = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };
    return `${fmt(elapsed)} / ${fmt(total)}`;
  }

  private _renderAlbumArt() {
    return html`
      <div class="album-art" part="album-art" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2"/>
          <circle cx="32" cy="32" r="6" fill="currentColor"/>
          <circle cx="32" cy="32" r="18" stroke="currentColor" stroke-width="1" opacity="0.5"/>
        </svg>
      </div>
    `;
  }

  private _renderPlayIcon() {
    return this.playing
      ? html`
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1"/>
            <rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
        `
      : html`
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5 L19 12 L8 19 Z"/>
          </svg>
        `;
  }

  private _renderPrevIcon() {
    return html`
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="5" y="5" width="2" height="14" rx="1"/>
        <path d="M20 5 L9 12 L20 19 Z"/>
      </svg>
    `;
  }

  private _renderNextIcon() {
    return html`
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4 5 L15 12 L4 19 Z"/>
        <rect x="17" y="5" width="2" height="14" rx="1"/>
      </svg>
    `;
  }

  private _renderVolumeIcon() {
    return html`
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 9 V15 H7 L13 20 V4 L7 9 Z"/>
        <path d="M16 8 Q19 12 16 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>
    `;
  }

  private _renderPlaylist() {
    if (!this.playlist || this.playlist.length === 0) return nothing;
    return html`
      <ol class="playlist" part="playlist">
        ${this.playlist.map((entry) => {
          const partAttr = entry.active ? 'playlist-item playlist-item-active' : 'playlist-item';
          return html`
            <li class="playlist-item ${entry.active ? 'active' : ''}" part=${partAttr}>
              <span class="playlist-item-title">${entry.title}</span>
              <span class="playlist-item-artist">— ${entry.artist}</span>
            </li>
          `;
        })}
      </ol>
    `;
  }

  override render() {
    const progress = this._clampedProgress;
    const volume = this._clampedVolume;
    /*
     * Tab order follows the DOM order: album-art (not focusable) →
     * track-info (not focusable) → progress → ctrl-prev → ctrl-play →
     * ctrl-next → volume → playlist. This matches the visual top-to-bottom
     * reading order of the card; the user scans the artwork, the track
     * metadata, the timeline, then the controls. Spec §10 does not formalise
     * a specific Tab order for the player block, so we deliberately keep
     * DOM order = visual order. Do NOT reshuffle the DOM without revisiting
     * this comment and the spec.
     */
    return html`
      <div class="card" part="card" role="region" aria-label="Music player">
        ${this._renderAlbumArt()}

        <div class="track-info" part="track-info">
          <h3 class="track-title" part="track-title">${this.trackTitle}</h3>
          <p class="artist" part="artist">${this.artist}</p>
        </div>

        <div class="progress" part="progress">
          <div
            class="progress-track"
            part="progress-track"
            role="slider"
            tabindex="0"
            aria-label="Track progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${progress}
            @click=${this._onProgressClick}
            @keydown=${this._onProgressKeydown}
          >
            <div class="progress-fill" part="progress-fill"></div>
          </div>
          <div class="progress-time" part="progress-time" aria-hidden="true">${this._formatTime(progress)}</div>
        </div>

        <div class="controls" part="controls">
          <button
            class="ctrl-btn"
            part="ctrl-btn"
            type="button"
            aria-label="Previous track"
          >${this._renderPrevIcon()}</button>
          <button
            class="ctrl-btn ctrl-play"
            part="ctrl-btn ctrl-play"
            type="button"
            aria-label=${this.playing ? 'Pause' : 'Play'}
            aria-pressed=${this.playing ? 'true' : 'false'}
            @click=${this._emitToggle}
          >${this._renderPlayIcon()}</button>
          <button
            class="ctrl-btn"
            part="ctrl-btn"
            type="button"
            aria-label="Next track"
          >${this._renderNextIcon()}</button>
        </div>

        <div class="volume" part="volume">
          <span class="volume-icon" part="volume-icon" aria-hidden="true">${this._renderVolumeIcon()}</span>
          <div
            class="volume-track"
            part="volume-track"
            role="slider"
            tabindex="0"
            aria-label="Volume"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${volume}
            @click=${this._onVolumeClick}
            @keydown=${this._onVolumeKeydown}
          >
            <div class="volume-fill" part="volume-fill"></div>
          </div>
        </div>

        ${this._renderPlaylist()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-music-player': ScMusicPlayer;
  }
}
