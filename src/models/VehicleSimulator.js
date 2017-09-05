import Cesium from "cesium"

const curScratch = new Cesium.Cartesian3();
const prevScratch = new Cesium.Cartesian3();
const crossScratch = new Cesium.Cartesian3();

export function angleChangeAtTheEndOfSegment(index, points) {
  if (index >= points.length - 2) return 0;

  let cur = Cesium.Cartesian3.subtract(points[index + 1], points[index], curScratch);
  let prev = Cesium.Cartesian3.subtract(points[index + 2], points[index + 1], prevScratch);
  let angleChange = Cesium.Cartesian3.angleBetween(cur, prev);

  if (Math.abs(angleChange) > 1e-6) {
    // we need to return oriented angle (angleBetween returns positive angle)
    if (Cesium.Cartesian3.dot(points[index], Cesium.Cartesian3.cross(cur, prev, crossScratch)) > 0) {
      angleChange *= -1;
    }
  }
  return angleChange;
}

function step(alpha, L, ds) {
  return alpha + (- Math.sin(alpha) / L) * ds;
}

const cartesian3Scratch = new Cesium.Cartesian3();
const quaternionScratch = new Cesium.Quaternion();
const matrix3Scratch = new Cesium.Matrix3();

//TODO find a better name for alpha
export class VehicleSimulator {

  //TODO adaptive step count
  constructor({points, distances, stepCount = 100, storeResultPoints = false, wheelbase}) {
    this._points = points;
    this._distances = distances;
    this._stepCount = stepCount;
    this._alphas = new Array(this._points.length);
    this._storeResultPoints = storeResultPoints;
    this._resultPoints = [];
    this._wheelbase = wheelbase;

    this._calculateAlphas();
  }

  interpolate(index, t, positionResult, orientationResult) {
    let pFrom = this._points[index];
    let pTo = this._points[index + 1];

    const alpha = this._interpolateAlpha(index, t);

    Cesium.Cartesian3.lerp(pFrom, pTo, t, positionResult);
    this._calculateVehicleOrientation(index, positionResult, alpha, orientationResult);
  }

  positionAlongVehicle(position, orientation, distance, result) {
    Cesium.Cartesian3.multiplyByScalar(orientation, distance, cartesian3Scratch);
    return Cesium.Cartesian3.add(position, cartesian3Scratch, result);
  }

  orientationAtPoint(index, result) {
    return this._calculateVehicleOrientation(index, this._points[index], this._alphas[index], result);
  }

  positionAlongVehicleAtPoint(index, distance, result) {
    this.orientationAtPoint(index, result);
    const position = this._points[index];
    Cesium.Cartesian3.multiplyByScalar(result, distance, result);
    return Cesium.Cartesian3.add(position, result, result);
  }

  _calculateVehicleOrientation(index, point, alpha, result) {
    const points = this._points;

    // Treat last point as a point inside last segment
    if (index == points.length - 1) {
      index--;
    }

    let direction = Cesium.Cartesian3.subtract(points[index + 1], points[index], result);
    Cesium.Cartesian3.normalize(direction, direction);

    let axis = Cesium.Cartesian3.normalize(point, cartesian3Scratch);

    var quaternion = Cesium.Quaternion.fromAxisAngle(axis, alpha, quaternionScratch);
    var rotation = Cesium.Matrix3.fromQuaternion(quaternion, matrix3Scratch);

    Cesium.Matrix3.multiplyByVector(rotation, direction, result);
    Cesium.Cartesian3.normalize(result, result);
    return result;
  }

  _interpolateAlpha(index, t) {
    const stepCount = this._stepCount;
    const distances = this._distances;
    const segmentLength = distances[index + 1] - distances[index];
    const ds = segmentLength / stepCount;
    const ss = (stepCount * t)|0;

    let alpha = this._alphas[index];

    for (let j=0; j<ss; j++) {
      alpha = step(alpha, this._wheelbase, ds);
    }

    let alphaNext = step(alpha, this._wheelbase, ds);
    let tTransformed = (t - (ss/stepCount)) / (1/stepCount);

    return alpha + tTransformed * (alphaNext - alpha);
  }

  _calculateAlphas() {
    const points = this._points;
    const alphas = this._alphas;
    const distances = this._distances;
    const stepCount = this._stepCount;

    alphas[0] = 0;

    for (let i=0; i<points.length - 1; i++) {
      const segmentLength = distances[i + 1] - distances[i];
      const ds = segmentLength / stepCount;

      let alpha = alphas[i];

      for (let j=1; j<=stepCount; j++) {
        alpha = step(alpha, this._wheelbase, ds);

        if (this._storeResultPoints) {
          // eslint-disable-next-line limit-cesium-allocations
          const result = new Cesium.Cartesian3();

          //TODO duplicate code
          const point = Cesium.Cartesian3.lerp(points[i], points[i + 1], j/stepCount, cartesian3Scratch);
          this._calculateVehicleOrientation(i, point, alpha, result);
          Cesium.Cartesian3.multiplyByScalar(result, this._wheelbase, result);
          Cesium.Cartesian3.add(point, result, result);

          this._resultPoints.push(result);
        }

        if (j == stepCount) {
          alpha += angleChangeAtTheEndOfSegment(i, points);
        }
      }

      alphas[i + 1] = alpha;
    }
  }
}
