/** Tone of `<line-alert>`; each value sets the colour token defaults from one theme role (`neutral` uses `gray`). */
export type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Live role of `<line-alert>`: `off` sets none, `polite` sets `status` and `assertive` sets `alert`. */
export type AlertLive = 'off' | 'polite' | 'assertive';
