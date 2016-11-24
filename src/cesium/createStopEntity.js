import Cesium from "cesium"

const STOP_LABEL_PIXEL_OFFSET = new Cesium.Cartesian2(0, -14);
const STOP_LABEL_EYE_OFFSET = new Cesium.Cartesian3(0, 0, -5);

export default function createStopEntity(stop) {

  let canvas = Cesium.writeTextToCanvas(" " + stop.name + " ", {
    // don't use custom font here, it doesn't have to be loaded yet
    font: "32px 'Verdana' ",
    stroke: true,
    strokeWidth: 12,
    fillColor: Cesium.Color.WHITE,
    strokeColor: new Cesium.Color(0.3,0.3,0.3,1),
    backgroundColor: new Cesium.Color(0.3,0.3,0.3,1)
  });

  /*var d = document.createElement("div");

   d.appendChild(canvas);

   document.body.appendChild(d);*/

  return {
    name: stop.name,
    position: stop.pos,
    billboard: {
      scale: 0.4,
      image: canvas,
      pixelOffset : STOP_LABEL_PIXEL_OFFSET,
      eyeOffset: STOP_LABEL_EYE_OFFSET
    },
    point: {
      pixelSize: 3,
      color: Cesium.Color.BLACK,
      outlineColor : Cesium.Color.WHITE,
      outlineWidth : 2,
      scaleByDistance: new Cesium.NearFarScalar(300, 2.0, 12000, 0.5)
    },
    transit: {
      type: "stop",
      stop
    }
  };
}
