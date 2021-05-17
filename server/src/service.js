const LIVE = 'live';
const { MessageType, errorMsg, historyMsg, updateMsg } = require('./comm');
const { lines } = require('./lines');

class ClientService {
  constructor(ws) {
    this.ws = ws;
    this.options = {};
    this.isRunning = false;
  }
  error(msg) {
    console.log(`[OUT][ERR]: ${msg}`)
    this.ws.send(errorMsg(msg));
  }
  message(msg) {
    switch(msg.type) {
      case MessageType.Request:
        this.updateOptionsAndRestart(msg.data);
        return;
      default:
        this.error(`Unhandled message type: ${msg.type}`)
    }
  }
  get startTime() {
    if (this.options.anchor.start) {
      return this.options.anchor.start;
    } else {
      return this.endTime - this.options.anchor.span;
    }
  }
  get endTime() {
    if (this.options.anchor.end) {
      if (this.options.anchor.end === LIVE) {
        return Date.now();
      } else {
        return this.options.anchor.end;
      }
    } else {
      return this.options.anchor.start + this.options.anchor.span;
    }
  }
  updateOptionsAndRestart(newOptions) {
    this.stop();
    this.options = newOptions;
    this.start();
  }
  stop() {
    if (!this.isRunning) {
      return;
    }
    const line = lines[this.options.line];
    if (!line) {
      this.error(`Unrecognized line identifier: ${this.options.line}`);
    }
    line.sources.forEach(s => s.timing.stop())
    this.isRunning = false;
  }
  start() {
    if (this.isRunning) {
      this.error(`Unable to start data service, as it is already running`);
      return;
    }
    const line = lines[this.options.line];
    if (!line) {
      this.error(`Unrecognized line identifier: ${this.options.line}`);
      return;
    }
    const { startTime, endTime } = this;
    const history = line.sources.map(source => {
      return {
        name: source.name,
        metadata: source.data.map(d => { 
          return {
            id: d.id, 
            name: d.name, 
            min: d.val.spec.min, 
            max: d.val.spec.max, 
            mean: d.val.distArgs.mean 
          }
        }),
        data: source.timing.simulate(startTime, endTime, ...source.data.map(d => d.val))
      }
    });
    this.ws.send(historyMsg(history))
    line.sources.forEach(s => {
      let currTime = endTime;
      s.timing.onTick(t => {
        currTime += t
        this.ws.send(updateMsg({
          sourceName: s.name,
          data: [currTime, ...s.data.map(d => d.val.sample())]
        }))
      });
      s.timing.start();
    })
    this.isRunning = true;
  }
}

module.exports = {
  ClientService
}