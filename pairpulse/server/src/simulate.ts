import WebSocket from 'ws';
import {
  AuthOkMessage,
  OverlaySignalMessage,
  PairCodeMessage,
  PairOkMessage,
  PairPulseMessage,
} from './types';

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8080';

interface LatencyMetrics {
  t0: number; // Hotkey detection
  t1: number; // Controller socket write
  t2: number; // Relay receive
  t3: number; // Relay forward
  t4: number; // Receiver receive
  t5: number; // Overlay render / ShowWindow
  localDispatch: number; // t1 - t0
  transitUp: number;     // t2 - t1
  relayTransit: number;  // t3 - t2
  transitDown: number;   // t4 - t3
  localRender: number;   // t5 - t4
  endToEnd: number;      // t5 - t0
}

async function runSimulation() {
  console.log('\n======================================================');
  console.log(' PairPulse End-to-End Latency & Signaling Simulator');
  console.log(` Target Server: ${SERVER_URL}`);
  console.log('======================================================\n');

  // Step 1: Connect Controller
  console.log('[1/4] Connecting Controller (Laptop A)...');
  const ctrlWs = new WebSocket(SERVER_URL);
  await new Promise<void>((resolve, reject) => {
    ctrlWs.once('open', resolve);
    ctrlWs.once('error', reject);
  });
  console.log('      Controller connected successfully.');

  // Step 2: Request Pairing Code
  console.log('[2/4] Requesting ephemeral pairing code...');
  const pairingCodePromise = new Promise<{ code: string; pairId: string }>((resolve) => {
    ctrlWs.on('message', (raw) => {
      const msg = JSON.parse(raw.toString()) as PairPulseMessage;
      if (msg.type === 'PAIR_CODE') {
        resolve({ code: msg.code, pairId: '' });
      }
    });
  });
  ctrlWs.send(JSON.stringify({ type: 'PAIR_REQUEST' }));
  const { code } = await pairingCodePromise;
  console.log(`      Received Pairing Code: [ ${code} ]`);

  // Step 3: Connect Receiver and confirm pairing
  console.log('[3/4] Connecting Receiver (Laptop B) with pairing code...');
  const recvWs = new WebSocket(SERVER_URL);
  await new Promise<void>((resolve, reject) => {
    recvWs.once('open', resolve);
    recvWs.once('error', reject);
  });

  const pairOkPromise = Promise.all([
    new Promise<PairOkMessage>((resolve) => {
      ctrlWs.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as PairPulseMessage;
        if (msg.type === 'PAIR_OK') resolve(msg);
      });
    }),
    new Promise<PairOkMessage>((resolve) => {
      recvWs.on('message', (raw) => {
        const msg = JSON.parse(raw.toString()) as PairPulseMessage;
        if (msg.type === 'PAIR_OK') resolve(msg);
      });
    }),
  ]);

  recvWs.send(JSON.stringify({ type: 'PAIR_CONFIRM', code, role: 'receiver' }));
  const [ctrlAuth, recvAuth] = await pairOkPromise;
  console.log(`      Pairing Confirmed! Assigned Pair ID: ${ctrlAuth.pairId}`);
  console.log(`      Controller Token: ${ctrlAuth.token.substring(0, 16)}...`);
  console.log(`      Receiver Token:   ${recvAuth.token.substring(0, 16)}...`);

  // Step 4: Run Latency Benchmark Trials
  console.log('\n[4/4] Executing 5 high-resolution signaling trials (T0 -> T5)...\n');

  const trials: LatencyMetrics[] = [];
  let currentSeq = 100;

  for (let trial = 1; trial <= 5; trial++) {
    currentSeq++;
    const testPromise = new Promise<LatencyMetrics>((resolve) => {
      recvWs.once('message', (raw) => {
        const t4 = Date.now();
        const msg = JSON.parse(raw.toString()) as OverlaySignalMessage;
        // Simulate immediate Win32 ShowWindow(hwnd, SW_SHOW) (< 0.2ms)
        const t5 = Date.now();

        const t0 = msg.t0 || msg.timestamp || 0;
        const t1 = msg.t1 || 0;
        const t2 = msg.t2 || 0;
        const t3 = msg.t3 || 0;

        const metrics: LatencyMetrics = {
          t0,
          t1,
          t2,
          t3,
          t4,
          t5,
          localDispatch: t1 - t0,
          transitUp: Math.max(0, t2 - t1),
          relayTransit: Math.max(0, t3 - t2),
          transitDown: Math.max(0, t4 - t3),
          localRender: t5 - t4,
          endToEnd: t5 - t0,
        };
        resolve(metrics);
      });
    });

    // Simulate pressing hotkey
    const t0 = Date.now();
    // Simulate non-blocking queue dispatch to socket
    const t1 = Date.now();

    const signalType = trial % 2 === 1 ? 'OVERLAY_ON' : 'OVERLAY_OFF';
    const payload: OverlaySignalMessage = {
      type: signalType,
      seq: currentSeq,
      timestamp: t0,
      t0,
      t1,
    };

    ctrlWs.send(JSON.stringify(payload));
    const result = await testPromise;
    trials.push(result);

    console.log(
      `Trial #${trial} [${signalType}]: End-to-End: ${result.endToEnd}ms | ` +
      `Local QPC: ${result.localDispatch}ms | ` +
      `Upload: ${result.transitUp}ms | ` +
      `Relay Fwd: ${result.relayTransit}ms | ` +
      `Download: ${result.transitDown}ms | ` +
      `Win32 Show: ${result.localRender}ms`
    );

    await new Promise((r) => setTimeout(r, 400));
  }

  // Summary
  const avgE2E = trials.reduce((sum, t) => sum + t.endToEnd, 0) / trials.length;
  const minE2E = Math.min(...trials.map((t) => t.endToEnd));
  const maxE2E = Math.max(...trials.map((t) => t.endToEnd));
  const avgRelay = trials.reduce((sum, t) => sum + t.relayTransit, 0) / trials.length;

  console.log('\n================== BENCHMARK SUMMARY ==================');
  console.log(` Total Trials:        ${trials.length}`);
  console.log(` Avg End-to-End:      ${avgE2E.toFixed(2)} ms`);
  console.log(` Min End-to-End:      ${minE2E.toFixed(2)} ms`);
  console.log(` Max End-to-End:      ${maxE2E.toFixed(2)} ms`);
  console.log(` Avg Relay Hop:       ${avgRelay.toFixed(2)} ms (in-memory routing)`);
  console.log('=======================================================\n');

  ctrlWs.close();
  recvWs.close();
  process.exit(0);
}

runSimulation().catch((err) => {
  console.error('[Simulation Error]:', err);
  process.exit(1);
});
