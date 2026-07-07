const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-http2'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);

  console.log('Visiting Myntra...');
  
  // Try with 'load' event first
  try {
    await page.goto('https://www.myntra.com/', { waitUntil: 'load', timeout: 120000 });
  } catch (e) {
    console.log('First attempt failed:', e.message);
    console.log('Retrying with domcontentloaded...');
    try {
      await page.goto('https://www.myntra.com/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    } catch (e2) {
      console.log('Second attempt failed:', e2.message);
      console.log('Trying with networkidle0...');
      await page.goto('https://www.myntra.com/', { waitUntil: 'networkidle0', timeout: 120000 });
    }
  }
  
  await page.waitForTimeout(5000);
  
  console.log('Page loaded successfully!');
  console.log('Title:', await page.title());
  
  // Get full page height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Full page height: ${pageHeight}px`);

  // Extract all major sections
  const sections = await page.evaluate(() => {
    const results = [];
    // Get all direct children of body that are visible
    const bodyChildren = document.body.children;
    for (let i = 0; i < bodyChildren.length; i++) {
      const el = bodyChildren[i];
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 20) {
        results.push({
          index: i,
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          class: (el.className || '').toString().slice(0, 100),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top + window.scrollY),
          text: (el.textContent || '').trim().slice(0, 150).replace(/\s+/g, ' ')
        });
      }
    }
    return results;
  });

  console.log('\n=== BODY CHILDREN ===');
  sections.forEach((s, i) => {
    console.log(`\n[${i}] <${s.tag}>${s.id ? ' #'+s.id : ''} ${s.class ? '.'+s.class.slice(0,60) : ''}`);
    console.log(`    Size: ${s.width}x${s.height}px | Top: ${s.top}px`);
    console.log(`    ${s.text.slice(0, 120)}`);
  });

  // Now scroll through the page and capture sections
  console.log('\n\n=== SCROLLING THROUGH PAGE ===');
  
  // Get all visible sections with class names
  const allSections = await page.evaluate(() => {
    const results = [];
    // Find all major content containers
    const selectors = [
      'div[class*="banner"]', 'div[class*="carousel"]', 'div[class*="grid"]', 
      'div[class*="category"]', 'div[class*="brand"]', 'div[class*="deal"]',
      'div[class*="offer"]', 'div[class*="product"]', 'div[class*="row"]',
      'div[class*="strip"]', 'div[class*="imageGrid"]', 'div[class*="section"]',
      'div[class*="container"]', 'div[class*="wrapper"]', 'div[class*="content"]',
      'section', 'div[data-reactroot]'
    ];
    
    const seen = new Set();
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 30) {
          const cls = (el.className || '').toString().slice(0, 80);
          const key = cls || el.tagName + (el.id || '');
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              tag: el.tagName.toLowerCase(),
              class: cls,
              id: el.id || '',
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              top: Math.round(rect.top + window.scrollY),
              text: (el.textContent || '').trim().slice(0, 100).replace(/\s+/g, ' ')
            });
          }
        }
      });
    });
    return results;
  });

  console.log(`\nFound ${allSections.length} unique sections:`);
  allSections.sort((a, b) => a.top - b.top).forEach((s, i) => {
    console.log(`\n[${i}] <${s.tag}> ${s.class ? '.'+s.class.slice(0,60) : ''}${s.id ? ' #'+s.id : ''}`);
    console.log(`    Size: ${s.width}x${s.height}px | Top: ${s.top}px`);
    console.log(`    ${s.text.slice(0, 100)}`);
  });

  // Take a full page screenshot
  await page.screenshot({ path: 'docs/reference/myntra-fullpage.png', fullPage: true });
  console.log('\nScreenshot saved to docs/reference/myntra-fullpage.png');

  // Save structure to file
  fs.writeFileSync('docs/reference/myntra-structure.json', JSON.stringify({ pageHeight, sections, allSections }, null, 2));
  console.log('Structure saved to docs/reference/myntra-structure.json');

  await browser.close();
  console.log('\nDone!');
})();
