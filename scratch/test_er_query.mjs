import neo4j from "neo4j-driver";

const uri = "neo4j+s://ba15f687.databases.neo4j.io";
const user = "ba15f687";
const pass = "6Ly-WksAJuZwV6st648Za2ndgfaKY-KFeJAEoTcmPr4";

async function testER() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass));
  const session = driver.session();
  try {
    const cypher = `
      MATCH (a), (b)
      WHERE id(a) < id(b) 
        AND (
          (a:person AND b:person) 
          OR (a.entity_type = 'person' AND b.entity_type = 'person')
          OR (a.entity_type = b.entity_type AND a.entity_type IS NOT NULL)
        )
      OPTIONAL MATCH (a)-[r1]-(shared)-[r2]-(b)
      WHERE shared <> a AND shared <> b
      RETURN coalesce(a.name, a.label, a.id) as nameA,
             coalesce(a.entity_type, head(labels(a)), 'person') as typeA,
             coalesce(b.name, b.label, b.id) as nameB,
             coalesce(b.entity_type, head(labels(b)), 'person') as typeB,
             count(shared) as sharedCount,
             collect(coalesce(shared.name, shared.label, shared.id))[0..3] as sharedEntities
      ORDER BY sharedCount DESC
      LIMIT 10
    `;
    const res = await session.run(cypher);
    console.log(`Found ${res.records.length} matching entity pairs:`);
    res.records.forEach((r, i) => {
      console.log(`[${i}] ${r.get("nameA")} <-> ${r.get("nameB")} | Shared: ${r.get("sharedCount")} (${JSON.stringify(r.get("sharedEntities"))})`);
    });
  } catch (e) {
    console.error("ER error:", e.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

testER();
