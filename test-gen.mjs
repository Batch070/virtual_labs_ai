import http from 'http';

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  const sessionRes = await makeRequest('/api/chat/sessions', 'POST', { title: 'Test' });
  const session = JSON.parse(sessionRes.data);
  console.log('Created Session:', session);
  
  console.log('Sending generate request...');
  const genReq = http.request(`http://localhost:3000/api/generate-viz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    console.log('Status:', res.statusCode);
    res.on('data', d => process.stdout.write(d.toString()));
    res.on('end', () => console.log('\nStream ended'));
  });
  genReq.write(JSON.stringify({ topic: 'a red box', sessionId: session.id }));
  genReq.end();
}

test();
