import { type ArgTypes, getCustomElements } from '@storybook/web-components-vite';

// The autodocs table of a line://ui component, read from the shipped Custom
// Elements Manifest (Phase 1 spec §6.C.6, §7.3).
//
// Storybook's own extractor keys every entry by its bare name across all
// categories, so a slot or part that shares a name with an attribute, such as
// Button's `loading`, replaces it, and the default slot, whose name is empty,
// is dropped. This one keys slots and parts by category, keeps attribute and
// property keys equal to the arg names, and lists only public instance fields.
// It maps the primitive manifest types `boolean`, `number` and `string`, with
// `| undefined` and `| null` removed, to Storybook's own type names, so those
// rows get a toggle, a number or a text control; every other type stays
// `other`. A component meta passes it as `parameters.docs.extractArgTypes`.
//
// It reads the manifest Storybook holds, the one preview.ts merges from every
// package that ships one, so the line-components and line-genui tables share
// one source.

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

/** The declarations of the manifest preview.ts registers; it follows the CEM schema, whose fields this file reads. */
function declarations(): CemDeclaration[] {
  const manifest = getCustomElements() as { modules?: { declarations?: CemDeclaration[] }[] } | undefined;
  return (manifest?.modules ?? []).flatMap((module) => module.declarations ?? []);
}

/** `boolean | undefined` → `{ name: 'boolean' }`; a type that is not one primitive stays `other`. */
function argType(text: string): NonNullable<ArgTypes[string]['type']> {
  const members = text.split('|').map((member) => member.trim());
  const kept = members.filter((member) => member !== 'undefined' && member !== 'null').join(' | ');
  return kept === 'boolean' || kept === 'number' || kept === 'string' ? { name: kept } : { name: 'other', value: text };
}

function row(item: CemItem, category: string): ArgTypes[string] {
  return {
    name: item.name,
    description: item.description ?? '',
    type: argType(item.type?.text ?? ''),
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
  const declaration = declarations().find((candidate) => candidate.tagName === tagName);
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
