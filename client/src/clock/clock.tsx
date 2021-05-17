import React from 'react';
import moment from 'moment';

export class Clock extends React.Component {
  updateRefHandle ?: ReturnType<typeof setInterval>;
  componentDidMount() {
    this.updateRefHandle = setInterval(() => {
      this.forceUpdate();
    }, 500);
  }
  componentWillUnmount() {
    this.updateRefHandle && clearTimeout(this.updateRefHandle);
  }
  render() {
    return <div className={`clock`}>{
      moment().format(`hh:mm:ss`)
    }</div>
  }
}
