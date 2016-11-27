
//TODO add to options
const L = 10;

export function updateVehicleState(vehicleEntity, time) {
  let trip = vehicleEntity.transit.trip;
  let index = trip.indexOfStop(time);

  if (index == -1) {
    trip.vehicleState.show = false;
    return;
  }

  trip.vehicleState.show = true;

  if (index % 2 == 0) {
    const stopTime = trip.stopTimes[index / 2];
    const pointIndex = stopTime.stopSequence - 1;

    trip.shape.simulator.orientationAtPoint(pointIndex, trip.vehicleState.orientation);
    trip.shape.simulator.positionAlongVehicleAtPoint(pointIndex, -L/2, trip.vehicleState.position);
  } else {
    let fromPoint = trip.pointFor(trip.stopTimes[(index - 1) / 2]);
    let toPoint = trip.pointFor(trip.stopTimes[(index - 1) / 2 + 1]);

    // TODO make it non-relative
    let distance = trip.speedProfile.getDistanceFromStartOfTripSegmentAt(time);

    let segmentIndex = trip.shape.getSegmentIndexByDistance(distance, fromPoint, toPoint);


    let pFrom = trip.shape.points[segmentIndex];
    let pTo = trip.shape.points[segmentIndex + 1];

    let t = ((distance + fromPoint.distance) - pFrom.distance) / (pTo.distance - pFrom.distance);

    let position = trip.vehicleState.position;
    let orientation = trip.vehicleState.orientation;

    // TODO remember alpha?
    trip.shape.simulator.interpolate(segmentIndex, t, position, orientation);
    trip.shape.simulator.positionAlongVehicle(position, orientation, - L / 2, position);
  }
}
