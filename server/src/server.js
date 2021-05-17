const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });
const { errorMsg } = require('./comm');

const ClientService = require('./service').ClientService;
wss.on('connection', function connection(ws) {
  const service = new ClientService(ws);
  ws.on('message', function incoming(message) {
    let json;
    try {
      json = JSON.parse(message);
    } catch (e) {
      console.log(`Invalid client message: "%s"`, message);
      ws.send(errorMsg(`Invalid client message: ${message}`));
      return;
    }
    console.log(`Handling client message: %s`, message);
    service.message(json);
  });
});

wss.on('close', function close(ws) {
  console.log(`closing client`, this, arguments);
})