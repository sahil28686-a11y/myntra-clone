const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1440,900'
    ]
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1440, height: 900 });
  await page.setDefaultNavigationTimeout(60000);

  console.log('Visiting Myntra...');
  
  try {
    await page.goto('https://www.myntra.com/', { waitUntil: 'networkidle0', timeout: 60000 });
    console.log('Page loaded!');
  } catch (e) {
    console.log('networkidle0 failed:', e.message);
    try {
      await page.goto('https://www.myntra.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('Page loaded with domcontentloaded!');
    } catch (e2) {
      console.log('domcontentloaded failed:', e2.message);
      await page.goto('https://www.myntra.com/', { waitUntil: 'load', timeout: 60000 });
      console.log('Page loaded with load!');
    }
  }
  
  await page.waitForTimeout(3000);
  
  console.log('Title:', await page.title());
  
  // Get full page height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Full page height: ${pageHeight}px`);

  // Extract all major sections
  const sections = await page.evaluate(() => {
    const results = [];
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

  // Get all content sections
  const contentSections = await page.evaluate(() => {
    const results = [];
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

  console.log(`\n\nFound ${contentSections.length} content sections:`);
  contentSections.sort((a, b) => a.top - b.top).forEach((s, i) => {
    console.log(`\n[${i}] <${s.tag}> ${s.class ? '.'+s.class.slice(0,60) : ''}${s.id ? ' #'+s.id : ''}`);
    console.log(`    Size: ${s.width}x${s.height}px | Top: ${s.top}px`);
    console.log(`    ${s.text.slice(0, 100)}`);
  });

  // Take a full page screenshot
  await page.screenshot({ path: 'docs/reference/myntra-fullpage.png', fullPage: true });
  console.log('\nScreenshot saved to docs/reference/myntra-fullpage.png');

  // Save structure
  fs.writeFileSync('docs/reference/myntra-structure.json', JSON.stringify({ pageHeight, sections, contentSections }, null, 2));
  console.log('Structure saved to docs/reference/myntra-structure.json');

  await browser.close();
  console.log('\nDone!');
})();
