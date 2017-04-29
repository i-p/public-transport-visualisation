import Cesium from "cesium"

// TODO move to options
const colorsByType = {
  "bus": "#0E6BB0",
  "tram": "#C23030",
  "trolleybus": "#007C1E"
};

export default function createShapeEntity(shape) {
  return {
    name : shape.id,
    polyline : {
      positions : shape.toPositionArray(),
      width : 5,
      material :
      //TODO FIX - add route as parameter
        new Cesium.PolylineGlowMaterialProperty({
          color : Cesium.Color.fromCssColorString(colorsByType["bus"]),
          glowPower: 0.5
        })
    },
    shape,
    show: false
  }
}
