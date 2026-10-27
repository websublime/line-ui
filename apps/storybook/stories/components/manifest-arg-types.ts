import type { ArgTypes } from '@storybook/web-components-vite';
import componentsManifest from '@websublime/line-components/custom-elements.json' with { type: 'json' };

// The autodocs table of a line://ui component, read from the shipped Custom
// Elements Manifest (Phase 1 spec §6.C.6, §7.3).
//
// Storybook's own extractor keys every entry by its bare name across all
// categories, so a slot or part that shares a name with an attribute, such as
// Button's `loading`, replaces it, and the default slot, whose name is empty,
// is dropped. This one keys slots and parts by category, keeps attribute and
// property keys equal to the arg names, and lists only public instance fields.
// A component meta passes it as `parameters.docs.extractArgTypes`.

interface CemItem {
  name: string;
  kind?: string;
  description?: string;
  privacy?: string;
  static?: boolean;
  fieldName?: string;
  type?: { text: string };
  default?: string;
}

interface CemDeclaration {
  tagName?: string;
  members?: CemItem[];
  attributes?: CemItem[];
  events?: CemItem[];
  slots?: CemItem[];
  cssParts?: CemItem[];
  cssProperties?: CemItem[];
}

/** The JSON import types every literal; the manifest follows the CEM schema, whose fields this file reads. */
const manifest = componentsManifest as unknown as { modules: { declarations?: CemDeclaration[] }[] };
const declarations = manifest.modules.flatMap((module) => module.declarations ?? []);

function row(item: CemItem, category: string): ArgTypes[string] {
  return {
    name: item.name,
    description: item.description ?? '',
    type: { name: 'other', value: item.type?.text ?? '' },
    table: {
      category,
      type: { summary: item.type?.text ?? '' },
      defaultValue: { summary: item.default ?? '' },
    },
  };
}

/** A documentation-only row: listed in the table, with no control. */
function docRow(item: CemItem, category: string, name = item.name): ArgTypes[string] {
  return { ...row({ ...item, name }, category), control: false };
}

/** Event names as Storybook's action args name them: `line-change` → `onLineChange`. */
function actionName(event: string): string {
  return `on${event.replace(/(?:^|[-_:.\s]+)(.)/g, (_match, chr: string) => chr.toUpperCase())}`;
}

/** Public instance fields; statics, methods and private or protected members stay out of the table. */
function isPublicField(member: CemItem): boolean {
  return member.kind === 'field' && !member.static && (member.privacy ?? 'public') === 'public';
}

export function extractArgTypes(tagName: string): ArgTypes {
  const declaration = declarations.find((candidate) => candidate.tagName === tagName);
  if (!declaration) return {};
  const { members = [], attributes = [], events = [], slots = [], cssParts = [], cssProperties = [] } = declaration;
  return Object.fromEntries([
    ...members.filter(isPublicField).map((member) => [member.name, row(member, 'properties')]),
    ...attributes.map((attribute) => [attribute.name, row(attribute, 'attributes')]),
    ...events.flatMap((event) => [
      [actionName(event.name), { name: actionName(event.name), action: event.name, table: { disable: true } }],
      [`event:${event.name}`, docRow(event, 'events')],
    ]),
    ...slots.map((slot) => [`slot:${slot.name}`, docRow(slot, 'slots', slot.name || '(default)')]),
    ...cssParts.map((part) => [`part:${part.name}`, docRow(part, 'css shadow parts')]),
    ...cssProperties.map((property) => [property.name, docRow(property, 'css custom properties')]),
  ]);
}
