import Cesium from "cesium"
import {Stop} from "../models/Stop";
import writeTextToCanvasOptimized from "./writeTextToCanvasOptimized";

const STOP_LABEL_PIXEL_OFFSET = new Cesium.Cartesian2(0, -14);
const STOP_LABEL_EYE_OFFSET = new Cesium.Cartesian3(0, 0, -5);
const STOP_POINT = new Cesium.PointGraphics({
  pixelSize: 3,
  color: Cesium.Color.BLACK,
  outlineColor : Cesium.Color.WHITE,
  outlineWidth : 2,
  scaleByDistance: new Cesium.NearFarScalar(300, 2.0, 12000, 0.5)
});

const cache = {};

export default function createStopEntity(stop, textMeasurementsCache) {

  if (!cache[stop.name]) {
    let canvas = writeTextToCanvasOptimized(stop.name, {
      // don't use custom font here, it doesn't have to be loaded yet
      font: "24px 'Verdana' ",
      stroke: true,
      strokeWidth: 0,
      padding: 6,
      fillColor: Cesium.Color.WHITE,
      backgroundColor: new Cesium.Color(0.3,0.3,0.3,1),
      textMeasurementsCache
    });

    // Ensure that TextureAtlas won't store the same canvas multiple times
    // See Billboard.prototype.image property for details.
    canvas.src = stop.name;

    let bg = new Cesium.BillboardGraphics({
        scale: 0.5,
        image: canvas,
        pixelOffset : new Cesium.ConstantProperty(STOP_LABEL_PIXEL_OFFSET),
        eyeOffset : new Cesium.ConstantProperty(STOP_LABEL_EYE_OFFSET),
      });

    cache[stop.name] = bg;
  }

  let bg = cache[stop.name];

  const entity = new Cesium.Entity();

  entity._name = stop.name;
  entity._position = new Cesium.ConstantProperty(stop.pos);
  entity._billboard = bg;
  entity._point = STOP_POINT;

  assignStopToEntity(entity, stop);

  return entity;
}

function assignStopToEntity(entity, stop) {
  entity.transit = stop;
}

export function isStop(entity) {
  return entity.transit instanceof Stop;
}

export function getStop(entity) {
  if (isStop(entity))
    return entity.transit;
  throw Error(`Entity ${entity.id} doesn't represent a stop.`);
}
