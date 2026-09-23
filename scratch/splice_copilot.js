const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app/api/copilot/route.ts');
const raw = fs.readFileSync(p, 'utf8');
const isCRLF = raw.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);

const idx = lines.findIndex(l => l.trim() === 'if (aiAnswer) {');
console.log('Found if (aiAnswer) at line index:', idx);

const replacementLines = [
  '    if (aiAnswer) {',
  '      return NextResponse.json({',
  '        text: aiAnswer.text,',
  '        intent: "OpenAI GPT-5 GraphRAG Synthesis",',
  '        supportingPaths: graphPaths.slice(0, 8),',
  '        sources: [',
  '          "Neo4j Aura Cluster (ba15f687.databases.neo4j.io)",',
  '          "OpenAI GPT-5 Cognitive Reasoning Engine",',
  '          "TRACIA Master Case Repository"',
  '        ],',
  '      });',
  '    }'
];

lines.splice(idx, 3, ...replacementLines);
fs.writeFileSync(p, lines.join(eol), 'utf8');
console.log('Successfully written enriched Copilot route!');
