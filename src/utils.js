import Cesium from "cesium"
import _ from "lodash"

export const toAbsTime = (startTime, relativeTime) => {
  let localDate = Cesium.JulianDate.toDate(startTime);

  let newLocalDate = new Date(localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    Math.floor(relativeTime / 3600),
    Math.floor((relativeTime % 3600) / 60),
    Math.floor(relativeTime % 60));

  return Cesium.JulianDate.fromDate(newLocalDate);
}

export function secondsOfDayToHMS(secondsOfDay) {
  const hours = (secondsOfDay / 3600) | 0;
  const minutes = (secondsOfDay % 3600) / 60;
  const seconds = secondsOfDay % 60;
  return [hours, minutes, seconds];
}

export function formatSecondsOfDay(secondsOfDay) {
  let [h,m] = secondsOfDayToHMS(secondsOfDay);
  return `${h}:${_.padStart(m, 2, "0")}`;
}

export function toSecondsOfDay(time) {
  let d = Cesium.JulianDate.toDate(time);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

export function relativePosition(value, from, to) {
  return (value - from) / (to - from);
}

export function secondsOfDayToDate(day, secondsOfDay) {
  let localDate = Cesium.JulianDate.toDate(day);

  let newLocalDate = new Date(localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    ...secondsOfDayToHMS(secondsOfDay));

  return Cesium.JulianDate.fromDate(newLocalDate);
}

export function formatTimeAsHMS(time) {
  const date = Cesium.JulianDate.toDate(time);

  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  return h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

export function angleChangeAtTheEndOfSegment(index, points) {
  if (index >= points.length - 2) return 0;

  //TODO create scratch variables
  let cur = Cesium.Cartesian3.subtract(points[index + 1], points[index], new Cesium.Cartesian3());
  let prev = Cesium.Cartesian3.subtract(points[index + 2], points[index + 1], new Cesium.Cartesian3());
  let angleChange = Cesium.Cartesian3.angleBetween(cur, prev);

  if (Math.abs(angleChange) > 1e-6) {
    // we need to return oriented angle (angleBetween returns positive angle)
    if (Cesium.Cartesian3.dot(points[index], Cesium.Cartesian3.cross(cur, prev, new Cesium.Cartesian3())) > 0) {
      angleChange *= -1;
    }
  }
  return angleChange;
}

function step(alpha, L, ds) {
  return alpha + (- Math.sin(alpha) / L) * ds;
}

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

    this.position = null;
    this.orientation = null;
  }

  interpolate(index, t) {
    let pFrom = this._points[index];
    let pTo = this._points[index + 1];

    const alpha = this._interpolateAlpha(index, t);

    this.position =  Cesium.Cartesian3.lerp(pFrom, pTo, t, new Cesium.Cartesian3());
    this.orientation = this._calculateVehicleOrientation(index, this.position, alpha);
  }

  positionAlongVehicle(distance) {
    const v = Cesium.Cartesian3.multiplyByScalar(this.orientation, distance, new Cesium.Cartesian3());
    return Cesium.Cartesian3.add(this.position, v, new Cesium.Cartesian3());
  }

  orientationAtPoint(index) {
    return this._calculateVehicleOrientation(index, this._points[index], this._alphas[index]);
  }

  positionAlongVehicleAtPoint(index, distance) {
    const orientation = this.orientationAtPoint(index);
    const position = this._points[index];
    const v = Cesium.Cartesian3.multiplyByScalar(orientation, distance, new Cesium.Cartesian3());
    return Cesium.Cartesian3.add(position, v, new Cesium.Cartesian3());
  }

  _calculateVehicleOrientation(index, point, alpha) {
    const points = this._points;

    // Treat last point as a point inside last segment
    if (index == points.length - 1) {
      index--;
    }

    let direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(points[index + 1], points[index], new Cesium.Cartesian3()), new Cesium.Cartesian3());

    var quaternion = Cesium.Quaternion.fromAxisAngle(
      Cesium.Cartesian3.normalize(point, new Cesium.Cartesian3()), alpha, new Cesium.Quaternion());
    var rotation = Cesium.Matrix3.fromQuaternion(quaternion, new Cesium.Matrix3());

    var orientation = Cesium.Matrix3.multiplyByVector(rotation, direction, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(orientation, orientation);

    return orientation;
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
          //TODO duplicate code
          const point = Cesium.Cartesian3.lerp(points[i], points[i + 1], j/stepCount, new Cesium.Cartesian3());
          const orientation = this._calculateVehicleOrientation(i, point, alpha);

          const v = Cesium.Cartesian3.multiplyByScalar(orientation, this._wheelbase, new Cesium.Cartesian3());
          const resultPoint = Cesium.Cartesian3.add(point, v, new Cesium.Cartesian3());

          this._resultPoints.push(resultPoint);
        }

        if (j == stepCount) {
          alpha += angleChangeAtTheEndOfSegment(i, points);
        }
      }

      alphas[i + 1] = alpha;
    }
    this.point = null;
    this.orientation = null;
  }
}

