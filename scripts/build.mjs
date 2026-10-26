import { cp, mkdir, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync } from 'node:zlib';
await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
const files = await readdir('src');
const assets = files.filter(file => /\.(js|css)$/.test(file));
const source = Object.fromEntries(await Promise.all(assets.map(async file => [file, await readFile('src/' + file, 'utf8')])));
// 整个模块集合共同生成指纹，依赖变化时导入方也会更新。
const hash = createHash('sha256').update(assets.map(file => file + source[file]).join('\n')).digest('hex').slice(0, 12);
const names = Object.fromEntries(assets.map(file => [file, file.replace(/\.(js|css)$/, `.${hash}.$1`)]));
function rewrite(text, inAsset = false) {
  for (const [file, name] of Object.entries(names)) text = text.replaceAll('./' + file, (inAsset ? './' : './assets/') + name);
  return text;
}
const sizes = [];
for (const file of assets) {
  const output = rewrite(source[file], true);
  await writeFile('dist/assets/' + names[file], output);
  sizes.push({ file: names[file], bytes: Buffer.byteLength(output), gzip: gzipSync(output).length, brotli: brotliCompressSync(output).length });
}
for (const file of files.filter(file => !assets.includes(file))) {
  if (file.endsWith('.html')) {
    const html = rewrite(await readFile('src/' + file, 'utf8'));
    await writeFile('dist/' + file, html);
    sizes.push({ file, bytes: Buffer.byteLength(html), gzip: gzipSync(html).length, brotli: brotliCompressSync(html).length });
  } else await cp('src/' + file, 'dist/' + file, { recursive: true });
}
const totals = sizes.reduce((a,b) => ({ bytes:a.bytes+b.bytes, gzip:a.gzip+b.gzip, brotli:a.brotli+b.brotli }), { bytes:0, gzip:0, brotli:0 });
console.table(sizes);
console.log(`Total HTML + CSS + JS: ${(totals.bytes/1024).toFixed(1)} KiB raw / ${(totals.gzip/1024).toFixed(1)} KiB gzip / ${(totals.brotli/1024).toFixed(1)} KiB Brotli`);
if (totals.gzip > 40 * 1024) throw new Error('超出 40 KiB gzip 体积预算');
