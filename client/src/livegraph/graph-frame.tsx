import React from 'react';
import * as d3 from 'd3';
import { GraphData } from './data';

type GraphOptions = {
    pointsToDisplay : number | ((this: Graph) => number)
    padding: { 
        bottom: number, 
        left: number,
        right: number,
        top: number,
    },
    liveTickRate : number,
    isLive : boolean,
    thresholds: {
        lower?: number[],
        uppper?: number[]
    }
}
class Graph {
    static defaultOptions : GraphOptions = {
        pointsToDisplay : 20,
        padding: {
            bottom: 20,
            left: 40,
            right: 10,
            top: 10
        },
        liveTickRate : 5000,
        isLive : true,
        thresholds: {},
    }
    constructor(options : Partial<GraphOptions>) {
        this.options = { ...Graph.defaultOptions, ...options };
        this.initialized = false;
    }
    _ref ?: SVGSVGElement;
    _data ?: GraphData
    initialized : boolean;
    options : GraphOptions;
    renderLoopRef ?: ReturnType<typeof setInterval>;
    lastLiveTick ?: number;
    get realWidth() {
        return 500;
    }
    get realHeight() {
        return 500;
    }
    set ref(newRef : SVGSVGElement | undefined) {
        console.log(`Got new ref`, newRef)
        if (newRef !== this._ref && newRef !== undefined) {
            this._ref = newRef;
            if (this.renderLoopRef !== undefined) {
                clearInterval(this.renderLoopRef)
            }
            if (!this.initialized) {
                console.log(`Initializing`)
                this.initialize();
            }
            if (this.options.isLive) {
                console.log(`Starting live render`)
                this.renderLoopRef = setInterval(this.render, this.options.liveTickRate);
            } else {
                console.log(`Starting single render`)
                this.render();
            }
        } else {
            this._ref = newRef;
        }
    }
    get ref() {
        return this._ref;
    }
    set data(data : GraphData | undefined) {
        this._data = data;
        // TODO: re-render when not live
    }
    get data() : GraphData | undefined {
        return this._data;
    }
    initialize() : void {
        if (!this.ref) {
            throw new Error(`Invalid initialization`);
        }
        d3.select(this.ref)
            .append('g')
            .attr('class', 'xAxis')
            .attr('transform', `translate(${this.options.padding.left},${this.realHeight - this.options.padding.bottom})`)
        d3.select(this.ref)
            .append('g')
            .attr('class', 'yAxis')
            .attr('transform', `translate(${this.options.padding.left},${this.options.padding.top})`)
        d3.select(this.ref)
            .append('g')
            .attr('class', 'plot')
            .attr('transform', `translate(${this.options.padding.left},${this.options.padding.top})`)
        this.initialized = true;
        console.log(`Initialized onto`, this.ref);
    }
    render = () : void => {
        if (!this.ref) { 
            console.log(`aborting render, no ref found`)
            return; 
        }
        if (!this.data) {
            // TODO: clear
            console.log(`aborting render, no data found`)
            return;
        }
        const data = this.data;
        console.log(`render started`, data, this.ref)
        const thisTick = Date.now();
        const [ xAxis, yAxis ] = this.scales(thisTick);
        const points = d3.select(this.ref).select('g.plot')
            .selectAll('circle')
            .data(data);
        points.exit()
            .remove();
        // TODO: only ease when live?
        const constantTime = d3.transition()
            .duration(this.options.liveTickRate)
            .ease(d3.easeLinear);
        // points
        //     .transition(d3.transition().duration(500))
        points
            // only ease across time axis
            .attr('cy', d => yAxis(d[1]))
            .transition(constantTime)
            .attr('cx', d => xAxis(d[0]));
        points.enter()
            .append('circle')
            .attr('r', 5)
            .attr('fill', 'blue')
            .attr('cy', d => yAxis(d[1]))
            .attr('cx', d => (this.scales(this.lastLiveTick || (thisTick - 5000))[0])(d[0]))
            .transition(constantTime)
            .attr('cx', d => xAxis(d[0]));
        d3.select(this.ref)
            .select('g.xAxis')
            .transition(constantTime)
            .call(d3.axisBottom(xAxis).ticks(5))
        d3.select(this.ref)
            .select('g.yAxis')
            .transition(constantTime)
            .call(d3.axisLeft(yAxis).ticks(20))
        const finished = Date.now();
        console.log(`Render complete (render time ${finished - thisTick}ms)(waited ${thisTick - this.lastLiveTick}ms)`)
        this.lastLiveTick = thisTick
    }
    scales(thisTick : number) {
        const xAxis = d3
            .scaleTime()
            .domain([thisTick - 60 * 1000, thisTick])
            .range([0, this.realWidth - (this.options.padding.left + this.options.padding.right)]);
        const max = d3.max(this.data, ([_, v]) => v);
        const yAxis = d3.scaleLinear()
            .domain([0, max])
            .range([this.realHeight - (this.options.padding.bottom + this.options.padding.top), 0]);
        return [xAxis, yAxis];
    }
}
type LiveGraphProps = {
    data: GraphData
}
export class LiveGraph extends React.Component<LiveGraphProps> {
    constructor(props : LiveGraphProps) {
        super(props);
        this.graph = new Graph({});
    }
    graph : Graph;
    shouldComponentUpdate(newProps : LiveGraphProps) : boolean {
        if (newProps.data !== this.props.data) {
            this.graph.data = newProps.data;
        }
        return false;
    }
    updateRef = (ref : SVGSVGElement) : void => {
        this.graph.ref = ref;
    }
    render() {
        return <svg width={500} height={500} ref={this.updateRef}> </svg>
    }
}