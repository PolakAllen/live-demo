
import React from 'react';
import ReactDOM from 'react-dom';
import {LiveGraph} from '../livegraph/graph-frame.tsx';
import {DataContext} from '../livegraph/data-frame.tsx';

ReactDOM.render(
  <React.StrictMode>
    <p>Hello World</p>
    <DataContext>
      <LiveGraph />
    </DataContext>
  </React.StrictMode>,
  document.getElementById('root')
);
