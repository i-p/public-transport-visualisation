import Cesium from "cesium"
import {updateVehicleState} from "./updateVehicleState";
import {Trip} from "../models/Trip";

const scale = 3;
const [height] = [2.0];
const polylineHeightAboveGround = 1;
const zOffset = (height / 2) * scale + polylineHeightAboveGround;

const ENTITY_VIEWFROM_PROPERTY =  new Cesium.ConstantProperty(new Cesium.Cartesian3(0, -300, 300));

const billboardCache = new Map();

const colorsByType = {
  "bus": "#0E6BB0",
  "tram": "#C23030",
  "trolleybus": "#007C1E"
};

function toAvailability(speedProfile) {
  const availability = new Cesium.TimeIntervalCollection();

  const interval = new Cesium.TimeInterval();
  Cesium.JulianDate.clone(speedProfile._startTime, interval.start);
  Cesium.JulianDate.clone(speedProfile._endTime, interval.stop);

  interval.isStartIncluded = true;
  interval.isStopIncluded = false;

  availability.addInterval(interval);

  return availability;
}

function createVehicleBillboard(route) {
  if (billboardCache.has(route.id)) {
    return billboardCache.get(route.id);
  } else {
    let canvas = Cesium.writeTextToCanvas(route.id, {
      // don't use custom font here, it doesn't have to be loaded yet
      font: "24px 'Verdana' ",
      padding: 6,
      fillColor: Cesium.Color.WHITE,
      //TODO FIX
      backgroundColor: Cesium.Color.fromCssColorString(colorsByType[route.getType()])
    });

    let bg = new Cesium.BillboardGraphics({
                                            scale: 0.5,
                                            image: canvas,
                                            pixelOffset : LABEL_PIXEL_OFFSET_PROPERTY,
                                            distanceDisplayCondition: LABEL_DISTANCE_DISPLAY_CONDITION_PROPERTY,
                                            eyeOffset: LABEL_EYE_OFFSET_PROPERTY
                                          });
    billboardCache.set(route.id, bg);
    return bg;
  }
}

function createVehicleEntity(positionProperty, trip, speedProfile, vehicleState, route) {

  const propertyWithOffset = (zOffset, property) => new Cesium.CallbackProperty((time, result) => {
    let value = property.getValue(time, result);
    if (Cesium.defined(value)) {
      value.z += zOffset;
    }
    return value;
  }, false);

  //TODO do it with model matrix transformation
  let actualPosition = propertyWithOffset(zOffset, positionProperty);

  const entity = new Cesium.Entity();

  entity._availability = toAvailability(speedProfile);
  entity._name = trip.route;
  entity._position = actualPosition;
  entity._orientation = new Cesium.CallbackProperty((time, result) => {
    //TODO check time
    return vehicleState.getQuaternion(result);
  }, false);
  entity._viewFrom = ENTITY_VIEWFROM_PROPERTY;
  entity._billboard = createVehicleBillboard(route);

  assignVehicleTripToEntity(entity, trip);

  return entity;
}

const LABEL_FONT_PROPERTY = new Cesium.ConstantProperty("12pt monospace");
const LABEL_STYLE_PROPERTY = new Cesium.ConstantProperty(Cesium.LabelStyle.FILL_AND_OUTLINE);
const LABEL_OUTLINE_WIDTH_PROPERTY = new Cesium.ConstantProperty(2);
const LABEL_VERTICAL_ORIGIN_PROPERTY = new Cesium.ConstantProperty(Cesium.VerticalOrigin.BOTTOM);
const LABEL_PIXEL_OFFSET_PROPERTY = new Cesium.ConstantProperty(new Cesium.Cartesian2(0, -9));
const LABEL_FILL_COLOR_PROPERTY = new Cesium.ConstantProperty(Cesium.Color.fromAlpha(Cesium.Color.WHITE, 1.0));
const LABEL_DISTANCE_DISPLAY_CONDITION_PROPERTY = new Cesium.ConstantProperty(new Cesium.DistanceDisplayCondition(0, 3000));
const LABEL_EYE_OFFSET_PROPERTY = new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -2));

const modelMatrixScratch = new Cesium.Matrix3();


let previousTime = new Cesium.JulianDate(0, 0);

function getAvailabilityInterval(primitive) {
  return primitive.id.availability._intervals[0];
}

export function assignVehicleTripToEntity(entity, trip) {
  entity.transit = trip;
}

export function isVehicleTrip(entity) {
  return entity.transit instanceof Trip;
}

export function getVehicleTrip(entity) {
  if (isVehicleTrip(entity))
    return entity.transit;
  throw Error(`Entity ${entity.id} doesn't represent a trip.`);
}

// index of first primitive where availability.start > previousTime
let nextStartIndex = 0;
// index of first primitive where availability.stop > previousTime
let nextEndIndex = 0;

export function initUpdateVehicles(viewer) {
  viewer.vehiclePrimitivesOrderedByStart = [];
  viewer.vehiclePrimitivesOrderedByEnd = [];

  for (let i=0; i<viewer.scene.primitives.length; i++) {
    const p = viewer.scene.primitives.get(i);
    const entity = p.id;

    if (entity && isVehicleTrip(entity)) {
      viewer.vehiclePrimitivesOrderedByStart.push(p);
      viewer.vehiclePrimitivesOrderedByEnd.push(p);
    }
  }

  viewer.vehiclePrimitivesOrderedByStart.sort((p1, p2) => {
    return Cesium.JulianDate.compare(getAvailabilityInterval(p1).start, getAvailabilityInterval(p2).start);
  });
  viewer.vehiclePrimitivesOrderedByEnd.sort((p1, p2) => {
    return Cesium.JulianDate.compare(getAvailabilityInterval(p1).stop, getAvailabilityInterval(p2).stop);
  });
}

const IN_INTERVAL = 0;
const AFTER_INTERVAL = 1;
const BEFORE_INTERVAL = -1;

//TODO doesn't handle stopIncluded=false (should be greaterThanOrEquals)
function classifyTimeInInterval(time, interval) {
  if (Cesium.TimeInterval.contains(interval, time)) return IN_INTERVAL;
  if (Cesium.JulianDate.greaterThan(time, interval.stop)) return AFTER_INTERVAL;
  return BEFORE_INTERVAL;
}

export function updateVehiclePositions(viewer) {

  if (!viewer.vehiclePrimitivesOrderedByStart || viewer.vehiclePrimitivesOrderedByStart.length === 0) {
    initUpdateVehicles(viewer);
  }

  const time = viewer.clock.currentTime;

  if (Cesium.JulianDate.greaterThan(time, previousTime)) {
    let i;
    for (i=nextStartIndex; i<viewer.vehiclePrimitivesOrderedByStart.length; i++) {
      const primitive = viewer.vehiclePrimitivesOrderedByStart[i];
      const interval = getAvailabilityInterval(primitive);
      const result = classifyTimeInInterval(time, interval);

      if (result === IN_INTERVAL) {
        primitive.show = true;
        primitive.id.show=true;
      } else if (result === BEFORE_INTERVAL) {
        break;
      }
    }
    nextStartIndex = i;

    for (i=nextEndIndex; i<viewer.vehiclePrimitivesOrderedByEnd.length; i++) {
      const primitive = viewer.vehiclePrimitivesOrderedByEnd[i];
      const interval = getAvailabilityInterval(primitive);
      const result = classifyTimeInInterval(time, interval);

      if (result === AFTER_INTERVAL) {
        primitive.show = false;
        primitive.id.show = false;
      } else {
        break;
      }
    }
    nextEndIndex = i;
  }
  if (Cesium.JulianDate.lessThan(time, previousTime)) {
    let i;
    for (i=nextStartIndex-1; i>=0; i--) {
      const primitive = viewer.vehiclePrimitivesOrderedByStart[i];
      const interval = getAvailabilityInterval(primitive);
      const result = classifyTimeInInterval(time, interval);

      if (result === BEFORE_INTERVAL) {
        primitive.show = false;
        primitive.id.show=false;
      } else {
        break;
      }
    }
    nextStartIndex = i+1;

    for (i=nextEndIndex-1; i>=0; i--) {
      const primitive = viewer.vehiclePrimitivesOrderedByEnd[i];
      const interval = getAvailabilityInterval(primitive);
      const result = classifyTimeInInterval(time, interval);

      if (result === AFTER_INTERVAL) {
        break;
      } else if (result === IN_INTERVAL) {
        primitive.show = true;
        primitive.id.show = true;
      }
    }
    nextEndIndex = i+1;
  }

  //TODO verify that p.show === entity.isAvailable
  for (let i=0; i<viewer.scene.primitives.length; i++) {
    const p = viewer.scene.primitives.get(i);
    const entity = p.id;

    if (entity && isVehicleTrip(entity)) {
      if (p.show) {
        entity._getModelMatrix(time, p.modelMatrix);

        Cesium.Matrix4.multiplyByTranslation(p.modelMatrix, offsetRev, p.modelMatrix);
      }
    }
  }

  Cesium.JulianDate.clone(time, previousTime);
}

let offsetRev = new Cesium.Cartesian3(0, 0, -zOffset);

export default function createVehiclePrimitive(route, shape, trip) {
  const speedProfile = trip.speedProfile;
  const vehicleState = trip.vehicleState;

  const positionProperty = new Cesium.CallbackProperty((time, result) => {
    if (Cesium.JulianDate.lessThan(time, speedProfile._startTime)) return undefined;
    if (Cesium.JulianDate.greaterThan(time, speedProfile._endTime)) return undefined;

    //TODO check time
    //TODO VehicleState.set(position, orientation, time)
    return Cesium.Cartesian3.clone(vehicleState.position, result);
  }, false);

  const entity = createVehicleEntity(positionProperty, trip, speedProfile, vehicleState, route);

  // Vehicle primitive needs correct initial values
  updateVehicleState(entity, speedProfile._startTime, shape);

  entity._getModelMatrix(speedProfile._startTime, modelMatrixScratch);

  //TODO move model path to options
  const primitive = Cesium.Model.fromGltf({
    url: "/" + route.getType() + ".glb",
    modelMatrix: modelMatrixScratch,
    scale: 2.54/100 * 100,
    id: entity,
    minimumPixelSize: 6
  });

  entity.show = false;
  primitive.show = false;

  return primitive;
}


