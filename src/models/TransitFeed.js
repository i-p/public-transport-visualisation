import _ from "lodash";

const EVENT_START = 0;
const EVENT_END = 1;

export class TransitFeed {
  constructor(normalize) {
    this.routes = {};
    this.trips = {};
    this.stops = {};
    this.stopsByName = {};
    this.shapes = {};
    this.normalize = normalize;

    this.shapesArray = [];

    this.firstArrivalTime = Number.MAX_VALUE;
    this.lastDepartureTime = Number.MIN_VALUE;

    this.osmElements = {};

    this.positions = [];
  }

  getTripById(trip) {
    return this.trips[trip];
  }

  getTripCount() {
    //TODO perf
    return Object.keys(this.trips).length;
  }

  getRouteTrip(route, tripIndex) {
    return this.getTripById(route.trips[tripIndex]);
  }

  getRouteTripWithShape(route, shape) {
    return this.getTripById(this.getRouteById(route).trips.find(id => this.getTripById(id).shape === shape.id));
  }

  getRouteTripsByShape(route) {
    return _.groupBy(route.trips.map(id => this.getTripById(id)), t => t.shape);
  }


  calculateVehiclesInService() {

    const numBuckets = Math.ceil(this.lastDepartureTime / 600);

    let result = {
      bus: Array.from({length: numBuckets}, _ => 0),
      tram: Array.from({length: numBuckets}, _ => 0),
      trolleybus: Array.from({length: numBuckets}, _ => 0),
      max: 0,
      numBuckets
    };

    const toBucketIndex = time => (time / 600) | 0;

    for (let trip of Object.values(this.trips)) {
      const route = this.getRouteById(trip.route);

      for (let i = toBucketIndex(trip.firstArrivalTime); i <= toBucketIndex(trip.lastDepartureTime); i++) {
        result[route.getType()][i]++;
      }
    }

    for (let i=0; i<numBuckets; i++) {
      result.max = Math.max(result.max, result.bus[i] + result.tram[i] + result.trolleybus[i]);
    }

    this.vehiclesInService = result;
  }

  calculateTripIndices() {
    const events = [];
    const unusedIndices = [];
    let indexSize = 0;

    for (let trip of Object.values(this.trips)) {
      events.push({type: EVENT_START, trip, time: trip.firstArrivalTime },
                  {type: EVENT_END,   trip, time: trip.lastDepartureTime });
    }

    events.sort((e1, e2) => e1.time - e2.time);

    events.forEach(e => {
      const trip = e.trip;

      if (e.type === EVENT_START) {
        if (unusedIndices.length > 0) {
          trip.index = unusedIndices.pop();
        } else {
          trip.index = indexSize;
          indexSize++;
        }
      } else {
        unusedIndices.push(trip.index);
      }
    });

    this.indexSize = indexSize;
  }

  removeRoutesWithoutTrips() {
    this.routes = _.pickBy(this.routes, r => r.trips.length > 0);
  }
  removeStopsWithoutRoutes() {
    //TODO FIX
    this.stops = _.pickBy(this.stops, s => s.routes.length > 0);
    //TODO remove from stopsByName
  }

  getStopById(id) {
    return this.stops[id];
  }
  getStopsByName(name) {
    return [...this.stopsByName[name]];
  }
  addStop(stop) {
    this.stops[stop.id] = stop;
    const stops = this.stopsByName[stop.name] || new Set();
    stops.add(stop);

    this.stopsByName[stop.name] = stops;
  }
  addShape(shape) {
    this.shapes[shape.id] = shape;
    this.shapesArray.push(shape);
  }
  getShapeById(id) {
    return this.shapes[id];
  }
  addRoute(route) {
    this.routes[route.id] = route;
  }
  getRouteById(id) {
    return this.routes[id];
  }
  addTrip(trip) {
    if (!trip.id) {
      trip.id = this.getTripCount() + 1;
    }

    this.trips[trip.id] = trip;
    if (trip.route) {
      const route = this.getRouteById(trip.route);
      route.trips.push(trip.id);

      trip.stopTimes.forEach(st => {
        let stop = this.getStopById(st.stop);
        stop.belongsTo(route.id);
      })

      if (route.shapes.indexOf(trip.shape) === -1) {
        route.shapes.push(trip.shape);
      }

      this.firstArrivalTime  = Math.min(this.firstArrivalTime,  trip.firstArrivalTime);
      this.lastDepartureTime = Math.max(this.lastDepartureTime, trip.lastDepartureTime);
    }
  }

  //TODO it is used only for count
  getRouteSetForStop(stop) {
    const routes = new Set();

    for (let t of Object.values(this.trips)) {
      const route = this.getRouteById(t.route);
      for (let st of t.stopTimes) {
        if (st.stop === stop) {
          routes.add(route);
        }
      }
    }

    return routes;
  }
}
