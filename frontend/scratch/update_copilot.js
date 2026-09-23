const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app/api/copilot/route.ts');
let c = fs.readFileSync(p, 'utf8');

const target = `    if (aiAnswer) {
      return NextResponse.json(aiAnswer);
    }`;

const replacement = `    if (aiAnswer) {
      return NextResponse.json({
        text: aiAnswer.text,
        intent: "OpenAI GPT-5 GraphRAG Synthesis",
        supportingPaths: graphPaths.slice(0, 8),
        sources: [
          "Neo4j Aura Cluster (ba15f687.databases.neo4j.io)",
          "OpenAI GPT-5 Cognitive Reasoning Engine",
          "TRACIA Master Case Repository"
        ],
      });
    }`;

const normalize = s => s.replace(/\r\n/g, '\n');
if (normalize(c).includes(normalize(target))) {
  // Replace respecting existing line endings
  const isCRLF = c.includes('\r\n');
  const actualTarget = isCRLF ? target.replace(/\n/g, '\r\n') : target;
  const actualReplacement = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;
  c = c.replace(actualTarget, actualReplacement);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Successfully updated app/api/copilot/route.ts');
} else {
  console.error('Target block not found');
}
