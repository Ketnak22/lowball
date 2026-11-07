import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { questions } from './questions';
import { attachGameHandlers, type GameServer } from './socket/handlers';

const httpServer = createServer(createApp());
const io: GameServer = new Server(httpServer, {
  cors: { origin: config.corsOrigins },
});

const game = attachGameHandlers(io, { questions });

httpServer.listen(config.port, () => {
  console.info(`Server listening on port ${config.port}`);
  console.info(`Allowed origins: ${config.corsOrigins.join(', ')}`);
});

function shutdown() {
  game.close();
  void io.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
