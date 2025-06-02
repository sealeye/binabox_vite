import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

const formats = ['webp', 'avif'];

async function addDimensionsToImages(html, assetDir) {
  // Match <img ...> and <source ...>
  const tagRegex = /<(img|source)\b[^>]*?>/gi;

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    result += html.slice(lastIndex, match.index);

    const tag = match[0];
    const tagName = match[1];

    // Match src or srcset with optional query params
    const srcMatch = tag.match(
      /\s(src|srcset)=["']([^"']+\.(png|jpe?g|webp|avif)(\?[^"']*)?)["']/i,
    );
    if (!srcMatch) {
      result += tag;
      lastIndex = match.index + tag.length;
      continue;
    }
    const src = srcMatch[2];

    // Remove query params for file lookup
    const fileName = src
      .split('?')[0]
      .replace(/^\/?src\/assets\//, '')
      .replace(/^\/?assets\//, '');
    const filePath = path.join(assetDir, fileName);

    let newTag = tag;
    if (fs.existsSync(filePath)) {
      try {
        const meta = await sharp(filePath).metadata();
        if (!/\bheight\s*=/.test(tag)) {
          newTag = newTag.replace(
            `<${tagName}`,
            `<${tagName} height="${meta.height}"`,
          );
        }
        if (!/\bwidth\s*=/.test(tag)) {
          newTag = newTag.replace(
            `<${tagName}`,
            `<${tagName} width="${meta.width}"`,
          );
        }
      } catch {
        // ignore errors
      }
    }
    result += newTag;
    lastIndex = match.index + tag.length;
  }
  result += html.slice(lastIndex);
  return result;
}

function collectNeededImages(htmlDir) {
  const needed = {};
  const htmlFiles = fs.readdirSync(htmlDir).filter((f) => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(htmlDir, file), 'utf-8');
    const regex =
      /src(?:set)?=["']\/assets\/([^"']+\.(png|jpe?g|webp|avif))(?:\?format=(webp|avif))?/gi;
    let match;
    while ((match = regex.exec(html))) {
      // Remove hash from base name
      const base = match[1].replace(
        /-[A-Za-z0-9]{8,}(?=\.(png|jpe?g|webp|avif)$)/,
        '',
      );
      const ext = match[2];
      const format = match[3];
      if (!needed[base]) needed[base] = new Set();
      if (format) {
        needed[base].add(format);
      } else {
        needed[base].add(ext);
      }
    }
  }
  return needed;
}

function collectNeededImagesFromCSS(assetDir) {
  const needed = {};
  const cssFiles = fs.readdirSync(assetDir).filter((f) => f.endsWith('.css'));
  for (const file of cssFiles) {
    const css = fs.readFileSync(path.join(assetDir, file), 'utf-8');
    const regex =
      /url\(["']?(\/assets\/([^"')]+\.(png|jpe?g|webp|avif)))(?:\?format=(webp|avif))?["']?\)/gi;
    let match;
    while ((match = regex.exec(css))) {
      const base = match[2].replace(
        /-[A-Za-z0-9]{8,}(?=\.(png|jpe?g|webp|avif)$)/,
        '',
      );
      const ext = match[3];
      const format = match[4];
      if (!needed[base]) needed[base] = new Set();
      if (format) {
        needed[base].add(format);
      } else {
        needed[base].add(ext);
      }
    }
  }
  return needed;
}

function findHashedAsset(assetDir, baseName) {
  const walk = (dir) => {
    for (const file of fs.readdirSync(dir)) {
      const abs = path.join(dir, file);
      if (fs.statSync(abs).isDirectory()) {
        const found = walk(abs);
        if (found) return found;
      } else {
        if (
          file.replace(/-[A-Za-z0-9]{8,}(?=\.(png|jpe?g|webp|avif)$)/, '') ===
          baseName
        ) {
          return path.relative(assetDir, abs);
        }
      }
    }
    return null;
  };
  return walk(assetDir);
}

export default function imageOptimizer(options = { dimensions: true }) {
  return {
    name: 'html-image-build-optimizer',
    async transformIndexHtml(html) {
      const assetDir = 'src/assets';
      return await addDimensionsToImages(html, assetDir);
    },
    async closeBundle() {
      const outDir = 'dist';
      const assetDir = path.join(outDir, 'assets');
      if (!fs.existsSync(assetDir)) {
        console.log('[image-optimizer] No assets directory found.');
        return;
      }

      // 1. Parse HTML and build needed map
      const needed = collectNeededImages(outDir);

      // 2. Parse CSS and merge needed images
      const cssNeeded = collectNeededImagesFromCSS(assetDir);
      for (const [base, set] of Object.entries(cssNeeded)) {
        if (!needed[base]) needed[base] = set;
        else for (const fmt of set) needed[base].add(fmt);
      }
      console.log('[image-optimizer] Needed images and formats:', needed);

      // 3. Optimize and convert only needed files
      for (const [base, formatSet] of Object.entries(needed)) {
        const hashed = findHashedAsset(assetDir, base);
        if (!hashed) {
          console.log(`[image-optimizer] Asset not found for: ${base}`);
          continue;
        }
        const filePath = path.join(assetDir, hashed);
        const ext = path.extname(filePath).toLowerCase().slice(1);

        // Optimize original only if needed
        if (formatSet.has(ext)) {
          const origSize = fs.statSync(filePath).size;
          const tmpPath = path.join(
            os.tmpdir(),
            `opt-${path.basename(hashed)}`,
          );
          if (ext === 'png') {
            await sharp(filePath)
              .png({ compressionLevel: 9, adaptiveFiltering: true })
              .toFile(tmpPath);
          } else if (ext === 'jpg' || ext === 'jpeg') {
            await sharp(filePath)
              .jpeg({ quality: 80, mozjpeg: true })
              .toFile(tmpPath);
          } else if (ext === 'webp') {
            await sharp(filePath).webp({ quality: 80 }).toFile(tmpPath);
          } else if (ext === 'avif') {
            await sharp(filePath).avif({ quality: 50 }).toFile(tmpPath);
          }
          fs.copyFileSync(tmpPath, filePath);
          fs.unlinkSync(tmpPath);
          const optimizedSize = fs.statSync(filePath).size;
          console.log(
            `[image-optimizer] Optimized ${path.basename(filePath)}: ` +
              `${(origSize / 1024).toFixed(1)} KB → ${(optimizedSize / 1024).toFixed(1)} KB`,
          );
        }

        // Convert to requested formats
        for (const format of formatSet) {
          if (!formats.includes(format)) continue;
          const outPath = filePath.replace(
            /\.(png|jpe?g|webp|avif)$/i,
            `.${format}`,
          );
          await sharp(filePath)[format]().toFile(outPath);
          const outSize = fs.statSync(outPath).size;
          console.log(
            `[image-optimizer] Converted to ${format}: ${path.basename(outPath)} ` +
              `${(fs.statSync(filePath).size / 1024).toFixed(1)} KB → ${(outSize / 1024).toFixed(1)} KB`,
          );
        }

        // Remove original if not needed
        if (!formatSet.has(ext)) {
          fs.unlinkSync(filePath);
          console.log(`[image-optimizer] Removed original: ${filePath}`);
        }
      }

      // 4. Update HTML as before
      const htmlFiles = fs
        .readdirSync(outDir)
        .filter((f) => f.endsWith('.html'));
      for (const file of htmlFiles) {
        const filePath = path.join(outDir, file);
        let html = fs.readFileSync(filePath, 'utf-8');
        html = html.replace(
          /((src|srcset)=["'])([^"']+\.(png|jpe?g|webp|avif))(\?format=(webp|avif))(["'])/gi,
          (match, prefix, attr, url, ext, query, format, suffix) => {
            const newUrl = url.replace(
              /\.(png|jpe?g|webp|avif)$/i,
              `.${format}`,
            );
            return `${prefix}${newUrl}${suffix}`;
          },
        );
        html = html.replace(
          /((src|srcset)=["'])([^"']+\.(png|jpe?g|webp|avif))(\?optimize)(["'])/gi,
          (match, prefix, attr, url, ext, query, suffix) => {
            return `${prefix}${url}${suffix}`;
          },
        );
        if (options.dimensions) {
          html = await addDimensionsToImages(html, assetDir);
        }
        fs.writeFileSync(filePath, html, 'utf-8');
        console.log(`[image-optimizer] Updated HTML: ${filePath}`);
      }

      // 5. Update CSS: replace ?format=webp|avif with correct extension
      const cssFiles = fs
        .readdirSync(assetDir)
        .filter((f) => f.endsWith('.css'));
      for (const file of cssFiles) {
        const filePath = path.join(assetDir, file);
        let css = fs.readFileSync(filePath, 'utf-8');
        css = css.replace(
          /url\((["']?)(\/assets\/[^"')]+\.(png|jpe?g|webp|avif))\?format=(webp|avif)\1\)/gi,
          (match, quote, url, ext, format) =>
            `url(${quote}${url.replace(/\.(png|jpe?g|webp|avif)$/i, `.${format}`)}${quote})`,
        );
        fs.writeFileSync(filePath, css, 'utf-8');
        console.log(`[image-optimizer] Updated CSS: ${filePath}`);
      }

      console.log('[image-optimizer] Done.');
    },
  };
}
