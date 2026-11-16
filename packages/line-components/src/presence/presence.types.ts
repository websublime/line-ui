/** `detail` of the `line-exit-complete` event: the content is hidden. */
export interface LinePresenceExitCompleteDetail {
  present: false;
}

/** `detail` of the `line-enter-complete` event: the content is shown. */
export interface LinePresenceEnterCompleteDetail {
  present: true;
}
