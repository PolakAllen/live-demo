const random = require('random');

class DataSource {
  constructor(s) {
    Object.assign(this, {
      ...s,
      perturb: s.perturb ? {
        dist: random.poisson(s.perturb.meanTime * 1000),
        ...s.perturb
      } : null,
      distArgs: {
        mean: ((s.spec.min + s.spec.max) / 2 * (s.spec.bias || 1)),
        std3: (s.spec.max - s.spec.min) * (s.spec.var || 1),
        ...s.distArgs
      },
      state: {
        inControl: true,
        nextPerturbanceTime: 0,
        currDist: null
      },
    })
  }
  newDist(inControl) {
    if (this.perturb) {
      const control = inControl === undefined ? this.state.inControl : inControl;
      const meanSource = control
        ? random.normal(this.distArgs.mean, this.distArgs.std3 / (8 * 8))
        : random.normal(this.distArgs.mean, this.distArgs.std3 * 3)
      return random.normal(meanSource(), control ? this.distArgs.std3 / 8 : this.distArgs.std3);
    } else {
      return random.normal(this.distArgs.mean, this.distArgs.std3 / 8);
    }
  }
  setControl(inControl) {
    this.state.inControl = inControl;
    this.refreshDist();
  }
  refreshDist() {
    this.state.currDist = this.newDist();
    this.state.nextPerturbanceTime = this.perturb ? this.perturb.dist() : Number.MAX_SAFE_INTEGER;
  }
  sample() {
    if (this.state.nextPerturbanceTime < Date.now()) {
      this.refreshDist()
    }
    return this.state.currDist()
  }
}
class TimeSource extends DataSource {
  constructor(args) {
    super(args);
    this.callbacks = [];
    this.priorCallTime = null;
    this.runnerHandle = null;
  }
  onTick(callback) {
    this.callbacks.push(callback)
    return () => this.callbacks = this.callbacks.filter(c => c !== callback)
  }
  step() {
    this.priorCallTime = Date.now();
    this.runnerHandle = setTimeout(() => {
      const t = Date.now() - this.priorCallTime;
      this.callbacks.forEach(c => c(t));
      this.step();
    }, this.sample());
  }
  start() {
    if (this.runnerHandle === null) {
      this.step();
    }
  }
  stop() {
    clearTimeout(this.runnerHandle)
    this.runnerHandle = null;
    this.priorCallTime = null;
  }
  simulate(startTime, endTime, ...dataSources) {
    let time = startTime;
    const points = [];
    while (time < endTime) {
      points.push([time, ...dataSources.map(s => s.sample())])
      time += this.sample();
    }
    return points;
  }
}
class ConjoinedSource {
  constructor(source, std3) {
    Object.assign(this, source);
    this.source = source;
    this.std3 = std3 || 3;
  }
  sample() {
    return random.normal(this.source.sample(), this.std3 / 128)();
  }
}
ConjoinedSource.multiple = (count, source) => {
  const result = [source];
  for (let i=0; i < (count - 1); i++) {
    result.push(new ConjoinedSource(source))
  }
  return result;
}

const dataSources = {
  timing: (avgTimeInSeconds) => new TimeSource({ 
    perturb: null,
    spec: { min: (avgTimeInSeconds - 0.1) * 1000, max: (avgTimeInSeconds + 0.1) * 1000 },
  }),
  width: {
    large: () => new DataSource({ 
      perturb: { meanTime: 60 }, 
      spec: { min: 55, max: 59 },
    }),
    medium: () => new DataSource({ 
      perturb: { meanTime: 60 }, 
      spec: { min: 10, max: 12 },
    }),
    small: () => new DataSource({ 
      perturb: { meanTime: 60 }, 
      spec: { min: 10, max: 12 },
    }),
  },
  temp: () => new DataSource({ 
    perturb: { meanTime: 1 }, 
    spec: { min: 225, max: 245 },
  })
}
const lines = [
  (() => {
    return {
      sources: [
        {
          name: 'Internal Sensors',
          timing: dataSources.timing(1),
          data: [
            ...ConjoinedSource.multiple(2, dataSources.temp()).map((val, i) => ({ id: `temp${i}`, val })),
          ]
        }, 
        {
          name: 'Measurements',
          timing: dataSources.timing(5),
          data: [
            { id: 'a1Length', val: dataSources.width.large() },
            { id: 'a2Length', val: dataSources.width.medium() },
            { id: 'c1Length', val: dataSources.width.small() },
          ]
        },
      ]
    };
  })()
]
module.exports = {
  dataSources,
  lines
}