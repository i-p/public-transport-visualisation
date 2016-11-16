import 'core-js/fn/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import App from './components/Main';

// Render the main component into the dom
ReactDOM.render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.getElementById('app'));

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/Main', () => {
    const NextApp = require('./components/Main').default;
    ReactDOM.render(
      <AppContainer>
        <NextApp/>
      </AppContainer>,
      document.getElementById('app')
    );
  });
}
