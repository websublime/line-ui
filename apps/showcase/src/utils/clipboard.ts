/**
 * Copy a CSS token reference to the clipboard and flash visual feedback.
 *
 * Writes `var(--line-<token>)` to the clipboard, adds a `.copied` class
 * to the target element for 700 ms, and silently catches clipboard-denied
 * errors (no user feedback in that case).
 */
export function copyToken(token: string, el: HTMLElement): void {
  const text = `var(${token})`;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 700);
    })
    .catch(() => {
      /* Clipboard denied — no feedback */
    });
}
