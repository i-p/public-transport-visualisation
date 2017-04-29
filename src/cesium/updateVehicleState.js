
//TODO add to options
const L = 10;

export function updateVehicleState(vehicleEntity, time, transitData) {
  let trip = vehicleEntity.transit.trip;
  let index = trip.indexOfStop(time);

  if (index == -1) {
    trip.vehicleState.show = false;
    return;
  }

  trip.vehicleState.show = true;

  const shape = transitData.getShapeById(trip.shape);

  if (index % 2 == 0) {
    const stopTime = trip.stopTimes[index / 2];
    const pointIndex = stopTime.stopSequence - 1;

    shape.simulator.orientationAtPoint(pointIndex, trip.vehicleState.orientation);
    shape.simulator.positionAlongVehicleAtPoint(pointIndex, -L/2, trip.vehicleState.position);
  } else {
    let fromPoint = transitData.getPointFor(trip, trip.stopTimes[(index - 1) / 2]);
    let toPoint = transitData.getPointFor(trip, trip.stopTimes[(index - 1) / 2 + 1]);

    // TODO make it non-relative
    let distance = trip.speedProfile.getDistanceFromStartOfTripSegmentAt(time);

    let segmentIndex = shape.getSegmentIndexByDistance(distance, fromPoint, toPoint);


    let pFrom = shape.points[segmentIndex];
    let pTo = shape.points[segmentIndex + 1];

    let t = ((distance + fromPoint.distance) - pFrom.distance) / (pTo.distance - pFrom.distance);

    let position = trip.vehicleState.position;
    let orientation = trip.vehicleState.orientation;

    // TODO remember alpha?
    shape.simulator.interpolate(segmentIndex, t, position, orientation);
    shape.simulator.positionAlongVehicle(position, orientation, - L / 2, position);
  }
}
