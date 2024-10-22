import Cesium from "cesium"
import createStopEntity from "./cesium/createStopEntity"
import createShapeEntity from "./cesium/createShapeEntity"
import createVehicleEntity, {getVehicleTrip, isVehicleTrip, updateVehiclePositions} from "./cesium/createVehicle"
import updateStopLabelsVisibility from "./cesium/labelPresenter";
import UpdateOnceVisualizer from "./cesium/UpdateOnceVisualizer";
import {updateVehicleState} from "./cesium/updateVehicleState";
import {getSecondsOfDayToDate} from "./utils";
import {loadCityData2} from "./cities/Bratislava";
import {
  createCesiumSubscriber, setupCameraAnimationOnTileLoaded, setupOnInputAction,
  setupOnTickAction
} from "./cesium/cesiumStoreSubscriber";
import View from "./cesium/View";
import {clockTick, setDirection, setTransitData} from "./redux/actions";
import options from "./options";

function createStops(transitData, view, progressCallback) {
  const stops = new Cesium.CustomDataSource("stops");
  stops.entities.suspendEvents();

  console.time("Stop entities");

  Object.values(transitData.stops).slice(0).forEach((stop, i, arr) => {
    progressCallback("Creating stops", i, arr.length);
    const entity = stops.entities.add(createStopEntity(stop, view.textMeasurementsCache.stopNames));
    view.registerEntity(stop, entity);
  });

  console.timeEnd("Stop entities");

  stops.entities.resumeEvents();

  return stops;
}

function createShapes(transitData, view, progressCallback) {
  const shapes = new Cesium.CustomDataSource("shapes");
  shapes.entities.suspendEvents();

  console.time("Shape entities");

  Object.values(transitData.shapes).forEach((shape, i, arr) => {
    progressCallback("Creating routes", i, arr.length);

    const route = transitData.getRouteById(shape.route);
    const entity = shapes.entities.add(createShapeEntity(shape, route));
    view.registerEntity(shape, entity);
  });
  console.timeEnd("Shape entities");
  shapes.entities.resumeEvents();
  return shapes;
}

function createVehicles(transitData, view, primitives, progressCallback) {
  const vehicles = new Cesium.CustomDataSource("vehicles");
  vehicles.entities.suspendEvents();

  console.time("Vehicle entities");

  Object.values(transitData.trips).forEach((trip, i, arr) => {
    progressCallback("Creating vehicles", i, arr.length);

    const shape = transitData.getShapeById(trip.shape);
    const route = transitData.getRouteById(trip.route);

    const primitive = createVehicleEntity(route, shape, trip, view.textMeasurementsCache.routeNames);
    const entity = primitive.id;

    vehicles.entities.add(entity);
    primitives.add(primitive);

    view.registerEntity(trip, entity);
  });

  console.timeEnd("Vehicle entities");

  vehicles.update = function(time) {
    for (let i=0; i<this.entities.values.length; i++) {
      let entity = this.entities.values[i];

      if (entity.show) {
        const shape = transitData.getShapeById(getVehicleTrip(entity).shape);
        updateVehicleState(entity, time, shape);
      }
    }
    return true;
  };

  vehicles.entities.resumeEvents();

  return vehicles;
}

export default function init(viewer, store, history, serializedTransitData, textMeasurementsCache) {
  const secondsOfDayToDate = getSecondsOfDayToDate(options.start);

  //TODO process warnings
  console.time("Loading transit data");
  const [transitData] = loadCityData2(serializedTransitData, secondsOfDayToDate);
  console.timeEnd("Loading transit data");

  window.transitData = transitData;
  window.viewer = viewer;

  const view = new View(viewer, transitData);

  view.textMeasurementsCache = textMeasurementsCache;

  const loadingText = document.getElementById("loading-text");

  initEntities(viewer, transitData, view, (_title, _i, _total) => {
    //console.log(title, "(" + i + "/" + total + ")");
  });

  viewer.scene.preRender.addEventListener(() => updateStopLabelsVisibility(viewer, transitData));
  viewer.scene.preRender.addEventListener(() => updateVehiclePositions(viewer));

  store.dispatch(clockTick(viewer.clock.currentTime));

  setupOnInputAction(viewer, store, history);
  setupOnTickAction(viewer, store);

  store.subscribe(createCesiumSubscriber(store, viewer, view));

  setupCameraAnimationOnTileLoaded(viewer, {
    //TODO DOM shouldn't be accessed here
    onAnimationStart: () => document.getElementById("loading-overlay").style.display = "none",
    onAnimationEnd: () => {
      store.dispatch(setTransitData(transitData));
      store.dispatch(setDirection(1));
    },
    onTilesPreloaded: (count) => {
      loadingText.textContent = "Loading map... " + count;
    }
  });
}

function initEntities(viewer, transitData, view, progressCallback) {
  console.time("Initialization");

  //console.profile("init");

  const stops = createStops(transitData, view, progressCallback);
  viewer.dataSources.add(stops);

  // Points and billboards associated with stops don't need to be updated regularly.
  replaceWithUpdateOnceVisualizer(stops,
                             v => v instanceof Cesium.PointVisualizer
                               || v instanceof Cesium.BillboardVisualizer);

  const shapes = createShapes(transitData, view, progressCallback);
  viewer.dataSources.add(shapes);

  optimizeEntityClusterBillboardProcessing(transitData.indexSize);

  const vehicles = createVehicles(transitData, view, viewer.scene.primitives, progressCallback);

  viewer.dataSources.add(vehicles);

  //console.profileEnd("init");

  console.timeEnd("Initialization");
}

// This function must be called after the dataSource was added
// to the data source collection in Viewer,
// otherwise the _visualizers field wouldn't be initialized.
function replaceWithUpdateOnceVisualizer(dataSource, predicate) {
  let visualizers = dataSource._visualizers;
  for (let i = 0; i < visualizers.length; i++) {
    const visualizer = visualizers[i];
    if (predicate(visualizer)) {
      visualizers[i] = new UpdateOnceVisualizer(visualizer);
    }
  }
}

function optimizeEntityClusterBillboardProcessing(indexSize) {

  // Method removeBillboard which is called from returnPrimitive function in BillboardVisualizer
  // is too expensive. By using precomputed mapping between vehicle entities and associated billboards,
  // this optimization reduced execution time of BillboardVisualizer.update() from 5.4 to 2.1ms.
  let originalRemoveBillboard = Cesium.EntityCluster.prototype.removeBillboard;

  Cesium.EntityCluster.prototype.removeBillboard = function(entity){
    if (!isVehicleTrip(entity)) {
      return originalRemoveBillboard.call(this, entity);
    }

    if (this._billboardCollection) {
      let billboard = this._billboardCollection._billboards[getVehicleTrip(entity).index];

      // Hide billboard only if it's not already used by other vehicle
      if (billboard.id === entity) {
        billboard.show = false;
      }
    }
  };

  let originalGetBillboard = Cesium.EntityCluster.prototype.getBillboard;

  Cesium.EntityCluster.prototype.getBillboard = function(entity){
    if (!isVehicleTrip(entity)) {
      return originalGetBillboard.call(this, entity);
    }

    let collection = this._billboardCollection;
    if (!Cesium.defined(collection)) {
      collection = this._billboardCollection = new Cesium.BillboardCollection({
        scene : this._scene
      });
      for (let i=0; i<indexSize; i++) {
        const billboard = collection.add();
        billboard.show = true;
      }
    }
    return collection.get(getVehicleTrip(entity).index);
  };
}
