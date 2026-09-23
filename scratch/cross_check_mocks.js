const fs = require('fs');
const path = require('path');

// Collect words/names from mocks
const mockDir = path.join(__dirname, '..', 'mocks');
const mockFiles = fs.readdirSync(mockDir);
const suspiciousNames = new Set();

mockFiles.forEach((mf) => {
  const content = fs.readFileSync(path.join(mockDir, mf), 'utf8');
  // Match names like "First Last" or specific tokens
  const matches = content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
  matches.forEach(m => {
    if (!['First Information', 'Police Station', 'New Delhi', 'Chief Financial', 'Cyber Crime', 'Central District', 'United States', 'South Delhi'].includes(m)) {
      suspiciousNames.add(m);
    }
  });
});

console.log('Names from mocks:', Array.from(suspiciousNames));

// Search across app, components, lib, services
const targetDirs = ['app', 'components', 'lib', 'services'];
targetDirs.forEach((td) => {
  function scan(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) scan(full);
      else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        const text = fs.readFileSync(full, 'utf8');
        suspiciousNames.forEach((name) => {
          if (text.includes(name)) {
            console.log(`Found "${name}" in ${full}`);
          }
        });
      }
    }
  }
  scan(path.join(__dirname, '..', td));
});

console.log('Check complete.');
