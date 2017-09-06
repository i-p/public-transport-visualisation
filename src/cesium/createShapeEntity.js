import Cesium from "cesium"

// TODO move to options
const colorsByType = {
  "bus": "#0E6BB0",
  "tram": "#C23030",
  "trolleybus": "#007C1E"
};

export default function createShapeEntity(shape, route) {
  return {
    name : shape.id,
    polyline : {
      positions : shape.toPositionArray(),
      width : 3,
      material :
        // For mapbox.streets imagery provider use simple color material
        // for bing terrain use the glow material
        new Cesium.PolylineGlowMaterialProperty({
          color : Cesium.Color.fromCssColorString(colorsByType[route.getType()]),
          glowPower: 0.5
        })
        //Cesium.Color.fromCssColorString(colorsByType[route.getType()])
    },
    shape,
    show: false
  }
}
