const fs = require('fs');
const path = require('path');

const patterns = [
  'MOCK_',
  'Priya',
  'Malhotra',
  'Kavita',
  'Sameer',
  'Rathore',
  'Singhal',
  'Amitabh',
  'Sunil',
  'Nightfall',
  'fake'
];

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (['node_modules', '.next', '.git', 'Tracia-AI', 'mocks', 'scratch'].includes(f)) continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scan(full);
    else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.json')) {
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        for (const p of patterns) {
          if (line.toLowerCase().includes(p.toLowerCase())) {
            console.log(`${full}:${idx + 1} - [${p}] ${line.trim().substring(0, 100)}`);
          }
        }
      });
    }
  }
}

scan('.');
console.log('Done scanning.');
