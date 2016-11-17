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
  get lastArrivalTime() {
    return this.stopTimes[this.stopTimes.length - 1].arrivalTime;
  }
  appendStopTime(stopTime) {
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
}
