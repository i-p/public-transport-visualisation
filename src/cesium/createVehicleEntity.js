import Cesium from "cesium"
import createOrientationProperty from "./createOrientationProperty"
import KinematicPositionProperty from "./KinematicPositionProperty"

const scale = 3;
const [height] = [2.0];
const polylineHeightAboveGround = 1;
const zOffset = (height / 2) * scale + polylineHeightAboveGround;

function makeDwellTimeInterval(trip, toDate, stopTime) {
  const interval = new Cesium.TimeInterval();

  toDate(stopTime.arrivalTime, interval.start);
  toDate(stopTime.departureTime, interval.stop);

  //TODO add getter (getBySequenceNumber)
  interval.data = new Cesium.ConstantPositionProperty(trip.shape.points[stopTime.stopSequence - 1].pos);
  interval.isStartIncluded = true;
  interval.isStopIncluded = false;

  return interval;
}

// TODO add "previous" parameter
function makeRunningTimeInterval(trip, toDate, current) {
  const previous = trip.stopTimes[trip.stopTimes.indexOf(current) - 1];

  const interval = new Cesium.TimeInterval();

  toDate(previous.departureTime, interval.start);
  toDate(current.arrivalTime, interval.stop);

  interval.data = new KinematicPositionProperty(
    interval.start,
    interval.stop,
    trip.shape,
    previous,
    current);

  interval.isStartIncluded = true;
  interval.isStopIncluded = false;

  return interval;
}

const ENTITY_VIEWFROM_PROPERTY =  new Cesium.ConstantProperty(new Cesium.Cartesian3(0, -300, 300));

const billboardCache = new Map();

//TODO rename to makeVehicle + fix transit.type
function makeBus(positionProperty, trip) {

  const orientationProperty = createOrientationProperty(positionProperty);

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

  const availability = new Cesium.TimeIntervalCollection();

  const interval = new Cesium.TimeInterval();
  Cesium.JulianDate.clone(positionProperty.intervals.start, interval.start);
  Cesium.JulianDate.clone(positionProperty.intervals.stop, interval.stop);

  availability.addInterval(interval);

  entity._availability = availability;
  entity._name = trip.route.id;
  entity._position = actualPosition;
  entity._orientation = orientationProperty;
  entity.transit = {
    type: "bus",
    trip: trip
  };
  entity._viewFrom = ENTITY_VIEWFROM_PROPERTY;

  //entity._label = createVehicleLabel(trip);

  if (billboardCache.has(trip.route.id)) {
    entity._billboard = billboardCache.get(trip.route.id);
  } else {
    let canvas = Cesium.writeTextToCanvas(trip.route.id, {
      // don't use custom font here, it doesn't have to be loaded yet
      font: "32px 'Verdana' ",
      stroke: true,
      strokeWidth: 12,
      fillColor: Cesium.Color.WHITE,
      strokeColor: new Cesium.Color(0.3,0.3,0.3,1),
      backgroundColor: new Cesium.Color(0.3,0.3,0.3,1)
    });

    let bg = new Cesium.BillboardGraphics({
      scale: 0.4,
      image: canvas,
      pixelOffset : new Cesium.Cartesian2(0, -9),
      distanceDisplayCondition: LABEL_DISTANCE_DISPLAY_CONDITION_PROPERTY,
      eyeOffset: LABEL_EYE_OFFSET_PROPERTY
    });
    billboardCache.set(trip.route.id, bg);
    entity._billboard = bg;
  }

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

function createVehicleLabel(trip) {
  const label = new Cesium.LabelGraphics();

  label._text = new Cesium.ConstantProperty(trip.route.id);
  label._font = LABEL_FONT_PROPERTY;
  label._style = LABEL_STYLE_PROPERTY;
  label._outlineWidth = LABEL_OUTLINE_WIDTH_PROPERTY;
  label._verticalOrigin = LABEL_VERTICAL_ORIGIN_PROPERTY;
  label._pixelOffset = LABEL_PIXEL_OFFSET_PROPERTY;
  label._fillColor = LABEL_FILL_COLOR_PROPERTY;
  label._distanceDisplayCondition = LABEL_DISTANCE_DISPLAY_CONDITION_PROPERTY;
  return label;
}

const modelMatrixScratch = new Cesium.Matrix3();

function createVehiclePrimitive(vehicleEntity, positionProperty, type) {
  vehicleEntity._getModelMatrix(positionProperty.intervals.start, modelMatrixScratch);

  //TODO move model path to options
  return Cesium.Model.fromGltf({
                                 url: type + ".glb",
                                 modelMatrix: modelMatrixScratch,
                                 scale: 2.54/100 * 100,
                                 id: vehicleEntity
                               });
}

let previousTime = new Cesium.JulianDate(0, 0);

function getAvailabilityInterval(primitive) {
  return primitive.id.availability._intervals[0];
}

// index of first primitive where availability.start > previousTime
let nextStartIndex = 0;
// index of first primitive where availability.stop > previousTime
let nextEndIndex = 0;

export function initUpdateVehicles(viewer) {
  if (viewer.vehiclePrimitivesOrderedByStart.length === 0) {
    viewer.vehiclePrimitivesOrderedByStart = [];
    viewer.vehiclePrimitivesOrderedByEnd = [];

    for (let i=0; i<viewer.scene.primitives.length; i++) {
      const p = viewer.scene.primitives.get(i);
      const entity = p.id;

      if (entity && entity.transit && entity.transit.trip) {
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

export function updateVehicles(viewer) {

  if (viewer.vehiclePrimitivesOrderedByStart.length === 0) return;

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

    if (entity && entity.transit && entity.transit.trip) {
      if (p.show) {
        entity._getModelMatrix(time, p.modelMatrix);

        Cesium.Matrix4.multiplyByTranslation(p.modelMatrix, offsetRev, p.modelMatrix);
      }
    }
  }

  Cesium.JulianDate.clone(time, previousTime);
}

let offsetRev = new Cesium.Cartesian3(0, 0, -zOffset);



export function updateVehiclesOld(viewer) {
  const time = viewer.clock.currentTime;

  for (let i=0; i<viewer.scene.primitives.length; i++) {
    const p = viewer.scene.primitives.get(i);
    const entity = p.id;

    if (entity && entity.transit && entity.transit.trip) {
      p.show = entity.isAvailable(time);

      if (p.show) {
        entity._getModelMatrix(time, p.modelMatrix);
      }
    }
  }
}


export default function createVehicleEntity(viewer, vehicles, trip, toDate) {
  const positionProperty = new Cesium.CompositePositionProperty();
  const intervalCollection = new Cesium.TimeIntervalCollection();

  const length = trip.stopTimes.length;

  intervalCollection._intervals = new Array((2 * length) - 1);

  // Directly push to the intervals array, since we know that the intervals are not overlapping.
  // Common case in addInterval doesn't handle our intervals, because endpoints have the same value (but one is exclusive and the other is inclusive)
  for (let i=0; i<length; i++) {
    const stopTime = trip.stopTimes[i];

    if (i > 0) {
      intervalCollection._intervals[(i * 2) - 1] = makeRunningTimeInterval(trip, toDate, stopTime);
    }
    intervalCollection._intervals[i * 2] = makeDwellTimeInterval(trip, toDate, stopTime);
  }

  // this is much more effective, because no events are raised when adding intervals (TimeIntervalCollection has no suspend/resume events)
  // TODO maybe Composite(Position)Property should accept TimeIntervalCollection in constructor
  positionProperty._composite._intervals = intervalCollection;
  positionProperty._composite._intervals.changedEvent.addEventListener(Cesium.CompositeProperty.prototype._intervalsChanged, positionProperty._composite);

  const entity = makeBus(positionProperty, trip);
  const primitive = createVehiclePrimitive(entity, positionProperty, trip.route.getType());

  entity.show = false;
  primitive.show = false;

  vehicles.entities.add(entity);
  //viewer.entities.add(entity);
  viewer.scene.primitives.add(primitive);
}


