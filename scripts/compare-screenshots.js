const { chromium } = require('playwright');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function compareImages(img1Path, img2Path) {
  try {
    const img1 = await loadImage(img1Path);
    const img2 = await loadImage(img2Path);
    
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
    
    return (diffPixels / totalPixels) * 100;
  } catch (e) {
    console.log('Comparison error:', e.message);
    return 100;
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setDefaultNavigationTimeout(30000);

  console.log('Visiting local build...');
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Local page height: ${pageHeight}px`);

  // Take full page screenshot
  await page.screenshot({ path: 'docs/reference/local-build-v2.png', fullPage: true });
  console.log('Local screenshot saved');

  // Compare with baseline
  const mismatch = await compareImages(
    'docs/reference/myntra-baseline.png',
    'docs/reference/local-build-v2.png'
  );
  console.log(`\nMismatch: ${mismatch.toFixed(2)}%`);

  // Create comparison image
  const baseline = await loadImage('docs/reference/myntra-baseline.png');
  const local = await loadImage('docs/reference/local-build-v2.png');
  
  const maxH = Math.max(baseline.height, local.height);
  const canvas = createCanvas(1440 * 2, maxH);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(baseline, 0, 0);
  ctx.drawImage(local, 1440, 0);
  
  // Add labels
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, 200, 30);
  ctx.fillRect(1440, 0, 200, 30);
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText('Myntra (baseline)', 10, 22);
  ctx.fillText('Local build', 1450, 22);
  
  // Add mismatch percentage
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(1440/2 - 100, maxH - 40, 200, 30);
  ctx.fillStyle = mismatch < 5 ? '#4CAF50' : '#FF5722';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`Mismatch: ${mismatch.toFixed(2)}%`, 1440/2 - 80, maxH - 18);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('docs/reference/comparison-homepage-v2.png', buffer);
  console.log('Comparison image saved to docs/reference/comparison-homepage-v2.png');

  await browser.close();
  console.log('\nDone!');
})();
