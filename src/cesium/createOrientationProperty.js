import Cesium from "cesium"

function calculateNormalizedVelocityVector(positionPrev, positionCurrent,
                                           positionNext, result) {

  if (!Cesium.defined(positionCurrent)
    || (!Cesium.defined(positionNext) && !Cesium.defined(positionPrev))) {
    return undefined;
  }
  if (Cesium.Cartesian3.equals(positionCurrent, positionPrev)
    || Cesium.Cartesian3.equals(positionCurrent, positionNext)) {
    return undefined;
  }

  let velocity;

  if (Cesium.defined(positionNext) && Cesium.defined(positionPrev)) {
    velocity = Cesium.Cartesian3.subtract(positionNext, positionPrev, result);
  } else if (Cesium.defined(positionNext)) {
    velocity = Cesium.Cartesian3.subtract(positionNext, positionCurrent, result);
  } else {
    velocity = Cesium.Cartesian3.subtract(positionCurrent, positionPrev, result);
  }

  Cesium.Cartesian3.normalize(velocity, velocity);

  return velocity;
}

var position1Scratch = new Cesium.Cartesian3();
var position2Scratch = new Cesium.Cartesian3();
var position3Scratch = new Cesium.Cartesian3();
var velocityScratch = new Cesium.Cartesian3();
var timeScratch = new Cesium.JulianDate();
var rotationScratch = new Cesium.Matrix3();
var step = 2 // 1.0 / 60.0;

export default function createOrientationProperty(positionProperty) {
  if (!(positionProperty instanceof Cesium.CompositePositionProperty)) {
    throw "Not supported";
  }

  return new Cesium.CallbackProperty((time, result) => {

    //TODO PERF - use previous index as first attempt
    const index = positionProperty.intervals.indexOf(time);

    const interval = positionProperty.intervals.get(index);
    const property = interval.data;

    var positionCurrent = property.getValue(time, position1Scratch);

    let positionNext;
    let positionPrev;

    if (property instanceof Cesium.ConstantPositionProperty) {

      const next = positionProperty.intervals.get(index + 1);
      const prev = positionProperty.intervals.get(index - 1);

      if (next) {
        positionNext = next.data.getValue(Cesium.JulianDate.addSeconds(next.start, step, timeScratch), position2Scratch);
      }
      if (prev) {
        positionPrev = prev.data.getValue(Cesium.JulianDate.addSeconds(prev.stop, -step, timeScratch), position3Scratch);
      }

    } else {
      positionNext = positionProperty.getValue(Cesium.JulianDate.addSeconds(time,  step, timeScratch), position2Scratch);
      positionPrev = positionProperty.getValue(Cesium.JulianDate.addSeconds(time, -step, timeScratch), position3Scratch);
    }

    let velocity = calculateNormalizedVelocityVector(positionPrev, positionCurrent, positionNext, velocityScratch);

    if (!velocity) {
      return undefined;
    }

    Cesium.Transforms.rotationMatrixFromPositionVelocity(positionCurrent, velocity, Cesium.Ellipsoid.WGS84, rotationScratch);
    return Cesium.Quaternion.fromRotationMatrix(rotationScratch, result);
  }, false);
}
