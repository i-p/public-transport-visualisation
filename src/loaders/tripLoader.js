import {getTag} from "../models/OsmElement"
import {Trip} from "../models/Trip";
import {StopTime} from "../models/StopTime";

// This function is not in TransitData because it expects that OSM properties are present
export function findShapeByOsmRoute(transitData, routeId, fromStopName,
                                    toStopName) {
  const candidates = [];

  //TODO shapes by route map?

  for (let i=0; i<transitData.shapesArray.length; i++) {
    const shape = transitData.shapesArray[i];

    if (getTag(shape.osmRelation, "ref") === routeId) {
      candidates.push(shape);
    }
  }

  if (candidates.length == 0) return;

  let fromStopNorm = transitData.normalize(fromStopName);
  let toStopNorm = transitData.normalize(toStopName);

  for (let c of candidates) {
    if (transitData.normalize(getTag(c.osmRelation, "from")) === fromStopNorm
      && transitData.normalize(getTag(c.osmRelation, "to")) === toStopNorm) {
      return c;
    }
  }

  for (let c of candidates) {
    //TODO check if there is only one stop with given name
    const fromPoint = c.getNextPointByStopName(fromStopNorm);
    const toPoint = c.getPrevPointByStopName(toStopNorm);

    if (fromPoint && toPoint && fromPoint.sequence < toPoint.sequence) {
      return c;
    }
  }

  console.warn(`Cannot find shape for route "${routeId}" from "${fromStopName}" to "${toStopName}".`,
               "Candidates:", candidates.map(c => c.osmRelation.tags.from + " - " + c.osmRelation.tags.to).join(", "))
}


export function* enumerateTrips(arrivalTimesAtFirstStop, tripTimetable, dwellTime) {
  for (let [hour, minutes] of arrivalTimesAtFirstStop) {
    for (const minute of minutes) {
      let arrivalTimeAtFirstStop = hour * 3600 + minute * 60;

      yield (tripTimetable.map(tt => {
        return {
          name: tt.name,
          stop: tt.stop,
          arrivalTime: arrivalTimeAtFirstStop + tt.time,
          departureTime: arrivalTimeAtFirstStop + tt.time + dwellTime
        };
      }));
    }
  }
}

export function addTrips(transitData, routeTimetables, stopSeconds) {
  routeTimetables.forEach(({name, timetables}) => {
    let route = transitData.getRouteById(name);
    if (!route) return;

    timetables.forEach(({stops, stopTimes}) => {
      let from = stops[0].name;
      let to   = stops[stops.length - 1].name;

      let shape = findShapeByOsmRoute(transitData, route.id, from, to);
      if (!shape) {
        console.warn(`No shape for ${route.id} from ${from} to ${to}`);
        return
      }

      let lastPoint;

      stops.forEach(s => {
        // stop names are not unique, so we have to ignore previous points
        const point = shape.getNextPointByStopName(s.name, lastPoint);
        if (!point) {
          console.warn(`${route.id} - cannot find point for ${s.name}
Available points: ${Array.from(shape.pointByName.values(), p => p.osmNode.tags.name).join(",")}`);
          return;
        }
        lastPoint = point;

        s.stop = transitData.getStopById(point.osmNode.id);
        s.stopSequence = point.sequence;
      });


      for (let i = 0; i < stopTimes.length; i++) {
        let [hour, minutes] = stopTimes[i];

        for (let j = 0; j < minutes.length; j++) {
          let minute = minutes[j];

          let arrivalTimeAtFirstStop = hour * 3600 + minute * 60;

          const trip = new Trip({ route: route.id, shape: shape.id });

          for (let k = 0; k < stops.length; k++) {
            let {stop, time, stopSequence} = stops[k];

            let arrivalTime = arrivalTimeAtFirstStop + time;
            let departureTime = arrivalTimeAtFirstStop + time + stopSeconds; // TODO rename to dwelltime

            // if we couldn't find matching stop, just continue
            if (stop) {
              trip.appendStopTime(new StopTime({
                trip, arrivalTime, departureTime, stop, stopSequence
              }));
            }
          }

          transitData.addTrip(trip);
        }
      }
    });
  });

  calculateTripIndices(transitData);

  transitData.calculateVehiclesInService();
}

const EVENT_START = 0;
const EVENT_END = 1;

function calculateTripIndices(transitData) {
  const events = [];
  const unusedIndices = [];
  let indexSize = 0;

  for (let trip of transitData.trips.values()) {
    let from = trip.stopTimes[0];
    let to = trip.stopTimes[trip.stopTimes.length - 1];

    events.push({type: EVENT_START, stopTime: from, time: from.arrivalTime },
                {type: EVENT_END,   stopTime: to,   time: to.departureTime });
  }

  events.sort((e1, e2) => e1.time - e2.time);

  events.forEach(e => {
    if (e.type === EVENT_START) {
      if (unusedIndices.length > 0) {
        e.stopTime.trip.index = unusedIndices.pop();
      } else {
        e.stopTime.trip.index = indexSize;
        indexSize++;
      }
    } else {
      unusedIndices.push(e.stopTime.trip.index);
    }
  });

  transitData.indexSize = indexSize;
}
