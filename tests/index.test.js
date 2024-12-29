import { test, expect } from 'vitest';
import http from 'http';

const SERVER_URL = 'http://localhost:8080';

test('Check if the server is online using http module', async () => {
  await new Promise((resolve, reject) => {
    const req = http.get(SERVER_URL, (res) => {
      expect(res.statusCode).toBe(200);
      resolve();
    });

    req.on('error', (err) => {
      reject(new Error(`Server is not online: ${err.message}`));
    });

    req.end();
  });
});

