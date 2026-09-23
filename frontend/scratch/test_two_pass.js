const neo4j = require('neo4j-driver');
const driver = neo4j.driver(
  'neo4j+s://ba15f687.databases.neo4j.io',
  neo4j.auth.basic('ba15f687', '6Ly-WksAJuZwV6st648Za2ndgfaKY-KFeJAEoTcmPr4')
);

async function testTwoPass() {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 150');
    const nodeMap = new Map();
    const elementIdToEntityId = new Map();
    const edgeMap = new Map();

    // Pass 1: Nodes
    for (const record of result.records) {
      for (const key of record.keys) {
        const item = record.get(key);
        if (!item) continue;
        if (typeof item === 'object' && 'labels' in item && 'properties' in item) {
          const id = item.properties.id || item.elementId;
          nodeMap.set(id, { id, label: item.properties.label || item.properties.name || id });
          const elementId = String(item.elementId || item.identity);
          elementIdToEntityId.set(elementId, id);
        }
      }
    }

    // Pass 2: Edges
    for (const record of result.records) {
      for (const key of record.keys) {
        const item = record.get(key);
        if (!item) continue;
        if (typeof item === 'object' && 'type' in item && 'start' in item && 'end' in item) {
          const startElId = String(item.startNodeElementId || item.start);
          const endElId = String(item.endNodeElementId || item.end);
          const from = elementIdToEntityId.get(startElId) || startElId;
          const to = elementIdToEntityId.get(endElId) || endElId;
          const edgeId = String(item.properties?.id || item.elementId || item.identity);
          edgeMap.set(edgeId, {
            id: edgeId,
            from,
            to,
            label: item.properties?.label || item.type
          });
        }
      }
    }

    console.log('Nodes count:', nodeMap.size);
    console.log('Edges count:', edgeMap.size);
    console.log('Sample edges with 2-pass resolution:');
    Array.from(edgeMap.values()).slice(0, 10).forEach(e => {
      console.log(`  ${e.from} --[${e.label}]--> ${e.to}`);
    });
  } finally {
    await session.close();
    await driver.close();
  }
}

testTwoPass();
