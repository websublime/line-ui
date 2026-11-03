/**
 * The `line` A2UI catalog: its document form, which `@websublime/line-genui/catalog.json` ships, the inline
 * projection a renderer advertises, and the client capabilities (Phase 1 spec §6.G.2; §10 SD42, SD44, SD45;
 * ARCH §17.3).
 *
 * @module catalog/line
 */

import { Catalog, type ComponentApi } from '@a2ui/web_core/catalog';
import { MessageProcessor } from '@a2ui/web_core/processing';
import { BASIC_CATALOG_ID } from './basic.js';
import type { LineDescriptor } from './descriptor.js';

/**
 * The `line` catalog id. It is an identifier and need not resolve; an incompatible change to the catalog moves it
 * to a new version segment (§6.G.2; §10 SD42; ARCH §17.3).
 */
export const LINE_CATALOG_ID = 'https://line-ui.websublime.com/a2ui/catalogs/line/v1/catalog.json';

/**
 * The common types document the catalog's references name, as the A2UI basic catalog writes it. An absolute URI
 * keeps the references valid whatever `$id` the document is read under.
 */
const COMMON_TYPES_URI = 'https://a2ui.org/specification/v0_9/common_types.json';

/**
 * The two definitions the published A2UI schemas resolve through `catalog.json#/$defs/…`: `common_types.json`
 * reaches `anyFunction` and `server_to_client.json` reaches `theme`. The catalog has no functions, so
 * `anyFunction` is `false`; its theme is an open object, because the host owns styling (R2 §2.7; §12 AM-003).
 */
const DOCUMENT_DEFS = {
  anyFunction: false,
  theme: {
    type: 'object',
    description: 'The line catalog defines no theme properties: the host app owns styling.',
  },
} as const;

/** A catalog document or an inline catalog: a JSON object. */
export type CatalogJson = Record<string, unknown>;

/**
 * An inline catalog, the form `client_capabilities.json#/$defs/Catalog` defines: the catalog id, the component
 * definitions, and the function definitions and theme properties when the catalog has any.
 */
export interface InlineCatalog extends CatalogJson {
  readonly catalogId: string;
  readonly components?: Record<string, unknown>;
  readonly functions?: readonly Record<string, unknown>[];
  readonly theme?: Record<string, unknown>;
}

/** The A2UI protocol versions the capabilities advertise; `v0.9` is the key the published schema requires (SD45). */
export const ADVERTISED_VERSIONS = ['v0.9', 'v0.9.1'] as const;

/** The capabilities of one protocol version: the catalog ids the renderer supports and the inline catalogs. */
export interface VersionCapabilities {
  readonly supportedCatalogIds: string[];
  readonly inlineCatalogs: InlineCatalog[];
}

/** The client capabilities object, keyed by protocol version (`client_capabilities.json`). */
export type LineCapabilities = Record<(typeof ADVERTISED_VERSIONS)[number], VersionCapabilities>;

/** Options of {@link lineCapabilities}. */
export interface LineCapabilitiesOptions {
  /**
   * Whether the capabilities list the A2UI basic catalog id beside the `line` id. Off by default until line maps
   * every basic type; the basic catalog is never inlined (§10 SD44).
   */
  readonly basic?: boolean;
}

/**
 * Returns the `line` catalog of `descriptors`: a `web_core` v0.9 `Catalog` under {@link LINE_CATALOG_ID} that holds
 * every agent-exposed descriptor and leaves out each one with `agentExposed: false` (§6.G.1; ARCH §17.3).
 *
 * Its `toJson()` is the document form that `catalog.json` ships: the A2UI basic catalog's document layout, with
 * `$defs/anyFunction: false` and an open `$defs/theme`, so `common_types.json` and `server_to_client.json`
 * compile against it (R2 §2.7; §10 SD42).
 *
 * @param descriptors The component descriptors, usually `descriptors`.
 */
export function lineCatalog(descriptors: readonly LineDescriptor[]): Catalog<LineDescriptor> {
  const exposed = descriptors.filter((descriptor) => descriptor.agentExposed);
  return new Catalog(LINE_CATALOG_ID, '0.9', exposed, [], {
    schemaUri: 'https://json-schema.org/draft/2020-12/schema',
    schemaId: LINE_CATALOG_ID,
    title: 'line://ui catalog',
    description: 'The line://ui components an A2UI agent can use, rendered by <line-a2ui-surface>.',
    commonTypesUri: COMMON_TYPES_URI,
    defs: DOCUMENT_DEFS,
  });
}

/**
 * Returns the document form of the `line` catalog of `descriptors`, the JSON that
 * `@websublime/line-genui/catalog.json` holds (§6.G.2; §10 SD42).
 *
 * @param descriptors The component descriptors, usually `descriptors`.
 */
export function lineCatalogDocument(descriptors: readonly LineDescriptor[]): CatalogJson {
  return lineCatalog(descriptors).toJson();
}

/**
 * Derives the inline projection of a catalog document: the form a renderer sends in
 * `client_capabilities.inlineCatalogs`, which validates against `client_capabilities.json#/$defs/Catalog`
 * (§6.G.2; §10 SD42; plan §5.6 D2).
 *
 * The document form does not validate against that definition, because its `$schema`, `$id`, `title`,
 * `description`, `protocolVersion` and `$defs` are additional properties there (R2 §2.7). The projection comes
 * from the public `web_core` 0.14.0 API: `Catalog.fromJson` reads the document, and
 * `MessageProcessor.getRendererCapabilities` writes the v0.9 inline catalog of it, which keeps `catalogId`, the
 * components as `allOf` of the `ComponentCommon` envelope and their own properties, and the theme properties.
 * `web_core` writes each common-type reference as `#/$defs/<name>`, which `Catalog.fromJson` resolves when it reads
 * the projection back.
 *
 * @param document A catalog document, such as {@link lineCatalogDocument} returns or `catalog.json` holds.
 * @returns A fresh inline catalog that the caller may modify.
 */
export function inlineCatalog(document: CatalogJson): InlineCatalog {
  // `fromJson` types its functions as `FunctionApi`, while the processor takes implementations. The capabilities
  // read only a function's name, description, return type and schema, and the `line` document has no functions.
  const catalog = Catalog.fromJson(document) as Catalog<ComponentApi>;
  const processor = new MessageProcessor([catalog]);
  try {
    const capabilities = processor.getRendererCapabilities({ versions: ['v0.9'], includeInlineCatalogs: true });
    const inline = capabilities['v0.9']?.inlineCatalogs?.[0];
    if (!inline) throw new Error('[line-genui] web_core returned no inline catalog.');
    return inline as InlineCatalog;
  } finally {
    processor.dispose();
  }
}

/**
 * Returns the client capabilities of a renderer of the `line` catalog, for `a2uiClientCapabilities`.
 *
 * Each advertised version, `v0.9` and `v0.9.1`, lists the `line` catalog id and inlines the projection of
 * `document` ({@link inlineCatalog}). With `basic: true` it also lists the A2UI basic catalog id
 * `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json`, without an inline catalog (§6.G.2 Versions;
 * §10 SD44, SD45).
 *
 * @param document The `line` catalog document, such as {@link lineCatalogDocument} returns.
 * @param options `basic` opts in to the basic catalog id.
 */
export function lineCapabilities(document: CatalogJson, options: LineCapabilitiesOptions = {}): LineCapabilities {
  const inline = inlineCatalog(document);
  const supportedCatalogIds = options.basic ? [inline.catalogId, BASIC_CATALOG_ID] : [inline.catalogId];
  const version = (): VersionCapabilities => ({
    supportedCatalogIds: [...supportedCatalogIds],
    inlineCatalogs: [structuredClone(inline)],
  });
  return { 'v0.9': version(), 'v0.9.1': version() };
}
