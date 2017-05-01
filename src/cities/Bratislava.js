import OsmLoader from "../loaders/OsmLoader"
import {addTrips} from "../loaders/tripLoader"
import newNormalizer from "./nameNormalizer"
import {TransitFeed} from "../models/TransitFeed";
import _ from "lodash";
import {Stop} from "../models/Stop";
import {Trip} from "../models/Trip";
import {Route} from "../models/Route";
import {StopTime} from "../models/StopTime";
import {Shape} from "../models/Shape";

const normalizer = newNormalizer({
   initialEntries: [
     ["Nár. onkolog. ústav", "Národný onkologický ústav"],
     ["ŽST Dev. Nová Ves", "ŽST Devínska Nová Ves"],
     ["Nemocnica P. Biskupice", "Nemocnica Podunajské Biskupice"],
     ["Letisko", "Letisko (Airport)"],
     ["Trnavská-NAD", "Trnavská, NAD"],
     ["MiÚ Záh. Bystrica", "Miestny úrad Záhorská Bystrica"],
     ["Záhumenice-Drevona", "Záhumenice"]
   ],
   rules: [
     s => s.toLowerCase(),
     s => s.replace(/(^| )(nám)\./g, "$1námestie"),
     s => s.replace(/\S-\S/, match => [...match].join(" "))
   ]
 });

export default function loadCityData(data, routeTimetables) {

  let loader = new OsmLoader(normalizer);

  let routesToSkip = ["901", "525", "131", "141", "203", "801", "525"];

  loader.loadAll([...data.nodes, ...data.ways, ...data.lines], (el) => {

    if (el && el.type == "relation" && el.tags.ref) {
      if (el.tags.operator !== "DPB" || routesToSkip.includes(el.tags.ref)) {
        return false;
      }
    }
    return true;
  });

  let transitData = loader.transitData;

  const STOP_SECONDS = 15;

  addTrips(loader.transitData, routeTimetables, STOP_SECONDS);



  transitData.removeStopsWithoutRoutes();
  transitData.removeRoutesWithoutTrips();

  return [transitData, loader.warnings];
}

export function loadCityData2(serialized) {
  const deserialized = new TransitFeed(normalizer);

  // osmRelationId and shapes are not needed
  _.forEach(serialized.routes, r => deserialized.addRoute(new Route({route_id: r.id, route_type: r.type})));

  // osmNodeId is not needed
  _.forEach(serialized.stops, s => deserialized.addStop(new Stop({stop_id: s.id, stop_name: s.name,pos: new Cesium.Cartesian3(s.pos.x, s.pos.y, s.pos.z), normalizedName: s.normalizedName })))

  _.forEach(serialized.shapes, s => {
    const shape = new Shape({
                              id: s.id,
                              normalize: normalizer,
                              route: s.route,
                              distances: s.distances.map(d => d / 10),
                              positions: s.positions,
                              stopIds: s.stopIds
                            });

    deserialized.addShape(shape)
  });

  deserialized.positions = Cesium.Cartesian3.unpackArray(serialized.positions, []);

  _.forEach(serialized.trips, t => {
    const trip = new Trip({tripId: t.id, route: t.route, shape: t.shape});

    trip.stopTimes = _.zipWith(t.arrivalTimes, t.departureTimes, t.stops, t.stopSequences, (a,d,s,ss) => {
      return new StopTime({trip: trip.id, arrivalTime: a, departureTime: d, stop: s, stopSequence: ss});
    });

    deserialized.addTrip(trip);
  });

  return [deserialized, []];
}

export function serialize(transitData) {
  const serializeTrip = ({id, route, shape, stopTimes}) => {
    return {
      id, route, shape,
      arrivalTimes: stopTimes.map(st => st.arrivalTime),
      departureTimes: stopTimes.map(st => st.departureTime),
      stops: stopTimes.map(st => st.stop),
      stopSequences: stopTimes.map(st => st.stopSequence)
    }
  };

  const serializeRoute = ({id, type, osmRelationId, shapes}) => {
    return {
      id, type, osmRelationId, shapes
    }
  };

  const serializeShape = ({id, osmRelationId, route, distances, stopIds, positions }) => {
    return {
      id, osmRelationId, route, stopIds, positions,
      distances: distances.map(d => (d*10)|0)
    }
  };

  return {
    trips: _.mapValues(transitData.trips, serializeTrip),
    routes: _.mapValues(transitData.routes, serializeRoute),
    shapes: _.mapValues(transitData.shapes, serializeShape),
    stops: _.mapValues(transitData.stops, ({id, name, pos, normalizedName}) => ({id, name, pos, normalizedName})),
    positions: Cesium.Cartesian3.packArray(transitData.positions, [])
  };
}
