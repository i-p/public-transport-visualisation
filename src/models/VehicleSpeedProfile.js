import Cesium from "cesium"
import {solveQuadratic} from "../utils";

const resultsScratch = [null, null];

export class VehicleSpeedProfile {
  constructor(trip, stopTimes, secondsOfDayToDate, shape) {
    const intervalCollection = new Cesium.TimeIntervalCollection();
    const length = stopTimes.length;

    intervalCollection._intervals = new Array(stopTimes.length - 1);

    // TODO this isn't true now
    // Directly push to the intervals array, since we know that the intervals are not overlapping.
    // Common case in addInterval doesn't handle our intervals, because endpoints have the same value (but one is exclusive and the other is inclusive)
    for (let i=1; i<length; i++) {
      const stopTime = trip.stopTimes[i];

      if (i > 0) {
        const previousStopTime = trip.stopTimes[i - 1];
        intervalCollection._intervals[i - 1] = makeInterval(shape, secondsOfDayToDate, previousStopTime, stopTime);
      }
    }

    this._intervalCollection = intervalCollection;

    this._startTime = new Cesium.JulianDate();
    this._endTime = new Cesium.JulianDate();

    secondsOfDayToDate(stopTimes[0].arrivalTime, this._startTime);
    secondsOfDayToDate(stopTimes[stopTimes.length - 1].departureTime, this._endTime);
  }
  getDistanceFromStartOfTripSegmentAt(time) {
    const interval = this._intervalCollection.findIntervalContainingDate(time);
    const speedProfile = interval.data;

    let secondsFromStart = Cesium.JulianDate.secondsDifference(time, interval.start);

    let a = speedProfile.acceleration;
    let t_a = speedProfile.accelerationDuration;
    let v = speedProfile.velocity;

    if (secondsFromStart < t_a) {
      return 0.5 * a * secondsFromStart * secondsFromStart;
    } else if (secondsFromStart < speedProfile.time - speedProfile.accelerationDuration) {
      secondsFromStart -= t_a;

      return 0.5 * a * t_a * t_a + v * secondsFromStart;
    } else {
      secondsFromStart -= speedProfile.time - t_a;
      return 0.5 * a * t_a * t_a
        + v * (speedProfile.time - 2*t_a)
        + v * secondsFromStart
        - 0.5 * a * secondsFromStart * secondsFromStart;
    }
  }
}

function makeInterval(shape, secondsOfDayToDate, previous, current) {
  const interval = new Cesium.TimeInterval();

  secondsOfDayToDate(previous.departureTime, interval.start);
  secondsOfDayToDate(current.arrivalTime, interval.stop);

  interval.data = calculateSpeedProfile(
    interval.start,
    interval.stop,
    shape,
    previous,
    current);

  interval.isStartIncluded = true;
  interval.isStopIncluded = false;

  return interval;
}

function calculateSpeedProfile(startTime, endTime, shape, fromStopTime, toStopTime) {
  const firstPointDist = shape.distances[fromStopTime.stopSequence - 1];
  const lastPointDist = shape.distances[toStopTime.stopSequence - 1];

  let distance = lastPointDist - firstPointDist;
  let time = Cesium.JulianDate.secondsDifference(endTime, startTime);

  let desiredAcceleration = 0.3;

  solveQuadratic(- desiredAcceleration, desiredAcceleration*time, -distance, resultsScratch);

  let accelerationDuration;

  //TODO add case for 1 result
  if (resultsScratch[0] === null) {
    desiredAcceleration = distance * 4 / (time * time);
    accelerationDuration = time / 2;
  } else {
    const s = resultsScratch[0];
    const s2 = resultsScratch[1];

    if (s > 0 && time >= 2*s) {
      accelerationDuration = s;
    } else if (s2 > 0 && time >= 2*s2) {
      accelerationDuration = s2;
    } else {
      desiredAcceleration = distance * 4 / (time * time);
    }
  }

  let velocity = desiredAcceleration * accelerationDuration;

  return {
    acceleration: desiredAcceleration, accelerationDuration, velocity, time
  };
}
