const neo4j = require('neo4j-driver');
const driver = neo4j.driver(
  'neo4j+s://ba15f687.databases.neo4j.io',
  neo4j.auth.basic('ba15f687', '6Ly-WksAJuZwV6st648Za2ndgfaKY-KFeJAEoTcmPr4')
);

async function testQueries() {
  const session = driver.session();
  try {
    const prompts = [
      'Who is Person A?',
      'What is XYZ Logistics?',
      'Show high risk targets',
      'What phone numbers are linked?'
    ];

    for (const prompt of prompts) {
      const qLower = prompt.toLowerCase();
      const isBroad = ['all', 'overview', 'summary', 'network', 'entities', 'graph', 'show', 'list', 'targets'].some(w => qLower.includes(w));
      const words = qLower.split(/[^a-zA-Z0-9+]+/).filter(w => w.length > 2);

      const cypher = `
        MATCH (n)
        WHERE any(w in $words WHERE 
          toLower(coalesce(n.name, n.label, n.id, '')) CONTAINS w OR
          toLower(coalesce(n.type, n.entity_type, '')) CONTAINS w OR
          toLower(coalesce(n.subtitle, '')) CONTAINS w OR
          toLower(coalesce(n.risk, '')) CONTAINS w
        ) OR ($isBroad AND (n.risk = 'high' OR n.type IN ['person', 'phone', 'organization', 'account']))
        OPTIONAL MATCH (n)-[r]-(m)
        RETURN coalesce(n.name, n.label, n.id) as nName,
               coalesce(n.type, n.entity_type, head(labels(n))) as nType,
               coalesce(n.subtitle, '') as nSubtitle,
               coalesce(n.risk, '') as nRisk,
               coalesce(n.riskScore, 0) as nRiskScore,
               type(r) as rType,
               coalesce(m.name, m.label, m.id) as mName,
               coalesce(m.type, m.entity_type, head(labels(m))) as mType
        LIMIT 20
      `;

      const res = await session.run(cypher, { words, isBroad });
      console.log(`\n=== Query: "${prompt}" === (${res.records.length} matches)`);
      res.records.slice(0, 3).forEach(r => {
        console.log(`  ${r.get('nName')} (${r.get('nType')}) -[${r.get('rType')}]-> ${r.get('mName')} (${r.get('mType')})`);
      });
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

testQueries();
