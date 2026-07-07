const fs = require('fs');
const html = fs.readFileSync('docs/reference/myntra-pdp-curl.html', 'utf8');

// Find image URLs
const imgRegex = /https?:\/\/assets\.myntassets\.com[^"'\s\\]+\.(jpg|png|webp)/g;
let match;
let count = 0;
while ((match = imgRegex.exec(html)) !== null && count < 10) {
  console.log('Image:', match[0].replace(/\\\//g, '/'));
  count++;
}

console.log('\n=== Looking for PDP container ===');
// Find divs with pdp-related classes
const pdpDivs = html.match(/<div[^>]*pdp[^>]*>/gi);
if (pdpDivs) {
  pdpDivs.slice(0, 5).forEach(d => console.log('PDP div:', d.substring(0, 200)));
} else {
  console.log('No pdp divs found');
}

// Find product name
const nameMatch = html.match(/"name":"([^"]+)"/);
console.log('\nProduct name:', nameMatch ? nameMatch[1] : 'NOT FOUND');

// Find description
const descMatch = html.match(/"description":"([^"]+)"/);
console.log('Description:', descMatch ? descMatch[1].substring(0, 200) : 'NOT FOUND');

// Find all JSON-LD or structured data
const jsonLd = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
if (jsonLd) {
  console.log('\nJSON-LD found:', jsonLd[1].substring(0, 500));
}

// Find price info
const priceMatch = html.match(/"price":\{"[^}]+}/g);
if (priceMatch) {
  priceMatch.slice(0, 3).forEach(p => console.log('Price:', p));
}

// Find rating
const ratingMatch = html.match(/"rating":[0-9.]+/g);
if (ratingMatch) {
  ratingMatch.slice(0, 3).forEach(r => console.log('Rating:', r));
}

// Find key sections by looking for common PDP text
const sections = ['size', 'color', 'brand', 'price', 'rating', 'review', 'delivery', 'pincode'];
sections.forEach(s => {
  const idx = html.toLowerCase().indexOf(s);
  if (idx > -1) {
    const context = html.substring(Math.max(0, idx - 50), idx + 200).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`\nSection "${s}" at ${idx}:`, context.substring(0, 300));
  }
});
