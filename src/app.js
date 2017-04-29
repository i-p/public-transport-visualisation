import Cesium from "cesium"
import createStopEntity from "./cesium/createStopEntity"
import createShapeEntity from "./cesium/createShapeEntity"
import createVehicleEntity, { updateVehicles, initUpdateVehicles } from "./cesium/createVehicleEntity"
import options from "./options"
import labelPresenter from "./cesium/labelPresenter";
import UpdateOnceVisualizer from "./cesium/UpdateOnceVisualizer";
import {updateVehicleState} from "./cesium/updateVehicleState";

function init(viewer, transitData, start, stop) {
  console.log(start.toString(), stop.toString());

  let localDate = Cesium.JulianDate.toDate(start);

  let newLocalDate = new Date(localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0);
  let midnight = Cesium.JulianDate.fromDate(newLocalDate);

  const toDate = (secondsOfDay, result) => {
    if (!Cesium.defined(result)) {
      return new Cesium.JulianDate(midnight.dayNumber, midnight.secondsOfDay + secondsOfDay)
    } else {
      //TODO utility method?
      result.dayNumber = midnight.dayNumber;
      result.secondsOfDay = midnight.secondsOfDay + secondsOfDay;
      //trigger recalculation
      Cesium.JulianDate.addSeconds(result, 0, result);
      return result;
    }
  };

  const entities = viewer.entities;

  entities.suspendEvents();

  const initStart = performance.now();

  //console.profile("init");

  var entityMap = new WeakMap();

  var stops = new Cesium.CustomDataSource("stops");
  stops.entities.suspendEvents();

  Array.from(transitData.stops.values()).slice(0).forEach(stop => {
    const entity = stops.entities.add(createStopEntity(stop));
    entityMap.set(stop, entity);
  });

  stops.entities.resumeEvents();

  transitData.shapes.forEach(shape => {
    const entity = entities.add(createShapeEntity(shape));
    entityMap.set(shape, entity);
  });

  //TODO find a better way
  transitData.entityMap = entityMap;

  viewer.dataSources.add(stops);

  viewer.scene.preRender.addEventListener(() => updateVehicles(viewer));

  let updateLabelsPreRender = () => labelPresenter(viewer, transitData);
  viewer.scene.preRender.addEventListener(() => updateLabelsPreRender());

  viewer.vehiclePrimitivesOrderedByStart = [];
  viewer.vehiclePrimitivesOrderedByEnd = [];

  var vehicles = new Cesium.CustomDataSource("vehicles");
  vehicles.entities.suspendEvents();

  transitData.trips.forEach(trip => createVehicleEntity(viewer, vehicles, trip, toDate, transitData));

  vehicles.update = function(time) {
    for (var i=0; i<this.entities.values.length; i++) {
      let entity = this.entities.values[i];
      if (entity.show) {
        updateVehicleState(entity, time, transitData);
      }
    }
    return true;
  };

  modifyEntityClusterBillboardProcessing(transitData.indexSize);

  vehicles.entities.resumeEvents();
  viewer.dataSources.add(vehicles);

  // This must come after viewer.dataSources.add(stops), otherwise the _visualizers field wouldn't be initialized
  const index = stops._visualizers.findIndex(v => v instanceof Cesium.PointVisualizer);
  stops._visualizers[index] = new UpdateOnceVisualizer(stops._visualizers[index]);

  const index2 = stops._visualizers.findIndex(v => v instanceof Cesium.BillboardVisualizer);
  stops._visualizers[index2] = new UpdateOnceVisualizer(stops._visualizers[index2]);

  const tileRange = options.tileRange;

  function isInVisibleTile(carto) {
    //TODO util method
    for (let x = tileRange.xRange[0]; x <= tileRange.xRange[1]; x++) {
      for (let y = tileRange.yRange[0]; y <= tileRange.yRange[1]; y++) {
        //TODO make faster
        let rect = viewer.terrainProvider.tilingScheme.tileXYToRectangle(x, y, tileRange.level);
        if (Cesium.Rectangle.contains(rect, carto)) {
          return true;
        }
      }
    }
    return false;
  }

  viewer.scene.postRender.addEventListener(() => initUpdateVehicles(viewer));

  //console.profileEnd("init");

  entities.resumeEvents();

  console.log(`Initialization completed in ${performance.now() - initStart} ms`);
}

export default { init };

function modifyEntityClusterBillboardProcessing(indexSize) {

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
