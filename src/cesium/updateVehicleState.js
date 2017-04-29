
//TODO add to options
const L = 10;

export function updateVehicleState(vehicleEntity, time, transitData) {
  let trip = vehicleEntity.transit.trip;
  let index = trip.indexOfStop(time);

  let vehicleState = transitData.vehicleStates[trip.id];

  if (index == -1) {
    vehicleState.show = false;
    return;
  }

  vehicleState.show = true;

  const shape = transitData.getShapeById(trip.shape);

  const simulator = transitData.simulators[trip.shape];

  if (index % 2 == 0) {
    const stopTime = trip.stopTimes[index / 2];
    const pointIndex = stopTime.stopSequence - 1;

    simulator.orientationAtPoint(pointIndex, vehicleState.orientation);
    simulator.positionAlongVehicleAtPoint(pointIndex, -L/2, vehicleState.position);
  } else {
    let fromPoint = transitData.getPointFor(trip, trip.stopTimes[(index - 1) / 2]);
    let toPoint = transitData.getPointFor(trip, trip.stopTimes[(index - 1) / 2 + 1]);

    // TODO make it non-relative
    let distance = transitData.speedProfiles[trip.id].getDistanceFromStartOfTripSegmentAt(time);

    let segmentIndex = shape.getSegmentIndexByDistance(distance, fromPoint, toPoint);


    let pFrom = shape.points[segmentIndex];
    let pTo = shape.points[segmentIndex + 1];

    let t = ((distance + fromPoint.distance) - pFrom.distance) / (pTo.distance - pFrom.distance);

    let position = vehicleState.position;
    let orientation = vehicleState.orientation;

    // TODO remember alpha?
    simulator.interpolate(segmentIndex, t, position, orientation);
    simulator.positionAlongVehicle(position, orientation, - L / 2, position);
  }
}
