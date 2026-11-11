import { commonProp, defineDescriptor } from '../descriptor.js';

const DESCRIPTION =
  "A picture that stands for a person or an organisation, such as a user's photo beside a comment or in an account menu. Set `src` to the image URL and `name` to the person's or organisation's name. Assistive technology announces the name, and while the image loads, fails or is missing the avatar shows the name's initials instead. Leave `name` empty only when the same name is already written next to the avatar, so it is not announced twice; the avatar is then decorative.";
const STATUS =
  ' To show presence, put a Badge in `status`, such as a `success` Badge with an empty label and the accessible label "Online".';
const CLOSING = ' An avatar is not interactive. Use Image for any other picture, and Icon for a symbol.';

/** The Avatar descriptor (`docs/specs/0009-avatar.md` Descriptor fields). */
export const avatarDescriptor = defineDescriptor({
  name: 'Avatar',
  tag: 'line-avatar',
  load: () => import('@websublime/line-components/avatar'),
  description: `${DESCRIPTION}${STATUS}${CLOSING}`,
  // The tool leaves the `status` ComponentId out, so its description does not name it (§6.G.3; F9).
  toolDescription: `${DESCRIPTION}${CLOSING}`,
  props: {
    src: commonProp(
      'DynamicString',
      'The image URL; the surface keeps a URL its URL policy rejects out of the DOM.',
    ).optional(),
    name: commonProp(
      'DynamicString',
      "The person's or organisation's name: the accessible name and the source of the initials; empty for a decorative avatar.",
    ).optional(),
    status: commonProp(
      'ComponentId',
      'A presence marker, usually a Badge named by its accessible label, such as "Online".',
    ).optional(),
  },
  slots: { status: 'status' },
  bindings: {
    props: {
      src: { kind: 'url', use: 'image', name: 'src' },
      name: { kind: 'attribute', name: 'name' },
    },
  },
  actions: {},
  accessibility: { hostNaming: { kind: 'always' } },
});
