export class TransitFeed {
  constructor(normalize) {
    this.routes = new Map();
    this.trips = new Map();
    this.stops = new Map();
    this.stopsByName = new Map();
    this.shapes = new Map();
    this.normalize = normalize;

    this.shapesArray = [];
  }

  removeRoutesWithoutTrips() {
    this.routes = new Map(Array.from(this.routes.entries())
      .filter(([,r]) => r.trips.length > 0))
  }
  removeStopsWithoutRoutes() {
    this.stops = new Map(Array.from(this.stops.entries())
      .filter(([,s]) => s.routes.size > 0));
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
      trip.route.trips.push(trip);

      trip.stopTimes.forEach(st => {
        st.stop.belongsTo(trip.route);
      });

      if (trip.shape && trip.route.shapes.indexOf(trip.shape) === -1) {
        trip.route.shapes.push(trip.shape);
      }
    }


  }

  getRouteSetForStop(stop) {
    const routes = new Set();

    for (let t of this.trips.values()) {
      for (let st of t.stopTimes) {
        if (st.stop === stop) {
          routes.add(st.trip.route);
        }
      }
    }

    return routes;
  }
}
