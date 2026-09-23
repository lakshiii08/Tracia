async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorId: 'Admin', password: 'Admin@123' })
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  const token = cookieHeader ? cookieHeader.split(';')[0] : '';

  const graphRes = await fetch('http://localhost:3000/api/graph', {
    headers: { 'Cookie': token }
  });
  const graphData = await graphRes.json();
  console.log('Connected:', graphData.connected);
  console.log('Nodes count:', graphData.nodes?.length);
  console.log('Edges count:', graphData.edges?.length);
  console.log('Sample Resolved Edges:');
  graphData.edges?.slice(0, 10).forEach(e => {
    console.log(`  ${e.from} --[${e.label}]--> ${e.to}`);
  });
}
test();
