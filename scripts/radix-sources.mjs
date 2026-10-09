/**
 * scripts/radix-sources.mjs — emitted hue name → @radix-ui/colors source name.
 *
 * Hue tokens (`--line-{hue}-{step}`) and role tokens (`--line-{role}-{step}`)
 * share one pattern, so no hue may share a name with a role (spec §6.C.1,
 * AM-052). The Radix `gray` hue therefore ships as `neutral`. Every script
 * that reads `@radix-ui/colors` by hue name resolves the source name here
 * (spec §6.C.3): Radix objects and step keys use the SOURCE name
 * (`grayDarkP3A.grayA1`), emitted tokens use the hue name (`--line-neutral-a1`).
 *
 * The map lives under `scripts/`, not in `line-schemas`, so it adds no
 * published surface.
 */

/** Emitted hue name → Radix source name, for hues whose names differ. */
export const RADIX_SOURCES = Object.freeze({ neutral: 'gray' });

/**
 * The @radix-ui/colors source name for an emitted hue.
 * @param {string} hue
 * @returns {string}
 */
export function radixSource(hue) {
  return Object.hasOwn(RADIX_SOURCES, hue) ? RADIX_SOURCES[hue] : hue;
}
