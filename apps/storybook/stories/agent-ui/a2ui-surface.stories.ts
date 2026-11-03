import '@websublime/line-genui/a2ui';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { setIconRegistry } from '@websublime/line-components';
import { type LineA2uiSurface, Session } from '@websublime/line-genui/a2ui';
import { IconRegistry } from '@websublime/line-icons';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';
import { createLucideResolver } from '@websublime/line-icons/resolvers/lucide';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';
import { extractArgTypes } from '../components/manifest-arg-types.js';
import {
  type A2uiMessage,
  basicShowcase,
  errorShowcase,
  lineShowcase,
  listShowcase,
  mixedListShowcase,
  rtlShowcase,
  SURFACE_ID,
} from './a2ui-fixtures.js';

// <line-a2ui-surface> stories (Phase 1 spec §6.G.4). Each story renders one A2UI message stream through a
// fresh Session. No story imports a line-components subpath: the surface loads each component on first use.
// The icon files are self-hosted under public/icons/, so the stories make no third-party request.

const registry = new IconRegistry();
registry.register('lucide', createLucideResolver({ base: './icons/lucide/' }));
registry.register('phosphor', createPhosphorResolver({ base: './icons/phosphor/' }));
setIconRegistry(registry);

const DESCRIPTION = `\`<line-a2ui-surface>\` renders an [A2UI](https://a2ui.org) v0.9.1 surface with line://ui components, in its light DOM, so document \`::part()\` rules reach every rendered element. **Preview**: \`@websublime/line-genui/a2ui\` may change in any minor release until it targets A2UI v1.0.

\`\`\`js
import { setIconRegistry } from '@websublime/line-components';
import { Session } from '@websublime/line-genui/a2ui';
import { IconRegistry } from '@websublime/line-icons';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';
import { createPhosphorResolver } from '@websublime/line-icons/resolvers/phosphor';

const registry = new IconRegistry();
registry.register('phosphor', createPhosphorResolver({ base: '/icons/phosphor/' }));
setIconRegistry(registry);

const surface = document.querySelector('line-a2ui-surface'); // <line-a2ui-surface surface-id="main">
surface.iconMap = a2uiIconMap('phosphor', { library: 'phosphor' });
surface.session = new Session();
surface.addEventListener('line-a2ui-action', (event) => transport.send(event.detail));
surface.addEventListener('line-a2ui-error', (event) => transport.send(event.detail));
await surface.feed(messages); // one transport batch
\`\`\`

**Session.** A \`Session\` holds the A2UI surface and data models of one \`@a2ui/web_core\` 0.14.0 \`MessageProcessor\`, with the \`line\` catalog (\`https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json\`) and the A2UI basic catalog (\`https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json\`) always registered. Feed a transport batch with \`surface.feed(messages)\` or \`session.process(messages, surfaceId)\`: each message goes through on its own, so a rejected message drops only itself. The surface holds \`aria-busy="true"\` until the batch settles.

**Icons.** Two consumer lines wire icons: \`setIconRegistry(registry)\` from \`@websublime/line-components\` with a \`line-icons\` \`IconRegistry\`, and \`surface.iconMap = a2uiIconMap('phosphor', { library: 'phosphor' })\` from \`@websublime/line-icons/a2ui\`, where \`library\` repeats the key you registered the set under. The surface never writes the registry. An Icon name renders through the entry \`Object.hasOwn(iconMap, name)\` finds; a name the map lacks, or any name while \`iconMap\` is unset, leaves an empty box and raises \`line-a2ui-error\`. Setting or replacing \`iconMap\` re-renders every Icon. A \`path\` (or the basic \`{ "svgPath": … }\`) wins over a name. A file that fails to load leaves an empty box and raises nothing.

**Events.** \`line-a2ui-action\` carries the resolved A2UI \`action\` message, and \`line-a2ui-error\` an A2UI \`error\` message in its generic form, \`{ version, error: { code, surfaceId, message, … } }\`; send both through your transport. An error \`web_core\` raises keeps its code, such as \`VALIDATION_ERROR\`, \`CATALOG_ERROR\` or \`UNKNOWN_COMPONENT_TYPE\`. The surface raises its own: \`LIMIT_EXCEEDED\`, \`MARKDOWN_RENDER_ERROR\`, \`MISSING_ACCESSIBLE_NAME\`, \`UNMAPPED_ICON\` and \`COMPONENT_LOAD_ERROR\` (a component module that failed to load).

**Limits.** \`max-nodes\` (component definitions and rendered nodes, placeholders included), \`max-depth\` (the rendered tree, the root at depth 1) and \`max-data-model-size\` (UTF-8 bytes of the data model's JSON text) each take a positive integer. A message that would breach one is rejected before it applies and raises \`LIMIT_EXCEEDED\`. Any other value keeps the default, and the surface throws nothing.

**URLs, text, theme.** Image, Video and AudioPlayer URLs and \`openUrl\` resolve against the document base and pass the default policy, \`https:\`, \`http:\`, \`mailto:\` and \`tel:\`; \`data:\` and every other scheme never pass. \`urlPolicy\`, \`(url, use) => boolean\`, runs after it and can only reject; a throw counts as \`false\`. \`openUrl\` runs only from a user action. Text renders as plain text unless you set \`markdownRenderer\`, \`(markdown) => Node\`; you own sanitising, and a throw or a value that is not a \`Node\` falls back to plain text with \`MARKDOWN_RENDER_ERROR\`. Agent theme hints are ignored.

**Accessibility.** One live region announces \`live-update-text\` ("Content updated.") after a batch that changed the surface and \`live-error-text\` ("Some content could not be shown.") after an error; set both to localise them. A node whose component needs a name and has none renders an inert placeholder and raises \`MISSING_ACCESSIBLE_NAME\`. An unknown type renders an inert placeholder; a child that has not arrived stays hidden. A List renders \`<line-stack role="list">\` with each item as \`role="listitem"\`. The surface never moves focus to another component: its reconciler keys elements by \`instanceId\` and keeps focus across reorders, and on a reparent it uses \`moveBefore()\` where the browser has it and otherwise returns focus to the same element at the end of the batch.

**Template-list limit.** In a template list (\`{ "componentId": …, "path": … }\`) an item's \`instanceId\` names its position in the bound array, not its data, until A2UI adds data-derived keys ([a2ui#1745](https://github.com/a2ui-project/a2ui/issues/1745)). An insertion or a reorder of that array keeps the element at each position, so a kept element, and the focus on it, can rebind to another item. Revisit when a2ui#1745 lands.`;

interface SurfaceArgs {
  messages: A2uiMessage[];
  iconSet: 'phosphor' | 'lucide';
  dir: 'ltr' | 'rtl';
}

const meta = {
  title: 'Agent UI/A2UI Surface',
  component: 'line-a2ui-surface',
  tags: ['autodocs'],
  parameters: { docs: { extractArgTypes, description: { component: DESCRIPTION } } },
  args: { messages: basicShowcase, iconSet: 'phosphor', dir: 'ltr' },
  argTypes: { messages: { control: false }, iconSet: { control: 'inline-radio', options: ['phosphor', 'lucide'] } },
  render: ({ messages, iconSet, dir }) => {
    const surface: LineA2uiSurface = document.createElement('line-a2ui-surface');
    surface.surfaceId = SURFACE_ID;
    surface.dir = dir;
    surface.iconMap = a2uiIconMap(iconSet, { library: iconSet });
    surface.session = new Session();
    void surface.feed(messages);
    return surface;
  },
} satisfies Meta<SurfaceArgs>;

export default meta;

type Story = StoryObj<SurfaceArgs>;

export const Basic: Story = {};

export const LineCatalog: Story = { name: 'Line catalog', args: { messages: lineShowcase } };

export const List: Story = { args: { messages: listShowcase } };

export const MixedList: Story = { name: 'Mixed list', args: { messages: mixedListShowcase } };

export const Placeholders: Story = { args: { messages: errorShowcase } };

export const RightToLeft: Story = {
  name: 'Right to left',
  args: { messages: rtlShowcase, iconSet: 'lucide', dir: 'rtl' },
};
