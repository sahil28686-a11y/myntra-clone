# Pixel-Perfect UI Loop — Iteration 2

## Current State
- Dev server running at http://localhost:3000 (production mode, port 3000)
- Baseline screenshot: docs/reference/myntra-baseline.png (1440x7439)
- Local screenshot: docs/reference/local-build.png (1440x2150)
- Current mismatch: 38.28%
- Diff image: docs/reference/comparison-homepage.png

## Task
Continue the autonomous pixel-perfect UI cloning loop for the Myntra homepage.

### Step 1: Analyze Myntra HTML Structure
Read the Myntra HTML at `docs/reference/myntra-curl.html` and identify:
- Exact header structure (logo, nav items, search bar, user icons)
- Homepage section layout (hero banners, category grid, brand carousels, deal sections)
- Footer structure
- Exact colors, fonts, spacing values

### Step 2: Update Frontend Components
Update these files to match Myntra exactly:

1. **Header** (`storefront/src/components/layout/Header.tsx`):
   - Use Myntra's exact logo (sprite image from constant.myntassets.com)
   - Match nav item spacing, font size (14px), letter-spacing (0.15em)
   - Match search bar styling (bg #F5F5F6, height 40px, border-radius 4px)
   - Match user icon layout (Profile, Wishlist, Bag with labels)
   - Add mega menu dropdown on hover

2. **Homepage** (`storefront/src/app/page.tsx`):
   - Add more sections: brand carousels, deal banners, promotional sections
   - Match exact spacing (margins, padding)
   - Use Myntra's exact color values

3. **Footer** (`storefront/src/components/layout/Footer.tsx`):
   - Match exact link colors (#696B79), font sizes (15px)
   - Match section title styling (12px, bold, 0.3em letter-spacing)

4. **Globals CSS** (`storefront/src/styles/globals.css`):
   - Ensure all Myntra design tokens are correct

### Step 3: Rebuild and Recapture
```bash
cd "E:/Projects/ecom store/storefront"
./node_modules/.bin/next build
./node_modules/.bin/next start -p 3000 &
```

### Step 4: Take New Screenshot
```bash
cd "E:/Projects/ecom store"
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--host-resolver-rules=MAP localhost 127.0.0.1']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'docs/reference/local-build.png', fullPage: true });
  console.log('Local screenshot captured!');
  await browser.close();
})();
"
```

### Step 5: Compare
```bash
cd "E:/Projects/ecom store"
node scripts/compare-screenshots.js
```

### Step 6: Iterate
If mismatch > 1%, analyze the diff image and repeat steps 2-5.
Focus on the most visually impactful changes first (header, hero section, spacing).

## Key Myntra Design Tokens
- Primary: #FF3F6C
- Dark text: #282C3F
- Body text: #535766
- Muted text: #696E79 / #94969F
- Border: #E9E9EB
- Light bg: #F5F5F6
- Footer bg: #FAFBFC
- Header height: 80px desktop, 56px mobile
- Max width: 1280px
- Nav font: 14px bold, 0.15em letter-spacing
- Body font: 15px
- Section title: 1.8em bold, 0.15em letter-spacing, #3E4152

## Tools Available
- read, write, edit, bash, grep, find
- Playwright (chromium) for screenshots
- pixelmatch + pngjs for comparison
- Next.js build/start for local server
