
import React from 'react';
import ReactDOM from 'react-dom';
import {LiveGraph} from '../livegraph/graph-frame';
import {DataContextHoc} from '../livegraph/data-frame';
import { Clock } from '../clock/clock';
import { LIVE } from '../livegraph/types';

ReactDOM.render(
  <React.StrictMode>
    <div className={`content`}>
      <div className={`header`}>
        <h2>Live demo</h2>
        <Clock />
      </div>
      <p>Real moving fake data for your viewing pleasure.</p>
      <div className={`graphs`}>
        <DataContextHoc recordSourceName={"Internal Sensors"}>
          <LiveGraph values={[1,2]} title={'Tempature Sensor Data (LIVE)'}/>
        </DataContextHoc>
        <DataContextHoc recordSourceName={"Measurements"} anchor={{
          span: 1000*60*30,
          end: LIVE
        }}>
          <LiveGraph values={[1]} title={'Measurement a1Length (LIVE)'} />
        </DataContextHoc>
        <DataContextHoc recordSourceName={"Measurements"} anchor={{
          span: 1000*60*30,
          end: new Date('2021-05-13T08:00:00').valueOf()
        }}>
          <LiveGraph values={[2]} title={'Measurement a2Length (2021-05-13 8 AM)'}/>
        </DataContextHoc>
        <DataContextHoc recordSourceName={"Measurements"}>
          <LiveGraph values={[3]} title={'Measurement c1Length (LIVE)'} />
        </DataContextHoc>
      </div>
    </div>
  </React.StrictMode>,
  document.getElementById('root')
);
