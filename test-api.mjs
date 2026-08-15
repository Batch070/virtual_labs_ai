import http from 'http';
const req = http.request('http://localhost:3000/api/generate-viz', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  res.on('data', d => process.stdout.write(d));
});
req.write(JSON.stringify({ topic: 'a red box', sessionId: 'test-123' }));
req.end();
