import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from 'src/App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'src/custom.css';

const rootElement = document.getElementById('root');

const app = (
  <StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </StrictMode>
);

// react-snap prerenders each route to static HTML at build time; when the app
// boots against that prerendered markup we hydrate it instead of throwing it
// away and re-rendering from scratch. On a cold (non-prerendered) load #root is
// empty and we render normally.
if (rootElement?.hasChildNodes()) {
  ReactDOM.hydrate(app, rootElement);
} else {
  ReactDOM.render(app, rootElement);
}
