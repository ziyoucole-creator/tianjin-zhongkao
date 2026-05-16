const https = require('https');
const fs = require('fs');

// Try to download M3KE dataset via HF API
const options = {
  hostname: 'huggingface.co',
  path: '/api/datasets/TJUNLP/M3KE',
  method: 'GET',
  headers: { 'User-Agent': 'Mozilla/5.0' },
  timeout: 15000
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Dataset info:');
      console.log('ID:', parsed.id);
      console.log('Siblings:');
      if (parsed.siblings) {
        parsed.siblings.forEach(s => console.log(' -', s.rfilename));
      }
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Raw (first 500 chars):', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.on('timeout', () => { console.log('Timeout'); req.destroy(); });
req.end();
