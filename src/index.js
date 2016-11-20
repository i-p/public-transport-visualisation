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
import selectDisplayedTileRange from "./cesium/selectDisplayedTileRange";
import app from "./app";
import {clockTick} from "./redux/actions";
import {selectEntity} from "./redux/actions";
import {selectNothing} from "./redux/actions";
import {createCesiumSubscriber} from "./cesium/cesiumStoreSubscriber";
import loadCityData from "./cities/Bratislava"
import { Provider } from "react-redux";

let store = configureStore({
   time: Cesium.JulianDate.fromDate(new Date()),
   speed: options.defaultSpeed,
   transitData: new TransitFeed(),
   selection: {
     type: Selection.SELECTION_EMPTY,
     value: null
   }
 });

ReactDOM.render(
  <AppContainer>
    <Provider store={store}>
      <AppLayout />
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

const dataPromise = Promise.all([
  Cesium.loadJson("data.json"),
  Cesium.loadJson("timetables.json")
]);

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrainExaggeration: options.terrainExaggeration,
  animation: false,
  baseLayerPicker: false,
  //TODO add custom
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: true,
  timeline: false,
  //TODO create custom?
  navigationHelpButton: true,
  scene3DOnly: true,

  skyAtmosphere: false,
  imageryProvider,

  creditContainer: "credits"
});

if (options.displayTileCoordinates) {
  viewer.imageryLayers.add(new Cesium.ImageryLayer(new Cesium.TileCoordinatesImageryProvider()));
}

viewer.camera.setView(options.initialCameraView);

viewer.scene.fxaa = false;

viewer.scene.skyBox.show = false;
viewer.scene.sun.show = false;
viewer.scene.screenSpaceCameraController.enableLook = false;

//TODO separate module
viewer.clock.startTime = options.start.clone();
viewer.clock.stopTime = options.stop.clone();
viewer.clock.currentTime = options.start.clone();
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.multiplier = options.defaultSpeed;

var terrainProvider = new Cesium.CesiumTerrainProvider({
  url : "https://assets.agi.com/stk-terrain/world"
  //requestVertexNormals: true
});




function isInTileRange(tileRange, xx, yy, level) {
  const x = (xx >> (level - tileRange.level)) | 0;
  const y = (yy >> (level - tileRange.level)) | 0;

  if (x >= tileRange.xRange[0] && x <= tileRange.xRange[1]) {
    if (y >= tileRange.yRange[0] && y <= tileRange.yRange[1]) {

      const maskRow = tileRange.mask[y - tileRange.yRange[0]];
      const maskChar = maskRow[x - tileRange.xRange[0]];

      if (maskChar === " ") {
        return true;
      }
    }
  }
  return false;
}

var originalGetTileDataAvailable = Cesium.CesiumTerrainProvider.prototype.getTileDataAvailable;

terrainProvider.getTileDataAvailable = function(x, y, level) {
  if (isInTileRange(tileRange, x, y, level)) {
    return originalGetTileDataAvailable.call(this, x, y, level);
  }
  return false;
};


viewer.terrainProvider = terrainProvider;

//viewer.scene.globe.enableLighting = true;


viewer.scene.debugShowFramesPerSecond = options.showFramesPerSecond;

if (options.tileRange.enabled) {
  viewer.terrainProvider.readyPromise.then(() => {
    selectDisplayedTileRange(viewer, tileRange);
  });
}

dataPromise.then(([data, routeTimetables]) => {

  //TODO process warnings
  const [transitData] = loadCityData(data, routeTimetables);

  window.transitData = transitData;

  app.init(viewer, transitData, options.start, options.stop);

  store.dispatch(clockTick(viewer.clock.currentTime));
  store.dispatch({type: "SET_TRANSIT_DATA", data: transitData});

  viewer.screenSpaceEventHandler.setInputAction((e) => {
    let picked = viewer.scene.pick(e.position)

    if (Cesium.defined(picked)) {
      var id = Cesium.defaultValue(picked.id, picked.primitive.id);
      if (id instanceof Cesium.Entity) {
        store.dispatch(selectEntity(id));
        return;
      }
      if (id && id.type) {
        store.dispatch(selectEntity({transit: id}));
        return;
      }
    }
    store.dispatch(selectNothing());
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  viewer.clock.onTick.addEventListener(clock => {
    store.dispatch(clockTick(clock.currentTime.clone()));
  });

  window.viewer = viewer;
  window.transitData = transitData;

  store.subscribe(createCesiumSubscriber(store, viewer));
});

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/AppLayout', () => {
    const NextAppLayout = require('./components/AppLayout').default;
    ReactDOM.render(
      <AppContainer>
        <Provider store={store}>
          <NextAppLayout />
        </Provider>
      </AppContainer>,
      document.getElementsByTagName("main")[0]);
  });
}
