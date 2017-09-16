jest.mock('cesium/index', ()=> require('../__mocks__/cesium'));

import {getSecondsOfDayToDate} from "../src/utils";
import {loadCityData2} from "../src/cities/Bratislava";
import _ from "lodash";
import options from "../src/options";

const data2 = require("../src/data_processed.json");

const secondsOfDayToDate = getSecondsOfDayToDate(options.start);

const [transitData] = loadCityData2(data2, secondsOfDayToDate);

describe("routes", () => {
  _.forEach(transitData.routes, (r) => {
      test('route ' + r.id, () => {
        //TODO use _.pick
        expect({id: r.id, type: r.type, osmRelationId: r.osmRelationId, shapes: r.shapes, tripCount: r.trips.length }).toMatchSnapshot();
      });
  });
});

describe("shapes", () => {
  _.forEach(transitData.shapes, s => {
    test('shape ' + s.id, () => {
      //TODO use _.pick
      expect({
        id: s.id,
        route: s.route,
        stopIds: s.stopIds.filter(id => id !== 0),
        pointCount: s.stopIds.length,
        totalDistance: s.distances[s.distances.length - 1]
      }).toMatchSnapshot();
    });
  });
});

describe("stops", () => {
  _.forEach(transitData.stops, s => {
    test('stop ' + s.id, () => {
      expect({id: s.id, pos: s.pos, name: s.name, osmNodeId: s.osmNodeId, normalizedName: s.normalizedName }).toMatchSnapshot();
    });
  });

  test('distances are strictly increasing', () => {
    expectEveryValue(transitData.shapes, s => {
      return s.distances.every((d, i, arr) => i === 0 || d > arr[i - 1] );
    });
  });

  test('point arrays have same length', () => {
    expectEveryValue(transitData.shapes, s => {
      return s.distances.length === s.positions.length
        && s.distances.length === s.stopIds.length;
    });
  });
});

function expectEveryValue(object, predicate) {
  expect(
    Object.keys(object)
      .filter(id => !predicate(object[id]))).toEqual([]);
}

