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
import showCustomTileRange from "./cesium/selectDisplayedTileRange";
import app from "./app";
import {clockTick} from "./redux/actions";
import {selectEntity} from "./redux/actions";
import {selectNothing} from "./redux/actions";
import {createCesiumSubscriber} from "./cesium/cesiumStoreSubscriber";
import loadCityData, {loadCityData2} from "./cities/Bratislava"
import { Provider } from "react-redux";
import { Router} from "react-router-dom";
import {createBrowserHistory} from "history";
import {VehicleSimulator} from "./utils";
import {calculateTripIndices} from "./loaders/tripLoader";
import View from "./cesium/View";

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

//TODO FIX
window.CESIUM_BASE_URL = "http://localhost:8000/Cesium/";

//console.profile("startup");

Cesium.BingMapsApi.defaultKey = "AjCgBPI90qGuC4qk0K75MVgl6HCdbVkH_r7jJWtiPq8VBmcb74aGvUOekz-7hBuE";

const tileRange = options.tileRange;
// const imageryProvider = new Cesium.BingMapsImageryProvider({
//   url: "//dev.virtualearth.net"
// });
const imageryProvider = new Cesium.MapboxImageryProvider({
  mapId: 'mapbox.streets'
});


imageryProvider.readyPromise.then(() => {
  for (let x = tileRange.xRange[0]; x <= tileRange.xRange[1]; x++) {
    for (let y = tileRange.yRange[0]; y <= tileRange.yRange[1]; y++) {
      imageryProvider.requestImage(x, y, tileRange.level);
    }
  }
});

//TODO specify base path
const dataPromise = Promise.all([
  // Cesium.loadJson("/data.json"),
  // Cesium.loadJson("/timetables.json"),
  Cesium.loadJson("/a.json")
]);

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrainExaggeration: options.terrainExaggeration,
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: true,
  timeline: false,
  navigationHelpButton: true,
  scene3DOnly: true,

  skyAtmosphere: false,
  imageryProvider,

  creditContainer: "credits"
});

if (options.displayTileCoordinates) {
  viewer.imageryLayers.add(new Cesium.ImageryLayer(new Cesium.TileCoordinatesImageryProvider()));
}

//TODO move value to options
viewer.camera.setView({destination: new Cesium.Cartesian3(9075216.322398473, 1601349.1706513234, 8430794.265876785) });

viewer.scene.fxaa = false;

viewer.scene.skyBox.show = false;
viewer.scene.sun.show = false;
viewer.scene.screenSpaceCameraController.enableLook = false;

//TODO separate module
viewer.clock.startTime = options.start.clone();
viewer.clock.stopTime = options.stop.clone();
viewer.clock.currentTime = options.current.clone();
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.multiplier = options.defaultSpeed;

var terrainProvider = new Cesium.CesiumTerrainProvider({
  url : "https://assets.agi.com/stk-terrain/world"
  //requestVertexNormals: true
});






if (options.tileRange.enabled) {
  showCustomTileRange(viewer, options.tileRange);
}

viewer.terrainProvider = terrainProvider;

//viewer.scene.globe.enableLighting = true;


viewer.scene.debugShowFramesPerSecond = options.showFramesPerSecond;


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

  _.forEach(transitData.shapes, s => {
    transitData.simulators[s.id] = createVehicleSimulator(s, transitData);
  });

  console.time("Calculating trip indices");
  calculateTripIndices(transitData);
  console.timeEnd("Calculating trip indices");

  transitData.calculateVehiclesInService();

  const view = new View(viewer, transitData);

  app.init(viewer, transitData, options.start, options.stop, store, view, (title, i, total) => {
    //console.log(title, "(" + i + "/" + total + ")");
  });

  store.dispatch(clockTick(viewer.clock.currentTime));


  viewer.screenSpaceEventHandler.setInputAction((e) => {
    let picked = viewer.scene.pick(e.position)

    if (Cesium.defined(picked)) {
      var id = Cesium.defaultValue(picked.id, picked.primitive.id);

      if (id instanceof Cesium.Entity && id.transit && id.transit.type === "stop") {
        history.push("/stop/" + id.transit.stop.id);
        return;
      }

      if (id instanceof Cesium.Entity && id.transit && id.transit.trip) {
        history.push("/trip/" + id.transit.trip.id);
        return;
      }

      if (id instanceof Cesium.Entity) {
        store.dispatch(selectEntity(id));
        return;
      }
      if (id && id.type) {
        store.dispatch(selectEntity({transit: id}));
        return;
      }
    }
    history.push("/");
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  viewer.clock.onTick.addEventListener(clock => {
    store.dispatch(clockTick(clock.currentTime.clone()));
  });

  window.viewer = viewer;
  window.transitData = transitData;

  store.subscribe(createCesiumSubscriber(store, viewer, view));

  let initialCameraAnimationStarted = false;

  viewer.scene.globe.tileLoadProgressEvent.addEventListener((length) => {
    if (length === 0 && !initialCameraAnimationStarted) {
      initialCameraAnimationStarted = true;

      viewer.camera.flyTo({
        destination: options.initialCameraView.destination,
        orientation: options.initialCameraView.orientation,
        duration: 3,
        complete: () => {
          store.dispatch({type: "SET_TRANSIT_DATA", data: transitData});
        }
      });
    }
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
