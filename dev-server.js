const { createServer } = require('vite');
const path = require('path');

async function start() {
  const server = await createServer({
    root: path.resolve(__dirname),
    server: { port: 5174, strictPort: false },
  });
  await server.listen();
  server.printUrls();
}

start();
