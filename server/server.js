const WebSocket = require('ws');
const poissonProcess = require('poisson-process');

const wss = new WebSocket.Server({ port: 8081 });
const LIVE = 'live';
const defaultClientOptions = {
  provideHistory: true,
  lastTimeOrLive: LIVE,
  historyFalloff: 30 * 60 * 1000,
};

wss.on('connection', function connection(ws) {
  console.log(`connection recieved?`);
  const history = [];
  const options = {...defaultClientOptions};
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    Object.assign(options, JSON.parse(defaultClientOptions));
  });
  ws.poissonProcess = poissonProcess.create(10000, createDatapoint);
  console.log(`stating datageneration`);
  createDatapoint();
  ws.poissonProcess.start();
  function createDatapoint() {
    history.push([ Date.now(), Math.random() * 10 ]);
    resendWindow();
  }
  function resendWindow() {
    // TODO: narrow
    ws.send(JSON.stringify(history));
  }
});

wss.on('close', function close(ws) {
  console.log(`closing client`, this, arguments);
})