import * as http from 'http';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import { RelayServer } from './relay';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

// HTTP server for health checks, uptime probes, and WebSocket upgrade
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'PairPulse Relay Server',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// WebSocket Server attached to HTTP server
const wss = new WebSocketServer({ server });
const relay = new RelayServer();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[Relay] Inbound WebSocket connection from ${clientIp}`);
  relay.handleConnection(ws);
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(` PairPulse Cloud Relay is running!`);
  console.log(` Listening on: ws://${HOST}:${PORT}`);
  console.log(` Health check: http://${HOST}:${PORT}/health`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});

const handleShutdown = () => {
  console.log('\n[Relay] Shutting down gracefully...');
  relay.stop();
  wss.close(() => {
    server.close(() => {
      console.log('[Relay] Server stopped.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
