const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  page.setDefaultNavigationTimeout(90000);

  console.log('Visiting Myntra...');
  await page.goto('https://www.myntra.com/', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(5000);

  // Get full page height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Full page height: ${pageHeight}px`);

  // Extract all major sections between header and footer
  const sections = await page.evaluate(() => {
    const results = [];
    // Get all major div/section elements that are direct children of body or main content
    const mainContent = document.querySelector('#desktop-header-cnt')?.parentElement || document.body;
    
    // Find all section-like elements
    const allElements = document.querySelectorAll('section, div[class*="banner"], div[class*="carousel"], div[class*="grid"], div[class*="category"], div[class*="brand"], div[class*="deal"], div[class*="offer"], div[class*="product"], div[class*="row"], div[class*="strip"], div[class*="imageGrid"]');
    
    const seen = new Set();
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 50) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className?.toString().slice(0, 100) || '';
        const id = el.id || '';
        const key = `${tag}.${cls}.${id}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            tag,
            class: cls.slice(0, 80),
            id,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top + window.scrollY),
            text: (el.textContent || '').trim().slice(0, 120)
          });
        }
      }
    });
    return results;
  });

  console.log(`\nFound ${sections.length} sections:`);
  sections.forEach((s, i) => {
    console.log(`\n[${i}] ${s.tag}${s.id ? '#'+s.id : ''} | class: ${s.class.slice(0,60)}`);
    console.log(`    Size: ${s.width}x${s.height}px | Top: ${s.top}px`);
    console.log(`    Text: ${s.text.slice(0, 100)}`);
  });

  // Take a full page screenshot
  await page.screenshot({ path: 'docs/reference/myntra-fullpage.png', fullPage: true });
  console.log('\nScreenshot saved to docs/reference/myntra-fullpage.png');

  // Extract the main content HTML structure (just the section outlines)
  const structure = await page.evaluate(() => {
    // Get all direct children of the main container that are visible sections
    const container = document.querySelector('#desktop-header-cnt')?.parentElement || document.body;
    const children = container.children;
    const result = [];
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 20) {
        result.push({
          index: i,
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          class: (el.className || '').toString().slice(0, 80),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top + window.scrollY),
          text: (el.textContent || '').trim().slice(0, 150).replace(/\s+/g, ' ')
        });
      }
    }
    return result;
  });

  console.log('\n\n=== MAIN CONTENT STRUCTURE ===');
  structure.forEach((s, i) => {
    console.log(`\n[${i}] <${s.tag}>${s.id ? ' #'+s.id : ''} ${s.class ? '.'+s.class : ''}`);
    console.log(`    Size: ${s.width}x${s.height}px | Top: ${s.top}px`);
    console.log(`    ${s.text}`);
  });

  // Save structure to file
  fs.writeFileSync('docs/reference/myntra-structure.json', JSON.stringify({ pageHeight, sections, structure }, null, 2));
  console.log('\nStructure saved to docs/reference/myntra-structure.json');

  await browser.close();
  console.log('\nDone!');
})();
