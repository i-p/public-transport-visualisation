import Cesium from "cesium"

export class StopTime {
  constructor({trip, arrivalTime, departureTime, stop, stopSequence}) {
    if (!stop) throw new Error("stop");

    this.trip = trip;
    this.arrivalTime = arrivalTime;
    this.departureTime = departureTime;
    this.stop = stop;
    this.stopSequence = stopSequence;
  }

  contains(time) {
    return time >= this.arrivalTime && time < this.departureTime;
  }
}

