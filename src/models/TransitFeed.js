import _ from "lodash";

export class TransitFeed {
  constructor(normalize) {
    this.routes = new Map();
    this.trips = new Map();
    this.stops = new Map();
    this.stopsByName = new Map();
    this.shapes = new Map();
    this.normalize = normalize;

    this.shapesArray = [];

    this.firstArrivalTime = Number.MAX_VALUE;
    this.lastDepartureTime = Number.MIN_VALUE;
  }

  getPointFor(trip, stopTime) {
    //TODO getBySequenceId()
    return this.getShapeById(trip.shape).points[stopTime.stopSequence - 1];
  }

  getRouteTrip(route, tripIndex) {
    return this.trips.get(route.trips[tripIndex]);
  }

  getRouteTripWithShape(route, shape) {
    return this.trips.get(route.trips.find(id => this.trips.get(id).shape === shape.id));
  }

  getRouteTripsByShape(route) {
    return _.groupBy(route.trips.map(id => this.trips.get(id)), t => t.shape);
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

    for (let trip of this.trips.values()) {
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

  removeRoutesWithoutTrips() {
    this.routes = new Map(Array.from(this.routes.entries())
      .filter(([,r]) => r.trips.length > 0))
  }
  removeStopsWithoutRoutes() {
    this.stops = new Map(Array.from(this.stops.entries())
      .filter(([,s]) => s.routes.length > 0));
    //TODO remove from stopsByName
  }

  getStopById(id) {
    return this.stops.get(id);
  }
  getStopsByName(name) {
    return [...this.stopsByName.get(name)];
  }
  addStop(stop) {
    this.stops.set(stop.id, stop);
    const stops = this.stopsByName.get(stop.name) || new Set();
    stops.add(stop);

    this.stopsByName.set(stop.name, stops);
  }
  addShape(shape) {
    this.shapes.set(shape.id, shape);
    this.shapesArray.push(shape);
  }
  getShapeById(id) {
    return this.shapes.get(id);
  }
  addRoute(route) {
    this.routes.set(route.id, route);
  }
  getRouteById(id) {
    return this.routes.get(id);
  }
  addTrip(trip) {
    if (!trip.id) {
      trip.id = this.trips.size + 1;
    }

    this.trips.set(trip.id, trip);
    if (trip.route) {
      const route = this.getRouteById(trip.route);
      route.trips.push(trip.id);

      trip.stopTimes.forEach(st => {
        let stop = this.getStopById(st.stop);
        stop.belongsTo(route.id);
      });

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

    for (let t of this.trips.values()) {
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
