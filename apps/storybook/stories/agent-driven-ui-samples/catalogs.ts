import {
  BASIC_CATALOG_ID,
  type CatalogJson,
  descriptors,
  LINE_CATALOG_ID,
  type LineCapabilities,
  lineCapabilities,
  lineCatalogDocument,
} from '@websublime/line-genui/catalog';
import catalog from '@websublime/line-genui/catalog.json' with { type: 'json' };

// The `line` catalog document ships as `catalog.json`. `lineCatalogDocument` builds the same JSON at run time.
export const document: CatalogJson = lineCatalogDocument(descriptors);

// By default the capabilities list the `line` catalog id only, inlined, for `v0.9` and `v0.9.1`.
export const lineOnly: LineCapabilities = lineCapabilities(catalog);

// `basic: true` also lists the A2UI basic catalog id. The basic catalog is never inlined.
export const withBasic: LineCapabilities = lineCapabilities(catalog, { basic: true });

// The agent names a catalog in each `createSurface`. The session renders both ids whatever the capabilities list.
export const lineSurface = { version: 'v0.9.1', createSurface: { surfaceId: 'main', catalogId: LINE_CATALOG_ID } };
export const basicSurface = { version: 'v0.9.1', createSurface: { surfaceId: 'side', catalogId: BASIC_CATALOG_ID } };
