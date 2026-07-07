const { chromium, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOCAL_URL = 'http://localhost:3000';
const MYNTRA_URL = 'https://www.myntra.com/';
const REFERENCE_DIR = path.join(__dirname, '..', 'docs', 'reference');

async function captureScreenshot(page, url, filename, waitUntil = 'networkidle', timeout = 30000) {
  try {
    await page.goto(url, { waitUntil, timeout });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(REFERENCE_DIR, filename), fullPage: true });
    console.log(`  ✓ Captured ${filename}`);
    return true;
  } catch (err) {
    console.log(`  ✗ Failed to capture ${filename}: ${err.message}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(REFERENCE_DIR)) {
    fs.mkdirSync(REFERENCE_DIR, { recursive: true });
  }

  // Try Chromium first, fall back to Firefox
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-http2',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
  } catch (e) {
    console.log('Chromium failed, trying Firefox...');
    browser = await firefox.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    ignoreHTTPSErrors: true
  });

  try {
    // Step 1: Capture Myntra.com baseline
    console.log('\n=== Capturing Myntra.com baseline ===');
    const myntraPage = await context.newPage();
    
    let captured = await captureScreenshot(myntraPage, MYNTRA_URL, 'myntra-baseline.png', 'domcontentloaded', 30000);
    
    if (!captured) {
      console.log('  Retrying with load event...');
      captured = await captureScreenshot(myntraPage, MYNTRA_URL, 'myntra-baseline.png', 'load', 45000);
    }
    
    if (!captured) {
      console.log('  Retrying with commit (no wait)...');
      captured = await captureScreenshot(myntraPage, MYNTRA_URL, 'myntra-baseline.png', 'commit', 30000);
    }
    
    await myntraPage.close();

    // Step 2: Capture local build
    console.log('\n=== Capturing local build ===');
    const localPage = await context.newPage();
    await captureScreenshot(localPage, LOCAL_URL, 'local-build.png', 'domcontentloaded', 15000);
    await localPage.close();

    console.log('\n=== Screenshots captured ===');
    console.log(`Baseline: ${path.join(REFERENCE_DIR, 'myntra-baseline.png')} (${captured ? 'OK' : 'FAILED'})`);
    console.log(`Local:    ${path.join(REFERENCE_DIR, 'local-build.png')}`);
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
