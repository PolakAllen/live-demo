import * as d3 from "d3";
import { line, Selection } from "d3";
import { LIVE, Record, SourceMetadata, TimeAnchor } from './types';

export type GraphOptions = {
  padding: {
    bottom: number,
    left: number,
    right: number,
    top: number,
  },
  anchor: TimeAnchor,
  values: number[],
  liveTickRate: number,
  isLive: boolean,
  controlLines?: ControlLines
}
export type ControlLines = {
  min: number,
  max: number,
  mean: number
}
/**
 * Graph rendering follows 3 stages
 * 1. placing elements on the DOM to be manipulated as needed 
 * 2. updating metadata information such as scaling, legends, titles and styling
 * 3. updating path data + time axis movement
 * 
 * As we're meant to display live data, we run just stage 3 in a loop, and animate (transition) between
 * renders, but we work fine for static data (if configured for it)
 */
export type RenderStage = 1 | 2 | 3;
export class Graph {
  static defaultOptions: GraphOptions = {
    padding: {
      bottom: 20,
      left: 40,
      right: 10,
      top: 10
    },
    anchor: {
      end: LIVE,
      span: 1000 * 60 * 5,
    },
    values: [],
    liveTickRate: 1000,
    isLive: true,
  }
  constructor(options: Partial<GraphOptions>) {
    this.options = { ...Graph.defaultOptions, ...options };
    this.renderStage = 1;
  }
  _ref?: SVGSVGElement;
  _data?: Record[];
  options: GraphOptions;

  renderStage: RenderStage;
  renderLoopRef?: ReturnType<typeof setInterval>;
  renderStartTime?: number;
  renderRefTick?: number;
  get realWidth() {
    return this._ref ? this._ref.getBoundingClientRect().width : 0;
  }
  get realHeight() {
    return this._ref ? this._ref.getBoundingClientRect().height : 0;
  }
  /** @see render() for an implicit start() method */
  stop() {
    this.renderLoopRef && clearInterval(this.renderLoopRef);
    this.renderLoopRef = undefined;
  }
  render() {
    // console.log(`Rendering with state: ${JSON.stringify([this._data, this.options, this.renderStage], undefined, 2)}`);
    if (!this._ref) { return; }
    switch(this.renderStage) {
      case 1:
        this._renderDOM();
      case 2:
        this._renderProperties();
      case 3:
        if (this.renderLoopRef) {
          return;
        }
        this.renderStartTime = Date.now();
        if (this.options.isLive) {
          this.renderLoopRef = setInterval(this._renderData, this.options.liveTickRate);
        }
        this._renderData();
    }
  }
  _renderDOM() {
    const doIfMissing = (fn : () => void, selector : string) => {
      if (!this._d3ref.select(selector).node()) {
        fn();
      }
    }
    doIfMissing(() => this._d3ref
      .append('g')
      .attr('class', 'plot'), 'g.plot')
    this.options.values.forEach(i => {
      doIfMissing(() => this._d3ref
        .select('g.plot')
        .append('path')
        .attr("class", `data-line line-${i}`),
        `g.plot path.line-${i}`
      )
    });
    doIfMissing(() => this._d3ref
      .select('g.plot')
      .append('line')
      .attr("class", `control-line control-line-min`),
      `g.plot line.control-line-min`)
    doIfMissing(() => this._d3ref
      .select('g.plot')
      .append('line')
      .attr("class", `control-line control-line-mean`),
      `g.plot line.control-line-mean`)
    doIfMissing(() => this._d3ref
      .select('g.plot')
      .append('line')
      .attr("class", `control-line control-line-max`),
      `g.plot line.control-line-max`)
    doIfMissing(() => this._d3ref
      .append('g')
      .attr('class', 'y-axis')
      .append('rect')
      .attr('class', 'y-axis-backdrop'),
      `g.y-axis`)
    doIfMissing(() => this._d3ref
      .select('g.y-axis')
      .append('rect')
      .attr('class', 'y-axis-foredrop'),
      `g.y-axis .y-axis-foredrop`)
    doIfMissing(() => this._d3ref
      .append('g')
      .attr('class', 'x-axis'),
      `g.x-axis`);
    this.renderStage = 2;
  }
  _renderProperties() {
    this._d3ref
      .select('g.plot')
      .attr('transform', `translate(${this.options.padding.left},${this.options.padding.top})`)
    this.options.values.forEach(i => {
      this._d3ref
        .select(`g.plot path.line-${i}`)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5);
    })
    const yAxis = this.yAxis;
    if (this.options.controlLines) {
      const commonLine = (line : d3.Selection<SVGSVGElement, unknown, null, undefined>, y : number) => {
        return line.attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr('x1', 0)
          .attr('x2', this.realWidth - (this.options.padding.right + this.options.padding.left))
          .attr('y1', yAxis(y))
          .attr('y2', yAxis(y))
          .attr('opacity', '1')
      }
      commonLine(this._d3ref.select('g.plot line.control-line-min'), this.options.controlLines.min);
      commonLine(this._d3ref.select('g.plot line.control-line-max'), this.options.controlLines.max);
      commonLine(this._d3ref.select('g.plot line.control-line-mean'), this.options.controlLines.mean);
    } else {
      this._d3ref.selectAll('g.plot path.control-line')
        .attr('opacity', '0')
    }
    this._d3ref
      .select('g.y-axis')
      .attr('transform', `translate(${this.options.padding.left},${this.options.padding.top})`)
      /** 
       * typescript loses some information and forgets that we *are* working in an SVG context
       * we're forced to cast as any (or a complicated Selection<...> type) in order to make it happy
       */
      .call(d3.axisLeft(yAxis) as any); 
    this._d3ref
      .select('g.y-axis rect.y-axis-backdrop')
      .attr('fill', 'white')
      .attr('transform', `translate(${-this.options.padding.left},-${this.options.padding.top})`)
      .attr('width', this.options.padding.left)
      .attr('height', this.realHeight)
    this._d3ref
      .select('g.y-axis rect.y-axis-foredrop')
      .attr('fill', 'white')
      .attr('transform', `translate(${this.realWidth-(this.options.padding.left+this.options.padding.right)},-${this.options.padding.top})`)
      .attr('width', this.options.padding.left)
      .attr('height', this.realHeight)
    this._d3ref
      .select('g.x-axis')
      .attr('transform', `translate(${this.options.padding.left},${this.realHeight - this.options.padding.bottom})`)
      .call(d3.axisBottom(this.xAxisForTick(0)) as any);
    this.renderStage = 3;
  }
  _renderData = () => {
    if (this.renderStage !== 3) {
      throw new Error(`Invalid rendering stage. Aborting render`);
    }
    if (!this._data) {
      return;
    }
    console.log(`[Graph]: rendering data`, this._data);
    const data = this._data;
    const thisTick = Date.now() - this.renderStartTime!;
    const currentXAxis = this.xAxisForTick(this.renderRefTick!);
    const nextXAxis = this.xAxisForTick(thisTick);
    const yAxis = this.yAxis;
    const liveTransition = d3.transition()
      .duration(this.options.liveTickRate)
      .ease(d3.easeLinear);

    this.options.values.forEach(i => {
      this._d3ref
        .select('g.plot')
        .select(`path.line-${i}`)
        .datum(data)
        .attr('d',
          d3.line()
            .x(d => currentXAxis(d[0]))
            .y(d => yAxis(d[i])) as any
        )
        .interrupt()
        .attr('transform', `translate(0, 0)`)
        .transition(liveTransition as any)
        .attr('transform', `translate(${nextXAxis(0) - currentXAxis(0)}, 0)`);
    })
    this._d3ref
      .select('g.x-axis *')
      .interrupt()

    this._d3ref
      .select('g.x-axis')
      .transition(liveTransition as any)
      .call(d3.axisBottom(currentXAxis) as any);
    this.renderRefTick = thisTick
  }
  // TODO: resizeObserver for dynamically repainting graph on layout/bounding box change
  update(newData : { 
    ref ?: SVGSVGElement | null,
    data ?: Record[] | null,
    options ?: Partial<GraphOptions>
  }) {
    if (this._ref !== newData.ref || (newData.options && this.options.values !== newData.options.values)) {
      this.renderStage = 1;
    } else if (this.options !== newData.options) {
      this.renderStage = Math.min(this.renderStage, 2) as RenderStage;
    }
    this._ref = newData.ref === undefined ? this._ref : (newData.ref || undefined);
    this.options = newData.options === undefined ? this.options : { ...this.options, ...newData.options };
    this._data = newData.data === undefined ? this._data : (newData.data || undefined);
    this.render();
  }
  get _d3ref() {
    return d3.select(this._ref!)
  }
  get yAxis() {
    const max = this.options.controlLines
      ? this.options.controlLines.max * 1.1 // TODO configure this
      : (this._data && this._data.length > 0
        ? d3.max(this._data, r => Math.max(...r.filter((_, i) => this.options.values.includes(i))))!
        : 1);
    const min = this.options.controlLines
      ? this.options.controlLines.min * 0.9 // TODO configure this
      : (this._data && this._data.length > 0
        ? d3.min(this._data, r => Math.min(...r.filter((_, i) => this.options.values.includes(i))))!
        : 0);

    const yAxis = d3.scaleLinear()
      .domain([min, max])
      .range([this.realHeight - (this.options.padding.bottom + this.options.padding.top), 0]);
    return yAxis;
  }
  startTime(refTick : number) : number {
    if (this.options.anchor.start) {
      return refTick + this.options.anchor.start;
    } else {
      return this.endTime(refTick) - this.options.anchor.span!;
    }
  }
  endTime(refTick : number) : number {
    if (this.options.anchor.end) {
      if (this.options.anchor.end === LIVE) {
        return this.renderStartTime! + refTick;
      }
      return this.options.anchor.end + refTick;
    } else {
      return refTick + this.options.anchor.start!;
    }
  }
  xAxisForTick(refTick : number) {
    return d3
      .scaleTime()
      .domain([this.startTime(refTick), this.endTime(refTick)])
      .range([0, this.realWidth - (this.options.padding.left + this.options.padding.right)]);
  }
}