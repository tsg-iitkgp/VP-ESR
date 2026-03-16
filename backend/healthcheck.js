// Simple health check endpoint
import http from 'http';

if (!process.env.PORT) {
  console.error('PORT is required for healthcheck');
  process.exit(1);
}

const options = {
  host: 'localhost',
  port: process.env.PORT,
  path: '/health',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('ERROR:', err);
  process.exit(1);
});

request.end();
