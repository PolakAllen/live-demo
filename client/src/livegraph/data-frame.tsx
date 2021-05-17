import React from 'react';
import { LIVE, Record, RecordSourceName, RequestOptions, SourceMetadata } from './types';
import { dataFeed } from './socket';

type DataContextProps = RequestOptions & {
  recordSourceName: string,
  children: React.ReactElement | React.ReactElement[]
};
export type DataContextState = {
  metadata ?: SourceMetadata[],
  data ?: Record[],
  isLoading : boolean,
}
export class DataContextHoc extends React.Component<DataContextProps, DataContextState> {
  socket ?: WebSocket;
  static defaultProps = {
    line: 0,
    anchor: {
      span: 1000 * 60 * 1,
      end: LIVE
    }
  }
  constructor(props : DataContextProps) {
    super(props);
    this.state = { isLoading: true };
  }
  shouldComponentUpdate(newProps : DataContextProps, nextState : DataContextState) {
    if (newProps.line !== this.props.line || newProps.anchor !== this.props.anchor) {
      this.connect();
      return true;
    }
    if (nextState.data !== this.state.data || nextState.metadata !== this.state.metadata || nextState.isLoading !== this.state.isLoading) {
      return true;
    }
    return false;
  }
  componentDidMount() {
    if (this.socket) {
      throw new Error(`No remounting allowed`);
    }
    this.connect();
  }
  componentWillUnmount() {
    this.disconnect();
  }
  disconnect() {
    this.socket && this.socket.close();
    this.setState({ 
      metadata: undefined,
      data: undefined,
      isLoading: true
    })
  }
  get startTime() {
    if (this.props.anchor.start) {
      return this.props.anchor.start
    } else {
      if (this.props.anchor.end === LIVE) {
        return Date.now() - this.props.anchor.span!;
      }
      return this.props.anchor.end! - this.props.anchor.span!
    }
  }
  connect() {
    this.disconnect();
    const data : Record[] = [];
    console.log(`Generated data source`, data);
    this.setState({ isLoading: true, data })
    // TODO make this a re-request on an existing socket, rather than
    // making a new one every time
    // OR better yet, make a centeralized data handler
    this.socket = dataFeed(this.props, 
      (newData : Record, name : RecordSourceName) => {
        if (name === this.props.recordSourceName) {
          // TODO: make this arbitrary minus scale based off of the time span
          // (it's to ensure data doesn't disappear of the graph while in visual range)
          const startTime = this.startTime - (1000 * 30);
          let removeTo = 0;
          while (removeTo < data.length && data[removeTo][0] < startTime) {
            removeTo += 1;
          }
          data.splice(0, removeTo);
          data.push(newData);
        }
      }, (metadata : SourceMetadata[], name : RecordSourceName) => {
        if (name === this.props.recordSourceName) {
          this.setState({ metadata })
        }
      }, () => {
        this.setState({ isLoading: false })
      }
    )
  }
  render() {
    const { anchor } = this.props;
    const { isLoading, data, metadata } = this.state;
    return React.Children.map(this.props.children, (child : React.ReactElement) => 
      React.cloneElement(child, { isLoading, data, metadata, anchor })
    );
  }
}
