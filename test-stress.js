const fetch = require('node-fetch');

async function testStressTest() {
  const payload = {
    scenario: 'i love riding bike its so much fun',
    investments: [{ name: 'Test', amount: 1000 }],
    userProfile: { name: 'Test' }
  };

  // Test local endpoint
  try {
    const response = await fetch('http://localhost:3001/api/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Local response status:', response.status);
    console.log('Local response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error with local endpoint:', error);
  }

  // Test Vercel endpoint
  try {
    const response = await fetch('https://flowinvest2.vercel.app/api/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Vercel response status:', response.status);
    console.log('Vercel response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error with Vercel endpoint:', error);
  }
}

testStressTest(); 