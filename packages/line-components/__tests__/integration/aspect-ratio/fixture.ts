// Loads the built `./aspect-ratio` subpath by package name, as a consumer does (spec §7.8 rule 2), with every
// component a Browser case mounts (`./center`, `./kbd`, `./stack`, `./grid`) and the `aspects`, `sizing` and
// `layouts` tokens the box and the Stack and Grid cases read (spec 0021-aspect-ratio.md D16).
import '@websublime/line-components/aspect-ratio';
import '@websublime/line-components/center';
import '@websublime/line-components/kbd';
import '@websublime/line-components/stack';
import '@websublime/line-components/grid';
import '@websublime/line-tokens/aspects';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/layouts';
