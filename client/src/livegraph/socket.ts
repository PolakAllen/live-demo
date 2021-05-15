import 'regenerator-runtime/runtime';
import { GraphData } from './data';

export function dataFeed(onNewData : (data : GraphData) => void) : WebSocket {
    // TODO: configurable remote server
    const ws = new WebSocket('ws://localhost:8081');

    ws.addEventListener('open', function open() {
        // TODO: auth
    });

    ws.addEventListener('message', async function incoming(msg) {
        try {
            const json = JSON.parse(msg.data);
            console.log(`Got server data (as json)`, json);
            onNewData(json);
        } catch(e) {
            console.error(`Unrecognized server data (non-json)`, msg.data);
        }
    });
    return ws;
}