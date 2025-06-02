import Sprite from 'svg-sprite';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  mode: {
    symbol: {
      dest: 'src/assets',
      sprite: 'sprite.svg',
    },
    bust: false,
  },
  shape: {
    id: {
      generator: 'icon-%s',
    },
    transform: [
      {
        svgo: {
          plugins: [
            { name: 'removeTitle', active: true },
            { name: 'removeDesc', active: true },
            { name: 'removeUselessDefs', active: true },
            { name: 'removeDimensions', active: true },
            { name: 'convertColors', params: { currentColor: true } },
            { name: 'cleanupAttrs', active: true },
            { name: 'mergePaths', active: true },
          ],
        },
      },
    ],
  },
  svg: {
    xmlDeclaration: false,
    doctypeDeclaration: false,
  },
};

export default function svgSprite() {
  return {
    name: 'svg-sprite-prebuild',
    async buildStart() {
      const spriter = new Sprite(config);
      const ICONS_DIR = resolve(process.cwd(), 'src/assets/icons');
      for (const file of readdirSync(ICONS_DIR)) {
        if (file.endsWith('.svg')) {
          const filePath = resolve(ICONS_DIR, file);
          const content = readFileSync(filePath, 'utf-8');
          spriter.add(filePath, null, content);
        }
      }
      await new Promise((resolvePromise, reject) => {
        spriter.compile((error, result) => {
          if (error) {
            console.error('[svg-sprite] Sprite generation failed:', error);
            reject(error);
            return;
          }
          for (const mode in result) {
            for (const resource in result[mode]) {
              const { path: outPath, contents } = result[mode][resource];
              mkdirSync(dirname(outPath), { recursive: true });
              writeFileSync(outPath, contents);
              console.log('[svg-sprite] Generated:', outPath);
            }
          }
          resolvePromise();
        });
      });
    },
  };
}