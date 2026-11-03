# A2UI v0.9.1 schema fixtures

The five JSON files in this folder are verbatim copies of the A2UI v0.9.1 schemas, taken once from
[`a2ui-project/a2ui`](https://github.com/a2ui-project/a2ui) at commit `cbaa5ee62c737b50d0695c1e5794d0f648b61dca`,
the commit the R2 spike fetched (`docs/research/assets/01-r2/spike/scripts/fetch-spec.ts`; Phase 1 spec §6.G.2).
Do not edit or reformat them; `biome.json` excludes this folder (Phase 00 spec AM-085).

| File | Upstream path |
| --- | --- |
| `client_capabilities.json` | `specification/v0_9_1/json/client_capabilities.json` |
| `client_to_server.json` | `specification/v0_9_1/json/client_to_server.json` |
| `common_types.json` | `specification/v0_9_1/json/common_types.json` |
| `server_to_client.json` | `specification/v0_9_1/json/server_to_client.json` |
| `basic_catalog.json` | `specification/v0_9_1/catalogs/basic/catalog.json`, renamed to the spike's name |

Each file was downloaded from
`https://raw.githubusercontent.com/a2ui-project/a2ui/cbaa5ee62c737b50d0695c1e5794d0f648b61dca/<upstream path>`.
