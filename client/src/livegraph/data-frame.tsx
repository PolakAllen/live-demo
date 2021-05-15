import React from 'react';
import { GraphData } from './data';
import { dataFeed } from './socket.ts';

type DataContextProps = {
  children: React.ReactElement | React.ReactElement[]
};
export class DataContext extends React.Component<DataContextProps, { data: GraphData }> {
  socket ?: WebSocket;
  constructor(props : DataContextProps) {
    console.log(`creating DataContext component`)
    super(props);
    this.state = { data: [] };
  }
  componentDidMount() {
    console.log(`mounting DataContext component`)
    if (this.socket) {
      throw new Error(`No remounting allowed`);
    }
    this.socket = dataFeed((newData : GraphData) => {
      this.setState({ data: newData });
    })
  }
  componentWillUnmount() {
    this.socket && this.socket.close();
  }
  render() {
    const data = this.state.data;
    console.log(`re-rendering DataFrame`);
    return React.Children.map(this.props.children, (child : React.ReactElement) => 
      React.cloneElement(child, { data })
    );
  }
}