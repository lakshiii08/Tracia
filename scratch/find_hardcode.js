const fs = require('fs');
const path = require('path');

const terms = [
  'Priya', 'Rajiv', 'Sameer', 'Vikram', 'Kavita', 'Nightfall', 
  'CR-2024', 'Cyber Extortion Network', 'Gold Smuggling', 
  'Narcotics Syndicate', 'Cross-Border', 'Amitabh', 'Sunil', 'Sharma'
];

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (['node_modules', '.next', '.git', 'Tracia-AI', 'mocks', 'scratch'].includes(f)) continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scan(full);
    else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const t of terms) {
        if (content.toLowerCase().includes(t.toLowerCase())) {
          console.log(`Found '${t}' in ${full}`);
        }
      }
    }
  }
}

scan('.');
console.log('Search finished.');
