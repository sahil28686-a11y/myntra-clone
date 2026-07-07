const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Take local screenshot - use domcontentloaded to avoid hanging on API calls
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/reference/local-current.png', fullPage: true });
  console.log('Local screenshot saved');
  
  // Get page height
  const height = await page.evaluate(() => document.body.scrollHeight);
  console.log('Local page height:', height);
  
  await browser.close();
})();
