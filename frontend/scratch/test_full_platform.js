async function testFullPlatform() {
  console.log('=== TRACIA END-TO-END VERIFICATION WITH LIVE NEO4J & REAL AI ===\n');

  // Step 1: Authenticate
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId: 'ADMIN', cipher: 'Admin@123' })
  });
  
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('1. Authentication Status:', loginRes.status);
  const tokenMatch = setCookie ? setCookie.match(/tracia_access_token=([^;]+)/) : null;
  const cookieHeader = 'tracia_access_token=' + (tokenMatch ? tokenMatch[1] : '');

  // Step 2: Neo4j Aura Graph API
  const gRes = await fetch('http://localhost:3000/api/graph', {
    headers: { 'Cookie': cookieHeader }
  });
  const gData = await gRes.json();
  console.log('2. Live Neo4j Aura Graph:');
  console.log('   - Connected:', gData.connected);
  console.log('   - Total Nodes in Aura:', gData.nodes?.length);
  console.log('   - Total Edges in Aura:', gData.edges?.length);
  console.log('   - Sample Nodes:', gData.nodes?.slice(0, 4).map(n => `${n.label} [${n.type}, risk: ${n.risk}]`));

  // Step 3: Real AI 13-Stage Investigation Pipeline
  const pRes = await fetch('http://localhost:3000/api/ai/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ caseId: 'TR-102' })
  });
  const pData = await pRes.json();
  console.log('3. Real AI Pipeline:');
  console.log('   - Status:', pRes.status, '| Success:', pData.success);
  console.log('   - Stages Executed:', pData.stages?.length + '/13');

  // Step 4: Real AI Copilot GraphRAG
  const copilotPrompt = 'Who is Person A, what accounts or phones are linked to them in Neo4j, and what is the risk assessment?';
  const cRes = await fetch('http://localhost:3000/api/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ prompt: copilotPrompt, caseId: 'TR-102' })
  });
  const cData = await cRes.json();
  console.log('4. Real AI Copilot (OpenAI GPT-5 + Neo4j GraphRAG):');
  console.log('   - Query Status:', cRes.status);
  console.log('   - AI Intent:', cData.intent);
  console.log('   - Sources Cited:', cData.sources);
  console.log('   - Supporting Graph Paths Count:', cData.supportingPaths?.length);
  if (cData.supportingPaths && cData.supportingPaths.length > 0) {
    console.log('   - Top Neo4j Paths:');
    cData.supportingPaths.slice(0, 3).forEach(p => console.log('     * ' + p));
  }
  console.log('   - AI Generated Response:');
  console.log('--------------------------------------------------');
  console.log(cData.text);
  console.log('--------------------------------------------------');

  // Step 5: Maps & Geo Intel Check
  const mapRes = await fetch('http://localhost:3000/api/map/case/TR-102', { headers: { 'Cookie': cookieHeader } });
  const mapData = await mapRes.json();
  console.log('5. Maps Endpoint (/api/map/case/TR-102):');
  console.log('   - Status:', mapRes.status);
  console.log('   - GeoJSON Features Count:', mapData.features?.length);
  if (mapData.features?.length > 0) {
    console.log('   - GeoJSON Points:', mapData.features.map(f => f.properties?.title || f.properties?.name || f.properties?.label));
  }

  // Step 6: Cyber Intel Check
  const intelRes = await fetch('http://localhost:3000/api/cyber-intel', { headers: { 'Cookie': cookieHeader } });
  const intelData = await intelRes.json();
  console.log('6. Cyber Intel Events:', Array.isArray(intelData) ? intelData.length : 0);

  // Step 7: Relay Chain Check
  const chainRes = await fetch('http://localhost:3000/api/cyber-intel/chain?targetNodeId=person-a', { headers: { 'Cookie': cookieHeader } });
  const chainData = await chainRes.json();
  console.log('7. Relay Chain Status:', chainRes.status, 'Relay Nodes:', chainData.chain?.length || chainData.nodes?.length);
}

testFullPlatform();
