import React from 'react';
import { Record, SourceMetadata, TimeAnchor } from './types';
import './graph-frame.scss';
import { ControlLines, Graph, GraphOptions } from './graph';

type LiveGraphProps = {
  title ?: string,
  values: number[]
  isLoading: boolean
  data?: Record[]
  anchor?: TimeAnchor,
  options?: Partial<GraphOptions>
  metadata?: SourceMetadata[]
}
export class LiveGraph extends React.Component<LiveGraphProps> {
  static defaultProps = {
    isLoading: true
  }
  constructor(props: LiveGraphProps) {
    super(props);
    this.graph = new Graph({
      controlLines: this.getControlLines(),
      ...(props.options || {}),
      anchor: this.props.anchor,
      values: this.props.values,
    });
  }
  getControlLines(): ControlLines | undefined {
    if (this.props.metadata && this.props.values.length > 0) {
      const metadataToConsider = this.props.metadata.filter((_, i) => this.props.values.includes(i + 1));
      const max = Math.min(...metadataToConsider.map(m => m.max))
      const min = Math.max(...metadataToConsider.map(m => m.min))
      const mean = metadataToConsider.reduce((sum, m) => sum + m.mean, 0) / metadataToConsider.length;
      if (min >= max || min >= mean || max <= mean) {
        console.error(`Invalid dataset properties: ${JSON.stringify(this.props.metadata)}`);
      }
      return {
        min, max, mean
      }
    }
    return undefined;
  }
  graph: Graph;
  shouldComponentUpdate(newProps: LiveGraphProps): boolean {
    console.log(`[LiveGraph]: Got updated updated props`, newProps);
    this.graph.update({
      data: newProps.data,
      options: { 
        controlLines: this.getControlLines(),
        values: newProps.values,
        anchor: newProps.anchor,
        ...newProps.options
      }
    });
    return true;
  }
  updateRef = (ref: SVGSVGElement): void => {
    this.graph.update({ ref });
  }
  render() {
    // TODO: make a loading icon
    return <div className="graph">
      <span className="graph-header">{this.props.title}</span>
      <svg ref={this.updateRef}> </svg>
    </div>
  }
}