const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Take fresh Myntra screenshot at 1440px width
  console.log('Visiting Myntra...');
  await page.goto('https://www.myntra.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/reference/myntra-baseline-1440.png', fullPage: true });
  const myntraHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Myntra page height:', myntraHeight);
  
  await browser.close();
})();
