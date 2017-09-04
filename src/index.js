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
import {clockTick} from "./redux/actions";
import {
  createCesiumSubscriber, setupCameraAnimationOnTileLoaded, setupOnInputAction,
  setupOnTickAction
} from "./cesium/cesiumStoreSubscriber";
import loadCityData, {loadCityData2} from "./cities/Bratislava"
import { Provider } from "react-redux";
import { Router} from "react-router-dom";
import {createBrowserHistory} from "history";
import {secondsOfDayToDateConverter, VehicleSimulator} from "./utils";
import {calculateTripIndices} from "./loaders/tripLoader";
import View from "./cesium/View";
import initializeCesium from "./initializeCesium";

let store = configureStore({
   time: Cesium.JulianDate.fromDate(new Date()),
   speed: {
     speed: options.defaultSpeed,
     direction: 1
   },
   transitData: new TransitFeed(),
   selection: {
     type: Selection.SELECTION_EMPTY,
     value: null
   }
 });

const history = createBrowserHistory();

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
  Cesium.loadJson("/a.json")
]);


const viewer = initializeCesium();


function createVehicleSimulator(shape, transitData) {
  return new VehicleSimulator({
    points: shape.toPositionArray(transitData.positions),
    distances: shape.distances,
    stepCount: 100,
    wheelbase: 10,
    storeResultPoints: false
  });
}

//TODO add error handling
dataPromise.then(([data2]) => {

  //TODO process warnings
  console.time("Loading transit data");
  const [transitData] = loadCityData2(data2);
  console.timeEnd("Loading transit data");

  window.transitData = transitData;
  window.viewer = viewer;

  _.forEach(transitData.shapes, s => {
    transitData.simulators[s.id] = createVehicleSimulator(s, transitData);
  });

  console.time("Calculating trip indices");
  calculateTripIndices(transitData);
  console.timeEnd("Calculating trip indices");

  transitData.calculateVehiclesInService();

  const view = new View(viewer, transitData);
  const toDate = secondsOfDayToDateConverter(options.start);

  init(viewer, transitData, toDate, store, view, (title, i, total) => {
    //console.log(title, "(" + i + "/" + total + ")");
  });

  store.dispatch(clockTick(viewer.clock.currentTime));

  setupOnInputAction(viewer, store, history);
  setupOnTickAction(viewer, store);

  store.subscribe(createCesiumSubscriber(store, viewer, view));

  setupCameraAnimationOnTileLoaded(viewer, {
    onAnimationStart: () => document.getElementById("loading-overlay").style.display = "none",
    onAnimationEnd: () => store.dispatch({type: "SET_TRANSIT_DATA", data: transitData})
  });
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
