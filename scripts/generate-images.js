const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'images');

async function convert(file) {
  const base = path.basename(file, path.extname(file));
  const input = path.join(srcDir, file);
  const avifOut = path.join(srcDir, `${base}.avif`);
  const webpOut = path.join(srcDir, `${base}.webp`);

  try {
    await sharp(input)
      .resize({ width: 800 })
      .avif({ quality: 60 })
      .toFile(avifOut);
    console.log('Created', avifOut);
  } catch (e) {
    console.warn('Failed to create AVIF for', file, e.message);
  }
  try {
    await sharp(input)
      .resize({ width: 800 })
      .webp({ quality: 70 })
      .toFile(webpOut);
    console.log('Created', webpOut);
  } catch (e) {
    console.warn('Failed to create WebP for', file, e.message);
  }
}

(async function() {
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));
  for (const f of files) {
    await convert(f);
  }
})();
