
//TODO add to options
import {getVehicleTrip} from "./createVehicle";

const L = 10;

export function updateVehicleState(vehicleEntity, time, shape) {
  let trip = getVehicleTrip(vehicleEntity);
  let index = trip.indexOfStop(time);
  let vehicleState = trip.vehicleState;

  if (index == -1) {
    vehicleState.show = false;
    return;
  }

  vehicleState.show = true;

  const simulator = shape.simulator;

  if (index % 2 == 0) {
    const stopTime = trip.stopTimes[index / 2];
    const pointIndex = stopTime.stopSequence - 1;

    simulator.orientationAtPoint(pointIndex, vehicleState.orientation);
    simulator.positionAlongVehicleAtPoint(pointIndex, -L/2, vehicleState.position);
  } else {
    let fromPointIndex = trip.stopTimes[(index - 1) / 2].indexOfPoint;
    let toPointIndex = trip.stopTimes[(index - 1) / 2 + 1].indexOfPoint;

    // TODO make it non-relative
    let distance = trip.speedProfile.getDistanceFromStartOfTripSegmentAt(time);

    let segmentIndex = shape.getSegmentIndexByDistance(distance, fromPointIndex, toPointIndex);


    let pFromDist = shape.distances[segmentIndex];
    let pToDist = shape.distances[segmentIndex + 1];

    let t = ((distance + shape.distances[fromPointIndex]) - pFromDist) / (pToDist - pFromDist);

    let position = vehicleState.position;
    let orientation = vehicleState.orientation;

    // TODO remember alpha?
    simulator.interpolate(segmentIndex, t, position, orientation);
    simulator.positionAlongVehicle(position, orientation, - L / 2, position);
  }
}
