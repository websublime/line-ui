/** Tone of `<line-alert>`; each value sets the colour token defaults from one theme role (`neutral` uses `gray`). */
export type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Live role of `<line-alert>`: `off` sets none, `polite` sets `status` and `assertive` sets `alert`. */
export type AlertLive = 'off' | 'polite' | 'assertive';

/** The `detail` of `line-dismiss`: an empty object, so fields can join later without a breaking change. */
export type LineAlertDismissDetail = Record<string, never>;
