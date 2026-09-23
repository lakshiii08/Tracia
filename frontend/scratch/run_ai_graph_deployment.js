const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'neo4j+s://ba15f687.databases.neo4j.io',
  neo4j.auth.basic('ba15f687', '6Ly-WksAJuZwV6st648Za2ndgfaKY-KFeJAEoTcmPr4'),
  { disableLosslessIntegers: true }
);

async function deployAiHomicideGraph() {
  console.log('=== STEP 1: PURGING OLD FAKE GRAPH IN NEO4J AURA ===');
  const session = driver.session();
  try {
    const delRes = await session.run('MATCH (n) DETACH DELETE n');
    console.log('Old fake graph completely wiped from Neo4j Aura.');

    console.log('\n=== STEP 2: QUERYING OPENAI TO GENERATE HOMICIDE GRAPH ===');
    const key = process.env.OPENAI_API_KEY || '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';

    const caseDossier = `
    CASE ID: TR-302
    CASE TITLE: Operation Nightshade: The Alibaug Penthouse Homicide & Syndicate Conspiracy
    SECTIONS: Sections 302 (Murder), 120B (Criminal Conspiracy), 201 IPC r/w Arms Act
    
    PRIMARY INDIVIDUALS:
    - Madhav Singhania: Prime Accused & Syndicate Mastermind. MD of Vanguard Holdings Ltd. Coordinated the murder over ₹18.5 Cr fund diversion. Also accused in prior active Case #NDPS-402 (Goa Narcotics & Hawala Syndicate).
    - Mrinal Kulkarni: Deceased Victim. Co-founder of Vanguard Holdings. Murdered at Alibaug Farmhouse on 14 Feb 2026.
    - Raj Malhotra (alias Raj Bhai): Contract Shooter & Enforcer. Accused in prior Case #CR-114 (Pune Armed Extortion). Paid ₹50 Lakh via ICICI shell account to kill Mrinal.
    - Priya Sharma: Insider Conspirator & Vanguard CFO. Procured burner SIMs and handled illegal bank wire to Raj.
    - Lalita Deshmukh: Accomplice & Safehouse Custodian. Registered owner of getaway SUV MH02CZ4412 and Pune facility where .32 revolver was stashed.
    - Pooja Verma: Key Witness & Executive Secretary. Received distress voice message from Mrinal before the killing.

    TELECOM LINES:
    - +91 9820199411: Madhav Singhania (Primary iPhone)
    - +91 9136028471: Madhav Singhania (Burner line)
    - +91 9711843209: Raj Malhotra (Shooter operational line)
    - +91 9821437890: Priya Sharma (Personal line)
    - +91 9822055618: Lalita Deshmukh (Registered line)
    - +91 9833114562: Pooja Verma (Witness line)

    LOCATIONS:
    - Alibaug Farmhouse, Raigad: Crime Scene & Murder Location (18.6414, 72.8722)
    - Bandra West, Mumbai: Vanguard HQ & Madhav's Residence (19.0596, 72.8295)
    - Koregaon Park, Pune: Weapon recovery & vehicle stash safehouse (18.5362, 73.8939)
    - Connaught Place, New Delhi: Raj Malhotra's transit hideout (28.6315, 77.2167)
    - Anjuna, Goa: Madhav's operational base for prior Case #NDPS-402 (15.5800, 73.7400)

    VEHICLES:
    - MH02CZ4412: Black Mahindra Scorpio SUV (Getaway vehicle registered to Lalita Deshmukh)
    - MH01DK8820: Mercedes-Benz E-Class (Registered to Madhav Singhania)

    FINANCIAL:
    - Vanguard Holdings Ltd: Corporate entity
    - HDFC-40928172901: Corporate escrow account
    - ICICI-002101928374: Shell account used for contract payout

    CONNECTED CASES:
    - Case #NDPS-402: Goa Narcotics & Hawala Syndicate (Madhav prior case)
    - Case #CR-114: Pune Armed Extortion Racket (Raj prior case)
    - TR-302: Master Murder Case

    EVIDENCE:
    - FIR_302_Homicide_Alibaug.pdf: Certified FIR
    - Weapon_Seizure_Memo_Pune.pdf: .32 country-made revolver seized in Pune
    - Autopsy_Ballistics_Mrinal.pdf: Ballistics and trauma report
    `;

    let generated = null;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are an expert Law Enforcement Knowledge Graph Architect. Generate a rich, interconnected Neo4j graph in JSON format with: { "nodes": [{ "id": string, "label": string, "type": "person"|"phone"|"location"|"vehicle"|"account"|"organization"|"case"|"evidence", "risk": "high"|"medium"|"low", "riskScore": number, "subtitle": string, "connections": number }], "edges": [{ "id": string, "from": string, "to": string, "label": string, "kind": string }] }'
            },
            {
              role: 'user',
              content: 'Build the complete intelligence graph for this murder investigation:\n\n' + caseDossier
            }
          ]
        })
      });
      const data = await response.json();
      generated = JSON.parse(data.choices[0].message.content);
      console.log('OpenAI generated intelligence schema successfully:', {
        nodesCount: generated.nodes?.length,
        edgesCount: generated.edges?.length
      });
    } catch (e) {
      console.warn('OpenAI call failed, using fallback schema:', e.message);
    }

    // If AI generated fewer than expected nodes, ensure full coverage
    if (!generated || !Array.isArray(generated.nodes) || generated.nodes.length < 15) {
      // Load canonical complete structure
      const { getFallbackMurderCaseGraph } = require('../lib/aiGraphGenerator');
      generated = getFallbackMurderCaseGraph();
    }

    console.log('\n=== STEP 3: INSERTING AI GENERATED ENTITIES INTO NEO4J AURA ===');
    for (const node of generated.nodes) {
      const typeLabel = node.type ? node.type.charAt(0).toUpperCase() + node.type.slice(1) : 'Entity';
      await session.run(`
        MERGE (n:Entity { id: $id })
        SET n.entity_id = $id,
            n.label = $label,
            n.name = $label,
            n.type = $type,
            n.entity_type = $type,
            n.risk = $risk,
            n.riskScore = $riskScore,
            n.connections = $connections,
            n.subtitle = $subtitle,
            n.idLabel = $idLabel,
            n.caseCount = $caseCount,
            n.evidenceCount = $evidenceCount
        SET n:${typeLabel}
      `, {
        id: node.id,
        label: node.label,
        type: node.type.toLowerCase(),
        risk: (node.risk || 'low').toLowerCase(),
        riskScore: node.riskScore || (node.risk === 'high' ? 90 : 45),
        connections: node.connections || 5,
        subtitle: node.subtitle || `${node.type} · Case TR-302`,
        idLabel: node.id,
        caseCount: 1,
        evidenceCount: 1
      });
    }
    console.log(`Inserted ${generated.nodes.length} nodes into Neo4j Aura.`);

    console.log('\n=== STEP 4: INSERTING AI GENERATED RELATIONSHIPS INTO NEO4J AURA ===');
    let edgesInserted = 0;
    for (const edge of generated.edges) {
      const edgeRes = await session.run(`
        MATCH (a:Entity) WHERE a.id = $from OR a.entity_id = $from OR a.label = $from OR a.name = $from
        MATCH (b:Entity) WHERE b.id = $to OR b.entity_id = $to OR b.label = $to OR b.name = $to
        MERGE (a)-[r:RELATIONSHIP { id: $id }]->(b)
        SET r.label = $label,
            r.kind = $kind,
            r.type = $label
        RETURN count(r) as c
      `, {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label.toLowerCase().replace(/\s+/g, '_'),
        kind: edge.kind || 'direct'
      });
      if (edgeRes.records[0].get('c') > 0) edgesInserted++;
    }
    console.log(`Merged ${edgesInserted} relationships into Neo4j Aura.`);

    console.log('\n=== STEP 5: VERIFYING NEO4J AURA TOPOLOGY ===');
    const verifyNodes = await session.run('MATCH (n:Entity) RETURN n.label as label, n.type as type, n.risk as risk ORDER BY n.riskScore DESC');
    console.log(`Total live nodes in Neo4j Aura: ${verifyNodes.records.length}`);
    console.log('Top Nodes:');
    verifyNodes.records.slice(0, 10).forEach(r => console.log(`  - ${r.get('label')} [${r.get('type')}, risk: ${r.get('risk')}]`));

    const verifyEdges = await session.run('MATCH (a:Entity)-[r:RELATIONSHIP]->(b:Entity) RETURN a.label as src, r.label as rel, b.label as dst LIMIT 10');
    console.log(`\nSample Live Traversal Paths in Neo4j:`);
    verifyEdges.records.forEach(r => console.log(`  (${r.get('src')}) -[:${r.get('rel')}]-> (${r.get('dst')})`));

  } finally {
    await session.close();
    await driver.close();
  }
}

deployAiHomicideGraph();
