import 'regenerator-runtime/runtime';
import { MessageType, Record, RecordSourceName, RequestOptions, SocketResponse, SourceMetadata } from './types';

export function dataFeed(
  requestOptions: RequestOptions,
  onNewData: (data: Record, source: RecordSourceName) => void,
  onMetadata: (data: SourceMetadata[], source: RecordSourceName) => void,
  onInitialLoadComplete: () => void,
): WebSocket {
  // TODO: configurable remote server
  const ws = new WebSocket('ws://localhost:8081');

  ws.addEventListener('open', function open() {
    // TODO: auth
    ws.send(JSON.stringify({
      type: MessageType.Request,
      data: ({
        anchor: requestOptions.anchor,
        line: requestOptions.line
      } as RequestOptions)
    }));
  });

  ws.addEventListener('message', async function incoming(rawMsg) {
    try {
      const message: SocketResponse = JSON.parse(rawMsg.data);
      switch (message.type) {
        case MessageType.Error:
          console.log(`[socket]: response error: `, message.data);
          return;
        case MessageType.Update:
          console.log('[socket]: update recieved');
          onNewData(message.data.data, message.data.sourceName);
          return;
        case MessageType.History:
          console.log(`[socket]: history`, message);
          message.data.forEach(source => {
            onMetadata(source.metadata, source.name);
          });
          message.data.forEach(source => {
            source.data.forEach(record => onNewData(record, source.name))
          })
          onInitialLoadComplete();
          return;
        default:
          console.warn(`Unrecognized server response type`, message)
      }
    } catch (e) {
      console.warn(`Unrecognized server data (non-json)`, rawMsg.data);
    }
  });
  return ws;
}