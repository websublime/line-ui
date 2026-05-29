import cssnano from 'cssnano';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';

// Plugin chain order is fixed (§6.C.6):
//   import → nested → preset-env → cssnano
// `custom-properties: false` is MANDATORY — without it preset-env inlines
// `--line-*` references and breaks the role-mapping cascade.
export default {
  plugins: [
    postcssImport(),
    postcssNested(),
    postcssPresetEnv({
      stage: 2,
      features: {
        'custom-properties': false,
      },
      // Modern browser targets — keep modern features, drop polyfills
      browsers: 'last 2 chrome versions, last 2 firefox versions, last 2 safari versions',
    }),
    cssnano({ preset: ['default', { discardComments: { removeAll: true } }] }),
  ],
};
