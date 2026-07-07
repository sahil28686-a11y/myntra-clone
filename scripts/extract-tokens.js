const { chromium } = require('playwright');

async function extractMyntraDesignTokens() {
  const browser = await chromium.launch({ 
    headless: true,
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  
  const page = await browser.newPage({ 
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    await page.goto('https://www.myntra.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Extract header styles
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('.desktop-bound') || document.querySelector('header');
      if (!header) return { error: 'header not found' };
      
      const styles = window.getComputedStyle(header);
      return {
        height: styles.height,
        backgroundColor: styles.backgroundColor,
        borderBottom: styles.borderBottom,
        position: styles.position,
        zIndex: styles.zIndex,
      };
    });
    console.log('Header:', JSON.stringify(headerInfo, null, 2));

    // Extract nav link styles
    const navLinkInfo = await page.evaluate(() => {
      const links = document.querySelectorAll('.desktop-categoryLink');
      if (links.length === 0) return { error: 'nav links not found' };
      const styles = window.getComputedStyle(links[0]);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        letterSpacing: styles.letterSpacing,
        color: styles.color,
        textTransform: styles.textTransform,
        padding: styles.padding,
        fontFamily: styles.fontFamily,
      };
    });
    console.log('Nav Link:', JSON.stringify(navLinkInfo, null, 2));

    // Extract search bar styles
    const searchInfo = await page.evaluate(() => {
      const search = document.querySelector('.desktop-searchBar');
      if (!search) return { error: 'search not found' };
      const styles = window.getComputedStyle(search);
      return {
        height: styles.height,
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        fontSize: styles.fontSize,
        color: styles.color,
        width: styles.width,
      };
    });
    console.log('Search:', JSON.stringify(searchInfo, null, 2));

    // Extract logo info
    const logoInfo = await page.evaluate(() => {
      const logo = document.querySelector('.desktop-logo');
      if (!logo) return { error: 'logo not found' };
      const styles = window.getComputedStyle(logo);
      return {
        width: styles.width,
        height: styles.height,
        backgroundImage: styles.backgroundImage,
        backgroundPosition: styles.backgroundPosition,
        backgroundSize: styles.backgroundSize,
      };
    });
    console.log('Logo:', JSON.stringify(logoInfo, null, 2));

    // Extract user icon styles
    const userIconInfo = await page.evaluate(() => {
      const icons = document.querySelectorAll('.desktop-userActions');
      if (icons.length === 0) return { error: 'user actions not found' };
      const styles = window.getComputedStyle(icons[0]);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection,
        alignItems: styles.alignItems,
        fontSize: styles.fontSize,
        color: styles.color,
        gap: styles.gap,
      };
    });
    console.log('User Icons:', JSON.stringify(userIconInfo, null, 2));

    // Extract footer styles
    const footerInfo = await page.evaluate(() => {
      const footer = document.querySelector('.desktop-footerContainer');
      if (!footer) return { error: 'footer not found' };
      const styles = window.getComputedStyle(footer);
      return {
        backgroundColor: styles.backgroundColor,
        padding: styles.padding,
        borderTop: styles.borderTop,
      };
    });
    console.log('Footer:', JSON.stringify(footerInfo, null, 2));

    // Extract section title styles
    const sectionTitleInfo = await page.evaluate(() => {
      const titles = document.querySelectorAll('.text-banner-title');
      if (titles.length === 0) return { error: 'section titles not found' };
      const styles = window.getComputedStyle(titles[0]);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        letterSpacing: styles.letterSpacing,
        textTransform: styles.textTransform,
        margin: styles.margin,
      };
    });
    console.log('Section Title:', JSON.stringify(sectionTitleInfo, null, 2));

    // Extract body font
    const bodyFont = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        color: styles.color,
        lineHeight: styles.lineHeight,
        backgroundColor: styles.backgroundColor,
      };
    });
    console.log('Body:', JSON.stringify(bodyFont, null, 2));

    // Extract all unique colors used
    const colors = await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      const colorSet = new Set();
      allEls.forEach(el => {
        const s = window.getComputedStyle(el);
        if (s.color && s.color !== 'rgba(0, 0, 0, 0)') colorSet.add(s.color);
        if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') colorSet.add(s.backgroundColor);
      });
      return Array.from(colorSet).slice(0, 30);
    });
    console.log('Colors:', JSON.stringify(colors, null, 2));

  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

extractMyntraDesignTokens();
