async function testAsk() {
  const url = "https://criminal-network-api-latest.onrender.com/api/ask";
  console.log("Calling deployed AI link:", url);
  
  const payload = {
    question: "Summarize the criminal network case",
    case_id: null,
    entity_focus: null
  };

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const elapsed = (Date.now() - start) / 1000;
    console.log(`Status: ${res.status} ${res.statusText} (${elapsed.toFixed(1)}s)`);
    const data = await res.text();
    console.log("Body:", data);
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}

testAsk();
