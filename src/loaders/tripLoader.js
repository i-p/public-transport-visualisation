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

    if (getTag(transitData.osmElements[shape.osmRelationId], "ref") === routeId) {
      candidates.push(shape);
    }
  }

  if (candidates.length == 0) return;

  let fromStopNorm = transitData.normalize(fromStopName);
  let toStopNorm = transitData.normalize(toStopName);

  for (let c of candidates) {
    if (transitData.normalize(getTag(transitData.osmElements[c.osmRelationId],"from")) === fromStopNorm
      && transitData.normalize(getTag(transitData.osmElements[c.osmRelationId],"to")) === toStopNorm) {
      return c;
    }
  }

  for (let c of candidates) {
    //TODO check if there is only one stop with given name
    const fromPointIndex = c.getNextPointByStopName(fromStopNorm, -1, transitData.getStopById.bind(transitData));
    const toPointIndex = c.getPrevPointByStopName(toStopNorm, -1, transitData.getStopById.bind(transitData));

    if (fromPointIndex >= 0 && toPointIndex >=0 && fromPointIndex < toPointIndex) {
      return c;
    }
  }

  //TODO FIX use osmRelation.tags.from and to
  console.warn(`Cannot find shape for route "${routeId}" from "${fromStopName}" to "${toStopName}".`,
               "Candidates:", candidates.map(c => c.osmRelationId + " - " + c.osmRelationId).join(", "))
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
        const pointIndex = shape.getNextPointByStopName(s.name, lastPoint, transitData.getStopById.bind(transitData));
        if (pointIndex < 0) {
          console.warn(`${route.id} - cannot find point for ${s.name}`);
          return;
        }
        lastPoint = pointIndex;

        s.stop = transitData.getStopById(shape.osmNodeIds[pointIndex]);
        s.stopSequence = pointIndex + 1;
      });


      for (let i = 0; i < stopTimes.length; i++) {
        let [hour, minutes] = stopTimes[i];

        for (let j = 0; j < minutes.length; j++) {
          let minute = minutes[j];

          let arrivalTimeAtFirstStop = hour * 3600 + minute * 60;

          const trip = new Trip({ tripId: transitData.getTripCount() + 1, route: route.id, shape: shape.id });

          for (let k = 0; k < stops.length; k++) {
            let {stop, time, stopSequence} = stops[k];

            let arrivalTime = arrivalTimeAtFirstStop + time;
            let departureTime = arrivalTimeAtFirstStop + time + stopSeconds; // TODO rename to dwelltime

            // if we couldn't find matching stop, just continue
            if (stop) {
              trip.appendStopTime(new StopTime({
                trip: trip.id, arrivalTime, departureTime, stop: stop.id, stopSequence
              }));
            }
          }

          transitData.addTrip(trip);
        }
      }
    });
  });
}


