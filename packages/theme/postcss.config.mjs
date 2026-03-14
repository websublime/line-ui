import cssNano from 'cssnano';
import customMedia from 'postcss-custom-media';
import postcssImport from 'postcss-import';
import postcssMixins from 'postcss-mixins';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';
import postcssSimpleVars from 'postcss-simple-vars';

// TODO(line-ui-c5q.1): Add postcss-jit-props plugin here for Open Props utility token
// injection with --line-* prefix rewrite. The dependency is already installed; it needs
// to be activated in this pipeline. See PRD 9.3 and Decision T3.
//
// NOTE: This plugin chain is duplicated in src/build.ts:createProcessor().
// If you add/remove/reconfigure a plugin here, update build.ts to match.
export default {
  plugins: [
    postcssImport(),
    postcssMixins(),
    postcssSimpleVars(),
    postcssNested(),
    postcssPresetEnv({
      autoprefixer: false,
      features: {
        'color-functional-notation': false,
        'custom-media-queries': { preserve: true },
        'custom-properties': false,
        'double-position-gradients': false,
        'focus-visible-pseudo-class': false,
        'focus-within-pseudo-class': false,
        'gap-properties': false,
        'logical-properties-and-values': false,
        'not-pseudo-class': false,
        'place-properties': false,
        'prefers-color-scheme-query': false
      },
      stage: 0
    }),
    customMedia(),
    cssNano({
      preset: 'default'
    })
  ]
};
