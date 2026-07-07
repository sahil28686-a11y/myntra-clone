const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const fs = require('fs');

  // Set a longer timeout
  page.setDefaultTimeout(60000);

  try {
    // Visit Myntra homepage first
    console.log('Navigating to Myntra homepage...');
    await page.goto('https://www.myntra.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('Homepage loaded');

    // Navigate to men-tshirts
    console.log('Navigating to men-tshirts...');
    await page.goto('https://www.myntra.com/men-tshirts', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log('PLP page loaded');

    // Take full-page screenshot
    await page.screenshot({ path: 'docs/reference/myntra-plp-baseline.png', fullPage: true });
    console.log('Screenshot saved');

    // Extract full HTML
    const html = await page.content();
    fs.writeFileSync('docs/reference/myntra-plp.html', html);
    console.log('HTML saved, length:', html.length);

    // Extract page structure
    const structure = await page.evaluate(() => {
      // Get all major sections
      const sections = [];
      document.querySelectorAll('body > *').forEach(el => {
        const tag = el.tagName;
        const id = el.id || '';
        const cls = el.className || '';
        const text = el.textContent?.trim()?.substring(0, 80) || '';
        if (tag !== 'SCRIPT' && tag !== 'STYLE') {
          sections.push({ tag, id: id.substring(0, 50), class: cls.substring(0, 80), text: text.substring(0, 60) });
        }
      });
      return sections;
    });
    console.log('Page structure:');
    structure.forEach(s => console.log(`  ${s.tag} id="${s.id}" class="${s.class}" text="${s.text}"`));

    // Extract filter sidebar
    const filters = await page.evaluate(() => {
      const filterEls = document.querySelectorAll('[class*="filter"], [class*="facet"], [class*="side"]');
      const result = [];
      filterEls.forEach(f => {
        const text = f.textContent?.trim()?.substring(0, 200) || '';
        if (text.length > 10) {
          result.push({
            class: f.className?.substring(0, 100),
            text: text.substring(0, 300),
            html: f.innerHTML?.substring(0, 800)
          });
        }
      });
      return result;
    });
    console.log('\nFilter sections:', filters.length);
    filters.forEach((f, i) => {
      console.log(`\n--- Filter ${i+1} ---`);
      console.log('Class:', f.class);
      console.log('Text:', f.text.substring(0, 200));
    });

    // Extract product grid
    const products = await page.evaluate(() => {
      const productEls = document.querySelectorAll('[class*="product"], [class*="item"], [class*="card"]');
      const result = [];
      productEls.forEach((p, i) => {
        if (i < 10) {
          const img = p.querySelector('img');
          const links = p.querySelectorAll('a');
          result.push({
            class: p.className?.substring(0, 100),
            imgSrc: img?.src?.substring(0, 100) || '',
            links: Array.from(links).slice(0, 2).map(l => ({ href: l.href?.substring(0, 80), text: l.textContent?.trim()?.substring(0, 50) })),
            text: p.textContent?.trim()?.substring(0, 200) || ''
          });
        }
      });
      return result;
    });
    console.log('\nProducts found:', products.length);
    products.forEach((p, i) => {
      console.log(`\n--- Product ${i+1} ---`);
      console.log('Class:', p.class);
      console.log('Text:', p.text.substring(0, 150));
    });

    // Extract sort bar
    const sortBar = await page.evaluate(() => {
      const sortEls = document.querySelectorAll('[class*="sort"], [class*="filter-bar"], [class*="top-bar"]');
      return Array.from(sortEls).map(el => ({
        class: el.className?.substring(0, 100),
        text: el.textContent?.trim()?.substring(0, 300) || '',
        html: el.innerHTML?.substring(0, 1000)
      }));
    });
    console.log('\nSort bars:', sortBar.length);
    sortBar.forEach((s, i) => {
      console.log(`\n--- Sort ${i+1} ---`);
      console.log('Class:', s.class);
      console.log('Text:', s.text.substring(0, 200));
    });

    // Extract page dimensions
    const dims = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      scrollHeight: document.body.scrollHeight,
      filterWidth: document.querySelector('[class*="filter"]')?.offsetWidth || 0,
      productWidth: document.querySelector('[class*="product"]')?.offsetWidth || 0,
    }));
    console.log('\nPage dimensions:', JSON.stringify(dims));

  } catch (err) {
    console.error('Error:', err.message);
    // Take screenshot even on error
    await page.screenshot({ path: 'docs/reference/myntra-plp-error.png', fullPage: true }).catch(() => {});
  }

  await browser.close();
  console.log('\nDone');
})();
