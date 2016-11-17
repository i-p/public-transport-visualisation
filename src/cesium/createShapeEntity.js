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
        new Cesium.PolylineGlowMaterialProperty({
          color : Cesium.Color.fromCssColorString(colorsByType[shape.route.getType()]),
          glowPower: 0.5
        })
    },
    shape,
    show: false
  }
}
