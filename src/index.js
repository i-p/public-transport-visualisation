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
import { Provider } from "react-redux";
import { Router} from "react-router-dom";
import {createBrowserHistory, createHashHistory} from "history";
import initializeCesium from "./initializeCesium";

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

//console.profile("startup");

//TODO specify base path
const dataPromise = Promise.all([
  // Cesium.loadJson("/data.json"),
  // Cesium.loadJson("/timetables.json"),
  Cesium.loadJson("data_processed.json"),
  Cesium.loadJson("textMeasurementsCache.json")
]);


const viewer = initializeCesium();

//TODO add error handling
dataPromise.then(([data2, textMeasurementsCache]) => {
  init(viewer, store, history, data2, textMeasurementsCache);
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
