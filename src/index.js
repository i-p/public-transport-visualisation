import 'core-js/fn/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import AppLayout from './components/AppLayout';
import Cesium from 'cesium';
import configureStore from "./redux/configureStore";
import * as Selection from "./models/selectionTypes";
import {TransitFeed} from "./models/TransitFeed";
import options from "./options";
import init from "./app";
import {Provider} from "react-redux";
import {Router} from "react-router-dom";
import {createHashHistory} from "history";
import initializeCesium from "./initializeCesium";

function notifyUserOfError() {
  document.getElementById("loading-overlay").style.display = "visible";
  document.getElementById("loading-text").textContent = "Sorry, something went wrong!";
}

window.addEventListener("error", function(e) {
  console.error(e.message, e.error);
  notifyUserOfError();
});

let store = configureStore({
   time: Cesium.JulianDate.fromDate(new Date()),
   speed: {
     speed: options.defaultSpeed,
     direction: 0
   },
   transitData: new TransitFeed(),
   selection: {
     type: Selection.SELECTION_EMPTY,
     value: null
   }
 });

const history = createHashHistory();

ReactDOM.render(
  <AppContainer>
    <Provider store={store}>
      <Router history={history}>
        <AppLayout />
      </Router>
    </Provider>
  </AppContainer>,
  document.getElementsByTagName("main")[0]);

const dataPromise = Promise.all([
  Cesium.loadJson("data_processed.json"),
  Cesium.loadJson("textMeasurementsCache.json")
]);

const viewer = initializeCesium();

dataPromise.then(([data2, textMeasurementsCache]) => {
  init(viewer, store, history, data2, textMeasurementsCache);
}).catch(err => {
  console.error("Failed to initialize visualisation", err);
  notifyUserOfError();
});

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/AppLayout', () => {
    const NextAppLayout = require('./components/AppLayout').default;
    ReactDOM.render(
      <AppContainer>
        <Provider store={store}>
          <Router history={history}>
            <NextAppLayout />
          </Router>
        </Provider>
      </AppContainer>,
      document.getElementsByTagName("main")[0]);
  });
}
