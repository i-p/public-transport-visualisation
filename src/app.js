import Cesium from "cesium"
import createStopEntity from "./cesium/createStopEntity"
import createShapeEntity from "./cesium/createShapeEntity"
import createVehicleEntity, { updateVehicles, initUpdateVehicles } from "./cesium/createVehicleEntity"
import options from "./options"
import labelPresenter from "./cesium/labelPresenter";
import UpdateOnceVisualizer from "./cesium/UpdateOnceVisualizer";
import {updateVehicleState} from "./cesium/updateVehicleState";
import { Route } from "./models/Route";
import View from "./cesium/View";
import {getMidnight, secondsOfDayToDateConverter} from "./utils";


function createStops(transitData, view, progressCallback) {
  const stops = new Cesium.CustomDataSource("stops");
  stops.entities.suspendEvents();

  console.time("Stop entities");

  Object.values(transitData.stops).slice(0).forEach((stop, i, arr) => {
    progressCallback("Creating stops", i, arr.length);
    const entity = stops.entities.add(createStopEntity(stop));
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
    const entity = shapes.entities.add(createShapeEntity(shape));
    view.registerEntity(shape, entity);
  });
  console.timeEnd("Shape entities");
  shapes.entities.resumeEvents();
  return shapes;
}

function createVehicles(transitData, toDate, progressCallback) {
  const vehicles = new Cesium.CustomDataSource("vehicles");
  vehicles.entities.suspendEvents();

  console.time("Vehicle entities");

  Object.values(transitData.trips).forEach((trip, i, arr) => {
    progressCallback("Creating vehicles", i, arr.length);
    return createVehicleEntity(viewer, vehicles, trip, toDate, transitData);
  });

  console.timeEnd("Vehicle entities");

  vehicles.update = function(time) {
    for (let i=0; i<this.entities.values.length; i++) {
      let entity = this.entities.values[i];
      if (entity.show) {
        updateVehicleState(entity, time, transitData);
      }
    }
    return true;
  };

  vehicles.entities.resumeEvents();

  return vehicles;
}

export default function init(viewer, transitData, toDate, store, view, progressCallback) {
  console.time("Initialization");
  
  //console.profile("init");

  const stops = createStops(transitData, view, progressCallback);
  viewer.dataSources.add(stops);

  // This must come after viewer.dataSources.add(stops), otherwise the _visualizers field wouldn't be initialized
  setupUpdateOnceVisualizers(stops,
                             v => v instanceof Cesium.PointVisualizer
                               || v instanceof Cesium.BillboardVisualizer);

  const shapes = createShapes(transitData, view, progressCallback);
  viewer.dataSources.add(shapes);

  viewer.scene.preRender.addEventListener(() => labelPresenter(viewer, transitData));
  viewer.scene.preRender.addEventListener(() => updateVehicles(viewer));

  optimizeEntityClusterBillboardProcessing(transitData.indexSize);

  const vehicles = createVehicles(transitData, toDate, progressCallback);

  viewer.dataSources.add(vehicles);

  //console.profileEnd("init");

  console.timeEnd("Initialization");
}

function setupUpdateOnceVisualizers(dataSource, predicate) {
  let visualizers = dataSource._visualizers;
  for (let i = 0; i < visualizers.length; i++) {
    const visualizer = visualizers[i];
    if (predicate(visualizer)) {
      visualizers[i] = new UpdateOnceVisualizer(visualizer);
    }
  }
}

function optimizeEntityClusterBillboardProcessing(indexSize) {

  // Method removeBillboard called from returnPrimitive function in BillboardVisualizer was too expensive.
  // By using precomputed mapping between entities and billboards
  // this optimization reduced time of BillboardVisualizer.update() from 5.4 to 2.1ms.
  let originalRemoveBillboard = Cesium.EntityCluster.prototype.removeBillboard;

  Cesium.EntityCluster.prototype.removeBillboard = function(entity){
    if (!(entity.transit && entity.transit.trip)) {
      return originalRemoveBillboard.call(this, entity);
    }

    if (this._billboardCollection) {
      let billboard = this._billboardCollection._billboards[entity.transit.trip.index];

      // Hide billboard only if it's not already used by other entity
      if (billboard.id === entity) {
        billboard.show = false;
      }
    }
  };

  let originalGetBillboard = Cesium.EntityCluster.prototype.getBillboard;

  Cesium.EntityCluster.prototype.getBillboard = function(entity){

    if (!(entity.transit && entity.transit.trip)) {
      return originalGetBillboard.call(this, entity);
    }

    let collection = this._billboardCollection;
    if (!Cesium.defined(collection)) {
      collection = this._billboardCollection = new Cesium.BillboardCollection({
        scene : this._scene
      });
      for (var i=0; i<indexSize; i++) {
        const billboard = collection.add();
        billboard.show = true;
      }
    }

    return collection.get(entity.transit.trip.index);
  };
}
