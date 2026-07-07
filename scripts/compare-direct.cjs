const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function compareImages(img1Path, img2Path) {
  console.log('Loading images...');
  const img1 = await loadImage(img1Path);
  const img2 = await loadImage(img2Path);
  
  console.log(`Image 1: ${img1.width}x${img1.height}`);
  console.log(`Image 2: ${img2.width}x${img2.height}`);
  
  const w = Math.max(img1.width, img2.width);
  const h = Math.max(img1.height, img2.height);
  
  const canvas1 = createCanvas(w, h);
  const ctx1 = canvas1.getContext('2d');
  ctx1.drawImage(img1, 0, 0);
  const data1 = ctx1.getImageData(0, 0, w, h).data;
  
  const canvas2 = createCanvas(w, h);
  const ctx2 = canvas2.getContext('2d');
  ctx2.drawImage(img2, 0, 0);
  const data2 = ctx2.getImageData(0, 0, w, h).data;
  
  let diffPixels = 0;
  let totalPixels = w * h;
  
  for (let i = 0; i < data1.length; i += 4) {
    const r1 = data1[i], g1 = data1[i+1], b1 = data1[i+2];
    const r2 = data2[i], g2 = data2[i+1], b2 = data2[i+2];
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    if (diff > 30) diffPixels++;
  }
  
  const mismatchPct = (diffPixels / totalPixels * 100).toFixed(2);
  console.log(`\n=== COMPARISON RESULT ===`);
  console.log(`Total pixels: ${totalPixels}`);
  console.log(`Different pixels: ${diffPixels}`);
  console.log(`Mismatch: ${mismatchPct}%`);
  
  // Create diff image
  const diffCanvas = createCanvas(w, h);
  const diffCtx = diffCanvas.getContext('2d');
  diffCtx.drawImage(img1, 0, 0);
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r1 = data1[i], g1 = data1[i+1], b1 = data1[i+2];
      const r2 = data2[i], g2 = data2[i+1], b2 = data2[i+2];
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      if (diff > 30) {
        diffCtx.fillStyle = 'red';
        diffCtx.fillRect(x, y, 1, 1);
      }
    }
  }
  
  const diffBuffer = diffCanvas.toBuffer('image/png');
  fs.writeFileSync('docs/reference/diff-output.png', diffBuffer);
  console.log('Diff image saved to docs/reference/diff-output.png');
  
  return parseFloat(mismatchPct);
}

(async () => {
  const mismatch = await compareImages(
    'docs/reference/myntra-baseline.png',
    'docs/reference/local-current.png'
  );
  console.log(`\nFinal mismatch: ${mismatch}%`);
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
