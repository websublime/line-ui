import { commonProp, defineDescriptor } from '../descriptor.js';

/** The Kbd descriptor (`docs/specs/0015-kbd.md` Descriptor fields). */
export const kbdDescriptor = defineDescriptor({
  name: 'Kbd',
  tag: 'line-kbd',
  load: () => import('@websublime/line-components/kbd'),
  description:
    "A keyboard shortcut hint shown beside the action it triggers, drawn for the user's device: Command K on Apple devices and Ctrl+K elsewhere. Set `keys` to the shortcut. Join keys pressed together with `+`, such as `mod+shift+p`, and separate keys pressed one after another with a space, such as `g i`. Write `mod` for the main modifier, which is Command on Apple devices and Control elsewhere. Other key names are `ctrl`, `alt`, `shift`, `meta`, `enter`, `escape`, `backspace`, `delete`, `tab`, `space`, `up`, `down`, `left`, `right`, `pageup`, `pagedown`, `home`, `end` and `plus`, or a letter, a digit or a function key such as `f5`. The hint only shows the shortcut; the app handles the keys, and the hint is not interactive.",
  props: {
    keys: commonProp('DynamicString', 'The shortcut, such as `mod+k`, `mod+shift+p` or `g i`.').optional(),
  },
  slots: {},
  bindings: {
    props: {
      keys: { kind: 'attribute', name: 'keys' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'never' } },
});
