import { defineConfig } from 'vite';
import vituum from 'vituum';
import nunjucks from '@vituum/vite-plugin-nunjucks';
import postcss from '@vituum/vite-plugin-postcss';

import imageOptimizer from './packages/vite-plugin-image-optimizer';
import svgSprite from './packages/vite-plugin-svg-sprite';

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [
    svgSprite(),
    vituum(),
    nunjucks(),
    postcss(),
    imageOptimizer(),
  ],
});
