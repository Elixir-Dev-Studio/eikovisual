import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TARGETS = [
  { dir: 'public/assets/blog', maxWidth: 1200 },
  { dir: 'public/assets/projects', maxWidth: 1400 },
];

const CONTENT_DIRS = ['src/content/blog', 'src/content/projects'];
const CONVERTIBLE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp']);

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function toPublicUrl(filePath) {
  return '/' + path.relative('public', filePath).split(path.sep).join('/');
}

async function main() {
  const replacements = [];

  for (const { dir, maxWidth } of TARGETS) {
    const files = walkFiles(dir);
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (!CONVERTIBLE_EXTS.has(ext)) continue;

      const parsed = path.parse(filePath);
      const outPath = path.join(parsed.dir, `${parsed.name}.webp`);

      const beforeSize = fs.statSync(filePath).size;
      await sharp(filePath)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toFile(outPath);

      fs.unlinkSync(filePath);
      const afterSize = fs.statSync(outPath).size;

      const oldUrl = toPublicUrl(filePath);
      const newUrl = toPublicUrl(outPath);
      replacements.push({ oldUrl, newUrl });

      console.log(
        `Converted: ${oldUrl} (${(beforeSize / 1024).toFixed(1)} KB) -> ${newUrl} (${(afterSize / 1024).toFixed(1)} KB)`
      );
    }
  }

  if (replacements.length === 0) {
    console.log('All images in blog/projects are already optimized WebP.');
    return;
  }

  // Update references in all Markdown content files
  let updatedMdCount = 0;
  for (const contentDir of CONTENT_DIRS) {
    const mdFiles = walkFiles(contentDir).filter((f) => f.endsWith('.md'));
    for (const mdFile of mdFiles) {
      let content = fs.readFileSync(mdFile, 'utf8');
      let changed = false;

      for (const { oldUrl, newUrl } of replacements) {
        const encodedOldUrl = encodeURI(oldUrl);
        const encodedNewUrl = encodeURI(newUrl);

        if (content.includes(oldUrl)) {
          content = content.split(oldUrl).join(newUrl);
          changed = true;
        }
        if (encodedOldUrl !== oldUrl && content.includes(encodedOldUrl)) {
          content = content.split(encodedOldUrl).join(encodedNewUrl);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(mdFile, content, 'utf8');
        updatedMdCount++;
        console.log(`Updated references in: ${mdFile}`);
      }
    }
  }

  console.log(`Done: ${replacements.length} image(s) converted to WebP, ${updatedMdCount} markdown file(s) updated.`);
}

main().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
