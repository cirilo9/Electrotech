import express from 'express';
import http from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase, seedDatabase } from '../server/db.ts';
import { createApiRouter } from '../server/routes/api.ts';

export interface TestServerContext {
  db: DatabaseSync;
  baseUrl: string;
  close: () => Promise<void>;
}

export async function createTestServer(): Promise<TestServerContext> {
  const db = createDatabase(':memory:');
  seedDatabase(db);

  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(db));

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;

  return {
    db,
    baseUrl: `http://127.0.0.1:${port}/api`,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      db.close();
    },
  };
}
