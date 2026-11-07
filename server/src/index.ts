import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config, isLanOrigin } from './config';
import { questions } from './questions';
import { attachGameHandlers, type GameServer } from './socket/handlers';

const httpServer = createServer(createApp());
const io: GameServer = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowed =
        !origin || config.corsOrigins.includes(origin) || (config.allowLan && isLanOrigin(origin));
      callback(null, allowed);
    },
  },
});

const game = attachGameHandlers(io, { questions });

httpServer.listen(config.port, () => {
  console.info(`Server listening on port ${config.port}`);
  console.info(`Allowed origins: ${config.corsOrigins.join(', ')}`);
  if (config.allowLan) console.info('Also allowing origins from the local network');
});

function shutdown() {
  game.close();
  void io.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
