import cssNano from 'cssnano';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';

export default {
  plugins: [postcssImport(), postcssNested(), cssNano({ preset: 'default' })]
};
