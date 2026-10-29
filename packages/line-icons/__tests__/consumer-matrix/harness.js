/**
 * Consumer matrix — the browser half (spec §6.C.3 acceptance; §10 SD96).
 *
 * Every matrix page, bundled or no-build, hands its registry to `renderCases`. Each case resolves one icon and
 * injects the SVG string into its own element, as a consumer would; a rejection marks the element `rejected`.
 * The results land on `window.lineIconsMatrix`, and `<html data-matrix="done">` tells the test to read them.
 */

/** The R10 round 2 names: `house` in both sets, Phosphor `heart` in `fill`, `rocket`, and an unknown name. */
export const CASES = [
  { id: 'lucide-house', library: 'lucide', name: 'house' },
  { id: 'lucide-rocket', library: 'lucide', name: 'rocket' },
  { id: 'lucide-unknown', library: 'lucide', name: 'definitely-not-an-icon' },
  { id: 'phosphor-house', library: 'phosphor', name: 'house' },
  { id: 'phosphor-heart-fill', library: 'phosphor', name: 'heart', options: { weight: 'fill' } },
  { id: 'phosphor-rocket', library: 'phosphor', name: 'rocket' },
  { id: 'phosphor-unknown', library: 'phosphor', name: 'definitely-not-an-icon' },
];

export async function renderCases(registry) {
  const results = {};
  await Promise.all(
    CASES.map(async ({ id, library, name, options }) => {
      const host = document.createElement('div');
      host.id = id;
      document.body.append(host);
      try {
        const svg = await registry.resolve(library, name, options);
        host.innerHTML = svg;
        host.dataset.state = 'resolved';
        results[id] = { ok: true, svg };
      } catch (error) {
        host.dataset.state = 'rejected';
        results[id] = { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    }),
  );
  window.lineIconsMatrix = results;
  document.documentElement.dataset.matrix = 'done';
}
