async function runTests() {
  console.log("=== TRACIA AUTHENTICATED SYSTEM END-TO-END VERIFICATION ===");
  const baseUrl = "http://localhost:3000";

  // 0. Login to get session cookie
  console.log("\n[0] Authenticating as INVESTIGATOR (Investigator@123)...");
  let cookieHeader = "";
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operatorId: "INVESTIGATOR",
        cipher: "Investigator@123"
      })
    });
    const loginData = await loginRes.json();
    console.log("Login response status:", loginRes.status, loginData);
    
    // Extract set-cookie
    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) {
      // Extract tracia_access_token
      const match = setCookie.match(/tracia_access_token=([^;]+)/);
      if (match) {
        cookieHeader = `tracia_access_token=${match[1]}`;
        console.log("Obtained JWT auth cookie successfully!");
      }
    }
  } catch (err) {
    console.error("Login failed:", err.message);
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Cookie": cookieHeader
  };

  // 1. Cases API
  console.log("\n[1] Testing /api/cases with Auth...");
  try {
    const res = await fetch(`${baseUrl}/api/cases`, { headers: authHeaders });
    const cases = await res.json();
    console.log(`Cases count: ${Array.isArray(cases) ? cases.length : 'Error'}`);
    if (Array.isArray(cases)) {
      cases.forEach(c => console.log(` - [${c.id}] ${c.name || c.title} (Entities: ${c.entities}, Priority: ${c.priority})`));
    } else {
      console.log("Response:", cases);
    }
  } catch (err) {
    console.error("Cases API error:", err.message);
  }

  // 2. Neo4j Graph API
  console.log("\n[2] Testing /api/graph/data?caseId=TR-302 (Live Neo4j Aura)...");
  try {
    const res = await fetch(`${baseUrl}/api/graph/data?caseId=TR-302`, { headers: authHeaders });
    const graph = await res.json();
    console.log(`Live Graph Nodes: ${graph.nodes?.length || 0}, Edges: ${graph.edges?.length || 0}`);
    console.log(`All Entities Returned from Neo4j:`);
    (graph.nodes || []).forEach(n => {
      console.log(` - (${n.type}) [${n.id}] ${n.label} (Risk: ${n.risk}, Connections: ${n.details?.connections})`);
    });
    console.log(`\nSample Traversal Edges:`);
    (graph.edges || []).slice(0, 10).forEach(e => {
      console.log(` - ${e.from} --[${e.label} | ${e.kind}]--> ${e.to}`);
    });
  } catch (err) {
    console.error("Graph API error:", err.message);
  }

  // 3. Spatial Map API
  console.log("\n[3] Testing /api/map/case/TR-302 (Spatial Intelligence with Entity Colors)...");
  try {
    const res = await fetch(`${baseUrl}/api/map/case/TR-302`, { headers: authHeaders });
    const mapData = await res.json();
    console.log(`FeatureCollection Features: ${mapData.features?.length || 0}`);
    const typesSeen = new Set();
    (mapData.features || []).forEach(f => {
      typesSeen.add(f.properties?.entity_type);
    });
    console.log(`Entity types represented on map:`, Array.from(typesSeen));
    (mapData.features || []).forEach(f => {
      console.log(` - [${f.properties?.entity_type}] ${f.properties?.entity_name} @ [${f.geometry.coordinates.map(n => n.toFixed(4)).join(', ')}] -> ${f.properties?.location}`);
    });
  } catch (err) {
    console.error("Map API error:", err.message);
  }

  // 4. AI Copilot
  console.log("\n[4] Testing /api/copilot (AI Cognition Engine)...");
  try {
    const res = await fetch(`${baseUrl}/api/copilot`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        prompt: "Summarize the criminal conspiracy between Madhav Singhania, Raj Malhotra, Priya Sharma, and Lalita Deshmukh in the murder of Mrinal Kulkarni, citing physical and spatial evidence.",
        caseId: "TR-302"
      })
    });
    const copilot = await res.json();
    console.log("Copilot Status:", res.status);
    console.log("Copilot Output Preview:\n", (copilot.text || copilot.response || copilot.reply || copilot.content || JSON.stringify(copilot)).slice(0, 600));
    if (copilot.supportingPaths) {
      console.log("Supporting Paths (Neo4j):", copilot.supportingPaths.length);
    }
  } catch (err) {
    console.error("Copilot API error:", err.message);
  }

  // 5. AI Pipeline
  console.log("\n[5] Testing /api/ai/pipeline (13-Stage Investigation Pipeline)...");
  try {
    const res = await fetch(`${baseUrl}/api/ai/pipeline`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ caseId: "TR-302" })
    });
    const pipeline = await res.json();
    console.log(`Pipeline Status: ${res.status}, Success: ${pipeline.success}`);
    console.log(`Stages Completed: ${pipeline.stages?.length || 0}`);
    console.log(`Graph Stats: Nodes = ${pipeline.graphStats?.nodeCount}, Edges = ${pipeline.graphStats?.edgeCount}, Hub = ${pipeline.graphStats?.highRiskTarget} (${pipeline.graphStats?.riskScore}%)`);
    if (pipeline.stages && pipeline.stages.length > 0) {
      console.log(`Stage 1: ${pipeline.stages[0].name} -> ${pipeline.stages[0].summary}`);
      console.log(`Stage 13: ${pipeline.stages[12].name} -> ${pipeline.stages[12].summary}`);
    }
  } catch (err) {
    console.error("Pipeline API error:", err.message);
  }

  console.log("\n=== ALL TESTS FINISHED ===");
}

runTests();
