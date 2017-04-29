import Cesium from "cesium"
import {toSecondsOfDay} from "../utils";

export class Trip {
  constructor({tripId, route, shape}) {
    this.id = tripId;
    this.route = route;
    this.shape = shape;
    this.stopTimes = [];
  }
  get firstArrivalTime() {
    return this.stopTimes[0].arrivalTime;
  }
  get lastDepartureTime() {
    return this.stopTimes[this.stopTimes.length - 1].departureTime;
  }
  appendStopTime(stopTime) {
    //TODO FIX
    if (!stopTime.sequence) {
      stopTime.sequence = this.stopTimes.size + 1;
    }
    this.stopTimes.push(stopTime);
  }
  get firstStop() {
    return this.stopTimes[0].stop;
  }
  get lastStop() {
    return this.stopTimes[this.stopTimes.length - 1].stop;
  }

  //TODO consider using return value with the same semantics as TimeIntervalCollection.indexOf
  //TODO remember last index and use it as a starting index
  indexOfStop(time) {
    if (!this.isActive(time)) return -1;

    let seconds = toSecondsOfDay(time);

    for (let i=0; i<this.stopTimes.length; i++) {
      const stopTime = this.stopTimes[i];

      if (stopTime.contains(seconds)) {
        return i * 2;
      }
      else if (seconds < stopTime.arrivalTime) {
        return (i - 1) * 2 + 1;
      }
    }
    return -1;
  }

  //TODO better name
  isActive(time) {
    return toSecondsOfDay(time) >= this.firstArrivalTime
        && toSecondsOfDay(time) < this.lastDepartureTime;
  }
}
