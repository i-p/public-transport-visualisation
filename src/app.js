import Cesium from "cesium"
import createStopEntity from "./cesium/createStopEntity"
import createShapeEntity from "./cesium/createShapeEntity"
import createVehicleEntity, { updateVehicles, initUpdateVehicles } from "./cesium/createVehicleEntity"
import options from "./options"
import labelPresenter from "./cesium/labelPresenter";

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

  Array.from(transitData.stops.values()).slice(0).forEach(stop => {
    const entity = entities.add(createStopEntity(stop));
    entityMap.set(stop, entity);
  });

  transitData.shapes.forEach(shape => {
    const entity = entities.add(createShapeEntity(shape));
    entityMap.set(shape, entity);
  });

  //TODO find a better way
  transitData.entityMap = entityMap;

  viewer.scene.preRender.addEventListener(() => updateVehicles(viewer));

  let updateLabelsPreRender = () => labelPresenter(viewer, transitData);
  viewer.scene.preRender.addEventListener(() => updateLabelsPreRender());

  viewer.vehiclePrimitivesOrderedByStart = [];
  viewer.vehiclePrimitivesOrderedByEnd = [];

  transitData.trips.forEach(trip => createVehicleEntity(viewer, trip, toDate));

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

