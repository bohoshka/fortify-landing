import { createServer } from './app.js';

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const server = createServer();

server.listen(PORT, () => {
  console.log(`Fortify landing server listening on http://localhost:${PORT}`);
});
